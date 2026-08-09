import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { threadId } from 'node:worker_threads';
import debugFactory from 'debug';
import { globSync } from 'tinyglobby';
import { type AST, parse as parseVue } from 'vue-eslint-parser';

import { walkTsAst } from './ast-walker';
import { extractKeysFromSfcI18nBlock, extractKeysFromVueTemplate } from './vue-template';

const debug = debugFactory('@rotki/eslint-plugin:i18n-key-collector');

interface CacheEntry {
  keys: Set<string>;
  mtimeMs: number;
}

const fileCache = new Map<string, CacheEntry>();
let cachedUsedKeys: { fingerprint: string; keys: Set<string>; srcDir: string } | undefined;

const I18N_CALL_PATTERN = /\bt\s*\(|\bte\s*\(|\btc\s*\(|\$t\s*\(|\$te\s*\(|\$tc\s*\(/;
const VUE_I18N_PATTERN = /\bt\s*\(|\bte\s*\(|\btc\s*\(|\$t\s*\(|\$te\s*\(|\$tc\s*\(|<i18n[\s>-]|v-t\b/;

/**
 * Scanning the source tree costs seconds, and ESLint's multithread linting gives every worker its
 * own module instance — so a process-local cache alone is recomputed once per worker that happens
 * to be handed a locale file. ESLint exposes no way to share state between workers, so the shared
 * layer has to be the filesystem.
 *
 * Disabled by setting `ROTKI_ESLINT_I18N_CACHE=0`, which falls back to the in-memory cache alone.
 */
const DISK_CACHE_ENABLED = process.env.ROTKI_ESLINT_I18N_CACHE !== '0';

function parseSourceFile(content: string, filePath: string): AST.ESLintProgram | undefined {
  const isVue = filePath.endsWith('.vue');
  const source = isVue ? content : `<script lang="ts">\n${content}\n</script>`;

  try {
    return parseVue(source, {
      parser: '@typescript-eslint/parser',
      sourceType: 'module',
    });
  }
  catch (error) {
    debug(`Failed to parse file ${filePath}: ${String(error)}`);
    return undefined;
  }
}

function readFileWithMtime(filePath: string): { content: string; mtimeMs: number } | undefined {
  try {
    const mtimeMs = statSync(filePath).mtimeMs;
    const content = readFileSync(filePath, 'utf-8');
    return { content, mtimeMs };
  }
  catch {
    return undefined;
  }
}

function extractKeysFromAst(ast: AST.ESLintProgram, content: string, isVue: boolean, keys: Set<string>): void {
  if (isVue) {
    if (ast.templateBody)
      extractKeysFromVueTemplate(ast.templateBody, keys);
    extractKeysFromSfcI18nBlock(content, keys);
  }
  if (ast.body) {
    for (const node of ast.body)
      walkTsAst(node, keys);
  }
}

function collectKeysFromFile(filePath: string): Set<string> {
  const file = readFileWithMtime(filePath);
  if (!file)
    return new Set();

  const cached = fileCache.get(filePath);
  if (cached && cached.mtimeMs === file.mtimeMs)
    return cached.keys;

  const keys = new Set<string>();
  const isVue = filePath.endsWith('.vue');
  const pattern = isVue ? VUE_I18N_PATTERN : I18N_CALL_PATTERN;

  if (pattern.test(file.content)) {
    const ast = parseSourceFile(file.content, filePath);
    if (ast)
      extractKeysFromAst(ast, file.content, isVue, keys);
  }

  fileCache.set(filePath, { keys, mtimeMs: file.mtimeMs });
  return keys;
}

/**
 * Identifies one state of the source tree: which files exist, and their size and mtime. Stat-ing
 * every file costs milliseconds against the seconds spent parsing them, which is what makes it
 * affordable to verify the cache on every call rather than trusting it blindly.
 */
function fingerprintOf(files: string[], extensions: string[]): string {
  const hash = createHash('sha1').update(extensions.join(','));

  for (const file of files) {
    try {
      const stats = statSync(file);
      hash.update(`\0${file}\0${stats.size}\0${stats.mtimeMs}`);
    }
    catch {
      hash.update(`\0${file}\0missing`);
    }
  }

  return hash.digest('hex');
}

function diskCachePath(srcDir: string, fingerprint: string): string {
  const key = createHash('sha1').update(`${srcDir}\0${fingerprint}`).digest('hex');
  return join(tmpdir(), 'rotki-eslint-plugin-i18n', `${key}.json`);
}

function readDiskCache(srcDir: string, fingerprint: string): Set<string> | undefined {
  if (!DISK_CACHE_ENABLED)
    return undefined;

  try {
    const raw = readFileSync(diskCachePath(srcDir, fingerprint), 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return undefined;

    const keys = new Set<string>();
    for (const key of parsed) {
      if (typeof key === 'string')
        keys.add(key);
    }
    debug(`Reused ${keys.size} keys from the disk cache for ${srcDir}`);
    return keys;
  }
  catch {
    return undefined;
  }
}

function writeDiskCache(srcDir: string, fingerprint: string, keys: Set<string>): void {
  if (!DISK_CACHE_ENABLED)
    return;

  const target = diskCachePath(srcDir, fingerprint);

  try {
    mkdirSync(join(tmpdir(), 'rotki-eslint-plugin-i18n'), { recursive: true });
    // Two workers can finish the scan at once, so publish by rename: every reader sees either the
    // previous file or a complete new one, never a half-written one.
    const temporary = `${target}.${process.pid}.${threadId}.tmp`;
    writeFileSync(temporary, JSON.stringify([...keys]), 'utf-8');
    renameSync(temporary, target);
  }
  catch (error) {
    debug(`Failed to write the disk cache for ${srcDir}: ${String(error)}`);
  }
}

export function collectAllUsedKeys(srcDir: string, extensions: string[]): Set<string> {
  const resolvedSrc = resolve(srcDir);
  const patterns = extensions.map(ext => `**/*${ext}`);
  const files = globSync(patterns, { absolute: true, cwd: resolvedSrc }).sort();
  const fingerprint = fingerprintOf(files, extensions);

  if (cachedUsedKeys && cachedUsedKeys.srcDir === resolvedSrc && cachedUsedKeys.fingerprint === fingerprint) {
    return cachedUsedKeys.keys;
  }

  const fromDisk = readDiskCache(resolvedSrc, fingerprint);
  if (fromDisk) {
    cachedUsedKeys = { fingerprint, keys: fromDisk, srcDir: resolvedSrc };
    return fromDisk;
  }

  debug(`Found ${files.length} source files in ${resolvedSrc}`);

  const allKeys = new Set<string>();

  for (const file of files) {
    const keys = collectKeysFromFile(file);
    for (const key of keys) {
      allKeys.add(key);
    }
  }

  writeDiskCache(resolvedSrc, fingerprint, allKeys);
  cachedUsedKeys = { fingerprint, keys: allKeys, srcDir: resolvedSrc };
  return allKeys;
}

export function resetCache(): void {
  fileCache.clear();
  cachedUsedKeys = undefined;
}

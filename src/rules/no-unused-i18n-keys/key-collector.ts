import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { threadId } from 'node:worker_threads';
import { parse as parseTs } from '@typescript-eslint/parser';
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

/**
 * The shape both parsers share, and all this module reads: statements to walk, plus the SFC
 * template when there is one. Structural rather than either parser's `Program` type, so neither
 * return value needs an assertion to fit.
 */
interface ParsedProgram {
  body?: unknown;
  templateBody?: AST.ESLintProgram['templateBody'];
}

function parseSourceFile(content: string, filePath: string): ParsedProgram | undefined {
  const isVue = filePath.endsWith('.vue');

  try {
    if (!isVue) {
      // Only `walkTsAst` reads this AST, and it looks at node types and child links alone, so the
      // script goes straight to the TypeScript parser rather than being wrapped in a synthetic
      // `<script>` block for `vue-eslint-parser`. That skips the SFC machinery, and `parse` skips
      // the scope analysis `parseForESLint` would build. Positions stay off for the same reason:
      // nothing here reports on a location.
      return parseTs(content, {
        comment: false,
        loc: false,
        range: false,
        sourceType: 'module',
        tokens: false,
      });
    }

    return parseVue(content, {
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

function extractKeysFromAst(ast: ParsedProgram, content: string, isVue: boolean, keys: Set<string>): void {
  if (isVue) {
    if (ast.templateBody)
      extractKeysFromVueTemplate(ast.templateBody, keys);
    extractKeysFromSfcI18nBlock(content, keys);
  }
  if (Array.isArray(ast.body)) {
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

function cacheDir(): string {
  return join(tmpdir(), 'rotki-eslint-plugin-i18n');
}

function diskCachePath(srcDir: string, fingerprint: string): string {
  const key = createHash('sha1').update(`${srcDir}\0${fingerprint}`).digest('hex');
  return join(cacheDir(), `${key}.json`);
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
    mkdirSync(cacheDir(), { recursive: true });
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

/**
 * A scan takes seconds, and every worker starts at once, so without coordination they all miss the
 * cache together and all scan. One wins the right to scan; the rest block until it publishes.
 *
 * `mkdir` is the lock because it is atomic on every filesystem, including network ones — the same
 * reason `proper-lockfile` uses it. That library is not used here because its waiting is
 * promise-based, and an ESLint rule runs synchronously: there is nowhere to await.
 */
const LOCK_STALE_MS = 30_000;
const LOCK_WAIT_MS = 60_000;
const LOCK_POLL_MS = 25;

/** Blocks this thread. `Atomics.wait` on a buffer nobody notifies is a sleep with no busy loop. */
function sleepSync(milliseconds: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function lockPath(srcDir: string, fingerprint: string): string {
  return `${diskCachePath(srcDir, fingerprint)}.lock`;
}

function acquireScanLock(path: string): boolean {
  try {
    // The parent has to exist first, and must be created with `recursive` so an existing one is not
    // an error. The lock itself is then a plain `mkdir`, which fails when it already exists — that
    // failure is the whole mechanism.
    mkdirSync(cacheDir(), { recursive: true });
    mkdirSync(path, { recursive: false });
    return true;
  }
  catch {
    // Held by someone else, or left behind by a process that died mid-scan. Age tells them apart.
    try {
      if (Date.now() - statSync(path).mtimeMs > LOCK_STALE_MS) {
        rmSync(path, { force: true, recursive: true });
        mkdirSync(path, { recursive: false });
        return true;
      }
    }
    catch {
      // Lost the race to clear it; treat as held.
    }
    return false;
  }
}

function releaseScanLock(path: string): void {
  try {
    rmSync(path, { force: true, recursive: true });
  }
  catch {
    // A stale-lock sweep may have removed it already; the cache is published either way.
  }
}

/** Waits for whoever holds the lock to publish. Returns undefined if they never do. */
function awaitPublishedScan(srcDir: string, fingerprint: string, path: string): Set<string> | undefined {
  const deadline = Date.now() + LOCK_WAIT_MS;

  while (Date.now() < deadline) {
    sleepSync(LOCK_POLL_MS);

    const published = readDiskCache(srcDir, fingerprint);
    if (published)
      return published;

    // The holder died without publishing, so stop waiting on it and scan instead.
    try {
      statSync(path);
    }
    catch {
      return undefined;
    }
  }

  debug(`Timed out waiting for another worker to scan ${srcDir}`);
  return undefined;
}

/** Reads every file, publishes the result, and releases the lock when this call holds it. */
function scanTree(files: string[], srcDir: string, fingerprint: string, heldLock: string | undefined): Set<string> {
  debug(`Found ${files.length} source files in ${srcDir}`);
  const allKeys = new Set<string>();

  try {
    for (const file of files) {
      for (const key of collectKeysFromFile(file)) {
        allKeys.add(key);
      }
    }

    writeDiskCache(srcDir, fingerprint, allKeys);
  }
  finally {
    if (heldLock)
      releaseScanLock(heldLock);
  }

  return allKeys;
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

  const lock = lockPath(resolvedSrc, fingerprint);
  const holdsLock = DISK_CACHE_ENABLED && acquireScanLock(lock);

  if (DISK_CACHE_ENABLED && !holdsLock) {
    const published = awaitPublishedScan(resolvedSrc, fingerprint, lock);
    if (published) {
      cachedUsedKeys = { fingerprint, keys: published, srcDir: resolvedSrc };
      return published;
    }
    // Falling through means scanning anyway: slower than waiting, but never wrong.
  }

  const allKeys = scanTree(files, resolvedSrc, fingerprint, holdsLock ? lock : undefined);
  cachedUsedKeys = { fingerprint, keys: allKeys, srcDir: resolvedSrc };
  return allKeys;
}

export function resetCache(): void {
  fileCache.clear();
  cachedUsedKeys = undefined;
}

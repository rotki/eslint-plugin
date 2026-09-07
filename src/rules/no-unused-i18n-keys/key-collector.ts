import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseTs } from '@typescript-eslint/parser';
import debugFactory from 'debug';
import { globSync } from 'tinyglobby';
import { type AST, parse as parseVue } from 'vue-eslint-parser';

import { walkTsAst } from './ast-walker';
import {
  acquireScanLock,
  awaitPublishedScan,
  DISK_CACHE_ENABLED,
  type DiskCache,
  diskCachePath,
  keysOf,
  lockPath,
  readDiskCache,
  releaseScanLock,
  writeDiskCache,
} from './key-cache';
import { extractKeysFromSfcI18nBlock, extractKeysFromVueTemplate } from './vue-template';

const debug = debugFactory('@rotki/eslint-plugin:i18n-key-collector');

interface CacheEntry {
  keys: Set<string>;
  mtimeMs: number;
}

const fileCache = new Map<string, CacheEntry>();
let cachedUsedKeys: { extensions: string; fingerprint: string; keys: Set<string>; srcDir: string; verifiedAt: number } | undefined;

/**
 * How long a verified result is reused without re-reading the tree.
 *
 * One lint run asks once per locale file — seven times here — and hashing the tree for each costs
 * ~20ms that cannot discover anything, since the run is reading a snapshot of the tree anyway.
 * The window is what a long-lived process (an IDE language server) can lag behind an edit by, so it
 * is kept to a second: long enough to cover a run, short enough that nobody notices.
 */
const VERIFY_TTL_MS = 1000;

const I18N_CALL_PATTERN = /\bt\s*\(|\bte\s*\(|\btc\s*\(|\$t\s*\(|\$te\s*\(|\$tc\s*\(/;
const VUE_I18N_PATTERN = /\bt\s*\(|\bte\s*\(|\btc\s*\(|\$t\s*\(|\$te\s*\(|\$tc\s*\(|<i18n[\s>-]|v-t\b/;

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
  if (cached?.mtimeMs === file.mtimeMs)
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

interface FileDigest {
  digest: string;
  path: string;
}

/**
 * Hashes every candidate's contents. The result serves both purposes: hashed together it identifies
 * one state of the whole tree, and per file it says whether that file's cached keys are still good.
 *
 * Contents rather than mtime and size, because the cost of being wrong here is a deleted
 * translation — see {@link DiskCache}. The read is discarded immediately; the few files that turn
 * out to need parsing are read again, which is cheaper than holding the whole tree in memory.
 */
function digestFiles(files: string[]): FileDigest[] {
  const digests: FileDigest[] = [];

  for (const path of files) {
    try {
      digests.push({ digest: createHash('sha1').update(readFileSync(path)).digest('hex'), path });
    }
    catch {
      // Vanished between the glob and the read; treated as absent, and its keys go with it.
    }
  }

  return digests;
}

function fingerprintOf(digests: FileDigest[], extensions: string[]): string {
  const hash = createHash('sha1').update(extensions.join(','));

  for (const file of digests) {
    hash.update(`\0${file.path}\0${file.digest}`);
  }

  return hash.digest('hex');
}

/**
 * Rebuilds the cache from the tree as it is now, parsing only what the previous cache cannot
 * account for, then publishes it and releases the lock when this call holds one.
 *
 * The entry map is rebuilt rather than patched, so a file that no longer exists takes its keys with
 * it. Keeping stale entries would be the dangerous direction: a key whose only user was deleted
 * would still read as used, and the unused key it now is would go unreported.
 */
function scanTree(files: FileDigest[], previous: DiskCache | undefined, cachePath: string | undefined, fingerprint: string, heldLock: string | undefined): Set<string> {
  const entries: DiskCache['entries'] = {};
  const allKeys = new Set<string>();
  let parsed = 0;

  try {
    for (const file of files) {
      const cached = previous?.entries[file.path];
      const keys = cached?.digest === file.digest
        ? cached.keys
        : (parsed++, [...collectKeysFromFile(file.path)]);

      entries[file.path] = { digest: file.digest, keys };
      for (const key of keys)
        allKeys.add(key);
    }

    debug(`Parsed ${parsed} of ${files.length} source files`);
    if (cachePath)
      writeDiskCache(cachePath, { entries, fingerprint });
  }
  finally {
    if (heldLock)
      releaseScanLock(heldLock);
  }

  return allKeys;
}

/** The cache answers directly only when it was written for exactly this tree state. */
function keysIfCurrent(cache: DiskCache | undefined, fingerprint: string, srcDir: string): Set<string> | undefined {
  if (cache?.fingerprint !== fingerprint)
    return undefined;

  debug(`Reused ${Object.keys(cache.entries).length} cached files for ${srcDir}`);
  return keysOf(cache);
}

function awaitAnotherWorker(useDisk: boolean, holdsLock: boolean, cachePath: string, fingerprint: string, lock: string): Set<string> | undefined {
  if (holdsLock || !useDisk)
    return undefined;

  return awaitPublishedScan(cachePath, fingerprint, lock);
}

/**
 * The result of a verification recent enough to reuse without re-reading the tree.
 *
 * `extensions` is compared explicitly because this runs before any fingerprint exists to fold it
 * into.
 */
function recentlyVerified(srcDir: string, extensionsKey: string): Set<string> | undefined {
  if (cachedUsedKeys?.srcDir !== srcDir || cachedUsedKeys.extensions !== extensionsKey)
    return undefined;

  return Date.now() - cachedUsedKeys.verifiedAt < VERIFY_TTL_MS ? cachedUsedKeys.keys : undefined;
}

/** Everything the disk layer does, kept apart from the in-memory path that always applies. */
function collectViaDisk(files: FileDigest[], srcDir: string, extensions: string[], fingerprint: string): Set<string> {
  const cachePath = diskCachePath(srcDir, extensions);
  const previous = readDiskCache(cachePath);

  const current = keysIfCurrent(previous, fingerprint, srcDir);
  if (current)
    return current;

  const lock = lockPath(cachePath);
  const holdsLock = acquireScanLock(lock);

  // Falling through when this returns nothing means scanning anyway: slower than waiting, never wrong.
  const published = awaitAnotherWorker(true, holdsLock, cachePath, fingerprint, lock);
  if (published)
    return published;

  // Re-read under the lock: the holder we waited behind may have published a newer cache than the
  // one read above, which turns a full parse into a stat-match.
  const base = holdsLock ? readDiskCache(cachePath) ?? previous : previous;
  return scanTree(files, base, cachePath, fingerprint, holdsLock ? lock : undefined);
}

export function collectAllUsedKeys(srcDir: string, extensions: string[], cache = true): Set<string> {
  const resolvedSrc = resolve(srcDir);
  const extensionsKey = extensions.join(',');

  const recent = recentlyVerified(resolvedSrc, extensionsKey);
  if (recent)
    return recent;

  const patterns = extensions.map(ext => `**/*${ext}`);
  const files = digestFiles(globSync(patterns, { absolute: true, cwd: resolvedSrc }).sort());
  const fingerprint = fingerprintOf(files, extensions);

  if (cachedUsedKeys?.srcDir === resolvedSrc && cachedUsedKeys.fingerprint === fingerprint) {
    cachedUsedKeys.verifiedAt = Date.now();
    return cachedUsedKeys.keys;
  }

  // Either switch turns the disk off. The option is how a project opts out; the environment
  // variable is how one run opts out without touching the config.
  const keys = cache && DISK_CACHE_ENABLED
    ? collectViaDisk(files, resolvedSrc, extensions, fingerprint)
    : scanTree(files, undefined, undefined, fingerprint, undefined);

  cachedUsedKeys = { extensions: extensionsKey, fingerprint, keys, srcDir: resolvedSrc, verifiedAt: Date.now() };
  return keys;
}

export function resetCache(): void {
  fileCache.clear();
  cachedUsedKeys = undefined;
}

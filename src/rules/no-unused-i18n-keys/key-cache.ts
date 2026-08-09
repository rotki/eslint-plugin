import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { threadId } from 'node:worker_threads';
import debugFactory from 'debug';

const debug = debugFactory('@rotki/eslint-plugin:i18n-key-cache');

/**
 * Scanning the source tree costs seconds, and ESLint's multithread linting gives every worker its
 * own module instance — so a process-local cache alone is recomputed once per worker that happens
 * to be handed a locale file. ESLint exposes no way to share state between workers, so the shared
 * layer has to be the filesystem.
 *
 * Disabled by setting `ROTKI_ESLINT_I18N_CACHE=0`, which falls back to the in-memory cache alone.
 */
export const DISK_CACHE_ENABLED = process.env.ROTKI_ESLINT_I18N_CACHE !== '0';

/**
 * One entry per source file, so an edit to a single file re-parses that file rather than the tree.
 * `fingerprint` records the tree state the entries were written for: when it still matches, the
 * keys can be unioned without comparing anything per file.
 *
 * Entries are keyed by a hash of the file's contents rather than its mtime and size. This rule's
 * autofix deletes keys, so the cost of believing a stale cache is a deleted translation: an edit
 * that added `t('new.key')` while leaving mtime and size unchanged would leave that key reading as
 * unused, and the fix would remove it. Hashing every candidate costs ~20ms against ~7ms for
 * stat-ing them, which is not a price worth paying that risk to avoid.
 */
export interface DiskCache {
  entries: Record<string, { digest: string; keys: string[] }>;
  fingerprint: string;
}

function cacheDir(): string {
  return join(tmpdir(), 'rotki-eslint-plugin-i18n');
}

/** Keyed by the tree, not by its state — the same file is rewritten as the tree changes. */
export function diskCachePath(srcDir: string, extensions: string[]): string {
  const key = createHash('sha1').update(`${srcDir}\0${extensions.join(',')}`).digest('hex');
  return join(cacheDir(), `${key}.json`);
}

function isDiskCache(value: unknown): value is DiskCache {
  return !!value && typeof value === 'object'
    && 'fingerprint' in value && typeof value.fingerprint === 'string'
    && 'entries' in value && !!value.entries && typeof value.entries === 'object';
}

export function readDiskCache(path: string): DiskCache | undefined {
  if (!DISK_CACHE_ENABLED)
    return undefined;

  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf-8'));
    return isDiskCache(parsed) ? parsed : undefined;
  }
  catch {
    return undefined;
  }
}

export function writeDiskCache(target: string, cache: DiskCache): void {
  if (!DISK_CACHE_ENABLED)
    return;

  try {
    mkdirSync(cacheDir(), { recursive: true });
    // Two workers can finish the scan at once, so publish by rename: every reader sees either the
    // previous file or a complete new one, never a half-written one.
    const temporary = `${target}.${process.pid}.${threadId}.tmp`;
    writeFileSync(temporary, JSON.stringify(cache), 'utf-8');
    renameSync(temporary, target);
  }
  catch (error) {
    debug(`Failed to write the disk cache to ${target}: ${String(error)}`);
  }
}

export function keysOf(cache: DiskCache): Set<string> {
  const keys = new Set<string>();

  for (const entry of Object.values(cache.entries)) {
    for (const key of entry.keys)
      keys.add(key);
  }

  return keys;
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

export function lockPath(cachePath: string): string {
  return `${cachePath}.lock`;
}

export function acquireScanLock(path: string): boolean {
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

export function releaseScanLock(path: string): void {
  try {
    rmSync(path, { force: true, recursive: true });
  }
  catch {
    // A stale-lock sweep may have removed it already; the cache is published either way.
  }
}

/**
 * Waits for whoever holds the lock to publish, and returns undefined if they never do.
 *
 * The cache file survives between runs, so its existence proves nothing. What identifies a fresh
 * publish is the fingerprint stored inside it matching the tree as it is now.
 */
export function awaitPublishedScan(cachePath: string, fingerprint: string, lock: string): Set<string> | undefined {
  const deadline = Date.now() + LOCK_WAIT_MS;

  while (Date.now() < deadline) {
    sleepSync(LOCK_POLL_MS);

    const published = readDiskCache(cachePath);
    if (published?.fingerprint === fingerprint) {
      debug(`Reused ${Object.keys(published.entries).length} cached files published by another worker`);
      return keysOf(published);
    }

    // The holder died without publishing, so stop waiting on it and scan instead.
    try {
      statSync(lock);
    }
    catch {
      return undefined;
    }
  }

  debug(`Timed out waiting for another worker to scan ${cachePath}`);
  return undefined;
}

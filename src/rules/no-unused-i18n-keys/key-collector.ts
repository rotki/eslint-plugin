import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
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
let cachedUsedKeys: { extensions: string[]; keys: Set<string>; srcDir: string } | undefined;

const I18N_CALL_PATTERN = /\bt\s*\(|\bte\s*\(|\btc\s*\(|\$t\s*\(|\$te\s*\(|\$tc\s*\(/;
const VUE_I18N_PATTERN = /\bt\s*\(|\bte\s*\(|\btc\s*\(|\$t\s*\(|\$te\s*\(|\$tc\s*\(|<i18n[\s>-]|v-t\b/;

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

export function collectAllUsedKeys(srcDir: string, extensions: string[]): Set<string> {
  const resolvedSrc = resolve(srcDir);

  if (
    cachedUsedKeys
    && cachedUsedKeys.srcDir === resolvedSrc
    && cachedUsedKeys.extensions.join(',') === extensions.join(',')
  ) {
    return cachedUsedKeys.keys;
  }

  const patterns = extensions.map(ext => `**/*${ext}`);
  const files = globSync(patterns, { absolute: true, cwd: resolvedSrc });

  debug(`Found ${files.length} source files in ${resolvedSrc}`);

  const allKeys = new Set<string>();

  for (const file of files) {
    const keys = collectKeysFromFile(file);
    for (const key of keys) {
      allKeys.add(key);
    }
  }

  cachedUsedKeys = { extensions, keys: allKeys, srcDir: resolvedSrc };
  return allKeys;
}

export function resetCache(): void {
  fileCache.clear();
  cachedUsedKeys = undefined;
}

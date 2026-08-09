import type { AST as JsonAST } from 'jsonc-eslint-parser';
import type { AST as YamlAST } from 'yaml-eslint-parser';

import debugFactory from 'debug';

import { createEslintRule, getFilename, getSourceCode } from '../../utils';
import { collectAllUsedKeys } from './key-collector';
import { extractLinkedKeys, isKeyUsed, prepareUsedKeys } from './key-matching';

export const RULE_NAME = 'no-unused-i18n-keys';

export type MessageIds = 'unused';

export type Options = [{
  cache: boolean;
  extensions: string[];
  ignoreKeys: string[];
  src: string;
}];

const debug = debugFactory('@rotki/eslint-plugin:no-unused-i18n-keys');

function isLocaleFile(filename: string): boolean {
  return /(?:locales?|i18n|translations?|messages?|lang)\b/i.test(filename);
}

function isProgramWithBody(ast: unknown): ast is { type: 'Program'; body: unknown[] } {
  return !!ast && typeof ast === 'object' && 'type' in ast && ast.type === 'Program'
    && 'body' in ast && Array.isArray(ast.body) && ast.body.length > 0;
}

function getProgramFirstBodyType(ast: unknown): string | undefined {
  if (!isProgramWithBody(ast))
    return undefined;
  const first: unknown = ast.body[0];
  if (!first || typeof first !== 'object' || !('type' in first) || typeof first.type !== 'string')
    return undefined;
  return first.type;
}

function isJsonProgram(ast: unknown): ast is JsonAST.JSONProgram {
  return getProgramFirstBodyType(ast) === 'JSONExpressionStatement';
}

function isYamlProgram(ast: unknown): ast is YamlAST.YAMLProgram {
  return getProgramFirstBodyType(ast) === 'YAMLDocument';
}

/**
 * Walks the locale object once, collecting both things it holds: the path of every leaf, and the
 * keys other messages link to. They were two traversals of the same tree, and the tree is the
 * largest thing this rule touches — `en.json` alone is several thousand keys.
 */
function readJsonLocale(
  node: JsonAST.JSONObjectExpression,
  prefix: string,
  paths: Array<{ key: string; node: JsonAST.JSONProperty }>,
  linkedKeys: Set<string>,
): void {
  for (const prop of node.properties) {
    const keyName = prop.key.type === 'JSONLiteral' ? String(prop.key.value) : (prop.key).name;
    const fullKey = prefix ? `${prefix}.${keyName}` : keyName;

    if (prop.value.type === 'JSONObjectExpression') {
      readJsonLocale(prop.value, fullKey, paths, linkedKeys);
      continue;
    }

    paths.push({ key: fullKey, node: prop });

    if (prop.value.type === 'JSONLiteral' && typeof prop.value.value === 'string') {
      for (const key of extractLinkedKeys(prop.value.value)) {
        linkedKeys.add(key);
      }
    }
  }
}

function getYamlScalarValue(node: YamlAST.YAMLContent | YamlAST.YAMLWithMeta | null): string | undefined {
  if (!node)
    return undefined;
  if (node.type === 'YAMLWithMeta')
    return getYamlScalarValue(node.value);
  if (node.type === 'YAMLScalar' && typeof node.value === 'string')
    return node.value;
  return undefined;
}

function getYamlKeyName(node: YamlAST.YAMLContent | YamlAST.YAMLWithMeta | null): string | undefined {
  if (!node)
    return undefined;
  if (node.type === 'YAMLWithMeta')
    return getYamlKeyName(node.value);
  if (node.type === 'YAMLScalar')
    return String(node.value);
  return undefined;
}

function getYamlMapping(node: YamlAST.YAMLContent | YamlAST.YAMLWithMeta | null): YamlAST.YAMLMapping | null {
  if (!node)
    return null;
  if (node.type === 'YAMLMapping')
    return node;
  if (node.type === 'YAMLWithMeta' && node.value?.type === 'YAMLMapping')
    return node.value;
  return null;
}

/** Extends a key path, staying nameless once any segment above it could not be read. */
function joinKey(prefix: string | undefined, keyName: string | undefined): string | undefined {
  if (prefix === undefined || keyName === undefined)
    return undefined;
  return prefix ? `${prefix}.${keyName}` : keyName;
}

/**
 * The YAML counterpart of {@link readJsonLocale}.
 *
 * `prefix` is `undefined` inside a subtree whose key could not be read. That case is why the two
 * walks this replaces were not identical: the path walk skipped such a pair outright, while the
 * linked-key walk still descended into it. Collapsing them naively would silently stop resolving
 * links under an unreadable key, so the distinction is carried explicitly instead — no path is
 * produced without a name, and links are collected either way.
 */
function readYamlLocale(
  node: YamlAST.YAMLMapping,
  prefix: string | undefined,
  paths: Array<{ key: string; node: YamlAST.YAMLPair }>,
  linkedKeys: Set<string>,
): void {
  for (const pair of node.pairs) {
    const fullKey = joinKey(prefix, getYamlKeyName(pair.key));
    const mapping = getYamlMapping(pair.value);
    if (mapping) {
      readYamlLocale(mapping, fullKey, paths, linkedKeys);
      continue;
    }

    if (fullKey !== undefined)
      paths.push({ key: fullKey, node: pair });

    const value = getYamlScalarValue(pair.value);
    if (value) {
      for (const key of extractLinkedKeys(value)) {
        linkedKeys.add(key);
      }
    }
  }
}

function removeJsonProperty(prop: JsonAST.JSONProperty): { end: number; start: number } {
  const parent = prop.parent;
  const index = parent.properties.indexOf(prop);
  const isLast = index === parent.properties.length - 1;
  const isOnly = parent.properties.length === 1;

  let start = prop.range[0];
  let end = prop.range[1];

  if (isOnly) {
    return { end, start };
  }

  if (isLast) {
    const prev = parent.properties[index - 1];
    start = prev.range[1];
  }
  else {
    end = parent.properties[index + 1].range[0];
  }

  return { end, start };
}

function removeYamlPair(pair: YamlAST.YAMLPair): { end: number; start: number } {
  const parent = pair.parent;
  const index = parent.pairs.indexOf(pair);
  const isLast = index === parent.pairs.length - 1;
  const isOnly = parent.pairs.length === 1;

  let start = pair.range[0];
  let end = pair.range[1];

  if (isOnly) {
    return { end, start };
  }

  if (isLast) {
    const prev = parent.pairs[index - 1];
    start = prev.range[1];
  }
  else {
    end = parent.pairs[index + 1].range[0];
  }

  return { end, start };
}

export default createEslintRule<Options, MessageIds>({
  create(context, optionsWithDefault) {
    const options = optionsWithDefault[0];
    const filename = getFilename(context);

    if (!isLocaleFile(filename)) {
      return {};
    }

    const sourceCode = getSourceCode(context);
    const ast: unknown = sourceCode.ast;

    if (isJsonProgram(ast)) {
      debug(`Processing JSON locale file: ${filename}`);

      const rootExpr = ast.body[0].expression;
      if (rootExpr.type !== 'JSONObjectExpression')
        return {};

      const usedKeys = collectAllUsedKeys(options.src, options.extensions, options.cache);
      const linkedKeys = new Set<string>();
      const paths: Array<{ key: string; node: JsonAST.JSONProperty }> = [];
      readJsonLocale(rootExpr, '', paths, linkedKeys);

      const allUsedKeys = new Set([...usedKeys, ...linkedKeys]);
      const prepared = prepareUsedKeys(allUsedKeys, options.ignoreKeys);

      return {
        'Program:exit': function () {
          for (const { key, node } of paths) {
            if (!isKeyUsed(key, prepared)) {
              const loc = node.loc;
              context.report({
                data: { key },
                fix(fixer) {
                  const { end, start } = removeJsonProperty(node);
                  return fixer.removeRange([start, end]);
                },
                loc,
                messageId: 'unused',
              });
            }
          }
        },
      };
    }

    if (isYamlProgram(ast)) {
      debug(`Processing YAML locale file: ${filename}`);

      const doc = ast.body[0];
      const content = doc.content;
      const mapping = getYamlMapping(content);
      if (!mapping)
        return {};

      const usedKeys = collectAllUsedKeys(options.src, options.extensions, options.cache);
      const linkedKeys = new Set<string>();
      const paths: Array<{ key: string; node: YamlAST.YAMLPair }> = [];
      readYamlLocale(mapping, '', paths, linkedKeys);

      const allUsedKeys = new Set([...usedKeys, ...linkedKeys]);
      const prepared = prepareUsedKeys(allUsedKeys, options.ignoreKeys);

      return {
        'Program:exit': function () {
          for (const { key, node } of paths) {
            if (!isKeyUsed(key, prepared)) {
              const loc = node.loc;
              context.report({
                data: { key },
                fix(fixer) {
                  const { end, start } = removeYamlPair(node);
                  return fixer.removeRange([start, end]);
                },
                loc,
                messageId: 'unused',
              });
            }
          }
        },
      };
    }

    return {};
  },
  defaultOptions: [{
    cache: true,
    extensions: ['.vue', '.ts'],
    ignoreKeys: [],
    src: 'src',
  }],
  meta: {
    docs: {
      description: 'disallow unused i18n keys in locale files',
      recommendation: 'recommended',
    },
    fixable: 'code',
    messages: {
      unused: `The i18n key '{{ key }}' is unused`,
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          cache: {
            description: 'Reuse the scan of the source tree between runs and across ESLint worker threads, via a cache under the system temp directory. Set false to scan every time.',
            type: 'boolean',
          },
          extensions: {
            items: { type: 'string' },
            type: 'array',
          },
          ignoreKeys: {
            items: { type: 'string' },
            type: 'array',
          },
          src: {
            type: 'string',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

import type { AST as JsonAST } from 'jsonc-eslint-parser';
import type { AST as YamlAST } from 'yaml-eslint-parser';

import debugFactory from 'debug';

import { createEslintRule, getFilename, getSourceCode } from '../../utils';
import { collectAllUsedKeys } from './key-collector';
import { extractLinkedKeys, isKeyUsed, prepareUsedKeys } from './key-matching';

export const RULE_NAME = 'no-unused-i18n-keys';

export type MessageIds = 'unused';

export type Options = [{
  extensions: string[];
  ignoreKeys: string[];
  src: string;
}];

const debug = debugFactory('@rotki/eslint-plugin:no-unused-i18n-keys');

function isLocaleFile(filename: string): boolean {
  return /(?:locales?|i18n|translations?|messages?|lang)\b/i.test(filename);
}

function isJsonProgram(ast: unknown): ast is JsonAST.JSONProgram {
  if (!ast || typeof ast !== 'object' || !('type' in ast) || ast.type !== 'Program')
    return false;
  if (!('body' in ast) || !Array.isArray(ast.body) || ast.body.length === 0)
    return false;
  const first: unknown = ast.body[0];
  return first !== null && typeof first === 'object' && 'type' in first && first.type === 'JSONExpressionStatement';
}

function isYamlProgram(ast: unknown): ast is YamlAST.YAMLProgram {
  if (!ast || typeof ast !== 'object' || !('type' in ast) || ast.type !== 'Program')
    return false;
  if (!('body' in ast) || !Array.isArray(ast.body) || ast.body.length === 0)
    return false;
  const first: unknown = ast.body[0];
  return first !== null && typeof first === 'object' && 'type' in first && first.type === 'YAMLDocument';
}

function buildJsonKeyPaths(node: JsonAST.JSONObjectExpression, prefix: string, paths: Array<{ key: string; node: JsonAST.JSONProperty }>): void {
  for (const prop of node.properties) {
    const keyName = prop.key.type === 'JSONLiteral' ? String(prop.key.value) : (prop.key).name;
    const fullKey = prefix ? `${prefix}.${keyName}` : keyName;

    if (prop.value.type === 'JSONObjectExpression') {
      buildJsonKeyPaths(prop.value, fullKey, paths);
    }
    else {
      paths.push({ key: fullKey, node: prop });
    }
  }
}

function collectJsonLinkedKeys(node: JsonAST.JSONObjectExpression, linkedKeys: Set<string>): void {
  for (const prop of node.properties) {
    if (prop.value.type === 'JSONLiteral' && typeof prop.value.value === 'string') {
      for (const key of extractLinkedKeys(prop.value.value)) {
        linkedKeys.add(key);
      }
    }
    else if (prop.value.type === 'JSONObjectExpression') {
      collectJsonLinkedKeys(prop.value, linkedKeys);
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

function isYamlMapping(node: YamlAST.YAMLContent | YamlAST.YAMLWithMeta | null): node is YamlAST.YAMLMapping | YamlAST.YAMLWithMeta {
  if (!node)
    return false;
  if (node.type === 'YAMLMapping')
    return true;
  if (node.type === 'YAMLWithMeta' && node.value?.type === 'YAMLMapping')
    return true;
  return false;
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

function buildYamlKeyPaths(node: YamlAST.YAMLMapping, prefix: string, paths: Array<{ key: string; node: YamlAST.YAMLPair }>): void {
  for (const pair of node.pairs) {
    const keyName = getYamlKeyName(pair.key);
    if (keyName === undefined)
      continue;

    const fullKey = prefix ? `${prefix}.${keyName}` : keyName;

    if (isYamlMapping(pair.value)) {
      const mapping = getYamlMapping(pair.value);
      if (mapping) {
        buildYamlKeyPaths(mapping, fullKey, paths);
      }
    }
    else {
      paths.push({ key: fullKey, node: pair });
    }
  }
}

function collectYamlLinkedKeys(node: YamlAST.YAMLMapping, linkedKeys: Set<string>): void {
  for (const pair of node.pairs) {
    const value = getYamlScalarValue(pair.value);
    if (value) {
      for (const key of extractLinkedKeys(value)) {
        linkedKeys.add(key);
      }
    }
    else {
      const mapping = getYamlMapping(pair.value);
      if (mapping) {
        collectYamlLinkedKeys(mapping, linkedKeys);
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

      const usedKeys = collectAllUsedKeys(options.src, options.extensions);
      const linkedKeys = new Set<string>();
      collectJsonLinkedKeys(rootExpr, linkedKeys);

      const allUsedKeys = new Set([...usedKeys, ...linkedKeys]);
      const prepared = prepareUsedKeys(allUsedKeys, options.ignoreKeys);
      const paths: Array<{ key: string; node: JsonAST.JSONProperty }> = [];
      buildJsonKeyPaths(rootExpr, '', paths);

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

      const usedKeys = collectAllUsedKeys(options.src, options.extensions);
      const linkedKeys = new Set<string>();
      collectYamlLinkedKeys(mapping, linkedKeys);

      const allUsedKeys = new Set([...usedKeys, ...linkedKeys]);
      const prepared = prepareUsedKeys(allUsedKeys, options.ignoreKeys);
      const paths: Array<{ key: string; node: YamlAST.YAMLPair }> = [];
      buildYamlKeyPaths(mapping, '', paths);

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

import type { AST as VAST } from 'vue-eslint-parser';

import debugFactory from 'debug';

import { walkTsAst } from './ast-walker';

const debug = debugFactory('@rotki/eslint-plugin:i18n-vue-template');

type VNodeLike = VAST.VNode | VAST.HasParent;

function isVElement(node: VNodeLike): node is VAST.VElement {
  return 'type' in node && node.type === 'VElement';
}

function isVExpressionContainer(node: VNodeLike): node is VAST.VExpressionContainer {
  return 'type' in node && node.type === 'VExpressionContainer';
}

function isKeypathAttribute(attr: VAST.VAttribute | VAST.VDirective): attr is VAST.VAttribute & { value: VAST.VLiteral } {
  return attr.type === 'VAttribute'
    && !attr.directive
    && (attr.key.name === 'keypath' || attr.key.name === 'path')
    && attr.value !== null
    && attr.value.type === 'VLiteral';
}

function isVTDirective(attr: VAST.VAttribute | VAST.VDirective): boolean {
  return attr.type === 'VAttribute'
    && attr.directive
    && attr.key.name.type === 'VIdentifier'
    && attr.key.name.rawName === 't';
}

function getDirectiveExpression(attr: VAST.VAttribute | VAST.VDirective): VAST.ESLintExpression | VAST.VFilterSequenceExpression | VAST.VForExpression | VAST.VOnExpression | VAST.VSlotScopeExpression | VAST.VGenericExpression | null {
  if (attr.type !== 'VAttribute' || !attr.directive)
    return null;
  if (!attr.value || attr.value.type !== 'VExpressionContainer')
    return null;
  return attr.value.expression;
}

export function extractKeysFromVueTemplate(templateBody: VAST.VElement, keys: Set<string>): void {
  walkVueTemplateNode(templateBody, keys);
}

function walkVueTemplateNode(node: VNodeLike, keys: Set<string>): void {
  if (!node || typeof node !== 'object')
    return;

  if (isVElement(node)) {
    if (node.rawName === 'i18n-t' || node.name === 'i18n-t') {
      for (const attr of node.startTag.attributes) {
        if (isKeypathAttribute(attr))
          keys.add(attr.value.value);
      }
    }

    for (const attr of node.startTag.attributes) {
      const expr = getDirectiveExpression(attr);
      if (!expr)
        continue;

      if (isVTDirective(attr) && expr.type === 'Literal' && typeof expr.value === 'string')
        keys.add(expr.value);

      walkTsAst(expr, keys);
    }

    for (const child of node.children)
      walkVueTemplateNode(child, keys);
  }
  else if (isVExpressionContainer(node)) {
    if (node.expression)
      walkTsAst(node.expression, keys);
  }
  else if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child && typeof child === 'object')
        walkVueTemplateNode(child, keys);
    }
  }
}

export function extractKeysFromSfcI18nBlock(content: string, keys: Set<string>): void {
  const i18nBlockRegex = /<i18n(?:\s[^>]*)?>([^]*?)<\/i18n>/g;
  let match: RegExpExecArray | null = i18nBlockRegex.exec(content);

  while (match !== null) {
    const blockContent = match[1].trim();
    if (blockContent) {
      try {
        const parsed: unknown = JSON.parse(blockContent);
        collectJsonKeys(parsed, '', keys);
      }
      catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        debug('Failed to parse <i18n> block as JSON: %s', message);
        console.warn(`[@rotki/eslint-plugin] Failed to parse <i18n> block as JSON. If you are using JSON5, it is not supported. Error: ${message}`);
      }
    }
    match = i18nBlockRegex.exec(content);
  }
}

export function collectJsonKeys(obj: unknown, prefix: string, keys: Set<string>): void {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj))
    return;
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      collectJsonKeys(value, fullKey, keys);
    }
    else {
      keys.add(fullKey);
    }
  }
}

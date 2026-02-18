export const I18N_FUNCTION_NAMES = new Set(['t', 'te', 'tc', '$t', '$te', '$tc']);

export const I18N_MEMBER_NAMES = new Set(['$t', '$te', '$tc']);

export interface AstNode {
  type: string;
  [key: string]: unknown;
}

export function isAstNode(value: unknown): value is AstNode {
  return value !== null && typeof value === 'object' && 'type' in value && typeof value.type === 'string';
}

function isI18nCallExpression(node: AstNode): boolean {
  const callee = node.callee;
  if (!isAstNode(callee))
    return false;

  if (callee.type === 'Identifier' && typeof callee.name === 'string')
    return I18N_FUNCTION_NAMES.has(callee.name);

  return callee.type === 'MemberExpression'
    && !callee.computed
    && isAstNode(callee.property)
    && callee.property.type === 'Identifier'
    && typeof callee.property.name === 'string'
    && I18N_MEMBER_NAMES.has(callee.property.name);
}

function getTemplateLiteralText(arg: AstNode): string | undefined {
  const quasis = arg.quasis;
  const expressions = arg.expressions;
  if (!Array.isArray(quasis) || !Array.isArray(expressions) || quasis.length === 0)
    return undefined;

  const firstQuasi: unknown = quasis[0];
  if (!firstQuasi || typeof firstQuasi !== 'object' || !('value' in firstQuasi))
    return undefined;
  const quasiObj = firstQuasi.value;
  if (!quasiObj || typeof quasiObj !== 'object')
    return undefined;
  return ('cooked' in quasiObj && typeof quasiObj.cooked === 'string')
    ? quasiObj.cooked
    : ('raw' in quasiObj && typeof quasiObj.raw === 'string' ? quasiObj.raw : undefined);
}

export function extractKeysFromCallExpression(node: AstNode, keys: Set<string>): void {
  if (!isI18nCallExpression(node))
    return;

  const args = node.arguments;
  if (!Array.isArray(args) || args.length === 0)
    return;

  const arg: unknown = args[0];
  if (!isAstNode(arg))
    return;

  if (arg.type === 'Literal' && typeof arg.value === 'string') {
    keys.add(arg.value);
  }
  else if (arg.type === 'TemplateLiteral') {
    const text = getTemplateLiteralText(arg);
    if (text === undefined)
      return;
    if (arg.expressions && Array.isArray(arg.expressions) && arg.expressions.length === 0 && Array.isArray(arg.quasis) && arg.quasis.length === 1)
      keys.add(text);
    else if (text)
      keys.add(`${text}*`);
  }
}

export const TS_AST_CHILD_KEYS = new Set([
  'alternate',
  'argument',
  'arguments',
  'block',
  'body',
  'callee',
  'cases',
  'consequent',
  'declaration',
  'declarations',
  'discriminant',
  'elements',
  'expression',
  'expressions',
  'handler',
  'init',
  'left',
  'object',
  'params',
  'properties',
  'property',
  'right',
  'source',
  'specifiers',
  'tag',
  'test',
  'update',
  'value',
]);

export function walkTsAst(node: unknown, keys: Set<string>): void {
  if (!isAstNode(node))
    return;

  if (node.type === 'CallExpression') {
    extractKeysFromCallExpression(node, keys);
  }

  for (const key of TS_AST_CHILD_KEYS) {
    if (!(key in node))
      continue;

    const child = node[key];
    if (!child || typeof child !== 'object')
      continue;

    if (Array.isArray(child)) {
      for (const item of child) {
        walkTsAst(item, keys);
      }
    }
    else {
      walkTsAst(child, keys);
    }
  }
}

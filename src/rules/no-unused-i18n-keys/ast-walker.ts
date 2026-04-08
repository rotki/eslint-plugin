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

function getQuasiText(quasi: unknown): string | undefined {
  if (!quasi || typeof quasi !== 'object' || !('value' in quasi))
    return undefined;
  const quasiObj = quasi.value;
  if (!quasiObj || typeof quasiObj !== 'object')
    return undefined;
  if ('cooked' in quasiObj && typeof quasiObj.cooked === 'string')
    return quasiObj.cooked;
  if ('raw' in quasiObj && typeof quasiObj.raw === 'string')
    return quasiObj.raw;
  return undefined;
}

function getTemplateLiteralText(arg: AstNode): string | undefined {
  const { expressions, quasis } = arg;
  if (!Array.isArray(quasis) || !Array.isArray(expressions) || quasis.length === 0)
    return undefined;
  return getQuasiText(quasis[0]);
}

function isStaticTemplateLiteral(arg: AstNode): boolean {
  return Array.isArray(arg.expressions) && arg.expressions.length === 0
    && Array.isArray(arg.quasis) && arg.quasis.length === 1;
}

function extractKeyFromArg(arg: AstNode): string | undefined {
  if (arg.type === 'Literal' && typeof arg.value === 'string')
    return arg.value;

  if (arg.type === 'TemplateLiteral') {
    const text = getTemplateLiteralText(arg);
    if (text === undefined)
      return undefined;
    if (isStaticTemplateLiteral(arg))
      return text;
    return text ? `${text}*` : undefined;
  }

  return undefined;
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

  const key = extractKeyFromArg(arg);
  if (key)
    keys.add(key);
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

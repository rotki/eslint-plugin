import type { AST } from 'vue-eslint-parser';

type ESLintNode = AST.ESLintNode;

function getLiteralValue(node: ESLintNode & { type: 'Literal' }, stringOnly: boolean): string | null {
  if (node.value == null)
    return !stringOnly && node.bigint != null ? node.bigint : null;
  if (typeof node.value === 'string')
    return node.value;
  return stringOnly ? null : String(node.value);
}

function getStringLiteralValue(node: ESLintNode, stringOnly: boolean = false) {
  if (node.type === 'Literal')
    return getLiteralValue(node, stringOnly);

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0 && node.quasis.length === 1)
    return node.quasis[0].value.cooked;

  return null;
}

export function getStaticPropertyName(node: ESLintNode) {
  if (node.type === 'Property' || node.type === 'MethodDefinition') {
    if (!node.computed) {
      const key = node.key;
      if (key.type === 'Identifier')
        return key.name;
    }
    const key = node.key;
    return getStringLiteralValue(key);
  }
  else if (node.type === 'MemberExpression') {
    if (!node.computed) {
      const property = node.property;
      if (property.type === 'Identifier')
        return property.name;

      return null;
    }
    const property = node.property;
    return getStringLiteralValue(property);
  }
  return null;
}

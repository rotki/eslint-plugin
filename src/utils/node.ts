import type { ESLintNode } from 'vue-eslint-parser/ast/nodes';

function getStringLiteralValue(node: ESLintNode, stringOnly: boolean = false) {
  if (node.type === 'Literal') {
    if (node.value == null) {
      if (!stringOnly && node.bigint != null)
        return node.bigint;

      return null;
    }
    if (typeof node.value === 'string')
      return node.value;

    if (!stringOnly)
      return String(node.value);

    return null;
  }
  if (
    node.type === 'TemplateLiteral'
    && node.expressions.length === 0
    && node.quasis.length === 1
  )
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

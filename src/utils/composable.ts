import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

const COMPOSABLE_PATTERN = /^use[A-Z]/;

export function isComposableName(name: string): boolean {
  return COMPOSABLE_PATTERN.test(name);
}

export function getFunctionName(node: TSESTree.Node): string | undefined {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration)
    return node.id?.name;

  if (node.type === AST_NODE_TYPES.VariableDeclarator
    && node.id.type === AST_NODE_TYPES.Identifier
    && node.init
    && (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression
      || node.init.type === AST_NODE_TYPES.FunctionExpression)) {
    return node.id.name;
  }

  return undefined;
}

export function getEnclosingComposable(node: TSESTree.Node): TSESTree.FunctionDeclaration | TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | undefined {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (current.type === AST_NODE_TYPES.FunctionDeclaration && current.id && isComposableName(current.id.name))
      return current;
    if (current.type === AST_NODE_TYPES.ArrowFunctionExpression || current.type === AST_NODE_TYPES.FunctionExpression) {
      const parent = current.parent;
      if (parent?.type === AST_NODE_TYPES.VariableDeclarator
        && parent.id.type === AST_NODE_TYPES.Identifier
        && isComposableName(parent.id.name)) {
        return current;
      }
    }
    current = current.parent;
  }
  return undefined;
}

export function isInsideComposable(node: TSESTree.Node): boolean {
  return getEnclosingComposable(node) !== undefined;
}

export function composableNameToPascal(name: string): string {
  // useFooBar -> FooBar (strip 'use' prefix)
  return name.slice(3);
}

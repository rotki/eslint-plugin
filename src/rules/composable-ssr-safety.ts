import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, getEnclosingComposable } from '../utils';

export const RULE_NAME = 'composable-ssr-safety';

export type MessageIds = 'ssrUnsafe';

export type Options = [];

const BROWSER_GLOBALS = new Set(['window', 'document', 'navigator']);
const LIFECYCLE_HOOKS = new Set(['onMounted', 'onBeforeMount']);

function isInsideLifecycleHook(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if ((current.type === AST_NODE_TYPES.ArrowFunctionExpression
      || current.type === AST_NODE_TYPES.FunctionExpression)
    && current.parent?.type === AST_NODE_TYPES.CallExpression
    && current.parent.callee.type === AST_NODE_TYPES.Identifier
    && LIFECYCLE_HOOKS.has(current.parent.callee.name)) {
      return true;
    }

    current = current.parent;
  }
  return false;
}

function isInsideTypeofCheck(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    // typeof window !== 'undefined'
    if (current.type === AST_NODE_TYPES.UnaryExpression && current.operator === 'typeof')
      return true;

    // Inside an if statement that has a typeof check
    if (current.type === AST_NODE_TYPES.IfStatement) {
      const test = current.test;
      if (hasTypeofCheck(test))
        return true;
    }

    current = current.parent;
  }
  return false;
}

function hasTypeofCheck(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.BinaryExpression) {
    if (node.left.type === AST_NODE_TYPES.UnaryExpression
      && node.left.operator === 'typeof'
      && node.left.argument.type === AST_NODE_TYPES.Identifier
      && BROWSER_GLOBALS.has(node.left.argument.name)) {
      return true;
    }

    if (node.right.type === AST_NODE_TYPES.UnaryExpression
      && node.right.operator === 'typeof'
      && node.right.argument.type === AST_NODE_TYPES.Identifier
      && BROWSER_GLOBALS.has(node.right.argument.name)) {
      return true;
    }
  }

  if (node.type === AST_NODE_TYPES.LogicalExpression)
    return hasTypeofCheck(node.left) || hasTypeofCheck(node.right);

  return false;
}

function isGuardedByIfTypeofOrLifecycle(node: TSESTree.MemberExpression): boolean {
  if (isInsideLifecycleHook(node))
    return true;

  // Walk up to find if we're inside an if block guarded by typeof
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (current.type === AST_NODE_TYPES.IfStatement && hasTypeofCheck(current.test)) {
      // Check if the member expression is in the consequent (true branch)
      return true;
    }

    // Conditional expression: typeof window !== 'undefined' ? window.x : fallback
    if (current.type === AST_NODE_TYPES.ConditionalExpression && hasTypeofCheck(current.test))
      return true;

    // Optional chaining or logical AND: typeof window !== 'undefined' && window.x
    if (current.type === AST_NODE_TYPES.LogicalExpression
      && current.operator === '&&'
      && hasTypeofCheck(current.left)) {
      return true;
    }

    current = current.parent;
  }
  return false;
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    return {
      MemberExpression(node) {
        if (node.object.type !== AST_NODE_TYPES.Identifier)
          return;

        if (!BROWSER_GLOBALS.has(node.object.name))
          return;

        if (!getEnclosingComposable(node))
          return;

        if (isInsideTypeofCheck(node))
          return;

        if (isGuardedByIfTypeofOrLifecycle(node))
          return;

        context.report({
          data: { name: node.object.name },
          messageId: 'ssrUnsafe',
          node,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Require browser global access in composables to be SSR-safe',
      recommendation: 'strict',
    },
    messages: {
      ssrUnsafe: 'Access to \'{{ name }}\' in a composable must be guarded with a typeof check or placed inside onMounted/onBeforeMount.',
    },
    schema: [],
    type: 'problem',
  },
  name: RULE_NAME,
});

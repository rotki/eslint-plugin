import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, isComposableName } from '../utils';

export const RULE_NAME = 'composable-require-cleanup';

export type MessageIds = 'requireCleanup';

export type Options = [];

const SIDE_EFFECT_CALLS = new Set(['addEventListener', 'setInterval', 'setTimeout']);
const SIDE_EFFECT_CONSTRUCTORS = new Set(['MutationObserver', 'ResizeObserver', 'IntersectionObserver']);
const CLEANUP_HOOKS = new Set(['onUnmounted', 'onBeforeUnmount', 'onScopeDispose', 'tryOnScopeDispose']);

interface ScopeInfo {
  sideEffects: TSESTree.Node[];
  hasCleanup: boolean;
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const scopeStack: ScopeInfo[] = [];

    function enterComposable() {
      scopeStack.push({ hasCleanup: false, sideEffects: [] });
    }

    function exitComposable() {
      const scope = scopeStack.pop();
      if (scope && scope.sideEffects.length > 0 && !scope.hasCleanup) {
        for (const node of scope.sideEffects) {
          context.report({
            messageId: 'requireCleanup',
            node,
          });
        }
      }
    }

    function currentScope(): ScopeInfo | undefined {
      return scopeStack.at(-1);
    }

    return {
      'ArrowFunctionExpression': (node: TSESTree.ArrowFunctionExpression) => {
        const parent = node.parent;
        if (parent?.type === AST_NODE_TYPES.VariableDeclarator
          && parent.id.type === AST_NODE_TYPES.Identifier
          && isComposableName(parent.id.name)) {
          enterComposable();
        }
      },
      'ArrowFunctionExpression:exit': (node: TSESTree.ArrowFunctionExpression) => {
        const parent = node.parent;
        if (parent?.type === AST_NODE_TYPES.VariableDeclarator
          && parent.id.type === AST_NODE_TYPES.Identifier
          && isComposableName(parent.id.name)) {
          exitComposable();
        }
      },
      'CallExpression': (node: TSESTree.CallExpression) => {
        const scope = currentScope();
        if (!scope)
          return;

        // Check for cleanup hooks
        if (node.callee.type === AST_NODE_TYPES.Identifier && CLEANUP_HOOKS.has(node.callee.name)) {
          scope.hasCleanup = true;
          return;
        }

        // Check for side-effect calls: addEventListener, setInterval, setTimeout
        if (node.callee.type === AST_NODE_TYPES.MemberExpression
          && node.callee.property.type === AST_NODE_TYPES.Identifier
          && SIDE_EFFECT_CALLS.has(node.callee.property.name)) {
          scope.sideEffects.push(node);
          return;
        }

        // Also check direct calls like setInterval, setTimeout
        if (node.callee.type === AST_NODE_TYPES.Identifier && SIDE_EFFECT_CALLS.has(node.callee.name)) {
          scope.sideEffects.push(node);
        }
      },
      'FunctionDeclaration': (node: TSESTree.FunctionDeclaration) => {
        if (node.id && isComposableName(node.id.name))
          enterComposable();
      },
      'FunctionDeclaration:exit': (node: TSESTree.FunctionDeclaration) => {
        if (node.id && isComposableName(node.id.name))
          exitComposable();
      },
      'FunctionExpression': (node: TSESTree.FunctionExpression) => {
        const parent = node.parent;
        if (parent?.type === AST_NODE_TYPES.VariableDeclarator
          && parent.id.type === AST_NODE_TYPES.Identifier
          && isComposableName(parent.id.name)) {
          enterComposable();
        }
      },
      'FunctionExpression:exit': (node: TSESTree.FunctionExpression) => {
        const parent = node.parent;
        if (parent?.type === AST_NODE_TYPES.VariableDeclarator
          && parent.id.type === AST_NODE_TYPES.Identifier
          && isComposableName(parent.id.name)) {
          exitComposable();
        }
      },
      'NewExpression': (node: TSESTree.NewExpression) => {
        const scope = currentScope();
        if (!scope)
          return;

        if (node.callee.type === AST_NODE_TYPES.Identifier && SIDE_EFFECT_CONSTRUCTORS.has(node.callee.name))
          scope.sideEffects.push(node);
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Require cleanup hooks when composables use side effects',
      recommendation: 'strict',
    },
    messages: {
      requireCleanup: 'Side effect requires a cleanup hook (onUnmounted, onBeforeUnmount, or onScopeDispose).',
    },
    schema: [],
    type: 'problem',
  },
  name: RULE_NAME,
});

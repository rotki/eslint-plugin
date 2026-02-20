import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createEslintRule, isInsideComposable } from '../utils';

export const RULE_NAME = 'composable-prefer-shallowref';

export type MessageIds = 'preferShallowRef';

export type Options = [];

export default createEslintRule<Options, MessageIds>({
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.Identifier || node.callee.name !== 'ref')
          return;

        if (!isInsideComposable(node))
          return;

        // Only flag when argument is a primitive literal
        const arg = node.arguments[0];
        if (!arg || arg.type !== AST_NODE_TYPES.Literal)
          return;

        context.report({
          fix(fixer) {
            return fixer.replaceText(node.callee, 'shallowRef');
          },
          messageId: 'preferShallowRef',
          node,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Prefer shallowRef() over ref() for primitive values in composables',
      recommendation: 'strict',
    },
    fixable: 'code',
    messages: {
      preferShallowRef: 'Use shallowRef() instead of ref() for primitive values in composables.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

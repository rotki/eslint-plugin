import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createEslintRule, isInsideComposable } from '../utils';

export const RULE_NAME = 'composable-prefer-shallowref';

export type MessageIds = 'preferShallowRef' | 'suggestShallowRef';

export type Options = [{ autofix?: boolean }];

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const autofix = context.options[0]?.autofix ?? false;

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
          ...(autofix
            ? {
                fix(fixer) {
                  return fixer.replaceText(node.callee, 'shallowRef');
                },
              }
            : {
                suggest: [{
                  fix(fixer) {
                    return fixer.replaceText(node.callee, 'shallowRef');
                  },
                  messageId: 'suggestShallowRef',
                }],
              }),
          messageId: 'preferShallowRef',
          node,
        });
      },
    };
  },
  defaultOptions: [{ autofix: false }],
  meta: {
    docs: {
      description: 'Prefer shallowRef() over ref() for primitive values in composables',
      recommendation: 'strict',
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      preferShallowRef: 'Use shallowRef() instead of ref() for primitive values in composables.',
      suggestShallowRef: 'Replace ref() with shallowRef().',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          autofix: {
            default: false,
            description: 'Enable auto-fix. When disabled, the fix is available as a suggestion.',
            type: 'boolean',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

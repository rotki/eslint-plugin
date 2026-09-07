import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule } from '../utils';

export const RULE_NAME = 'no-conditional-empty-object-spread';

export type MessageIds = 'conditionalSpread';

export type Options = [];

function isEmptyObject(node: TSESTree.Expression): boolean {
  return node.type === AST_NODE_TYPES.ObjectExpression && node.properties.length === 0;
}

/**
 * Both shapes omit a property by spreading nothing: the ternary spreads an empty object, and the
 * `&&` spreads `false`, which is a legal no-op.
 */
function hidesOmission(node: TSESTree.Expression): boolean {
  if (node.type === AST_NODE_TYPES.ConditionalExpression)
    return isEmptyObject(node.consequent) || isEmptyObject(node.alternate);

  return node.type === AST_NODE_TYPES.LogicalExpression
    && node.operator === '&&'
    && node.right.type === AST_NODE_TYPES.ObjectExpression;
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    return {
      SpreadElement(node: TSESTree.SpreadElement) {
        if (node.parent.type !== AST_NODE_TYPES.ObjectExpression)
          return;

        if (hidesOmission(node.argument))
          context.report({ messageId: 'conditionalSpread', node });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Disallow object spreads that conditionally spread nothing to omit a property',
      recommendation: 'strict',
    },
    messages: {
      conditionalSpread: 'This spread hides property omission behind an empty object. Build the object in separate statements and add the property only when it is present.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

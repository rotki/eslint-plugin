import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, getSourceCode } from '../utils';

export const RULE_NAME = 'require-jsdoc-on-composable-options';

export type MessageIds = 'missingJsdoc';

export type Options = [];

const OPTIONS_PATTERN = /^Use\w+Options$/;

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const source = getSourceCode(context);
    return {
      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration) {
        if (!OPTIONS_PATTERN.test(node.id.name))
          return;

        for (const member of node.body.body) {
          if (member.type !== AST_NODE_TYPES.TSPropertySignature)
            continue;

          const comments = source.getCommentsBefore(member as any);
          const hasJsdoc = comments.some(comment => comment.type === 'Block' && comment.value.startsWith('*'));

          if (!hasJsdoc) {
            const propertyName = member.key.type === AST_NODE_TYPES.Identifier
              ? member.key.name
              : source.getText(member.key as any);

            context.report({
              data: { interfaceName: node.id.name, property: propertyName },
              messageId: 'missingJsdoc',
              node: member,
            });
          }
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Require JSDoc comments on composable options interface properties',
      recommendation: 'stylistic',
    },
    messages: {
      missingJsdoc: 'Property \'{{ property }}\' in \'{{ interfaceName }}\' should have a JSDoc comment.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

import { createEslintRule } from '../utils';

export const RULE_NAME = 'no-dot-ts-imports';

export type MessageIds = 'invalidTSExtension';

export type Options = [];

export default createEslintRule<Options, MessageIds>({
  create(context) {
    return {
      ImportDeclaration(node) {
        const importDeclaration = node.source.value;
        if (!importDeclaration.endsWith('.ts'))
          return;

        const replacement = importDeclaration.slice(0, -3);

        context.report({
          data: {
            import: importDeclaration,
          },
          fix(fixer) {
            return fixer.replaceText(node.source, `'${replacement}'`);
          },
          messageId: 'invalidTSExtension',
          node: node.source,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Checks and replaces .ts extension in import statements.',
      recommendation: 'recommended',
    },
    fixable: 'code',
    messages: {
      invalidTSExtension: `'{{ import }}' has a .ts extension, please remove it'`,
    },
    schema: [],
    type: 'problem',
  },
  name: RULE_NAME,
});

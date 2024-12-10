import { createEslintRule } from '../utils';

export const RULE_NAME = 'no-legacy-library-import';

export type MessageIds = 'replacedWith';

export type Options = [];

const legacyLibrary = '@rotki/ui-library-compat';
const newLibrary = '@rotki/ui-library';

export default createEslintRule<Options, MessageIds>({
  create(context) {
    return {
      ImportDeclaration(node) {
        if (!node.source.value.startsWith(legacyLibrary))
          return;

        const replacement = node.source.value.replace(legacyLibrary, newLibrary);

        context.report({
          fix(fixer) {
            return fixer.replaceText(node.source, `'${replacement}'`);
          },
          messageId: 'replacedWith',
          node: node.source,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: `Reports and replaces imports of ${legacyLibrary} with ${newLibrary}`,
      recommendation: 'recommended',
    },
    fixable: 'code',
    messages: {
      replacedWith: `${legacyLibrary} has been replaced by ${newLibrary}`,
    },
    schema: [],
    type: 'problem',
  },
  name: RULE_NAME,
});

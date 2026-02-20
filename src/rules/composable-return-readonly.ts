import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, getEnclosingComposable, getSourceCode } from '../utils';

export const RULE_NAME = 'composable-return-readonly';

export type MessageIds = 'wrapReadonly';

export type Options = [];

const REACTIVE_CREATORS = new Set(['ref', 'shallowRef', 'computed']);

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const source = getSourceCode(context);
    const reactiveVars = new Set<string>();

    return {
      ReturnStatement: (node: TSESTree.ReturnStatement) => {
        if (!getEnclosingComposable(node))
          return;

        if (!node.argument || node.argument.type !== AST_NODE_TYPES.ObjectExpression)
          return;

        for (const prop of node.argument.properties) {
          if (prop.type !== AST_NODE_TYPES.Property)
            continue;

          if (prop.shorthand && prop.key.type === AST_NODE_TYPES.Identifier && reactiveVars.has(prop.key.name)) {
            const keyName = prop.key.name;
            context.report({
              data: { name: keyName },
              fix(fixer) {
                return fixer.replaceText(prop as any, `${keyName}: readonly(${keyName})`);
              },
              messageId: 'wrapReadonly',
              node: prop,
            });
          }
          else if (!prop.shorthand && prop.value.type === AST_NODE_TYPES.Identifier && reactiveVars.has(prop.value.name)) {
            // Check not already wrapped in readonly()
            context.report({
              data: { name: prop.value.name },
              fix(fixer) {
                return fixer.replaceText(prop.value as any, `readonly(${prop.value.type === AST_NODE_TYPES.Identifier ? prop.value.name : source.getText(prop.value as any)})`);
              },
              messageId: 'wrapReadonly',
              node: prop,
            });
          }
        }
      },
      VariableDeclarator: (node: TSESTree.VariableDeclarator) => {
        if (!getEnclosingComposable(node))
          return;

        if (node.id.type !== AST_NODE_TYPES.Identifier)
          return;

        if (node.init?.type === AST_NODE_TYPES.CallExpression
          && node.init.callee.type === AST_NODE_TYPES.Identifier
          && REACTIVE_CREATORS.has(node.init.callee.name)) {
          reactiveVars.add(node.id.name);
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Require returned refs from composables to be wrapped with readonly()',
      recommendation: 'strict',
    },
    fixable: 'code',
    messages: {
      wrapReadonly: 'Returned ref \'{{ name }}\' should be wrapped with readonly().',
    },
    schema: [],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

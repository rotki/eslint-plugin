import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, getEnclosingComposable, getSourceCode } from '../utils';

export const RULE_NAME = 'composable-return-readonly';

export type MessageIds = 'suggestRemoveReadonly' | 'suggestWrapReadonly' | 'unnecessaryReadonly' | 'wrapReadonly';

export type Options = [{ autofix?: boolean }];

const REACTIVE_CREATORS = new Set(['ref', 'shallowRef']);
const READONLY_CREATORS = new Set(['computed']);

function isReadonlyCall(node: TSESTree.Expression): node is TSESTree.CallExpression & { arguments: [TSESTree.Identifier] } {
  return node.type === AST_NODE_TYPES.CallExpression
    && node.callee.type === AST_NODE_TYPES.Identifier
    && node.callee.name === 'readonly'
    && node.arguments.length === 1
    && node.arguments[0].type === AST_NODE_TYPES.Identifier;
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const autofix = context.options[0]?.autofix ?? false;
    const source = getSourceCode(context);
    const reactiveVars = new Set<string>();
    const readonlyVars = new Set<string>();

    return {
      ReturnStatement: (node: TSESTree.ReturnStatement) => {
        if (!getEnclosingComposable(node))
          return;

        if (!node.argument || node.argument.type !== AST_NODE_TYPES.ObjectExpression)
          return;

        for (const prop of node.argument.properties) {
          if (prop.type !== AST_NODE_TYPES.Property)
            continue;

          // Check for unnecessary readonly() wrapping on computed refs
          const valueNode = prop.shorthand ? null : prop.value;
          if (valueNode && isReadonlyCall(valueNode)) {
            const innerName = valueNode.arguments[0].name;
            if (readonlyVars.has(innerName)) {
              const fixFn = (fixer: any) => fixer.replaceText(valueNode as any, innerName);
              context.report({
                data: { name: innerName },
                ...(autofix
                  ? { fix: fixFn }
                  : { suggest: [{ data: { name: innerName }, fix: fixFn, messageId: 'suggestRemoveReadonly' as const }] }),
                messageId: 'unnecessaryReadonly',
                node: prop,
              });
              continue;
            }
          }

          // Check for missing readonly() on writable refs
          if (prop.shorthand && prop.key.type === AST_NODE_TYPES.Identifier && reactiveVars.has(prop.key.name)) {
            const keyName = prop.key.name;
            const fixFn = (fixer: any) => fixer.replaceText(prop as any, `${keyName}: readonly(${keyName})`);
            context.report({
              data: { name: keyName },
              ...(autofix
                ? { fix: fixFn }
                : { suggest: [{ data: { name: keyName }, fix: fixFn, messageId: 'suggestWrapReadonly' as const }] }),
              messageId: 'wrapReadonly',
              node: prop,
            });
          }
          else if (!prop.shorthand && prop.value.type === AST_NODE_TYPES.Identifier && reactiveVars.has(prop.value.name)) {
            const valueName = prop.value.name;
            const fixFn = (fixer: any) => fixer.replaceText(prop.value as any, `readonly(${prop.value.type === AST_NODE_TYPES.Identifier ? prop.value.name : source.getText(prop.value as any)})`);
            context.report({
              data: { name: valueName },
              ...(autofix
                ? { fix: fixFn }
                : { suggest: [{ data: { name: valueName }, fix: fixFn, messageId: 'suggestWrapReadonly' as const }] }),
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
          && node.init.callee.type === AST_NODE_TYPES.Identifier) {
          const calleeName = node.init.callee.name;
          if (REACTIVE_CREATORS.has(calleeName)) {
            reactiveVars.add(node.id.name);
          }
          else if (READONLY_CREATORS.has(calleeName)) {
            readonlyVars.add(node.id.name);
          }
        }
      },
    };
  },
  defaultOptions: [{ autofix: false }],
  meta: {
    docs: {
      description: 'Require returned refs from composables to be wrapped with readonly()',
      recommendation: 'strict',
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      suggestRemoveReadonly: 'Remove unnecessary readonly() from \'{{ name }}\'.',
      suggestWrapReadonly: 'Wrap \'{{ name }}\' with readonly().',
      unnecessaryReadonly: 'Computed ref \'{{ name }}\' is already readonly and does not need readonly() wrapping.',
      wrapReadonly: 'Returned ref \'{{ name }}\' should be wrapped with readonly().',
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

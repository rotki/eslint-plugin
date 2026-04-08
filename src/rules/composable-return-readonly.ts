import type { ReportFixFunction } from '../types';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, getEnclosingComposable, getSourceCode } from '../utils';

export const RULE_NAME = 'composable-return-readonly';

export type MessageIds = 'suggestRemoveReadonly' | 'suggestWrapReadonly' | 'unnecessaryReadonly' | 'wrapReadonly';

export type Options = [{ autofix?: boolean }];

const REACTIVE_CREATORS = new Set(['ref', 'shallowRef']);
const READONLY_CREATORS = new Set(['computed']);

function isReadonlyCall(node: TSESTree.Node): node is TSESTree.CallExpression & { arguments: [TSESTree.Identifier] } {
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

    function reportWithFixOrSuggest(
      prop: TSESTree.Property,
      name: string,
      messageId: MessageIds,
      suggestMessageId: 'suggestRemoveReadonly' | 'suggestWrapReadonly',
      fixFn: ReportFixFunction,
    ): void {
      context.report({
        data: { name },
        ...(autofix
          ? { fix: fixFn }
          : { suggest: [{ data: { name }, fix: fixFn, messageId: suggestMessageId }] }),
        messageId,
        node: prop,
      });
    }

    function checkUnnecessaryReadonly(prop: TSESTree.Property): boolean {
      const valueNode = prop.shorthand ? null : prop.value;
      if (!valueNode || !isReadonlyCall(valueNode))
        return false;

      const innerName = valueNode.arguments[0].name;
      if (!readonlyVars.has(innerName))
        return false;

      reportWithFixOrSuggest(prop, innerName, 'unnecessaryReadonly', 'suggestRemoveReadonly', fixer => fixer.replaceText(valueNode, innerName));
      return true;
    }

    function checkMissingReadonly(prop: TSESTree.Property): void {
      if (prop.shorthand && prop.key.type === AST_NODE_TYPES.Identifier && reactiveVars.has(prop.key.name)) {
        const keyName = prop.key.name;
        reportWithFixOrSuggest(prop, keyName, 'wrapReadonly', 'suggestWrapReadonly', fixer => fixer.replaceText(prop, `${keyName}: readonly(${keyName})`));
      }
      else if (!prop.shorthand && prop.value.type === AST_NODE_TYPES.Identifier && reactiveVars.has(prop.value.name)) {
        const valueName = prop.value.name;
        reportWithFixOrSuggest(prop, valueName, 'wrapReadonly', 'suggestWrapReadonly', fixer => fixer.replaceText(prop.value, `readonly(${prop.value.type === AST_NODE_TYPES.Identifier ? prop.value.name : source.getText(prop.value)})`));
      }
    }

    return {
      ReturnStatement: (node: TSESTree.ReturnStatement) => {
        if (!getEnclosingComposable(node))
          return;

        if (!node.argument || node.argument.type !== AST_NODE_TYPES.ObjectExpression)
          return;

        for (const prop of node.argument.properties) {
          if (prop.type !== AST_NODE_TYPES.Property)
            continue;

          if (!checkUnnecessaryReadonly(prop))
            checkMissingReadonly(prop);
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

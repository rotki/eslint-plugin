import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createEslintRule, isComposableName } from '../utils';

export const RULE_NAME = 'composable-no-default-export';

export type MessageIds = 'noDefaultExport';

export type Options = [];

export default createEslintRule<Options, MessageIds>({
  create(context) {
    let hasComposable = false;
    let defaultExportNode: any = null;

    return {
      'ExportDefaultDeclaration': (node) => {
        defaultExportNode = node;
      },
      'FunctionDeclaration': (node) => {
        if (node.id && isComposableName(node.id.name))
          hasComposable = true;
      },
      'Program:exit': () => {
        if (hasComposable && defaultExportNode) {
          context.report({
            messageId: 'noDefaultExport',
            node: defaultExportNode,
          });
        }
      },
      'VariableDeclarator': (node) => {
        if (node.id.type === AST_NODE_TYPES.Identifier
          && isComposableName(node.id.name)
          && node.init
          && (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression
            || node.init.type === AST_NODE_TYPES.FunctionExpression)) {
          hasComposable = true;
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Forbid default exports in files containing composables',
      recommendation: 'strict',
    },
    messages: {
      noDefaultExport: 'Files containing composables should use named exports instead of default exports.',
    },
    schema: [],
    type: 'problem',
  },
  name: RULE_NAME,
});

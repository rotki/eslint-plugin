import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, isComposableName } from '../utils';

export const RULE_NAME = 'composable-input-flexibility';

export type MessageIds = 'preferMaybeRefOrGetter' | 'suggestMaybeRefOrGetter';

export type Options = [{ autofix?: boolean }];

function checkParamForRef(param: TSESTree.Parameter): TSESTree.TSTypeReference | undefined {
  let annotation: TSESTree.TypeNode | undefined;

  if (param.type === AST_NODE_TYPES.Identifier && param.typeAnnotation) {
    annotation = param.typeAnnotation.typeAnnotation;
  }
  else if (param.type === AST_NODE_TYPES.AssignmentPattern
    && param.left.type === AST_NODE_TYPES.Identifier
    && param.left.typeAnnotation) {
    annotation = param.left.typeAnnotation.typeAnnotation;
  }

  if (annotation?.type === AST_NODE_TYPES.TSTypeReference
    && annotation.typeName.type === AST_NODE_TYPES.Identifier
    && annotation.typeName.name === 'Ref') {
    return annotation;
  }

  return undefined;
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const autofix = context.options[0]?.autofix ?? false;

    return {
      FunctionDeclaration: (node: TSESTree.FunctionDeclaration) => {
        if (!node.id || !isComposableName(node.id.name))
          return;

        checkParams(node.params);
      },
      VariableDeclarator: (node: TSESTree.VariableDeclarator) => {
        if (node.id.type !== AST_NODE_TYPES.Identifier || !isComposableName(node.id.name))
          return;

        if (node.init?.type === AST_NODE_TYPES.ArrowFunctionExpression
          || node.init?.type === AST_NODE_TYPES.FunctionExpression) {
          checkParams(node.init.params);
        }
      },
    };

    function checkParams(params: TSESTree.Parameter[]) {
      for (const param of params) {
        const refType = checkParamForRef(param);
        if (refType) {
          context.report({
            ...(autofix
              ? {
                  fix(fixer) {
                    return fixer.replaceText(refType.typeName, 'MaybeRefOrGetter');
                  },
                }
              : {
                  suggest: [{
                    fix(fixer) {
                      return fixer.replaceText(refType.typeName, 'MaybeRefOrGetter');
                    },
                    messageId: 'suggestMaybeRefOrGetter',
                  }],
                }),
            messageId: 'preferMaybeRefOrGetter',
            node: refType,
          });
        }
      }
    }
  },
  defaultOptions: [{ autofix: false }],
  meta: {
    docs: {
      description: 'Prefer MaybeRefOrGetter over Ref for composable parameters',
      recommendation: 'stylistic',
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      preferMaybeRefOrGetter: 'Use MaybeRefOrGetter<T> instead of Ref<T> for composable parameters to increase input flexibility.',
      suggestMaybeRefOrGetter: 'Replace Ref<T> with MaybeRefOrGetter<T>.',
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

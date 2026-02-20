import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { composableNameToPascal, createEslintRule, isComposableName } from '../utils';

export const RULE_NAME = 'composable-naming-convention';

export type MessageIds = 'optionsNaming' | 'returnNaming';

export type Options = [];

function getComposableFunction(node: TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator): { name: string; params: TSESTree.Parameter[]; returnType: TSESTree.TSTypeAnnotation | undefined; fn: TSESTree.Node } | undefined {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    if (!node.id || !isComposableName(node.id.name))
      return undefined;
    return { fn: node, name: node.id.name, params: node.params, returnType: (node as any).returnType };
  }

  if (node.type === AST_NODE_TYPES.VariableDeclarator
    && node.id.type === AST_NODE_TYPES.Identifier
    && isComposableName(node.id.name)
    && node.init
    && (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression
      || node.init.type === AST_NODE_TYPES.FunctionExpression)) {
    const fn = node.init;
    return { fn, name: node.id.name, params: fn.params, returnType: (fn as any).returnType };
  }

  return undefined;
}

function getTypeReferenceName(annotation: TSESTree.TypeNode): string | undefined {
  if (annotation.type === AST_NODE_TYPES.TSTypeReference
    && annotation.typeName.type === AST_NODE_TYPES.Identifier) {
    return annotation.typeName.name;
  }

  return undefined;
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    return {
      FunctionDeclaration: (node: TSESTree.FunctionDeclaration) => {
        checkComposable(node);
      },
      VariableDeclarator: (node: TSESTree.VariableDeclarator) => {
        checkComposable(node);
      },
    };

    function checkComposable(node: TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator) {
      const info = getComposableFunction(node);
      if (!info)
        return;

      const pascalName = composableNameToPascal(info.name);
      const expectedOptions = `Use${pascalName}Options`;
      const expectedReturn = `Use${pascalName}Return`;

      // Check parameter type annotation (last param for options pattern)
      for (const param of info.params) {
        const annotation = getParamTypeAnnotation(param);
        if (!annotation)
          continue;

        const typeName = getTypeReferenceName(annotation);
        if (typeName && typeName.startsWith('Use') && typeName.endsWith('Options') && typeName !== expectedOptions) {
          context.report({
            data: { expected: expectedOptions, got: typeName },
            messageId: 'optionsNaming',
            node: param,
          });
        }
      }

      // Check return type annotation
      if (info.returnType) {
        const returnTypeName = getTypeReferenceName(info.returnType.typeAnnotation);
        if (returnTypeName && returnTypeName.startsWith('Use') && returnTypeName.endsWith('Return') && returnTypeName !== expectedReturn) {
          context.report({
            data: { expected: expectedReturn, got: returnTypeName },
            messageId: 'returnNaming',
            node: info.returnType,
          });
        }
      }
    }

    function getParamTypeAnnotation(param: TSESTree.Parameter): TSESTree.TypeNode | undefined {
      if (param.type === AST_NODE_TYPES.Identifier && param.typeAnnotation)
        return param.typeAnnotation.typeAnnotation;

      if (param.type === AST_NODE_TYPES.AssignmentPattern
        && param.left.type === AST_NODE_TYPES.Identifier
        && param.left.typeAnnotation) {
        return param.left.typeAnnotation.typeAnnotation;
      }

      return undefined;
    }
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Enforce consistent naming for composable options and return types',
      recommendation: 'stylistic',
    },
    messages: {
      optionsNaming: 'Options type should be named \'{{ expected }}\' instead of \'{{ got }}\'.',
      returnNaming: 'Return type should be named \'{{ expected }}\' instead of \'{{ got }}\'.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

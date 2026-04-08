import type { RuleFix } from '@typescript-eslint/utils/ts-eslint';
import type { RuleContext } from '../types';
import { TSESTree } from '@typescript-eslint/utils';
import createDebug from 'debug';
import { createEslintRule, getSourceCode } from '../utils';

const debug = createDebug('@rotki/eslint-plugin:consistent-ref-type-annotation');

export const RULE_NAME = 'consistent-ref-type-annotation';

export type MessageIds = 'inconsistent' | 'missingType';

export type Options = [{ allowInference: boolean }];

const FIXABLE_METHODS = new Set<string>(['ref', 'computed']);

function getFixableCallExpression(declaration: TSESTree.LetOrConstOrVarDeclarator): { callee: TSESTree.Identifier; init: TSESTree.CallExpression } | undefined {
  const init = declaration.init;
  if (!init || init.type !== TSESTree.AST_NODE_TYPES.CallExpression)
    return undefined;
  const callee = init.callee;
  if (!callee || callee.type !== TSESTree.AST_NODE_TYPES.Identifier || !FIXABLE_METHODS.has(callee.name))
    return undefined;
  return { callee, init };
}

function getDeclarationTypeArguments(declaration: TSESTree.LetOrConstOrVarDeclarator): TSESTree.TSTypeParameterInstantiation | undefined {
  const typeNode = declaration.id.typeAnnotation?.typeAnnotation;
  if (typeNode?.type === TSESTree.AST_NODE_TYPES.TSTypeReference)
    return typeNode.typeArguments;
  return undefined;
}

function checkAssignmentDeclaration(
  context: Readonly<RuleContext<MessageIds, Options>>,
  source: ReturnType<typeof getSourceCode>,
  node: TSESTree.VariableDeclaration,
  declaration: TSESTree.LetOrConstOrVarDeclarator,
  allowInference: boolean,
): void {
  const call = getFixableCallExpression(declaration);
  if (!call)
    return;

  const { callee, init } = call;
  const name = callee.name;
  debug(`found ${name}, checking type arguments`);

  const initTypeArgs = init.typeArguments;
  const declTypeArgs = getDeclarationTypeArguments(declaration);
  const typeAnnotation = declaration.id.typeAnnotation;

  if (initTypeArgs && !declTypeArgs)
    return;

  debug(`generating report for ${name}`);

  if (!initTypeArgs && !declTypeArgs) {
    if (!allowInference)
      context.report({ data: { name }, messageId: 'missingType', node });
    return;
  }

  context.report({
    data: { name },
    fix(fixer) {
      const fixes: RuleFix[] = [];
      if (!initTypeArgs && callee)
        fixes.push(fixer.insertTextAfter(callee, source.getText(declTypeArgs)));
      if (typeAnnotation)
        fixes.push(fixer.remove(typeAnnotation));
      return fixes;
    },
    messageId: 'inconsistent',
    node,
  });
}

export default createEslintRule<Options, MessageIds>({
  create(context, optionsWithDefault) {
    const options = optionsWithDefault[0] || {};
    const allowInference = options.allowInference;
    const source = getSourceCode(context);
    return {
      VariableDeclaration: (node): void => {
        const declarations = node.declarations;
        for (const declaration of declarations) {
          if (declaration.type !== TSESTree.AST_NODE_TYPES.VariableDeclarator)
            continue;

          checkAssignmentDeclaration(context, source, node, declaration, allowInference);
        }
      },
    };
  },
  defaultOptions: [{ allowInference: false }],
  meta: {
    docs: {
      description: 'Ensures consistent type annotation position for ref, computed assignments',
      recommendation: 'recommended',
    },
    fixable: 'code',
    messages: {
      inconsistent: `Generic type annotation for the {{ name }} call was not on the right side`,
      missingType: `variable assignment for {{ name }} is missing the type annotation`,
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          allowInference: {
            type: 'boolean',
          },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
  name: RULE_NAME,
});

import type { RuleFix } from '@typescript-eslint/utils/ts-eslint';
import type { RuleContext } from '../types';
import { TSESTree } from '@typescript-eslint/utils';
import createDebug from 'debug';
import { createEslintRule, getSourceCode } from '../utils';

const debug = createDebug('@rotki/eslint-plugin:consistent-ref-type-annotation');

export const RULE_NAME = 'consistent-ref-type-annotation';

export type MessageIds = 'inconsistent' | 'missingType';

export type Options = [{ allowInference: boolean }];

const FIXABLE_METHODS = ['ref', 'computed'] as const;

function checkAssignmentDeclaration(
  context: Readonly<RuleContext<MessageIds, Options>>,
  node: TSESTree.VariableDeclaration,
  declaration: TSESTree.LetOrConstOrVarDeclarator,
  options: { allowInference: boolean },
): void {
  const source = getSourceCode(context);
  const { allowInference } = options;
  let declarationTypeArguments: TSESTree.TSTypeParameterInstantiation | undefined;

  const init = declaration.init;
  if (!(init && init.type === TSESTree.AST_NODE_TYPES.CallExpression))
    return;

  const callee = init.callee;

  if (!(callee && callee.type === TSESTree.AST_NODE_TYPES.Identifier))
    return;

  if (!Array.prototype.includes.call(FIXABLE_METHODS, callee.name))
    return;

  const name = callee.name;

  debug(`found ${name}, checking type arguments`);
  const initializationTypeArguments = init.typeArguments;

  const typeAnnotation = declaration.id.typeAnnotation;
  if (typeAnnotation) {
    const typeNode = typeAnnotation.typeAnnotation;
    if (typeNode && typeNode.type === TSESTree.AST_NODE_TYPES.TSTypeReference)
      declarationTypeArguments = typeNode.typeArguments;
  }

  if (initializationTypeArguments && !declarationTypeArguments)
    return;

  debug(`generating report for ${name}`);

  if ((!initializationTypeArguments && !declarationTypeArguments)) {
    if (allowInference) {
      debug('type inference is allowed');
    }
    else {
      context.report({
        data: {
          name,
        },
        messageId: 'missingType',
        node,
      });
    }
    return;
  }

  context.report({
    data: {
      name,
    },
    fix(fixer) {
      const fixes: RuleFix[] = [];

      if (!initializationTypeArguments && callee)
        fixes.push(fixer.insertTextAfter(callee, source.getText(declarationTypeArguments)));

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
    return {
      VariableDeclaration: (node): void => {
        const declarations = node.declarations;
        for (const declaration of declarations) {
          if (declaration.type !== TSESTree.AST_NODE_TYPES.VariableDeclarator)
            continue;

          checkAssignmentDeclaration(context, node, declaration, { allowInference });
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

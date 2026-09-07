import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, getSourceCode } from '../utils';

export const RULE_NAME = 'no-unknown-parameters';

export type MessageIds = 'unknownParameter';

export interface RuleOptions {
  /**
   * Parameter names that may be annotated `unknown`.
   *
   * The defaults are the error-handling names. `ts/use-unknown-in-catch-callback-variable`
   * requires `unknown` there, so reporting them would put the two rules in conflict.
   */
  allowNames?: string[];
}

export type Options = [RuleOptions];

const DEFAULT_ALLOW_NAMES = ['cause', 'e', 'err', 'error', 'reason'];

type ParameterOwner =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.TSCallSignatureDeclaration
  | TSESTree.TSConstructSignatureDeclaration
  | TSESTree.TSDeclareFunction
  | TSESTree.TSFunctionType
  | TSESTree.TSMethodSignature;

/** Whether a written annotation is `unknown`, or a union that contains it. */
function containsUnknown(type: TSESTree.TypeNode): boolean {
  if (type.type === AST_NODE_TYPES.TSUnknownKeyword)
    return true;

  return type.type === AST_NODE_TYPES.TSUnionType && type.types.some(containsUnknown);
}

/** A parameter, or the binding a rest or default parameter wraps. */
type ParameterLike = TSESTree.Parameter | TSESTree.DestructuringPattern;

/** The annotation attached to a parameter, reading through rest, default and `readonly` forms. */
function parameterAnnotation(parameter: ParameterLike): TSESTree.TSTypeAnnotation | undefined {
  if (parameter.type === AST_NODE_TYPES.TSParameterProperty)
    return parameterAnnotation(parameter.parameter);

  if (parameter.type === AST_NODE_TYPES.RestElement)
    return parameter.typeAnnotation ?? parameterAnnotation(parameter.argument);

  if (parameter.type === AST_NODE_TYPES.AssignmentPattern)
    return parameter.typeAnnotation ?? parameterAnnotation(parameter.left);

  // The remaining bindings carry the annotation directly. A member expression, which only appears
  // in destructuring assignment rather than a parameter list, carries none.
  return 'typeAnnotation' in parameter ? parameter.typeAnnotation : undefined;
}

/** The local binding a parameter introduces, without its annotation or default. */
function parameterName(parameter: ParameterLike, source: ReturnType<typeof getSourceCode>): string {
  if (parameter.type === AST_NODE_TYPES.TSParameterProperty)
    return parameterName(parameter.parameter, source);

  if (parameter.type === AST_NODE_TYPES.AssignmentPattern)
    return parameterName(parameter.left, source);

  if (parameter.type === AST_NODE_TYPES.RestElement)
    return parameterName(parameter.argument, source);

  if (parameter.type === AST_NODE_TYPES.Identifier)
    return parameter.name;

  // A destructured binding has no name of its own, so the pattern stands in for one. Its
  // annotation is part of the node's text and is cut off here.
  const text = source.getText(parameter);
  const annotation = 'typeAnnotation' in parameter ? parameter.typeAnnotation : undefined;
  return annotation
    ? text.slice(0, annotation.range[0] - parameter.range[0]).trimEnd()
    : text;
}

/** `function isFoo(value: unknown): value is Foo` has to take `unknown` to be useful. */
function isTypePredicateSubject(owner: ParameterOwner, name: string): boolean {
  const predicate = owner.returnType?.typeAnnotation;
  return predicate?.type === AST_NODE_TYPES.TSTypePredicate
    && predicate.parameterName.type === AST_NODE_TYPES.Identifier
    && predicate.parameterName.name === name;
}

export default createEslintRule<Options, MessageIds>({
  create(context, [options]) {
    const source = getSourceCode(context);
    const allowNames = new Set(options?.allowNames ?? DEFAULT_ALLOW_NAMES);

    const checkParameters = (node: ParameterOwner): void => {
      for (const parameter of node.params) {
        const annotation = parameterAnnotation(parameter);
        if (!annotation || !containsUnknown(annotation.typeAnnotation))
          continue;

        const name = parameterName(parameter, source);
        if (allowNames.has(name) || isTypePredicateSubject(node, name))
          continue;

        context.report({
          data: { parameter: name },
          messageId: 'unknownParameter',
          node: annotation.typeAnnotation,
        });
      }
    };

    return {
      ArrowFunctionExpression: checkParameters,
      FunctionDeclaration: checkParameters,
      FunctionExpression: checkParameters,
      TSCallSignatureDeclaration: checkParameters,
      TSConstructSignatureDeclaration: checkParameters,
      TSDeclareFunction: checkParameters,
      TSFunctionType: checkParameters,
      TSMethodSignature: checkParameters,
    };
  },
  defaultOptions: [{ allowNames: DEFAULT_ALLOW_NAMES }],
  meta: {
    docs: {
      description: 'Disallow function parameters annotated `unknown` outside error handling and type guards',
      recommendation: 'strict',
    },
    messages: {
      unknownParameter: 'Parameter \'{{ parameter }}\' is typed `unknown`, so every caller pushes the parsing onto this function. Parse the value at its boundary and accept the named type.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          allowNames: {
            items: { type: 'string' },
            type: 'array',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

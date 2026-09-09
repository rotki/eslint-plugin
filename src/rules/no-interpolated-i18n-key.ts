import type { TSESTree } from '@typescript-eslint/utils';
import type { AST as VAST } from 'vue-eslint-parser';
import type { TemplateBodyVisitor } from '../types';
import { createEslintRule, defineTemplateBodyVisitor, getSourceCode } from '../utils';
import { type AstNode, isAstNode, isI18nCallExpression } from './no-unused-i18n-keys/ast-walker';

export const RULE_NAME = 'no-interpolated-i18n-key';

export type MessageIds = 'interpolatedKey' | 'interpolatedKeypath';

export type Options = [];

/** The elements whose `keypath`/`path` prop is a message key rather than an arbitrary string. */
const I18N_COMPONENT_NAMES = new Set(['i18n-t', 'i18n']);

const KEYPATH_ARGUMENTS = new Set(['keypath', 'path']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/**
 * A template literal that interpolates at least one expression. The predicate narrows to the
 * TypeScript-ESLint node type so the match can be reported directly; the same shape reaches here
 * from the Vue template AST, where it is structurally identical.
 */
function isInterpolatedTemplate(node: unknown): node is TSESTree.TemplateLiteral {
  return isAstNode(node)
    && node.type === 'TemplateLiteral'
    && Array.isArray(node.expressions)
    && node.expressions.length > 0;
}

/**
 * The first argument of an i18n call when it is written as an interpolated template literal, which
 * is the shape that turns the static prefix into a wildcard usage.
 */
function interpolatedKeyArgument(node: AstNode): TSESTree.TemplateLiteral | undefined {
  if (!isI18nCallExpression(node))
    return undefined;

  const args = node.arguments;
  if (!Array.isArray(args) || args.length === 0)
    return undefined;

  const first: unknown = args[0];
  return isInterpolatedTemplate(first) ? first : undefined;
}

function isI18nComponent(element: VAST.VElement): boolean {
  return I18N_COMPONENT_NAMES.has(element.rawName) || I18N_COMPONENT_NAMES.has(element.name);
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    function reportCall(node: AstNode): void {
      const argument = interpolatedKeyArgument(node);
      if (argument)
        context.report({ messageId: 'interpolatedKey', node: argument });
    }

    const scriptVisitor: TemplateBodyVisitor = {
      CallExpression: reportCall,
    };

    const templateVisitor: TemplateBodyVisitor = {
      'CallExpression': reportCall,
      'VAttribute[directive=true][key.name.name=\'bind\']': function (node: VAST.VDirective) {
        const argument = node.key.argument;
        if (argument?.type !== 'VIdentifier' || !KEYPATH_ARGUMENTS.has(argument.name))
          return;

        if (!isI18nComponent(node.parent.parent))
          return;

        const expression = node.value?.type === 'VExpressionContainer' ? node.value.expression : null;
        if (isInterpolatedTemplate(expression))
          context.report({ messageId: 'interpolatedKeypath', node: expression });
      },
    };

    // `defineTemplateBodyVisitor` is only available when vue-eslint-parser parsed the file; on a
    // plain `.ts` file linted with the TypeScript parser the script visitor has to stand alone.
    const parserServices: unknown = getSourceCode(context).parserServices;
    const hasTemplateSupport = isRecord(parserServices) && typeof parserServices.defineTemplateBodyVisitor === 'function';

    return hasTemplateSupport
      ? defineTemplateBodyVisitor(context, templateVisitor, scriptVisitor)
      : scriptVisitor;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'disallow message keys built by interpolating a template literal at the call site',
      recommendation: 'recommended',
    },
    messages: {
      interpolatedKey: 'Interpolated message key. `no-unused-i18n-keys` reads the static prefix as a usage, which silently exempts the whole subtree from unused-key reporting. Build an exhaustive `Record<T, MessageKey>` of `msg.$t(...)` keys and pass the looked-up key instead.',
      interpolatedKeypath: 'Interpolated message key. A key assembled in the binding is invisible to both `no-unused-i18n-keys` and `no-missing-keys`. Build an exhaustive `Record<T, MessageKey>` of `msg.$t(...)` keys and bind the looked-up key instead.',
    },
    schema: [],
    type: 'problem',
  },
  name: RULE_NAME,
});

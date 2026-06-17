import type { AST as VAST } from 'vue-eslint-parser';
import type { Range, RuleContext } from '../types';
import debugFactory from 'debug';
import { createEslintRule, defineTemplateBodyVisitor, getSourceCode } from '../utils';

export const RULE_NAME = 'no-redundant-flex-row';

export type MessageIds = 'redundantFlexRow';

export type Options = [];

const debug = debugFactory('@rotki/eslint-plugin:no-redundant-flex-row');

/**
 * A class list region that is statically known at lint time: the raw string of
 * class names plus the source offset where that string's content begins.
 */
interface ClassListSource {
  value: string;
  /** Absolute source offset of the first character of `value`. */
  contentStart: number;
}

/**
 * Removes Tailwind's important modifier (`!flex-row` in v3, `flex-row!` in v4)
 * so the bare utility can be compared.
 */
function stripImportant(token: string): string {
  return token.replace(/^!/, '').replace(/!$/, '');
}

/**
 * True when the token applies unconditionally, i.e. it carries no variant
 * prefix such as `sm:`, `hover:` or `dark:`. Conditional variants are exactly
 * what makes a directional class meaningful, so they are never reported.
 */
function isUnconditional(token: string): boolean {
  return !token.includes(':');
}

function isFlexDisplay(token: string): boolean {
  if (!isUnconditional(token))
    return false;
  const base = stripImportant(token);
  return base === 'flex' || base === 'inline-flex';
}

function isFlexRow(token: string): boolean {
  if (!isUnconditional(token))
    return false;
  return stripImportant(token) === 'flex-row';
}

interface Token {
  text: string;
  /** Index of the token within its class list string. */
  start: number;
}

function tokenize(value: string): Token[] {
  const tokens: Token[] = [];
  const matcher = /\S+/g;
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = matcher.exec(value)) !== null)
    tokens.push({ start: match.index, text: match[0] });
  return tokens;
}

/**
 * Computes the range to remove for a redundant token, swallowing exactly one
 * run of adjacent whitespace (preferring the preceding whitespace) so the
 * surrounding class list stays tidy after the fix.
 */
function removalRange(value: string, token: Token, contentStart: number): Range {
  let startRel = token.start;
  let endRel = token.start + token.text.length;

  if (startRel > 0 && /\s/.test(value[startRel - 1])) {
    while (startRel > 0 && /\s/.test(value[startRel - 1]))
      startRel--;
  }
  else {
    while (endRel < value.length && /\s/.test(value[endRel]))
      endRel++;
  }

  return [contentStart + startRel, contentStart + endRel];
}

function reportRedundant(
  source: ClassListSource,
  context: RuleContext<MessageIds, Options>,
  sourceCode: ReturnType<typeof getSourceCode>,
): void {
  const tokens = tokenize(source.value);
  if (!tokens.some(token => isFlexDisplay(token.text)))
    return;

  for (const token of tokens) {
    if (!isFlexRow(token.text))
      continue;

    debug(`found redundant flex-row token '${token.text}'`);

    const tokenRange: Range = [
      source.contentStart + token.start,
      source.contentStart + token.start + token.text.length,
    ];
    const removal = removalRange(source.value, token, source.contentStart);

    context.report({
      data: { className: token.text },
      fix(fixer) {
        return fixer.removeRange(removal);
      },
      loc: {
        end: sourceCode.getLocFromIndex(tokenRange[1]),
        start: sourceCode.getLocFromIndex(tokenRange[0]),
      },
      messageId: 'redundantFlexRow',
    });
  }
}

/**
 * Extracts statically-known class list strings from a `:class` expression.
 * Only plain string literals (and single-quasi template literals with no
 * interpolation) are considered: anything conditional — object syntax,
 * arrays, ternaries or interpolated templates — is intentionally skipped,
 * since `flex-row` may legitimately be applied behind a runtime condition.
 */
function plainStringLists(expression: NonNullable<VAST.VExpressionContainer['expression']>): ClassListSource[] {
  if (expression.type === 'Literal' && typeof expression.value === 'string')
    return [{ contentStart: expression.range[0] + 1, value: expression.value }];

  if (
    expression.type === 'TemplateLiteral'
    && expression.expressions.length === 0
    && expression.quasis.length === 1
  ) {
    const quasi = expression.quasis[0];
    const cooked = quasi.value.cooked;
    if (cooked !== null)
      return [{ contentStart: quasi.range[0] + 1, value: cooked }];
  }

  return [];
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const sourceCode = getSourceCode(context);
    return defineTemplateBodyVisitor(context, {
      'VAttribute[directive=false][key.name="class"]': function (node: VAST.VAttribute) {
        if (!node.value || !node.value.value || !node.value.range)
          return;

        reportRedundant(
          { contentStart: node.value.range[0] + 1, value: node.value.value },
          context,
          sourceCode,
        );
      },
      'VAttribute[directive=true][key.name.name=\'bind\'][key.argument.name=\'class\'] > VExpressionContainer.value': function (node: VAST.VExpressionContainer) {
        if (!node.expression)
          return;

        for (const source of plainStringLists(node.expression))
          reportRedundant(source, context, sourceCode);
      },
    });
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'disallow redundant `flex-row` since `flex` already defaults to the row direction',
      recommendation: 'recommended',
    },
    fixable: 'code',
    messages: {
      redundantFlexRow: `'{{ className }}' is redundant because 'flex' already lays out in the row direction; remove it, or keep it only behind a conditional variant (e.g. 'sm:flex-row')`,
    },
    schema: [],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

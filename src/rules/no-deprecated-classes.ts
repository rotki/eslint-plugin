import type { AST as VAST } from 'vue-eslint-parser';
import type { Range, RuleContext } from '../types';
import debugFactory from 'debug';
import { createEslintRule, defineTemplateBodyVisitor, getSourceCode, getStaticPropertyName } from '../utils';

type ESLintExpression = VAST.ESLintExpression;

type VExpressionContainer = VAST.VExpressionContainer;

type VFilterSequenceExpression = VAST.VFilterSequenceExpression;

type VForExpression = VAST.VForExpression;

type VGenericExpression = VAST.VGenericExpression;

type VOnExpression = VAST.VOnExpression;

type VSlotScopeExpression = VAST.VSlotScopeExpression;

export const RULE_NAME = 'no-deprecated-classes';

export type MessageIds = 'replacedWith';

export type Options = [];

const debug = debugFactory('@rotki/eslint-plugin:no-deprecated-classes');

type RegexReplacer = [RegExp, (args: string[]) => string];

const stringReplacements = new Map<string, string>([
  ['d-block', 'block'],
  ['d-flex', 'flex'],
  ['flex-column', 'flex-col'],
  ['flex-grow-1', 'grow'],
  ['flex-grow-0', 'grow-0'],
  ['flex-shrink-1', 'shrink'],
  ['flex-shrink-0', 'shrink-0'],
  ['text--secondary', 'text-rui-text-secondary'],
  ['white--text', 'text-white'],
  ['primary--text', 'text-rui-primary'],
]);

const regexReplacements: RegexReplacer[] = [
  [
    /^align-(start|end|center|baseline|stretch)$/,
    ([align]) => `items-${align}`,
  ],
  [/^justify-space-(between|around)$/, ([justify]) => `justify-${justify}`],
  [
    /^align-self-(start|end|center|baseline|auto|strech)$/,
    ([align]) => `self-${align}`,
  ],
  [
    /^font-weight-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
    ([weight]) => `font-${weight}`,
  ],
  [/^text-(capitalize|uppercase|lowercase)$/, ([casing]) => casing],
  [
    /^([mp])([abelr-txy]?)-n(\d)$/,
    ([type, position, size]) => `-${type}${position === 'a' ? '' : position}-${size}`,
  ],
  [
    /^([mp])a-(\d)$/,
    ([type, size]) => `${type}-${size}`,
  ],
];

function findReplacement(className: string): string | undefined {
  const direct = stringReplacements.get(className);
  if (direct !== undefined)
    return direct;

  for (const [regex, replace] of regexReplacements) {
    const matches = regex.exec(className);
    if (matches)
      return replace(matches.slice(1));
  }
  return undefined;
}

function getRange(node: VAST.VAttribute | ExpressionType | VAST.ESLintTemplateElement): VAST.OffsetRange {
  if (node.type === 'VAttribute' && node.value && node.value.range)
    return node.value.range;

  return node.range;
}

function reportReplacement(
  className: string,
  replacement: string,
  node: VAST.VAttribute | ExpressionType | VAST.ESLintTemplateElement,
  context: RuleContext<MessageIds, Options>,
  source: ReturnType<typeof getSourceCode>,
  position: number = 1,
): void {
  debug(`found replacement ${replacement} for ${className}`);

  const initialRange = getRange(node);

  const range: Range = [
    initialRange[0] + position,
    initialRange[0] + position + className.length,
  ];

  const loc = {
    end: source.getLocFromIndex(range[1]),
    start: source.getLocFromIndex(range[0]),
  };

  context.report({
    data: {
      className,
      replacement,
    },
    fix(fixer) {
      return fixer.replaceTextRange(range, replacement);
    },
    loc,
    messageId: 'replacedWith',
  });
}

type ExpressionType =
  ESLintExpression
  | VFilterSequenceExpression
  | VForExpression
  | VOnExpression
  | VSlotScopeExpression
  | VGenericExpression;

interface FoundClass {
  className: string;
  reportNode: ExpressionType | VAST.ESLintTemplateElement;
  position: number;
}

function* extractClassNames(
  node: ExpressionType,
  textOnly: boolean = false,
): IterableIterator<FoundClass> {
  if (node.type === 'Literal') {
    const classNames = `${node.value}`;
    yield* classNames
      .split(/\s+/)
      .map(className => ({ className, position: classNames.indexOf(className) + 1, reportNode: node }));
    return;
  }
  if (node.type === 'TemplateLiteral') {
    for (const templateElement of node.quasis) {
      const classNames = templateElement.value.cooked;
      if (classNames === null)
        continue;

      yield* classNames
        .split(/\s+/)
        .map(className => ({ className, position: classNames.indexOf(className) + 1, reportNode: templateElement }));
    }
    for (const expr of node.expressions)
      yield* extractClassNames(expr, true);

    return;
  }
  if (node.type === 'BinaryExpression') {
    if (node.operator !== '+')
      return;

    yield* extractClassNames(node.left as ESLintExpression, true);
    yield* extractClassNames(node.right, true);
    return;
  }
  if (textOnly)
    return;

  if (node.type === 'ObjectExpression') {
    for (const prop of node.properties) {
      if (prop.type !== 'Property')
        continue;

      const classNames = getStaticPropertyName(prop);
      if (!classNames)
        continue;

      yield* classNames
        .split(/\s+/)
        .map(className => ({ className, position: classNames.indexOf(className) + 1, reportNode: prop.key }));
    }
    return;
  }
  if (node.type === 'ArrayExpression') {
    for (const element of node.elements) {
      if (element == null)
        continue;

      if (element.type === 'SpreadElement')
        continue;

      yield* extractClassNames(element);
    }
  }

  if (node.type === 'ConditionalExpression') {
    yield* extractClassNames(node.consequent);
    yield* extractClassNames(node.alternate);
  }
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const source = getSourceCode(context);
    return defineTemplateBodyVisitor(context, {
      'VAttribute[directive=false][key.name="class"]': function (node: VAST.VAttribute) {
        if (!node.value || !node.value.value)
          return;

        for (const className of node.value.value.split(/\s+/).filter(s => !!s)) {
          const replacement = findReplacement(className);
          const position = node.value.value.indexOf(className) + 1;

          if (!replacement)
            continue;

          reportReplacement(className, replacement, node, context, source, position);
        }
      },
      'VAttribute[directive=true][key.name.name=\'bind\'][key.argument.name=\'class\'] > VExpressionContainer.value': function (node: VExpressionContainer) {
        if (!node.expression)
          return;

        for (const { className, position, reportNode } of extractClassNames(node.expression)) {
          const replacement = findReplacement(className);
          if (!replacement)
            continue;

          reportReplacement(className, replacement, reportNode, context, source, position);
        }
      },
    });
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'disallow the usage of vuetify css classes since they are replaced with tailwindcss',
      recommendation: 'recommended',
    },
    fixable: 'code',
    messages: {
      replacedWith: `'{{ className }}' has been replaced with '{{ replacement }}'`,
    },
    schema: [],
    type: 'problem',
  },
  name: RULE_NAME,
});

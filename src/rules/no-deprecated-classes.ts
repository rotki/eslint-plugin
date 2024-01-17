import debugFactory from 'debug';
import { createEslintRule, defineTemplateBodyVisitor, getSourceCode, getStaticPropertyName } from '../utils';
import type {
  ESLintExpression,
  VExpressionContainer,
  VFilterSequenceExpression,
  VForExpression,
  VGenericExpression,
  VOnExpression,
  VSlotScopeExpression,
} from 'vue-eslint-parser/ast/nodes';
import type { Range, RuleContext } from '../types';
import type { AST as VAST } from 'vue-eslint-parser';

export const RULE_NAME = 'no-deprecated-classes';

export type MessageIds = 'replacedWith';

export type Options = [];

const debug = debugFactory('@rotki/eslint-plugin:no-deprecated-classes');

type StringReplacer = [string, string];

type RegexReplacer = [RegExp, (args: string[]) => string];

type Replacer = StringReplacer | RegexReplacer;

const replacements: Replacer[] = [
  ['d-block', 'block'],
  ['d-flex', 'flex'],
  ['flex-column', 'flex-col'],
  ['flex-grow-1', 'grow'],
  ['flex-grow-0', 'grow-0'],
  ['flex-shrink-1', 'shrink'],
  ['flex-shrink-0', 'shrink-0'],
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
];

function isString(replacement: Replacer): replacement is StringReplacer {
  return typeof replacement[0] === 'string';
}

function isRegex(replacement: Replacer): replacement is RegexReplacer {
  return replacement[0] instanceof RegExp;
}

function findReplacement(className: string): string | undefined {
  for (const replacement of replacements) {
    if (isString(replacement) && replacement[0] === className)
      return replacement[1];

    if (isRegex(replacement)) {
      const matches = (replacement[0].exec(className) || []).slice(1);
      const replace = replacement[1];
      if (matches.length > 0 && typeof replace === 'function')
        return replace(matches);
    }
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
  position: number = 1,
): void {
  debug(`found replacement ${replacement} for ${className}`);

  const source = getSourceCode(context);

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
    yield * classNames
      .split(/\s+/)
      .map(className => ({ className, position: classNames.indexOf(className) + 1, reportNode: node }));
    return;
  }
  if (node.type === 'TemplateLiteral') {
    for (const templateElement of node.quasis) {
      const classNames = templateElement.value.cooked;
      if (classNames === null)
        continue;

      yield * classNames
        .split(/\s+/)
        .map(className => ({ className, position: classNames.indexOf(className) + 1, reportNode: templateElement }));
    }
    for (const expr of node.expressions)
      yield * extractClassNames(expr, true);

    return;
  }
  if (node.type === 'BinaryExpression') {
    if (node.operator !== '+')
      return;

    yield * extractClassNames(node.left as ESLintExpression, true);
    yield * extractClassNames(node.right, true);
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

      yield * classNames
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

      yield * extractClassNames(element);
    }
  }

  if (node.type === 'ConditionalExpression') {
    yield * extractClassNames(node.consequent);
    yield * extractClassNames(node.alternate);
  }
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    return defineTemplateBodyVisitor(context, {
      'VAttribute[directive=false][key.name="class"]': function (node: VAST.VAttribute) {
        if (!node.value || !node.value.value)
          return;

        for (const className of node.value.value.split(/\s+/).filter(s => !!s)) {
          const replacement = findReplacement(className);
          const position = node.value.value.indexOf(className) + 1;

          if (!replacement)
            continue;

          reportReplacement(className, replacement, node, context, position);
        }
      },
      'VAttribute[directive=true][key.name.name=\'bind\'][key.argument.name=\'class\'] > VExpressionContainer.value': function (node: VExpressionContainer) {
        if (!node.expression)
          return;

        for (const { className, position, reportNode } of extractClassNames(node.expression)) {
          const replacement = findReplacement(className);
          if (!replacement)
            continue;

          reportReplacement(className, replacement, reportNode, context, position);
        }
      },
    });
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'disallow the usage of vuetify css classes since they are replaced with tailwindcss',
      recommended: 'recommended',
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

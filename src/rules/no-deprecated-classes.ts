import { defineTemplateBodyVisitor } from '../utils/index';
import { type Range, type RuleContext, type RuleListener } from '../types';
import { createRule } from '../utils/rule';
import type { AST as VAST } from 'vue-eslint-parser';

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

const create = (context: RuleContext): RuleListener =>
  defineTemplateBodyVisitor(context, {
    'VAttribute[key.name="class"]': function (node: VAST.VAttribute) {
      if (!node.value || !node.value.value) {
        return;
      }

      const classes = node.value.value.split(/\s+/).filter((s) => !!s);
      const source = context.getSourceCode();

      const replaced: StringReplacer[] = [];

      classes.forEach((className) => {
        for (const replacement of replacements) {
          if (isString(replacement) && replacement[0] === className) {
            replaced.push([className, replacement[1]]);
          }

          if (isRegex(replacement)) {
            const matches = (replacement[0].exec(className) || []).slice(1);
            const replace = replacement[1];
            if (matches.length > 0 && typeof replace === 'function') {
              return replaced.push([className, replace(matches)]);
            }
          }
        }
      });

      replaced.forEach((replacement) => {
        if (!node.value) {
          return;
        }
        const idx = node.value.value.indexOf(replacement[0]) + 1;
        const range: Range = [
          node.value.range[0] + idx,
          node.value.range[0] + idx + replacement[0].length,
        ];
        const loc = {
          start: source.getLocFromIndex(range[0]),
          end: source.getLocFromIndex(range[1]),
        };
        context.report({
          loc,
          messageId: 'replacedWith',
          data: {
            a: replacement[0],
            b: replacement[1],
          },
          fix(fixer) {
            return fixer.replaceTextRange(range, replacement[1]);
          },
        });
      });
    },
  });

export = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow the usage of vuetify css classes since they are replaced with tailwindcss',
      category: 'Recommended',
      url: 'https://rotki.github.io/eslint-plugin/rules/no-deprecated-classes',
      recommended: true,
    },
    messages: {
      replacedWith: `'{{ a }}' has been replaced with '{{ b }}'`,
    },
    fixable: 'code',
  },
  create,
});

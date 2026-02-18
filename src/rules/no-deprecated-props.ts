import type { AST as VAST } from 'vue-eslint-parser';
import createDebug from 'debug';
import { kebabCase, pascalCase } from 'scule';
import { createEslintRule, defineTemplateBodyVisitor } from '../utils';

const debug = createDebug('@rotki/eslint-plugin:no-deprecated-props');

export const RULE_NAME = 'no-deprecated-props';

export type MessageIds = 'replacedWith';

export type Options = [];

const replacements = {
  RuiRadio: {
    internalValue: 'value',
  },
} as const;

const replacementMaps = new Map(
  Object.entries(replacements).map(([tag, props]) => [
    tag,
    new Map(Object.entries(props).map(([prop, repl]) => [kebabCase(prop), { original: prop, replacement: repl }])),
  ]),
);

function hasReplacement(tag: string): boolean {
  return replacementMaps.has(tag);
}

function getPropName(node: VAST.VDirective | VAST.VAttribute): string | undefined {
  if (node.directive) {
    if (node.key.argument?.type !== 'VIdentifier')
      return undefined;
    return kebabCase(node.key.argument.rawName);
  }
  return kebabCase(node.key.rawName);
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    return defineTemplateBodyVisitor(context, {
      VAttribute(node: VAST.VAttribute | VAST.VDirective) {
        if (node.directive && (node.value?.type === 'VExpressionContainer' && (node.key.name.name !== 'bind' || !node.key.argument)))
          return;

        const tag = pascalCase(node.parent.parent.rawName);

        if (!hasReplacement(tag))
          return;

        debug(`${tag} has replacement properties`);

        const propName = getPropName(node);
        const propNameNode = node.directive ? node.key.argument : node.key;

        if (!propName || !propNameNode) {
          debug('could not get prop name and/or node');
          return;
        }

        const match = replacementMaps.get(tag)?.get(propName);
        if (match) {
          debug(`preparing a replacement for ${tag}:${propName} -> ${match.replacement}`);
          context.report({
            data: {
              prop: match.original,
              replacement: match.replacement,
            },
            fix(fixer) {
              return fixer.replaceText(propNameNode, match.replacement);
            },
            messageId: 'replacedWith',
            node: propNameNode,
          });
        }
      },
    });
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Replaces deprecated props with their replacements',
      recommendation: 'recommended',
    },
    fixable: 'code',
    messages: {
      replacedWith: `'{{ prop }}' has been replaced with '{{ replacement }}'`,
    },
    schema: [],
    type: 'problem',
  },
  name: RULE_NAME,
});

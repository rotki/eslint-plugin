import { kebabCase, pascalCase } from 'scule';
import createDebug from 'debug';
import { createEslintRule, defineTemplateBodyVisitor } from '../utils';
import type { AST as VAST } from 'vue-eslint-parser';

const debug = createDebug('@rotki/eslint-plugin:no-deprecated-props');

export const RULE_NAME = 'no-deprecated-props';

export type MessageIds = 'replacedWith';

export type Options = [];

const replacements = {
  RuiRadio: {
    internalValue: 'value',
  },
} as const;

function hasReplacement(tag: string): tag is (keyof typeof replacements) {
  return Object.prototype.hasOwnProperty.call(replacements, tag);
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

        Object.entries(replacements[tag]).forEach(([prop, replacement]) => {
          if (kebabCase(prop) === propName) {
            debug(`preparing a replacement for ${tag}:${propName} -> ${replacement}`);
            context.report({
              data: {
                prop,
                replacement,
              },
              fix(fixer) {
                return fixer.replaceText(propNameNode, replacement);
              },
              messageId: 'replacedWith',
              node: propNameNode,
            });
          }
        });
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

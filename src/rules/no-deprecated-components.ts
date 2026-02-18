import type { AST } from 'vue-eslint-parser';
import createDebug from 'debug';
import { pascalCase } from 'scule';
import { createEslintRule, defineTemplateBodyVisitor, getSourceCode } from '../utils';

type VElement = AST.VElement;

const debug = createDebug('@rotki/eslint-plugin:no-deprecated-components');

export const RULE_NAME = 'no-deprecated-components';

export type MessageIds = 'removed' | 'replacedWith' | 'deprecated';

export type Options = [{ legacy: boolean }];

// todo: remove after vuetify migration is complete.
const vuetify = {
  VApp: true,
  VAppBar: true,
  VAppBarNavIcon: true,
  VAutocomplete: true,
  VAvatar: true,
  VBottomSheet: true,
  VColorPicker: true,
  VCombobox: true,
  VDataFooter: true,
  VDataTable: true,
  VDialog: true,
  VDialogTransition: true,
  VExpansionPanel: true,
  VExpansionPanelContent: true,
  VExpansionPanelHeader: true,
  VExpansionPanels: true,
  VMain: true,
  VMenu: true,
  VNavigationDrawer: true,
  VPagination: true,
  VSelect: true,
  VSlider: true,
  VSnackbar: true,
  VSwitch: true,
  VTextField: true,
} as const;

const replacements = {
  DataTable: true,
  Fragment: false,
  ...vuetify,
} as const;

const skipInLegacy = new Set([
  'Fragment',
]);

function hasReplacement(tag: string): tag is (keyof typeof replacements) {
  return Object.prototype.hasOwnProperty.call(replacements, tag);
}

export default createEslintRule<Options, MessageIds>({
  create(context, optionsWithDefault) {
    const options = optionsWithDefault[0] || {};
    const legacy = options.legacy;

    const sourceCode = getSourceCode(context);
    if (sourceCode?.parserServices && !('getTemplateBodyTokenStore' in sourceCode.parserServices))
      throw new Error('cannot find getTemplateBodyTokenStore in parserServices');

    return defineTemplateBodyVisitor(context, {
      VElement(element: VElement) {
        const tag = pascalCase(element.rawName);

        if (!hasReplacement(tag))
          return;

        const replacement = replacements[tag];

        if (replacement || (legacy && skipInLegacy.has(tag))) {
          debug(`${tag} has been deprecated`);
          context.report({
            data: {
              name: tag,
            },
            messageId: 'deprecated',
            node: element,
          });
        }
        else {
          debug(`${tag} has will be removed`);
          context.report({
            data: {
              name: tag,
            },
            fix(fixer) {
              return [
                fixer.remove(element.startTag),
                ...(element.endTag ? [fixer.remove(element.endTag)] : []),
              ];
            },
            messageId: 'removed',
            node: element,
          });
        }
      },
    });
  },
  defaultOptions: [{ legacy: false }],
  meta: {
    docs: {
      description: 'Removes deprecated classes that do not exist anymore',
      recommendation: 'recommended',
    },
    fixable: 'code',
    messages: {
      deprecated: `'{{ name }}' has been deprecated`,
      removed: `'{{ name }}' has been removed`,
      replacedWith: `'{{ a }}' has been replaced with '{{ b }}'`,
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          legacy: {
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

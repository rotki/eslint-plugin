/* eslint-disable no-template-curly-in-string -- every fixture here is an interpolated key written inside a plain string */
import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule, { RULE_NAME } from '../../src/rules/no-interpolated-i18n-key';

const vueTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2022,
      parser: '@typescript-eslint/parser',
      sourceType: 'module',
    },
  },
});

const scriptTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
});

vueTester.run(RULE_NAME, rule, {
  valid: [
    // a plain key
    {
      filename: 'test.ts',
      code: 'const title = t(\'address_book.actions.add.error.title\');',
    },
    // a template literal with nothing interpolated is still a plain key
    {
      filename: 'test.ts',
      code: 'const title = t(`address_book.actions.add.error.title`);',
    },
    // the sanctioned escape hatches: identifier, member and index expressions
    {
      filename: 'test.ts',
      code: 'const title = t(titleKey);',
    },
    {
      filename: 'test.ts',
      code: 'const title = t(row.titleKey);',
    },
    {
      filename: 'test.ts',
      code: 'const title = t(HEADER_KEYS[entryType]);',
    },
    // interpolation in the named arguments says nothing about the key
    {
      filename: 'test.ts',
      code: 'const title = t(\'errors.title\', { message: `${error}` });',
    },
    // the key is assembled first, so no static prefix is exempted
    {
      filename: 'test.ts',
      code: [
        'const translationKey = `backend_mappings.events.history_event_subtype.${id}`;',
        't(translationKey);',
      ].join('\n'),
    },
    // not an i18n call
    {
      filename: 'test.ts',
      code: 'const path = join(`assets/${name}.svg`);',
    },
    // template usages of the escape hatch
    {
      filename: 'test.vue',
      code: '<template><span>{{ t(titleKey) }}</span></template>',
    },
    {
      filename: 'test.vue',
      code: '<template><i18n-t keypath="common.hello"/></template>',
    },
    {
      filename: 'test.vue',
      code: '<template><i18n-t :keypath="translationKey"/></template>',
    },
    // `path` on anything but an i18n component is an ordinary prop
    {
      filename: 'test.vue',
      code: '<template><file-link :path="`assets/${name}.svg`"/></template>',
    },
  ],
  invalid: [
    // the shape that exempts the whole subtree
    {
      filename: 'test.ts',
      code: 'const title = t(`address_book.actions.${key}.error.title`);',
      errors: [{ messageId: 'interpolatedKey' }],
    },
    // every function name the unused-key rule reads
    {
      filename: 'test.ts',
      code: 'const title = $t(`a.${key}.b`);',
      errors: [{ messageId: 'interpolatedKey' }],
    },
    {
      filename: 'test.ts',
      code: 'const exists = te(`a.${key}.b`);',
      errors: [{ messageId: 'interpolatedKey' }],
    },
    {
      filename: 'test.ts',
      code: 'const title = tc(`a.${key}.b`, 2);',
      errors: [{ messageId: 'interpolatedKey' }],
    },
    // member calls
    {
      filename: 'test.ts',
      code: 'const title = this.$t(`a.${key}.b`);',
      errors: [{ messageId: 'interpolatedKey' }],
    },
    // interpolation anywhere in the literal, not only after the first segment
    {
      filename: 'test.ts',
      code: 'const title = t(`${section}.title`);',
      errors: [{ messageId: 'interpolatedKey' }],
    },
    // one report per offending call
    {
      filename: 'test.ts',
      code: [
        'const message = t(`calendar.reminder.${key}_error.message`, { message });',
        'const title = t(`calendar.reminder.${key}_error.title`);',
      ].join('\n'),
      errors: [{ messageId: 'interpolatedKey' }, { messageId: 'interpolatedKey' }],
    },
    // inside a template mustache
    {
      filename: 'test.vue',
      code: '<template><span>{{ t(`a.${key}.b`) }}</span></template>',
      errors: [{ messageId: 'interpolatedKey' }],
    },
    // inside a bound attribute
    {
      filename: 'test.vue',
      code: '<template><span :title="t(`a.${key}.b`)"/></template>',
      errors: [{ messageId: 'interpolatedKey' }],
    },
    // inside the script block of an SFC
    {
      filename: 'test.vue',
      code: '<script setup lang="ts">\nconst title = t(`a.${key}.b`);\n</script>',
      errors: [{ messageId: 'interpolatedKey' }],
    },
    // the keypath binding of an i18n component
    {
      filename: 'test.vue',
      code: '<template><i18n-t :keypath="`a.${key}.b`"/></template>',
      errors: [{ messageId: 'interpolatedKeypath' }],
    },
    {
      filename: 'test.vue',
      code: '<template><i18n-t v-bind:path="`a.${key}.b`"/></template>',
      errors: [{ messageId: 'interpolatedKeypath' }],
    },
  ],
});

// The rule has to keep working when a `.ts` file is linted without vue-eslint-parser, i.e. with no
// template body visitor available.
scriptTester.run(`${RULE_NAME} (typescript parser)`, rule, {
  valid: [
    'const title = t(titleKey);',
    'const title = t(\'a.b.c\');',
  ],
  invalid: [
    {
      code: 'const title = t(`a.${key}.b`);',
      errors: [{ messageId: 'interpolatedKey' }],
    },
  ],
});

import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule, { RULE_NAME } from '../../src/rules/no-redundant-flex-row';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  },
});

tester.run(RULE_NAME, rule, {
  valid: [
    // base column with a conditional override is the canonical good case
    '<template><div class="flex flex-col sm:flex-row"/></template>',
    // flex-row only appears behind a variant prefix
    '<template><div class="flex sm:flex-row"/></template>',
    '<template><div class="flex md:flex-row lg:flex-col"/></template>',
    // flex-row without any flex display class is left alone (out of scope)
    '<template><div class="flex-row"/></template>',
    // unrelated flex utilities must not be matched
    '<template><div class="flex flex-row-reverse"/></template>',
    '<template><div class="flex flex-1 flex-wrap"/></template>',
    '<template><div class="flex flex-col"/></template>',
    '<template><div class="inline-flex flex-col"/></template>',
    // conditional flex display + conditional row
    '<template><div class="md:flex md:flex-row"/></template>',
    // dynamic object/array/ternary bindings are intentionally skipped
    '<template><div :class="{ \'flex-row\': isRow }" class="flex"/></template>',
    '<template><div :class="[\'flex\', cond ? \'flex-row\' : \'flex-col\']"/></template>',
    // eslint-disable-next-line no-template-curly-in-string -- fixture: interpolated template is skipped
    '<template><div :class="`flex ${dir}`"/></template>',
  ],
  invalid: [
    // the textbook redundancy
    {
      code: '<template><div class="flex flex-row"/></template>',
      output: '<template><div class="flex"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }],
    },
    // order independent
    {
      code: '<template><div class="flex-row flex"/></template>',
      output: '<template><div class="flex"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }],
    },
    // surrounded by other utilities
    {
      code: '<template><div class="p-4 flex flex-row items-center"/></template>',
      output: '<template><div class="p-4 flex items-center"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }],
    },
    // inline-flex also defaults to row
    {
      code: '<template><div class="inline-flex flex-row"/></template>',
      output: '<template><div class="inline-flex"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }],
    },
    // unconditional flex-row is redundant even when a conditional override exists
    {
      code: '<template><div class="flex flex-row sm:flex-col"/></template>',
      output: '<template><div class="flex sm:flex-col"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }],
    },
    // important modifier, both v3 and v4 syntaxes
    {
      code: '<template><div class="flex !flex-row"/></template>',
      output: '<template><div class="flex"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }],
    },
    {
      code: '<template><div class="flex flex-row!"/></template>',
      output: '<template><div class="flex"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }],
    },
    // multiple redundant tokens are each reported and removed
    {
      code: '<template><div class="flex flex-row gap-2 flex-row"/></template>',
      output: '<template><div class="flex gap-2"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }, { messageId: 'redundantFlexRow' }],
    },
    // plain string :class binding
    {
      code: '<template><div :class="\'flex flex-row\'"/></template>',
      output: '<template><div :class="\'flex\'"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }],
    },
    // single-quasi template literal :class binding
    {
      code: '<template><div :class="`flex flex-row`"/></template>',
      output: '<template><div :class="`flex`"/></template>',
      errors: [{ messageId: 'redundantFlexRow' }],
    },
  ],
});

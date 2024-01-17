import { RuleTester } from 'eslint';
import rule, { RULE_NAME } from '../../src/rules/no-deprecated-classes';

const vueParser = require.resolve('vue-eslint-parser');

const tester = new RuleTester({
  parser: vueParser,
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
});

tester.run(RULE_NAME, rule as never, {
  valid: [
    '<template><div class="flex flex-col"/></template>',
    '<template><div class="block"/></template>',
    '<template><div class="grow"/></template>',
    '<template><div class="justify-between"/></template>',
  ],
  invalid: [
    {
      code: '<template><div class="d-flex flex-column"/></template>',
      output: '<template><div class="flex flex-col"/></template>',
      errors: [{ messageId: 'replacedWith' }, { messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="d-block"/></template>',
      output: '<template><div class="block"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="flex-grow-1"/></template>',
      output: '<template><div class="grow"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="flex-grow-0"/></template>',
      output: '<template><div class="grow-0"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="flex-shrink-1"/></template>',
      output: '<template><div class="shrink"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="flex-shrink-0"/></template>',
      output: '<template><div class="shrink-0"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="align-center"/></template>',
      output: '<template><div class="items-center"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="justify-space-between"/></template>',
      output: '<template><div class="justify-between"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="align-self-center"/></template>',
      output: '<template><div class="self-center"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="font-weight-bold"/></template>',
      output: '<template><div class="font-bold"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: '<template><div class="text-uppercase"/></template>',
      output: '<template><div class="uppercase"/></template>',
      errors: [{ messageId: 'replacedWith' }],
    },
    {
      code: `
      <script>
      export default {
        data() {
          return {
            classA: 'align-self-center',
            classB: 'text-uppercase',
            enable: false
          }
        }
      }
      </script>
      <template>
        <div>
          <span :class="['abc text-uppercase cl', classA]"/>
          <span :class="{ 'abc text-uppercase cl': true, 'font-weight-bold': true, [classB]: true }"/>
          <span :class="enable ? 'abc text-uppercase cl' : 'lower'"/>
        </div>
      </template>
      `,
      output: `
      <script>
      export default {
        data() {
          return {
            classA: 'align-self-center',
            classB: 'text-uppercase',
            enable: false
          }
        }
      }
      </script>
      <template>
        <div>
          <span :class="['abc uppercase cl', classA]"/>
          <span :class="{ 'abc uppercase cl': true, 'font-bold': true, [classB]: true }"/>
          <span :class="enable ? 'abc uppercase cl' : 'lower'"/>
        </div>
      </template>
      `,
      errors: [
        { messageId: 'replacedWith' },
        { messageId: 'replacedWith' },
        { messageId: 'replacedWith' },
        { messageId: 'replacedWith' },
      ],
    },
  ],
});

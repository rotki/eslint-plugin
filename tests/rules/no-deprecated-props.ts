import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/no-deprecated-props';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
});

tester.run('no-deprecated-props', rule as never, {
  valid: [
    {
      filename: 'test.vue',
      code: `
         <script lang="ts">
         const val = ref('')         
         </script>
         <template>
            <div>
              <RuiRadio :value="val"/>
              <RuiRadio value="ok"/>
            </div>
         </template>
        `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <script lang="ts">
        const val = ref('')         
        </script>
        <template>
          <div>
            <RuiRadio :internal-value="val"/>
            <RuiRadio internal-value="ok"/>
          </div>
        </template>
      `,
      output: `
        <script lang="ts">
        const val = ref('')         
        </script>
        <template>
          <div>
            <RuiRadio :value="val"/>
            <RuiRadio value="ok"/>
          </div>
        </template>
      `,
      errors: [
        {
          messageId: 'replacedWith',
        },
        {
          messageId: 'replacedWith',
        },
      ],
    },
  ],
});

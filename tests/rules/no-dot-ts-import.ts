import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/no-dot-ts-import';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
});

tester.run('no-dot-ts-import', rule as never, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <script lang="ts" setup>
        import { something } from '@/packages/something'; 
        </script>        
      `.trim(),
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <script lang="ts" setup>
        import { something } from '@/packages/something.ts'; 
        </script>               
      `.trim(),
      output: `
        <script lang="ts" setup>
        import { something } from '@/packages/something'; 
        </script>               
      `.trim(),
      errors: [
        {
          messageId: 'invalidTSExtension',
        },
      ],
    },
  ],
});

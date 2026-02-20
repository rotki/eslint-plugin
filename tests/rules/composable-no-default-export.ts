import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/composable-no-default-export';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: '@typescript-eslint/parser',
    },
  },
});

tester.run('composable-no-default-export', rule as never, {
  valid: [
    {
      filename: 'use-counter.ts',
      code: `
        export function useCounter() {
          return { count: 0 };
        }
      `,
    },
    {
      filename: 'use-counter.ts',
      code: `
        export const useCounter = () => {
          return { count: 0 };
        };
      `,
    },
    {
      filename: 'utils.ts',
      code: `
        function helper() {}
        export default helper;
      `,
    },
  ],
  invalid: [
    {
      filename: 'use-counter.ts',
      code: `
        function useCounter() {
          return { count: 0 };
        }
        export default useCounter;
      `,
      errors: [{ messageId: 'noDefaultExport' }],
    },
    {
      filename: 'use-counter.ts',
      code: `
        const useCounter = () => {
          return { count: 0 };
        };
        export default useCounter;
      `,
      errors: [{ messageId: 'noDefaultExport' }],
    },
    {
      filename: 'test.vue',
      code: `
        <script lang="ts">
        function useCounter() {
          return { count: 0 };
        }
        export default useCounter;
        </script>
      `,
      errors: [{ messageId: 'noDefaultExport' }],
    },
  ],
});

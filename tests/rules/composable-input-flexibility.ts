import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/composable-input-flexibility';

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

tester.run('composable-input-flexibility', rule as never, {
  valid: [
    {
      filename: 'test.ts',
      code: `
        function useCounter(value: MaybeRefOrGetter<number>) {
          return { count: 0 };
        }
      `,
    },
    {
      filename: 'test.ts',
      code: `
        function useCounter(value: number) {
          return { count: 0 };
        }
      `,
    },
    {
      // Not a composable — should not flag
      filename: 'test.ts',
      code: `
        function setup(value: Ref<number>) {
          return { count: 0 };
        }
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
        function useCounter(value: Ref<number>) {
          return { count: 0 };
        }
      `,
      output: `
        function useCounter(value: MaybeRefOrGetter<number>) {
          return { count: 0 };
        }
      `,
      errors: [{ messageId: 'preferMaybeRefOrGetter' }],
    },
    {
      filename: 'test.ts',
      code: `
        const useLabel = (text: Ref<string>) => {
          return { label: text };
        };
      `,
      output: `
        const useLabel = (text: MaybeRefOrGetter<string>) => {
          return { label: text };
        };
      `,
      errors: [{ messageId: 'preferMaybeRefOrGetter' }],
    },
  ],
});

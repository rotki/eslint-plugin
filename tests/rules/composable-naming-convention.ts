import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/composable-naming-convention';

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

tester.run('composable-naming-convention', rule as never, {
  valid: [
    {
      filename: 'test.ts',
      code: `
        function useCounter(options: UseCounterOptions): UseCounterReturn {
          return { count: 0 };
        }
      `,
    },
    {
      filename: 'test.ts',
      code: `
        const useCounter = (options: UseCounterOptions): UseCounterReturn => {
          return { count: 0 };
        };
      `,
    },
    {
      // No type annotation — should not report
      filename: 'test.ts',
      code: `
        function useCounter(options) {
          return { count: 0 };
        }
      `,
    },
    {
      // Non-Use* type should not be checked
      filename: 'test.ts',
      code: `
        function useCounter(options: CounterConfig) {
          return { count: 0 };
        }
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
        function useCounter(options: UseFooOptions): UseFooReturn {
          return { count: 0 };
        }
      `,
      errors: [
        { messageId: 'optionsNaming' },
        { messageId: 'returnNaming' },
      ],
    },
    {
      filename: 'test.ts',
      code: `
        const useCounter = (options: UseWrongOptions): UseWrongReturn => {
          return { count: 0 };
        };
      `,
      errors: [
        { messageId: 'optionsNaming' },
        { messageId: 'returnNaming' },
      ],
    },
  ],
});

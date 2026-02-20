import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/require-jsdoc-on-composable-options';

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

tester.run('require-jsdoc-on-composable-options', rule as never, {
  valid: [
    {
      filename: 'test.ts',
      code: `
        interface UseCounterOptions {
          /** The initial count value */
          initial: number;
          /** The step value */
          step: number;
        }
      `,
    },
    {
      // Non-matching interface name
      filename: 'test.ts',
      code: `
        interface CounterConfig {
          initial: number;
        }
      `,
    },
    {
      // Empty interface
      filename: 'test.ts',
      code: `
        interface UseCounterOptions {}
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
        interface UseCounterOptions {
          initial: number;
        }
      `,
      errors: [{ messageId: 'missingJsdoc' }],
    },
    {
      filename: 'test.ts',
      code: `
        interface UseCounterOptions {
          /** The initial count value */
          initial: number;
          step: number;
        }
      `,
      errors: [{ messageId: 'missingJsdoc' }],
    },
    {
      filename: 'test.ts',
      code: `
        interface UseToggleOptions {
          initialValue: boolean;
          onChange: () => void;
        }
      `,
      errors: [
        { messageId: 'missingJsdoc' },
        { messageId: 'missingJsdoc' },
      ],
    },
  ],
});

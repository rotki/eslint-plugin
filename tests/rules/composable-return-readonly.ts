import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/composable-return-readonly';

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

tester.run('composable-return-readonly', rule as never, {
  valid: [
    {
      filename: 'test.ts',
      code: `
        function useCounter() {
          const count = ref(0);
          return { count: readonly(count) };
        }
      `,
    },
    {
      // Non-ref variable returned — should not flag
      filename: 'test.ts',
      code: `
        function useCounter() {
          const increment = () => {};
          return { increment };
        }
      `,
    },
    {
      // Outside composable — should not flag
      filename: 'test.ts',
      code: `
        function setup() {
          const count = ref(0);
          return { count };
        }
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
        function useCounter() {
          const count = ref(0);
          return { count };
        }
      `,
      output: `
        function useCounter() {
          const count = ref(0);
          return { count: readonly(count) };
        }
      `,
      errors: [{ messageId: 'wrapReadonly' }],
    },
    {
      filename: 'test.ts',
      code: `
        function useCounter() {
          const count = ref(0);
          const double = computed(() => count.value * 2);
          return { count, double };
        }
      `,
      output: `
        function useCounter() {
          const count = ref(0);
          const double = computed(() => count.value * 2);
          return { count: readonly(count), double: readonly(double) };
        }
      `,
      errors: [
        { messageId: 'wrapReadonly' },
        { messageId: 'wrapReadonly' },
      ],
    },
    {
      filename: 'test.ts',
      code: `
        const useToggle = () => {
          const active = shallowRef(false);
          return { active };
        };
      `,
      output: `
        const useToggle = () => {
          const active = shallowRef(false);
          return { active: readonly(active) };
        };
      `,
      errors: [{ messageId: 'wrapReadonly' }],
    },
  ],
});

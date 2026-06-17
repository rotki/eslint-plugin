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

tester.run('composable-return-readonly', rule, {
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
    {
      // Computed returned directly — already readonly, should not flag
      filename: 'test.ts',
      code: `
        function useCounter() {
          const count = ref(0);
          const double = computed(() => count.value * 2);
          return { count: readonly(count), double };
        }
      `,
    },
    {
      // Computed returned with shorthand — already readonly, should not flag
      filename: 'test.ts',
      code: `
        function useDouble() {
          const double = computed(() => 2);
          return { double };
        }
      `,
    },
    {
      // Default `model` prefix — writable by convention, should not flag (shorthand)
      filename: 'test.ts',
      code: `
        function useInput() {
          const modelValue = ref('');
          return { modelValue };
        }
      `,
    },
    {
      // Default `model` prefix — writable by convention, should not flag (non-shorthand value)
      filename: 'test.ts',
      code: `
        function useInput() {
          const modelText = ref('');
          return { text: modelText };
        }
      `,
    },
    {
      // Custom prefixes — `writable` exempt
      filename: 'test.ts',
      options: [{ writablePrefixes: ['writable'] }],
      code: `
        function useToggle() {
          const writableActive = shallowRef(false);
          return { writableActive };
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
      errors: [{
        messageId: 'wrapReadonly',
        suggestions: [
          {
            messageId: 'suggestWrapReadonly',
            output: `
        function useCounter() {
          const count = ref(0);
          return { count: readonly(count) };
        }
      `,
          },
        ],
      }],
    },
    {
      // Only ref should be flagged, computed should not
      filename: 'test.ts',
      code: `
        function useCounter() {
          const count = ref(0);
          const double = computed(() => count.value * 2);
          return { count, double };
        }
      `,
      errors: [
        {
          messageId: 'wrapReadonly',
          suggestions: [
            {
              messageId: 'suggestWrapReadonly',
              output: `
        function useCounter() {
          const count = ref(0);
          const double = computed(() => count.value * 2);
          return { count: readonly(count), double };
        }
      `,
            },
          ],
        },
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
      errors: [{
        messageId: 'wrapReadonly',
        suggestions: [
          {
            messageId: 'suggestWrapReadonly',
            output: `
        const useToggle = () => {
          const active = shallowRef(false);
          return { active: readonly(active) };
        };
      `,
          },
        ],
      }],
    },
    // With autofix enabled
    {
      filename: 'test.ts',
      options: [{ autofix: true }],
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
    // Custom writablePrefixes replaces the default — `model` is no longer exempt
    {
      filename: 'test.ts',
      options: [{ writablePrefixes: ['writable'] }],
      code: `
        function useInput() {
          const modelValue = ref('');
          return { modelValue };
        }
      `,
      errors: [{
        messageId: 'wrapReadonly',
        suggestions: [
          {
            messageId: 'suggestWrapReadonly',
            output: `
        function useInput() {
          const modelValue = ref('');
          return { modelValue: readonly(modelValue) };
        }
      `,
          },
        ],
      }],
    },
    // Prefix without a camelCase boundary — `models` is not exempt by `model`
    {
      filename: 'test.ts',
      code: `
        function useList() {
          const models = ref([]);
          return { models };
        }
      `,
      errors: [{
        messageId: 'wrapReadonly',
        suggestions: [
          {
            messageId: 'suggestWrapReadonly',
            output: `
        function useList() {
          const models = ref([]);
          return { models: readonly(models) };
        }
      `,
          },
        ],
      }],
    },
    // Unnecessary readonly() on computed — should flag
    {
      filename: 'test.ts',
      code: `
        function useCounter() {
          const double = computed(() => 2);
          return { double: readonly(double) };
        }
      `,
      errors: [{
        messageId: 'unnecessaryReadonly',
        suggestions: [
          {
            messageId: 'suggestRemoveReadonly',
            output: `
        function useCounter() {
          const double = computed(() => 2);
          return { double: double };
        }
      `,
          },
        ],
      }],
    },
    // Unnecessary readonly() on computed with autofix
    {
      filename: 'test.ts',
      options: [{ autofix: true }],
      code: `
        function useDouble() {
          const double = computed(() => 2);
          return { value: readonly(double) };
        }
      `,
      output: `
        function useDouble() {
          const double = computed(() => 2);
          return { value: double };
        }
      `,
      errors: [{ messageId: 'unnecessaryReadonly' }],
    },
  ],
});

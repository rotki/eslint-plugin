import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/composable-prefer-shallowref';

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

tester.run('composable-prefer-shallowref', rule as never, {
  valid: [
    {
      filename: 'test.ts',
      code: `
        function useCounter() {
          const count = shallowRef(0);
          return { count };
        }
      `,
    },
    {
      // ref with non-literal (object) — should not flag
      filename: 'test.ts',
      code: `
        function useCounter() {
          const data = ref({ key: 'value' });
          return { data };
        }
      `,
    },
    {
      // ref outside composable — should not flag
      filename: 'test.ts',
      code: `
        function setup() {
          const count = ref(0);
          return { count };
        }
      `,
    },
    {
      filename: 'test.vue',
      code: `
        <script setup lang="ts">
        const count = ref(0);
        </script>
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
          const count = shallowRef(0);
          return { count };
        }
      `,
      errors: [{ messageId: 'preferShallowRef' }],
    },
    {
      filename: 'test.ts',
      code: `
        function useToggle() {
          const active = ref(false);
          return { active };
        }
      `,
      output: `
        function useToggle() {
          const active = shallowRef(false);
          return { active };
        }
      `,
      errors: [{ messageId: 'preferShallowRef' }],
    },
    {
      filename: 'test.ts',
      code: `
        const useLabel = () => {
          const label = ref('hello');
          return { label };
        };
      `,
      output: `
        const useLabel = () => {
          const label = shallowRef('hello');
          return { label };
        };
      `,
      errors: [{ messageId: 'preferShallowRef' }],
    },
  ],
});

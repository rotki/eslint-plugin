import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/composable-ssr-safety';

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

tester.run('composable-ssr-safety', rule as never, {
  valid: [
    {
      filename: 'test.ts',
      code: `
        function useWindowSize() {
          onMounted(() => {
            const width = window.innerWidth;
          });
        }
      `,
    },
    {
      filename: 'test.ts',
      code: `
        function useWindowSize() {
          if (typeof window !== 'undefined') {
            const width = window.innerWidth;
          }
        }
      `,
    },
    {
      filename: 'test.ts',
      code: `
        function useWindowSize() {
          typeof window !== 'undefined' && window.innerWidth;
        }
      `,
    },
    {
      // Not inside a composable
      filename: 'test.ts',
      code: `
        function setup() {
          const width = window.innerWidth;
        }
      `,
    },
    {
      filename: 'test.ts',
      code: `
        function useDevice() {
          onBeforeMount(() => {
            const ua = navigator.userAgent;
          });
        }
      `,
    },
    {
      filename: 'test.ts',
      code: `
        function useWindowSize() {
          const width = typeof window !== 'undefined' ? window.innerWidth : 0;
        }
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
        function useWindowSize() {
          const width = window.innerWidth;
        }
      `,
      errors: [{ messageId: 'ssrUnsafe' }],
    },
    {
      filename: 'test.ts',
      code: `
        function useDevice() {
          const ua = navigator.userAgent;
        }
      `,
      errors: [{ messageId: 'ssrUnsafe' }],
    },
    {
      filename: 'test.ts',
      code: `
        function useTitle() {
          document.title = 'Hello';
        }
      `,
      errors: [{ messageId: 'ssrUnsafe' }],
    },
    {
      filename: 'test.ts',
      code: `
        const useScroll = () => {
          const y = window.scrollY;
        };
      `,
      errors: [{ messageId: 'ssrUnsafe' }],
    },
  ],
});

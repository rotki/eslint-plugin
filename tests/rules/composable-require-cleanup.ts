import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/composable-require-cleanup';

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

tester.run('composable-require-cleanup', rule as never, {
  valid: [
    {
      filename: 'test.ts',
      code: `
        function useResize() {
          window.addEventListener('resize', handler);
          onUnmounted(() => {
            window.removeEventListener('resize', handler);
          });
        }
      `,
    },
    {
      filename: 'test.ts',
      code: `
        function useInterval() {
          const id = setInterval(handler, 1000);
          onScopeDispose(() => clearInterval(id));
        }
      `,
    },
    {
      // No side effects — should not flag
      filename: 'test.ts',
      code: `
        function useCounter() {
          const count = ref(0);
          return { count };
        }
      `,
    },
    {
      // Not a composable — should not flag
      filename: 'test.ts',
      code: `
        function setup() {
          window.addEventListener('resize', handler);
        }
      `,
    },
    {
      filename: 'test.ts',
      code: `
        function useObserver() {
          const observer = new MutationObserver(callback);
          onBeforeUnmount(() => observer.disconnect());
        }
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
        function useResize() {
          window.addEventListener('resize', handler);
        }
      `,
      errors: [{ messageId: 'requireCleanup' }],
    },
    {
      filename: 'test.ts',
      code: `
        function useInterval() {
          setInterval(handler, 1000);
        }
      `,
      errors: [{ messageId: 'requireCleanup' }],
    },
    {
      filename: 'test.ts',
      code: `
        const useTimeout = () => {
          setTimeout(handler, 1000);
        };
      `,
      errors: [{ messageId: 'requireCleanup' }],
    },
    {
      filename: 'test.ts',
      code: `
        function useObserver() {
          const observer = new MutationObserver(callback);
        }
      `,
      errors: [{ messageId: 'requireCleanup' }],
    },
    {
      filename: 'test.ts',
      code: `
        function useMultiple() {
          window.addEventListener('resize', handler);
          setInterval(handler, 1000);
        }
      `,
      errors: [
        { messageId: 'requireCleanup' },
        { messageId: 'requireCleanup' },
      ],
    },
  ],
});

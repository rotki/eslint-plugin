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

tester.run('composable-input-flexibility', rule, {
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
      // Not a composable:should not flag
      filename: 'test.ts',
      code: `
        function setup(value: Ref<number>) {
          return { count: 0 };
        }
      `,
    },
    {
      // Written back via set():must stay a writable Ref
      filename: 'test.ts',
      code: `
        function useToggle(state: Ref<boolean>) {
          function toggle() {
            set(state, !get(state));
          }
          return { toggle };
        }
      `,
    },
    {
      // Written back via .value assignment:must stay a writable Ref
      filename: 'test.ts',
      code: `
        function useCounter(count: Ref<number>) {
          function reset() {
            count.value = 0;
          }
          return { reset };
        }
      `,
    },
    {
      // Written back via update expression:must stay a writable Ref
      filename: 'test.ts',
      code: `
        function useCounter(count: Ref<number>) {
          function increment() {
            count.value++;
          }
          return { increment };
        }
      `,
    },
    {
      // Written back via compound assignment:must stay a writable Ref
      filename: 'test.ts',
      code: `
        function useCounter(count: Ref<number>) {
          function add(n: number) {
            count.value += n;
          }
          return { add };
        }
      `,
    },
    {
      // Arrow composable, written back via set()
      filename: 'test.ts',
      code: `
        const useThing = (writable: Ref<number>) => {
          set(writable, 1);
          return { writable };
        };
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
      errors: [{
        messageId: 'preferMaybeRefOrGetter',
        suggestions: [
          {
            messageId: 'suggestMaybeRefOrGetter',
            output: `
        function useCounter(value: MaybeRefOrGetter<number>) {
          return { count: 0 };
        }
      `,
          },
        ],
      }],
    },
    {
      filename: 'test.ts',
      code: `
        const useLabel = (text: Ref<string>) => {
          return { label: text };
        };
      `,
      errors: [{
        messageId: 'preferMaybeRefOrGetter',
        suggestions: [
          {
            messageId: 'suggestMaybeRefOrGetter',
            output: `
        const useLabel = (text: MaybeRefOrGetter<string>) => {
          return { label: text };
        };
      `,
          },
        ],
      }],
    },
    {
      // Mixed params: read-only `label` is flagged, written-back `count` is exempt
      filename: 'test.ts',
      code: `
        function useThing(label: Ref<string>, count: Ref<number>) {
          set(count, 1);
          return { label, count };
        }
      `,
      errors: [{
        messageId: 'preferMaybeRefOrGetter',
        suggestions: [
          {
            messageId: 'suggestMaybeRefOrGetter',
            output: `
        function useThing(label: MaybeRefOrGetter<string>, count: Ref<number>) {
          set(count, 1);
          return { label, count };
        }
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
  ],
});

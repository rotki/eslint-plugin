import { RuleTester } from 'eslint';
import rule from '../../src/rules/consistent-ref-type-annotation';

const vueParser = require.resolve('vue-eslint-parser');

const tester = new RuleTester({
  parser: vueParser,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },
});

tester.run('consistent-refs', rule as never, {
  valid: [
    {
      filename: 'test.vue',
      code: `
      <script setup lang="ts">
        const text = ref<string>('');
        const comp = computed<string>(() => '');
      </script>        
        `,
    },
    {
      filename: 'test.vue',
      code: `
      <script setup lang="ts">
        const text = computed(() => '');
      </script>
      `,
      options: [
        {
          allowInference: true,
        },
      ],
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
      <script setup lang="ts">
        const normal = '';
        const text: Ref<string> = ref('');
        const comp: ComputedRef<string> = computed(() => '');
        const balances: Ref<XswapBalances> = ref<XswapBalances>({});
      </script>            
      `,
      output: `
      <script setup lang="ts">
        const normal = '';
        const text = ref<string>('');
        const comp = computed<string>(() => '');
        const balances = ref<XswapBalances>({});
      </script>            
      `,
      errors: [
        {
          messageId: 'inconsistent',
        },
        {
          messageId: 'inconsistent',
        },
        {
          messageId: 'inconsistent',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
      <script setup lang="ts">
        const inferRef = ref('');
        const inferComputed = computed(() => '');
      </script>
      `,
      output: `
      <script setup lang="ts">
        const inferRef = ref('');
        const inferComputed = computed(() => '');
      </script>
      `,
      errors: [
        {
          messageId: 'missingType',
        },
        {
          messageId: 'missingType',
        },
      ],
    },
  ],
});

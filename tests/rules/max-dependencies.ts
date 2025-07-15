import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/max-dependencies';

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

tester.run('max-dependencies', rule as never, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <script lang="ts" setup>
        import { ref } from 'vue';
        import { computed } from 'vue';
        import { watch } from 'vue';
        </script>        
      `.trim(),
      options: [{ max: 5, ignoreTypeImports: false }],
    },
    {
      filename: 'test.vue',
      code: `
        <script lang="ts" setup>
        import type { Ref } from 'vue';
        import type { ComputedRef } from 'vue';
        import type { WatchStopHandle } from 'vue';
        import { ref } from 'vue';
        import { computed } from 'vue';
        import { watch } from 'vue';
        </script>        
      `.trim(),
      options: [{ max: 3, ignoreTypeImports: true }],
    },
    {
      filename: 'test.vue',
      code: `
        <script lang="ts" setup>
        import { ref } from 'vue';
        </script>        
      `.trim(),
      options: [{ max: 20, ignoreTypeImports: false }],
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <script lang="ts" setup>
        import { ref } from 'vue';
        import { computed } from 'vue';
        import { watch } from 'vue';
        import { reactive } from 'vue';
        </script>               
      `.trim(),
      options: [{ max: 3, ignoreTypeImports: false }],
      errors: [
        {
          messageId: 'maxDependencies',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script lang="ts" setup>
        import type { Ref } from 'vue';
        import type { ComputedRef } from 'vue';
        import { ref } from 'vue';
        import { computed } from 'vue';
        import { watch } from 'vue';
        </script>               
      `.trim(),
      options: [{ max: 3, ignoreTypeImports: false }],
      errors: [
        {
          messageId: 'maxDependencies',
        },
      ],
    },
    {
      filename: 'test.vue',
      code: `
        <script lang="ts" setup>
        import { ref } from 'vue';
        import { computed } from 'vue';
        import { watch } from 'vue';
        import { reactive } from 'vue';
        import { nextTick } from 'vue';
        </script>               
      `.trim(),
      options: [{ max: 2, ignoreTypeImports: false }],
      errors: [
        {
          messageId: 'maxDependencies',
        },
      ],
    },
  ],
});

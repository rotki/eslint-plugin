import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/no-legacy-library-import';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
});

tester.run('no-legacy-library-import', rule as never, {
  valid: [
    {
      filename: 'test.vue',
      code: `
        <script>
        import { DataTableHeader } from '@rotki/ui-library';
        </script>
        <template>
          <div> hey </div>
        </template>        
        `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: `
        <script>
        import { DataTableHeader } from '@rotki/ui-library-compat';
        </script>
        <template>
          <div> hey </div>
        </template>
        `,
      output: `
        <script>
        import { DataTableHeader } from '@rotki/ui-library';
        </script>
        <template>
          <div> hey </div>
        </template>
        `,
      errors: [
        { messageId: 'replacedWith' },
      ],
    },
    {
      filename: 'test.ts',
      code: `
        import { DataTableHeader } from '@rotki/ui-library-compat';
        
        const test = 1;
        `,
      output: `
        import { DataTableHeader } from '@rotki/ui-library';
        
        const test = 1;
        `,
      errors: [{ messageId: 'replacedWith' }],
    },

    {
      filename: 'test.ts',
      code: `
        import { DataTableHeader } from '@rotki/ui-library-compat/style.css';
        
        const test = 1;
        `,
      output: `
        import { DataTableHeader } from '@rotki/ui-library/style.css';
        
        const test = 1;
        `,
      errors: [{ messageId: 'replacedWith' }],
    },
  ],
});

import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/no-comment-run';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2020,
      parser: '@typescript-eslint/parser',
      sourceType: 'module',
    },
  },
});

tester.run('no-comment-run', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: `
// One line is fine.
const timeout = 5000;
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
// A line here.

// And another after a blank line.
const timeout = 5000;
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
// v8 ignore next
// c8 ignore next
handler(payload);
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
/// <reference types="vite/client" />
/// <reference types="vue-i18n" />
/// <reference path="./globals.d.ts" />
/// <reference lib="dom" />
/// <reference no-default-lib="true" />
export {};
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
/*
 * A block comment spanning lines is not a run.
 */
const timeout = 5000;
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
const first = 1; // trailing
const second = 2; // trailing at a different column
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
const colors = {
  debug: '\\u001B[36m', // cyan
  trace: '\\u001B[90m', // gray
};
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
const first = 1; // trailing
// a single own-line comment after it
const second = 2;
      `.trim(),
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
// The first line of prose.
// The second is what makes this a run.
const timeout = 5000;
      `.trim(),
      errors: [{ messageId: 'run' }],
    },
    {
      filename: 'test.ts',
      code: `
// v8 ignore next
// and a line of prose mixed into the run
handler(payload);
      `.trim(),
      errors: [{ messageId: 'run' }],
    },
    {
      filename: 'test.ts',
      code: `
/// <reference types="vite/client" />
// and a line of prose mixed into the run
export {};
      `.trim(),
      errors: [{ messageId: 'run' }],
    },
    {
      filename: 'test.ts',
      code: `
/// not a reference, just prose behind a slash
/// neither is this
export {};
      `.trim(),
      errors: [{ messageId: 'run' }],
    },
    {
      filename: 'test.ts',
      code: `
// one
// two
// three
const timeout = 5000;
      `.trim(),
      errors: [{ messageId: 'run' }],
    },
    {
      filename: 'test.ts',
      code: `
const first = 1; // trailing
// prose the trailing comment does not shield
// and the second line that makes it a run
const second = 2;
      `.trim(),
      errors: [{ messageId: 'run' }],
    },
    {
      filename: 'test.vue',
      code: `
<script setup lang="ts">
// A run inside an SFC.
// Still a run.
const timeout = 5000;
</script>
      `.trim(),
      errors: [{ messageId: 'run' }],
    },
  ],
});

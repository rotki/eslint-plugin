import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/no-conditional-empty-object-spread';

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

tester.run('no-conditional-empty-object-spread', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: `
const payload = { ...base, limit };
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
const payload = { ...(enabled ? full : partial) };
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
const payload = { ...base };
if (cursor)
  payload.cursor = cursor;
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
const values = [...(enabled ? items : [])];
      `.trim(),
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
const payload = { ...base, ...(cursor ? { cursor } : {}) };
      `.trim(),
      errors: [{ messageId: 'conditionalSpread' }],
    },
    {
      filename: 'test.ts',
      code: `
const payload = { ...base, ...(cursor ? {} : { cursor }) };
      `.trim(),
      errors: [{ messageId: 'conditionalSpread' }],
    },
    {
      filename: 'test.ts',
      code: `
const payload = { ...base, ...(cursor && { cursor }) };
      `.trim(),
      errors: [{ messageId: 'conditionalSpread' }],
    },
    {
      filename: 'test.vue',
      code: `
<script setup lang="ts">
const payload = { ...base, ...(cursor ? { cursor } : {}) };
</script>
      `.trim(),
      errors: [{ messageId: 'conditionalSpread' }],
    },
  ],
});

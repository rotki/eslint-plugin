import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/no-unknown-parameters';

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

tester.run('no-unknown-parameters', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: `
function label(account: Account): string {
  return account.label;
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
promise.catch((error: unknown) => notify(error));
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
function wrap(message: string, cause: unknown): Error {
  return new Error(message, { cause });
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
function isAccount(value: unknown): value is Account {
  return typeof value === 'object';
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
function parse(payload: unknown): Account {
  return AccountSchema.parse(payload);
}
      `.trim(),
      options: [{ allowNames: ['payload'] }],
    },
    {
      filename: 'test.ts',
      code: `
function handle(problem: unknown): void {}
      `.trim(),
      options: [{ allowNames: ['problem'] }],
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
function parse(payload: unknown): Account {
  return AccountSchema.parse(payload);
}
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'payload' } }],
    },
    {
      filename: 'test.ts',
      code: `
const transform = (value: unknown): string => String(value);
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'value' } }],
    },
    {
      filename: 'test.ts',
      code: `
function fallback(data: unknown = {}): void {}
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'data' } }],
    },
    {
      filename: 'test.ts',
      code: `
function collect(...values: unknown[]): void {}
const single = (value: string | unknown): void => {};
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'value' } }],
    },
    {
      filename: 'test.ts',
      code: `
interface Handler {
  handle: (payload: unknown) => void;
}
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'payload' } }],
    },
    {
      filename: 'test.ts',
      code: `
interface Codec {
  decode(raw: unknown): Account;
}
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'raw' } }],
    },
    {
      filename: 'test.ts',
      code: `
class Store {
  constructor(private readonly seed: unknown) {}
}
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'seed' } }],
    },
    {
      filename: 'test.ts',
      code: `
function check({ value }: { value: unknown }, other: unknown): void {}
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'other' } }],
    },
    {
      filename: 'test.ts',
      code: `
const render = ({ nested }: unknown): void => {};
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: '{ nested }' } }],
    },
    {
      filename: 'test.ts',
      code: `
function collect(...rest: unknown): void {}
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'rest' } }],
    },
    {
      filename: 'test.vue',
      code: `
<script setup lang="ts">
function parse(payload: unknown): void {}
</script>
      `.trim(),
      errors: [{ messageId: 'unknownParameter', data: { parameter: 'payload' } }],
    },
  ],
});

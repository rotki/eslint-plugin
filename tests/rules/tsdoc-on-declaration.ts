import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/tsdoc-on-declaration';

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

tester.run('tsdoc-on-declaration', rule, {
  valid: [
    {
      filename: 'test.ts',
      code: `
/** Returns the display name for an account. */
function accountLabel(account: Account): string {
  return account.label;
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
// A comment separated by a blank line documents nothing below it.

function accountLabel(account: Account): string {
  return account.label;
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
// v8 ignore next
function accountLabel(account: any): string {
  return account.label;
}
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
// A plain value may still be introduced by a line comment.
const timeout = 5000;
      `.trim(),
    },
    {
      filename: 'test.ts',
      code: `
// More than one declarator is not a documented function declaration.
const first = (): number => 1, second = 2;
      `.trim(),
    },
  ],
  invalid: [
    {
      filename: 'test.ts',
      code: `
// Returns the display name for an account.
function accountLabel(account: Account): string {
  return account.label;
}
      `.trim(),
      errors: [{ messageId: 'useTsdoc', data: { kind: 'function' } }],
    },
    {
      filename: 'test.ts',
      code: `
// The shape of an account row.
interface Account {
  label: string;
}
      `.trim(),
      errors: [{ messageId: 'useTsdoc', data: { kind: 'interface' } }],
    },
    {
      filename: 'test.ts',
      code: `
// A named union of the states a row can be in.
type RowState = 'idle' | 'loading';
      `.trim(),
      errors: [{ messageId: 'useTsdoc', data: { kind: 'type' } }],
    },
    {
      filename: 'test.ts',
      code: `
// Documented through the export.
export function accountLabel(account: Account): string {
  return account.label;
}
      `.trim(),
      errors: [{ messageId: 'useTsdoc', data: { kind: 'function' } }],
    },
    {
      filename: 'test.ts',
      code: `
// A const holding a function is a function.
const accountLabel = (account: Account): string => account.label;
      `.trim(),
      errors: [{ messageId: 'useTsdoc', data: { kind: 'function' } }],
    },
    {
      filename: 'test.ts',
      code: `
// The kinds of thing an account can be.
enum AccountKind {
  Owned,
  Tracked,
}
      `.trim(),
      errors: [{ messageId: 'useTsdoc', data: { kind: 'enum' } }],
    },
  ],
});

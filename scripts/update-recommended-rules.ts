/**
 * Forked from https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/scripts/update-recommended-rules.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import rules from './lib/rules';
import { format } from './lib/utils';

main();

async function main() {
  // recommended.ts
  writeFileSync(
    resolve(__dirname, '../src/configs/recommended.ts'),
    await format(
      `/** DON'T EDIT THIS FILE; was created by scripts. */
export = {
  extends: [require.resolve('./base')],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es6: true
  },
  rules: {
    ${rules
      .filter((rule) => rule.recommended)
      .map((rule) => `'${rule.id}': 'warn' as const,`)
      .join('\n        ')}
  },
}`,
      resolve(__dirname, '../src/configs/recommended.ts'),
    ),
  );
}

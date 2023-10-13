/**
 * Forked from https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/scripts/update.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createIndex } from './lib/utils';
import { updateRuleDocs } from './update-rule-docs';
import './update-docs-index';

// recommended rules.
import './update-recommended-rules';
updateRuleDocs();

main();

async function main() {
  // indices.
  for (const pairs of [
    [resolve(__dirname, '../src/configs')],
    [resolve(__dirname, '../src/rules')],
    [resolve(__dirname, '../src/utils'), '', true],
  ] as const) {
    const [dirPath, prefix, all] = pairs;
    writeFileSync(`${dirPath}.ts`, await createIndex(dirPath, prefix, all));
  }
}

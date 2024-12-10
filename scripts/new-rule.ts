/**
 * Forked from https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/scripts/new-rule.ts
 */
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import process from 'node:process';
import url from 'node:url';

const logger = console;

// main
((ruleId) => {
  if (ruleId == null) {
    logger.error('Usage: npm run new <RuleID>');
    process.exitCode = 1;
    return;
  }
  if (!/^[\w-]+$/u.test(ruleId)) {
    logger.error('Invalid RuleID \'%s\'.', ruleId);
    process.exitCode = 1;
    return;
  }

  const dirname = url.fileURLToPath(new URL('.', import.meta.url));

  const ruleFile = resolve(dirname, `../src/rules/${ruleId}.ts`);
  const testFile = resolve(dirname, `../tests/rules/${ruleId}.ts`);
  const docFile = resolve(dirname, `../docs/rules/${ruleId}.md`);

  writeFileSync(
    ruleFile,
    `import { createEslintRule } from '../utils'

export const RULE_NAME='${ruleId}';
export type MessageIds='';
export type Options = [];

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: '...',
    docs: {
      description: '...',
    },
    fixable: null,
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {}
  }
})
`,
  );
  writeFileSync(
    testFile,
    `import { RuleTester } from 'eslint'
import rule from '../../src/rules/${ruleId}'
import vueParser from 'vue-eslint-parser';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
});


tester.run("${ruleId}", rule as never, {
    valid: [
      {
        filename: 'test.vue',
        code: \`        
        \`,
      },
    ],
    invalid: [
      {
        filename: 'test.vue',
        code: \`       
        \`,
        errors: [
          {},{},{},
        ],
      },
    ],
})
`,
  );
  writeFileSync(
    docFile,
    `---
title: '@rotki/${ruleId}'
description: description
---

# @rotki/${ruleId}

> description

## :book: Rule Details

This rule reports ???.

<eslint-code-block>

<!-- eslint-skip -->

\`\`\`vue
<script>
/* eslint @rotki/${ruleId}: "error" */
</script>

<!-- ✓ GOOD -->


<!-- ✗ BAD -->

\`\`\`

</eslint-code-block>

## :gear: Options

\`\`\`json
{
  "@rotki/${ruleId}": ["error", {

  }]
}
\`\`\`

-

`,
  );

  const editor = process.env.LAUNCH_EDITOR;
  if (editor) {
    execSync(`${editor} "${ruleFile}"`);
    execSync(`${editor} "${testFile}"`);
    execSync(`${editor} "${docFile}"`);
  }
})(process.argv[2]);

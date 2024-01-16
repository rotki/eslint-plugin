/**
 * Forked from https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/scripts/new-rule.ts
 */
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import process from 'node:process';

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

  const ruleFile = resolve(__dirname, `../src/rules/${ruleId}.ts`);
  const testFile = resolve(__dirname, `../tests/rules/${ruleId}.ts`);
  const docFile = resolve(__dirname, `../docs/rules/${ruleId}.md`);

  writeFileSync(
    ruleFile,
    `import type { RuleContext, RuleListener } from '../types'
import { createRule } from '../utils/rule'

export = createRule({
  meta: {
    type: '...',
    docs: {
      description: '...',
      category: 'Best Practices',
      url: 'https://rotki.github.io/eslint-plugin/rules/${ruleId}.html',
      recommended: false
    },
    fixable: null,
    schema: []
  },
  create(context: RuleContext): RuleListener {
    return {}
  }
})
`,
  );
  writeFileSync(
    testFile,
    `import { RuleTester } from 'eslint'
import rule from '../../../src/rules/${ruleId}'

const vueParser = require.resolve('vue-eslint-parser')

const tester = new RuleTester({
    parser: vueParser,
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

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

  execSync(`code "${ruleFile}"`);
  execSync(`code "${testFile}"`);
  execSync(`code "${docFile}"`);
})(process.argv[2]);

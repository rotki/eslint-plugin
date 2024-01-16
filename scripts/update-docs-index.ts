/**
 * Forked from https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/scripts/update-docs-index.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type Options, format } from 'prettier';
import { type RuleInfo, withCategories } from './lib/rules';

const prettierrc: Options = {
  semi: true,
  singleQuote: true,
};

function toTableRow(rule: RuleInfo) {
  const mark = `${rule.recommended ? ':star:' : ''}${
    rule.fixable ? ':black_nib:' : ''
  }`;
  const link = `[@rotki/<wbr>${rule.name}](./${rule.name}.html)`;
  const description = rule.description || '(no description)';
  return `| ${link} | ${description} | ${mark} |`;
}

function toCategorySection({
  category,
  rules,
}: {
  category: string;
  rules: RuleInfo[];
}) {
  return `## ${category}

<!--prettier-ignore-->
| Rule ID | Description |    |
|:--------|:------------|:---|
${rules.map(toTableRow).join('\n')}
`;
}

const filePath = resolve(__dirname, '../docs/rules/index.md');
const content = `# Available Rules

- :star: mark: the rule which is enabled by \`plugin:@rotki/recommended\` preset.
- :black_nib: mark: the rule which is fixable by \`eslint --fix\` command.

${withCategories.map(toCategorySection).join('\n')}
`;

async function main() {
  writeFileSync(
    filePath,
    await format(content, { filepath: filePath, ...prettierrc }),
  );
}

main();

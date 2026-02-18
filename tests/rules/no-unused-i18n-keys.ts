import { join } from 'node:path';
import { RuleTester } from 'eslint';
import * as jsoncParser from 'jsonc-eslint-parser';
import * as yamlParser from 'yaml-eslint-parser';
import rule, { RULE_NAME } from '../../src/rules/no-unused-i18n-keys';
import { resetCache } from '../../src/rules/no-unused-i18n-keys/key-collector';
import { extractLinkedKeys } from '../../src/rules/no-unused-i18n-keys/key-matching';
import { extractKeysFromSfcI18nBlock } from '../../src/rules/no-unused-i18n-keys/vue-template';

const fixturesDir = join(__dirname, '..', 'fixtures', 'i18n');
const srcDir = join(fixturesDir, 'src');

const ruleOptions = [{
  extensions: ['.vue', '.ts'],
  ignoreKeys: [],
  src: srcDir,
}] as const;

const jsonTester = new RuleTester({
  languageOptions: {
    parser: jsoncParser,
  },
});

const yamlTester = new RuleTester({
  languageOptions: {
    parser: yamlParser,
  },
});

beforeEach(() => {
  resetCache();
});

jsonTester.run(`${RULE_NAME} (json)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        bound: { key: 'Bound value' },
        check: { key: 'Check value' },
        comp: { key: 'Component value' },
        directive: { key: 'Directive value' },
        store: { key: 'Store value' },
        template: { key: 'Template value' },
        used: { key: 'Used value' },
      }, null, 2),
      options: ruleOptions,
    },
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        prefix: { one: 'Prefix one', two: 'Prefix two' },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [
    {
      filename: 'locales/en.json',
      code: `{
  "used": {
    "key": "Used value"
  },
  "unused": {
    "key": "Unused value"
  }
}`,
      output: '{\n  "used": {\n    "key": "Used value"\n  },\n  "unused": {\n    \n  }\n}',
      options: ruleOptions,
      errors: [{ messageId: 'unused' }],
    },
    {
      filename: 'locales/en.json',
      code: `{
  "orphan": "Totally unused",
  "store": {
    "key": "Store value"
  }
}`,
      output: `{
  "store": {
    "key": "Store value"
  }
}`,
      options: ruleOptions,
      errors: [{ messageId: 'unused' }],
    },
  ],
});

jsonTester.run(`${RULE_NAME} (json/parent-key)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        prefix: { one: 'One', two: 'Two' },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/ignore-patterns)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        ignored: { key: 'Value' },
      }, null, 2),
      options: [{
        ...ruleOptions[0],
        ignoreKeys: ['ignored.*'],
      }],
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/linked-messages)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: `{
  "used": {
    "key": "Used value"
  },
  "alias": "@:used.key"
}`,
      options: [{
        ...ruleOptions[0],
        ignoreKeys: ['alias'],
      }],
    },
  ],
  invalid: [
    {
      filename: 'locales/en.json',
      code: `{
  "target": "Target value",
  "alias": "@:target"
}`,
      output: '{\n  "target": "Target value"\n}',
      options: ruleOptions,
      errors: [{ messageId: 'unused' }],
    },
  ],
});

jsonTester.run(`${RULE_NAME} (json/linked-preserves-target)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: `{
  "used": {
    "key": "Used value"
  },
  "ref": {
    "key": "@:store.key"
  }
}`,
      options: [{
        ...ruleOptions[0],
        ignoreKeys: ['ref.*'],
      }],
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/bound-attribute)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        bound: { key: 'Bound value' },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [
    {
      filename: 'locales/en.json',
      code: `{
  "bound": {
    "key": "Bound value"
  },
  "not_bound": "Not used anywhere"
}`,
      output: `{
  "bound": {
    "key": "Bound value"
  }
}`,
      options: ruleOptions,
      errors: [{ messageId: 'unused' }],
    },
  ],
});

jsonTester.run(`${RULE_NAME} (json/non-locale-file)`, rule, {
  valid: [
    {
      filename: 'package.json',
      code: JSON.stringify({ something: 'not a locale' }),
      options: ruleOptions,
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/template-literal-in-template)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        tpl_inline: { key: 'Template literal inline' },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/tc-usage)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        choice: { key: 'Choice value' },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/member-expression)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        member: { key: 'Member expression value' },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/dollar-t-in-template)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        dollar_t: { key: '$t in template' },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/i18n-t-path-attr)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        path: { key: 'Path attribute value' },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/linked-braced-syntax)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: `{
  "used": {
    "key": "Used value"
  },
  "alias": "@:{used.key}"
}`,
      options: [{
        ...ruleOptions[0],
        ignoreKeys: ['alias'],
      }],
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/multiple-unused)`, rule, {
  valid: [],
  invalid: [
    {
      filename: 'locales/en.json',
      code: `{
  "used": {
    "key": "Used value"
  },
  "unused_a": "Not used",
  "unused_b": "Not used either"
}`,
      output: `{
  "used": {
    "key": "Used value"
  },
  "unused_b": "Not used either"
}`,
      options: ruleOptions,
      errors: [
        { messageId: 'unused' },
        { messageId: 'unused' },
      ],
    },
  ],
});

jsonTester.run(`${RULE_NAME} (json/all-unused)`, rule, {
  valid: [],
  invalid: [
    {
      filename: 'locales/en.json',
      code: `{
  "nope_a": "Not used",
  "nope_b": "Not used either"
}`,
      output: `{
  "nope_b": "Not used either"
}`,
      options: ruleOptions,
      errors: [
        { messageId: 'unused' },
        { messageId: 'unused' },
      ],
    },
  ],
});

jsonTester.run(`${RULE_NAME} (json/ignore-non-matching)`, rule, {
  valid: [],
  invalid: [
    {
      filename: 'locales/en.json',
      code: `{
  "ignored": {
    "key": "Ignored value"
  },
  "not_ignored": {
    "key": "Not ignored"
  }
}`,
      output: '{\n  "ignored": {\n    "key": "Ignored value"\n  },\n  "not_ignored": {\n    \n  }\n}',
      options: [{
        ...ruleOptions[0],
        ignoreKeys: ['ignored.*'],
      }],
      errors: [{ messageId: 'unused' }],
    },
  ],
});

jsonTester.run(`${RULE_NAME} (json/ignore-glob-nested)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        deep: { nested: { ignored: 'Deep value' } },
      }, null, 2),
      options: [{
        ...ruleOptions[0],
        ignoreKeys: ['deep.*'],
      }],
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/sfc-i18n-block)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        en: { local: { key: 'Local value from SFC block' } },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [],
});

jsonTester.run(`${RULE_NAME} (json/deeply-nested)`, rule, {
  valid: [
    {
      filename: 'locales/en.json',
      code: JSON.stringify({
        used: { key: 'Used value' },
      }, null, 2),
      options: ruleOptions,
    },
  ],
  invalid: [
    {
      filename: 'locales/en.json',
      code: `{
  "a": {
    "b": {
      "c": {
        "d": "Deep unused"
      }
    }
  },
  "used": {
    "key": "Used value"
  }
}`,
      output: '{\n  "a": {\n    "b": {\n      "c": {\n        \n      }\n    }\n  },\n  "used": {\n    "key": "Used value"\n  }\n}',
      options: ruleOptions,
      errors: [{ messageId: 'unused' }],
    },
  ],
});

jsonTester.run(`${RULE_NAME} (json/wildcard-partial-match)`, rule, {
  valid: [],
  invalid: [
    {
      filename: 'locales/en.json',
      code: `{
  "prefix": {
    "one": "One",
    "two": "Two"
  },
  "other_prefix": {
    "one": "Other one"
  }
}`,
      output: '{\n  "prefix": {\n    "one": "One",\n    "two": "Two"\n  },\n  "other_prefix": {\n    \n  }\n}',
      options: ruleOptions,
      errors: [{ messageId: 'unused' }],
    },
  ],
});

yamlTester.run(`${RULE_NAME} (yaml)`, rule, {
  valid: [
    {
      filename: 'locales/en.yaml',
      code: `used:\n  key: Used value\nstore:\n  key: Store value`,
      options: ruleOptions,
    },
  ],
  invalid: [
    {
      filename: 'locales/en.yaml',
      code: `used:\n  key: Used value\nunused:\n  key: Unused value`,
      output: `used:\n  key: Used value\nunused:\n  `,
      options: ruleOptions,
      errors: [{ messageId: 'unused' }],
    },
    {
      filename: 'locales/en.yaml',
      code: `orphan: Totally unused\nstore:\n  key: Store value`,
      output: `store:\n  key: Store value`,
      options: ruleOptions,
      errors: [{ messageId: 'unused' }],
    },
  ],
});

yamlTester.run(`${RULE_NAME} (yaml/linked-messages)`, rule, {
  valid: [
    {
      filename: 'locales/en.yaml',
      code: `used:\n  key: Used value\nalias: "@:used.key"`,
      options: [{
        ...ruleOptions[0],
        ignoreKeys: ['alias'],
      }],
    },
  ],
  invalid: [
    {
      filename: 'locales/en.yaml',
      code: `target: Target value\nalias: "@:target"`,
      output: `target: Target value`,
      options: ruleOptions,
      errors: [{ messageId: 'unused' }],
    },
  ],
});

yamlTester.run(`${RULE_NAME} (yaml/ignore-patterns)`, rule, {
  valid: [
    {
      filename: 'locales/en.yaml',
      code: `ignored:\n  key: Ignored value`,
      options: [{
        ...ruleOptions[0],
        ignoreKeys: ['ignored.*'],
      }],
    },
  ],
  invalid: [
    {
      filename: 'locales/en.yaml',
      code: `ignored:\n  key: Ignored value\nnot_ignored:\n  key: Not ignored`,
      output: `ignored:\n  key: Ignored value\nnot_ignored:\n  `,
      options: [{
        ...ruleOptions[0],
        ignoreKeys: ['ignored.*'],
      }],
      errors: [{ messageId: 'unused' }],
    },
  ],
});

describe('extractLinkedKeys', () => {
  it('extracts @:key syntax', () => {
    expect(extractLinkedKeys('@:some.key')).toEqual(['some.key']);
  });

  it('extracts @:{key} braced syntax', () => {
    expect(extractLinkedKeys('@:{braced.key}')).toEqual(['braced.key']);
  });

  it('extracts @.modifier:key syntax', () => {
    expect(extractLinkedKeys('@.upper:some.key')).toEqual(['some.key']);
  });

  it('extracts multiple linked keys with modifiers', () => {
    expect(extractLinkedKeys('Hello @.capitalize:greeting and @.lower:farewell!'))
      .toEqual(['greeting', 'farewell']);
  });
});

describe('extractKeysFromSfcI18nBlock', () => {
  it('extracts keys from valid JSON i18n block', () => {
    const content = `<template><div /></template>\n<i18n>{"en":{"hello":"world"}}</i18n>`;
    const keys = new Set<string>();
    extractKeysFromSfcI18nBlock(content, keys);
    expect(keys).toContain('en.hello');
  });

  it('warns on invalid JSON (e.g. JSON5) in i18n block', () => {
    const content = `<template><div /></template>\n<i18n>{ key: 'value', // comment\n}</i18n>`;
    const keys = new Set<string>();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    extractKeysFromSfcI18nBlock(content, keys);

    expect(keys.size).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse <i18n> block as JSON'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('JSON5, it is not supported'),
    );
    warnSpy.mockRestore();
  });
});

import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule from '../../src/rules/no-deprecated-components';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
});

tester.run('no-deprecated-components', rule as never, {
  valid: [],
  invalid: [
    {
      filename: 'test.vue',
      code: `<template><Fragment><div></div></Fragment></template>`,
      output: `<template><div></div></template>`,
      errors: [
        { messageId: 'removed' },
      ],
    },
    {
      filename: 'test.vue',
      code: `<template><DataTable><div></div></DataTable></template>`,
      errors: [
        { messageId: 'deprecated' },
      ],
    },
    {
      filename: 'test.vue',
      code: `<template><Fragment><div></div></Fragment></template>`,
      options: [
        {
          legacy: true,
        },
      ],
      errors: [
        { messageId: 'deprecated' },
      ],
    },
    {
      filename: 'test.vue',
      code: `<template><VAppBar><div></div></VAppBar></template>`,
      errors: [
        { messageId: 'deprecated' },
      ],
    },
  ],
});

import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-deprecated-components';

const vueParser = require.resolve('vue-eslint-parser');

const tester = new RuleTester({
  parser: vueParser,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
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
      output: `<template><Fragment><div></div></Fragment></template>`,
      options: [
        {
          legacy: true,
        },
      ],
      errors: [
        { messageId: 'deprecated' },
      ],
    },
  ],
});

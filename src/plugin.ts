import pkg from '../package.json' assert { type: 'json' };
import noDeprecatedClasses from './rules/no-deprecated-classes';
import type { ESLint } from 'eslint';

const plugin = {
  meta: {
    name: '@rotki/eslint-plugin',
    version: pkg.version,
  },
  rules: {
    'no-deprecated-classes': noDeprecatedClasses,
  },
} satisfies ESLint.Plugin;

export default plugin;

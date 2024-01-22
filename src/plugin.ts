import pkg from '../package.json' assert { type: 'json' };
import noDeprecatedClasses from './rules/no-deprecated-classes';
import noDeprecatedComponents from './rules/no-deprecated-components';
import type { ESLint } from 'eslint';

const plugin = {
  meta: {
    name: '@rotki/eslint-plugin',
    version: pkg.version,
  },
  rules: {
    'no-deprecated-classes': noDeprecatedClasses,
    'no-deprecated-components': noDeprecatedComponents,
  },
} satisfies ESLint.Plugin;

export default plugin;

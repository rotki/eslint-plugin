import type { ESLint } from 'eslint';
import pkg from '../package.json' assert { type: 'json' };
import consistentRefTypeAnnotation from './rules/consistent-ref-type-annotation';
import noDeprecatedClasses from './rules/no-deprecated-classes';
import noDeprecatedComponents from './rules/no-deprecated-components';
import noDeprecatedProps from './rules/no-deprecated-props';
import noDotTsImport from './rules/no-dot-ts-imports';
import noLegacyLibraryImport from './rules/no-legacy-library-import';

const plugin = {
  meta: {
    name: '@rotki/eslint-plugin',
    version: pkg.version,
  },
  rules: {
    'consistent-ref-type-annotation': consistentRefTypeAnnotation,
    'no-deprecated-classes': noDeprecatedClasses,
    'no-deprecated-components': noDeprecatedComponents,
    'no-deprecated-props': noDeprecatedProps,
    'no-dot-ts-imports': noDotTsImport,
    'no-legacy-library-import': noLegacyLibraryImport,
  },
} satisfies ESLint.Plugin;

export default plugin;

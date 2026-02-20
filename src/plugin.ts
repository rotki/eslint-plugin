import type { ESLint } from 'eslint';
import pkg from '../package.json' assert { type: 'json' };
import composableInputFlexibility from './rules/composable-input-flexibility';
import composableNamingConvention from './rules/composable-naming-convention';
import composableNoDefaultExport from './rules/composable-no-default-export';
import composablePreferShallowref from './rules/composable-prefer-shallowref';
import composableRequireCleanup from './rules/composable-require-cleanup';
import composableReturnReadonly from './rules/composable-return-readonly';
import composableSsrSafety from './rules/composable-ssr-safety';
import consistentRefTypeAnnotation from './rules/consistent-ref-type-annotation';
import maxDependencies from './rules/max-dependencies';
import noDeprecatedClasses from './rules/no-deprecated-classes';
import noDeprecatedComponents from './rules/no-deprecated-components';
import noDeprecatedProps from './rules/no-deprecated-props';
import noDotTsImport from './rules/no-dot-ts-imports';
import noLegacyLibraryImport from './rules/no-legacy-library-import';
import noUnusedI18nKeys from './rules/no-unused-i18n-keys/index';
import requireJsdocOnComposableOptions from './rules/require-jsdoc-on-composable-options';

const plugin = {
  meta: {
    name: '@rotki/eslint-plugin',
    version: pkg.version,
  },
  rules: {
    'composable-input-flexibility': composableInputFlexibility,
    'composable-naming-convention': composableNamingConvention,
    'composable-no-default-export': composableNoDefaultExport,
    'composable-prefer-shallowref': composablePreferShallowref,
    'composable-require-cleanup': composableRequireCleanup,
    'composable-return-readonly': composableReturnReadonly,
    'composable-ssr-safety': composableSsrSafety,
    'consistent-ref-type-annotation': consistentRefTypeAnnotation,
    'max-dependencies': maxDependencies,
    'no-deprecated-classes': noDeprecatedClasses,
    'no-deprecated-components': noDeprecatedComponents,
    'no-deprecated-props': noDeprecatedProps,
    'no-dot-ts-imports': noDotTsImport,
    'no-legacy-library-import': noLegacyLibraryImport,
    'no-unused-i18n-keys': noUnusedI18nKeys,
    'require-jsdoc-on-composable-options': requireJsdocOnComposableOptions,
  },
} satisfies ESLint.Plugin;

export default plugin;

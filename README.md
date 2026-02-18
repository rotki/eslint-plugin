# @rotki/eslint-plugin

[![npm version](https://img.shields.io/npm/v/@rotki/eslint-plugin.svg)](https://www.npmjs.com/package/@rotki/eslint-plugin)

An ESLint plugin for rotki projects that provides custom rules and configurations to maintain consistent code quality.

## Overview

This ESLint plugin is designed specifically for rotki projects, drawing inspiration from established plugins like:

- [intlify/eslint-plugin-vue-i18n](https://github.com/intlify/eslint-plugin-vue-i18n)
- [vuetifyjs/eslint-plugin-vuetify](https://github.com/vuetifyjs/eslint-plugin-vuetify)

## Installation

```bash
# Using pnpm (recommended)
pnpm add -D @rotki/eslint-plugin

# Using npm
npm install --save-dev @rotki/eslint-plugin

# Using yarn
yarn add -D @rotki/eslint-plugin
```

## Usage

Use the recommended configuration in your ESLint flat config:

```js
import rotkiPlugin from '@rotki/eslint-plugin';

export default [
  rotkiPlugin.configs['recommended-flat'],
];
```

Or configure individual rules:

<!-- eslint-disable perfectionist/sort-imports -->

```js
import * as jsoncParser from 'jsonc-eslint-parser';
import rotkiPlugin from '@rotki/eslint-plugin';

export default [
  {
    plugins: { '@rotki': rotkiPlugin },
  },
  {
    files: ['**/src/locales/*.json'],
    languageOptions: { parser: jsoncParser },
    rules: {
      '@rotki/no-unused-i18n-keys': ['error', {
        src: 'src',
        extensions: ['.ts', '.vue'],
        ignoreKeys: ['backend_mappings.*'],
      }],
    },
  },
];
```

<!-- eslint-enable perfectionist/sort-imports -->

## Rules

| Rule                                                                                                         | Description                                                               | Fixable     |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ----------- |
| [consistent-ref-type-annotation](https://rotki.github.io/eslint-plugin/rules/consistent-ref-type-annotation) | Ensures consistent type annotation position for ref, computed assignments | :black_nib: |
| [max-dependencies](https://rotki.github.io/eslint-plugin/rules/max-dependencies)                             | Enforce a maximum number of dependencies per file                         |             |
| [no-deprecated-classes](https://rotki.github.io/eslint-plugin/rules/no-deprecated-classes)                   | Disallow deprecated vuetify css classes                                   | :black_nib: |
| [no-deprecated-components](https://rotki.github.io/eslint-plugin/rules/no-deprecated-components)             | Disallow deprecated components                                            | :black_nib: |
| [no-deprecated-props](https://rotki.github.io/eslint-plugin/rules/no-deprecated-props)                       | Replace deprecated props with their replacements                          | :black_nib: |
| [no-dot-ts-imports](https://rotki.github.io/eslint-plugin/rules/no-dot-ts-imports)                           | Disallow .ts extension in import statements                               | :black_nib: |
| [no-legacy-library-import](https://rotki.github.io/eslint-plugin/rules/no-legacy-library-import)             | Disallow imports from @rotki/ui-library-compat                            | :black_nib: |
| [no-unused-i18n-keys](https://rotki.github.io/eslint-plugin/rules/no-unused-i18n-keys)                       | Disallow unused i18n keys in locale files                                 | :black_nib: |

## Documentation

For detailed rule options and configuration,
please visit our [documentation](https://rotki.github.io/eslint-plugin).

<details>
<summary><h2>Testing Rules with Rotki</h2></summary>

To test rules against the real rotki codebase and benchmark performance:

### Setup

1. Build the plugin:

```bash
pnpm run build
```

2. Install it in the rotki frontend via `file:` protocol:

```bash
cd ../rotki/rotki/frontend
# Update package.json: "@rotki/eslint-plugin": "file:../../eslint-plugin"
pnpm install --no-frozen-lockfile
```

### Benchmarking

Create minimal ESLint configs that isolate individual rules, then time them against all locale files:

```bash
# Intlify rule
time npx eslint -c bench-intlify.config.js 'app/src/locales/*.json'

# Rotki rule
time npx eslint -c bench-rotki.config.js 'app/src/locales/*.json'
```

### Benchmark Results (rotki frontend, 7 locale files, ~1.1MB total)

| Rule                               | Average Time |
| ---------------------------------- | ------------ |
| `@intlify/vue-i18n/no-unused-keys` | ~71s         |
| `@rotki/no-unused-i18n-keys`       | ~5s          |

The rotki rule is ~14x faster due to file-level caching, early bail-out on files without i18n calls, and avoiding the `vue-i18n` settings/localeDir resolution overhead.

</details>

## Contributing

Contributions are welcome!
Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a Pull Request.
The guide includes detailed information about:

- Project prerequisites
- Development setup
- Commit message conventions
- Code style and linting
- Pull request process

## License

[AGPL-3.0](./LICENSE.md) License &copy; 2023- [Rotki Solutions GmbH](https://github.com/rotki)

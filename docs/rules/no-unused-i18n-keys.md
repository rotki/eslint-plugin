---
title: '@rotki/no-unused-i18n-keys'
description: disallow unused i18n keys in locale files
since: v1.3.0
---

# @rotki/no-unused-i18n-keys

> disallow unused i18n keys in locale files

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports i18n keys defined in JSON or YAML locale files that are not referenced anywhere in the source code. It scans `.vue` and `.ts` files for usages of `t()`, `te()`, `tc()`, `$t()`, `$te()`, `$tc()`, `this.$t()`, `<i18n-t keypath="...">`, `<i18n-t path="...">`, `v-t` directives, and template literals like `t(`prefix.${dynamic}`)` (matched as wildcard prefixes).

The rule also recognizes linked messages (`@:key` and `@:{key}`) within locale files and treats them as used keys.

### JSON locale file

<eslint-code-block fix>

<!-- eslint-skip -->

```json
// ✓ GOOD — all keys are used in source files
{
  "greeting": "Hello",
  "farewell": "Goodbye"
}

// ✗ BAD — "unused_key" is not referenced anywhere
{
  "greeting": "Hello",
  "unused_key": "This is never used"
}
```

</eslint-code-block>

### YAML locale file

<eslint-code-block fix>

<!-- eslint-skip -->

```yaml
# ✓ GOOD — all keys are used in source files
greeting: Hello
farewell: Goodbye

# ✗ BAD — "unused_key" is not referenced anywhere
greeting: Hello
unused_key: This is never used
```

</eslint-code-block>

## :gear: Options

```json
{
  "@rotki/no-unused-i18n-keys": [
    "error",
    {
      "src": "src",
      "extensions": [".vue", ".ts"],
      "ignoreKeys": []
    }
  ]
}
```

### `src` (string)

The source directory to scan for i18n key usage. Default is `"src"`.

### `extensions` (string[])

File extensions to scan for i18n key usage. Default is `[".vue", ".ts"]`.

### `ignoreKeys` (string[])

Glob patterns for keys that should be ignored (not reported as unused). Uses `*` as a wildcard. Default is `[]`.

```json
{
  "@rotki/no-unused-i18n-keys": [
    "error",
    {
      "src": "src",
      "extensions": [".vue", ".ts"],
      "ignoreKeys": [
        "backend_mappings.*",
        "notification_messages.*",
        "premium_components.*"
      ]
    }
  ]
}
```

## :bulb: Features

- **File-level caching** — Parsed source files are cached by modification time, avoiding redundant parsing across locale files.
- **Early bail-out** — Files without i18n function calls are skipped without parsing.
- **Template literal wildcards** — Dynamic keys like `t(`prefix.${val}`)` are matched as `prefix.*`, covering all children.
- **Linked message detection** — Keys referenced via `@:key` or `@:{key}` syntax in locale values are treated as used.
- **SFC `<i18n>` block support** — Keys defined in `<i18n>` blocks within Vue SFCs are included in the used keys set.
- **JSON and YAML support** — Both JSON and YAML locale file formats are supported via `jsonc-eslint-parser` and `yaml-eslint-parser`.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-unused-i18n-keys/index.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-unused-i18n-keys.ts)

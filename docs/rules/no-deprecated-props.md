---
title: '@rotki/no-deprecated-props'
description: Replaces deprecated props with their replacements
since: v0.2.0
---

# @rotki/no-deprecated-props

> Replaces deprecated props with their replacements

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports the usage of deprecated properties in components.

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<!-- ✓ GOOD -->
<template>
  <RuiRadio value="ok" />
</template>

<!-- ✗ BAD -->
<template>
  <RuiRadio internal-value="ok" />
</template>
```

</eslint-code-block>

## :gear: Options

```json
{
  "@rotki/no-deprecated-props": ["error"]
}
```

-

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v0.2.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-deprecated-props.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-deprecated-props.ts)

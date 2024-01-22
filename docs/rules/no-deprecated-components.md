---
title: '@rotki/no-deprecated-components'
description: Removes deprecated classes that do not exist anymore
since: v0.1.0
---

# @rotki/no-deprecated-components

> Removes deprecated classes that do not exist anymore

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports replaced unused or deprecated components used.

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<!-- ✗ BAD -->
<template>
  <Fragment><div /></Fragment>
</template>

<!-- with legacy false the Fragment component will be removed -->

<template>
  <DataTable />
</template>
```

</eslint-code-block>

## :gear: Options

When legacy is set to `true` some rules will be skipped for autofix.

```json
{
  "@rotki/no-deprecated-components": [
    "error",
    {
      "legacy": true
    }
  ]
}
```

-

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-deprecated-components.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-deprecated-components.ts)

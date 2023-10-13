---
title: '@rotki/no-deprecated-classes'
description: disallow the usage of vuetify css classes since they are replaced with tailwindcss
since: 0.1.0
---

# @rotki/no-deprecated-classes

> disallow the usage of vuetify css classes since they are replaced with tailwindcss

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports usages of deprecated css classes in the code.

<eslint-code-block fix :rules="{'rotki/no-deprecated-classes': 'error'}">

```vue
<!-- ✓ GOOD -->
<template><div class="flex flex-col"/></template>

<template><div class="block"/></template>

<template><div class="grow"/></template>

<template><div class="justify-between"/></template>

<!-- ✗ BAD -->
<template><div class="d-flex flex-column"/></template>

<template><div class="d-block"/></template>

<template><div class="grow"/></template>

<template><div class="justify-space-between"/></template>
```

</eslint-code-block>

## :gear: Options

```json
{
  "@rotki/no-deprecated-classes": "error"
}
```

## :rocket: Version

This rule was introduced in @rotki/eslint-plugin v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-deprecated-classes.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-deprecated-classes.ts)

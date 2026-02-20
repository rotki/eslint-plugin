---
title: '@rotki/composable-input-flexibility'
description: Prefer MaybeRefOrGetter over Ref for composable parameters
since: v1.3.0
---

# @rotki/composable-input-flexibility

> Prefer MaybeRefOrGetter over Ref for composable parameters

- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports `Ref<T>` type annotations on composable parameters and suggests using `MaybeRefOrGetter<T>` for greater input flexibility.

<eslint-code-block fix>

<!-- eslint-skip -->

```ts
/* eslint @rotki/composable-input-flexibility: "error" */

// ✓ GOOD
function useCounter(value: MaybeRefOrGetter<number>) {
  return { count: 0 };
}

// ✗ BAD
function useCounter(value: Ref<number>) {
  return { count: 0 };
}
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/composable-input-flexibility.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/composable-input-flexibility.ts)

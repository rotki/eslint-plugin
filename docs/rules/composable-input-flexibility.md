---
title: '@rotki/composable-input-flexibility'
description: Prefer MaybeRefOrGetter over Ref for composable parameters
since: v1.3.0
---

# @rotki/composable-input-flexibility

> Prefer MaybeRefOrGetter over Ref for composable parameters

- :bulb: Some problems reported by this rule are manually fixable by editor [suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule when `autofix` is enabled.

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

## :wrench: Options

```json
{
  "@rotki/composable-input-flexibility": ["error", { "autofix": false }]
}
```

### `autofix`

- Type: `boolean`
- Default: `false`

When `true`, enables auto-fix via the `--fix` CLI flag. When `false` (default), the fix is available only as an editor suggestion.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/composable-input-flexibility.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/composable-input-flexibility.ts)

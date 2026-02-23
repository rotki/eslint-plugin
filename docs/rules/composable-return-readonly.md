---
title: '@rotki/composable-return-readonly'
description: Require returned refs from composables to be wrapped with readonly()
since: v1.3.0
---

# @rotki/composable-return-readonly

> Require returned refs from composables to be wrapped with readonly()

- :bulb: Some problems reported by this rule are manually fixable by editor [suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule when `autofix` is enabled.

## :book: Rule Details

This rule requires that reactive variables (`ref`, `shallowRef`, `computed`) returned from composables are wrapped with `readonly()` to prevent consumers from mutating internal state.

<eslint-code-block fix>

<!-- eslint-skip -->

```ts
/* eslint @rotki/composable-return-readonly: "error" */

function useCounter() {
  const count = ref(0);
  const double = computed(() => count.value * 2);

  // ✓ GOOD
  return { count: readonly(count), double: readonly(double) };

  // ✗ BAD
  return { count, double };
}
```

</eslint-code-block>

## :wrench: Options

```json
{
  "@rotki/composable-return-readonly": ["error", { "autofix": false }]
}
```

### `autofix`

- Type: `boolean`
- Default: `false`

When `true`, enables auto-fix via the `--fix` CLI flag. When `false` (default), the fix is available only as an editor suggestion.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/composable-return-readonly.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/composable-return-readonly.ts)

---
title: '@rotki/composable-return-readonly'
description: Require returned refs from composables to be wrapped with readonly()
since: v1.3.0
---

# @rotki/composable-return-readonly

> Require returned refs from composables to be wrapped with readonly()

- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule requires that writable reactive variables (`ref`, `shallowRef`) returned from composables are wrapped with `readonly()` to prevent consumers from mutating internal state.

`computed()` refs are **excluded** because they are already readonly by design — wrapping them with `readonly()` is unnecessary. The rule will flag unnecessary `readonly()` usage on computed refs.

<eslint-code-block fix>

<!-- eslint-skip -->

```ts
/* eslint @rotki/composable-return-readonly: "error" */

function useCounter() {
  const count = ref(0);
  const double = computed(() => count.value * 2);

  // ✓ GOOD — ref wrapped with readonly, computed returned directly
  return { count: readonly(count), double };

  // ✗ BAD — ref returned without readonly
  return { count, double };

  // ✗ BAD — unnecessary readonly on computed
  return { count: readonly(count), double: readonly(double) };
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

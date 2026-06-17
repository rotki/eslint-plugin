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

Refs that are intentionally returned writable (for example, to bind with `v-model`) can be exempted by naming convention via the [`writablePrefixes`](#writableprefixes) option, instead of disabling the rule per line.

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
  "@rotki/composable-return-readonly": ["error", { "autofix": false, "writablePrefixes": ["model"] }]
}
```

### `autofix`

- Type: `boolean`
- Default: `false`

When `true`, enables auto-fix via the `--fix` CLI flag. When `false` (default), the fix is available only as an editor suggestion.

### `writablePrefixes`

- Type: `string[]`
- Default: `["model"]`

Returned variables whose name starts with one of these prefixes are exempt from the `readonly()` requirement. Use this for refs you intentionally expose as writable — for example, a ref meant to be bound with `v-model` — so you don't need a per-line `eslint-disable`.

Matching requires a strict camelCase boundary: the prefix must be the entire name or be followed by an uppercase letter. So `model` exempts `model` and `modelValue`, but **not** `models`.

Providing this option **replaces** the default, so include the default value if you want to keep it alongside additions, e.g. `["model", "writable"]`.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/composable-return-readonly: ["error", { "writablePrefixes": ["model"] }] */

function useInput() {
  const modelValue = ref('');
  const count = ref(0);

  // ✓ GOOD — `modelValue` is exempt (writable by convention), `count` is wrapped
  return { modelValue, count: readonly(count) };
}
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/composable-return-readonly.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/composable-return-readonly.ts)

---
title: '@rotki/composable-naming-convention'
description: Enforce consistent naming for composable options and return types
since: v1.3.0
---

# @rotki/composable-naming-convention

> Enforce consistent naming for composable options and return types

## :book: Rule Details

This rule enforces that composable options and return types follow the `Use{Name}Options` and `Use{Name}Return` naming convention. Only reports when a `Use*Options` or `Use*Return` type annotation exists but doesn't match the composable name.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/composable-naming-convention: "error" */

// ✓ GOOD
function useCounter(options: UseCounterOptions): UseCounterReturn {
  return { count: 0 };
}

// ✗ BAD
function useCounter(options: UseFooOptions): UseFooReturn {
  return { count: 0 };
}
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/composable-naming-convention.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/composable-naming-convention.ts)

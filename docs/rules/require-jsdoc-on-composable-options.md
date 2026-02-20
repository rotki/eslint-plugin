---
title: '@rotki/require-jsdoc-on-composable-options'
description: Require JSDoc comments on composable options interface properties
since: v1.3.0
---

# @rotki/require-jsdoc-on-composable-options

> Require JSDoc comments on composable options interface properties

## :book: Rule Details

This rule requires JSDoc comments on every property of interfaces matching the `Use*Options` pattern.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/require-jsdoc-on-composable-options: "error" */

// ✓ GOOD
interface UseCounterOptions {
  /** The initial count value */
  initial: number;
  /** The step value */
  step: number;
}

// ✗ BAD
interface UseCounterOptions {
  initial: number;
  step: number;
}
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/require-jsdoc-on-composable-options.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/require-jsdoc-on-composable-options.ts)

---
title: '@rotki/composable-no-default-export'
description: Forbid default exports in files containing composables
since: v1.3.0
---

# @rotki/composable-no-default-export

> Forbid default exports in files containing composables

## :book: Rule Details

This rule reports default exports in files that contain composable functions (`use*`). Composables should always use named exports for better tree-shaking and explicit API surfaces.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/composable-no-default-export: "error" */

// ✓ GOOD
export function useCounter() {
  const count = ref(0);
  return { count };
}

// ✗ BAD
function useCounter() {
  const count = ref(0);
  return { count };
}
export default useCounter;
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/composable-no-default-export.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/composable-no-default-export.ts)

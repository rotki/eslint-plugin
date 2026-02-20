---
title: '@rotki/composable-require-cleanup'
description: Require cleanup hooks when composables use side effects
since: v1.3.0
---

# @rotki/composable-require-cleanup

> Require cleanup hooks when composables use side effects

## :book: Rule Details

This rule reports side effects (`addEventListener`, `setInterval`, `setTimeout`, `new MutationObserver`, etc.) inside composables that don't have a corresponding cleanup hook (`onUnmounted`, `onBeforeUnmount`, `onScopeDispose`).

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/composable-require-cleanup: "error" */

// ✓ GOOD
function useResize() {
  window.addEventListener('resize', handler);
  onUnmounted(() => {
    window.removeEventListener('resize', handler);
  });
}

// ✗ BAD
function useResize() {
  window.addEventListener('resize', handler);
}
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/composable-require-cleanup.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/composable-require-cleanup.ts)

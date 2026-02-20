---
title: '@rotki/composable-ssr-safety'
description: Require browser global access in composables to be SSR-safe
since: v1.3.0
---

# @rotki/composable-ssr-safety

> Require browser global access in composables to be SSR-safe

## :book: Rule Details

This rule reports unguarded access to browser globals (`window`, `document`, `navigator`) inside composables. Access must be guarded with a `typeof` check or placed inside `onMounted`/`onBeforeMount`.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/composable-ssr-safety: "error" */

// ✓ GOOD
function useWindowSize() {
  onMounted(() => {
    const width = window.innerWidth;
  });
}

function useWindowSize() {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
  }
}

// ✗ BAD
function useWindowSize() {
  const width = window.innerWidth;
}
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/composable-ssr-safety.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/composable-ssr-safety.ts)

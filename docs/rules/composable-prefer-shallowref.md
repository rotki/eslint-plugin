---
title: '@rotki/composable-prefer-shallowref'
description: Prefer shallowRef() over ref() for primitive values in composables
since: v1.3.0
---

# @rotki/composable-prefer-shallowref

> Prefer shallowRef() over ref() for primitive values in composables

- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports `ref()` calls with primitive literal arguments inside composables and suggests using `shallowRef()` instead for better performance.

<eslint-code-block fix>

<!-- eslint-skip -->

```ts
/* eslint @rotki/composable-prefer-shallowref: "error" */

function useCounter() {
  // ✓ GOOD
  const count = shallowRef(0);
  const data = ref({ key: 'value' }); // non-primitive, ok

  // ✗ BAD
  const total = ref(0);
  const active = ref(false);
  const label = ref('hello');
}
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.3.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/composable-prefer-shallowref.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/composable-prefer-shallowref.ts)

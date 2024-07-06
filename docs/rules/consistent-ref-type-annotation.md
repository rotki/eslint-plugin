---
title: '@rotki/consistent-ref-type-annotation'
description: Ensures consistent type annotation position for ref, computed assignments
since: v0.4.0
---

# @rotki/consistent-ref-type-annotation

> Ensures consistent type annotation position for ref, computed assignments

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports inconsistent type annotation positioning for `ref` and `computed` properties.

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<script setup lang="ts">
import { ref, computed, Ref, ComputedRef } from 'vue'
/* eslint @rotki/consistent-ref-type-annotation: "error" */

type Balances = Record<string, number>;

<!-- ✓ GOOD -->
const text = ref<string>('');
const comp = computed<string>(() => '');

<!-- ✗ BAD -->
const secondText: Ref<string> = ref('');
const secondComp: ComputedRef<string> = computed(() => '');
const balances: Ref<Balances> = ref<Balances>({});
</script>
```

</eslint-code-block>

## :gear: Options

By default, a missing type annotation in a `ref` or `computed` is considered a problem.
If you want to allow type inference on `ref` or `computed` assignments you can set `allowInference` to `true`.

```json
{
  "@rotki/consistent-ref-type-annotation": [
    "error",
    {
      "allowInference": false
    }
  ]
}
```

-

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/consistent-ref-type-annotation.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/consistent-ref-type-annotation.ts)

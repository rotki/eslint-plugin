---
title: '@rotki/no-dot-ts-imports'
description: Checks and replaces .ts extension in import statements.
since: v0.6.0
---

# @rotki/no-dot-ts-imports

> Checks and replaces .ts extension in import statements.

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports the usage of the .ts extension when importing dependencies.

- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<!-- ✓ GOOD -->
<script lang="ts" setup>
/* eslint @rotki/no-dot-ts-import: "error" */
import { something } from '@/packages/something';
</script>

<!-- ✗ BAD -->
<script lang="ts" setup>
/* eslint @rotki/no-dot-ts-import: "error" */
import { something } from '@/packages/something.ts';
</script>
```

</eslint-code-block>

## :gear: Options

```json
{
  "@rotki/no-dot-ts-import": ["error"]
}
```

-

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v0.6.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-dot-ts-imports.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-dot-ts-imports.ts)

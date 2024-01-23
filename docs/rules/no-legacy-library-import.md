---
title: '@rotki/no-legacy-library-import'
description: Reports and replaces imports of @rotki/ui-library-compat with @rotki/ui-library
since: v0.2.0
---

# @rotki/no-legacy-library-import

> Reports and replaces imports of @rotki/ui-library-compat with @rotki/ui-library

- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports usages of `@rotki/ui-library-compat`.

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<!-- ✓ GOOD -->
<script>
import { createRui } from '@rotki/ui-library';

const rui = createRui({});
</script>

<!-- ✗ BAD -->
<script>
import { createRui } from '@rotki/ui-library-compat';

const rui = createRui({});
</script>
```

</eslint-code-block>

## :gear: Options

```json
{
  "@rotki/no-legacy-library-import": ["error"]
}
```

-

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v0.2.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-legacy-library-import.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-legacy-library-import.ts)

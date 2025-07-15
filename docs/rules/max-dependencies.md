---
title: '@rotki/max-dependencies'
description: enforce a maximum number of dependencies per file
since: v1.1.0
---

# @rotki/max-dependencies

> enforce a maximum number of dependencies per file

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.

## :book: Rule Details

This rule enforces a maximum number of dependencies that can be imported in a single file, helping to prevent files from becoming too complex and encourage better code organization.

<eslint-code-block>

<!-- eslint-skip -->

```vue
<!-- ✓ GOOD -->
<script lang="ts" setup>
/* eslint @rotki/max-dependencies: ["error", { "max": 5 }] */
import { ref } from 'vue';
import { computed } from 'vue';
import { watch } from 'vue';
</script>

<!-- ✗ BAD -->
<script lang="ts" setup>
/* eslint @rotki/max-dependencies: ["error", { "max": 2 }] */
import { ref } from 'vue';
import { computed } from 'vue';
import { watch } from 'vue';
import { reactive } from 'vue';
</script>
```

</eslint-code-block>

## :gear: Options

```json
{
  "@rotki/max-dependencies": [
    "error",
    {
      "max": 20,
      "ignoreTypeImports": false
    }
  ]
}
```

### `max` (number)

The maximum number of dependencies allowed in a single file. Default is `20`.

### `ignoreTypeImports` (boolean)

If `true`, TypeScript type-only imports (imports with `import type`) are not counted towards the dependency limit. Default is `false`.

<eslint-code-block>

<!-- eslint-skip -->

```vue
<!-- ✓ GOOD with ignoreTypeImports: true -->
<script lang="ts" setup>
/* eslint @rotki/max-dependencies: ["error", { "max": 2, "ignoreTypeImports": true }] */
import type { Ref } from 'vue';
import type { ComputedRef } from 'vue';
import { ref } from 'vue';
import { computed } from 'vue';
</script>

<!-- ✗ BAD with ignoreTypeImports: false -->
<script lang="ts" setup>
/* eslint @rotki/max-dependencies: ["error", { "max": 2, "ignoreTypeImports": false }] */
import type { Ref } from 'vue';
import type { ComputedRef } from 'vue';
import { ref } from 'vue';
import { computed } from 'vue';
</script>
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.1.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/max-dependencies.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/max-dependencies.ts)

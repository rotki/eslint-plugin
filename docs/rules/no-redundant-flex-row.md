---
title: '@rotki/no-redundant-flex-row'
description: disallow redundant `flex-row` since `flex` already defaults to the row direction
since: v1.4.0
---

# @rotki/no-redundant-flex-row

> disallow redundant `flex-row` since `flex` already defaults to the row direction

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

In Tailwind CSS, `flex` already lays children out in the row direction
(`flex-direction: row` is the default). Pairing it with an unconditional
`flex-row` therefore adds nothing — the `flex-row` class is dead weight.

Directional classes only carry meaning when a **conditional variant** overrides a
different base direction, e.g. an element that stacks vertically by default and
becomes a row at the `sm` breakpoint (`flex flex-col sm:flex-row`).

This rule reports an unconditional `flex-row` (or `inline-flex` + `flex-row`)
and removes it on `--fix`.

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<script>
/* eslint @rotki/no-redundant-flex-row: "error" */
</script>

<template>
  <!-- ✓ GOOD -->
  <div class="flex" />
  <div class="flex flex-col sm:flex-row" />
  <div class="flex sm:flex-row" />

  <!-- ✗ BAD -->
  <div class="flex flex-row" />
  <div class="inline-flex flex-row" />
  <div class="flex flex-row sm:flex-col" />
</template>
```

</eslint-code-block>

## :mag: Details

- The rule only fires when an **unconditional** `flex` or `inline-flex` is present
  alongside an **unconditional** `flex-row`. A variant prefix (`sm:`, `hover:`,
  `dark:`, …) on either makes the combination meaningful, so it is never reported.
- Tailwind's important modifier is recognised in both v3 (`!flex-row`) and
  v4 (`flex-row!`) syntaxes.
- Sibling utilities such as `flex-row-reverse`, `flex-wrap` and `flex-1` are
  left untouched.
- `flex-row` without a `flex`/`inline-flex` display class is **not** reported,
  since the display might come from elsewhere and the rule stays conservative.

### Dynamic `:class`

Static `class` attributes and **plain string** `:class` bindings are linted —
both `:class="'flex flex-row'"` and ``:class="`flex flex-row`"`` are reported.

Object, array, ternary and interpolated `:class` bindings are intentionally
**skipped**, because `flex-row` may be applied behind a runtime condition there
rather than a variant prefix. The following are all left untouched:

- `:class="{ 'flex-row': isRow }"` — applied only when `isRow` is truthy
- `:class="['flex', isRow ? 'flex-row' : 'flex-col']"` — ternary branch
- ``:class="`flex ${dir}`"`` — interpolated value

Flagging these would risk silently auto-removing a meaningful conditional
override (the object-syntax equivalent of `flex flex-col sm:flex-row`).

## :gear: Options

Nothing.

```json
{
  "@rotki/no-redundant-flex-row": ["error"]
}
```

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.4.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-redundant-flex-row.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-redundant-flex-row.ts)

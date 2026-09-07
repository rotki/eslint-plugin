---
title: '@rotki/no-conditional-empty-object-spread'
description: Disallow object spreads that conditionally spread nothing to omit a property
since: v1.6.0
---

# @rotki/no-conditional-empty-object-spread

> Disallow object spreads that conditionally spread nothing to omit a property

## :book: Rule Details

`...(cursor ? { cursor } : {})` decides whether a property exists inside an expression. The reader
has to evaluate the ternary to know the shape of the object, the empty branch carries no meaning of
its own, and the pattern nests badly once two or three of them stack up in one literal.

Both shapes are reported, because both omit by spreading nothing:

- the ternary, where one branch is an empty object literal
- `...(cursor && { cursor })`, where the false branch spreads `false`, a legal no-op

Only spreads in an **object** literal are reported. `[...(enabled ? items : [])]` is an array spread
and is left alone, as is a ternary between two non-empty objects, where both branches carry
properties and the shape is stated either way.

No autofix: the replacement depends on what the object is for. Usually it is a mutable base plus a
guarded assignment, or a small builder function.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/no-conditional-empty-object-spread: "error" */

// ✓ GOOD
const payload: Payload = { ...base };
if (cursor) payload.cursor = cursor;

// ✓ GOOD: both branches state a shape.
const payload = { ...(enabled ? full : partial) };

// ✗ BAD
const payload = { ...base, ...(cursor ? { cursor } : {}) };

// ✗ BAD
const payload = { ...base, ...(cursor && { cursor }) };
```

</eslint-code-block>

## :gear: Options

Nothing.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.6.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-conditional-empty-object-spread.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-conditional-empty-object-spread.ts)

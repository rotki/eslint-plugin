---
title: '@rotki/tsdoc-on-declaration'
description: Document a declaration with TSDoc rather than `//`
since: v1.6.0
---

# @rotki/tsdoc-on-declaration

> Document a declaration with TSDoc rather than `//`

## :book: Rule Details

Only a `/** */` block is surfaced by editors at the call site and checked by the `jsdoc` and `tsdoc`
rules, so documentation written as `//` reaches neither. This rule reports a declaration whose
documentation sits directly above it as line comments.

Applies to classes, functions, methods, interfaces, type aliases, enums, ambient modules, and a
`const` holding a function. Other variable declarations are not covered, so a single `//` line may
still introduce a value.

A blank line ends the run, so a comment separated from the declaration is not treated as its
documentation. Directive comments are skipped for the same reason: they are aimed at the code below
rather than describing it. The rule reads through an `export`, where the comment attaches to the
export rather than to the declaration inside it.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/tsdoc-on-declaration: "error" */

// ✓ GOOD
/** Returns the display name for an account. */
function accountLabel(account: Account): string {
  return account.label;
}

// ✗ BAD
// Returns the display name for an account.
function accountName(account: Account): string {
  return account.label;
}
```

</eslint-code-block>

## :gear: Options

Nothing.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.6.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/tsdoc-on-declaration.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/tsdoc-on-declaration.ts)

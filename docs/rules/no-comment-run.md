---
title: '@rotki/no-comment-run'
description: Disallow consecutive `//` comment lines
since: v1.6.0
---

# @rotki/no-comment-run

> Disallow consecutive `//` comment lines

## :book: Rule Details

Two or more `//` lines in a row are narration: prose that restates the code below it, drifts out of
date independently of it, and is invisible to editors at the call site. A single `//` line is
allowed.

A run made entirely of directives is allowed, so several suppressions may be stacked above the line
they apply to. A run that mixes a directive with prose is reported. Directives are recognised by
prefix: `eslint-`, `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `prettier-`, `c8 ignore`,
`v8 ignore` and `istanbul`. A TypeScript triple-slash reference counts as a directive too, in its
`types`, `path`, `lib` and `no-default-lib` forms, so the header of a `.d.ts` file is not a run.

The rule is deliberately not autofixable, because the replacement depends on what the comment says:
documentation of the code below becomes a TSDoc block, a justified value becomes a named constant,
and a claim about behaviour becomes an assertion or a test name.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/no-comment-run: "error" */

// ✓ GOOD: one line.
const timeout = 5000;

// ✓ GOOD: a run of directives.
// v8 ignore next
// c8 ignore next
handler(payload);

// ✓ GOOD: a header of triple-slash references.
/// <reference types="vite/client" />
/// <reference types="vue-i18n" />

// ✗ BAD: two lines of prose.
// The second line is what makes this a run.
const retries = 3;
```

</eslint-code-block>

## :gear: Options

Nothing.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.6.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-comment-run.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-comment-run.ts)

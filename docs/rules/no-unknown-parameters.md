---
title: '@rotki/no-unknown-parameters'
description: Disallow function parameters annotated `unknown` outside error handling and type guards
since: v1.6.0
---

# @rotki/no-unknown-parameters

> Disallow function parameters annotated `unknown` outside error handling and type guards

## :book: Rule Details

A parameter typed `unknown` moves the parsing to the callee, and usually to a cast a few lines
later. The value crossed a boundary somewhere, and that boundary is where the schema belongs: parse
it there and give this function the named type.

The rule reads the written annotation, so it needs no type information. It reports `unknown` and any
union containing it, on function declarations and expressions, arrow functions, method and call
signatures, and constructor parameter properties. `unknown[]` is not reported, since the annotation
states a collection rather than an unparsed value.

Three exemptions are built in:

- **Rejection handlers**: any parameter of a callback passed to `.catch()`, or of the second
  argument to `.then()`, whatever it is named. This is not cosmetic:
  `@typescript-eslint/use-unknown-in-catch-callback-variable` _requires_ `unknown` there, so
  reporting it would put the two rules in direct conflict.
- **Error-handling names**: `cause`, `e`, `err`, `error` and `reason`, wherever they appear, for
  helpers that receive a caught value outside a `.catch()` callback.
- **Type-predicate subjects**: `function isAccount(value: unknown): value is Account` has to accept
  `unknown` to be worth writing.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/no-unknown-parameters: "error" */

// ✓ GOOD: parsed at the boundary, named type here.
function label(account: Account): string {
  return account.label;
}

// ✓ GOOD: a rejection handler, where `unknown` is required.
promise.catch((failure: unknown) => notify(failure));

// ✓ GOOD: a type guard has to take `unknown`.
function isAccount(value: unknown): value is Account {
  return AccountSchema.safeParse(value).success;
}

// ✗ BAD
function parse(payload: unknown): Account {
  return AccountSchema.parse(payload);
}
```

</eslint-code-block>

## :gear: Options

```json
{
  "@rotki/no-unknown-parameters": [
    "error",
    { "allowNames": ["raw"] }
  ]
}
```

- `allowNames` (`string[]`, default `[]`): extra parameter names that may be annotated `unknown`,
  for a decoding boundary that genuinely takes raw input. The names are added to the built-in
  error-handling names, which stay allowed.

  Before v1.10.0 this option replaced the error-handling names instead of adding to them. A config
  that repeated those names to keep them still works; it can now drop them.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.6.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-unknown-parameters.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-unknown-parameters.ts)

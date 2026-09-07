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

Two exemptions are built in:

- **Error-handling names**, by default `cause`, `e`, `err`, `error` and `reason`. This is not
  cosmetic: `@typescript-eslint/use-unknown-in-catch-callback-variable` _requires_ `unknown` on a
  catch callback parameter, so reporting those names would put the two rules in direct conflict.
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

// ✓ GOOD: the catch callback, where `unknown` is required.
promise.catch((error: unknown) => notify(error));

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
    { "allowNames": ["cause", "e", "err", "error", "reason"] }
  ]
}
```

- `allowNames` (`string[]`) — parameter names that may be annotated `unknown`. Replaces the default
  list, so include the error names if you extend it. Use it for a decoding boundary that genuinely
  takes raw input, for example `allowNames: ["cause", "e", "err", "error", "reason", "raw"]`.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.6.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-unknown-parameters.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-unknown-parameters.ts)

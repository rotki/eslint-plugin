---
title: '@rotki/no-interpolated-i18n-key'
description: disallow message keys built by interpolating a template literal at the call site
since: v1.8.0
---

# @rotki/no-interpolated-i18n-key

> disallow message keys built by interpolating a template literal at the call site

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.

## :book: Rule Details

A key interpolated at the call site does not name one key, it names a family of them:

```ts
t(`address_book.actions.${key}.error.title`);
```

[`@rotki/no-unused-i18n-keys`](./no-unused-i18n-keys.html) reads the static prefix of that literal
as a usage of everything beneath it, so the line above exempts the whole `address_book.actions`
subtree from unused-key reporting. Nothing about the exemption appears in the ESLint config, so an
audit of `ignoreKeys` cannot find it: it is a wildcard with no declaration site.

The reported shapes are exactly the shapes that create the wildcard, so the two rules cannot drift
apart: a call to `t`, `te`, `tc`, `$t`, `$te` or `$tc` (bare or as a non-computed member call such
as `this.$t(...)`) whose **first argument** is a template literal with at least one interpolation.
This covers calls in a script, in a template mustache and in a bound attribute.

An interpolated `keypath` or `path` binding on `<i18n-t>` is reported for a related reason: a key
assembled in the binding is read by neither the unused-key rule nor `@intlify/no-missing-keys`, so
nothing checks that it resolves. The same prop on any other component is an ordinary string and is
left alone.

Identifiers, member expressions and index expressions are **not** reported. Those are the sanctioned
escape hatch: a key branded with `msg.$t(...)` stays visible to both rules, so the lookup can be
dynamic as long as the keys themselves are written out.

## :wrench: How to fix it

Replace the interpolation with an exhaustive record of branded keys:

```ts
const HEADER_KEYS: Record<HistoryEventEntryType, MessageKey> = {
  [HistoryEventEntryType.BITCOIN_EVENT]: msg.$t(
    'transactions.events.headers.bitcoin_event',
  ),
  [HistoryEventEntryType.EVM_EVENT]: msg.$t(
    'transactions.events.headers.evm_event',
  ),
};

const header = t(HEADER_KEYS[entryType]);
```

That buys three things the interpolated form cannot: adding an enum member fails `vue-tsc` until its
key is written, each key is visible to the unused-key rule, and each key is validated by
`@intlify/no-missing-keys`.

This only works when the key set is a union owned by the repository. Where the authority is external
(a backend enum, a separately built bundle) the answer is a generated list of keys, not a record.

## :book: Examples

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/no-interpolated-i18n-key: "error" */

// ✓ GOOD
const title = t('address_book.actions.add.error.title');

// ✓ GOOD: the lookup is dynamic, the keys are written out
const title = t(HEADER_KEYS[entryType]);

// ✓ GOOD: interpolation in the named arguments, not in the key
const message = t('errors.title', { message: `${error}` });

// ✗ BAD: exempts every key under `address_book.actions`
const title = t(`address_book.actions.${key}.error.title`);
```

</eslint-code-block>

<eslint-code-block>

<!-- eslint-skip -->

```vue
<template>
  <!-- ✓ GOOD -->
  <i18n-t :keypath="translationKey" />

  <!-- ✗ BAD -->
  <i18n-t :keypath="`a.${key}.b`" />
</template>
```

</eslint-code-block>

## :gear: Options

Nothing.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.8.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-interpolated-i18n-key.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-interpolated-i18n-key.ts)

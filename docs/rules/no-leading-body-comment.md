---
title: '@rotki/no-leading-body-comment'
description: Disallow a comment as the first thing in a function body
since: v1.7.0
---

# @rotki/no-leading-body-comment

> Disallow a comment as the first thing in a function body

## :book: Rule Details

A comment opening a function body is documentation in the wrong place. It explains the function it
sits inside, but it sits one line below the declaration where a reader, an editor tooltip and every
call site would look for it. Moving it up costs nothing and reaches everyone.

This is the companion to [`tsdoc-on-declaration`](./tsdoc-on-declaration.md), which asks for the
explanation on the declaration, and to [`no-comment-run`](./no-comment-run.md), which stops it from
sprawling once it is there. Together they close the loop: the explanation cannot sit below the
declaration, and it cannot grow into narration.

The report names the fix, which depends on what the function is:

- a **named function or method** has a declaration, so the comment becomes its TSDoc;
- a **callback** has none, so the body is lifted into a named, documented function that is passed
  instead. This is sharpest in a watcher, where a body that needs explaining is a body that wants a
  name;
- a **test** has a title, which is what a failure prints, so the comment folds into it.

Four things are not reported.

**Directives**, which are aimed at the code rather than describing it, by the same prefixes
`no-comment-run` recognises.

**A TSDoc block over a declaration**, which documents that declaration rather than the function
holding it. Only a `/**` block earns this: a plain `/* */` or a `//` above the same declaration is
prose about the enclosing function until it is rewritten as TSDoc, which is what the report asks
for.

**A comment that is the whole body** of an intentionally empty function, which is the one place it
belongs.

**Test containers and lifecycle hooks.** A comment introducing an `it()` describes that test, and
belongs to the title rather than to the `describe` arrow that happens to hold it. A `beforeEach`
has neither a declaration to document nor a title to fold into, and its body is setup that reads no
better as a named function, so the rule would have no fix to offer. Playwright namespaces both under
`test`, and `test.beforeEach` and `test.describe` are exempt exactly as the bare forms are, while
`test.skip` and `it.each` stay tests: a property is read as the kind only when it names one.

The rule is deliberately not autofixable. Prose written for the inside of a body is rarely the
sentence that belongs on the declaration, and a mechanical move would produce a TSDoc summary that
describes one branch rather than the function.

<eslint-code-block>

<!-- eslint-skip -->

```ts
/* eslint @rotki/no-leading-body-comment: "error" */

// ✓ GOOD: on the declaration, where a caller sees it.
/** Reads back a password saved earlier, or an empty string when none is stored. */
async function retrievePassword(username: string): Promise<string> {
  return store.get(username) ?? '';
}

// ✓ GOOD: TSDoc documenting the declaration that opens the body.
function useNamesApi() {
  /** Reverse-resolves ENS names, synchronously or as a backend task. */
  const internal = async () => post('/names/ens/reverse');
  return { internal };
}

// ✓ GOOD: a directive.
function report() {
  // eslint-disable-next-line no-console -- the reporter writes here on purpose
  console.log('ready');
}

// ✓ GOOD: the comment is the whole body.
const noop = () => {
  // Nothing to do: the caller only needs the handle.
};

// ✓ GOOD: introducing a test, which the title should carry.
describe('useThing', () => {
  // Only the lane can be asserted here: `submitTask` is stubbed.
  it('should queue on the per-chain lane', () => {
    expect(lane()).toBe('detect:eth');
  });
});

// ✗ BAD: explains the function from inside it.
function spawnProxyForBackend(corePort: number): void {
  // The dev-proxy is handed core's port at spawn and cannot learn a new one.
  startDevProxy({ BACKEND: corePort });
}

// ✗ BAD: a callback whose body wants a name.
watch(source, () => {
  // The echo of our own write: skip re-applying state we already hold.
  if (isEcho(source)) return;
  apply(source);
});

// ✗ BAD: belongs in the title, which is what a failure prints.
it('should fall back to index.html', async () => {
  // A reload can request the bare origin, which would resolve to the directory.
  expect((await handler(request('/'))).status).toBe(200);
});
```

</eslint-code-block>

## :gear: Options

Nothing.

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.7.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-leading-body-comment.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-leading-body-comment.ts)

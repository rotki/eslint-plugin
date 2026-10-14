---
title: '@rotki/no-template-root-comment'
description: disallow comments beside a template's single root element
since: v1.9.0
---

# @rotki/no-template-root-comment

> disallow comments beside a template's single root element

- :star: The `"extends": "plugin:@rotki/recommended"` property in a configuration file enables this rule.
- :black_nib:️ The `--fix` option on the [command line](http://eslint.org/docs/user-guide/command-line-interface#fix) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

Vue keeps template comments in development builds. A comment at the top level of a template,
beside the root element, therefore becomes a second root node, and the component renders as a
fragment in development while it has a single root in production. In development:

- non-prop attributes and classes passed to the component no longer fall through to its root;
- a parent `<Transition>` cannot animate it. A routed page behind such a transition is never
  removed on navigation, so the next page renders below it.

This rule reports a comment at the top level of a template that otherwise renders a single root
element, and on `--fix` moves it inside that element: comments before the root to the start of its
content, comments after it to the end, in their original order.

<eslint-code-block fix>

<!-- eslint-skip -->

```vue
<script>
/* eslint @rotki/no-template-root-comment: "error" */
</script>

<!-- ✗ BAD -->
<template>
  <!-- the frame around the table -->
  <section class="frame">
    <slot />
  </section>
</template>

<!-- ✓ GOOD -->
<template>
  <section class="frame">
    <!-- the frame around the table -->
    <slot />
  </section>
</template>
```

</eslint-code-block>

## :mag: Details

- A template that is a fragment anyway is not reported: several root elements, a `v-for` root, a
  `<template>` or `<slot>` root, or text and interpolations beside the root. The comment changes
  nothing there.
- A `v-if` / `v-else-if` / `v-else` chain counts as one root, so a comment beside it is reported.
  The fix moves a comment into the branch that follows it, which is where a comment labelling a
  branch belongs; comments after the last branch go to its end.
- A self-closing root or branch, such as a page that renders a single component, has no content
  to take the comment, so it is reported without a fix: move the comment into the script block, or
  remove it.
- A component root takes the comment inside its tags. Vue ignores comments when it collects a
  component's implicit default slot next to named slots, so the slots are unaffected.

## :gear: Options

Nothing.

```json
{
  "@rotki/no-template-root-comment": ["error"]
}
```

## :rocket: Version

This rule was introduced in `@rotki/eslint-plugin` v1.9.0

## :mag: Implementation

- [Rule source](https://github.com/rotki/eslint-plugin/blob/master/src/rules/no-template-root-comment.ts)
- [Test source](https://github.com/rotki/eslint-plugin/tree/master/tests/rules/no-template-root-comment.ts)

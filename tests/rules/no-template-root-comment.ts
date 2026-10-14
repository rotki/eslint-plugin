import { RuleTester } from 'eslint';
import vueParser from 'vue-eslint-parser';
import rule, { RULE_NAME } from '../../src/rules/no-template-root-comment';

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  },
});

tester.run(RULE_NAME, rule, {
  valid: [
    // a comment inside the root element is part of the root's content
    `<template>
  <div>
    <!-- explains the list -->
    <span />
  </div>
</template>`,
    // no comment at all
    '<template><div /></template>',
    // several roots are a fragment already, a comment beside them changes nothing
    `<template>
  <!-- header and body -->
  <header />
  <main />
</template>`,
    // a v-for root renders a fragment
    `<template>
  <!-- one per item -->
  <div v-for="item in items" :key="item" />
</template>`,
    // a <template> root renders its children, so it is a fragment too
    `<template>
  <!-- conditional group -->
  <template v-if="show">
    <span />
  </template>
</template>`,
    // text beside the root makes it a fragment regardless
    `<template>
  <!-- note -->
  text
  <div />
</template>`,
    // a file without a template
    '<script setup lang="ts">\nconst a = 1;\n</script>',
  ],
  invalid: [
    // the case that made a routed page a fragment and left it on screen
    {
      code: `<template>
  <!-- the layout lives in the child -->
  <Child />
</template>`,
      errors: [{ messageId: 'rootComment' }],
      output: null,
    },
    // a comment before the root moves to the start of its content
    {
      code: `<template>
  <!-- explains the frame -->
  <section class="frame">
    <slot />
  </section>
</template>`,
      errors: [{ messageId: 'rootComment' }],
      output: `<template>
  <section class="frame">
    <!-- explains the frame -->
    <slot />
  </section>
</template>`,
    },
    // a multi-line comment keeps its shape one level deeper
    {
      code: `<template>
  <!--
    first line
    second line
  -->
  <div>
    <span />
  </div>
</template>`,
      errors: [{ messageId: 'rootComment' }],
      output: `<template>
  <div>
    <!--
      first line
      second line
    -->
    <span />
  </div>
</template>`,
    },
    // several comments keep their order, before and after the root
    {
      code: `<template>
  <!-- one -->
  <!-- two -->
  <div>
    <span />
  </div>
  <!-- three -->
</template>`,
      errors: [{ messageId: 'rootComment' }, { messageId: 'rootComment' }, { messageId: 'rootComment' }],
      output: `<template>
  <div>
    <!-- one -->
    <!-- two -->
    <span />
    <!-- three -->
  </div>
</template>`,
    },
    // a self-closing v-if branch has no content to take its comment: report only
    {
      code: `<template>
  <!-- either state -->
  <div v-if="ready" />
  <span v-else />
</template>`,
      errors: [{ messageId: 'rootComment' }],
      output: null,
    },
    // each comment labelling a v-if branch moves into that branch
    {
      code: `<template>
  <!-- card layout -->
  <div v-if="isMobile">
    <span />
  </div>

  <!-- row layout -->
  <div v-else>
    <span />
  </div>
</template>`,
      errors: [{ messageId: 'rootComment' }, { messageId: 'rootComment' }],
      output: `<template>
  <div v-if="isMobile">
    <!-- card layout -->
    <span />
  </div>

  <div v-else>
    <!-- row layout -->
    <span />
  </div>
</template>`,
    },
    // a comment after the last branch moves to the end of that branch
    {
      code: `<template>
  <div v-if="ready">
    <span />
  </div>
  <p v-else>
    loading
  </p>
  <!-- trailing note -->
</template>`,
      errors: [{ messageId: 'rootComment' }],
      output: `<template>
  <div v-if="ready">
    <span />
  </div>
  <p v-else>
    loading
    <!-- trailing note -->
  </p>
</template>`,
    },
    // a component root takes the comment inside its tags
    {
      code: `<template>
  <!-- the page frame -->
  <PageLayout :title="title">
    <Content />
  </PageLayout>
</template>`,
      errors: [{ messageId: 'rootComment' }],
      output: `<template>
  <PageLayout :title="title">
    <!-- the page frame -->
    <Content />
  </PageLayout>
</template>`,
    },
  ],
});

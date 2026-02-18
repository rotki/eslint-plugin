<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  methods: {
    getMessage() {
      return this.$t('member.key');
    },
    getChoice() {
      return this.$tc('choice.key', 1);
    },
  },
});
</script>

<template>
  <div>
    <span>{{ $t('dollar_t.key') }}</span>
    <i18n-t path="path.key" tag="p">
      <template #default>
        content
      </template>
    </i18n-t>
  </div>
</template>

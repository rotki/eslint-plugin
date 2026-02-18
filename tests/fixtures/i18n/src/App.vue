<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t, te } = useI18n();

const msg = t('used.key');
const exists = te('check.key');
const dynamic = t(`prefix.${someVar}`);
</script>

<template>
  <div>
    <span>{{ t('template.key') }}</span>
    <i18n-t keypath="comp.key">
      <template #default>
        slot
      </template>
    </i18n-t>
    <div v-t="'directive.key'" />
    <span :text="t('bound.key')" />
    <span>{{ t(`tpl_inline.key`) }}</span>
  </div>
</template>

<i18n>
{
  "en": {
    "local.key": "Local value"
  }
}
</i18n>

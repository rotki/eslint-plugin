import { useI18n } from 'vue-i18n';

const { t, te } = useI18n();

export function getLabel() {
  return t('store.key');
}

export function checkKey() {
  return te('check.key');
}

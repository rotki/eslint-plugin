/**
 * Forked from https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/scripts/lib/rules.ts
 */

import plugin from '../../src/plugin';
import type { RuleRecommendationMeta } from '../../src/types';
import type { RuleMetaData } from '@typescript-eslint/utils/ts-eslint';

export interface RuleInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  recommended: boolean;
  fixable: boolean;
  deprecated: boolean;
  replacedBy: string[] | null;
}

export const rules = Object.entries(plugin.rules).map((rule) => {
  const name = rule[0];
  // todo, maybe adjust the type and remove the cast?
  const meta = rule[1].meta as RuleMetaData<'', RuleRecommendationMeta> | undefined;

  if (!meta || !meta.docs)
    throw new Error('meta and meta.docs are not supposed to be missing did you forget to add them');

  return {
    id: `@rotki/${name}`,
    name,
    description: String(meta.docs.description),
    category: String(meta.docs.recommendation),
    recommended: meta.docs.recommendation === 'recommended',
    fixable: Boolean(meta.fixable),
    deprecated: Boolean(meta.deprecated),
    replacedBy: meta.replacedBy ? [...meta.replacedBy] : null,
  } satisfies RuleInfo;
});

export const withCategories = [
  'recommended',
  'strict',
  'stylistic',
].map(category => ({
  category,
  rules: rules.filter(rule => rule.category === category && !rule.deprecated),
}));

/**
 * Forked from https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/scripts/lib/rules.ts
 */

import plugin from '../../src/plugin';

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
  const meta = rule[1].meta;

  if (!meta || !meta.docs)
    throw new Error('meta and meta.docs are not supposed to be missing did you forget to add them');

  const { docs, fixable, deprecated, replacedBy } = meta;
  const recommendation = 'recommendation' in docs ? String(docs.recommendation) : undefined;

  return {
    id: `@rotki/${name}`,
    name,
    description: String(docs.description),
    category: String(recommendation),
    recommended: recommendation === 'recommended',
    fixable: Boolean(fixable),
    deprecated: Boolean(deprecated),
    replacedBy: replacedBy ? [...replacedBy] : null,
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

export function createRecommended<T extends { rules: Record<string, any> }>(plugin: T, name: string, flat: boolean) {
  const rules = Object.fromEntries(Object.entries(plugin.rules)
    .filter(([_key, rule]) => rule.meta.recommended === 'recommended' && !rule.meta.deprecated)
    .map(([key]) => [`${name}/${key}`, 2]));

  if (flat) {
    return {
      plugins: {
        [name]: plugin,
      },
      rules,
    };
  }
  else {
    return {
      plugins: [name],
      rules,
    };
  }
}

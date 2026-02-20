export function createConfig<T extends { rules: Record<string, any> }>(plugin: T, name: string, flat: boolean, category: string) {
  const rules = Object.fromEntries(Object.entries(plugin.rules)
    .filter(([_key, rule]) => rule.meta.docs?.recommendation === category && !rule.meta.deprecated)
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

export function createRecommended<T extends { rules: Record<string, any> }>(plugin: T, name: string, flat: boolean) {
  return createConfig(plugin, name, flat, 'recommended');
}

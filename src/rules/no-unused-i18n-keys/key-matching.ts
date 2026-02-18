export function extractLinkedKeys(value: string): string[] {
  const linkedKeyRegex = /@(?:\.\w+)?:(?:{([^}]+)}|(\w+(?:\.\w+)*))/g;
  const keys: string[] = [];
  let match: RegExpExecArray | null = linkedKeyRegex.exec(value);

  while (match !== null) {
    const key = match[1] || match[2];
    if (key)
      keys.push(key);
    match = linkedKeyRegex.exec(value);
  }

  return keys;
}

export interface PreparedUsedKeys {
  directKeys: Set<string>;
  ignoreRegexps: RegExp[];
  wildcardPrefixes: string[];
}

export function prepareUsedKeys(usedKeys: Set<string>, ignorePatterns: string[]): PreparedUsedKeys {
  const directKeys = new Set<string>();
  const wildcardPrefixes: string[] = [];

  for (const key of usedKeys) {
    if (key.endsWith('*')) {
      wildcardPrefixes.push(key.slice(0, -1));
    }
    else {
      directKeys.add(key);
    }
  }

  const ignoreRegexps = ignorePatterns.map(
    pattern => new RegExp(`^${pattern.replace(/[$()+?[\\\]^{|}]/g, '\\$&').replace(/\./g, '\\.').replace(/\*/g, '.*')}$`),
  );

  return { directKeys, ignoreRegexps, wildcardPrefixes };
}

export function isKeyUsed(keyPath: string, prepared: PreparedUsedKeys): boolean {
  if (prepared.directKeys.has(keyPath))
    return true;

  let dotIndex = keyPath.indexOf('.');
  while (dotIndex !== -1) {
    if (prepared.directKeys.has(keyPath.slice(0, dotIndex)))
      return true;
    dotIndex = keyPath.indexOf('.', dotIndex + 1);
  }

  for (const prefix of prepared.wildcardPrefixes) {
    if (keyPath.startsWith(prefix))
      return true;
  }

  for (const regex of prepared.ignoreRegexps) {
    if (regex.test(keyPath))
      return true;
  }

  return false;
}

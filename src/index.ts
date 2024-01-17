import { configs } from './configs';
import plugin from './plugin';
import type { Linter } from 'eslint';

export default Object.assign(plugin, { configs });

type RuleDefinitions = typeof plugin['rules'];

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K]['defaultOptions']
};

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>
};

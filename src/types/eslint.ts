import type { SourceCode } from './vue-parser-services';
import type { Rule } from 'eslint';
import type { RuleContext as TSESLintRuleContext } from '@typescript-eslint/utils/ts-eslint';

export interface RuleModule<
  T extends readonly unknown[],
> extends Rule.RuleModule {
  defaultOptions: T;
}

export interface RuleContext<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
> extends Omit<TSESLintRuleContext<TMessageIds, TOptions>, 'sourceCode'> {
  sourceCode: Readonly<SourceCode>;
}

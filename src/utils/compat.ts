import type { RuleContext, SourceCode } from '../types';

export function getFilename<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(context: RuleContext<TMessageIds, TOptions>): string {
  return context.filename;
}

export function getSourceCode<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(context: RuleContext<TMessageIds, TOptions>): SourceCode {
  return context.sourceCode;
}

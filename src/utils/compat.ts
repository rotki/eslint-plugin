import type { RuleContext, SourceCode } from '../types';
import * as compat from 'eslint-compat-utils';

export function getFilename<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(context: RuleContext<TMessageIds, TOptions>): string {
  return compat.getFilename(context as never);
}

export function getSourceCode<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(context: RuleContext<TMessageIds, TOptions>): SourceCode {
  return compat.getSourceCode(context as never) as never;
}

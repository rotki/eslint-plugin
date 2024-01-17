import * as compat from 'eslint-compat-utils';
import type { RuleContext, SourceCode } from '../types';

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

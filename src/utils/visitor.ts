import { extname } from 'node:path';
import { getFilename, getSourceCode } from './compat';
import type { ReportDescriptor, RuleContext, RuleListener, TemplateBodyVisitor } from '../types';

/**
 * Register the given visitor to parser services. from GitHub `vuejs/eslint-plugin-vue` repo
 *
 * @see https://github.com/vuejs/eslint-plugin-vue/blob/959858c877b4192cb3b289aaeb010e9355211306/lib/utils/index.js#L2223
 */
export function defineTemplateBodyVisitor<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>(
  context: RuleContext<TMessageIds, TOptions >,
  templateBodyVisitor: TemplateBodyVisitor,
  scriptVisitor?: TemplateBodyVisitor,
  options?: { templateBodyTriggerSelector: 'Program' | 'Program:exit' },
): RuleListener {
  const sourceCode = getSourceCode(context);
  const parserServices = sourceCode.parserServices;
  if (
    !('defineTemplateBodyVisitor' in parserServices)
    || parserServices.defineTemplateBodyVisitor == null
  ) {
    const filename = getFilename(context);
    if (extname(filename) === '.vue') {
      context.report({
        loc: { column: 0, line: 1 },
        message:
          'Use the latest vue-eslint-parser. See also https://github.com/vuejs/eslint-plugin-vue#what-is-the-use-the-latest-vue-eslint-parser-error',
      } as unknown as ReportDescriptor<TMessageIds>);
    }
    return {};
  }
  return parserServices.defineTemplateBodyVisitor(
    templateBodyVisitor,
    scriptVisitor,
    options,
  );
}

import { extname } from 'node:path';
import {
  type RuleContext,
  type RuleListener,
  type TemplateListener,
} from '../types';

const UNEXPECTED_ERROR_LOCATION = { line: 1, column: 0 };

/**
 * Register the given visitor to parser services.
 * Borrow from GitHub `vuejs/eslint-plugin-vue` repo
 * @see https://github.com/vuejs/eslint-plugin-vue/blob/master/lib/utils/index.js#L54
 */
export function defineTemplateBodyVisitor(
  context: RuleContext,
  templateBodyVisitor: TemplateListener,
  scriptVisitor?: RuleListener,
): RuleListener {
  const sourceCode = context.getSourceCode();
  if (sourceCode.parserServices.defineTemplateBodyVisitor == null) {
    const filename = context.getFilename();
    if (extname(filename) === '.vue') {
      context.report({
        loc: UNEXPECTED_ERROR_LOCATION,
        message:
          'Use the latest vue-eslint-parser. See also https://github.com/vuejs/eslint-plugin-vue#what-is-the-use-the-latest-vue-eslint-parser-error',
      });
    }
    return {};
  }
  return sourceCode.parserServices.defineTemplateBodyVisitor(
    templateBodyVisitor,
    scriptVisitor,
  );
}

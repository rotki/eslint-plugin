import type { TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, getSourceCode } from '../utils';
import { DIRECTIVE_COMMENT } from '../utils/comment';

export const RULE_NAME = 'no-comment-run';

export type MessageIds = 'run';

export type Options = [];

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const source = getSourceCode(context);

    return {
      'Program:exit': () => {
        let run: TSESTree.Comment[] = [];

        const flush = (): void => {
          if (run.length >= 2 && !run.every(comment => DIRECTIVE_COMMENT.test(comment.value))) {
            context.report({
              data: { count: run.length },
              loc: { end: run.at(-1)!.loc.end, start: run[0].loc.start },
              messageId: 'run',
            });
          }
          run = [];
        };

        for (const comment of source.getAllComments()) {
          if (comment.type !== 'Line')
            continue;

          const previous = run.at(-1);
          const contiguous = previous
            && comment.loc.start.line === previous.loc.end.line + 1
            && comment.loc.start.column === previous.loc.start.column;

          if (!contiguous)
            flush();
          run.push(comment);
        }
        flush();
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Disallow consecutive `//` comment lines',
      recommendation: 'stylistic',
    },
    messages: {
      run: 'Consecutive `//` lines ({{count}}). Put it in the enclosing declaration\'s TSDoc, encode it as a name or an assertion, or cut it to one line.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

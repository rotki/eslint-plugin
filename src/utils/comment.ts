import type { SourceCode } from '../types';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

/**
 * Matches a `//` comment carrying a directive rather than prose.
 *
 * @remarks
 * Directives stack legitimately: silencing two rules on one line needs two of them, and a
 * `@ts-expect-error` may sit alongside one.
 */
export const DIRECTIVE_COMMENT = /^\s*(?:eslint-|@ts-(?:expect-error|ignore|nocheck)|prettier-|[cv]8 ignore|istanbul )/;

/**
 * Collects the `//` comments directly above a node, in source order.
 *
 * @remarks
 * Walks upwards from the node and stops at the first line that is not an adjacent `//` comment, so
 * a blank line ends the run. Stops at a directive as well, which is aimed at the code below rather
 * than documenting it. Reads through an `export`, where the comment attaches to the export rather
 * than to the declaration inside it.
 *
 * @param source - the rule context's source code object
 * @param node - the declaration to look above
 * @returns the adjacent comments, nearest to the node last, or an empty array
 */
export function attachedLineComments(source: SourceCode, node: TSESTree.Node): TSESTree.Comment[] {
  const parent = node.parent;
  const exported = parent?.type === AST_NODE_TYPES.ExportNamedDeclaration
    || parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration;
  const target = exported && parent ? parent : node;

  const attached: TSESTree.Comment[] = [];
  let line = target.loc.start.line;

  const before = source.getCommentsBefore(target);

  for (const comment of before.slice().reverse()) {
    if (comment.type !== 'Line' || comment.loc.end.line !== line - 1 || DIRECTIVE_COMMENT.test(comment.value))
      break;
    attached.unshift(comment);
    line = comment.loc.start.line;
  }

  return attached;
}

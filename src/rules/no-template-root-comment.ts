import type { AST as VAST } from 'vue-eslint-parser';
import type { RuleFix, RuleFixer } from '../types';
import { createEslintRule, getSourceCode } from '../utils';

export const RULE_NAME = 'no-template-root-comment';

export type MessageIds = 'rootComment';

export type Options = [];

type TemplateComment = VAST.Token;

type TemplateBody = VAST.VElement & VAST.HasConcreteInfo;

/** The SFC program as vue-eslint-parser produces it, with the template attached. */
function hasTemplateBody(ast: object): ast is { templateBody: TemplateBody } {
  return 'templateBody' in ast && typeof ast.templateBody === 'object' && ast.templateBody !== null;
}

function directiveName(attribute: VAST.VAttribute | VAST.VDirective): string | undefined {
  if (!attribute.directive)
    return undefined;
  return attribute.key.name.name;
}

function hasDirective(element: VAST.VElement, name: string): boolean {
  return element.startTag.attributes.some(attribute => directiveName(attribute) === name);
}

/** An element that continues a `v-if` chain renders in place of its sibling, not beside it. */
function continuesChain(element: VAST.VElement): boolean {
  return hasDirective(element, 'else') || hasDirective(element, 'else-if');
}

/**
 * The root elements of a template that renders a single root node, or `undefined` when the
 * template is a fragment anyway: several roots, a `v-for` root, a `<template>` or `<slot>` root,
 * or text and interpolations beside the root.
 */
function singleRoot(templateBody: TemplateBody): VAST.VElement[] | undefined {
  const elements: VAST.VElement[] = [];
  for (const child of templateBody.children) {
    if (child.type === 'VElement')
      elements.push(child);
    else if (child.type === 'VExpressionContainer' || child.value.trim() !== '')
      return undefined;
  }

  const branches = elements.filter(element => !continuesChain(element));
  if (branches.length !== 1)
    return undefined;

  const fragmentRoot = elements.some(element =>
    hasDirective(element, 'for') || element.name === 'template' || element.name === 'slot');
  return fragmentRoot ? undefined : elements;
}

function lineStart(text: string, index: number): number {
  return text.lastIndexOf('\n', index - 1) + 1;
}

function lineEnd(text: string, index: number): number {
  const end = text.indexOf('\n', index);
  return end === -1 ? text.length : end;
}

/** The comment's own range, widened to its whole line when nothing else shares that line. */
function removalRange(text: string, comment: TemplateComment): [number, number] {
  const [start, end] = comment.range;
  const from = lineStart(text, start);
  const to = lineEnd(text, end);
  const aloneOnLine = text.slice(from, start).trim() === '' && text.slice(end, to).trim() === '';
  if (!aloneOnLine)
    return [start, end];
  return [from, Math.min(to + 1, text.length)];
}

/** The comment's text with its continuation lines shifted to sit under the new indentation. */
function reindent(text: string, comment: TemplateComment, indent: string): string {
  const [start, end] = comment.range;
  const column = start - lineStart(text, start);
  const shift = indent.length - column;
  const [first, ...rest] = text.slice(start, end).split('\n');
  const moved = rest.map((line) => {
    if (shift >= 0)
      return line === '' ? line : `${' '.repeat(shift)}${line}`;
    const removable = Math.min(-shift, line.length - line.trimStart().length);
    return line.slice(removable);
  });
  return [first, ...moved].join('\n');
}

/**
 * The root element a comment moves into: the first one that starts after it, so a comment that
 * labels a `v-if` branch lands inside that branch, or the last one for comments after them all.
 */
function targetOf(comment: TemplateComment, roots: VAST.VElement[]): VAST.VElement | undefined {
  return roots.find(root => root.range[0] >= comment.range[1]) ?? roots.at(-1);
}

/** Moves comments into one root element: those before it to its start, those after it to its end. */
function moveInto(
  text: string,
  root: VAST.VElement & { endTag: VAST.VEndTag },
  comments: TemplateComment[],
  fixer: RuleFixer,
): RuleFix[] {
  const rootIndent = ' '.repeat(root.range[0] - lineStart(text, root.range[0]));
  const indent = `${rootIndent}  `;
  const before = comments.filter(comment => comment.range[1] <= root.range[0]);
  const after = comments.filter(comment => comment.range[0] >= root.range[1]);
  const fixes: RuleFix[] = [];

  if (before.length > 0) {
    const moved = before.map(comment => `\n${indent}${reindent(text, comment, indent)}`).join('');
    fixes.push(fixer.insertTextAfterRange(root.startTag.range, moved));
  }

  if (after.length > 0) {
    const endLine = lineStart(text, root.endTag.range[0]);
    const endTagOnOwnLine = text.slice(endLine, root.endTag.range[0]).trim() === '';
    const moved = after.map(comment => `${indent}${reindent(text, comment, indent)}\n`).join('');
    fixes.push(endTagOnOwnLine
      ? fixer.insertTextBeforeRange([endLine, endLine], moved)
      : fixer.insertTextBeforeRange(root.endTag.range, moved.trim()));
  }

  return fixes;
}

function hasEndTag(element: VAST.VElement): element is VAST.VElement & { endTag: VAST.VEndTag } {
  return element.endTag !== null;
}

/**
 * Moves every root-level comment inside a root element, in its original order. A self-closing
 * target has no content to take the comment, so nothing is fixed then.
 */
function moveInside(
  text: string,
  roots: VAST.VElement[],
  comments: TemplateComment[],
  fixer: RuleFixer,
): RuleFix[] | null {
  const targets = new Map<VAST.VElement, TemplateComment[]>();
  for (const comment of comments) {
    const target = targetOf(comment, roots);
    if (!target)
      return null;
    targets.set(target, [...(targets.get(target) ?? []), comment]);
  }

  const fixes = comments.map(comment => fixer.removeRange(removalRange(text, comment)));
  for (const [target, moved] of targets) {
    if (!hasEndTag(target))
      return null;
    fixes.push(...moveInto(text, target, moved, fixer));
  }
  return fixes;
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const sourceCode = getSourceCode(context);
    return {
      Program() {
        const ast = sourceCode.ast;
        if (!hasTemplateBody(ast))
          return;

        const templateBody = ast.templateBody;
        const roots = singleRoot(templateBody);
        if (!roots)
          return;

        const comments = templateBody.comments.filter(comment =>
          !roots.some(root => comment.range[0] >= root.range[0] && comment.range[1] <= root.range[1]));
        if (comments.length === 0)
          return;

        const text = sourceCode.text;

        comments.forEach((comment, index) => {
          context.report({
            fix: index === 0
              ? fixer => moveInside(text, roots, comments, fixer)
              : null,
            loc: {
              end: sourceCode.getLocFromIndex(comment.range[1]),
              start: sourceCode.getLocFromIndex(comment.range[0]),
            },
            messageId: 'rootComment',
          });
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'disallow comments beside a template\'s single root element',
      recommendation: 'recommended',
    },
    fixable: 'code',
    messages: {
      rootComment: 'This comment sits beside the template\'s root element, so development builds render the component as a fragment: attributes stop falling through and a parent <Transition> cannot animate it. Move the comment inside the root element or into the script block.',
    },
    schema: [],
    type: 'problem',
  },
  name: RULE_NAME,
});

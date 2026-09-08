import type { SourceCode } from '../types';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createEslintRule, getSourceCode } from '../utils';
import { DIRECTIVE_COMMENT } from '../utils/comment';

export const RULE_NAME = 'no-leading-body-comment';

export type MessageIds = 'body' | 'callback' | 'testBody';

export type Options = [];

/** The callers whose function argument is a test body, where the title stands in for a declaration. */
const TEST_CALLERS = new Set(['it', 'test', 'bench']);

/** The callers whose function argument groups tests rather than being a body of its own. */
const SUITE_CALLERS = new Set(['describe', 'suite']);

/**
 * The lifecycle hooks, whose callback is exempt.
 *
 * @remarks
 * A hook has neither a declaration to document nor a title to fold into, and its body is setup that
 * reads no better as a named function, so the rule would have no fix to offer and would produce
 * suppressions instead. Length is what makes a hook body worth extracting, and `max-statements`
 * judges that better than this rule can.
 */
const HOOK_CALLERS = new Set(['beforeEach', 'afterEach', 'beforeAll', 'afterAll', 'onTestFinished']);

/** Statements that a comment above them documents, rather than explaining the function they open. */
const DECLARATIONS = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ClassDeclaration,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.TSEnumDeclaration,
  AST_NODE_TYPES.TSInterfaceDeclaration,
  AST_NODE_TYPES.TSTypeAliasDeclaration,
  AST_NODE_TYPES.VariableDeclaration,
]);

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

/** The name a call was made under, reading through `it.each(table)` and `test.skip`. */
function callerName(callee: TSESTree.Node): string | undefined {
  if (callee.type === AST_NODE_TYPES.Identifier)
    return callee.name;

  if (callee.type === AST_NODE_TYPES.MemberExpression)
    return callerName(callee.object);

  if (callee.type === AST_NODE_TYPES.CallExpression)
    return callerName(callee.callee);

  if (callee.type === AST_NODE_TYPES.TaggedTemplateExpression)
    return callerName(callee.tag);

  return undefined;
}

/**
 * The name of the call this function was passed to, or `undefined` when it stands on its own.
 *
 * @remarks
 * A function reached as the `callee` is an immediately invoked expression rather than an argument,
 * which is what separates the two without inspecting the argument list.
 */
function enclosingCaller(node: FunctionNode): string | undefined {
  const parent = node.parent;
  if (parent?.type !== AST_NODE_TYPES.CallExpression || parent.callee === node)
    return undefined;

  return callerName(parent.callee);
}

/** Whether a statement is a bare call to one of `names`, such as the `it(...)` opening a suite. */
function isCallTo(statement: TSESTree.Statement, names: Set<string>): boolean {
  if (statement.type !== AST_NODE_TYPES.ExpressionStatement || statement.expression.type !== AST_NODE_TYPES.CallExpression)
    return false;

  const name = callerName(statement.expression.callee);
  return name !== undefined && names.has(name);
}

/**
 * The comment opening a body, or `undefined` when what sits there is not this rule's concern.
 *
 * @remarks
 * Three things are not: a directive, which is aimed at the code rather than describing it; a
 * trailing comment, which annotates the statement it shares a line with; and a TSDoc block over a
 * declaration, which documents that declaration rather than the function holding it and is
 * `tsdoc-on-declaration` working as intended. Only a `/**` block earns the last one, since a plain
 * block or a `//` above the same declaration is prose until it is rewritten as TSDoc.
 */
function openingComment(source: SourceCode, first: TSESTree.Statement): TSESTree.Comment | undefined {
  const comment = source.getCommentsBefore(first).at(-1);
  if (!comment || DIRECTIVE_COMMENT.test(comment.value) || comment.loc.start.line >= first.loc.start.line)
    return undefined;

  const documentsDeclaration = comment.type === 'Block'
    && comment.value.startsWith('*')
    && DECLARATIONS.has(first.type);

  return documentsDeclaration ? undefined : comment;
}

/** The advice that fits where the comment sits: a declaration, a title, or neither. */
function messageFor(caller: string | undefined): MessageIds {
  if (caller === undefined)
    return 'body';

  return TEST_CALLERS.has(caller) ? 'testBody' : 'callback';
}

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const source = getSourceCode(context);

    const check = (node: FunctionNode): void => {
      if (node.body.type !== AST_NODE_TYPES.BlockStatement)
        return;

      const caller = enclosingCaller(node);
      if (caller !== undefined && (SUITE_CALLERS.has(caller) || HOOK_CALLERS.has(caller)))
        return;

      const [first] = node.body.body;

      // A comment that is the whole body of an intentionally empty function is where it belongs.
      if (!first)
        return;

      // A comment introducing a test describes that test, which is the title's job, not a declaration's.
      if (isCallTo(first, TEST_CALLERS))
        return;

      const comment = openingComment(source, first);
      if (!comment)
        return;

      context.report({
        data: { caller: caller ?? '' },
        loc: comment.loc,
        messageId: messageFor(caller),
      });
    };

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Disallow a comment as the first thing in a function body',
      recommendation: 'stylistic',
    },
    messages: {
      body: 'Comment opening a function body. It explains the function, so move it to the function\'s TSDoc; if it explains only the statements below it, extract those into a named function of their own.',
      callback: 'Comment opening the callback passed to `{{caller}}`. A callback has no declaration to document, so lift the body into a named, documented function and pass that instead.',
      testBody: 'Comment opening a test body. A test has no declaration to document, so fold it into the title, which is what a failure prints.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { attachedLineComments, createEslintRule, getSourceCode } from '../utils';

export const RULE_NAME = 'tsdoc-on-declaration';

export type MessageIds = 'useTsdoc';

export type Options = [];

/** The declaration node types that take TSDoc, mapped to the noun a report calls each one. */
const DECLARATION_KINDS: Record<string, string> = {
  ClassDeclaration: 'class',
  FunctionDeclaration: 'function',
  MethodDefinition: 'method',
  TSDeclareFunction: 'function',
  TSEnumDeclaration: 'enum',
  TSInterfaceDeclaration: 'interface',
  TSModuleDeclaration: 'module',
  TSTypeAliasDeclaration: 'type',
};

const FUNCTION_INITIALIZERS = new Set([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
]);

export default createEslintRule<Options, MessageIds>({
  create(context) {
    const source = getSourceCode(context);

    const check = (node: TSESTree.Node, kind: string): void => {
      const [first] = attachedLineComments(source, node);
      if (first)
        context.report({ data: { kind }, loc: first.loc, messageId: 'useTsdoc' });
    };

    const visitors = Object.fromEntries(
      Object.entries(DECLARATION_KINDS).map(([type, kind]) => [
        type,
        (node: TSESTree.Node) => check(node, kind),
      ]),
    );

    return {
      ...visitors,
      VariableDeclaration: (node: TSESTree.VariableDeclaration) => {
        const init = node.declarations.length === 1 ? node.declarations[0].init : undefined;
        if (init && FUNCTION_INITIALIZERS.has(init.type))
          check(node, 'function');
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Document a declaration with TSDoc rather than `//`',
      recommendation: 'stylistic',
    },
    messages: {
      useTsdoc: 'Document this {{kind}} with a TSDoc block (/** ... */), not `//`.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: RULE_NAME,
});

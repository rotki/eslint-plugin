import type { RuleListener as TSRuleListener, SourceCode as TSSourceCode } from '@typescript-eslint/utils/ts-eslint';
import type { AST, Rule } from 'eslint';
import type { HasLocation } from 'vue-eslint-parser/ast/locations';
import type { ESLintExtendedProgram, ESLintProgram, VDocumentFragment, VElement } from 'vue-eslint-parser/ast/nodes';
import type { Token } from 'vue-eslint-parser/ast/tokens';

export type SkipOptions = number | ((token: Token) => boolean) | {
  includeComments?: boolean;
  filter?: (token: Token) => boolean;
  skip?: number;
};

export type CountOptions = number | ((token: Token) => boolean) | {
  includeComments?: boolean;
  filter?: (token: Token) => boolean;
  count?: number;
};

export interface TokenStore {
  /**
   * Gets the token starting at the specified index.
   * @param offset - Index of the start of the token's range.
   * @param options - The option object.
   * @returns The token starting at index, or null if no such token.
   */
  getTokenByRangeStart: (
    offset: number,
    options?: { includeComments: boolean },
  ) => Token | null;
  /**
   * Gets the first token of the given node.
   * @param node - The AST node.
   * @param options - The option object.
   * @returns An object representing the token.
   */
  getFirstToken: (node: HasLocation, options?: SkipOptions) => Token | null;
  /**
   * Gets the last token of the given node.
   * @param node - The AST node.
   * @param options - The option object.
   * @returns An object representing the token.
   */
  getLastToken: (node: HasLocation, options?: SkipOptions) => Token | null;
  /**
   * Gets the token that precedes a given node or token.
   * @param node - The AST node or token.
   * @param options - The option object.
   * @returns An object representing the token.
   */
  getTokenBefore: (node: HasLocation, options?: SkipOptions) => Token | null;
  /**
   * Gets the token that follows a given node or token.
   * @param node - The AST node or token.
   * @param options - The option object.
   * @returns An object representing the token.
   */
  getTokenAfter: (node: HasLocation, options?: SkipOptions) => Token | null;
  /**
   * Gets the first token between two non-overlapping nodes.
   * @param left - Node before the desired token range.
   * @param right - Node after the desired token range.
   * @param options - The option object.
   * @returns An object representing the token.
   */
  getFirstTokenBetween: (left: HasLocation, right: HasLocation, options?: SkipOptions) => Token | null;
  /**
   * Gets the last token between two non-overlapping nodes.
   * @param left Node before the desired token range.
   * @param right Node after the desired token range.
   * @param options - The option object.
   * @returns An object representing the token.
   */
  getLastTokenBetween: (left: HasLocation, right: HasLocation, options?: SkipOptions) => Token | null;
  /**
   * Gets the first `count` tokens of the given node.
   * @param node - The AST node.
   * @param [options=0] - The option object. If this is a number then it's `options.count`. If this is a function then it's `options.filter`.
   * @param [options.includeComments=false] - The flag to iterate comments as well.
   * @param [options.filter=null] - The predicate function to choose tokens.
   * @param [options.count=0] - The maximum count of tokens the cursor iterates.
   * @returns Tokens.
   */
  getFirstTokens: (node: HasLocation, options?: CountOptions) => Token[];
  /**
   * Gets the last `count` tokens of the given node.
   * @param node - The AST node.
   * @param [options=0] - The option object. Same options as getFirstTokens()
   * @returns Tokens.
   */
  getLastTokens: (node: HasLocation, options?: CountOptions) => Token[];
  /**
   * Gets the `count` tokens that precedes a given node or token.
   * @param node - The AST node or token.
   * @param [options=0] - The option object. Same options as getFirstTokens()
   * @returns Tokens.
   */
  getTokensBefore: (node: HasLocation, options?: CountOptions) => Token[];
  /**
   * Gets the `count` tokens that follows a given node or token.
   * @param node - The AST node or token.
   * @param [options=0] - The option object. Same options as getFirstTokens()
   * @returns Tokens.
   */
  getTokensAfter: (node: HasLocation, options?: CountOptions) => Token[];
  /**
   * Gets the first `count` tokens between two non-overlapping nodes.
   * @param left - Node before the desired token range.
   * @param right - Node after the desired token range.
   * @param [options=0] - The option object. Same options as getFirstTokens()
   * @returns Tokens between left and right.
   */
  getFirstTokensBetween: (left: HasLocation, right: HasLocation, options?: CountOptions) => Token[];
  /**
   * Gets the last `count` tokens between two non-overlapping nodes.
   * @param left Node before the desired token range.
   * @param right Node after the desired token range.
   * @param [options=0] - The option object. Same options as getFirstTokens()
   * @returns Tokens between left and right.
   */
  getLastTokensBetween: (left: HasLocation, right: HasLocation, options?: CountOptions) => Token[];
  /**
   * Gets all tokens that are related to the given node.
   * @param node - The AST node.
   * @param beforeCount - The number of tokens before the node to retrieve.
   * @param afterCount - The number of tokens after the node to retrieve.
   * @returns Array of objects representing tokens.
   */
  getTokens: (node: HasLocation, beforeCount?: CountOptions, afterCount?: number) => Token[];
  /**
   * Gets all of the tokens between two non-overlapping nodes.
   * @param left Node before the desired token range.
   * @param right Node after the desired token range.
   * @param padding Number of extra tokens on either side of center.
   * @returns Tokens between left and right.
   */
  getTokensBetween: (left: HasLocation, right: HasLocation, padding?: CountOptions) => Token[];
  /**
   * Checks whether any comments exist or not between the given 2 nodes.
   *
   * @param left - The node to check.
   * @param right - The node to check.
   * @returns `true` if one or more comments exist.
   */
  commentsExistBetween: (left: HasLocation, right: HasLocation) => boolean;
  /**
   * Gets all comment tokens directly before the given node or token.
   * @param nodeOrToken The AST node or token to check for adjacent comment tokens.
   * @returns An array of comments in occurrence order.
   */
  getCommentsBefore: (nodeOrToken: HasLocation) => Token[];
  /**
   * Gets all comment tokens directly after the given node or token.
   * @param nodeOrToken The AST node or token to check for adjacent comment tokens.
   * @returns An array of comments in occurrence order.
   */
  getCommentsAfter: (nodeOrToken: HasLocation) => Token[];
  /**
   * Gets all comment tokens inside the given node.
   * @param node The AST node to get the comments for.
   * @returns An array of comments in occurrence order.
   */
  getCommentsInside: (node: HasLocation) => Token[];
}

/**
 * The type of basic ESLint custom parser.
 * e.g. espree
 */
export interface BasicParserObject<R = ESLintProgram> {
  parse: (code: string, options: any) => R;
  parseForESLint: undefined;
};

/**
 * The type of ESLint custom parser enhanced for ESLint.
 * e.g. @babel/eslint-parser, @typescript-eslint/parser
 */
export interface EnhancedParserObject<R = ESLintExtendedProgram> {
  parseForESLint: (code: string, options: any) => R;
  parse: undefined;
};

/**
 * The type of ESLint (custom) parsers.
 */
export type ParserObject<R1 = ESLintExtendedProgram, R2 = ESLintProgram> =
  | EnhancedParserObject<R1>
  | BasicParserObject<R2>;

export type ESLintCustomBlockParser = ParserObject<any, any>;

export interface CustomBlockContext {
  getSourceCode: () => SourceCode;
  sourceCode: SourceCode;
  parserServices: any;
  getAncestors: () => any[];
  getDeclaredVariables: (node: any) => any[];
  getScope: () => any;
  markVariableAsUsed: (name: string) => boolean;

  // Same as the original context.
  id: string;
  options: any[];
  settings: { [name: string]: any };
  parserPath: string;
  parserOptions: any;
  getFilename: () => string;
  report: (descriptor: Rule.ReportDescriptor) => void;
};

type CustomBlockVisitorFactory = (context: CustomBlockContext) =>
  | {
    [key: string]: (...args: any) => void;
  }
  | null
  | undefined;

export interface ParserServices {
  /**
   * Define handlers to traverse the template body.
   * @param templateBodyVisitor The template body handlers.
   * @param scriptVisitor The script handlers. This is optional.
   * @param options The options. This is optional.
   */
  defineTemplateBodyVisitor: (
    templateBodyVisitor: { [key: string]: (...args: any) => void },
    scriptVisitor?: { [key: string]: (...args: any) => void },
    options?: { templateBodyTriggerSelector: 'Program' | 'Program:exit' },
  ) => RuleListener;

  /**
   * Define handlers to traverse the document.
   * @param documentVisitor The document handlers.
   * @param options The options. This is optional.
   */
  defineDocumentVisitor: (
    documentVisitor: { [key: string]: (...args: any) => void },
    options?: { triggerSelector: 'Program' | 'Program:exit' },
  ) => object;

  /**
   * Define handlers to traverse custom blocks.
   * @param context The rule context.
   * @param parser The custom parser.
   * @param rule The custom block rule definition
   * @param scriptVisitor The script handlers. This is optional.
   */
  defineCustomBlocksVisitor: (
    context: Rule.RuleContext,
    parser: ESLintCustomBlockParser,
    rule: {
      target:
        | string
        | string[]
        | ((lang: string | null, customBlock: VElement) => boolean);
      create: CustomBlockVisitorFactory;
    },
    scriptVisitor: { [key: string]: (...args: any) => void },
  ) => { [key: string]: (...args: any) => void };

  /**
   * Get the token store of the template body.
   * @returns The token store of template body.
   */
  getTemplateBodyTokenStore: () => TokenStore;

  /**
   * Get the root document fragment.
   * @returns The root document fragment.
   */
  getDocumentFragment: () => VDocumentFragment | null;
}

export type SourceCode = TokenStore & Omit<TSSourceCode, 'parserServices'> & {
  parserServices: ParserServices | TSSourceCode['parserServices'];
};

export interface TemplateBodyVisitor {
  [key: string]: (...args: any) => void;
}

export type RuleListener = TSRuleListener;

export type Range = AST.Range;

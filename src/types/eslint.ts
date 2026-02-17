import type { ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import type { AST, Rule } from 'eslint';
import type { AST as VAST } from 'vue-eslint-parser';
import type { SourceCode } from './vue-parser-services';

type Node = VAST.Node;

export interface RuleCreateAndOptions<TOptions extends readonly unknown[], TMessageIds extends string> {
  create: (context: Readonly<RuleContext<TMessageIds, TOptions>>, optionsWithDefault: Readonly<TOptions>) => TSESLint.RuleListener;
  defaultOptions: Readonly<TOptions>;
}

export interface RuleWithMeta<TOptions extends readonly unknown[], TMessageIds extends string, Docs = unknown> extends RuleCreateAndOptions<TOptions, TMessageIds> {
  meta: TSESLint.RuleMetaData<TMessageIds, Docs>;
}

export interface RuleWithMetaAndName<TOptions extends readonly unknown[], TMessageIds extends string, Docs = unknown> extends RuleCreateAndOptions<TOptions, TMessageIds> {
  meta: ESLintUtils.NamedCreateRuleMeta<TMessageIds, Docs>;
  name: string;
}

interface RuleFix {
  range: Readonly<AST.Range>;
  text: string;
}

type NodeOrToken = TSESTree.Node | TSESTree.Token | Node;

interface RuleFixer {
  insertTextAfter: (nodeOrToken: NodeOrToken, text: string) => RuleFix;
  insertTextAfterRange: (range: Readonly<AST.Range>, text: string) => RuleFix;
  insertTextBefore: (nodeOrToken: NodeOrToken, text: string) => RuleFix;
  insertTextBeforeRange: (range: Readonly<AST.Range>, text: string) => RuleFix;
  remove: (nodeOrToken: NodeOrToken) => RuleFix;
  removeRange: (range: Readonly<AST.Range>) => RuleFix;
  replaceText: (nodeOrToken: NodeOrToken, text: string) => RuleFix;
  replaceTextRange: (range: Readonly<AST.Range>, text: string) => RuleFix;
}

interface SuggestionReportDescriptor<TMessageIds extends string> extends Omit<ReportDescriptorBase<TMessageIds>, 'fix'> {
  readonly fix: ReportFixFunction;
}

type ReportFixFunction = (fixer: RuleFixer) => IterableIterator<RuleFix> | RuleFix | readonly RuleFix[] | null;

type ReportSuggestionArray<TMessageIds extends string> = SuggestionReportDescriptor<TMessageIds>[];

type ReportDescriptorMessageData = Readonly<Record<string, unknown>>;

interface ReportDescriptorBase<TMessageIds extends string> {
  /**
   * The parameters for the message string associated with `messageId`.
   */
  readonly data?: ReportDescriptorMessageData;
  /**
   * The fixer function.
   */
  readonly fix?: ReportFixFunction | null;
  /**
   * The messageId which is being reported.
   */
  readonly messageId: TMessageIds;
}

interface ReportDescriptorWithSuggestion<TMessageIds extends string> extends ReportDescriptorBase<TMessageIds> {
  /**
   * 6.7's Suggestions API
   */
  readonly suggest?: Readonly<ReportSuggestionArray<TMessageIds>> | null;
}

interface ReportDescriptorNodeOptionalLoc {
  /**
   * The Node or AST Token which the report is being attached to
   */
  readonly node: NodeOrToken;
  /**
   * An override of the location of the report
   */
  readonly loc?: Readonly<TSESTree.Position> | Readonly<TSESTree.SourceLocation>;
}

interface ReportDescriptorLocOnly {
  /**
   * An override of the location of the report
   */
  loc: Readonly<TSESTree.Position> | Readonly<TSESTree.SourceLocation>;
}

export type ReportDescriptor<TMessageIds extends string> = ReportDescriptorWithSuggestion<TMessageIds> & (ReportDescriptorLocOnly | ReportDescriptorNodeOptionalLoc);

export interface RuleModule<
  TMessageIds extends string,
  TOptions extends readonly unknown[] = [],
  TRuleListener extends TSESLint.RuleListener = TSESLint.RuleListener,
> {
  /**
   * Default options the rule will be run with
   */
  defaultOptions: TOptions;
  /**
   * Metadata about the rule
   */
  meta: TSESLint.RuleMetaData<TMessageIds, TOptions>;
  /**
   * Function which returns an object with methods that ESLint calls to “visit”
   * nodes while traversing the abstract syntax tree.
   */
  create: (context: Readonly<RuleContext<TMessageIds, TOptions>>) => TRuleListener;
}

export interface PluginRuleModule<TOptions extends readonly unknown[] = []> extends Rule.RuleModule {
  defaultOptions: TOptions;
}

export interface RuleContext<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
> extends Omit<TSESLint.RuleContext<TMessageIds, TOptions>, 'sourceCode' | 'report'> {
  sourceCode: Readonly<SourceCode>;
  report: (descriptor: ReportDescriptor<TMessageIds>) => void;
}

export interface RuleRecommendationMeta {
  recommendation?: TSESLint.RuleRecommendation;
}

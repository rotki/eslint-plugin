import type {
  PluginRuleModule,
  RuleContext,
  RuleListener,
  RuleModule,
  RuleRecommendationMeta,
  RuleWithMeta,
  RuleWithMetaAndName,
} from '../types';

const blobUrl = 'https://rotki.github.io/eslint-plugin/rules/';

/**
 * Creates reusable function to create rules with default options and docs URLs.
 *
 * @param urlCreator Creates a documentation URL for a given rule name.
 * @returns Function to create a rule with the docs URL format.
 */
function RuleCreator(urlCreator: (ruleName: string) => string) {
  // This function will get much easier to call when this is merged https://github.com/Microsoft/TypeScript/pull/26349
  // TODO - when the above PR lands; add type checking for the context.report `data` property
  return function createNamedRule<
    TOptions extends readonly unknown[],
    TMessageIds extends string,
  >({
    meta,
      name,
      ...rule
  }: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>): RuleModule<TMessageIds, TOptions> {
    return createRule<TOptions, TMessageIds>({
      meta: {
        ...meta,
        docs: {
          ...meta.docs,
          url: urlCreator(name),
        },
      },
      ...rule,
    });
  };
}

/**
 * Creates a well-typed TSESLint custom ESLint rule without a docs URL.
 *
 * @returns Well-typed TSESLint custom ESLint rule.
 * @remarks It is generally better to provide a docs URL function to RuleCreator.
 */
function createRule<
  TOptions extends readonly unknown[],
  TMessageIds extends string,
>({
  create,
  defaultOptions,
  meta,
}: Readonly<RuleWithMeta<TOptions, TMessageIds>>): RuleModule<TMessageIds, TOptions> {
  return {
    create: ((
      context: Readonly<RuleContext<TMessageIds, TOptions>>,
    ): RuleListener => {
      const optionsWithDefault = context.options.map((options, index) => ({
        ...defaultOptions[index] || {},
        ...options || {},
      })) as unknown as TOptions;
      return create(context as any, optionsWithDefault);
    }) as any,
    defaultOptions,
    meta: meta as any,
  };
}

export const createEslintRule = RuleCreator(
  ruleName => `${blobUrl}${ruleName}`,
) as any as <TOptions extends readonly unknown[], TMessageIds extends string>({ meta, name, ...rule }: Readonly<RuleWithMetaAndName<TOptions, TMessageIds, RuleRecommendationMeta>>) => PluginRuleModule<TOptions>;

/**
 * Matches a `//` comment carrying a directive rather than prose.
 *
 * @remarks
 * Directives stack legitimately: silencing two rules on one line needs two of them, and a
 * `@ts-expect-error` may sit alongside one.
 */
export const DIRECTIVE_COMMENT = /^\s*(?:eslint-|@ts-(?:expect-error|ignore|nocheck)|prettier-|[cv]8 ignore|istanbul )/;

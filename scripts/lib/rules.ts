/**
 * Forked from https://github.com/intlify/eslint-plugin-vue-i18n/blob/master/scripts/lib/rules.ts
 */
import rulesImported from '../../src/rules'

export type RuleInfo = {
    id: string
    name: string
    category: string
    description: string
    recommended: boolean
    fixable: boolean
    deprecated: boolean
    replacedBy: string[] | null
}

const rules = Object.entries(rulesImported).map(rule => {
    const name = rule[0]
    const meta = rule[1].meta
    return {
        id: `@rotki/${name}`,
        name,
        category: String(meta.docs.category),
        description: String(meta.docs.description),
        recommended: Boolean(meta.docs.recommended),
        fixable: Boolean(meta.fixable),
        deprecated: Boolean(meta.deprecated),
        replacedBy: meta.docs.replacedBy
    } as RuleInfo
})

export default rules
export const withCategories = [
    'Recommended',
    'Best Practices',
    'Stylistic Issues'
].map(category => ({
    category,
    rules: rules.filter(rule => rule.category === category && !rule.deprecated)
}))

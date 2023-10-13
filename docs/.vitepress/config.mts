import { defineConfig } from 'vitepress';
import { withCategories } from '../../scripts/lib/rules';
import '../../scripts/update-rule-docs';
import '../../scripts/update-docs-index';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/eslint-plugin/',
  title: '@rotki/eslint-plugin',
  description: 'ESLint plugin for rotki and @rotki/ui-library',
  head: [['meta', { name: 'theme-color', content: '#4e5ba6' }]],
  lastUpdated: true,
  themeConfig: {
    editLink: {
      pattern: 'https://github.com/rotki/eslint-plugin/edit/master/docs/:path',
      text: 'Edit this page on GitHub',
    },
    nav: [
      {
        text: 'rotki.com',
        link: 'https://rotki.com',
      },
    ],
    sidebar: [
      {
        text: 'Introduction',
        link: '/intro',
      },
      {
        text: 'Getting Started',
        link: '/started',
      },
      {
        text: 'Available Rules',
        link: '/rules/',
      },
      ...withCategories.map(({ category, rules }) => ({
        text: `Rules in ${category}`,
        collapsed: false,
        items: rules.map((rule) => ({
          text: rule.name,
          link: `/rules/${rule.name}`,
        })),
      })),
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/rotki/eslint-plugin',
      },
    ],
  },
});

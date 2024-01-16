const rotki = require('@rotki/eslint-config').default;

module.exports = rotki({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  stylistic: true,
}, {
  files: ['src/**/*.ts'],
  rules: {
    'perfectionist/sort-objects': 'error',
    'no-restricted-syntax': [
      'error',
      'DebuggerStatement',
      'LabeledStatement',
      'WithStatement',
      'TSEnumDeclaration[const=true]',
    ],
  },
}, {
  files: ['scripts/**/*.ts'],
  rules: {
    '@typescript-eslint/no-floating-promises': 'off',
    'unicorn/prefer-top-level-await': 'off',
  },
}, {
  files: ['**/.vitepress/config.mts'],
  rules: {
    'import/no-default-export': 'off',
  },
});

import rotki from '@rotki/eslint-config';

export default rotki({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  stylistic: true,
  formatters: true,
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
  files: ['**/*.?([cm])ts', '**/*.md', '**/*.md/**'],
  rules: {
    'import/no-default-export': 'off',
  },
}, {
  files: ['**/*.yml', '**/*.yaml'],
  rules: {
    '@stylistic/spaced-comment': 'off',
  },
}, {
  files: ['tests/**/*.ts'],
  rules: {
    'max-lines': ['error', { max: 1000 }],
  },
}, {
  // The plugin entry imports one module per rule, so its import count tracks how many rules
  // the plugin ships rather than any coupling of its own.
  files: ['src/plugin.ts'],
  rules: {
    '@rotki/max-dependencies': 'off',
  },
});

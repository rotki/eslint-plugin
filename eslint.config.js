import rotki from '@rotki/eslint-config';

export default rotki({
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
  files: ['**/*.?([cm])ts'],
  rules: {
    'import/no-default-export': 'off',
  },
});

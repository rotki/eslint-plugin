/** DON'T EDIT THIS FILE; was created by scripts. */
export = {
  extends: [require.resolve('./base')],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es6: true,
  },
  rules: {
    '@rotki/no-deprecated-classes': 'warn' as const,
  },
};

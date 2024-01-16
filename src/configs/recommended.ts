/** DON'T EDIT THIS FILE; was created by scripts. */
export = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [require.resolve('./base')],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    '@rotki/no-deprecated-classes': 'warn' as const,
  },
};

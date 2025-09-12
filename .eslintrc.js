module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-unused-vars': 'warn',
    'no-case-declarations': 'off',
    'no-cond-assign': 'off',
    'no-undef': 'off', // TypeScript handles this
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
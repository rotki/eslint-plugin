# Getting started

## Installation

```sh
pnpm install --D --save-exact eslint @rotki/eslint-plugin
```

### Requirements
- ESLint 8.x
- NodeJS 18.x

## Usage

Add the plugin in your `.eslintrc` file

e.g.

```javascript
module.export = {
  extends: [
    'eslint:recommended',
    'plugin:@rotki/recommended'
  ],
}
```
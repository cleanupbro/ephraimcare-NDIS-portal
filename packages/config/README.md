# @ephraimcare/config

Shared configuration for ESLint and TypeScript across the monorepo.

## Contents

- `eslint/` — ESLint configurations (base, Next.js, React Native)
- `typescript/` — Shared `tsconfig.json` base files

## Usage

In `tsconfig.json`:
```json
{
  "extends": "@ephraimcare/config/typescript/nextjs.json"
}
```

In `.eslintrc.js`:
```js
module.exports = {
  extends: ['@ephraimcare/config/eslint/nextjs']
}
```

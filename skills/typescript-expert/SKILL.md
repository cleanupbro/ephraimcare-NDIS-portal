---
name: typescript-expert
description: TypeScript best practices including strict typing, generics, utility types, error handling, and type-safe API patterns. Use when writing or reviewing TypeScript code.
---

# TypeScript Expert

## Strict Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Core Principles

### Never Use `any`
- Use `unknown` for truly unknown types, then narrow
- Use generics for flexible but type-safe functions
- Use `Record<string, unknown>` instead of `Record<string, any>`

### Type Narrowing
```typescript
function process(input: string | number | null) {
  if (input === null) return 'empty'
  if (typeof input === 'string') return input.toUpperCase()
  return input.toFixed(2)
}
```

### Discriminated Unions for Results
```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function fetchUser(id: string): Result<User> {
  // TypeScript knows: if success is true, data exists
}
```

### Zod for Runtime Validation
```typescript
import { z } from 'zod'

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional()
})

type User = z.infer<typeof UserSchema>
```

## Useful Utility Types
- `Partial<T>` — all properties optional
- `Required<T>` — all properties required
- `Pick<T, K>` — subset of properties
- `Omit<T, K>` — exclude properties
- `Record<K, V>` — object with known key/value types
- `ReturnType<T>` — infer return type of function
- `Awaited<T>` — unwrap Promise type

## Error Handling
- Use typed error classes extending Error
- Never throw strings — always Error objects
- Use Result types for expected failures (validation, not-found)
- Use try/catch for unexpected failures (network, crash)

## Anti-Patterns
- Don't use `as` type assertions unless you've verified the type
- Don't use `!` non-null assertion — narrow properly
- Don't use `enum` — use `as const` objects or union types
- Don't use `Function` type — use specific signatures

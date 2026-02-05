# @ephraimcare/supabase

Supabase admin client factory for server-side operations requiring the service role key.

## Exports

- `createAdminClient()` — Creates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY` for admin operations (bypasses RLS)

## Usage

```typescript
import { createAdminClient } from '@ephraimcare/supabase'

const admin = createAdminClient()
// Use for operations that need to bypass Row Level Security
await admin.auth.admin.createUser({ ... })
```

## Note

Each app also has its own `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (SSR) for regular authenticated access through RLS.

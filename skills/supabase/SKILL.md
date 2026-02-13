---
name: supabase
description: Supabase Postgres database design, Row Level Security policies, auth, storage, edge functions, and real-time. Use when working with Supabase.
---

# Supabase

## Database Design
- Use snake_case for table and column names
- Always add `created_at` and `updated_at` timestamps
- Use UUIDs for primary keys: `id uuid default gen_random_uuid() primary key`
- Add indexes on columns used in WHERE clauses and JOINs
- Use foreign keys with ON DELETE CASCADE or SET NULL

## Row Level Security (RLS)
ALWAYS enable RLS on every table. No exceptions.

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can read their own posts
CREATE POLICY "Users read own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own posts
CREATE POLICY "Users insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Auth
- Use Supabase Auth for user management
- Access user in RLS via `auth.uid()`
- Protect API routes by checking session server-side
- Never trust client-side auth state for data access

## Client Usage
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## Anti-Patterns
- NEVER disable RLS in production
- Don't use service_role key on the client
- Don't skip migrations — use `supabase migration new`
- Don't store sensitive data without encryption

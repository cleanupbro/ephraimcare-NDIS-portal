---
name: nextjs-fullstack
description: Build Next.js applications using App Router, server components, API routes, middleware, ISR, and server actions. Use when creating or modifying Next.js projects.
---

# Next.js Full-Stack Development

## App Router Patterns

### File Conventions
- `page.tsx` — Route UI (only file that makes a route publicly accessible)
- `layout.tsx` — Shared UI wrapper (persists across navigation)
- `loading.tsx` — Suspense fallback
- `error.tsx` — Error boundary (must be client component)
- `not-found.tsx` — 404 UI
- `route.ts` — API endpoint (cannot coexist with page.tsx in same folder)

### Server vs Client Components
- **Default to Server Components** — they run on the server, have zero JS bundle cost
- Add `'use client'` only when you need: `useState`, `useEffect`, `onClick`, browser APIs
- Never import server-only code into client components
- Pass server data to client components as serializable props

### Data Fetching
- Fetch data in server components directly (no useEffect)
- Use `fetch()` with Next.js caching: `fetch(url, { next: { revalidate: 3600 } })`
- For mutations: Server Actions with `'use server'`
- For real-time: Client components with SWR or React Query

### Server Actions
```typescript
'use server'

export async function createItem(formData: FormData) {
  const name = formData.get('name') as string
  // validate, write to DB
  revalidatePath('/items')
  redirect('/items')
}
```

## API Routes (route.ts)

```typescript
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = await fetchData(searchParams.get('id'))
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  // validate body
  const result = await createRecord(body)
  return NextResponse.json(result, { status: 201 })
}
```

## Middleware

```typescript
// middleware.ts (root of project)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth check, redirects, headers, etc.
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

## Environment Variables
- `NEXT_PUBLIC_*` — exposed to browser (public)
- Everything else — server only
- Use `env.mjs` with Zod for validation

## Guidelines
- Use TypeScript strictly — no `any`
- Colocate components with their routes
- Use `@/` path alias mapped in tsconfig
- Keep client components as small and leaf-level as possible
- Use `loading.tsx` for every dynamic route
- Always handle errors with `error.tsx`

## Anti-Patterns
- Don't use `getServerSideProps` or `getStaticProps` (Pages Router — we use App Router)
- Don't fetch data in client components when server components can do it
- Don't put `'use client'` at the top of every file
- Don't use `useEffect` for data fetching — use server components or SWR

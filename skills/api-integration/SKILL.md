---
name: api-integration
description: Design and consume REST/GraphQL APIs with proper auth, error handling, rate limiting, and validation. Use when building API routes or integrating external services.
---

# API Integration

## REST API Design
- Use nouns for resources: `/users`, `/orders`
- HTTP methods: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error
- Always validate input with Zod or similar
- Always return consistent JSON shape: `{ data, error, meta }`

## Auth Patterns
- API keys for server-to-server (in headers, never URLs)
- OAuth 2.0 for user-delegated access
- JWT for stateless session tokens
- Always use HTTPS

## Error Handling
```typescript
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return await res.json()
} catch (err) {
  if (err instanceof ApiError) { /* handle known errors */ }
  throw err // re-throw unknown errors
}
```

## Rate Limiting
- Implement exponential backoff with jitter
- Respect `Retry-After` headers
- Cache responses where possible
- Use API keys per-environment (dev/staging/prod)

## Anti-Patterns
- Don't hardcode API keys — use environment variables
- Don't ignore error responses
- Don't make API calls without timeouts
- Don't trust client-side data — validate on server

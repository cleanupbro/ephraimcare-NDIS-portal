---
name: security
description: Web application security covering OWASP top 10, input validation, authentication, secrets management, CSP headers, and dependency auditing. Use when hardening or reviewing security.
---

# Security

## OWASP Top 10 Checklist
1. **Injection** — validate/sanitize all input, use parameterized queries
2. **Broken Auth** — use proven libraries (NextAuth, Supabase Auth), enforce MFA
3. **Sensitive Data Exposure** — encrypt at rest and in transit, minimize data stored
4. **XXE** — disable XML external entity processing
5. **Broken Access Control** — enforce server-side, deny by default, use RLS
6. **Misconfig** — remove defaults, disable debug in prod, review headers
7. **XSS** — escape output, use CSP headers, avoid dangerouslySetInnerHTML
8. **Insecure Deserialization** — validate shape with Zod before processing
9. **Vulnerable Dependencies** — `npm audit`, automated Dependabot
10. **Insufficient Logging** — log auth failures, access violations, input validation failures

## Secrets Management
- NEVER commit secrets to Git
- Use `.env` locally, Vercel/platform env vars in production
- Rotate secrets on any suspected exposure
- Use different secrets per environment

## Headers
```typescript
// next.config.js security headers
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
]
```

## Anti-Patterns
- Don't roll your own auth or crypto
- Don't log sensitive data (passwords, tokens, PII)
- Don't trust client-side validation alone
- Don't ignore npm audit warnings

---
name: vercel-deployment
description: Deploy to Vercel including project configuration, environment variables, preview deployments, edge functions, domain setup, and production optimization.
---

# Vercel Deployment Expert

## When to Use
Use when deploying, configuring, or troubleshooting Vercel projects.

## Project Setup
- Link project: `vercel link`
- Deploy preview: `vercel` (creates preview URL)
- Deploy production: `vercel --prod`
- Project config stored in `.vercel/project.json` (projectId + orgId)

## Environment Variables
- Set via Dashboard or CLI: `vercel env add VARIABLE_NAME`
- Scopes: Production, Preview, Development
- Access in code: `process.env.VARIABLE_NAME`
- Never commit `.env` — use `.env.example` for documentation
- Sensitive vars: set in Dashboard only, never in vercel.json

## vercel.json Configuration
- `framework`: auto-detected, override if needed
- `buildCommand`: custom build command
- `outputDirectory`: build output path
- `rewrites`: URL rewriting rules (SPA fallback: `[{ "source": "/(.*)", "destination": "/" }]`)
- `headers`: custom response headers (CORS, CSP, caching)
- `redirects`: URL redirects with status codes (301 permanent, 307 temporary)

## Preview Deployments
- Every push creates a unique preview URL
- Every PR gets automatic comment with preview link
- Preview deployments use Preview-scoped env vars
- Use for staging, QA testing, client review

## Edge & Serverless Functions
- API routes auto-deploy as serverless functions
- Middleware runs at the edge (closest to user)
- Edge runtime limitations: no native Node.js APIs, limited packages
- Serverless function limits: 10s (Hobby), 60s (Pro), 900s (Enterprise)
- Use streaming for long-running operations

## Domains
- Add via Dashboard: Settings → Domains
- DNS: CNAME to `cname.vercel-dns.com` or A record to Vercel IPs
- SSL automatic and free — no configuration needed
- Redirect www to apex or vice versa in domain settings

## Troubleshooting
- Build fails: run `vercel build` locally first to reproduce
- 404s: check `rewrites` in vercel.json and output directory setting
- Env vars missing: verify scope matches deployment type (Production vs Preview)
- Function timeout: optimize code, use streaming, or upgrade plan
- Cold starts: use edge runtime where possible

## Guidelines
- Test builds locally before pushing: `vercel build`
- Use preview deployments for all PRs — never push direct to production
- Set up Vercel Analytics and Speed Insights for monitoring
- Configure Web Analytics for traffic data
- Never expose server secrets in client-side bundles
- Use `vercel env pull` to sync env vars locally

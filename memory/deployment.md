# Deployment

## GitHub
- **Repository:** https://github.com/cleanupbro/ephraimcare-NDIS-portal
- **Default branch:** main
- **Branch strategy:** main = production (auto-deploys on push)

## Vercel — Admin Portal
- **Project name:** ephraimcare-ndis-portal-admin
- **Framework:** Next.js
- **Root directory:** apps/admin/
- **Build command:** (default Next.js build)
- **Install command:** pnpm install
- **Node version:** 18.x
- **Auto-deploy:** Yes (on push to main)

## Vercel — Participant Portal
- **Project name:** ephraimcare-participant-portal
- **Framework:** Next.js
- **Root directory:** apps/participant/
- **Build command:** (default Next.js build)
- **Install command:** pnpm install
- **Node version:** 18.x
- **Auto-deploy:** Yes (on push to main)

## Worker Mobile App
- **Platform:** Expo (EAS Build for production)
- **Testing:** Expo Go app (scan QR code)
- **Not yet published** to App Store / Google Play

## Live URLs
| Environment | URL | Branch |
|-------------|-----|--------|
| Admin (Production) | https://ephraimcare-ndis-portal-admin.vercel.app | main |
| Participant (Production) | https://ephraimcare-participant-portal.vercel.app | main |
| Worker Mobile | Expo Go (local dev server) | main |

## Supabase
- **Project ref:** vkjxqvfzhiglpqvlehsk
- **Region:** Sydney, Australia
- **URL:** https://vkjxqvfzhiglpqvlehsk.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/vkjxqvfzhiglpqvlehsk

## Verify Commands
```bash
git remote get-url origin
# Expected: https://github.com/cleanupbro/ephraimcare-NDIS-portal

pnpm turbo build --filter=@ephraimcare/admin
# Builds admin portal

pnpm turbo build --filter=@ephraimcare/participant
# Builds participant portal
```

## Last Verified
- Admin Portal: LIVE, 11/11 pages PASS (Feb 15, 2026)
- Participant Portal: LIVE, 4/4 pages PASS (Feb 15, 2026)
- All known bugs: FIXED

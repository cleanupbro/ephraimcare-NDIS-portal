# Deployment

## GitHub
- **Repository:** [URL]
- **Default branch:** main
- **Branch strategy:** main = production, dev = staging

## Vercel
- **Project ID:** [from .vercel/project.json]
- **Org ID:** [from .vercel/project.json]
- **Framework:** [e.g. Next.js]
- **Build command:** [e.g. npm run build]
- **Output directory:** [e.g. .next]

## Live URLs
| Environment | URL | Branch |
|-------------|-----|--------|
| Production | [URL] | main |
| Preview | [auto] | any PR |

## Verify Commands
```bash
git remote get-url origin
cat .vercel/project.json
vercel ls
```

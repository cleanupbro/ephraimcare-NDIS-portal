# skills/

Agent skills library. Each subfolder contains a `SKILL.md` that agents load dynamically when relevant.

## How Skills Work

1. Agent scans this catalog (reads skill `name` + `description` from each SKILL.md frontmatter)
2. When a task matches, agent loads the full SKILL.md instructions
3. Agent follows the skill's workflow to complete the task
4. Skills can include `scripts/`, `references/`, and `assets/` subfolders

## Skill Format (Anthropic Agent Skills Spec)

```
skill-name/
├── SKILL.md              # Required — YAML frontmatter + instructions
├── scripts/              # Optional — executable code
├── references/           # Optional — docs loaded into context as needed
└── assets/               # Optional — templates, icons, fonts
```

## Catalog

### Meta

| Skill | What It Does |
|-------|-------------|
| `_template/` | Blank skill template — copy this to create new skills |
| `skill-creator/` | Meta-skill that helps agents create new skills properly |

### Development

| Skill | What It Does |
|-------|-------------|
| `nextjs-fullstack/` | Next.js App Router patterns, server components, API routes, middleware |
| `react-patterns/` | React component design, hooks, state management, performance |
| `typescript-expert/` | TypeScript best practices, generics, type safety, error handling |
| `api-integration/` | REST/GraphQL API design, auth, rate limiting, error handling |
| `error-handling/` | Structured error handling, logging, monitoring, recovery |
| `performance/` | Performance optimization, caching, lazy loading, bundle analysis |
| `accessibility/` | WCAG compliance, ARIA, keyboard navigation, screen readers |

### Infrastructure & DevOps

| Skill | What It Does |
|-------|-------------|
| `vercel-deployment/` | Vercel config, edge functions, ISR, env vars, preview deployments |
| `supabase/` | Supabase Postgres, auth, storage, edge functions, RLS policies |
| `docker/` | Dockerfiles, compose, multi-stage builds, optimization |
| `git-workflow/` | Git branching strategy, conventional commits, PR workflow |

### Automation & AI

| Skill | What It Does |
|-------|-------------|
| `n8n-automation/` | n8n workflow design, webhooks, nodes, error handling, scheduling |
| `mcp-builder/` | Build MCP servers for Claude — tools, resources, transport |

### Business & Growth

| Skill | What It Does |
|-------|-------------|
| `seo-growth/` | SEO audit, meta tags, structured data, Core Web Vitals, content strategy |
| `ui-ux-design/` | UI/UX design systems, wireframes, responsive design, Tailwind |

### Quality & Security

| Skill | What It Does |
|-------|-------------|
| `testing/` | TDD, unit/integration/e2e testing, mocking, test architecture |
| `security/` | OWASP top 10, input validation, auth, secrets management, CSP |
| `documentation/` | Technical docs, API docs, READMEs, ADRs, inline comments |

## Adding Skills

### From repos (recommended):

```bash
# Official Anthropic skills (Claude Code)
/plugin marketplace add anthropics/skills

# 700+ community skills (Antigravity / Claude Code / Cursor)
npx antigravity-awesome-skills

# Or clone directly
git clone https://github.com/sickn33/antigravity-awesome-skills.git .agent/skills
```

### Create your own:

1. Copy `_template/` folder, rename to your skill name
2. Edit `SKILL.md` — fill in frontmatter and instructions
3. Or ask the agent: "Use the skill-creator skill to make a new skill for [X]"

## Key Repos

| Repo | What | Stars |
|------|------|-------|
| [anthropics/skills](https://github.com/anthropics/skills) | Official Anthropic skills — ground truth format | 62k+ |
| [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) | 700+ universal skills for all agents | 7.9k+ |
| [abubakarsiddik31/claude-skills-collection](https://github.com/abubakarsiddik31/claude-skills-collection) | Curated practical skills | Community |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Indexed discovery surface | Community |
| [VoltAgent/awesome-claude-skills](https://github.com/VoltAgent/awesome-claude-skills) | Curated collection + official team skills | Community |

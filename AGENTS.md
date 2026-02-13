# Agent Rules

## Navigation

Every folder and subfolder has a `README.md`. Read it before working in that folder. Never scan files.

## Memory

Persistent memory lives in `memory/`. It survives session exits and restarts.

### On Session Start (mandatory)

1. Read all files in `memory/`
2. Read `progress.md`
3. Check `skills/README.md` for available skills
4. Check `apis/README.md` for available API configs
5. You now have full context. Begin work.

### On Session End (mandatory)

1. Update `progress.md`
2. Append decisions to `memory/decisions.md`
3. Append lessons to `memory/lessons.md`
4. Update `memory/stack.md` or `memory/deployment.md` if changed

### Memory Rules

- Never delete entries — append only
- Mark outdated entries with `[OUTDATED]`
- Every entry must have a date

## Skills

Skills live in the `skills/` folder. They teach agents how to do specific tasks.

- `skills/claude/` — Claude Code skills (SKILL.md format)
- `skills/antigravity/` — Antigravity skills (SKILL.md format)
- `skills/shared/` — Skills that work across both tools

Skills follow Anthropic's official format:
```
skill-name/
├── SKILL.md        (required — YAML frontmatter + instructions)
├── scripts/        (optional — executable code)
├── references/     (optional — docs loaded into context)
└── assets/         (optional — templates, icons, fonts)
```

To install community skills:
```bash
# Anthropic official skills (Claude Code plugin)
/plugin marketplace add anthropics/skills

# 700+ universal skills (Claude Code, Antigravity, Cursor)
npx antigravity-awesome-skills
```

## APIs

External API configs and credentials (names only, never values) live in `apis/`.
The actual `.env` file with values lives at root and is gitignored.
`apis/README.md` maps which APIs this project uses and where their docs live.

## File Maintenance

After creating or deleting any file or folder, update that folder's `README.md`.

## Skills

This workspace includes a `skills/` folder with modular skills following the Anthropic Agent Skills spec.

### How to Use Skills

1. On session start, scan `skills/README.md` to see available skills
2. When a task matches a skill's description, load that skill's `SKILL.md`
3. Follow the skill's workflow and guidelines
4. If a skill has `references/` or `scripts/`, use them as needed

### How to Create Skills

1. Copy `skills/_template/` to `skills/your-skill-name/`
2. Edit `SKILL.md` — fill in frontmatter (`name`, `description`) and instructions
3. Or use the skill-creator skill: ask "create a new skill for [X]"
4. Update `skills/README.md` catalog table

### Installing Community Skills

```bash
# Official Anthropic skills
/plugin marketplace add anthropics/skills

# 700+ community skills
npx antigravity-awesome-skills
```

## API Keys

API key documentation lives in `api-keys/registry.md`.
**Never store actual key values in any file.** Only names, purposes, and where to get them.
Actual values go in `.env` files and platform dashboards.

## Absolute Rules

- Never modify: `.git/`, `.env*`, `.vercel/`, `node_modules/`, lock files
- Never hardcode secrets — use `.env`
- Never push or deploy without explicit approval
- If uncertain, ask — don't guess

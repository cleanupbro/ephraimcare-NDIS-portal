---
name: skill-creator
description: Create new agent skills following the Anthropic Agent Skills specification. Use when asked to create, design, or scaffold a new skill for any agent (Claude Code, Antigravity, Cursor, etc).
---

# Skill Creator

## Overview

Creates properly structured skills following the Anthropic Agent Skills spec. Each skill is a self-contained folder with a SKILL.md and optional scripts/references/assets.

## Skill Structure

```
skill-name/
├── SKILL.md              # Required — YAML frontmatter + markdown instructions
├── scripts/              # Optional — executable Python/Bash/JS code
├── references/           # Optional — docs loaded into context as needed
└── assets/               # Optional — templates, icons, fonts for output
```

## Workflow

1. **Clarify the skill's purpose** — What specific task does it teach the agent to do?
2. **Define trigger conditions** — When should the agent load this skill? Write a clear description (max 200 chars)
3. **Create the folder** inside `skills/`
4. **Write SKILL.md** with:
   - YAML frontmatter: `name` (lowercase-hyphenated) and `description` (clear trigger)
   - Markdown body: Overview, Workflow steps, Guidelines, Examples, Anti-patterns
5. **Add references/** if the skill needs domain knowledge (schemas, API docs, policies)
6. **Add scripts/** if the skill needs executable code
7. **Add assets/** if the skill produces output using templates
8. **Update `skills/README.md`** catalog table with the new skill
9. **Test** by asking the agent to use the new skill on a real task

## SKILL.md Frontmatter Rules

```yaml
---
name: kebab-case-name        # Required. Lowercase, hyphens for spaces
description: >-              # Required. Max 200 chars. Be specific.
  What this skill does and exact conditions when the agent should use it.
  Include trigger words the user might say.
---
```

## Writing Good Instructions

- Write for another AI agent, not a human
- Include procedural knowledge that isn't obvious
- Use numbered steps for workflows
- Include concrete examples with input → output
- List anti-patterns (what NOT to do)
- Keep SKILL.md lean — move detailed reference material to `references/` files
- If references are large (>10k words), include grep patterns in SKILL.md

## Guidelines

- One skill per specific capability — don't create mega-skills
- Skill name must match folder name
- Description is critical — it's the only thing scanned for relevance
- Test the skill on at least 2 real scenarios before considering it done

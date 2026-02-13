# memory/

Persistent project memory. Agents read this entire folder on every session start.

| File | Purpose | When to Update |
|------|---------|----------------|
| `context.md` | What this project is, who it's for, why | Project start or scope change |
| `stack.md` | Tech stack, versions, APIs, services | When dependencies change |
| `decisions.md` | Log of every major decision with reasoning | Every meaningful choice |
| `lessons.md` | What went wrong, what worked, what to avoid | After bugs, fixes, breakthroughs |
| `deployment.md` | GitHub repo, Vercel IDs, live URLs | When deployment config changes |

Rules: Never delete entries — append only. Mark outdated with `[OUTDATED]`. Date every entry.

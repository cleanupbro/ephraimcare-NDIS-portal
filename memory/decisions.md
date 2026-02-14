# Decisions Log

Format:
```
### [YYYY-MM-DD] — [Short Title]
**Decision:** What was decided
**Why:** Why this over alternatives
**Alternatives:** What else was considered
```


### 2026-02-13 — Participant Portal Recovery
**Decision:** Created a new Vercel project `ephraimcare-participant-portal` pointing to `apps/participant`.
**Why:** The original deployment was missing or deleted (`DEPLOYMENT_NOT_FOUND`).
**Alternatives:** Attempting to fix the old deployment (not possible without access to original project settings).

### 2026-02-15 — Comprehensive Handover Document Rewrite
**Decision:** Rewrote HANDOVER.md from 13 lines to 800+ line client-friendly guide covering every feature, page walkthrough, common tasks, NDIS billing rules, security matrix, and troubleshooting.
**Why:** Original was too sparse for a client who doesn't know the system. Needed to be readable by a non-technical NDIS provider.
**Alternatives:** Shorter executive summary (rejected — client needed comprehensive reference).

### 2026-02-15 — Full Workspace Documentation Pass
**Decision:** Created README.md for every app and package folder, filled all memory files with real data, updated CLAUDE.md and GEMINI.md to reflect handover-ready state.
**Why:** Workspace had referenced 12+ READMEs in CLAUDE.md but none actually existed. Memory files were templates with placeholder text.
**Alternatives:** N/A — documentation was incomplete and needed to be filled.

### 2026-02-14 — Participant Portal Environment Fix
**Decision:** Configured Supabase URL and Anon Key on Vercel for the Participant Portal project.
**Why:** Portal was returning errors because environment variables were missing from Vercel.
**Alternatives:** N/A (required for portal to function).

### 2026-02-13 — Participant Portal Recovery
**Decision:** Created a new Vercel project `ephraimcare-participant-portal` pointing to `apps/participant`.
**Why:** The original deployment was missing or deleted (`DEPLOYMENT_NOT_FOUND`).
**Alternatives:** Attempting to fix the old deployment (not possible without access to original project settings).

### 2026-02-12 — Workspace Restructuring
**Decision:** Restructured the project into a standard workspace layout.
**Why:** To standardize memory, skills, and documentation across projects and ensure consistent agent behavior.
**Alternatives:** N/A (Standard operating procedure).

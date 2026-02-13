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

### 2026-02-12 — Workspace Restructuring
**Decision:** Restructured the project into a standard workspace layout.
**Why:** To standardize memory, skills, and documentation across projects and ensure consistent agent behavior.
**Alternatives:** N/A (Standard operating procedure).

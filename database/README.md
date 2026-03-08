# Database

Database work has not started yet.

Recommended sequence:

1. Use repo-managed structured content as the canonical inventory source
2. Validate and normalize that content into a generated JSON artifact
3. Let the frontend read the generated artifact directly, or let the backend serve it
4. Add a database only when operational needs exceed a Git-based workflow

When that happens, this folder should hold:

- schema definitions
- migration files
- seed or sync scripts

Current recommendation for this project:

- Do not keep the long-term source of truth in `front-end/lib/skills-data.ts`
- Do not use Google Sheets as part of the active architecture plan for this project
- Keep inventory changes reviewable in Git until there is a clear need for drafts, permissions, high-frequency editing, or operational sync jobs

Use a database when one or more of these become true:

- non-developers need to update inventory frequently
- content needs drafts, approvals, roles, or audit history
- the site needs dynamic filtering, analytics, personalization, or large-scale search
- multiple systems must write to the same inventory

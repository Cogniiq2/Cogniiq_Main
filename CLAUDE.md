## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Automated development workflow

These rules are mandatory for every coding task in this repository.

### Session and branch management

1. At the start of a session or coding task, run `git fetch origin` and `git status`, and identify the current branch.
2. Never edit application code directly on `main`.
3. Every new independent task starts from the latest `origin/main` — never from another feature branch.
4. If on `main` with a clean working tree, run `git pull --ff-only origin main` and then automatically create a descriptive feature branch named `claude/<task-slug>`.
5. If the current branch is not `main`, is already merged into `origin/main`, and the working tree is clean, switch to `main`, fast-forward it from `origin/main`, and create the new task branch from there.
6. If the current non-`main` branch has unmerged commits or the working tree has uncommitted changes, do not assume it belongs to the new task. Stop and ask whether this continues that task or starts a new one.
7. If uncommitted changes exist, stop and explain them instead of switching branches.
8. Follow-up prompts stay on the existing feature branch only when they clearly belong to the same active task.
9. A clearly unrelated task requires a new branch created per rules 3–5.
10. Never automatically rebase an active feature branch. Report whether it is behind `origin/main` and ask before rebasing.
11. Never use placeholder branch names such as `claude/name-of-the-task`. Derive a concise, descriptive name from the actual task.

### Codebase navigation

12. Query Graphify before any broad source exploration (see the graphify section above).
13. Use the graph only to locate relevant code; always inspect the actual source files before editing.
14. Protect unrelated public, customer, owner and admin surfaces — do not change them incidentally.

### Automatic verification

15. After implementing, review the complete diff and run:
    - `npm run typecheck`
    - `npm test`
    - `npm run build`
    - `npm run lint`
16. Distinguish newly introduced failures from pre-existing failures and report both explicitly.
17. Update the knowledge graph incrementally with `graphify update .`.
18. Never claim completion while any required check is failing.

### Automatic preview delivery

19. When the implementation and required checks succeed, commit only task-related files with a precise conventional commit message.
20. Push the current feature branch to `origin` automatically so Cloudflare can create a preview deployment.
21. Never push directly to `main`.
22. Report the branch name, the commit, the test results, and that the Cloudflare preview should now be building.

### Hard safety boundaries

23. Never merge into `main` automatically.
24. Never deploy directly to production.
25. Never execute hosted database migrations, destructive SQL, credential changes or other irreversible operations without explicit approval.
26. Never include `.env` files, credentials, generated Graphify output or unrelated files in a commit.
27. Never use `git add .` — stage only explicitly reviewed task files.

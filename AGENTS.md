# Repository instructions

These instructions apply to Cursor, Codex, and human contributors.

## Project context

- This is a client-only React 19 + TypeScript + Vite 8 storefront.
- Product data lives in `src/data/products.ts`; storefront copy lives in
  `src/data/storefront.ts`.
- Cart and favorites are stored in `localStorage`. There is no backend, database,
  automatic order submission, inventory reservation, or payment processing.
- Navigation uses hash routes such as `#catalog`, `#product/<id>`, `#cart`, and
  `#favorites`.
- Treat `README.md`, `package.json`, and the existing implementation as the source
  of truth. Do not invent services or product requirements.

## Safety and collaboration

- Before editing, run `git status --short --branch` and inspect the relevant files.
- Existing changes, branches, worktrees, and stashes belong to their owner. Never
  discard, overwrite, clean, reset, amend, rebase, force-push, or apply/drop a
  stash unless the user explicitly requests that exact action.
- Use one task per branch and worktree, created from the intended current base.
  Use `cursor/<short-task>` for Cursor work and `codex/<short-task>` for Codex
  work. A neutral `chore/<short-task>` branch is fine for shared tooling.
- Never have Cursor and Codex implement in the same worktree or branch at the
  same time. One agent owns implementation; the other reviews the diff or PR.
- Keep changes scoped to the requested task. Do not upgrade dependencies, rewrite
  unrelated code, or change generated files as incidental cleanup.
- Do not commit, push, merge, deploy, or change GitHub settings unless the user
  asked for that action. Never commit secrets, `.env` files, or credentials.

## Implementation conventions

- Keep TypeScript strict and follow the existing functional React patterns.
- Preserve the current data-driven catalog structure and hash routing unless a
  task explicitly changes the architecture.
- Preserve Russian customer-facing copy and existing behavior unless the request
  says otherwise.
- Put product images under `public/products/`. Do not edit generated output under
  `dist/` or `public/hero/optimized/`.
- Prefer focused components and small, reviewable diffs. Add dependencies only
  when the task cannot reasonably be completed with the existing stack.

## Verification

- Install exact locked dependencies with `npm ci` in a fresh worktree.
- Run `npm run lint` and `npm run build` for every code change.
- For UI changes, manually check the affected flow at 390 px and 1440 px at a
  minimum. Use the fuller responsive matrix in `README.md` for layout-wide work.
- Exercise the affected states, including empty, populated, loading-like, and
  no-results states where relevant. For cart work, add an item and change quantity.
- Report commands actually run and their observed results. Never claim a check
  passed if it was not run.

## Pull requests and review

- Use `.github/pull_request_template.md` and keep one concern per PR.
- Include screenshots for visible UI changes and call out data, storage, routing,
  or accessibility risks.
- Do not merge until CI passes, the diff is reviewed, and the user approves the
  result.
- Review for functional regressions, data correctness, responsive behavior,
  accessibility, and security before commenting on formatting or taste.
- Reviewers should identify findings with file and line references. If there are
  no findings, state which checks and risks were examined.

See `docs/AI_WORKFLOW.md` for the step-by-step Cursor + Codex + GitHub workflow.

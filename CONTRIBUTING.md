# Contributing to `@coroama/svelte-box`

The practical workflow. For coding conventions and style, read [AGENTS.md](AGENTS.md). For the rules on how to talk to other people on PRs, read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). The short version: be hard on the code, do not attack the person.

## Before opening a PR

1. **Open an issue first for non-trivial changes.** A new public method, a breaking change, or a refactor that touches the public surface should start as an issue so the design conversation does not stall on a long branch. Drive-by patches to a working API are usually rejected. The discussion belongs in the issue, not in the diff.
2. **Run the full local checks**:
    ```sh
    bun install
    bun run lint
    bun run check
    bun run test
    ```
    All four must pass. CI runs the same set on Linux, macOS, and Windows. If your local pass and CI's pass disagree, file an issue.
3. **Add a test.** Behavior changes without tests get sent back. The test suite is browser-mode Vitest, file pattern `tests/**/*.svelte.test.ts`. The reactivity-test pattern (`$effect.root` via the `withRoot` helper, `flushSync()` between mutations and assertions) is documented in [AGENTS.md](AGENTS.md#testing-rules).
4. **Update the CHANGELOG.** Anything that changes the public surface gets a line under `[Unreleased]`. Public surface is defined in the file's preamble (exports from `@coroama/svelte-box`, the runtime behavior of those exports, and their types).
5. **Update the docs.** README, AGENTS.md, JSDoc on the `.d.ts` siblings, and the relevant entry in `CHANGELOG.md` must agree. If you add a public method or type, all four need a line. If they disagree, the next reviewer will close the PR and ask you to fix it.

## Pull request flow

1. Fork the repository and create a branch from `master`. Short, descriptive branch names: `fix/proxy-isown-cache`, `feat/boxed-weakmap`, `docs/changelog-021`. No `wip` branches in the PR body.
2. Make your changes. Keep the commit history clean. Squash WIP commits before opening the PR.
3. Open the pull request against `master`. Fill in the PR template. Empty descriptions get sent back.
4. CI runs lint, check, test, and build on the three-OS matrix. `ci-all-greens` is the required check. Docs-only PRs short-circuit lint/test/build via the `Detect source changes` job; the aggregator still reports success.
5. The maintainer reviews. Expect direct comments. If the review says "this is wrong, fix it," that is a review, not an attack. Address it in additional commits on the same branch. Do not force-push once review has started, because it nukes the review thread.
6. Once approved, the maintainer merges. Do not merge your own PR.

If the maintainer is silent for two weeks, ping the PR. After four weeks with no response, assume the project is dormant and consider forking.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Format:

```
<type>(<optional scope>): <short summary>

<optional body>

<optional footer>
```

Types in use:

| Type       | When to use                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| `feat`     | New public-surface feature or API addition.                                                                 |
| `fix`      | Bug fix.                                                                                                    |
| `refactor` | Internal restructure with no public-surface or behavior change.                                             |
| `perf`     | Performance change with a measurable bench delta.                                                           |
| `docs`     | README, AGENTS, JSDoc, CHANGELOG, or other doc-only changes.                                                |
| `test`     | Test-only changes. Adding a missing test for existing behavior.                                             |
| `chore`    | Tooling, dependency bumps, repository housekeeping.                                                         |
| `build`    | Build system, packaging, `package.json` fields, lockfile changes.                                           |
| `ci`       | GitHub Actions workflows and CI configuration.                                                              |
| `security` | Security-relevant change. Use when the fix or feature is motivated by a vulnerability or hardening concern. |
| `revert`   | Revert a prior commit. Reference the SHA in the body.                                                       |

Rules:

- **Subject line**: imperative mood, present tense, no trailing period, target around 50 characters and hard-cap at 72.
- **Breaking changes**: append `!` after the type or scope (`feat!: drop BaseBox export`) and include a `BREAKING CHANGE:` footer describing the migration. Breaking changes against the published `0.x` API still require this footer so the changelog generator can pick them up.
- **Scope**: optional. Use it when the change is localized to a subsystem: `feat(proxy): forward Symbol.iterator`, `fix(collections): bind inner Map.get correctly`, `perf(base): move guards to prototype`.
- **Body**: only when the _why_ is not obvious from the subject. One paragraph at most. No multi-paragraph essays describing every line.

Good examples (taken from this repo's history):

- `refactor(proxy): cache isOwn negatives, prune FORWARD_FIRST`
- `fix(ci): require every negation in paths-filter source rule`
- `ci(pages): skip deploy when no playground inputs changed`
- `ci(publish): gate on environment, switch to OIDC, bump Node to 24`
- `docs(types): flag FastBox name collisions and primitive non-forwarding`
- `test(box): cover apply-trap this and primitive non-forwarding`
- `style: switch indentation from tabs to 4-space`

Bad examples that will get pushed back:

- `wip`
- `fix bug`
- `Updated stuff`
- `feat: stuff` (no useful subject after the type)
- A multi-paragraph commit message describing every line of a 20-line diff

Signed commits are encouraged but not required. GitHub shows a green Verified badge when you sign.

## Releases

Releases are cut by the maintainer. The publish workflow at [.github/workflows/publish.yml](.github/workflows/publish.yml) runs on a GitHub Release event, re-runs the full test suite, verifies the release tag matches `package.json`, and publishes to npm via Trusted Publisher OIDC with provenance. The publish job is gated behind a GitHub Environment with required approval.

Pre-release versions (any version string containing a hyphen, for example `0.2.0-rc.0`) ship under the `next` dist-tag instead of `latest`, so they do not become the default for `npm install @coroama/svelte-box`. Final releases (no hyphen) ship under `latest`. The detection happens inside the publish workflow by reading `package.json`; nothing else needs to be toggled per release.

## Reporting bugs

Use the `Bug report` template at [.github/ISSUE_TEMPLATE/bug_report.md](.github/ISSUE_TEMPLATE/bug_report.md). A reproduction on a single-file StackBlitz or a tiny GitHub repo is the fastest path to a fix. Issues without reproductions are not necessarily ignored, but they are deprioritized.

For security reports, use the private channel in [SECURITY.md](SECURITY.md). Do not open a public issue for vulnerability reports.

## What gets rejected

Common rejection reasons:

- PRs that ship without a test.
- PRs that bundle "while I was in there" changes unrelated to the stated goal.
- Style-only refactors (renaming files, reformatting, swapping idioms) without a concrete reason.
- Adding dependencies. The runtime has zero dependencies beyond the `svelte` peer. Any first runtime dep requires a real argument and a public surface impact analysis.
- PRs that re-introduce features intentionally cut. Forwarding for primitives, deep observability hooks, and a stores-style subscribe API have all been considered and declined. Open an issue if you think the trade-off should be re-litigated.

## What lands fast

- Bug fixes with a regression test.
- Documentation fixes for typos, broken examples, stale references.
- Performance improvements with a bench number attached. The `bench.yml` workflow runs after merge to `master` and posts a summary comment on the merged PR, so the regression signal lives on the PR thread automatically.
- New behavior that an existing issue has agreed on.

# Security Policy

## Supported Versions

Security fixes target the latest published minor on the `latest` dist-tag. Older majors are not patched once a new major ships. Pre-releases on the `next` dist-tag (any version string with a hyphen, for example `0.2.0-rc.0`) are not security-supported once the corresponding final release is published.

## Reporting a Vulnerability

Please do not file a public GitHub issue for security reports.

The preferred channel is [GitHub Private Vulnerability Reporting](https://github.com/IsaiahCoroama/svelte-box/security/advisories/new). Alternative: email `coroamaisaiah@gmail.com`.

Include:

- A description of the vulnerability and the impact you believe it has.
- A minimal reproduction (a code snippet, a small repo, or a failing test).
- Any suggested mitigation if you have one.

Expect an initial response within seven days, best-effort. There is no bug bounty.

Once a fix lands, the release notes will credit the reporter unless you ask to stay anonymous. CVEs are not minted automatically; if a finding warrants one, the maintainer will request one through GitHub Security Advisories.

## Threat Model

`@coroama/svelte-box` is a client-side ESM utility that wraps Svelte 5's `$state` rune in a reactive container so a value can be passed across function, class, and component boundaries without losing reactivity. The library has:

- **No network surface.** No `fetch`, no WebSocket, no XHR. Nothing the library does causes a network request beyond what the host bundler already emits.
- **No user-input handling.** The library never reads from the DOM, never parses untrusted strings, never deserializes a payload.
- **No cryptographic operations.** No keys, no hashes, no signing.
- **No file-system or process access.** Pure in-memory state.
- **No shared state across users.** Everything lives inside the caller's tab or process. Module-scope caches (`bindCache`, `PROXY_TARGET`) are per-realm; multi-realm SSR (worker pools, isolate-per-tenant) gets fresh caches per realm.
- **No I/O of any kind.**

The supply chain is the meaningful surface:

- **Zero runtime dependencies.** The only peer dependency is `svelte ^5.0.0`.
- **Single-maintainer publish chain.** Compromise of the maintainer's GitHub account is the dominant residual risk. Mitigations: required-reviewer environment gate on the `npm-publish` environment, OIDC publish (no long-lived `NPM_TOKEN` stored in the repo), provenance attestations on every release via Sigstore.
- **Releases are published via GitHub OIDC through npm Trusted Publisher.** The npm registry trusts `IsaiahCoroama/svelte-box`'s `publish.yml` workflow when it runs against the `npm-publish` environment. Any push to npm without going through that exact path is rejected by npm.
- **The library does not defend against a compromised bundler.** A Vite or Rollup compromise that rewrites the import chain will substitute arbitrary code regardless of what this library does. That is the bundler's trust boundary, not the library's.
- **Third-party GitHub Actions are pinned by SHA where practical** to reduce mutable-tag supply-chain risk.

The Proxy used by `Box` is built on standard ECMAScript Proxy semantics with defensive traps:

- `preventExtensions` and `setPrototypeOf` throw `TypeError` because `PROXY_TARGET` is shared at module scope across every `Box` instance. Allowing those would mutate the shared target and corrupt every other live Box.
- `defineProperty` routes to `self` or to the inner value, never to the shared target.
- `getPrototypeOf` returns `Object.getPrototypeOf(self)` so `instanceof` works through the proxy.

These traps are part of the public-correctness contract; do not report them as confused-deputy issues without a concrete exploit. If you have an exploit that shows the shared target being mutated through any public API, that is a real bug and worth reporting.

## Out of Scope

- **Misuse of the public API.** Passing untrusted data through `box(...)` is fine because Box does not interpret the data, but executing that data is on the caller. `box(() => doMaliciousThing())` will run the closure when the boxed value is invoked; the inner function runs whatever the consumer put in it.
- **Performance issues without a measurable consumer-visible impact.** Microbenchmarks within `~5%` noise are not security issues.
- **Issues in `svelte` itself.** Report those at <https://github.com/sveltejs/svelte>. Issues in your bundler belong with the bundler.
- **`structuredClone(box)` throwing.** This is documented (see README "Caveats"); the proxy target is a function and `structuredClone` rejects functions. Use `box.snapshot()` or `box.value` instead.

## Dependency Audit Policy

The CI lint job runs `bun audit --audit-level=low` as a blocking step. `bun audit` has no `--ignore` flag, so the only supported response to a disclosed CVE in a transitive dev-dependency is to fix it. The escalation path:

1. Bump the offending dep directly (or wait for its parent to bump).
2. If the parent will not bump in time, add an `overrides` entry to `package.json` forcing the resolved version. The override applies only to this repo's lockfile; consumers do not inherit it (there are no runtime deps).
3. Do not silence the CI audit step. Adding `continue-on-error: true` or filtering the output is not an accepted mitigation.

Each `overrides` entry should have a corresponding line in `CHANGELOG.md` under the relevant release's `### Security` section, naming the advisory ID it addresses.

## Repository Configuration

Security-relevant repository settings:

- **Required status check on `master`**: `ci-all-greens` (aggregator job defined in [.github/workflows/ci.yml](.github/workflows/ci.yml)). PRs cannot merge unless this check passes. The aggregator reports success when the heavy jobs either passed or were intentionally skipped (docs-only PRs).
- **CODEOWNERS**: [.github/CODEOWNERS](.github/CODEOWNERS) auto-requests review from `@IsaiahCoroama` on every PR.
- **Branch protection on `master`**: required PR, required linear history, no force-push, no deletion, `ci-all-greens` required status check. The required-approving-review count is currently zero (solo-maintainer trade-off; documented under "Admin overrides" below). Squash and rebase merges allowed; merge commits are not.
- **Dependabot**: configured at [.github/dependabot.yml](.github/dependabot.yml) for weekly npm and `github-actions` updates, with grouped patterns to keep PR volume manageable.
- **Publish authorization**: npm publishing is gated through GitHub Trusted Publisher OIDC. The npm account that owns the package trusts the `IsaiahCoroama/svelte-box` repository's `npm-publish` environment, which requires manual reviewer approval before the publish job proceeds. No long-lived registry tokens exist.
- **Tag protection**: a repository ruleset (`v-tag protection`) blocks creation, deletion, and force-push for `refs/tags/v*`. Admin-level write access is required to publish a release tag. This prevents an attacker with only PR-write rights from forging a release tag; `publish.yml` additionally verifies the release commit is an ancestor of `master` as defense in depth.
- **CodeQL**: [.github/workflows/codeql.yml](.github/workflows/codeql.yml) runs the `security-extended` query suite on every PR that touches source paths and on a weekly cron against `master`.
- **OpenSSF Scorecard**: [.github/workflows/scorecard.yml](.github/workflows/scorecard.yml) runs weekly and on push to `master`, uploads SARIF to GitHub Security, and publishes results to the public Scorecard dashboard.
- **PR conflict detection**: [.github/workflows/detect-conflicts.yml](.github/workflows/detect-conflicts.yml) labels PRs that develop a merge conflict against `master` and posts a notice comment. Uses `pull_request_target` because the action needs the base-branch token to write the label; the workflow does not check out PR code so the standard `pull_request_target` privilege-escalation pattern does not apply. Permissions: `contents: read`, `pull-requests: write`.
- **PR labeling and label gate**: [.github/workflows/labeler.yml](.github/workflows/labeler.yml) auto-applies path-based labels via `actions/labeler` and runs a label-checker (`any_of`) that requires every PR to carry at least one of `breaking`, `security`, `feature`, `bug`, `refactor`, `docs`, `internal`, `deps`. Author/maintainer-applied: intent (`feature`, `bug`, `refactor`) and judgment (`breaking`, `security`). Auto-applied: path-derivable (`docs`, `internal`, `github_actions`, `typescript`, `javascript`, `svelte`, `bun`). `deps` is applied by Dependabot. Uses `pull_request_target`; same constraint applies (no PR-code checkout). Permissions: `contents: read`, `pull-requests: write` for labeler, `pull-requests: read` for the checker.
- **Issue auto-management**: [.github/workflows/issue-manager.yml](.github/workflows/issue-manager.yml) closes stale `answered`/`waiting`/`invalid` issues on a daily cron. The 10-day auto-close window for `answered` is aggressive for security-tagged issues; security reports should never be moved to `answered` without an explicit fix landing first. Permissions: `issues: write`, `pull-requests: write`.
- **Admin overrides**: the maintainer has admin rights and can bypass branch protection or tag protection. This is the documented escape hatch for hot-fix releases. Any such bypass must be reflected in the commit message and the relevant CHANGELOG entry.

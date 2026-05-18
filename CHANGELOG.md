# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [semantic versioning](https://semver.org/spec/v2.0.0.html). The public surface for semver purposes is everything documented in the README and exported from `'@coroama/svelte-box'`.

## [Unreleased]

## [1.0.0] - 2026-05-18

First stable release after `v0.2.2`. Bundles the Const\* / LazyBox additions, the mixin-stack refactor of `BaseBox`, the new reactive-cell roots (`MutCoreBox`, `RawCoreBox`, `RawMutCoreBox`), the `clone` helper, source-tree reorganisation, a property-based test suite, and a Sigstore-signed release pipeline. Breaking changes against `v0.2.2` are the trigger for the `1.0.0` rather than `0.3.0` bump: the `FastBoxed<T>` alias deprecated in `0.2.2` is removed. The library's public surface is now stable under semver.

### Removed

- **`FastBoxed<T>` type alias** removed (deprecated in 0.2.2). Migration: replace every `FastBoxed<T>` with `FastBox<T>`. The two were assignment-compatible, so the swap has no runtime or type effect. `fastbox(...)`, `FastBoxedMap<K, V>`, and `FastBoxedSet<T>` already resolve to `FastBox<T>` directly.

### Added

- **`ConstBox<T>` read-only proxy view** and the `constbox()` factory. Inherits transparent forwarding from the same proxy machinery as `Box`; every write trap throws. Construct from a plain value (capture into a fresh internal cell) or an existing `AnyBox<T>` (borrow, sharing state).
- **`ConstFastBox<T>` read-only plain view** and the `constfastbox()` factory. No proxy: reach inner-object properties through `.value`. Same capture/borrow construction modes. Cheaper than `ConstBox` when transparent forwarding is not needed.
- **`LazyBox<T>` deferred-loader cell** and the `lazybox()` factory. First `prefetch()` invokes the loader and caches the resulting promise in `.value`; later calls return the same promise until `reset()` clears it. Synchronous throws from the loader are converted to rejected promises; non-thenable returns are wrapped in `Promise.resolve`. Loader signature: `() => T | Promise<T>`.
- **`Box.toConst()` and `FastBox.toConst()`** methods. `Box.toConst()` returns a `ConstBox<T>` (proxy-backed); `FastBox.toConst()` returns a `ConstFastBox<T>` (plain). Both borrow from the source cell so the const view stays reactive to source updates; pass a `Box`/`FastBox` to any function whose parameter is typed `ConstBox`/`ConstFastBox` without losing reactivity.
- **Const collection variants**: `constBoxedMap`, `constFastBoxedMap`, `constBoxedSet`, `constFastBoxedSet` factories and `ConstBoxedMap`, `ConstFastBoxedMap`, `ConstBoxedSet`, `ConstFastBoxedSet` types. Reference is frozen (`m.value = newMap` throws); the inner `SvelteMap`/`SvelteSet` stays reactive on its own mutations.
- **`AnyBox<T>` union** and **`isBox()` runtime guard**. The sanctioned way to recognise any reactive container generically. `AnyBox<T> = CoreBox<T> | RawCoreBox<T>`; `isBox(v)` narrows `v` to `AnyBox<unknown>`. Parameter types should use `AnyBox<T>` when accepting any reactive cell.
- **Two reactive-cell roots** in `core.svelte.js`: `CoreBox`/`MutCoreBox` over `$state()` (deep) and `RawCoreBox`/`RawMutCoreBox` over `$state.raw()` (no deep proxy). The `Mut*` siblings add a public `value` setter via the symbol-keyed `[SET_VALUE]` seam. Internal scaffolding, not re-exported.
- **`BoxCloneable` mixin**: `clone()` returns `structuredClone($state.snapshot(box.value))`. Snapshots first to escape Svelte's reactive proxy (which trips `structuredClone` directly).
- **`BoxCommonMixin` composite**: bundles `BoxSerializableMixin` and `BoxCloneableMixin`. Applied at every leaf so the standard non-mutating utility surface is uniform across variants.
- **`BoxMixer(Base, ...factories)` variadic composer**. Accumulates contributed mixin surfaces into a single `BoxMixin<B, IntersectAll<...>>`. Reads top-down at the call site instead of nested-call inside-out. Used by `BaseBox` and `ConstFastBox`. Per-step `Base` constraint enforcement is weaker than hand-chained composition; documented in `mixins.svelte.d.ts`.
- **Property-based test suite** under `tests/properties/` using `fast-check` (devDep). Five files (`box`, `const`, `lazy`, `collections`, `util`) cover round-trip identity, snapshot parity, `isBox` axioms, `LazyBox` cache-once semantics, mixin composition, and util predicates. Same browser project, same `*.svelte.test.ts` discovery suffix. Also satisfies OpenSSF Scorecard's Fuzzing check via the `fast-check` import.

### Changed

- **Refactored `BaseBox` to a mixin composition.** The reactive cell now lives in `MutCoreBox<T>` (in `core.svelte.js`); helper methods and guards live in `BoxGuardsMixin`, `BoxAccessorMixin` (composite of `BoxGetterMixin`+`BoxSetterMixin`+`BoxDeleterMixin`), and `BoxCommonMixin` (composite of `BoxSerializableMixin`+`BoxCloneableMixin`). `BaseBox` assembles them via `BoxMixer(MutCoreBox, BoxAccessorMixin, BoxGuardsMixin, BoxCommonMixin)` at module scope. No regression in the existing public API: the same methods land on the same classes with the same signatures, plus `clone` newly available everywhere.
- **`BoxGuardsMixin` type constraint tightened** to `BoxConstructor<BoxCell<unknown>>`. Passing a base class without a `value` member is now a TypeScript error rather than a runtime failure on first guard call. The mixin no longer takes an unused `T` generic since guards narrow polymorphically through `this`.
- **Reorganised source tree** for tighter tree-shaking and clearer ownership. `core/proxy.svelte.{js,d.ts}` split into `core/proxy/{box,const,base}.{js,d.ts}` (Box, ConstBox, and the shared `buildBoxProxy` machinery). `core/fast.svelte.{js,d.ts}` split into `core/fast/box.{js,d.ts}` and `core/fast/const.svelte.{js,d.ts}` (FastBox and ConstFastBox). `collections/` moved into `core/collections/`. The mixin factories live in a dedicated `core/mixins.svelte.{js,d.ts}` (the `.svelte.js` extension is required because `BoxCloneableMixin.clone()` calls `$state.snapshot`). `utils.{js,d.ts}` renamed to `util.{js,d.ts}`. Public barrel exports unchanged; only internal import paths shifted.
- **Extracted `buildBoxProxy(self, opts)`** into `core/proxy/base.js`. Both `Box` (mutable) and `ConstBox` (read-only via `opts.readOnly: true`) now share one Proxy implementation. `FORWARD_FIRST` is passed in per-class through `opts.forwardFirst` (Box: `'get'`, `'set'`; ConstBox: `'get'` only).

### Security

- **Release artifacts signed via Sigstore.** The publish workflow now packs the tarball explicitly with `npm pack --ignore-scripts`, generates a Sigstore build-provenance attestation over those bytes via `actions/attest-build-provenance@v4`, and attaches the resulting `.sigstore` bundle plus the SBOM to the GitHub Release alongside the tarball. Satisfies OpenSSF Scorecard's Signed-Releases check; npm-side provenance from `--provenance` remains in place.

### Tooling and infrastructure

- **Versioned GitHub Pages playground.** `pages.yml` now publishes each `v*` tag to its own `/<repo>/<tag>/` subpath, master to `/<repo>/latest/`, and regenerates a versions index at the site root after every deploy. The master deploy also backfills missing tag subdirs by checking out each tag in a detached worktree, building with the tag's own lockfile, and staging the result. Tag deploys are refused when the tag commit is not an ancestor of `master`. Replaces the previous single-bundle deploy.
- **Pages bootstrap fixes** for the per-tag layout: `kit.paths.relative = false` so prerendered subpages emit absolute asset URLs (the previous relative URLs broke when a page lived more than one segment deep, e.g. `/<repo>/v1.0.0/box/`), and a `.nojekyll` is written at the gh-pages branch root so Jekyll does not strip `_app/` from any versioned subdir.
- **Playground extended.** Two new routes (`/const`, `/lazy`) demonstrate `ConstBox`/`ConstFastBox` capture-vs-borrow modes and `LazyBox` cache-once semantics. The shared layout gained a light/dark theme toggle persisted in `localStorage`, with a pre-paint script in `app.html` to avoid the first-paint flash. Existing `/box` and `/fastbox` pages picked up `clone()` and `toConst()` sections.
- **CodeQL workflow bumped to `github/codeql-action@v4`** (init and analyze steps) and the `pull_request` trigger had its `paths:` filter removed. OpenSSF Scorecard's SAST check inspects the most recent merged PRs for a CodeQL run, and a path filter that excluded most of them was reading as "no SAST". Push-side path filter and the weekly cron are retained.

### Internal

- `CoreBox`, `MutCoreBox`, `RawCoreBox`, `RawMutCoreBox`, the mixin factories (`BoxGuardsMixin`, `BoxAccessorMixin`, `BoxSerializableMixin`, `BoxCloneableMixin`, `BoxCommonMixin`, plus the constituent `BoxGetterMixin`/`BoxSetterMixin`/`BoxDeleterMixin`), the per-mixin type-only classes (`BoxGuards`, `BoxAccessor`, `BoxSerializable`, `BoxCloneable`, `BoxGetter`, `BoxSetter`, `BoxDeleter`), and `BoxMixer` are intentionally not re-exported from the public barrel. They are documented in `AGENTS.md` as the seam for adding new helper categories.

## [0.2.2] - 2026-05-13

Pipeline-hardening release plus a single deprecation. No runtime behavior change in `src/lib/`. Drop-in upgrade with zero runtime or breaking API differences. Promoted from `0.2.2-rc.1` after the RC publish ran clean: tag-ancestry check, `npm audit signatures`, CycloneDX SBOM via `cdxgen`, OIDC publish, and least-privilege token scopes.

### Deprecated

- **`FastBoxed<T>` type alias** is now `@deprecated`, scheduled for removal in the next major release. It was a cosmetic alias for `FastBox<T>` introduced for symmetry with the `Boxed<T>` / `Box<T>` pair, but `FastBox` performs no proxy forwarding so there is no extra shape to project. Migration: replace every `FastBoxed<T>` with `FastBox<T>`. The two are assignment-compatible, so the swap has no runtime or type effect. The `fastbox(...)` factory return type, `FastBoxedMap<K, V>`, and `FastBoxedSet<T>` now resolve to `FastBox<T>` directly; the public names of those collection aliases are unchanged.

### Tooling and infrastructure

- **Coverage promoted to a blocking CI step** on the Linux leg of `ci.yml`. Removed `continue-on-error: true`; the V8 thresholds in `vitest.config.ts` (90% lines/statements/functions, 80% branches) now gate merges. Coverage HTML is uploaded as a 30-day artifact via `actions/upload-artifact`.
- **Added six proxy-trap tests** to `tests/box.svelte.test.ts` covering the `has` trap (own helpers, inner keys, non-configurable target keys, primitive-inner fallthrough), the `getOwnPropertyDescriptor` `isOwn` branch, the `defineProperty` `isOwn` branch, the `construct` non-function `TypeError`, and the `isOwn` walk-then-cache path for prototype keys added after construction. Statement coverage 87.87 → 96.96, branch coverage 75 → 91.66, line coverage 91.45 → 100. No `src/lib/**` changes.
- **Split test config into `vitest.config.ts`** using `@sveltejs/vite-plugin-svelte` directly instead of `sveltekit()`. The SvelteKit plugin owns chokidar watchers that outlive Vitest's `--run` force-close window and produce a `"close timed out after 10000ms"` warning at the end of every coverage run. Lib unit tests do not import from `$lib` or exercise routing so the SvelteKit plugin is not needed in test context. `vite.config.ts` keeps `sveltekit()` for dev, build, and `svelte-package`. Local `bun run test:coverage` wall time dropped from ~13s to ~4s.
- **Added `concurrency:` groups** to `publish.yml` (singleton `npm-publish`, `cancel-in-progress: false` so an in-flight publish completes before the next starts), `codeql.yml`, `bench.yml`, `scorecard.yml`, and `issue-manager.yml`. Two simultaneous releases or rapid PR/issue events no longer race.
- **ESLint config aligned** with the sibling `svelte-lazy` repo: added an `@typescript-eslint/no-unused-vars` override that ignores underscore-prefixed names (argument, variable, caught-error, destructured-array patterns), and `projectService: true` on the Svelte parser block.
- **Vitest coverage `html` reporter added** alongside `text`, `lcov`, `json-summary` so the uploaded artifact opens as a navigable site.
- **`.gitignore` extended** with `/coverage` and the Playwright `test-results` directory so they do not get accidentally tracked.

### Security

- **Rewrote `SECURITY.md`** from scratch against the actual library surface. The previous file was forked from a sibling project (`svelte-lazy`) and described a dynamic-import loader threat model that does not apply here. The corrected file documents the real surface (no network, no I/O, no crypto, single peer dep, single-maintainer publish chain), the proxy-trap correctness contract, and the current repository hardening (Trusted Publisher OIDC, environment approval gate, CodeQL, OpenSSF Scorecard, tag protection).
- **SHA-pinned every third-party GitHub Action** across `ci.yml`, `bench.yml`, `pages.yml`, `publish.yml`, `codeql.yml`, and the new `scorecard.yml`. Mutable-tag references replaced with `@<sha> # <tag>` form. Dependabot's `github-actions` ecosystem updates SHAs on its weekly schedule.
- **Repinned three Actions from annotated-tag object SHAs to peeled commit SHAs**: `github/codeql-action` (`52485aec` -> `7fd177fa`, used in `codeql.yml` x2 and `scorecard.yml`), `dorny/paths-filter` (`6852f92c` -> `d1c1ffe0`, used in `ci.yml`), and `eps1lon/actions-label-merge-conflict` (`636b369e` -> `1df065eb`, used in `detect-conflicts.yml`). OpenSSF Scorecard's "imposter commit" check (`workflow verification failed: imposter commit ... does not belong to <repo>`) rejects tag-object SHAs because they are not reachable from the action repo's default branch. Verified every pinned SHA in `.github/workflows/` resolves via `GET /repos/<owner>/<repo>/commits/<sha>` against the upstream repo before commit.
- **Added `OpenSSF Scorecard` workflow** (`.github/workflows/scorecard.yml`) that runs weekly and on every push to `master`, uploads SARIF to GitHub Security, and publishes results to the public Scorecard dashboard. README now carries the Scorecard badge.
- **Narrowed Scorecard `push:master` `paths:` filter** to the surfaces the score actually reads (`.github/**`, `SECURITY.md`, `LICENSE`, `package.json`, `bun.lock`, `CONTRIBUTING.md`). Prose-only edits to `README.md`, `CHANGELOG.md`, and `AGENTS.md` no longer trigger an analysis run. The weekly cron and `workflow_dispatch` remain as the safety net if a score-affecting path is added that this allowlist misses.
- **Configured tag-protection ruleset for `refs/tags/v*`** via the repository rulesets API. Blocks tag creation, deletion, and non-fast-forward push for non-admins. Verified with `gh api repos/IsaiahCoroama/svelte-box/rulesets`. Closes the gap between SECURITY.md's stated tag policy and the actual repository configuration.
- **Publish workflow verifies the release tag is an ancestor of `master`** (`git merge-base --is-ancestor`). Defense in depth alongside the new tag-protection ruleset. The check now runs an explicit `git fetch --depth=1 origin master` first so the ancestry comparison does not depend on `actions/checkout`'s default ref handling under a tag trigger.
- **Publish workflow generates a CycloneDX SBOM** during build and attaches `sbom.cdx.json` to the GitHub Release. Provenance + SBOM together cover the supply-chain documentation surface that enterprise vendor reviews expect.
- **Publish workflow runs `npm audit signatures`** before build, verifying every tarball in the resolved dependency graph carries a valid Sigstore signature from the npm registry. Generates a transient `package-lock.json` via `npm install --package-lock-only` first because `bun install` does not emit a npm-format lockfile.
- **Added `concurrency:` groups and header SECURITY comments** to every `pull_request_target` workflow (`detect-conflicts.yml`, `labeler.yml`, `issue-manager.yml`). The header comments record the safety invariant (no PR-code checkout, no PR-controlled `run:` inputs) so future edits do not silently introduce the standard privilege-escalation pattern.
- **Switched SBOM generator from `@cyclonedx/cyclonedx-npm` to `@cyclonedx/cdxgen`** with `-t bun`. The previous tool ran `npm ls --json --long --all` against the bun-installed `node_modules`, which produced `extraneous` and `invalid` ELSPROBLEMS errors on every publish (`@typescript-eslint/types` extraneous, `yaml` invalid version). `cdxgen` reads `bun.lock` directly so the npm graph walk is gone. The transient `package-lock.json` step still runs for `npm audit signatures`, which has no bun-aware equivalent.
- **Reduced GITHUB_TOKEN scope to least-privilege per workflow** (Scorecard `TokenPermissionsID` finding, severity high). Added top-level `permissions: contents: read` to `bench.yml`, `ci.yml`, `detect-conflicts.yml`, `labeler.yml`, and `publish.yml` (none had a top-level block before, so the runner-default `read` + a few `write` scopes were granted to every job by default). Pulled job-only scopes (`security-events: write`, `pages: write`, `id-token: write`, `issues: write`, `pull-requests: write`, `contents: write` for the develop force-push) out of top-level into the single job that needs them in `codeql.yml`, `pages.yml` (split between `build` and `deploy`), `issue-manager.yml`, and `sync-develop.yml`. `scorecard.yml` already used `read-all`. The two `DangerousWorkflowID` alerts on `pages.yml` (`workflow_run` head_sha checkout) are accepted false positives because the trigger is `branches: [master]`, so the SHA is always a trusted commit.

### Documentation

- **Rewrote `CONTRIBUTING.md`** from scratch against the actual codebase. The previous file was forked from a sibling project and referenced a `lazy()` factory, `LazyProps` type, `react-loadable`, and a loader-closure threat model that none exist here. The corrected file uses real branch-name and commit-message examples taken from this repo's history, lists the actual class hierarchy (`BaseBox`, `Box`, `FastBox`), and reflects the current zero-runtime-dependency policy.
- **Fixed `.github/ISSUE_TEMPLATE/bug_report.md`** to reference `@coroama/svelte-box` instead of the wrong package name.
- **Corrected `AGENTS.md` `FORWARD_FIRST` description** to list only `'get'` and `'set'` (the v0.2.0 trim removed `'del'`); rewrote the publish-flow paragraph to describe the actual eight-step pipeline (ancestry check, audit signatures, tag-version match, prepack, SBOM, OIDC publish, SBOM upload); expanded the documentation-surface list from four files to six to include the rewritten `CONTRIBUTING.md` and `SECURITY.md` under the same consistency contract.
- **Replaced residual `loader closure` phrasing in `SECURITY.md`** with "inner function", the last remaining svelte-lazy idiom in the security policy.
- **Added a Scorecard sentence and a Pages-workflow bullet to the README "Status and testing" section**, plus three new-workflow bullets (`detect-conflicts`, `labeler`, `issue-manager`) to `SECURITY.md`'s "Repository Configuration" inventory.

### Tooling and infrastructure

- **Added Vitest coverage configuration** with V8 provider, `src/lib/**` scope, and thresholds (90% lines/statements/functions, 80% branches). New `test:coverage` script wired into `ci.yml` as a non-blocking informational step on the Linux leg until the first measurement establishes a baseline; the AGENTS.md documentation rules section now carries an explicit TODO to promote the step to blocking once the baseline is stable. (Coverage block has since moved to `vitest.config.ts`; see the entry above.)
- **Added `funding` field** to `package.json` pointing at GitHub Sponsors. Cosmetic trust signal for npm consumers.
- **Added `@vitest/coverage-v8` devDep** (`bun.lock` regenerated in the same commit so `bun install --frozen-lockfile` does not break on the next CI run).
- **Removed duplicate `--provenance` declaration.** `package.json` no longer carries `publishConfig.provenance`; the publish workflow's explicit `--provenance` flag remains authoritative.
- **Trimmed `.prettierignore`** of stale `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb` entries that referenced lockfiles that have never existed in this repo.
- **Repaired `.github/labeler.yml` config**: dropped nonexistent `terraform/**`, `scripts/**`, `.pre-commit-config.yaml` path globs inherited from a template fork; restructured to the canonical `actions/labeler@v6` form (single `changed-files` block with `any-glob-to-any-file` + `all-globs-to-all-files`) so the IDE schema validator is satisfied; added `feature`, `bug`, `refactor`, `upgrade` label rules so PRs touching the lib auto-acquire a matching label.
- **Aligned label-checker required set** in `labeler.yml` workflow with labels that actually exist on the repository: dropped `lang-all` (not applicable to a Svelte utility), kept the remaining eight (`breaking`, `security`, `feature`, `bug`, `refactor`, `upgrade`, `docs`, `internal`). Created the three previously-missing labels (`breaking`, `upgrade`, `internal`) so the required-label gate cannot silently block PRs.
- **Switched label-checker from `one_of` to `any_of`** so multi-aspect PRs do not fail the required-label gate. `agilepathway/pull-request-label-checker` defines `one_of` as "exactly one of the listed labels", which rejected the common case of a single PR being both `security` and `upgrade`, or both `feature` and `docs`. `any_of` requires at least one.
- **Trimmed auto-applied label set** in `.github/labeler.yml` to path-derivable labels only (`docs`, `internal`, plus the language/tooling tags `github_actions`, `typescript`, `javascript`, `svelte`, `bun`). Removed `feature`, `bug`, `refactor` rules. They all mapped to `src/lib/**` and stamped every src/lib PR with all three regardless of intent. These plus `security` and `breaking` are now author/maintainer-applied. Dropped the `upgrade` auto-rule since `.github/dependabot.yml` already applies `deps` to every dependency PR; the label-checker `any_of` set was updated accordingly (`upgrade` out, `deps` in). The checker's `any_of` requirement still enforces that one classification label is present.
- **Added bench regression detection** to `bench.yml`. The workflow now downloads the bench output from the previous successful run, parses Vitest's `hz` columns for both runs, and appends a regression table to the PR comment for any benchmark that dropped more than 20%. Informational only; the workflow continues to pass regardless of regressions until the noise floor is understood.
- **Added `sync-develop.yml`** workflow that force-resets `develop` to `master` after every push to `master`. PRs land on master via rebase-merge or squash-merge; both rewrite SHAs and leave `develop` showing "N ahead, N behind master" (rebase) or "N ahead, 1 behind master" (squash) after every cycle. The reset is always a fast-forward in steady state; concurrency group `sync-develop` serializes runs.
- **Extended `ci.yml` `dorny/paths-filter` exclusions** so docs/repo-management edits do not burn CI minutes. Added the five remaining sibling workflows (`codeql.yml`, `scorecard.yml`, `labeler.yml`, `issue-manager.yml`, `detect-conflicts.yml`, plus the new `sync-develop.yml`) and the repo-management files (`.github/dependabot.yml`, `.github/labeler.yml`, `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/**`) to the negation list. Each excluded path has its own trigger so coverage is not lost.

## [0.2.1] - 2026-05-11

Documentation-only patch release. Refreshes the README on the npm package page to match the as-shipped state of v0.2.0. No runtime, type, or API changes.

### Documentation

- Corrected the type-guard predicate description (`this is this & BoxCell<X>`, not `this is Box<...>`).
- Reworded the FastBox `instanceof` claim: it uses the plain prototype-chain check, not proxy-mediated propagation.
- Refreshed the bundle-size / tree-shaking table to reflect the split between `collections/map.js` and `collections/set.js` (importing `boxedMap` no longer pulls in `SvelteSet`, and vice versa).
- Dropped `del` from the helper-shadowing caveat (no longer in `FORWARD_FIRST`) and added a separate caveat for the destructive collision on `FastBox`.
- Refreshed status-and-testing bullets: split bench/test files listed individually, CI push trigger is `master`-only, publish workflow described as using npm Trusted Publisher (OIDC) with a GitHub Environment gate, new bullet for the source-gated Pages workflow.
- Corrected the line-count claim under "Bus factor" (~790, not ~650).
- Updated the Live demo paragraph and the Pages bullet to describe the new source-only deploy gate.

### Tooling and infrastructure

- CI `Detect source changes` job now sets `predicate-quantifier: 'every'` on `dorny/paths-filter`. Without it, the default `some` quantifier matched every file against any single negation pattern, so doc-only PRs still ran the full pipeline. Fix is internal to the workflow; no consumer impact.
- Pages workflow now gates the deploy on the merge actually touching `src/`, `static/`, or a build config file. Docs-only merges no longer redeploy a byte-identical bundle.

## [0.2.0] - 2026-05-11

### Added

- Re-export `PrimitiveType` from the package barrel, defined as `string | number | bigint | boolean | symbol | null | undefined`. `isPrimitive()` now narrows the boxed value to `BoxCell<PrimitiveType>` instead of the inline union.

### Changed

- **Construction throughput**: helper methods and type guards on `BaseBox` moved from per-instance arrow fields to prototype methods. `new FastBox(...)` is roughly 20-22% faster, `new Box(...)` is roughly 19-20% faster. The `FastBox`-vs-`Box` ratio stays around 1.4-1.5x depending on payload. Trade-off: detached helper reads (`const g = box.get; g()`) now lose `this`; call helpers on the box or wrap them as `() => box.value`.
- **Forwarded property reads**: the Box proxy's own-key membership cache now stores both positive and negative lookups (previously only positives were cached, so every forwarded read re-walked the prototype chain). The 10k tight-loop forwarded-prop read benchmark improved from ~2.5x slower than the inner `$state` proxy to ~1.58x slower. Single forwarded reads (`bx.foo`) are now within noise of the baseline.
- `FORWARD_FIRST` collision list trimmed to `{get, set}`; `del` was dead (no common collection exposes `.del`).
- Docs and JSDoc examples now prefer the `box(...)` and `fastbox(...)` factories over `new Box(...)` / `new FastBox(...)` for consistency. The class constructors remain public; only the recommended call style changed.

### Fixed

- Internal definition of `PrimitiveType` was the full `typeof` tag union (including `'object'` and `'function'`) instead of the actual primitive value types. Not previously re-exported from the barrel, so no consumer could have imported it. Fixed before adding it to the public surface.
- **`Box` primitive-forwarding doc was wrong.** `Box<T>` JSDoc claimed `String.prototype.toUpperCase` "still works at runtime" on a primitive box. False: the proxy's `get` trap returns `undefined` for any property read when the inner value is not object-like. Doc now states primitive methods are not forwarded and points callers at `.value.<method>()`. Behavior unchanged; only the doc was wrong.
- `FastBox`/`map.d.ts`/`set.d.ts` JSDoc now warns about the destructive helper-name collision: calling `fb.set(k, v)` on a `FastBox<Map<K, V>>` overwrites `.value` with `k` (drops `v`) because `BaseBox.set` takes one argument. Always reach inner methods through `.value`.
- **`LICENSE` file replaced with MIT text.** The 0.1.0 tarball shipped a GPL-3.0 `LICENSE` file by mistake, even though `package.json` and the README correctly declared MIT. 0.2.0 ships the MIT license text so the file matches the long-stated metadata. The project's license has been MIT throughout; this is a correction of the bundled file, not a license change.

### Documentation

- `fastbox` factory now has full JSDoc with an example, matching the `box` factory.
- New "`Boxed<T>` vs `Box<T>`" section in the README and in the `Boxed` / `FastBoxed` JSDoc, with the "produce `Boxed<T>`, consume `Box<T>`" rule and a worked example.

### Tests

- Browser-mode Vitest suite split per module: `tests/box.svelte.test.ts` (Box), `tests/fastbox.svelte.test.ts` (FastBox plus `fastbox` factory), `tests/collections/map.svelte.test.ts` (`boxedMap`, `fastBoxedMap`, Map JSON.stringify), and `tests/collections/set.svelte.test.ts` (`boxedSet`, `fastBoxedSet`, Set JSON.stringify). Benchmark suite split the same way: `benchmarking/box.svelte.bench.ts` for Box/FastBox, `benchmarking/collections/map.svelte.bench.ts` and `benchmarking/collections/set.svelte.bench.ts` for collection-specific groups.
- New tests pin the apply-trap `this` contract (pre-bound functions keep their bound `this`; unbound functions take whatever `thisArg` the caller passes through) and the primitive-non-forwarding behavior documented above.

## [0.1.0] - 2026-05-09

First public release.

### Added

#### Reactive containers

- **`Box<T>`** class. A reactive container around `$state` with a runtime Proxy. Transparent property forwarding (`box.foo` reads `box.value.foo` for object boxes), callability for function values (`box(...)` invokes the inner function, `new box(...)` constructs the inner class), `instanceof Box` propagation through subclasses, and stable method identity for forwarded methods (`box.fn === box.fn`).
- **`FastBox<T>`** class. Same `.value` surface and helper methods as `Box<T>` but without the runtime Proxy. No transparent forwarding, no callability, no `instanceof` trap. Construction is roughly 2.4x faster than `Box`, primitive `.value` reads and writes match the Baseline class-`$state`-field within noise.
- **`BaseBox<T>`** class. Shared parent of `Box` and `FastBox`. Holds the reactive `value` field, helper methods, and type guards. Exported so call sites can accept either subclass with a single parameter type.
- **`box(value)`** factory. Returns a `Boxed<T>` with the transparent forwarding shape projected into TypeScript.
- **`fastbox(value)`** factory. Returns a `FastBoxed<T>` (a plain `FastBox<T>` alias).
- **`boxedMap(entries?)`**, **`boxedSet(values?)`**. Box wrappers around `SvelteMap` and `SvelteSet` from `svelte/reactivity`. Map and Set methods forward through the proxy, so `boxedMap.set(k, v)` and `boxedSet.add(t)` work directly.
- **`fastBoxedMap(entries?)`**, **`fastBoxedSet(values?)`**. FastBox variants. Reactivity is identical, but methods are reached through `.value` (`m.value.set(k, v)`, `s.value.add(t)`) since FastBox does not forward.

#### Helper methods (on every Box, Box subclass, and FastBox)

- `get()` / `set(v)` for functional-style access. Equivalent to `.value` read/write.
- `del()` typed `del(this: undefined extends T ? this : never)` so `Box<number>.del()` is a TypeScript error while `Box<unknown>` and `Box<string | undefined>` accept it.
- `snapshot()` returns a non-reactive deep clone. Wraps `$state.snapshot`.
- `eager()` returns the current value bypassing async UI suspension. Wraps `$state.eager`.
- `toJSON()` returns the inner value so `JSON.stringify(box)` produces useful output for object and array boxes.
- 14 type guards: `isBoolean`, `isNumber`, `isString`, `isBigInt`, `isSymbol`, `isUndefined`, `isNull`, `isNullish`, `isPrimitive`, `isObject`, `isArray`, `isFunction`, `isMap`, `isSet`. Each returns `this is this & BoxCell<X>` so narrowing inside an `if` block keeps the calling subclass type while refining only the `value` field.

#### Public types

- `Boxed<T> = Box<T> & ForwardShape<T>` for the proxy-driven transparent forwarding surface.
- `FastBoxed<T> = FastBox<T>` for symmetry with `Boxed<T>`.
- `BoxedMap<K, V> = Boxed<SvelteMap<K, V>>`, `BoxedSet<T> = Boxed<SvelteSet<T>>`.
- `FastBoxedMap<K, V> = FastBoxed<SvelteMap<K, V>>`, `FastBoxedSet<T> = FastBoxed<SvelteSet<T>>`.
- `BoxCell<T> = { value: T }` exported so consumers writing their own type guards on Box subclasses can use the same shape.
- `PrimitiveType` for the standard `typeof` tag union.

#### Proxy semantics

- 12 traps wired: `apply`, `construct`, `get`, `set`, `has`, `deleteProperty`, `ownKeys`, `getOwnPropertyDescriptor`, `defineProperty`, `getPrototypeOf`, `preventExtensions`, `setPrototypeOf`.
- `preventExtensions` and `setPrototypeOf` throw with explicit messages because the proxy target is shared across every Box at module scope. Allowing those would corrupt every other Box.
- `defineProperty` routes to `self` or to the inner value, never to the shared target.
- `getPrototypeOf` returns `Object.getPrototypeOf(self)` so `instanceof` works through the proxy and through subclasses.
- Bound-method cache (`WeakMap<inner, Map<prop, { source, bound }>>`) at module scope guarantees `box.someMethod === box.someMethod`. Required for Svelte's keyed `{#each}` and consumer memoization.

### Tooling and infrastructure

- Tree-shakeable ESM. `boxedMap` / `boxedSet` and the FastBox variants live in their own module so importing only `Box` does not pull in `SvelteMap`/`SvelteSet`.
- Hand-written `.d.ts` siblings (honored by `@sveltejs/package`) so polymorphic-this guards and intersection-typed `Boxed<T>` survive packaging.
- 78-test browser-mode Vitest suite (`@vitest/browser-playwright`, headless Chromium) covering reactivity, proxy semantics, type guards, collection forwarding, `$derived` integration, snapshot, eager, JSON.stringify and structured-clone behaviour, cross-boundary passing through function and class layers, and FastBox no-forwarding asserts.
- Three-way Baseline-vs-Box-vs-FastBox benchmark suite (`benchmarking/box.svelte.bench.ts`). 22 describe groups covering construction, primitive read/write, forwarded property and method access, type guards, snapshot, JSON.stringify, eager, collection operations, cross-boundary mutation, and bulk stress paths.
- GitHub Actions CI (lint, type-check, build, test on every push and PR). Tests run cross-platform via a matrix over Linux, macOS, and Windows; an `ci-all-greens` aggregator job rolls the matrix legs and the other jobs into one required check suitable for branch protection.
- Post-merge benchmark workflow that runs after pull requests touching `src/lib`, `benchmarking/`, or the workflow itself merge into `master`. Uploads bench output as a CI artifact and posts a summary comment on the merged PR for regression review.
- Publish workflow that re-runs the full test suite, verifies the release tag matches `package.json` version (with optional `v` prefix stripped), runs `prepack`, and publishes to npm with provenance attestations.
- GitHub Pages deploy of the SvelteKit playground via `@sveltejs/adapter-static`. Gated on CI success on `master`. Live at <https://isaiahcoroama.github.io/svelte-box/>.

### Documentation

- README with table of contents, "Why does this exist" comparison against the four common Svelte 5 alternatives (`$state` wrapper object, class with `$state` field, accessor-pair class, `svelte/store` writable), Box-vs-FastBox feature matrix, when-to-use guidance, full API reference, patterns and pitfalls, classes-that-own-state guide, async semantics, performance section with three-way benchmark tables and direction-tagged cells (`Nx slower` / `Nx faster` / `match`), SSR and SvelteKit notes, debugging tips, bundle-size and tree-shaking notes, proxy traps reference, caveats, status and testing, maintenance and support, and an explicit Svelte 6 plan.
- AGENTS.md with source layout, class hierarchy, type-safety details, build pipeline, and contributor expectations.
- SvelteKit playground at `src/routes/` with `/`, `/box`, and `/fastbox` routes for side-by-side comparison.

[Unreleased]: https://github.com/IsaiahCoroama/svelte-box/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/IsaiahCoroama/svelte-box/compare/v0.2.2...v1.0.0
[0.2.2]: https://github.com/IsaiahCoroama/svelte-box/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/IsaiahCoroama/svelte-box/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/IsaiahCoroama/svelte-box/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/IsaiahCoroama/svelte-box/releases/tag/v0.1.0

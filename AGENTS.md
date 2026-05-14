# AGENTS.md

Instructions for AI coding agents working in this repository. Read this before making changes.

## What this project is

`svelte-box` is a tiny reactive container library for Svelte 5. It wraps `$state` so a value can be passed across function, class, and component boundaries without losing reactivity. Published to npm as `@coroama/svelte-box`, built via the SvelteKit packager. The repo and project keep the name `svelte-box`; only the npm import path is scoped.

## Conventions

- **Svelte 5 runes everywhere**. No legacy stores, no `export let`, no slot syntax. `$state`, `$derived`, `$effect`, `$props` only.
- **JSDoc on the `.js` side, full TypeScript on the `.d.ts` side**. The two must agree. The build favors the `.d.ts` siblings; the JS-side JSDoc is for IDE hover and stays terse.
- **Documentation voice**: plain, declarative, programmer-direct. Prioritize simplicity without sacrificing completeness or accuracy. Filler words only when removing them would damage clarity. Cut restatement, framing, hedging, moralizing. Keep the _why_ on non-obvious decisions. No marketing language, em dashes, stacked semicolons, or emojis in any doc, comment, commit message, or PR body.
- **Commit messages**: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format. Types in use: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `security`, `revert`. Append `!` for breaking changes and include a `BREAKING CHANGE:` footer. Full rules and examples live in [CONTRIBUTING.md](CONTRIBUTING.md#commit-messages).
- **Comments only when the why is non-obvious**. A comment that just restates the code is noise. The README and tests carry the explanatory weight.
- **Strict TypeScript** is the floor. Library code, tests, benches, and the SvelteKit playground all run under `strict: true`.

## Build and check

Local and CI both use bun. The committed lockfile is `bun.lock`. Scripts are runner-agnostic; `npm run …` works in a pinch.

```
bun run check       # svelte-kit sync + svelte-check, must be 0 errors and 0 warnings
bun run build       # production build + svelte-package + publint (also aliased as prepack)
bun run build:app   # vite build only, no svelte-package step (used by the Pages workflow)
bun run test        # vitest browser tests, requires Node 20.6+ and Chromium
bun run bench       # vitest bench, browser-based, takes about a minute
bun run bench:json  # same as bench, but writes bench-results.json for diffing or storage
bun run format      # prettier
bun run lint        # prettier check + eslint (also runs `bun audit --audit-level=low` in CI)
bun run dev         # SvelteKit playground at src/routes/, for manual exploration
```

**Run a single test:**

```sh
bunx vitest --run tests/box.svelte.test.ts -t "test name pattern"
```

**Node version.** SvelteKit 2.57+ needs Node 20.6 or newer (uses `node:util.styleText`). If `bun run check` or `bun run test` fails with `SyntaxError: ... 'styleText'`, the active Node binary is too old. Use `nvm use 24` (matches the publish workflow), or prepend a Node 20.6+ install to `PATH` for the session.

**Playwright.** Tests use `@vitest/browser-playwright` with Chromium. If Chromium is missing, run `bunx playwright install chromium`. The cache lives under `~/.cache/ms-playwright` on Linux, `~/Library/Caches/ms-playwright` on macOS, `%LOCALAPPDATA%\ms-playwright` on Windows.

`bun run bench` launches headless Chromium. Skip it when you do not need numbers. Benches drift between machines; a single local run is informative.

## Architecture

### Source layout

All library source lives under [src/lib/](src/lib/). The runtime split is one
flat file per concern inside `core/`. Hand-written `.d.ts` siblings shadow the
JS files at package-time, see "Why hand-written `.d.ts`" below.

- [src/lib/core/utils.js](src/lib/core/utils.js) and [`.d.ts`](src/lib/core/utils.d.ts) : tiny shared helpers (`isFunction`, `isObjectLike`).
- [src/lib/core/base.svelte.js](src/lib/core/base.svelte.js) and [`.d.ts`](src/lib/core/base.svelte.d.ts) : `BaseBox<T>` class. The reactive `value` field plus every helper method and type guard. Exported from the barrel.
- [src/lib/core/fast.svelte.js](src/lib/core/fast.svelte.js) and [`.d.ts`](src/lib/core/fast.svelte.d.ts) : `FastBox<T>` (empty subclass of `BaseBox`, no proxy) and `fastbox()` factory.
- [src/lib/core/proxy.svelte.js](src/lib/core/proxy.svelte.js) and [`.d.ts`](src/lib/core/proxy.svelte.d.ts) : `Box<T>` (proxy-backed subclass of `BaseBox`), `box()` factory, `Boxed<T>` type. All proxy machinery (`PROXY_TARGET`, `bindCache`, `bindForwarded`, `FORWARD_FIRST`) lives in this file.
- [src/lib/collections/map.js](src/lib/collections/map.js) and [`.d.ts`](src/lib/collections/map.d.ts) : `boxedMap()` and `fastBoxedMap()` factories plus the `BoxedMap`/`FastBoxedMap` types. Imports `SvelteMap` from `svelte/reactivity`.
- [src/lib/collections/set.js](src/lib/collections/set.js) and [`.d.ts`](src/lib/collections/set.d.ts) : `boxedSet()` and `fastBoxedSet()` factories plus the `BoxedSet`/`FastBoxedSet` types. Imports `SvelteSet` from `svelte/reactivity`.
- [src/lib/index.js](src/lib/index.js) and [src/lib/index.d.ts](src/lib/index.d.ts) : barrel re-exports from each `core/*.svelte.{js,d.ts}` and `collections/{map,set}.{js,d.ts}` module.
- [tests/box.svelte.test.ts](tests/box.svelte.test.ts), [tests/fastbox.svelte.test.ts](tests/fastbox.svelte.test.ts) : browser-mode vitest files covering Box and FastBox respectively.
- [tests/collections/map.svelte.test.ts](tests/collections/map.svelte.test.ts) and [tests/collections/set.svelte.test.ts](tests/collections/set.svelte.test.ts) : `boxedMap`/`fastBoxedMap` and `boxedSet`/`fastBoxedSet` coverage. One file per collection type, mirroring the lib layout.
- [benchmarking/box.svelte.bench.ts](benchmarking/box.svelte.bench.ts) : benchmark suite for Box and FastBox. Most describe-blocks are a three-way Baseline-vs-Box-vs-FastBox comparison. The two `type guards (...)` groups omit Baseline because the helpers are Box-specific; everything else (including forwarded-method groups) keeps a Baseline column.
- [benchmarking/collections/map.svelte.bench.ts](benchmarking/collections/map.svelte.bench.ts) and [benchmarking/collections/set.svelte.bench.ts](benchmarking/collections/set.svelte.bench.ts) : collection bench groups (`Map.set`, `Map.get`, `Set.add`), split out to mirror the lib and test layout.
- [src/routes/+layout.svelte](src/routes/+layout.svelte), [src/routes/+page.svelte](src/routes/+page.svelte), [src/routes/box/+page.svelte](src/routes/box/+page.svelte), [src/routes/fastbox/+page.svelte](src/routes/fastbox/+page.svelte) : SvelteKit playground. Dev-only, not part of the published surface.

The split between `proxy.svelte.js` and the `collections/` directory is **intentional for tree-shaking**. Importing only `Box` does not pull in `SvelteMap`/`SvelteSet`. Splitting `collections/` further into `map.js` and `set.js` means importing only `boxedMap` does not pull in `SvelteSet`. Do not fold these back into a single module.

The split between `base.svelte.js`, `fast.svelte.js`, and `proxy.svelte.js` is also intentional. `BaseBox` is the shared parent that holds runtime methods; `FastBox` and `Box` only differ in their constructors. Add new helpers to `base.svelte.js` so all three classes get them at once. Do not duplicate methods across the subclasses.

### Why hand-written `.d.ts`

This project intentionally keeps type declarations in separate `.d.ts` files instead of JSDoc-generated. `@sveltejs/package` detects sibling `.d.ts` files and uses them instead of regenerating from JSDoc. Build output confirms with lines like `Using $lib/core/proxy.svelte.d.ts instead of generated .d.ts file`. Do not add full JSDoc type annotations to the JS files. Keep types in the `.d.ts` siblings.

When you rename or move a runtime file, **rename its `.d.ts` sibling at the same time**. A missing or out-of-sync sibling silently falls back to JSDoc-generated types, which lose the polymorphic-this guards described below.

### Class hierarchy

`BaseBox<T>` (in [core/base.svelte.js](src/lib/core/base.svelte.js)) holds the `value = $state()` field plus every helper method and type guard. Both `FastBox` and `Box` extend `BaseBox`.

`FastBox` ([core/fast.svelte.js](src/lib/core/fast.svelte.js)) is an empty subclass. It exists so the choice between proxy-backed and plain is explicit at the type level. Functionally identical to `BaseBox`.

`Box` ([core/proxy.svelte.js](src/lib/core/proxy.svelte.js)) overrides the constructor to return a `new Proxy(...)` that does transparent forwarding, callability for function values, `instanceof` propagation through subclasses, and the rest.

Runtime behavior is fully deduplicated through inheritance: add a helper method to `BaseBox` once and all three classes get it. The d.ts deduplicates too, via type-guard predicates that use polymorphic `this`: each guard returns `this is this & BoxCell<SomeType>` rather than `this is BaseBox<SomeType>`. That pattern preserves the calling subclass type while narrowing only the value field, so a `Box<unknown>` narrows to `Box<unknown> & BoxCell<string>` rather than dropping to `BaseBox<string>`.

The transparent-forwarding shape (`Boxed<T> = Box<T> & ForwardShape<T>`) lives in [core/proxy.svelte.d.ts](src/lib/core/proxy.svelte.d.ts) only. `FastBoxed<T>` was a deprecated alias for `FastBox<T>` (no runtime forwarding so no extra shape to project); use `FastBox<T>` directly. Do not introduce a higher-kinded helper for these aliases, TypeScript does not support HKT and the older `BaseBoxed<T, B>` definition with `B<T>` will not type-check.

### How the Box proxy works

The `Box` constructor returns a `new Proxy(...)` so `new Box(x)` gives the user the proxy, not the bare instance. Several non-obvious decisions:

1. **Function target, shared at module scope.** The proxy wraps `PROXY_TARGET = function () {}` so the box is callable (`box()`) and constructable (`new box()`) when the inner value is a function or class. The same `PROXY_TARGET` is used for every Box. This means **defensive traps are required** to stop one Box from mutating the shared target and corrupting every other Box. `defineProperty` routes to self/inner. `preventExtensions` and `setPrototypeOf` throw `TypeError` with explicit messages. Do not weaken these.

2. **`isOwn` walks the prototype chain, stopping at `Object.prototype`.** Svelte 5 installs the `$state` accessor on `Box.prototype`, not on the instance, so `hasOwnProperty.call(self, 'value')` returns false. The walk catches the accessor, class fields, prototype methods, and any subclass methods. Stopping before `Object.prototype` keeps `toString`/`hasOwnProperty`/etc. forwarding to the inner value. This was found by running tests, fixing the failures led to this design.

3. **`getPrototypeOf` returns `Object.getPrototypeOf(self)`.** This makes `box instanceof Box` (and `box instanceof MySubclass`) work through the proxy. The proxy target's own prototype (`Function.prototype`) would otherwise win and break `instanceof`.

4. **`bindForwarded` caches bound methods.** `box.someMethod === box.someMethod` must be true, otherwise Svelte's `{#each}` keying and consumer memoization break. The cache is a `WeakMap<inner, Map<prop, { source, bound }>>` at module scope. The `source` field detects when an inner method is reassigned so we rebind. WeakMap drops entries when inner is GC'd. Per-inner Map keys persist for the inner's lifetime.

5. **`FORWARD_FIRST` is a Set of names that prefer the inner method.** Currently `'get'`, `'set'`. This makes `boxedMap.set(k, v)` invoke `SvelteMap.set` instead of Box's helper. `del` was previously in this set but removed in v0.2.0 because no common collection exposes `.del`. If you rename a Box helper that collides with a common collection method, add it to this set.

6. **`toJSON` exists on Box** because `JSON.stringify` of a function-typed value returns `undefined`. Without `toJSON`, every `JSON.stringify(box)` would produce `undefined`. The trap returns `this.value` so serialization sees the inner.

### Type-safety details

- `del()` is typed `del(this: undefined extends T ? this : never): void`. `Box<number>.del()` is a TypeScript error. `Box<unknown>.del()` and `Box<any>.del()` work because both include `undefined`. The polymorphic `this` constraint applies to `FastBox` and any subclass too.
- `Boxed<T>` is `Box<T> & ForwardShape<T>` where `ForwardShape<T>` resolves to a callable signature for function `T`, the object surface for object `T`, and `unknown` for primitives. Object and array properties forward; primitives keep only the `Box<T>` surface (the type narrows for safety, runtime forwarding still works).
- `FastBoxed<T>` is a `@deprecated` alias for `FastBox<T>` (slated for removal in `0.3.0`). There is no transparent forwarding shape because `FastBox` does no proxy-driven forwarding at runtime. Use `FastBox<T>` for new code; the `fastbox(...)` factory and `FastBoxedMap` / `FastBoxedSet` types resolve to `FastBox<T>` directly as of `0.2.2`.
- Type guards return `this is this & BoxCell<X>`. This narrows from `Box<unknown>` and from union types correctly while preserving the calling subclass type.

### Test infrastructure

Tests are split per module to mirror the lib layout: [tests/box.svelte.test.ts](tests/box.svelte.test.ts), [tests/fastbox.svelte.test.ts](tests/fastbox.svelte.test.ts), and [tests/collections/](tests/collections/) (one file per collection type). Shared helpers live in [tests/\_helpers.svelte.ts](tests/_helpers.svelte.ts); the leading underscore is the convention for non-test test utilities and keeps the file out of vitest's default discovery while still letting it use runes.

Reactivity tests use `$effect.root` for setup and `flushSync()` between mutations. The `withRoot` helper from `_helpers.svelte.ts` wraps the root + cleanup boilerplate. Pattern:

```ts
import { withRoot } from './_helpers.svelte.js';

const cleanup = withRoot(() => {
    $effect(() => {
        observed = b.value;
    });
});
flushSync();
b.value = newValue;
flushSync();
expect(observed).toBe(newValue);
cleanup();
```

`@vitest/browser-playwright` runs this in a real browser so the Svelte runtime is intact. There is no Node-environment test project for the library code.

Benchmarks live under [benchmarking/](benchmarking/), split the same way as tests: [box.svelte.bench.ts](benchmarking/box.svelte.bench.ts) for Box and FastBox, [collections/map.svelte.bench.ts](benchmarking/collections/map.svelte.bench.ts) and [collections/set.svelte.bench.ts](benchmarking/collections/set.svelte.bench.ts) for the collection factories. All bench files run in the same browser project. The vitest config's `benchmark.include` is recursive (`benchmarking/**/*.svelte.bench.{js,ts}`). Setup is at `describe` scope so allocation costs are not part of bench iterations. Always compare Box against the realistic alternatives developers reach for: raw `$state`, a class with a `$state` field, a class with a private cell behind a get/set accessor pair, and a `$state({ value })` wrapper. The cross-boundary describe block measures these together so the gap stays legible.

### Build pipeline

`svelte-package` reads from `src/lib`, writes to `dist/`. The `package.json` `exports` field points consumers at `dist/index.js` and `dist/index.d.ts`. The package only ships `dist/`. The SvelteKit playground in `src/routes/` is for local development and is not part of the published surface.

Publish flow: a GitHub Release event triggers `.github/workflows/publish.yml`. The job is gated behind the `npm-publish` environment, which requires manual reviewer approval. In order, the workflow:

1. Checks out at `fetch-depth: 0` and verifies the release commit is an ancestor of `origin/master` (defense in depth alongside the `v*` tag-protection ruleset).
2. Re-runs lint, type-check, and the full test suite.
3. Runs `npm audit signatures` to verify every tarball in the resolved dependency graph carries a valid Sigstore signature from npm.
4. Verifies the release tag matches `package.json` version (`v` prefix stripped).
5. Runs `prepack` (`svelte-package + publint`).
6. Generates a CycloneDX SBOM (`sbom.cdx.json`) via `@cyclonedx/cdxgen -t bun` (reads `bun.lock` directly), with `continue-on-error: true` so a generator failure cannot break publish.
7. Publishes to npm via Trusted Publisher OIDC with provenance attestations. SemVer pre-releases (any version with a hyphen, e.g. `0.2.0-rc.0`) ship under the `next` dist-tag; final releases ship under `latest`.
8. Attaches the SBOM to the GitHub Release as a downloadable asset, only if step 6 produced a file.

The workflow uses `id-token: write` (for OIDC) and `contents: write` (for the SBOM upload). No long-lived `NPM_TOKEN` is stored; the npm registry exchanges the GitHub OIDC token for a short-lived publish credential at run time.

## Testing rules

- Tests live in `tests/`. Discovery glob in `vitest.config.ts` is `tests/**/*.svelte.{test,spec}.{js,ts}`, so the suffix is what matters; the directory layout under `tests/` mirrors the lib (`tests/box.svelte.test.ts`, `tests/fastbox.svelte.test.ts`, `tests/collections/{map,set}.svelte.test.ts`).
- All tests run in headless Chromium through `@vitest/browser-playwright`. There is no Node-environment test project; everything that touches `$state` needs the real Svelte runtime, which only behaves correctly in a browser.
- Shared helpers go in [tests/\_helpers.svelte.ts](tests/_helpers.svelte.ts). The leading underscore is the convention for non-test test utilities; the file is not picked up as a test because its name does not match the discovery suffix. The `.svelte.ts` extension is still required because the body uses runes.
- Reactivity tests wrap setup in `$effect.root` via the `withRoot` helper, then call `flushSync()` between mutations and assertions. The pattern is shown in the Architecture section under "Test infrastructure".
- When mutating reactive state across `flushSync()`, mutate first, then flush, then assert. Out-of-order calls hide bugs.
- Fixtures (small classes or values used as test inputs) go inline in the test file when they are short. Reactive classes that hold `$state` fields should be declared at module scope, not inside `it()` callbacks: nested declarations trip Svelte's `perf_avoid_nested_class` warning.
- The current suite is 91 tests across four files. Adding a test should not push that past ~3 seconds locally on Chromium; if it does, ask whether the test is exercising the lib or the framework.

## Documentation rules

Six files form the documentation surface. Four are consumer-facing; two govern the contributor and security workflow:

1. `README.md` for end users on npm and GitHub.
2. `AGENTS.md` (this file) for contributors and agents.
3. JSDoc in `src/lib/**/*.d.ts` for IDE hover. The `.d.ts` siblings are the source of truth; `.js`-side JSDoc stays minimal.
4. `CHANGELOG.md` for the per-version history.
5. `CONTRIBUTING.md` for the human contribution workflow (PR flow, commit-message format, release process).
6. `SECURITY.md` for the published threat model, vulnerability-reporting channel, and repository-hardening inventory.

Keep all six consistent. When adding a public export, update the README API reference, the JSDoc on the new symbol, this file's Architecture/source-layout list, and an entry under the next version's section in `CHANGELOG.md` in the same change. When changing the publish flow, security posture, or contribution policy, update `SECURITY.md` or `CONTRIBUTING.md` alongside the workflow file.

`bun run test:coverage` runs as a blocking step on the Linux leg of CI. Thresholds live in `vitest.config.ts` (90% lines/statements/functions, 80% branches); the report is uploaded as a CI artifact. The test config uses `@sveltejs/vite-plugin-svelte` directly instead of the SvelteKit plugin so chokidar watchers do not outlive `vitest --run`.

When a change affects the public surface (anything exported from `@coroama/svelte-box`, the runtime behavior of those exports, or the types of those exports), add a `CHANGELOG.md` entry under `## [Unreleased]`. The format follows [Keep a Changelog](https://keepachangelog.com): `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`, in that order, with version-comparison links updated at the bottom of the file. Documentation-only changes do not require a CHANGELOG entry unless the doc fix is significant enough that you want it to show up on the npm package page after the next patch release.

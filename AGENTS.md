# AGENTS.md

Instructions for AI coding agents this repo. Read before changes.

## What this project is

`svelte-box` = tiny reactive container library for Svelte 5. Wrap `$state` so value pass across function, class, component boundaries without lose reactivity. Published npm as `@coroama/svelte-box`, built via SvelteKit packager. Repo and project keep name `svelte-box`; only npm import path scoped.

## Conventions

- **Svelte 5 runes everywhere**. No legacy stores, no `export let`, no slot syntax. `$state`, `$derived`, `$effect`, `$props` only.
- **JSDoc on `.js` side, full TypeScript on `.d.ts` side**. Two must agree. Build favors `.d.ts` siblings; JS-side JSDoc for IDE hover, stay terse.
- **Documentation voice**: plain, declarative, programmer-direct. Simple but complete and accurate. Filler only when removal damage clarity. Cut restatement, framing, hedging, moralizing. Keep _why_ on non-obvious decisions. No marketing language, em dashes, stacked semicolons, emojis in any doc, comment, commit, PR body.
- **Commit messages**: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format. Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `security`, `revert`. Append `!` for breaking, include `BREAKING CHANGE:` footer. Full rules [CONTRIBUTING.md](CONTRIBUTING.md#commit-messages).
- **Comments only when why non-obvious**. Comment restate code = noise. README and tests carry explanation.
- **Strict TypeScript** = floor. Library, tests, benches, SvelteKit playground all run under `strict: true`.

## Build and check

Local and CI both use bun. Committed lockfile = `bun.lock`. Scripts runner-agnostic; `npm run …` work in pinch.

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

**Run single test:**

```sh
bunx vitest --run tests/box.svelte.test.ts -t "test name pattern"
```

**Node version.** SvelteKit 2.57+ need Node 20.6 or newer (use `node:util.styleText`). If `bun run check` or `bun run test` fail with `SyntaxError: ... 'styleText'`, active Node binary too old. Use `nvm use 24` (match publish workflow), or prepend Node 20.6+ install to `PATH` for session.

**Playwright.** Tests use `@vitest/browser-playwright` with Chromium. If Chromium missing, run `bunx playwright install chromium`. Cache live under `~/.cache/ms-playwright` on Linux, `~/Library/Caches/ms-playwright` on macOS, `%LOCALAPPDATA%\ms-playwright` on Windows.

`bun run bench` launch headless Chromium. Skip when no numbers needed. Benches drift between machines; single local run informative.

## Architecture

### Source layout

All library source under [src/lib/](src/lib/). Runtime split group related concerns into subdirs under `core/`. Hand-written `.d.ts` siblings shadow JS files at package-time, see "Why hand-written `.d.ts`" below.

- [src/lib/core/util.js](src/lib/core/util.js) and [`.d.ts`](src/lib/core/util.d.ts) : tiny shared helpers (`isFunction`, `isObjectLike`) plus `PrimitiveType`, `UnknownFn`, `IntersectAll` type aliases.
- [src/lib/core/core.svelte.js](src/lib/core/core.svelte.js) and [`.d.ts`](src/lib/core/core.svelte.d.ts) : four reactive-cell roots (`CoreBox`, `MutCoreBox`, `RawCoreBox`, `RawMutCoreBox`), `BoxCell<T>` and `AnyBox<T>` types, `isBox()` runtime guard. Two roots: deep `$state` (`CoreBox`/`MutCoreBox`) and `$state.raw` (`RawCoreBox`/`RawMutCoreBox`). `Mut*` siblings add public `value` setters via `[SET_VALUE]` symbol seam.
- [src/lib/core/mixins.svelte.js](src/lib/core/mixins.svelte.js) and [`.d.ts`](src/lib/core/mixins.svelte.d.ts) : every mixin factory and its type-only surface class. Include `BoxGuardsMixin`, `BoxAccessorMixin` (compose `BoxGetterMixin`+`BoxSetterMixin`+`BoxDeleterMixin`), `BoxCommonMixin` (compose `BoxSerializableMixin`+`BoxCloneableMixin`), and variadic `BoxMixer` helper. `.d.ts` declare each mixin surface (`BoxGuards`, `BoxAccessor<T>`, `BoxSerializable<T>`, `BoxCloneable<T>`, accessor primitives) plus `BoxConstructor` and `BoxMixin<B, M>`. File extension `.svelte.js` because `BoxCloneableMixin.clone()` call `$state.snapshot`, only resolve inside Svelte-transformed modules.
- [src/lib/core/base.svelte.js](src/lib/core/base.svelte.js) and [`.d.ts`](src/lib/core/base.svelte.d.ts) : `BaseBox<T>` class, built by `BoxMixer(MutCoreBox, BoxAccessorMixin, BoxGuardsMixin, BoxCommonMixin)` plus `snapshot()` and `eager()`. Both `Box` and `FastBox` extend `BaseBox`. `const()` defined on leaves so each pick own `Const*` return type.
- [src/lib/core/proxy/box.js](src/lib/core/proxy/box.js) and [`.d.ts`](src/lib/core/proxy/box.d.ts) : `Box<T>` (proxy-backed subclass of `BaseBox`), `box()` factory, `Boxed<T>` type. Constructor return `buildBoxProxy(this, opts)`.
- [src/lib/core/proxy/const.js](src/lib/core/proxy/const.js) and [`.d.ts`](src/lib/core/proxy/const.d.ts) : `ConstBox<T>` (read-only proxy variant extend `ConstFastBox`), `constbox()` factory, `ConstBoxed<T>` type.
- [src/lib/core/proxy/base.js](src/lib/core/proxy/base.js) : shared proxy machinery (`PROXY_TARGET`, `bindCache`, `bindForwarded`, `buildBoxProxy`). Reused by both `Box` (mutable) and `ConstBox` (read-only) via opts.
- [src/lib/core/fast/box.js](src/lib/core/fast/box.js) and [`.d.ts`](src/lib/core/fast/box.d.ts) : `FastBox<T>` (no-proxy subclass of `BaseBox`), `fastbox()` factory.
- [src/lib/core/fast/const.svelte.js](src/lib/core/fast/const.svelte.js) and [`.d.ts`](src/lib/core/fast/const.svelte.d.ts) : `ConstFastBox<T>` plain read-only view over `RawCoreBox`, `constfastbox()` factory. Storage = `$state.raw`; capture mode snapshot reference, borrow mode alias existing `AnyBox`.
- [src/lib/core/lazy.js](src/lib/core/lazy.js) and [`.d.ts`](src/lib/core/lazy.d.ts) : `LazyBox<T>` deferred-loader cell over `MutCoreBox<Promise<T> | null>`, `lazybox()` factory. First `prefetch()` run loader and cache promise; `reset()` clear it. Sync throws become rejected promises.
- [src/lib/core/collections/map.js](src/lib/core/collections/map.js) and [`.d.ts`](src/lib/core/collections/map.d.ts) : `boxedMap`, `fastBoxedMap`, `constBoxedMap`, `constFastBoxedMap` factories plus four `*BoxedMap` types. Import `SvelteMap` from `svelte/reactivity`.
- [src/lib/core/collections/set.js](src/lib/core/collections/set.js) and [`.d.ts`](src/lib/core/collections/set.d.ts) : `boxedSet`, `fastBoxedSet`, `constBoxedSet`, `constFastBoxedSet` factories plus four `*BoxedSet` types. Import `SvelteSet` from `svelte/reactivity`.
- [src/lib/index.js](src/lib/index.js) and [src/lib/index.d.ts](src/lib/index.d.ts) : barrel re-exports from each module above. `CoreBox`, `MutCoreBox`, `RawCoreBox`, `RawMutCoreBox`, mixin factories, and `BoxMixer` intentionally not re-exported; internal scaffolding.
- [tests/box.svelte.test.ts](tests/box.svelte.test.ts), [tests/fastbox.svelte.test.ts](tests/fastbox.svelte.test.ts), [tests/core.svelte.test.ts](tests/core.svelte.test.ts), [tests/const.svelte.test.ts](tests/const.svelte.test.ts), [tests/lazy.svelte.test.ts](tests/lazy.svelte.test.ts) : example-based browser-mode vitest files cover Box, FastBox, `CoreBox`/`RawCoreBox` roots, ConstBox/ConstFastBox, and LazyBox.
- [tests/collections/map.svelte.test.ts](tests/collections/map.svelte.test.ts) and [tests/collections/set.svelte.test.ts](tests/collections/set.svelte.test.ts) : `boxedMap`/`fastBoxedMap` and `boxedSet`/`fastBoxedSet` coverage. One file per collection type, mirror lib layout.
- [tests/properties/](tests/properties/) : property-based suite built on `fast-check` (devDep). Five files (`box`, `const`, `lazy`, `collections`, `util`) assert round-trip, `isBox` axioms, `LazyBox` cache-once, collection round-trip, mixin composition, util predicates. Same browser project; same `*.svelte.test.ts` discovery suffix.
- [benchmarking/box.svelte.bench.ts](benchmarking/box.svelte.bench.ts) : benchmark suite for Box and FastBox. Most describe-blocks = three-way Baseline-vs-Box-vs-FastBox compare. Two `type guards (...)` groups omit Baseline because helpers Box-specific; rest (incl. forwarded-method groups) keep Baseline column.
- [benchmarking/collections/map.svelte.bench.ts](benchmarking/collections/map.svelte.bench.ts) and [benchmarking/collections/set.svelte.bench.ts](benchmarking/collections/set.svelte.bench.ts) : collection bench groups (`Map.set`, `Map.get`, `Set.add`), split to mirror lib and test layout.
- [src/routes/+layout.svelte](src/routes/+layout.svelte), [src/routes/+page.svelte](src/routes/+page.svelte), [src/routes/box/+page.svelte](src/routes/box/+page.svelte), [src/routes/fastbox/+page.svelte](src/routes/fastbox/+page.svelte) : SvelteKit playground. Dev-only, not part of published surface.

Split between `proxy/`, `fast/`, `collections/` **intentional for tree-shaking**. Import only `Box` not pull in `SvelteMap`/`SvelteSet`. Split `collections/` into `map.js` and `set.js` mean import only `boxedMap` not pull in `SvelteSet`. Do not fold back into single module.

Split between `base.svelte.js`, `fast/box.js`, `proxy/box.js` also intentional. `BaseBox` = shared parent assembled from mixin chain. `FastBox` and `Box` only differ in constructors and chosen `Const*` variant. Mutating helpers live in `mixins.svelte.js` so new behavior added there once, picked up by every class on chain. Do not duplicate methods across subclasses.

Mixin factories in `mixins.svelte.js` (`BoxGuardsMixin`, `BoxAccessorMixin`, `BoxSerializableMixin`, `BoxCloneableMixin`, plus composites `BoxAccessorMixin` and `BoxCommonMixin`) = seam new helper categories added to. `ConstFastBox` reuse `BoxGuardsMixin`, `BoxGetterMixin`, `BoxCommonMixin` to expose read-only side of API without inherit mutating accessors. d.ts side declare each mixin as type-only `class` (`BoxGuards`, `BoxGetter`, etc.); never instantiated at runtime, only used as `M` type argument to `BoxMixin<B, M>`. Variadic stacking also available through `BoxMixer(Base, ...factories)`, which `BaseBox` and `ConstFastBox` use; see `mixins.svelte.d.ts` JSDoc for per-step constraint trade-off.

### Why hand-written `.d.ts`

Project intentionally keep type declarations in separate `.d.ts` files instead of JSDoc-generated. `@sveltejs/package` detect sibling `.d.ts` files and use them instead of regenerate from JSDoc. Build output confirm with lines like `Using $lib/core/proxy/box.d.ts instead of generated .d.ts file`. Do not add full JSDoc type annotations to JS files. Keep types in `.d.ts` siblings.

When rename or move runtime file, **rename `.d.ts` sibling same time**. Missing or out-of-sync sibling silently fall back to JSDoc-generated types, lose polymorphic-this guards described below.

### Project invariant: every box inherits from `CoreBox`

Every reactive container in this library, and every user-defined container layered on top, **must** inherit from `CoreBox`. `instanceof CoreBox` runtime check and `AnyBox<T>` type alias in [src/lib/core/core.svelte.d.ts](src/lib/core/core.svelte.d.ts) = only sanctioned ways to recognise a box generically; both depend on this invariant. Do not introduce parallel container hierarchy. New container variant either extend `CoreBox` directly (read-only), extend `MutCoreBox` (read-write), or extend existing user-facing class (`BaseBox`, `Box`, `FastBox`, `ConstBox`, `LazyBox`) that already inherit from `CoreBox`.

### Class hierarchy

Two reactive-cell roots in [core/core.svelte.js](src/lib/core/core.svelte.js):

- `CoreBox<T>` and `MutCoreBox<T>` over deep `$state()` cell. `CoreBox` read-only (private `#value`, public getter); `MutCoreBox` add public setter via `[VALUE_SET]` symbol seam.
- `RawCoreBox<T>` and `RawMutCoreBox<T>` mirror pair over `$state.raw()` cell, for snapshot-style or opaque payloads where deep tracking unwanted.

None re-exported from public barrel. `AnyBox<T>` = union; `isBox(v)` = runtime guard.

`BaseBox<T>` ([core/base.svelte.js](src/lib/core/base.svelte.js)) = `MutCoreBox` mixed with `BoxAccessorMixin`, `BoxGuardsMixin`, `BoxCommonMixin`. Accessor mixin contribute `get`/`set`/`del`; common contribute `toJSON`/`clone`; guard mixin contribute 14 type guards. `BaseBox` itself add `snapshot()` and `eager()`. Both `FastBox` and `Box` extend `BaseBox`.

`FastBox` ([core/fast/box.js](src/lib/core/fast/box.js)) = near-empty subclass. Exist so choice between proxy-backed and plain explicit at type level, add `const()` return `ConstFastBox`.

`Box` ([core/proxy/box.js](src/lib/core/proxy/box.js)) override constructor to return `buildBoxProxy(this, opts)` (from [core/proxy/base.js](src/lib/core/proxy/base.js)), give transparent forwarding, callability for function values, `instanceof` propagation. `const()` return `ConstBox` (proxy-backed read-only view) share same machinery in read-only mode.

`ConstFastBox` ([core/fast/const.svelte.js](src/lib/core/fast/const.svelte.js)) = plain read-only branch. Compose `BoxGetterMixin`, `BoxGuardsMixin`, `BoxCommonMixin` over `RawCoreBox`; value setter throws. Constructor accept either plain value (capture into inherited raw cell) or `AnyBox<T>` (borrow, share state).

`ConstBox` ([core/proxy/const.js](src/lib/core/proxy/const.js)) extend `ConstFastBox` and wrap same proxy machinery as `Box` in read-only mode (`buildBoxProxy(this, { readOnly: true, ... })`). Forwarded reads work same as on `Box`; every write trap throws. `box.const()` return this (in borrow mode, so view stay reactive to source updates); `fastbox.const()` return `ConstFastBox` (also borrow mode).

`LazyBox` ([core/lazy.js](src/lib/core/lazy.js)) extend `MutCoreBox<Promise<T> | null>` directly. Not inherit mixin chain because deliberately expose narrower surface (no guards, no `toJSON`, no `del`). `prefetch()` and `reset()` = only API.

Runtime behavior fully deduplicated through mixin chain: add guard to `BoxGuardsMixin` once and `BaseBox`, `Box`, `FastBox`, `ConstBox`, `ConstFastBox` all pick up. d.ts deduplicates too, via type-guard predicates using polymorphic `this`: each guard return `this is this & BoxCell<SomeType>` rather than `this is BaseBox<SomeType>`. Pattern preserve calling subclass type while narrow only value field, so `Box<unknown>` narrow to `Box<unknown> & BoxCell<string>` rather than drop to `BaseBox<string>`.

Transparent-forwarding shape (`Boxed<T> = Box<T> & Forwarded<T>`) lives in [core/proxy/box.d.ts](src/lib/core/proxy/box.d.ts) only. No equivalent on no-proxy side: `FastBox<T>` = only public name. `FastBoxed<T>` = deprecated alias removed in 0.3.0. Do not introduce higher-kinded helper for these names, TypeScript not support HKT and older `BaseBoxed<T, B>` definition with `B<T>` not type-check.

### How the Box proxy works

`Box` constructor return `new Proxy(...)` so `new Box(x)` give user proxy, not bare instance. Several non-obvious decisions:

1. **Function target, shared at module scope.** Proxy wrap `PROXY_TARGET = function () {}` so box callable (`box()`) and constructable (`new box()`) when inner value = function or class. Same `PROXY_TARGET` used for every Box. Mean **defensive traps required** to stop one Box from mutate shared target and corrupt every other Box. `defineProperty` route to self/inner. `preventExtensions` and `setPrototypeOf` throw `TypeError` with explicit messages. Do not weaken these.

2. **`isOwn` walk prototype chain, stop at `Object.prototype`.** Svelte 5 install `$state` accessor on `Box.prototype`, not on instance, so `hasOwnProperty.call(self, 'value')` return false. Walk catch accessor, class fields, prototype methods, any subclass methods. Stop before `Object.prototype` keep `toString`/`hasOwnProperty`/etc. forwarding to inner value. Found by run tests, fix failures led to this design.

3. **`getPrototypeOf` return `Object.getPrototypeOf(self)`.** Make `box instanceof Box` (and `box instanceof MySubclass`) work through proxy. Proxy target's own prototype (`Function.prototype`) would otherwise win and break `instanceof`.

4. **`bindForwarded` cache bound methods.** `box.someMethod === box.someMethod` must be true, else Svelte `{#each}` keying and consumer memoization break. Cache = `WeakMap<inner, Map<prop, { source, bound }>>` at module scope. `source` field detect when inner method reassigned so rebind. WeakMap drop entries when inner GC'd. Per-inner Map keys persist for inner's lifetime.

5. **`FORWARD_FIRST` = Set of names prefer inner method.** Defined per-class in `proxy/box.js` and `proxy/const.js`, passed to `buildBoxProxy` via opts. `Box` use `'get'`, `'set'`; `ConstBox` use `'get'` only (mixin chain has no `BoxSetter`, so `set` already fall through). Make `boxedMap.set(k, v)` invoke `SvelteMap.set` instead of Box helper. If rename Box helper that collide with common collection method, add to relevant set in those files.

6. **`toJSON` exists on Box** because `JSON.stringify` of function-typed value return `undefined`. Without `toJSON`, every `JSON.stringify(box)` produce `undefined`. Trap return `this.value` so serialization see inner.

### Type-safety details

- `del()` typed `del(this: undefined extends T ? this : never): void`. `Box<number>.del()` = TypeScript error. `Box<unknown>.del()` and `Box<any>.del()` work because both include `undefined`. Polymorphic `this` constraint apply to `FastBox` and any subclass too.
- `Boxed<T>` = `Box<T> & ForwardShape<T>` where `ForwardShape<T>` resolve to callable signature for function `T`, object surface for object `T`, `unknown` for primitives. Object and array properties forward; primitives keep only `Box<T>` surface (type narrow for safety, runtime forwarding still work).
- No `FastBoxed<T>` alias as of 0.3.0. `FastBox<T>` = only public no-proxy name. `fastbox(...)` factory and `FastBoxedMap` / `FastBoxedSet` types resolve to `FastBox<T>` directly.
- Type guards return `this is this & BoxCell<X>`. Narrow from `Box<unknown>` and from union types correctly while preserve calling subclass type.

### Test infrastructure

Tests split per module to mirror lib layout: [tests/box.svelte.test.ts](tests/box.svelte.test.ts), [tests/fastbox.svelte.test.ts](tests/fastbox.svelte.test.ts), and [tests/collections/](tests/collections/) (one file per collection type). Shared helpers in [tests/\_helpers.svelte.ts](tests/_helpers.svelte.ts); lead underscore = convention for non-test test utilities and keep file out of vitest default discovery while still let it use runes.

Reactivity tests use `$effect.root` for setup and `flushSync()` between mutations. `withRoot` helper from `_helpers.svelte.ts` wrap root + cleanup boilerplate. Pattern:

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

`@vitest/browser-playwright` run this in real browser so Svelte runtime intact. No Node-environment test project for library code.

Benchmarks live under [benchmarking/](benchmarking/), split same way as tests: [box.svelte.bench.ts](benchmarking/box.svelte.bench.ts) for Box and FastBox, [collections/map.svelte.bench.ts](benchmarking/collections/map.svelte.bench.ts) and [collections/set.svelte.bench.ts](benchmarking/collections/set.svelte.bench.ts) for collection factories. All bench files run in same browser project. vitest config `benchmark.include` recursive (`benchmarking/**/*.svelte.bench.{js,ts}`). Setup at `describe` scope so allocation costs not part of bench iterations. Always compare Box against realistic alternatives developers reach for: raw `$state`, class with `$state` field, class with private cell behind get/set accessor pair, `$state({ value })` wrapper. Cross-boundary describe block measure these together so gap stay legible.

### Build pipeline

`svelte-package` read from `src/lib`, write to `dist/`. `package.json` `exports` field point consumers at `dist/index.js` and `dist/index.d.ts`. Package only ship `dist/`. SvelteKit playground in `src/routes/` for local dev, not part of published surface.

Publish flow: GitHub Release event trigger `.github/workflows/publish.yml`. Job gated behind `npm-publish` environment, require manual reviewer approval. In order, workflow:

1. Check out at `fetch-depth: 0` and verify release commit ancestor of `origin/master` (defense in depth alongside `v*` tag-protection ruleset).
2. Re-run lint, type-check, full test suite.
3. Run `npm audit signatures` to verify every tarball in resolved dependency graph carry valid Sigstore signature from npm.
4. Verify release tag match `package.json` version (`v` prefix stripped).
5. Run `prepack` (`svelte-package + publint`).
6. Pack tarball explicitly via `npm pack --ignore-scripts` so published bytes match what later steps attest.
7. Generate CycloneDX SBOM (`sbom.cdx.json`) via `@cyclonedx/cdxgen -t bun` (read `bun.lock` directly), with `continue-on-error: true` so generator failure cannot break publish.
8. Generate Sigstore build-provenance attestation over packed tarball via `actions/attest-build-provenance@v4`; copy resulting bundle to `<tarball>.sigstore` for Release upload (satisfy Scorecard's Signed-Releases check).
9. Publish pre-packed tarball to npm via Trusted Publisher OIDC with `--provenance`. SemVer pre-releases (any version with hyphen, e.g. `0.2.0-rc.0`) ship under `next` dist-tag; final releases ship under `latest`.
10. Attach tarball, Sigstore bundle, and SBOM (when produced) to GitHub Release as downloadable assets via `gh release upload`.

Workflow use `id-token: write` (for OIDC and attestation API), `attestations: write` (for GitHub-native build attestation), and `contents: write` (for Release asset upload). No long-lived `NPM_TOKEN` stored; npm registry exchange GitHub OIDC token for short-lived publish credential at run time.

## Testing rules

- Tests live in `tests/`. Discovery glob in `vitest.config.ts` = `tests/**/*.svelte.{test,spec}.{js,ts}`, so suffix matters; directory layout under `tests/` mirror lib (`tests/box.svelte.test.ts`, `tests/fastbox.svelte.test.ts`, `tests/collections/{map,set}.svelte.test.ts`).
- All tests run in headless Chromium through `@vitest/browser-playwright`. No Node-environment test project; everything touch `$state` need real Svelte runtime, only behave correctly in browser.
- Shared helpers go in [tests/\_helpers.svelte.ts](tests/_helpers.svelte.ts). Lead underscore = convention for non-test test utilities; file not picked up as test because name not match discovery suffix. `.svelte.ts` extension still required because body use runes.
- Reactivity tests wrap setup in `$effect.root` via `withRoot` helper, then call `flushSync()` between mutations and assertions. Pattern shown in Architecture section under "Test infrastructure".
- When mutate reactive state across `flushSync()`, mutate first, then flush, then assert. Out-of-order calls hide bugs.
- Fixtures (small classes or values used as test inputs) go inline in test file when short. Reactive classes hold `$state` fields declared at module scope, not inside `it()` callbacks: nested declarations trip Svelte `perf_avoid_nested_class` warning.
- Current suite = ~220 tests across twelve files (seven example-based files plus five property-based files under `tests/properties/`). Property tests run via `fast-check`; each `it()` wrap `fc.property` predicate and use `expect` inside predicate so `requireAssertions: true` stay satisfied. New test should not push past ~5 seconds locally on Chromium; if it do, ask whether test exercise lib or framework.

## Documentation rules

Six files form documentation surface. Four consumer-facing; two govern contributor and security workflow:

1. `README.md` for end users on npm and GitHub.
2. `AGENTS.md` (this file) for contributors and agents.
3. JSDoc in `src/lib/**/*.d.ts` for IDE hover. `.d.ts` siblings = source of truth; `.js`-side JSDoc stay minimal.
4. `CHANGELOG.md` for per-version history.
5. `CONTRIBUTING.md` for human contribution workflow (PR flow, commit-message format, release process).
6. `SECURITY.md` for published threat model, vulnerability-reporting channel, repository-hardening inventory.

Keep all six consistent. When add public export, update README API reference, JSDoc on new symbol, this file Architecture/source-layout list, and entry under next version section in `CHANGELOG.md` in same change. When change publish flow, security posture, or contribution policy, update `SECURITY.md` or `CONTRIBUTING.md` alongside workflow file.

`bun run test:coverage` run as blocking step on Linux leg of CI. Thresholds live in `vitest.config.ts` (90% lines/statements/functions, 80% branches); report uploaded as CI artifact. Test config use `@sveltejs/vite-plugin-svelte` directly instead of SvelteKit plugin so chokidar watchers not outlive `vitest --run`.

When change affect public surface (anything exported from `@coroama/svelte-box`, runtime behavior of those exports, or types of those exports), add `CHANGELOG.md` entry under `## [Unreleased]`. Format follow [Keep a Changelog](https://keepachangelog.com): `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`, in that order, with version-comparison links updated at bottom of file. Documentation-only changes not require CHANGELOG entry unless doc fix significant enough you want show up on npm package page after next patch release.

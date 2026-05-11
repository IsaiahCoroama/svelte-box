# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [semantic versioning](https://semver.org/spec/v2.0.0.html). The public surface for semver purposes is everything documented in the README and exported from `'@coroama/svelte-box'`.

## [Unreleased]

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

[Unreleased]: https://github.com/IsaiahCoroama/svelte-box/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/IsaiahCoroama/svelte-box/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/IsaiahCoroama/svelte-box/releases/tag/v0.1.0

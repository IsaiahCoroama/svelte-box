# AGENTS.md

Instructions for AI coding agents working in this repository. Read this before making changes.

## What this project is

`svelte-box` is a tiny reactive container library for Svelte 5. It wraps `$state` so a value can be passed across function, class, and component boundaries without losing reactivity. Published to npm as `@coroama/svelte-box`, built via the SvelteKit packager. The repo and project keep the name `svelte-box`; only the npm import path is scoped.

## Commands

The project uses **bun** as its package manager (`bun.lock`, no `package-lock.json`). Scripts still use `npm run` style names because they run via the standard package.json scripts, but install with bun:

- `bun install` (or `bun install --frozen-lockfile` in CI)
- `npm run dev` : start the SvelteKit playground at [src/routes/+page.svelte](src/routes/+page.svelte)
- `npm run check` : `svelte-kit sync && svelte-check`. Use this to verify types before claiming success.
- `npm run lint` : prettier check + eslint
- `npm run format` : prettier write
- `npm test` : run the full vitest suite once (browser mode, headless chromium)
- `npm run test:unit` : vitest in watch mode
- `npm run prepack` : build and validate: `svelte-kit sync && svelte-package && publint`. The `publint` step validates the built output, it does not build anything itself.
- `npm run bench` : run the benchmark suite at [benchmarking/box.svelte.bench.ts](benchmarking/box.svelte.bench.ts) once. Browser mode, takes about a minute.
- `npm run bench:json` : same, but write JSON output to `bench-results.json` for diffing or storage.

**Run a single test:**

```sh
npx vitest --run tests/box.svelte.test.ts -t "test name pattern"
```

**Node version**: SvelteKit 2.57+ needs Node 20.6+ (uses `node:util.styleText`). If `npm run` fails with `SyntaxError: ... 'styleText'`, the active node binary is too old. Use `nvm use 20` (or newer), or prepend a Node 20.6+ install to `PATH` for the session.

**Playwright**: tests use `@vitest/browser-playwright` with chromium. If chromium is missing, run `npx playwright install chromium`.

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

The transparent-forwarding shape (`Boxed<T> = Box<T> & ForwardShape<T>`) lives in [core/proxy.svelte.d.ts](src/lib/core/proxy.svelte.d.ts) only. `FastBoxed<T>` is a plain alias for `FastBox<T>` because `FastBox` does no runtime forwarding. Do not introduce a higher-kinded helper for these aliases, TypeScript does not support HKT and the older `BaseBoxed<T, B>` definition with `B<T>` will not type-check.

### How the Box proxy works

The `Box` constructor returns a `new Proxy(...)` so `new Box(x)` gives the user the proxy, not the bare instance. Several non-obvious decisions:

1. **Function target, shared at module scope.** The proxy wraps `PROXY_TARGET = function () {}` so the box is callable (`box()`) and constructable (`new box()`) when the inner value is a function or class. The same `PROXY_TARGET` is used for every Box. This means **defensive traps are required** to stop one Box from mutating the shared target and corrupting every other Box. `defineProperty` routes to self/inner. `preventExtensions` and `setPrototypeOf` throw `TypeError` with explicit messages. Do not weaken these.

2. **`isOwn` walks the prototype chain, stopping at `Object.prototype`.** Svelte 5 installs the `$state` accessor on `Box.prototype`, not on the instance, so `hasOwnProperty.call(self, 'value')` returns false. The walk catches the accessor, class fields, prototype methods, and any subclass methods. Stopping before `Object.prototype` keeps `toString`/`hasOwnProperty`/etc. forwarding to the inner value. This was found by running tests, fixing the failures led to this design.

3. **`getPrototypeOf` returns `Object.getPrototypeOf(self)`.** This makes `box instanceof Box` (and `box instanceof MySubclass`) work through the proxy. The proxy target's own prototype (`Function.prototype`) would otherwise win and break `instanceof`.

4. **`bindForwarded` caches bound methods.** `box.someMethod === box.someMethod` must be true, otherwise Svelte's `{#each}` keying and consumer memoization break. The cache is a `WeakMap<inner, Map<prop, { source, bound }>>` at module scope. The `source` field detects when an inner method is reassigned so we rebind. WeakMap drops entries when inner is GC'd. Per-inner Map keys persist for the inner's lifetime.

5. **`FORWARD_FIRST` is a Set of names that prefer the inner method.** Currently `'get'`, `'set'`, `'del'`. This makes `boxedMap.set(k, v)` invoke `SvelteMap.set` instead of Box's helper. If you rename a Box helper that collides with a common collection method, add it to this set.

6. **`toJSON` exists on Box** because `JSON.stringify` of a function-typed value returns `undefined`. Without `toJSON`, every `JSON.stringify(box)` would produce `undefined`. The trap returns `this.value` so serialization sees the inner.

### Type-safety details

- `del()` is typed `del(this: undefined extends T ? this : never): void`. `Box<number>.del()` is a TypeScript error. `Box<unknown>.del()` and `Box<any>.del()` work because both include `undefined`. The polymorphic `this` constraint applies to `FastBox` and any subclass too.
- `Boxed<T>` is `Box<T> & ForwardShape<T>` where `ForwardShape<T>` resolves to a callable signature for function `T`, the object surface for object `T`, and `unknown` for primitives. Object and array properties forward; primitives keep only the `Box<T>` surface (the type narrows for safety, runtime forwarding still works).
- `FastBoxed<T>` is a plain alias for `FastBox<T>`. There is no transparent forwarding shape because `FastBox` does no proxy-driven forwarding at runtime.
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

Benchmarks live under [benchmarking/](benchmarking/), split the same way as tests: [box.svelte.bench.ts](benchmarking/box.svelte.bench.ts) for Box and FastBox, [collections/map.svelte.bench.ts](benchmarking/collections/map.svelte.bench.ts) and [collections/set.svelte.bench.ts](benchmarking/collections/set.svelte.bench.ts) for the collection factories. All bench files run in the same browser project. The vite config's `benchmark.include` is recursive (`benchmarking/**/*.svelte.bench.{js,ts}`). Setup is at `describe` scope so allocation costs are not part of bench iterations. Always compare Box against the realistic alternatives developers reach for: raw `$state`, a class with a `$state` field, a class with a private cell behind a get/set accessor pair, and a `$state({ value })` wrapper. The cross-boundary describe block measures these together so the gap stays legible.

### Build pipeline

`svelte-package` reads from `src/lib`, writes to `dist/`. The `package.json` `exports` field points consumers at `dist/index.js` and `dist/index.d.ts`. The package only ships `dist/`. The SvelteKit playground in `src/routes/` is for local development and is not part of the published surface.

Publish flow: GitHub release triggers `.github/workflows/publish.yml`, which re-runs lint/check/tests, verifies the release tag matches `package.json` version (with optional `v` prefix stripped), runs prepack, then `npm publish --provenance --access public`. Provenance requires `id-token: write` in the workflow permissions.

## Style preferences

- No em dashes (—). Use periods or commas instead.
- Avoid heavy semicolon use in prose.
- Documentation should read like a human wrote it, not like LLM output.
- These apply to README, JSDoc, comments, and any prose. Code is not affected.

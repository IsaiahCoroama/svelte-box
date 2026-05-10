# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [semantic versioning](https://semver.org/spec/v2.0.0.html). The public surface for semver purposes is everything documented in the README and exported from `'svelte-box'`.

## [Unreleased]

### Added

- `FastBox<T>` class. Same `.value` accessor and helper-method surface as `Box<T>`, but without the runtime Proxy. No transparent forwarding, no callability, no `instanceof` trap. Construction is ~1.5x faster, primitive reads and writes are within noise of `Box`. Use when you only access state through `.value` and want minimum per-instance cost. Internal `BoxBase` class deduplicates the shared helper methods between `Box` and `FastBox`.

## [0.0.1] - 2026-05-09

### Added

- `Box<T>` class. A reactive container around `$state` with transparent property forwarding and stable method identity.
- `box(value)` factory. Returns a `Boxed<T>` for ergonomic transparent forwarding in TypeScript.
- `boxedMap(entries?)`, `boxedSet(values?)`. Box wrappers around `SvelteMap` and `SvelteSet` from `svelte/reactivity`.
- Helpers on every Box: `get()`, `set()`, `del()` (only callable when `T` includes `undefined`), `snapshot()`, `eager()`, `toJSON()`.
- 14 type-guard methods: `isBoolean`, `isNumber`, `isString`, `isBigInt`, `isSymbol`, `isUndefined`, `isNull`, `isNullish`, `isPrimitive`, `isObject`, `isArray`, `isFunction`, `isMap`, `isSet`. Each narrows `T` via `this is Box<...>`.
- Proxy traps: `apply`, `construct`, `get`, `set`, `has`, `deleteProperty`, `ownKeys`, `getOwnPropertyDescriptor`, `defineProperty`, `getPrototypeOf`, `preventExtensions`, `setPrototypeOf`. Defensive throws on `preventExtensions` and `setPrototypeOf` to protect the shared proxy target.
- Types: `Boxed<T>`, `BoxedMap<K, V>`, `BoxedSet<T>`.
- Test suite covering primitive, object, array, function, class, Map, and Set reactivity, plus snapshot, eager, JSON.stringify, structuredClone, Object.freeze rejection, defineProperty routing, deep-nested mutations, `$derived` integration, type-change reactivity, function closures, stable method identity, and cross-boundary passing.
- GitHub Actions CI on push and PR. Publish workflow on GitHub release with version-tag verification and npm provenance.

[Unreleased]: https://github.com/IsaiahCoroama/svelte-box/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/IsaiahCoroama/svelte-box/releases/tag/v0.0.1

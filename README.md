# svelte-box

A tiny reactive container for Svelte 5. Wraps `$state` so you can pass a value across function, class, and component boundaries without losing reactivity.

```sh
npm install @coroama/svelte-box
# or
bun add @coroama/svelte-box
```

Peer dependency: `svelte ^5.0.0`. The compiled package runs anywhere a modern JS runtime does. Node 20.6 or newer is only needed if you are building from source.

**Live demo:** <https://isaiahcoroama.github.io/svelte-box/>. The same SvelteKit playground that lives under `src/routes/`, deployed from the `master` branch on every push. Try `Box` and `FastBox` side-by-side without cloning the repo.

## Contents

- [Why does this exist](#why-does-this-exist)
- [`Box` vs `FastBox`](#box-vs-fastbox)
- [When to use Box vs raw `$state`](#when-to-use-box-vs-raw-state)
- [Quick start](#quick-start)
- [Usage](#usage)
  - [Primitive values](#primitive-values)
  - [Objects with transparent forwarding](#objects-with-transparent-forwarding)
  - [Arrays](#arrays)
  - [Functions](#functions)
  - [Maps and Sets](#maps-and-sets)
  - [Type guards](#type-guards)
- [API reference](#api-reference)
- [Patterns and pitfalls](#patterns-and-pitfalls)
- [Classes that own state](#classes-that-own-state)
- [Asynchronous code](#asynchronous-code)
- [Performance](#performance)
  - [Benchmark results](#benchmark-results)
  - [What this means for a real app](#what-this-means-for-a-real-app)
- [SSR and hydration](#ssr-and-hydration)
- [Using with SvelteKit](#using-with-sveltekit)
- [Debugging](#debugging)
- [Bundle size and tree-shaking](#bundle-size-and-tree-shaking)
- [Compatibility](#compatibility)
- [Proxy traps](#proxy-traps)
- [Caveats](#caveats)
- [Status and testing](#status-and-testing)
- [Maintenance and support](#maintenance-and-support)
- [License](#license)

## Why does this exist

Svelte 5 makes reactivity feel like plain JavaScript, but there is one rough edge. When you pass a `$state` primitive into a function, you pass its current snapshot, not the live cell:

```svelte
<script>
	let count = $state(0);

	function increment(c) {
		c++; // reassigns the local arg, the outer count never changes
	}

	increment(count);
</script>
```

The same problem shows up when you want a class to expose a piece of reactive state to children, or when you want to share one cell across modules. Once the value crosses a function or component boundary, primitives detach from the original signal.

The Svelte 5 ecosystem has converged on a few workarounds. They all work, and they all have tradeoffs.

**1. Wrap the value in a `$state` object.** The reference stays live, so `c.value++` propagates back.

```js
let counter = $state({ value: 0 });
function increment(c) {
	c.value++;
}
increment(counter);
```

This is the smallest fix, but the wrapper object has no identity, no type, and no methods. You repeat it for every piece of state. There is no `instanceof` check, no helper for snapshotting, no way to share behavior across pieces.

**2. Put the state on a class with a `$state` field.** Pass the class instance instead.

```js
class Counter {
	value = $state(0);
}
const counter = new Counter();
function increment(c) {
	c.value++;
}
```

This is cleaner. You get a real type and can attach methods. The downside: you write a class per piece of state, and the class field is part of the public API, so a child component receiving the counter sees every other field too. Encapsulation is awkward.

**3. Hide the cell behind a get/set accessor pair.** Same as above, but with explicit reads and writes.

```js
class Counter {
	#cell = $state(0);
	get value() {
		return this.#cell;
	}
	set value(v) {
		this.#cell = v;
	}
}
```

This solves encapsulation, but every reactive primitive becomes a 6-line class. It also does not compose, since each class has its own bespoke surface.

**4. Use Svelte stores from `svelte/store`.** Legacy but still supported.

```js
import { writable } from 'svelte/store';
const counter = writable(0);
function increment(c) {
	c.update((n) => n + 1);
}
```

Stores work but live in a separate world from runes, with their own subscription protocol and `$store` auto-subscriptions in templates. Mixing them with `$state` and `$derived` is jarring, and they predate Svelte 5.

**Why Box.** Box is a single typed container that does what each of the above does, in one consistent shape. You get the ergonomic `.value` access of pattern 1, the named identity and methods of pattern 2, the encapsulation of pattern 3, and the cross-boundary semantics that prompted patterns 4 and earlier. On top of that, it adds transparent property forwarding for objects, callability for boxed functions, type guards, snapshot, and a `toJSON` hook. One mental model for every piece of state you need to pass around.

```js
import { Box } from '@coroama/svelte-box';

const counter = new Box(0);
function increment(c) {
	c.value++;
}
increment(counter);
```

Pass it around freely and reactivity follows.

## `Box` vs `FastBox`

The library exports two reactive containers with the same `.value` accessor and the same set of helper methods. They differ in one thing: `Box` is wrapped in a runtime Proxy, `FastBox` is not.

| Feature                                                 | `Box`    | `FastBox`                |
| ------------------------------------------------------- | -------- | ------------------------ |
| `box.value` reactive read and write                     | yes      | yes                      |
| `get`, `set`, `del`, `snapshot`, `eager`, `toJSON`      | yes      | yes                      |
| 14 type guards (`isString`, `isObject`, etc.)           | yes      | yes                      |
| Pass across function or class boundaries reactively     | yes      | yes                      |
| Transparent property forwarding (`box.foo` reads inner) | yes      | no, use `box.value`      |
| Callable when wrapping a function (`box(...)`)          | yes      | no, use `box.value(...)` |
| `instanceof Box` / subclass instanceof through proxy    | yes      | n/a, plain class         |
| Construction speed                                      | baseline | ~1.5x faster             |
| `.value` read/write speed                               | baseline | within noise             |

Use **Box** when you want any of the proxy-only behaviors. Use **FastBox** when you only ever access the value through `.value` and want the smallest possible per-instance cost. The two share the same helper API, so migrating between them is a search-and-replace on the constructor name.

```ts
import { FastBox } from '@coroama/svelte-box';

const count = new FastBox(0);

function increment(c: FastBox<number>) {
	c.value += 1;
}
```

## When to use Box vs raw `$state`

Box is not a replacement for `$state`. It is the layer above, for state that crosses a function, class, or component boundary.

**Stay on raw `$state`** when state lives in one component or module and is read where it is declared, or when the value is an object/array that you only ever pass by reference. Svelte's deep proxy already keeps mutations reactive across function calls. Adding Box buys nothing.

**Reach for Box** when any of these apply:

- You want to pass a primitive (`number`, `string`, `boolean`) into a function or component and have writes propagate back. Raw `$state` primitives become snapshots when passed.
- A class needs to expose one piece of reactive state to children without exposing the rest of its API. Hand the child a `Box<T>` instead of the whole store.
- You want to subclass a reactive cell to attach domain methods (`Counter extends Box<number>`).
- You want transparent property forwarding so consumers do not have to know they are reading through a wrapper.
- You want `JSON.stringify`, `box.snapshot()`, `box.toJSON()`, type guards, or `instanceof` for free.

If you ever wrote `function increment(c) { c.value++ }` and had to wrap your value in `{ value: $state(...) }` to make it work, that is the Box case. Use Box.

## Quick start

```svelte
<script>
	import { Box } from '@coroama/svelte-box';

	const count = new Box(0);

	function increment(c) {
		c.value += 1;
	}
</script>

<button onclick={() => increment(count)}>
	count: {count.value}
</button>
```

## Usage

### Primitive values

The simplest case. Read and write through `.value`.

```js
import { Box } from '@coroama/svelte-box';

const name = new Box('Ada');
name.value = 'Grace';
```

### Objects with transparent forwarding

The `box(...)` factory returns a `Boxed<T>` type which forwards property access to the inner value. Reads and writes go through Svelte's deep reactivity proxy.

```svelte
<script>
	import { box } from '@coroama/svelte-box';

	const user = box({ name: 'Ada', age: 36 });
</script>

<p>{user.name}</p>
<button onclick={() => user.age++}>older</button>
```

You can still reach the underlying object with `user.value` if you need to.

### Arrays

Push, splice, index assignment, all reactive.

```js
const list = box([1, 2, 3]);
list.push(4);
list[0] = 99;
```

### Functions

A boxed function is callable. The proxy forwards calls (and `new`) to the inner function.

```js
const greet = box((name) => `hi, ${name}`);
greet('world'); // 'hi, world'

greet.value = (n) => `hello, ${n}`;
greet('world'); // 'hello, world'
```

### Maps and Sets

A regular `Map` or `Set` is not reactive. Svelte ships `SvelteMap` and `SvelteSet` for this. The `boxedMap` and `boxedSet` factories give you a Box wrapped around those.

```svelte
<script>
	import { boxedMap, boxedSet } from '@coroama/svelte-box';

	const tags = boxedSet(['svelte', 'reactive']);
	const scores = boxedMap([['ada', 100]]);
</script>

<button onclick={() => tags.add('new')}>add</button>
<button onclick={() => scores.set('ben', 80)}>add ben</button>
```

For the FastBox variant, use `fastBoxedMap` and `fastBoxedSet`. There is no Proxy, so map and set methods are reached through `.value`:

```svelte
<script>
	import { fastBoxedMap, fastBoxedSet } from '@coroama/svelte-box';

	const tags = fastBoxedSet(['svelte', 'reactive']);
	const scores = fastBoxedMap([['ada', 100]]);
</script>

<button onclick={() => tags.value.add('new')}>add</button>
<button onclick={() => scores.value.set('ben', 80)}>add ben</button>
```

`fastBoxed*` is the right choice when you want the lower per-instance cost of `FastBox` and do not mind the `.value.method(...)` access pattern. Reactivity behaves the same as the proxy version.

### Type guards

Every Box has guards that narrow `T` in a normal `if` block:

```ts
import { Box } from '@coroama/svelte-box';

const b: Box<unknown> = new Box(42);

if (b.isNumber()) {
	b.value.toFixed(2); // b.value is now typed as number
}
```

## API reference

### `class Box<T>`

| Member             | Description                                                                        |
| ------------------ | ---------------------------------------------------------------------------------- |
| `new Box(initial)` | Construct a Box around `initial`.                                                  |
| `box.value`        | Read or write the boxed value. Reactive.                                           |
| `box.get()`        | Returns `box.value`. Convenience for functional code.                              |
| `box.set(v)`       | Sets `box.value = v`.                                                              |
| `box.del()`        | Sets `box.value = undefined`. Only callable when `T` already includes `undefined`. |
| `box.snapshot()`   | Returns a non-reactive deep clone of the current value. Wraps `$state.snapshot`.   |
| `box.eager()`      | Returns the current value bypassing async UI suspension. Wraps `$state.eager`.     |
| `box.toJSON()`     | Returns the inner value. Called automatically by `JSON.stringify`.                 |

Type guards: `isBoolean`, `isNumber`, `isString`, `isBigInt`, `isSymbol`, `isUndefined`, `isNull`, `isNullish`, `isPrimitive`, `isObject`, `isArray`, `isFunction`, `isMap`, `isSet`. Each narrows `T` via `this is Box<...>`.

### `box(value)`

Factory equivalent to `new Box(value)`, typed as `Boxed<T>` so TypeScript sees the forwarded properties of `value` directly on the Box.

### `boxedMap(entries?)`, `boxedSet(values?)`

Factories that return a Box wrapping a fresh `SvelteMap` or `SvelteSet`. Accept the same iterable arguments as the standard `Map` and `Set` constructors. Map and Set methods forward through the proxy, so `boxedMap.set(k, v)` and `boxedSet.add(t)` work directly.

### `fastBoxedMap(entries?)`, `fastBoxedSet(values?)`

FastBox variants. Same arguments and reactivity semantics, but no Proxy. Reach map and set methods through `.value`:

```ts
const m = fastBoxedMap<string, number>([['a', 1]]);
m.value.set('b', 2); // reactive
m.value.get('a'); // 1

const s = fastBoxedSet<string>(['x']);
s.value.add('y'); // reactive
```

### `class FastBox<T>`

Same surface as `Box<T>`, minus everything proxy-driven. No transparent forwarding, no callability for function values, no `instanceof` propagation. The helper methods (`get`, `set`, `del`, `snapshot`, `eager`, `toJSON`) and all 14 type guards work identically because they live on the shared `BaseBox` parent.

```ts
import { FastBox, fastbox } from '@coroama/svelte-box';

const a = new FastBox(0);
const b = fastbox(0); // identical, factory style
```

The `fastbox()` factory exists for symmetry with `box()`, it is a thin wrapper around `new FastBox(...)`.

### `class BaseBox<T>`

Exported so a parameter type can accept either subclass: `function f(b: BaseBox<number>)` matches both `Box<number>` and `FastBox<number>`. You can subclass `BaseBox` directly, the result is functionally equivalent to `FastBox`.

### Types

```ts
type Boxed<T>; // Box<T> with transparent forwarding
type FastBoxed<T>; // alias for FastBox<T>, no forwarding shape
type BoxedMap<K, V>; // Boxed<SvelteMap<K, V>>
type BoxedSet<T>; // Boxed<SvelteSet<T>>
type FastBoxedMap<K, V>; // FastBoxed<SvelteMap<K, V>>
type FastBoxedSet<T>; // FastBoxed<SvelteSet<T>>
```

## Patterns and pitfalls

### Don't destructure to read primitives

Destructuring a primitive box gives you a snapshot, not the live cell. Same Svelte 5 footgun as destructuring a regular `$state` primitive.

```svelte
<script>
	const count = new Box(0);
	const { value } = count; // captures 0 right now, not reactive
</script>
```

Read `.value` inside the reactive context (template, `$derived`, `$effect`) instead.

### You can destructure object boxes

When the inner value is an object, destructuring gives you the deep-reactive proxy. Mutations through the destructured reference still track.

```js
const user = box({ name: 'Ada' });
const { name } = user; // snapshot of name (string), not reactive
const inner = user.value; // deep-reactive proxy, mutations on inner.foo track
```

### Replacing a `BoxedMap` or `BoxedSet`

`box.set` is shadowed by the inner `Map.set` so `boxedMap.set(k, v)` works as expected. To replace the whole collection, use `box.value = newCollection`.

```js
import { SvelteMap } from 'svelte/reactivity';
scores.value = new SvelteMap([['ada', 100]]);
```

## Classes that own state

This is the use case Box was built for. You can put reactive state inside a class, hand the class around, and pass individual pieces of state into components without losing reactivity anywhere along the way.

### Why a class plus Box

A class field declared `count = $state(0)` is reactive on the instance: `someInstance.count++` works. But if you want to hand a single piece of that state to a child component, a primitive snapshot is not enough. You want the child to read and write the same live cell. Box gives you that handle.

```ts
import { Box } from '@coroama/svelte-box';

// Todo and User come from your own domain types
type Todo = { id: string; text: string; done: boolean };
type User = { id: string; name: string };

class TodoStore {
	todos = new Box<Todo[]>([]);
	filter = new Box<'all' | 'active' | 'done'>('all');
	currentUser = new Box<User | null>(null);

	add(todo: Todo) {
		this.todos.value = [...this.todos.value, todo];
	}

	clear() {
		this.todos.value = [];
	}
}

export const store = new TodoStore();
```

### Pass the whole class to a component

Children read the boxes through the class. Reactivity flows through normally.

```svelte
<!-- TodoList.svelte -->
<script lang="ts">
	import type { TodoStore } from './store';
	let { store }: { store: TodoStore } = $props();
</script>

{#each store.todos.value as todo (todo.id)}
	<TodoItem {todo} />
{/each}
<p>Filter: {store.filter.value}</p>
```

The component sees `store.todos.value` and `store.filter.value` change because each Box is its own live cell. The class itself does not need to be `$state`.

### Pass individual boxes to components

When a child only needs one piece of state, hand it just that piece. The child works against `Box<T>` instead of the whole store, which is cleaner and easier to test.

```svelte
<!-- App.svelte -->
<script>
	import { store } from './store';
</script>

<FilterPicker filter={store.filter} />
<TodoCount todos={store.todos} />
```

```svelte
<!-- FilterPicker.svelte -->
<script lang="ts">
	import type { Box } from '@coroama/svelte-box';
	let { filter }: { filter: Box<'all' | 'active' | 'done'> } = $props();
</script>

<select bind:value={filter.value}>
	<option value="all">All</option>
	<option value="active">Active</option>
	<option value="done">Done</option>
</select>
```

`bind:value={filter.value}` is just `filter.value = ...` under the hood, so it works for the same reason any other write to `box.value` does.

### Subclassing Box

If a single piece of state has its own behavior, subclass `Box` and add methods. The proxy correctly preserves `instanceof` for the subclass.

```ts
import { Box } from '@coroama/svelte-box';

class Counter extends Box<number> {
	increment() {
		this.value += 1;
	}
	decrement() {
		this.value -= 1;
	}
	reset() {
		this.value = 0;
	}
}

const counter = new Counter(0);
counter instanceof Counter; // true
counter instanceof Box; // true
```

### Box inside `$state`, `$state` inside Box

Both directions work and are sometimes useful. `$state` is only available in `.svelte`, `.svelte.js`, or `.svelte.ts` files (or inside a component `<script>`), so the snippet below assumes one of those.

```ts
// Box inside $state: a re-assignable handle inside a reactive object
const view = $state({
	selected: new Box<string | undefined>(undefined)
});

// $state inside Box: wrap a pre-existing reactive object so it can be passed by reference
const cart = $state({ items: [], total: 0 });
const wrapped = box(cart);
```

## Asynchronous code

Box does not introduce any async behavior of its own. It inherits the same semantics as plain `$state`. The notes below cover the cases that come up most often.

### Reading after `await`

Reading `box.value` always returns the current value at that moment. If you capture the value in a local variable before an `await`, that local will be a stale snapshot afterward. Re-read if you need the current value.

```ts
async function tick(b: Box<number>) {
	const before = b.value; // snapshot at this point
	await delay(1000);
	// b.value may have changed during the await
	const after = b.value;
	if (before !== after) {
		// someone else mutated the box while we were waiting
	}
}
```

### Writing across `await` boundaries

Each write triggers reactivity at the point it happens, which is exactly what you usually want for loading and progress states.

```ts
const status = box<'idle' | 'loading' | 'ready' | 'error'>('idle');
const data = box<Data | null>(null);

async function load() {
	status.value = 'loading';
	try {
		data.value = await fetchData();
		status.value = 'ready';
	} catch {
		status.value = 'error';
	}
}
```

Components reading `status.value` see each transition as the function progresses.

### Effects with async work

`$effect` registers its dependencies on the synchronous reads it performs at the start of its body. If you read `box.value` inside an `await`-chained callback, that read is not tracked. Read up front, then do the async work.

```ts
$effect(() => {
	const id = userId.value; // tracked
	(async () => {
		const user = await fetchUser(id); // not tracked, that is fine
		profile.value = user;
	})();
});
```

### `eager()` during UI suspension

When SvelteKit or another async-aware boundary is suspending part of the UI, you may still want to read the latest value of a Box without joining the suspension. Use `box.eager()`. It returns the current value but does not register a tracking dependency that suspends.

```svelte
<a href="/" aria-current={pathname.eager() === '/' ? 'page' : null}>home</a>
```

### Race conditions

JavaScript is single-threaded, so there are no truly concurrent writes. But two interleaved async tasks can still write the same box in any order, last write wins. Box does not add any locking or queueing. If you need cancellation or single-flight loading, do it the same way you would with raw `$state`, for example by tracking an "in-flight token" and ignoring stale results.

```ts
let userToken = 0;

async function loadById(id: string) {
	const myToken = ++userToken;
	const next = await fetchUser(id);
	if (myToken !== userToken) return; // a newer call superseded this one
	user.value = next;
}
```

Each resource you load needs its own counter. Sharing one counter across `loadById`, `loadProfile`, etc. would let one in-flight call cancel an unrelated one.

## Performance

The Box proxy adds one trap layer between you and the inner value. Property reads on the inner object still go through Svelte's own reactivity proxy, so the cost model is:

- Reading `box.value`: one Box trap, then one Svelte getter. Constant overhead.
- Reading a forwarded property like `box.foo` on an object box: one Box trap, then one Svelte trap on the inner value.
- Method calls forwarded through the box are cached. `box.someMethod === box.someMethod` is true, so memoization and Svelte's keyed `{#each}` blocks behave correctly.

For everything except tight loops over thousands of forwarded reads per frame, the difference is negligible. The benchmarks below quantify it.

**Memory.** Each Box instance carries a Proxy plus a small Set of "owned" key names (the Box methods, captured once at construction). The function target the Proxy wraps is shared across every Box, as is the bound-method cache. In practice you can create hundreds of Boxes in a class-based store without observable memory pressure.

### Benchmark results

The bench suite (`npm run bench`) is a three-way comparison: **Baseline** (the fastest alternative a developer would otherwise reach for, usually a class with a `$state` field, raw `$state`, or a direct `SvelteMap`/`SvelteSet`), **Box** (Proxy variant), and **FastBox** (no Proxy). Numbers below are throughput in operations per second. Higher is better.

**Capture context.** The numbers in the tables below come from a single Chromium run via `@vitest/browser-playwright` on Linux x86_64 with the Chromium build that ships with `playwright@1.59.1`. They will drift between machines, browsers, and Svelte versions. Treat them as ballpark figures. To verify on your own hardware, clone the repo and run `npm run bench` (or `npm run bench:json` for a machine-readable dump). The repo also has a scheduled bench workflow (`.github/workflows/bench.yml`) that runs every Monday at 06:00 UTC and uploads a fresh `bench-results.json` as a CI artifact, so the latest run on a known environment is always one click away from the Actions tab.

**Reading the tables.** Every cell labels its direction explicitly:

- **`Nx slower`** — completed `1/N` operations in the time the Baseline completed 1. So `1.07x slower` means Box did roughly 93 ops while the Baseline did 100.
- **`Nx faster`** — the rare rows where Box or FastBox edges out Baseline (usually within noise).
- **`match`** — within ~5% of the Baseline (relative-margin-of-error on the stable rows is ~2 to 3%, so 5% is two error bars wide). Treat as no signal.

Higher `hz` is faster. Baseline is the column to beat; Box and FastBox are compared against it. FastBox skips the Proxy and tracks Baseline closely on most rows. Box pays a small Proxy tax in exchange for transparent forwarding, callability, and `instanceof` propagation, so it is consistently the slowest of the three but rarely by enough to feel.

**TL;DR.**

- For most read or write operations on a primitive or object Box, **FastBox is within 1 to 5% of the Baseline (effectively match)**. **Box is ~5 to 18% slower**.
- Construction is the only hot path with a real gap: `new Box(...)` is ~3.1x slower than a `$state` class field; `new FastBox(...)` is ~2.4x slower. Almost always invisible because you construct once.
- Tight loops over thousands of operations per frame are the only place anything gets meaningfully slow. Hoist `box.value` once before the loop.

#### Hot-path operations

| Operation                            | Baseline                       | Box                       | FastBox                   |
| ------------------------------------ | ------------------------------ | ------------------------- | ------------------------- |
| Construct (primitive)                | 716k hz (`$state` class field) | 228k hz (3.1x slower)     | 301k hz (2.4x slower)     |
| Construct (object)                   | 636k hz                        | 207k hz (3.1x slower)     | 265k hz (2.4x slower)     |
| Read `.value` (primitive)            | 751k hz (raw `$state`)         | 705k hz (1.07x slower)    | 736k hz (match)           |
| Write `.value` (primitive)           | 388k hz                        | 353k hz (1.10x slower)    | 385k hz (match)           |
| Read object prop                     | 713k hz (inner `$state` proxy) | 671k hz (1.06x slower) \* | 704k hz (match) \*        |
| Write object prop                    | 354k hz                        | 308k hz (1.15x slower) \* | 343k hz (match) \*        |
| Forwarded method call                | 744k hz                        | 688k hz (1.08x slower)    | 732k hz (match) \*        |
| Forwarded method identity            | 757k hz                        | 640k hz (1.18x slower)    | 703k hz (1.08x slower) \* |
| `box.snapshot()`                     | 88.6k hz                       | 82.7k hz (1.07x slower)   | 89.9k hz (match)          |
| `JSON.stringify`                     | 249k hz                        | 247k hz (match)           | 249k hz (match)           |
| `box.eager()`                        | 759k hz                        | 549k hz (1.38x slower)    | 593k hz (1.28x slower)    |
| Cross-boundary mutation              | 365k hz (`$state({ value })`)  | 344k hz (1.06x slower)    | 362k hz (match)           |
| Cross-boundary read from class field | 726k hz                        | 691k hz (match)           | 729k hz (match)           |
| `Map.set`                            | 724k hz (`SvelteMap`)          | 699k hz (match) †         | 722k hz (match) ‡         |
| `Map.get`                            | 728k hz                        | 676k hz (1.08x slower) †  | 729k hz (match) ‡         |
| `Set.add`                            | 715k hz (`SvelteSet`)          | 648k hz (1.10x slower) †  | 647k hz (1.11x slower) ‡  |

\* Box transparently forwards `box.foo`. FastBox does not, so its row reads through `.value.foo`.
† `boxedMap.set(k, v)` works because Box's proxy shadows `set` with `SvelteMap.set`. `boxedSet.add(t)` is similar.
‡ For FastBox collections, methods are reached through `.value`: `fastBoxedMap.value.set(k, v)`, `fastBoxedSet.value.add(t)`.

#### Bulk and tight-loop paths

These are the only places the gap is large enough to feel. Every cell here is slower than Baseline.

| Operation                            | Baseline | Box                     | FastBox                    |
| ------------------------------------ | -------- | ----------------------- | -------------------------- |
| 1000 instances constructed in a loop | 25.0k hz | 678 hz (36.8x slower)   | 2.65k hz (9.4x slower)     |
| 10k tight-loop `.value` reads        | 9.16k hz | 1.86k hz (4.9x slower)  | 9.23k hz (match)           |
| 10k tight-loop forwarded-prop reads  | 1.88k hz | 729 hz (2.6x slower) \* | 1.63k hz (1.15x slower) \* |

\* "Forwarded" here means `box.foo` for Box (transparent) or `box.value.foo` for FastBox.

The tight-loop column shows the most useful real-world signal: **FastBox `.value` reads in a 10k loop match a raw class field exactly**, and **FastBox forwarded-prop reads through `.value` are within 15% of reading the inner `$state` proxy directly**. The Box equivalents are 2 to 5x slower because the Proxy fires on every iteration. Mitigation in either case is one line: hoist `box.value` once, then operate on the inner.

### What this means for a real app

A 60Hz frame is 16 ms. To turn the cross-boundary 5 to 10% slowdown into a dropped frame, you would need on the order of **a hundred thousand cross-boundary mutations per frame**. Real components do dozens to low hundreds, so the cost is invisible.

The two places Box is meaningfully slower:

- **Construction** at ~3x. Box still constructs at ~228k instances per second in the bench, so a class-based store with 20 boxes at app boot costs roughly 90 microseconds. Negligible at boot, irrelevant for typical UIs, only worth thinking about if you allocate Boxes inside a render loop.
- **Tight read loops** at ~5x. The only realistic hot path. Mitigation is one line: read `box.value` once before the loop, work with the inner.

If your app is a typical UI (forms, lists with hundreds of items, interactive views), the difference does not register. If it does animation, large-list virtualization, or high-frequency simulation, profile and hoist on the hot path.

Run `npm run bench` to reproduce. Source: [benchmarking/box.svelte.bench.ts](benchmarking/box.svelte.bench.ts).

## SSR and hydration

The Box proxy is built on standard ECMAScript Proxy with no browser-only APIs, so it works in Node and any other JS runtime. `instanceof Box` works on both server and client because the proxy forwards `getPrototypeOf`. `box.snapshot()` produces a serializable plain value that survives JSON or `structuredClone`, which is the recommended way to hand state off between server and client during hydration.

## Using with SvelteKit

A Box is a runtime object with a Proxy. It is not serializable on its own, so you do not return Boxes directly from `load()`, `+page.server.ts`, or form actions. The pattern is to return plain data and box it in your component or store:

```ts
// +page.ts
export async function load() {
	return {
		user: await fetchUser() // plain object
	};
}
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
	import { box } from '@coroama/svelte-box';
	let { data } = $props();
	const user = box(data.user); // box on the client
</script>
```

When you need to send Box state back the other way, use `box.snapshot()` to get a plain value. `JSON.stringify(box)` also works for object and array boxes because of the `toJSON` hook.

For `boxedMap` and `boxedSet`, `JSON.stringify` returns `"{}"` because Map and Set entries are not own enumerable properties. Convert before stringifying:

```ts
JSON.stringify(Array.from(scores)); // [["ada", 100], ["ben", 80]]
JSON.stringify([...tags]); // ["svelte", "reactive"]
```

`box.eager()` is useful inside SvelteKit components that may suspend on async data. It returns the current value without joining the suspension, which is the same use case Svelte's `$state.eager` was designed for.

Streaming responses, route invalidation, and form action results all behave like normal data flowing into the page. Wrap whatever is reactive on the client side in a Box at the boundary, do not try to send live Boxes across the wire.

## Debugging

Logging a Box prints the Proxy with all its forwarded keys, which is rarely what you want. Use `box.snapshot()` for a plain non-reactive copy that prints cleanly:

```js
console.log(box.snapshot()); // plain object, easy to read
console.log(JSON.stringify(box, null, 2)); // also works, via toJSON
```

Stack traces from inside a forwarded operation will include `Proxy.get` or `Proxy.set` frames. If you want to skip them in the debugger, set a frame filter or step over the proxy boundary.

For unit tests, `box.snapshot()` and `box.value` are both safe to compare with `expect(...).toEqual(...)` since they return plain values.

## Bundle size and tree-shaking

The library ships as ESM with `"sideEffects": ["**/*.css"]` so all exports are tree-shakeable. The factories are split across two files so importing only what you need only pulls in what you need:

| Import                                 | What gets bundled                                                  |
| -------------------------------------- | ------------------------------------------------------------------ |
| `Box`, `box`, type guards, helpers     | Box class only. No `SvelteMap` or `SvelteSet`.                     |
| `boxedMap` or `boxedSet`               | Box plus `SvelteMap` and `SvelteSet` (both share one source file). |
| Types only (`Boxed`, `BoxedMap`, etc.) | Erased at build time.                                              |

A modern tree-shaking bundler (Vite, Rollup, esbuild, webpack 5+) will drop whichever of `SvelteMap`/`SvelteSet` you do not actually use, so importing only `boxedMap` typically pulls in just `Box` plus `SvelteMap`. There are no runtime dependencies beyond the `svelte` peer.

## Compatibility

- **Svelte**: declared peer of `^5.0.0`. Tested against the latest Svelte 5 minor releases. The library uses only the public rune API (`$state`, `$state.snapshot`, `$state.eager`) and no private internals, so future minor and patch releases of Svelte 5 should not break it.
- **Node**: 20.6 or newer for the build toolchain. The compiled package itself runs on any modern JS runtime.
- **TypeScript**: works under `strict` mode. Type guards narrow correctly from `Box<unknown>` and from union types.

## Proxy traps

For reference, the Box proxy implements: `apply`, `construct`, `get`, `set`, `has`, `deleteProperty`, `ownKeys`, `getOwnPropertyDescriptor`, `defineProperty`, `getPrototypeOf`, `preventExtensions`, `setPrototypeOf`.

`preventExtensions` and `setPrototypeOf` throw a `TypeError` on purpose. The proxy shares a single function target across every Box for performance, so allowing those would corrupt every other Box. If you need to freeze or change the prototype, do it on `box.value` directly.

## Caveats

- **`get` / `set` / `del` are shadowed by inner methods of the same name.** Wrapping a `Map`, `Set`, or any object with a `set` method means `box.set(...)` calls the inner method, not Box's helper. Use `box.value = newValue` to replace the whole boxed value in that case.
- **Plain `Map` and `Set` are not reactive.** Use `boxedMap()` or `boxedSet()` instead of `new Box(new Map())`.
- **`Object.keys(box)` returns the inner object's keys.** Box's helper methods are hidden from key enumeration so spreads and iteration behave like the inner value.
- **`Object.freeze(box)` throws.** Freezing or sealing the proxy itself is not supported. Freeze `box.value` instead.
- **Tools that walk the proxy see a function, not the inner value.** The Box proxy wraps a function target so it can be callable, which means `node:util.inspect(box)` prints something like `[Function (anonymous)]` and `console.log(box)` in Node is not useful. Use `console.log(box.snapshot())` (or `box.value`) for readable output. Browser DevTools handles this better, expanding the proxy to show forwarded keys.
- **`structuredClone(box)` throws.** `structuredClone` rejects functions, and the proxy target is a function (so the box can be callable). Clone `box.value` or `box.snapshot()` instead, both of which produce a plain serializable object.
- **FastBox does no transparent forwarding.** `fastbox.foo` is `undefined` even when `fastbox.value.foo` exists. Mixing Box and FastBox with the same `BaseBox<T>` parameter type is fine, but call sites that depend on forwarding must use `Box`.

## Status and testing

This is a solo-maintainer project. It follows semver: anything that breaks the public surface bumps the major. The public surface is what is documented in this README and exported from `'@coroama/svelte-box'`.

The repository ships:

- A test suite (Vitest in browser mode via `@vitest/browser-playwright`) covering:
  - Construction, `instanceof Box`, and subclass `instanceof` propagation.
  - Primitive, object, array, function, and class-instance reactivity, including deep-nested mutations and cross-boundary passing through multiple function layers and class storage.
  - All 14 type guards plus reactive re-evaluation as the boxed type changes.
  - `snapshot()`, `eager()`, `toJSON()` / `JSON.stringify`, `structuredClone`.
  - Proxy semantics: `Object.freeze` rejection, `Object.setPrototypeOf` rejection, `Object.defineProperty` routing, `delete` of own keys, and stable method identity for forwarded methods.
  - `BoxedMap` and `BoxedSet` mutations, replacement, iteration, and reactivity.
  - `$derived` integration and bound-method closure preservation.
- A benchmark suite ([benchmarking/box.svelte.bench.ts](benchmarking/box.svelte.bench.ts)) with comparison baselines (raw `$state`, class with `$state` field, class accessor pair, `$state({ value })` wrapper, direct proxy access) covering construction, reads, writes, forwarded property access, method calls, type guards, snapshot, eager, JSON.stringify, BoxedMap/Set operations, cross-boundary mutation, and bulk stress paths.
- A GitHub Actions CI pipeline that runs lint, type-check, and the test suite on every push to `main`/`master`/`develop` and on every pull request.
- A scheduled benchmark workflow that runs weekly (and on demand or on PRs that touch `src/lib`), uploads results as artifacts, and posts them as PR comments for regression review.
- A separate publish workflow that re-runs the full test suite, verifies the release tag matches the package version, and publishes to npm with provenance attestations on every GitHub release.

Issues, contributions, and the changelog: <https://github.com/IsaiahCoroama/svelte-box>. The changelog follows the [Keep a Changelog](https://keepachangelog.com) format. Intended cadence is one entry per release; anything that changes the public surface (exports listed in this README, runtime behavior of those exports, or types of those exports) is called out under that release entry.

## Maintenance and support

This is a solo-maintainer project. Be honest about what that means when you adopt it.

- **No SLA.** Bugs, feature requests, and questions are answered when the maintainer has time. There is no guaranteed response window. For something time-critical, fork or vendor the code (it is small).
- **Severity heuristic.** Reproducible correctness bugs and security issues take priority over feature requests and DX polish. Open an issue with a minimal reproduction and you will get the fastest path to a fix.
- **Contributions welcome.** PRs that include a test and keep the bench numbers within noise are the easiest to land. Big architectural changes should start as an issue first so the design conversation does not stall on a long branch.
- **Svelte 6 plan.** The library uses only the public Svelte 5 rune API (`$state`, `$state.snapshot`, `$state.eager`) plus the standard ECMAScript Proxy. When Svelte 6 lands, the intent is to support it on the same major version if the Svelte upgrade does not require a public-surface break, otherwise cut a new major. Best-effort on backports to the previous major; no time-bound guarantee until there is a shipped major to support.
- **Bus factor.** If the maintainer becomes unavailable, the code is small enough (around 650 lines including hand-written `.d.ts` siblings, of which `core/proxy.svelte.js` is the largest single file at ~230 lines) that a fork can keep it alive without specialist knowledge. The README, AGENTS.md, and the test suite are intended to give a future maintainer everything they need to operate the project.
- **Adoption signal.** This is a young library. There is no implicit claim of broad production usage, and there should not be one. Evaluate it on the API, the tests, the benchmarks, and the live demo, not on download numbers.

## License

MIT. See [LICENSE](LICENSE).

## Repository

Source, issues, and changelog: <https://github.com/IsaiahCoroama/svelte-box>.

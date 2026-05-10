import { BaseBox } from './base.svelte.js';

/**
 * The public type returned by the {@link fastbox} factory. Currently a plain
 * alias for `FastBox<T>` since `FastBox` performs no transparent property
 * forwarding. Kept as a named alias so users can write
 * `function foo(b: FastBoxed<number>)` mirroring the {@link Boxed} convention,
 * and so the factory return type stays decoupled from the class.
 */
export type FastBoxed<T> = FastBox<T>;

/**
 * Reactive container with the same `.value` surface and helper methods as
 * {@link BaseBox} (and therefore {@link Box}), but without a runtime
 * Proxy. No transparent property forwarding, no callability for function
 * values, no bound-method cache, no `instanceof` trap. The result is a
 * plain class with a single reactive field and a fixed set of methods.
 * Per-operation overhead is lower and construction is several times
 * faster than `Box`.
 *
 * Use `FastBox` when:
 * - You only read and write through `.value`.
 * - You do not need transparent forwarding of inner-object properties or
 *   inner-function calls.
 * - You construct many instances and care about construction throughput.
 *
 * Use `Box` when you need any of the proxy-driven behaviors. Migration
 * between the two is mechanical: the helper methods and type guards have
 * the same names and signatures.
 *
 * @example
 * ```ts
 * import { FastBox } from 'svelte-box';
 *
 * const count = new FastBox(0);
 *
 * function increment(c: FastBox<number>) {
 *   c.value += 1;
 * }
 * ```
 */
export declare class FastBox<T> extends BaseBox<T> {}

export declare const fastbox: <T>(initial: T) => FastBoxed<T>;

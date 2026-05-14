import { MutCoreBox } from './core.svelte.js';

/** Loader signature accepted by {@link LazyBox}. May return synchronously or via a promise. */
export type LazyLoaderFn<T> = () => T | Promise<T>;

/**
 * Reactive promise cell with a deferred loader. {@link prefetch} runs
 * the loader on first call and caches the resulting promise in `.value`
 * so later calls reuse it. {@link reset} clears the cache so the next
 * `prefetch` re-runs the loader.
 *
 * Synchronous throws from the loader are converted to rejected
 * promises; non-thenable returns are wrapped in `Promise.resolve`. The
 * loader is only awaited by the caller, not by `LazyBox` itself.
 */
export declare class LazyBox<T> extends MutCoreBox<Promise<T> | null> {
    constructor(loader: LazyLoaderFn<T>);

    /** Run the loader (first call) or return the cached promise. */
    prefetch(): Promise<T>;

    /** Drop the cached promise so the next `prefetch` re-runs the loader. */
    reset(): this;
}

/** Factory equivalent to `new LazyBox(loader)`. */
export declare function lazybox<T>(loader: LazyLoaderFn<T>): LazyBox<T>;

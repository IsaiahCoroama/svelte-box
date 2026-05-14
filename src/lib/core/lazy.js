import { MutCoreBox } from './core.svelte.js';

/**
 * Reactive promise cell with a deferred loader. The first `prefetch()`
 * call invokes the loader and stores the resulting promise in `.value`.
 * Subsequent calls return the same promise until `reset()` clears it.
 */
export class LazyBox extends MutCoreBox {
    #loader;

    constructor(loader) {
        super(null);
        this.#loader = loader;
    }

    prefetch() {
        if (!this.value) {
            // try/catch wraps a synchronous throw from the loader;
            // Promise.resolve normalises a non-thenable return; the
            // silent `.catch` suppresses `unhandledrejection` between
            // settle and consumer-attach (downstream consumers still see
            // the rejection on their own handler).
            let p;

            try {
                p = Promise.resolve(this.#loader());
            } catch (err) {
                p = Promise.reject(err);
            }

            p.catch(() => {});
            this.value = p;
        }

        return this.value;
    }

    reset() {
        this.value = null;
        return this;
    }
}

export function lazybox(loader) {
    return new LazyBox(loader);
}

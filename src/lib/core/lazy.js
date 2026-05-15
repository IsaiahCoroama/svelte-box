import { MutCoreBox } from './core.svelte.js';

export class LazyBox extends MutCoreBox {
    #loader;

    constructor(loader) {
        super(null);
        this.#loader = loader;
    }

    prefetch() {
        if (!this.value) {
            // try/catch converts a synchronous loader throw into a
            // rejected promise. The silent `.catch` suppresses
            // `unhandledrejection` between settle and consumer attach;
            // downstream consumers still see the rejection on their
            // own handler.
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

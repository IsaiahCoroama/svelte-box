import type { Snapshot } from 'svelte';
import type { BoxAccessor, BoxGuards, BoxSerializable, MutCoreBox } from './core.svelte.js';

type _Mixins<T> = MutCoreBox<T> & BoxGuards & BoxAccessor<T> & BoxSerializable<T>;
declare const _Mixins: new <T>(initial: T) => _Mixins<T>;

/**
 * Shared base class for {@link Box} and `FastBox`. Composes the reactive
 * `value` cell ({@link MutCoreBox}) with the accessor (`get`/`set`/`del`),
 * type guards, and `toJSON` mixins. Both `Box` (the Proxy variant) and
 * `FastBox` (the plain variant) inherit from `BaseBox`, so anything
 * documented here applies to both.
 *
 * `const()` is **not** defined on `BaseBox` because the chosen const
 * variant differs between the leaf classes (`Box` returns `ConstBox`,
 * `FastBox` returns `ConstFastBox`). Subclasses define their own.
 *
 * Use `BaseBox<T>` as a parameter type when you want to accept either
 * subclass without committing to one. Subclassing `BaseBox` directly is
 * supported and produces something equivalent to `FastBox` minus
 * `const()`.
 *
 * Type guards use a polymorphic `this` predicate (`this is this & BoxCell<X>`)
 * so narrowing inside an `if (b.isString())` block keeps the original
 * subclass type and only refines the `value` field. A `Box<unknown>`
 * narrows to `Box<unknown> & BoxCell<string>` rather than dropping to
 * the base class.
 */
export declare class BaseBox<T> extends _Mixins<T> {
    /**
     * Return a non-reactive deep clone of the current value. Equivalent to
     * `$state.snapshot(box.value)`. Use this for serialization, logging, or
     * passing the value to code that should not see Svelte's reactive proxy.
     */
    snapshot(): Snapshot<T>;

    /**
     * Return the latest value, bypassing any in-flight async UI suspension.
     * Equivalent to `$state.eager(box.value)`. Useful in templates that need
     * the current value while another part of the UI is awaiting async work.
     */
    eager(): T;
}

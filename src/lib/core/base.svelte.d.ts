import type { BoxAccessor, BoxGuards, BoxCommonMixins } from './mixins.svelte.js';
import type { MutCoreBox } from './core.svelte.js';

// Synthetic constructor for the assembled mixin chain. Type/value pair
// shares the `_Mixins` name so the class below can `extends _Mixins<T>`.
type _Mixins<T> = MutCoreBox<T> & BoxGuards & BoxAccessor<T> & BoxCommonMixins<T>;
declare const _Mixins: new <T>(initial: T) => _Mixins<T>;

/**
 * Shared base for {@link Box} and `FastBox`. Composes a {@link MutCoreBox}
 * cell with the accessor (`get`/`set`/`del`), type-guard, and `toJSON`
 * mixins. Both subclasses inherit from `BaseBox`, so anything documented
 * here applies to both.
 *
 * `toConst()` lives on the leaves rather than here because the chosen
 * const variant differs (`Box` returns `ConstBox`, `FastBox` returns
 * `ConstFastBox`).
 *
 * Use `BaseBox<T>` as a parameter type to accept either subclass.
 * Subclassing `BaseBox` directly yields something equivalent to
 * `FastBox` minus `toConst()`.
 */
export declare class BaseBox<T> extends _Mixins<T> {
    /**
     * Non-reactive deep clone of the current value. Equivalent to
     * `$state.snapshot(box.value)`. Use for serialization, logging, or
     * handing the value to code that should not see Svelte's reactive
     * proxy.
     */
    snapshot(): T;

    /**
     * Current value, bypassing any in-flight async UI suspension.
     * Equivalent to `$state.eager(box.value)`. Useful in templates that
     * need the value while another part of the UI is awaiting async
     * work.
     */
    eager(): T;
}

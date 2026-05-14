import {
    BoxAccessorMixin,
    BoxGuardsMixin,
    BoxSerializableMixin,
    MutCoreBox
} from './core.svelte.js';

const _Mixins = BoxGuardsMixin(BoxAccessorMixin(BoxSerializableMixin(MutCoreBox)));

/**
 * Shared base class for `Box` and `FastBox`. Mixes accessor, guard, and
 * serializable behavior onto a reactive `MutCoreBox` cell.
 *
 * `BaseBox` itself is a usable container. Exported so consumers can type
 * a function that accepts either subclass with `BaseBox<T>` instead of
 * `Box<T> | FastBox<T>`. Subclassing `BaseBox` directly is supported and
 * gives you something equivalent to `FastBox` minus the `const()`
 * helper (defined on the leaf subclasses since the chosen const
 * variant differs between them).
 *
 * Helpers live on mixin prototypes rather than per-instance arrow fields
 * so construction stays cheap. Reading detached methods (e.g.
 * `const g = box.get; g()`) loses `this`; call them on the box.
 */
export class BaseBox extends _Mixins {
    snapshot() {
        return $state.snapshot(this.value);
    }

    eager() {
        return $state.eager(this.value);
    }
}

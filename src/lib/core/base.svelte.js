import { BoxMixer, BoxAccessorMixin, BoxGuardsMixin, BoxCommonMixin } from './mixins.js';
import { MutCoreBox } from './core.svelte.js';

const _Mixins = BoxMixer(MutCoreBox, BoxAccessorMixin, BoxGuardsMixin, BoxCommonMixin);

/**
 * Shared base for `Box` and `FastBox`. Mixes accessor, guard, and
 * serializable behavior onto a `MutCoreBox` cell.
 *
 * Exported so a function can accept either subclass via `BaseBox<T>`.
 * Subclassing `BaseBox` directly is supported and yields something
 * equivalent to `FastBox` minus `const()` (defined on leaf subclasses
 * because the chosen const variant differs).
 *
 * Helpers live on mixin prototypes rather than per-instance arrow fields
 * to keep construction cheap.
 */
export class BaseBox extends _Mixins {
    snapshot() {
        return $state.snapshot(this.value);
    }

    eager() {
        return $state.eager(this.value);
    }
}

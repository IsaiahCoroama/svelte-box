import { BoxMixer, BoxAccessorMixin, BoxGuardsMixin, BoxCommonMixin } from './mixins.svelte.js';
import { MutCoreBox } from './core.svelte.js';

const _Mixins = BoxMixer(MutCoreBox, BoxAccessorMixin, BoxGuardsMixin, BoxCommonMixin);

// See base.svelte.d.ts for the public API doc.
export class BaseBox extends _Mixins {
    snapshot() {
        return $state.snapshot(this.value);
    }

    eager() {
        return $state.eager(this.value);
    }
}

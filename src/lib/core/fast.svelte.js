import { BaseBox } from './base.svelte.js';

// Empty subclass. See fast.svelte.d.ts for the public API doc.
export class FastBox extends BaseBox {}

export function fastbox(initial) {
    return new FastBox(initial);
}

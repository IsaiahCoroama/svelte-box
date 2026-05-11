import { SvelteSet } from 'svelte/reactivity';
import { Box } from '../core/proxy.svelte.js';
import { FastBox } from '../core/fast.svelte.js';

export function boxedSet(values) {
    return new Box(new SvelteSet(values));
}

export function fastBoxedSet(values) {
    return new FastBox(new SvelteSet(values));
}

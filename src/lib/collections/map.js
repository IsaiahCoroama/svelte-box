import { SvelteMap } from 'svelte/reactivity';
import { Box } from '../core/proxy.svelte.js';
import { FastBox } from '../core/fast.svelte.js';

export function boxedMap(entries) {
    return new Box(new SvelteMap(entries));
}

export function fastBoxedMap(entries) {
    return new FastBox(new SvelteMap(entries));
}

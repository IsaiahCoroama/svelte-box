import { describe, it, expect } from 'vitest';
import { LazyBox, lazybox } from '../src/lib/index.js';

describe('LazyBox: construction', () => {
    it('starts with null value (loader not invoked)', () => {
        let calls = 0;
        const lb = new LazyBox(() => {
            calls += 1;
            return Promise.resolve(1);
        });
        expect(lb.value).toBeNull();
        expect(calls).toBe(0);
    });

    it('lazybox() factory is equivalent to new LazyBox()', () => {
        const a = lazybox(async () => 1);
        expect(a).toBeInstanceOf(LazyBox);
    });
});

describe('LazyBox: prefetch', () => {
    it('invokes the loader on first call and caches the promise', async () => {
        let calls = 0;
        const lb = new LazyBox(() => {
            calls += 1;
            return Promise.resolve(7);
        });

        const p1 = lb.prefetch();
        const p2 = lb.prefetch();
        expect(p1).toBe(p2);
        expect(calls).toBe(1);
        await expect(p1).resolves.toBe(7);
    });

    it('resolves with the loader value', async () => {
        const lb = new LazyBox(() => Promise.resolve({ ok: true }));
        const result = await lb.prefetch();
        expect(result).toEqual({ ok: true });
    });

    it('wraps a non-thenable return in a resolved promise', async () => {
        const lb = new LazyBox(() => 42 as unknown as Promise<number>);
        await expect(lb.prefetch()).resolves.toBe(42);
    });

    it('converts a synchronous throw into a rejected promise', async () => {
        const err = new Error('boom');
        const lb = new LazyBox<number>(() => {
            throw err;
        });
        await expect(lb.prefetch()).rejects.toBe(err);
    });

    it('caches a rejection so the loader is not re-run', async () => {
        let calls = 0;
        const lb = new LazyBox<number>(() => {
            calls += 1;
            return Promise.reject(new Error('nope'));
        });

        const p1 = lb.prefetch();
        const p2 = lb.prefetch();
        expect(p1).toBe(p2);
        expect(calls).toBe(1);
        await expect(p1).rejects.toThrow('nope');
    });
});

describe('LazyBox: reset', () => {
    it('clears the cached promise so the next prefetch re-runs the loader', async () => {
        let calls = 0;
        const lb = new LazyBox(() => {
            calls += 1;
            return Promise.resolve(calls);
        });

        await lb.prefetch();
        expect(calls).toBe(1);

        lb.reset();
        expect(lb.value).toBeNull();

        await lb.prefetch();
        expect(calls).toBe(2);
    });

    it('returns this for chaining', () => {
        const lb = new LazyBox(() => Promise.resolve(0));
        expect(lb.reset()).toBe(lb);
    });
});

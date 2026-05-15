import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { LazyBox, lazybox, isBox } from '../../src/lib/index.js';

describe('LazyBox: property: cache-once', () => {
    it('N prefetch calls invoke the loader exactly once', async () => {
        await fc.assert(
            fc.asyncProperty(fc.integer({ min: 1, max: 10 }), fc.integer(), async (n, payload) => {
                let calls = 0;
                const lb = lazybox(async () => {
                    calls += 1;
                    return payload;
                });

                const promises = [];
                for (let i = 0; i < n; i++) promises.push(lb.prefetch());
                const results = await Promise.all(promises);

                expect(calls).toBe(1);
                for (const r of results) expect(r).toBe(payload);
            })
        );
    });

    it('reset re-enables loader invocation', async () => {
        await fc.assert(
            fc.asyncProperty(fc.integer(), async (payload) => {
                let calls = 0;
                const lb = lazybox(async () => {
                    calls += 1;
                    return payload;
                });

                await lb.prefetch();
                await lb.prefetch();
                expect(calls).toBe(1);

                lb.reset();
                await lb.prefetch();
                await lb.prefetch();
                expect(calls).toBe(2);
            })
        );
    });

    it('resolves to the loader return value', async () => {
        await fc.assert(
            fc.asyncProperty(fc.anything(), async (payload) => {
                const lb = new LazyBox(async () => payload);
                const r = await lb.prefetch();
                expect(r).toEqual(payload);
            })
        );
    });

    it('synchronous loader throw becomes a rejected promise', async () => {
        await fc.assert(
            fc.asyncProperty(fc.string({ minLength: 1 }), async (msg) => {
                const lb = lazybox(() => {
                    throw new Error(msg);
                });
                await expect(lb.prefetch()).rejects.toThrow(msg);
            })
        );
    });

    it('asynchronous loader rejection surfaces to consumers', async () => {
        await fc.assert(
            fc.asyncProperty(fc.string({ minLength: 1 }), async (msg) => {
                const lb = lazybox(async () => {
                    throw new Error(msg);
                });
                await expect(lb.prefetch()).rejects.toThrow(msg);
            })
        );
    });

    it('reset returns the LazyBox for chaining', () => {
        const lb = lazybox(async () => 1);
        expect(lb.reset()).toBe(lb);
    });

    it('isBox is true for any LazyBox', () => {
        expect(isBox(lazybox(async () => null))).toBe(true);
        expect(isBox(new LazyBox(async () => 1))).toBe(true);
    });
});

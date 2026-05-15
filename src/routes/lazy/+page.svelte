<script lang="ts">
    import { lazybox } from '$lib/index.js';

    type Profile = { id: number; name: string; loadedAt: number };

    // The loader counts its own invocations so the cache-hit pattern is
    // observable in the UI. Without this, two clicks of "load" would
    // look the same as one. The shouldFail toggle lets the demo also
    // exercise the rejected-promise path.
    let loaderCalls = $state(0);
    let shouldFail = $state(false);

    const profile = lazybox<Profile>(
        () =>
            new Promise<Profile>((resolve, reject) => {
                loaderCalls += 1;
                const wasMeantToFail = shouldFail;
                setTimeout(() => {
                    if (wasMeantToFail) {
                        reject(new Error('simulated network error'));
                    } else {
                        resolve({
                            id: loaderCalls,
                            name: `Ada ${loaderCalls}`,
                            loadedAt: Date.now()
                        });
                    }
                }, 600);
            })
    );

    // Holding the promise in $state forces the {#await} block to re-run
    // when prefetch() returns a fresh promise after reset(). Reading
    // profile.value directly inside the template would also work, but
    // staging through `pending` makes the "no fetch yet" vs "loading"
    // distinction explicit.
    let pending = $state<Promise<Profile> | null>(null);

    function load() {
        pending = profile.prefetch();
    }
    function reset() {
        profile.reset();
        pending = null;
    }
</script>

<h1>Lazy demo</h1>
<p>
    <code>lazybox(loader)</code> defers until the first <code>prefetch()</code>. Later
    <code>prefetch()</code> calls return the cached promise (no second loader call) until
    <code>reset()</code> clears it. Watch the loader counter: it only ticks up when the cache is cold.
</p>

<section>
    <h2>controls</h2>
    <p>loader invocations: <strong>{loaderCalls}</strong></p>
    <label>
        <input type="checkbox" bind:checked={shouldFail} />
        next load fails (simulated)
    </label>
    <div style="margin-top: 0.5rem">
        <button onclick={load}>prefetch()</button>
        <button onclick={reset}>reset()</button>
    </div>
</section>

<section>
    <h2>profile</h2>
    {#if pending === null}
        <p>nothing loaded yet. Click <code>prefetch()</code>.</p>
    {:else}
        {#await pending}
            <p>loading…</p>
        {:then data}
            <p>id: {data.id}</p>
            <p>name: {data.name}</p>
            <p>loadedAt: {new Date(data.loadedAt).toLocaleTimeString()}</p>
            <p>
                Click <code>prefetch()</code> again: the loader counter stays put because
                <code>profile.value</code> already holds this promise.
            </p>
        {:catch err}
            <p style="color: var(--error)">rejected: {err.message}</p>
            <p>
                The rejected promise is cached too. Call <code>reset()</code> before the next attempt
                to retry.
            </p>
        {/await}
    {/if}
</section>

<section>
    <h2><code>profile.value</code> directly</h2>
    <p>
        <code>profile.value</code> exposes the cached promise (or <code>null</code> after
        <code>reset()</code>). Useful when you want to <code>await</code> it from outside the template.
    </p>
    <pre>{profile.value === null ? 'null' : 'Promise<Profile> (cached)'}</pre>
</section>

<style>
    pre {
        background: var(--surface);
        border: 1px solid var(--border-soft);
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        margin: 0;
        color: var(--fg);
    }
</style>

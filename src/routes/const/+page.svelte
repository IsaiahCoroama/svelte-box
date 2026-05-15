<script lang="ts">
    import {
        ConstBox,
        ConstFastBox,
        box,
        constbox,
        constBoxedSet,
        constFastBoxedSet
    } from '$lib/index.js';
    import { SvelteSet } from 'svelte/reactivity';

    // ---------------------------------------------------------------
    // Borrow mode: ConstBox wraps a live source. Parent owns the cell,
    // child holds the const view. Parent mutations flow through; child
    // writes throw.
    // ---------------------------------------------------------------
    const source = box(0);
    const borrowedConst = new ConstBox(source);
    const borrowedConstFast = new ConstFastBox(source);

    let borrowWriteError = $state<string | null>(null);
    function tryWriteBorrowed() {
        borrowWriteError = null;
        try {
            // Type-asserting around the readonly cell on purpose. The
            // proxy trap rejects this at runtime; we want to display
            // the resulting TypeError.
            (borrowedConst as unknown as { value: number }).value = 999;
        } catch (err) {
            borrowWriteError = err instanceof Error ? err.message : String(err);
        }
    }

    // ---------------------------------------------------------------
    // Capture mode: ConstBox built from a plain value. Decoupled from
    // any later mutation of the original variable.
    // ---------------------------------------------------------------
    const initial = { name: 'Ada', age: 36 };
    const captured = constbox(initial);
    // Mutating `initial` after the fact does not affect `captured`
    // because the capture-mode constructor stores into a fresh internal
    // cell (with $state.raw semantics — top-level reassignment only).
    // We show this by mutating `initial.age` and rendering both.
    let capturedSeesChange = $state(false);
    function mutateOriginal() {
        initial.age += 1;
        capturedSeesChange = (captured.value as typeof initial).age === initial.age;
    }

    // ---------------------------------------------------------------
    // Const collection: forwarded mutations are allowed (inner stays
    // reactive), reference reassignment throws.
    // ---------------------------------------------------------------
    const tags = constBoxedSet<string>(['svelte', 'reactive']);
    const fastTags = constFastBoxedSet<string>(['svelte', 'reactive']);

    let tagsReplaceError = $state<string | null>(null);
    function tryReplaceTags() {
        tagsReplaceError = null;
        try {
            (tags as unknown as { value: SvelteSet<string> }).value = new SvelteSet(['fresh']);
        } catch (err) {
            tagsReplaceError = err instanceof Error ? err.message : String(err);
        }
    }
</script>

<h1>Const demo</h1>
<p>
    Read-only reactive views of a value or another box. <code>ConstBox</code> wraps with a Proxy
    (transparent forwarding, like <code>Box</code>); <code>ConstFastBox</code> is the plain
    no-proxy sibling.
</p>

<section>
    <h2>borrow mode (shared live state)</h2>
    <p>
        <code>new ConstBox(source)</code> reads through to <code>source.value</code>. Mutate the
        source on the left, watch both const views on the right update reactively.
    </p>
    <div class="cols">
        <div>
            <p><strong>source</strong> (mutable): {source.value}</p>
            <button onclick={() => source.value++}>source++</button>
        </div>
        <div>
            <p><strong>ConstBox</strong> (proxy): {borrowedConst.value}</p>
            <p><strong>ConstFastBox</strong> (plain): {borrowedConstFast.value}</p>
            <button onclick={tryWriteBorrowed}>try borrowedConst.value = 999</button>
            {#if borrowWriteError}
                <p style="color: var(--error)">TypeError: {borrowWriteError}</p>
            {/if}
        </div>
    </div>
</section>

<section>
    <h2>capture mode (independent snapshot)</h2>
    <p>
        <code>constbox(value)</code> captures <code>value</code> into a fresh internal cell. Later
        mutations of the original variable do not propagate.
    </p>
    <p>captured.value: {JSON.stringify(captured.value)}</p>
    <p>original `initial.age`: {initial.age}</p>
    <button onclick={mutateOriginal}>mutate initial.age</button>
    {#if capturedSeesChange}
        <p style="color: var(--error)">UNEXPECTED: captured tracked the external mutation.</p>
    {:else}
        <p>captured holds its snapshot regardless of `initial.age` changes.</p>
    {/if}
</section>

<section>
    <h2>const collection variants</h2>
    <p>
        <code>constBoxedSet</code> and <code>constFastBoxedSet</code> freeze the reference but
        leave the inner <code>SvelteSet</code> mutable through forwarded methods.
    </p>
    <p>constBoxedSet tags: {[...tags].join(', ')} (size: {tags.size})</p>
    <p>constFastBoxedSet tags: {[...fastTags.value].join(', ')} (size: {fastTags.value.size})</p>
    <button onclick={() => tags.add(`tag-${tags.size}`)}>tags.add</button>
    <button onclick={() => fastTags.value.add(`tag-${fastTags.value.size}`)}
        >fastTags.value.add</button
    >
    <button onclick={tryReplaceTags}>try tags.value = new SvelteSet([...])</button>
    {#if tagsReplaceError}
        <p style="color: var(--error)">TypeError: {tagsReplaceError}</p>
    {/if}
</section>

<style>
    .cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    .cols > div {
        padding: 0.5rem;
        background: var(--surface);
        border: 1px solid var(--border-soft);
        border-radius: 4px;
    }
</style>

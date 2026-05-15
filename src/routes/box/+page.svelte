<script lang="ts">
    import { Box, box, boxedMap, boxedSet, isBox } from '$lib/index.js';

    const count = new Box(0);
    const message = box('hello');
    const user = box({ name: 'Ada', age: 36 });
    const list = box<number[]>([1, 2, 3]);
    const greet = box((name: string) => `hi, ${name}`);

    const tags = boxedSet(['svelte', 'reactive']);
    const scores = boxedMap([
        ['ada', 100],
        ['ben', 80]
    ]);

    function increment(b: Box<number>) {
        b.value += 1;
    }

    // clone() demo. Separate box so the cloned state does not bleed into
    // the other sections.
    const clonable = box({ count: 0, label: 'fresh' });
    let cloned = $state<{ count: number; label: string } | null>(null);

    // .const() borrow demo. Bump `live`, take a const view, bump again,
    // see the view track because .const() borrows the source cell.
    const live = box(0);
    let constView = $state<ReturnType<typeof live.const> | null>(null);

    // isBox demo with mixed inputs.
    const samples = [
        ['box(0)', count, isBox(count)],
        ['boxedSet([])', tags, isBox(tags)],
        ['plain { value: 1 }', { value: 1 }, isBox({ value: 1 })],
        ['42', 42, isBox(42)],
        ['null', null, isBox(null)]
    ] as const;
</script>

<h1>Box demo</h1>
<p>Proxy-backed. Inner properties forward through the box.</p>

<section>
    <h2>primitive box</h2>
    <button onclick={() => increment(count)}>count: {count.value}</button>
    <input bind:value={message.value} />
    <p>message: {message.value}</p>
</section>

<section>
    <h2>object box (transparent forwarding)</h2>
    <p>name: {user.name} | age: {user.age}</p>
    <button onclick={() => user.age++}>age++</button>
</section>

<section>
    <h2>array box</h2>
    <p>list: {list.value.join(', ')} (len: {list.length})</p>
    <button onclick={() => list.push(list.length + 1)}>push</button>
</section>

<section>
    <h2>function box (callable)</h2>
    <p>{greet('world')}</p>
</section>

<section>
    <h2>boxedMap (SvelteMap)</h2>
    <p>scores size: {scores.size}</p>
    {#each scores as [name, score] (name)}
        <p>{name}: {score}</p>
    {/each}
    <button onclick={() => scores.set('cyd', 70)}>add cyd</button>
</section>

<section>
    <h2>boxedSet (SvelteSet)</h2>
    <p>tags: {[...tags].join(', ')} (size: {tags.size})</p>
    <button onclick={() => tags.add(`tag-${tags.size}`)}>add tag</button>
</section>

<section>
    <h2>type guards</h2>
    <p>count is number: {count.isNumber()}</p>
    <p>user is object: {user.isObject()}</p>
    <p>list is array: {list.isArray()}</p>
    <p>greet is function: {greet.isFunction()}</p>
    <p>scores is map: {scores.isMap()}</p>
</section>

<section>
    <h2><code>clone()</code></h2>
    <p>value: {JSON.stringify(clonable.value)}</p>
    <button onclick={() => clonable.count++}>count++</button>
    <button onclick={() => (cloned = clonable.clone())}>clone()</button>
    {#if cloned}
        <p>clone (plain, non-reactive): {JSON.stringify(cloned)}</p>
    {/if}
</section>

<section>
    <h2><code>box.const()</code> reactive read-only view</h2>
    <p>live: {live.value}</p>
    <button onclick={() => live.value++}>live++</button>
    <button onclick={() => (constView = live.const())}>take live.const()</button>
    {#if constView}
        <p>view: {constView.value} (tracks live; writes through view would throw)</p>
    {/if}
</section>

<section>
    <h2><code>isBox</code></h2>
    <table>
        <thead>
            <tr><th>input</th><th>isBox</th></tr>
        </thead>
        <tbody>
            {#each samples as [label, _value, result] (label)}
                <tr><td><code>{label}</code></td><td>{result}</td></tr>
            {/each}
        </tbody>
    </table>
</section>

<style>
    table {
        border-collapse: collapse;
    }
    th,
    td {
        padding: 0.25rem 0.6rem;
        border: 1px solid var(--border-soft);
        text-align: left;
    }
</style>

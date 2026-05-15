<script lang="ts">
    import { FastBox, fastbox, fastBoxedMap, fastBoxedSet, isBox } from '$lib/index.js';

    const count = new FastBox(0);
    const message = fastbox('hello');
    const user = fastbox({ name: 'Ada', age: 36 });
    const list = fastbox<number[]>([1, 2, 3]);
    const greet = fastbox((name: string) => `hi, ${name}`);

    const tags = fastBoxedSet(['svelte', 'reactive']);
    const scores = fastBoxedMap([
        ['ada', 100],
        ['ben', 80]
    ]);

    function increment(b: FastBox<number>) {
        b.value += 1;
    }

    const clonable = fastbox({ count: 0, label: 'fresh' });
    let cloned = $state<{ count: number; label: string } | null>(null);

    const live = fastbox(0);
    let constView = $state<ReturnType<typeof live.const> | null>(null);

    const samples = [
        ['fastbox(0)', count, isBox(count)],
        ['fastBoxedSet([])', tags, isBox(tags)],
        ['plain { value: 1 }', { value: 1 }, isBox({ value: 1 })],
        ['42', 42, isBox(42)],
        ['null', null, isBox(null)]
    ] as const;
</script>

<h1>FastBox demo</h1>
<p>No proxy. Inner properties and methods are reached through <code>.value</code>.</p>

<section>
    <h2>primitive box</h2>
    <button onclick={() => increment(count)}>count: {count.value}</button>
    <input bind:value={message.value} />
    <p>message: {message.value}</p>
</section>

<section>
    <h2>object box (no forwarding)</h2>
    <p>name: {user.value.name} | age: {user.value.age}</p>
    <button onclick={() => user.value.age++}>age++</button>
</section>

<section>
    <h2>array box</h2>
    <p>list: {list.value.join(', ')} (len: {list.value.length})</p>
    <button onclick={() => list.value.push(list.value.length + 1)}>push</button>
</section>

<section>
    <h2>function box (call through .value)</h2>
    <p>{greet.value('world')}</p>
</section>

<section>
    <h2>fastBoxedMap (SvelteMap)</h2>
    <p>scores size: {scores.value.size}</p>
    {#each scores.value as [name, score] (name)}
        <p>{name}: {score}</p>
    {/each}
    <button onclick={() => scores.value.set('cyd', 70)}>add cyd</button>
</section>

<section>
    <h2>fastBoxedSet (SvelteSet)</h2>
    <p>tags: {[...tags.value].join(', ')} (size: {tags.value.size})</p>
    <button onclick={() => tags.value.add(`tag-${tags.value.size}`)}>add tag</button>
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
    <button onclick={() => clonable.value.count++}>count++</button>
    <button onclick={() => (cloned = clonable.clone())}>clone()</button>
    {#if cloned}
        <p>clone (plain, non-reactive): {JSON.stringify(cloned)}</p>
    {/if}
</section>

<section>
    <h2><code>fastbox.const()</code> reactive read-only view</h2>
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

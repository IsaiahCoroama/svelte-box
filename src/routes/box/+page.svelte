<script lang="ts">
    import { Box, box, boxedMap, boxedSet } from '$lib/index.js';

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

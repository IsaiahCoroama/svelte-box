<script lang="ts">
    import { resolve } from '$app/paths';
</script>

<h1>svelte-box playground</h1>

<p>Five live demos. Each page focuses on one container so the behavior is easy to read.</p>

<section>
    <h2><a href={resolve('/box')}>/box</a></h2>
    <p>
        Proxy-backed. Transparent property forwarding (<code>box.foo</code> reads the inner object),
        callable when wrapping a function, <code>instanceof Box</code> through subclasses. Bottom
        of the page shows <code>freeze</code>, <code>clone</code>, <code>const()</code>, and
        <code>isBox</code>.
    </p>
</section>

<section>
    <h2><a href={resolve('/fastbox')}>/fastbox</a></h2>
    <p>
        Plain class, no proxy. Same <code>.value</code> reactivity, same helpers and type guards.
        Faster to construct, no transparent forwarding. Reach inner properties through
        <code>.value</code>.
    </p>
</section>

<section>
    <h2><a href={resolve('/const')}>/const</a></h2>
    <p>
        Read-only views. <code>ConstBox</code> and <code>ConstFastBox</code> in both
        <em>capture</em> mode (independent snapshot) and <em>borrow</em> mode (shared live state
        with the source). Side-by-side mutation makes the difference visible.
    </p>
</section>

<section>
    <h2><a href={resolve('/lazy')}>/lazy</a></h2>
    <p>
        Deferred-loader cell. The loader runs on the first <code>prefetch()</code>; later calls
        return the cached promise until <code>reset()</code> clears it. The demo counts loader
        invocations so the cache behavior is verifiable.
    </p>
</section>

<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<h1>svelte-box playground</h1>

<p>Two reactive containers, same surface. Pick one to see it run.</p>

<section>
	<h2><a href={resolve('/box')}>/box</a></h2>
	<p>
		Proxy-backed. Transparent property forwarding (<code>box.foo</code> reads the inner object),
		callable when wrapping a function, <code>instanceof Box</code> through subclasses.
	</p>
</section>

<section>
	<h2><a href={resolve('/fastbox')}>/fastbox</a></h2>
	<p>
		Plain class, no proxy. Same <code>.value</code> reactivity, same helpers and type guards. Faster
		to construct, no transparent forwarding. Reach inner properties through
		<code>.value</code>.
	</p>
</section>

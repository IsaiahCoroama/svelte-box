<script lang="ts">
    import { page } from '$app/state';
    import { resolve } from '$app/paths';
    let { children } = $props();

    // `route.id` is the route pattern (`/box`, not the URL). Matching the
    // pattern itself catches the top-level page; the `startsWith` guard
    // keeps the link active for nested routes added later (e.g. `/box/[id]`).
    const matches = (prefix: string) => {
        const id = page.route.id;
        if (!id) return false;
        if (prefix === '/') return id === '/';
        return id === prefix || id.startsWith(`${prefix}/`);
    };
</script>

<header>
    <a href={resolve('/')} class:active={matches('/')}>home</a>
    <a href={resolve('/box')} class:active={matches('/box')}>box</a>
    <a href={resolve('/fastbox')} class:active={matches('/fastbox')}>fastbox</a>
</header>

<main>
    {@render children()}
</main>

<style>
    /*
	 * Dev-only playground styles. Not part of the published library surface.
	 * Scoping each `:global(...)` rule under `main` keeps these contained to
	 * the playground tree rather than leaking into anything else that might
	 * be served from this app.
	 */
    header {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e5e5e5;
        font-family: ui-sans-serif, system-ui, sans-serif;
    }
    header a {
        text-decoration: none;
        color: #444;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }
    header a.active {
        background: #111;
        color: #fff;
    }
    main {
        padding: 1.5rem;
        font-family: ui-sans-serif, system-ui, sans-serif;
        max-width: 720px;
    }
    main :global(section) {
        margin-block: 1rem 1.5rem;
        padding: 0.75rem 1rem;
        border: 1px solid #eee;
        border-radius: 6px;
    }
    main :global(section h2) {
        margin-top: 0;
        font-size: 1rem;
        color: #555;
    }
    main :global(button) {
        font: inherit;
        padding: 0.25rem 0.6rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fafafa;
        cursor: pointer;
    }
    main :global(input) {
        font: inherit;
        padding: 0.25rem 0.4rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
</style>

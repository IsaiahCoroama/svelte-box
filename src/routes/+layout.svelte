<script lang="ts">
    import { onMount } from 'svelte';
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

    // Theme state. SSR default is 'light' because the server cannot read
    // localStorage; the pre-paint script in app.html corrects the DOM
    // before paint, and onMount syncs the component state.
    let theme: 'light' | 'dark' = $state('light');
    let mounted = $state(false);

    onMount(() => {
        theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        mounted = true;
    });

    $effect(() => {
        if (!mounted) return;
        document.documentElement.dataset.theme = theme;

        try {
            localStorage.setItem('svelte-box-theme', theme);
        } catch {
            // localStorage throws in some privacy modes; the in-memory
            // state still tracks for the rest of the session.
        }
    });

    function toggle() {
        theme = theme === 'dark' ? 'light' : 'dark';
    }
</script>

<header>
    <a href={resolve('/')} class:active={matches('/')}>home</a>
    <a href={resolve('/box')} class:active={matches('/box')}>box</a>
    <a href={resolve('/fastbox')} class:active={matches('/fastbox')}>fastbox</a>
    <a href={resolve('/const')} class:active={matches('/const')}>const</a>
    <a href={resolve('/lazy')} class:active={matches('/lazy')}>lazy</a>
    <button
        class="theme-toggle"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onclick={toggle}
    >
        {#if theme === 'dark'}
            <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="4" />
                <path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                />
            </svg>
        {:else}
            <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
        {/if}
    </button>
</header>

<main>
    {@render children()}
</main>

<style>
    /*
     * Dev-only playground styles. Not part of the published library surface.
     * Variables live at :global(:root) so per-page styles can also consume
     * them. Light is the default; dark overrides via data-theme on <html>,
     * which the app.html bootstrap and the toggle below keep in sync.
     */
    :global(:root) {
        --bg: #ffffff;
        --fg: #111111;
        --muted: #555555;
        --border: #e5e5e5;
        --border-soft: #eeeeee;
        --surface: #fafafa;
        --accent-bg: #111111;
        --accent-fg: #ffffff;
        --input-bg: #ffffff;
        --input-border: #cccccc;
        --error: #b00020;
        --shadow: rgba(0, 0, 0, 0.08);
    }
    :global(:root[data-theme='dark']) {
        --bg: #0f0f10;
        --fg: #ececec;
        --muted: #a0a0a0;
        --border: #2a2a2c;
        --border-soft: #1f1f21;
        --surface: #18181a;
        --accent-bg: #ececec;
        --accent-fg: #0f0f10;
        --input-bg: #1c1c1e;
        --input-border: #3a3a3c;
        --error: #ff7a8a;
        --shadow: rgba(0, 0, 0, 0.5);
    }
    :global(html, body) {
        background: var(--bg);
        color: var(--fg);
    }
    :global(body) {
        margin: 0;
    }
    header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
        font-family: ui-sans-serif, system-ui, sans-serif;
    }
    header a {
        text-decoration: none;
        color: var(--fg);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }
    header a.active {
        background: var(--accent-bg);
        color: var(--accent-fg);
    }
    .theme-toggle {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.3rem 0.5rem;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--fg);
        border-radius: 4px;
        cursor: pointer;
    }
    .theme-toggle:hover {
        background: var(--border-soft);
    }
    .theme-toggle svg {
        display: block;
    }
    main {
        padding: 1.5rem;
        font-family: ui-sans-serif, system-ui, sans-serif;
        max-width: 720px;
        color: var(--fg);
    }
    main :global(a) {
        color: var(--fg);
    }
    main :global(section) {
        margin-block: 1rem 1.5rem;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-soft);
        border-radius: 6px;
        background: var(--bg);
    }
    main :global(section h2) {
        margin-top: 0;
        font-size: 1rem;
        color: var(--muted);
    }
    main :global(button) {
        font: inherit;
        padding: 0.25rem 0.6rem;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        background: var(--surface);
        color: var(--fg);
        cursor: pointer;
    }
    main :global(button:hover) {
        background: var(--border-soft);
    }
    main :global(input) {
        font: inherit;
        padding: 0.25rem 0.4rem;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        background: var(--input-bg);
        color: var(--fg);
    }
    main :global(code) {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        background: var(--surface);
        padding: 0.05rem 0.3rem;
        border-radius: 3px;
    }
</style>

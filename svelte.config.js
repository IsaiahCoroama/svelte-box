import adapter from '@sveltejs/adapter-static';

// `BASE_PATH` is read at build time. The Pages workflow sets it to
// `/<repo-name>` so prerendered HTML references assets from the right
// subpath. The value is baked into `build/` once and not consulted again,
// so `npm run preview` works without re-setting it after a Pages-style
// build. Local `npm run dev` and `npm run build` default to '' (root).
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			strict: true
		}),
		paths: { base }
	}
};

export default config;

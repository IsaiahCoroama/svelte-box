// The playground is a fully static site, served from GitHub Pages. Mark
// the whole tree as prerendered so adapter-static emits one HTML file per
// route and there is no runtime server.
export const prerender = true;

// `trailingSlash: 'always'` keeps URLs like `/box/` consistent with the
// `build/box/index.html` files adapter-static emits, which is the form
// GitHub Pages serves cleanly without redirects.
export const trailingSlash = 'always';

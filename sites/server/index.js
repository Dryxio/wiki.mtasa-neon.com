function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    if (!env.ASSETS) {
      return new Response("Static assets are unavailable.", { status: 500 });
    }

    const url = new URL(request.url);
    const original = await env.ASSETS.fetch(request);
    if (original.status !== 404 || !["GET", "HEAD"].includes(request.method)) {
      return original;
    }

    if (!url.pathname.endsWith("/") && !url.pathname.split("/").at(-1).includes(".")) {
      const directoryIndex = await env.ASSETS.fetch(assetRequest(request, `${url.pathname}/index.html`));
      if (directoryIndex.status !== 404) {
        return directoryIndex;
      }
    }

    return env.ASSETS.fetch(assetRequest(request, "/404.html"));
  },
};

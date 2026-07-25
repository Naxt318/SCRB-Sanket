// Vercel serverless function: forwards every /api/* request to the
// actual API server (artifacts/api-server), which is deployed separately
// since it's a persistent Express process, not a serverless function.
//
// Set the API_ORIGIN environment variable in the Vercel project settings
// to the base URL of that deployment, e.g. https://scrb-api.onrender.com
// (no trailing slash, no "/api" suffix).
//
// This keeps the frontend code unchanged — it still calls relative
// "/api/..." URLs, and Vercel transparently proxies them here.



const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'host',
  'content-length',
  'transfer-encoding',
  'keep-alive',
  'upgrade',
]);

export default async function handler(req: Request): Promise<Response> {
  const apiOrigin = process.env.API_ORIGIN;

  if (!apiOrigin) {
    return new Response(
      JSON.stringify({
        error:
          'API_ORIGIN environment variable is not set on this Vercel project. ' +
          'Deploy artifacts/api-server somewhere (Render, Railway, Fly.io, etc.) ' +
          'and set API_ORIGIN to its base URL.',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }

  const incomingUrl = new URL(req.url);
  const target = new URL(incomingUrl.pathname + incomingUrl.search, apiOrigin);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: 'manual',
  };

  const upstream = await fetch(target.toString(), init);

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

import { createRoot } from 'react-dom/client';
import { setLocalHandler } from '@workspace/api-client-react';

import App from './App';
import { localApiHandler } from './local-api/router';

import './index.css';

// Static deployments use the in-browser synthetic API. Full-stack deployments
// can opt into the Express backend with VITE_API_MODE=server.
if (import.meta.env.VITE_API_MODE !== 'server') {
  setLocalHandler(localApiHandler);

  // Several advanced screens use the native Fetch API directly. Route those
  // same-origin API calls through the local engine as well so every module is
  // functional on a static host.
  const networkFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const request = input instanceof Request ? input : null;
    const url = new URL(request?.url ?? String(input), window.location.origin);

    if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
      const method = (init.method ?? request?.method ?? 'GET').toUpperCase();
      const body = init.body ?? (request ? await request.clone().text() : undefined);
      const result = await localApiHandler(`${url.pathname}${url.search}`, { ...init, body, method });

      if (result) {
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      return new Response(JSON.stringify({ error: 'API route not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    return networkFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(<App />);

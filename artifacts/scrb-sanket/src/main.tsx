import { createRoot } from 'react-dom/client';
import { setLocalHandler } from '@workspace/api-client-react';

import App from './App';
import { localApiHandler } from './local-api/router';

import './index.css';

// Static deployments use the in-browser synthetic API. Full-stack deployments
// can opt into the Express backend with VITE_API_MODE=server.
if (import.meta.env.VITE_API_MODE !== 'server') {
  setLocalHandler(localApiHandler);
}

createRoot(document.getElementById('root')!).render(<App />);

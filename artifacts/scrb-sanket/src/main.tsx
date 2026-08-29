import { createRoot } from 'react-dom/client';
import { setLocalHandler } from '@workspace/api-client-react';

import App from './App';
import { localApiHandler } from './local-api/router';

import './index.css';

// Backend server connected: "/api/*" calls are proxied to Express backend.
// setLocalHandler(localApiHandler);

createRoot(document.getElementById('root')!).render(<App />);

import { createRoot } from 'react-dom/client';
import { setLocalHandler } from '@workspace/api-client-react';

import App from './App';
import { localApiHandler } from './local-api/router';

import './index.css';

// No backend server: every "/api/*" call is answered right here in the
// browser (see src/local-api/). Works on Firebase's free Spark plan.
setLocalHandler(localApiHandler);

createRoot(document.getElementById('root')!).render(<App />);

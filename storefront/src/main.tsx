import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// GoogleOAuthProvider (and the third-party script it injects) is NOT mounted
// here — it must not load for every visitor on every page before any consent
// decision. It's mounted locally in Login.tsx, only once cookie consent has
// been accepted. See src/lib/cookieConsent.ts.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

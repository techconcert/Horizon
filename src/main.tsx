/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cross-domain data migration & cloud sync listener:
// If opened with #sync=HZ-XXXX and/or #migrate=<payload>, restore records seamlessly
try {
  const hash = window.location.hash;
  if (hash && hash.length > 1) {
    const hashContent = hash.startsWith('#') ? hash.substring(1) : hash;
    const params = new URLSearchParams(hashContent);

    const syncCode = params.get('sync');
    if (syncCode) {
      localStorage.setItem('horizon_sync_code', syncCode.toUpperCase());
    }

    const rawData = params.get('migrate');
    if (rawData) {
      const decodedJson = decodeURIComponent(escape(atob(decodeURIComponent(rawData))));
      const payload = JSON.parse(decodedJson);
      if (typeof payload === 'object' && payload !== null) {
        Object.keys(payload).forEach((k) => {
          const val = payload[k];
          if (val !== null && val !== undefined) {
            localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
          }
        });
        localStorage.setItem('onboarded', 'true');
        sessionStorage.setItem('horizon_migrated_success', 'true');
        window.history.replaceState(null, '', window.location.pathname);
      }
    } else if (hash.startsWith('#migrate=')) {
      const legacyRaw = hash.substring(9);
      if (legacyRaw) {
        const decodedJson = decodeURIComponent(escape(atob(decodeURIComponent(legacyRaw))));
        const payload = JSON.parse(decodedJson);
        if (typeof payload === 'object' && payload !== null) {
          Object.keys(payload).forEach((k) => {
            const val = payload[k];
            if (val !== null && val !== undefined) {
              localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
            }
          });
          localStorage.setItem('onboarded', 'true');
          sessionStorage.setItem('horizon_migrated_success', 'true');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    }
  }
} catch (err) {
  console.error('[Horizon] Migration import error:', err);
}

// Register PWA Service Worker with active update polling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Horizon Service Worker registered successfully:', reg.scope);
        // Prompt immediate check for updated worker
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.error('Horizon Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


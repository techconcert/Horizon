/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { APP_VERSION, checkAndEnforceAppVersion } from './utils/versionCheck.ts';

// Enforce version-based cache clear immediately on bootstrap
checkAndEnforceAppVersion();

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

// PWA Service Worker management:
// In development mode, unregister any service workers to ensure live HMR/edits are always visible.
// In production, register with version query parameter so every version bump is treated as an update.
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        reg.unregister();
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`/sw.js?v=${APP_VERSION}`)
        .then((reg) => {
          console.log('Horizon Service Worker registered successfully:', reg.scope);
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.error('Horizon Service Worker registration failed:', err);
        });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const APP_VERSION = '2.2.2';
const STORAGE_KEY = 'horizon_app_version';

/**
 * Force clears all CacheStorage caches, unregisters service workers,
 * and reloads the application.
 */
export async function forceClearCacheAndReload() {
  console.log('[Horizon] Force clearing all caches and service workers...');

  // 1. Delete all CacheStorage entries
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      console.log('[Horizon] Successfully deleted caches:', keys);
    } catch (err) {
      console.warn('[Horizon] Failed to clear CacheStorage:', err);
    }
  }

  // 2. Unregister all service workers and post purge message
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        reg.active?.postMessage({ type: 'PURGE_CACHE', version: APP_VERSION });
        await reg.unregister();
      }
      console.log('[Horizon] Successfully unregistered service workers');
    } catch (err) {
      console.warn('[Horizon] Failed to unregister service workers:', err);
    }
  }

  // 3. Mark current version in localStorage
  localStorage.setItem(STORAGE_KEY, APP_VERSION);
  localStorage.setItem('horizon_last_cache_clear', Date.now().toString());

  // 4. Force reload with cache busting query parameter
  const url = new URL(window.location.href);
  url.searchParams.set('v_sync', Date.now().toString());
  window.location.replace(url.toString());
}

/**
 * Checks if the stored version differs from the current APP_VERSION.
 * If a mismatch is detected, force-clears all cache and triggers reload.
 */
export function checkAndEnforceAppVersion() {
  try {
    const storedVersion = localStorage.getItem(STORAGE_KEY);

    // If there is no stored version or if the version does not match current APP_VERSION
    if (!storedVersion || storedVersion !== APP_VERSION) {
      console.log(`[Horizon] Version mismatch detected (Stored: ${storedVersion}, Current: ${APP_VERSION}). Triggering cache purge...`);
      localStorage.setItem(STORAGE_KEY, APP_VERSION);

      // Wipe caches immediately
      if ('caches' in window) {
        caches.keys().then((names) => {
          Promise.all(names.map((n) => caches.delete(n))).catch(() => {});
        }).catch(() => {});
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          Promise.all(regs.map((r) => {
            r.active?.postMessage({ type: 'PURGE_CACHE', version: APP_VERSION });
            return r.unregister();
          })).catch(() => {});
        }).catch(() => {});
      }

      // If an older version was stored, reload to guarantee latest assets are fetched
      if (storedVersion && storedVersion !== APP_VERSION) {
        console.log('[Horizon] Upgrading from older version, reloading page...');
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }
    }
  } catch (err) {
    console.error('[Horizon] Error enforcing app version:', err);
  }
}

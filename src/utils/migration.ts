/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Utility for exporting and generating cross-domain migration URLs
 * between the Cloud Run endpoint (horizon-606495187151.us-west2.run.app)
 * and the new official custom domain (horizon-barrmy.ai.studio).
 */

import { getOrCreateSyncCode, exportLocalStateToCloudPayload, saveToCloud } from '../services/cloudSync';

const STORAGE_KEYS = [
  'sobrietyStartDate',
  'reflections',
  'activeTab',
  'currentLessonId',
  'lastSoberCheckInTime',
  'soberCheckedInToday',
  'biometricLock',
  'language',
  'syncEnabled',
  'customMoods',
  'steps',
  'supportNumber',
  'sponsorName',
  'sponsorNumber',
  'supportLink',
  'onboarded',
  'aiUsage',
  'horizon_sync_code'
];

export function hasUserUserData(): boolean {
  return !!(
    localStorage.getItem('sobrietyStartDate') ||
    localStorage.getItem('reflections') ||
    localStorage.getItem('onboarded')
  );
}

export function buildMigrationPayload(): string {
  const payload: Record<string, string> = {};
  for (const key of STORAGE_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null && val !== undefined) {
      payload[key] = val;
    }
  }
  // Guarantee onboarded is set to 'true' if user has recovery data
  if (payload.sobrietyStartDate || payload.reflections || payload.steps) {
    payload['onboarded'] = 'true';
  }
  const jsonStr = JSON.stringify(payload);
  return encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
}

export function getMigrationTargetUrl(): string {
  const code = getOrCreateSyncCode();
  // Auto-backup to Firestore cloud before navigating
  const cloudData = exportLocalStateToCloudPayload();
  saveToCloud(code, cloudData).catch(() => {});

  const encoded = buildMigrationPayload();
  return `https://horizon-barrmy.ai.studio/#sync=${code}&migrate=${encoded}`;
}

export function isOldDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  // If running on the old Cloud Run host or any non-preview run.app domain
  const isRunApp = host.includes('run.app') && !host.startsWith('ais-dev-') && !host.startsWith('ais-pre-');
  const isOldSpecific = host.includes('606495187151') || host.includes('zhmbvvb3xq');
  return isRunApp || isOldSpecific;
}

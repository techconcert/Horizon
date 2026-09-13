/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { db } from '../lib/firebase';
import LZString from 'lz-string';
import { compactSteps } from '../utils/stepCompactor';
import { APP_VERSION } from '../utils/versionCheck';

const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 chars without 0/O, 1/I ambiguity
const QUOTA_KEY = 'horizon_cloud_quota_exceeded_until';
const LAST_PAYLOAD_HASH_KEY = 'horizon_last_saved_payload_hash';
const LAST_WRITE_TIME_KEY = 'horizon_last_cloud_write_timestamp';

// Enforce minimum 45 seconds between automated background cloud writes to conserve 20,000 writes/day free tier quota
const MIN_AUTO_SYNC_INTERVAL_MS = 45 * 1000;

export function isCloudQuotaExceeded(): boolean {
  if (typeof window === 'undefined') return false;
  const until = localStorage.getItem(QUOTA_KEY);
  if (!until) return false;
  const untilTime = parseInt(until, 10);
  if (isNaN(untilTime)) return false;
  if (Date.now() < untilTime) {
    return true;
  }
  localStorage.removeItem(QUOTA_KEY);
  return false;
}

export function setCloudQuotaExceededCooldown(durationMs: number = 60 * 60 * 1000): void {
  if (typeof window === 'undefined') return;
  const until = Date.now() + durationMs;
  localStorage.setItem(QUOTA_KEY, until.toString());
}

/**
 * Detects client origin environment to distinguish AI Studio developer testing
 * from preview and real user sessions.
 */
export const detectClientOrigin = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  const hostname = window.location.hostname;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (hostname.startsWith('ais-dev-') || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'ai_studio_dev';
  }
  if (hostname.startsWith('ais-pre-')) {
    return 'ai_studio_preview';
  }
  if (isStandalone) {
    return 'standalone_pwa';
  }
  if (
    hostname.endsWith('.run.app') ||
    hostname.endsWith('.web.app') ||
    hostname.endsWith('.firebaseapp.com') ||
    hostname !== ''
  ) {
    return `web_${hostname}`;
  }
  return 'web_unknown';
};

export function normalizeSyncCode(input: string): string {
  if (!input) return '';
  let cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned.startsWith('HZ')) {
    cleaned = 'HZ' + cleaned;
  }
  if (cleaned.length > 2 && !cleaned.includes('-')) {
    cleaned = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
  }
  return cleaned;
}

export function getOrCreateSyncCode(): string {
  if (typeof window === 'undefined') return 'HZ-0000';
  let saved = localStorage.getItem('horizon_sync_code');
  if (saved) {
    return normalizeSyncCode(saved);
  }

  // Generate 4-character random suffix
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    suffix += CODE_CHARS[randomIndex];
  }
  const newCode = `HZ-${suffix}`;
  localStorage.setItem('horizon_sync_code', newCode);
  return newCode;
}

export function setLocalSyncCode(code: string): void {
  const normalized = normalizeSyncCode(code);
  if (normalized) {
    localStorage.setItem('horizon_sync_code', normalized);
  }
}

export interface CloudPayload {
  sobrietyStartDate?: string;
  reflections?: any[];
  steps?: any[];
  customMoods?: string[];
  language?: string;
  supportNumber?: string;
  sponsorName?: string;
  sponsorNumber?: string;
  supportLink?: string;
  lastSoberCheckInTime?: string;
  brotherhoods?: any[];
  dailyActivities?: any;
  onboarded?: boolean;
}

export interface SaveToCloudResult {
  success: boolean;
  error?: string;
  quotaExceeded?: boolean;
  unchanged?: boolean;
  throttled?: boolean;
  bytesSaved?: number;
}

/**
 * Strips empty/undefined properties to minimize payload footprint before serialization.
 */
function pruneEmptyPayloadFields(payload: CloudPayload): CloudPayload {
  const clean: CloudPayload = {};
  if (payload.sobrietyStartDate) clean.sobrietyStartDate = payload.sobrietyStartDate;
  if (Array.isArray(payload.reflections) && payload.reflections.length > 0) clean.reflections = payload.reflections;
  if (Array.isArray(payload.steps) && payload.steps.length > 0) {
    clean.steps = compactSteps(payload.steps);
  }
  if (Array.isArray(payload.customMoods) && payload.customMoods.length > 0) clean.customMoods = payload.customMoods;
  if (payload.language) clean.language = payload.language;
  if (payload.supportNumber) clean.supportNumber = payload.supportNumber;
  if (payload.sponsorName) clean.sponsorName = payload.sponsorName;
  if (payload.sponsorNumber) clean.sponsorNumber = payload.sponsorNumber;
  if (payload.supportLink) clean.supportLink = payload.supportLink;
  if (payload.lastSoberCheckInTime) clean.lastSoberCheckInTime = payload.lastSoberCheckInTime;
  if (Array.isArray(payload.brotherhoods) && payload.brotherhoods.length > 0) clean.brotherhoods = payload.brotherhoods;
  if (payload.dailyActivities && typeof payload.dailyActivities === 'object' && Object.keys(payload.dailyActivities).length > 0) {
    clean.dailyActivities = payload.dailyActivities;
  }
  if (payload.onboarded) clean.onboarded = true;
  return clean;
}

export async function saveToCloud(
  syncCode: string,
  data: CloudPayload,
  isExplicitUserAction: boolean = false
): Promise<SaveToCloudResult> {
  try {
    const normalized = normalizeSyncCode(syncCode);
    if (!normalized || normalized.length < 5) {
      return { success: false, error: 'Invalid sync code' };
    }

    // 1. Quota Circuit Breaker: Do not hammer Firestore if quota limit was previously reported
    if (isCloudQuotaExceeded()) {
      return {
        success: false,
        error: 'Cloud backup quota reached for today. Your recovery data is safely saved on this device.',
        quotaExceeded: true,
      };
    }

    // 2. Prune and Compact payload: Strips 1.1MB of static lesson text down to sub-kilobyte progress
    const cleanPayload = pruneEmptyPayloadFields(data);
    const uncompressedStr = JSON.stringify(cleanPayload);

    // 3. Skip saving entirely if payload is completely empty (no data entered yet)
    const hasMeaningfulData =
      cleanPayload.sobrietyStartDate ||
      (cleanPayload.reflections && cleanPayload.reflections.length > 0) ||
      (cleanPayload.brotherhoods && cleanPayload.brotherhoods.length > 0) ||
      (cleanPayload.steps && cleanPayload.steps.length > 0) ||
      cleanPayload.lastSoberCheckInTime;

    if (!hasMeaningfulData) {
      return { success: true, unchanged: true };
    }

    // 4. Deduplication: Skip write if recovery state is 100% identical to last successful sync
    if (typeof window !== 'undefined') {
      const lastPayloadStr = localStorage.getItem(LAST_PAYLOAD_HASH_KEY);
      if (lastPayloadStr === uncompressedStr) {
        return { success: true, unchanged: true };
      }

      // 5. Throttling for automated background sync to protect the 20,000 writes/day free tier quota
      if (!isExplicitUserAction) {
        const lastWriteTimeStr = localStorage.getItem(LAST_WRITE_TIME_KEY);
        if (lastWriteTimeStr) {
          const lastWriteTime = parseInt(lastWriteTimeStr, 10);
          if (!isNaN(lastWriteTime) && Date.now() - lastWriteTime < MIN_AUTO_SYNC_INTERVAL_MS) {
            return { success: true, throttled: true };
          }
        }
      }
    }

    // 6. High-Efficiency Compression: Compress stringified JSON with LZString Base64
    const compressedStr = LZString.compressToBase64(uncompressedStr);
    const rawBytes = uncompressedStr.length;
    const compressedBytes = compressedStr.length;

    const docRef = doc(db, 'sync_backups', normalized);
    const docData: Record<string, any> = {
      syncCode: normalized,
      compressed: true,
      cdata: compressedStr,
      rawBytes,
      compressedBytes,
      updatedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      origin: detectClientOrigin(),
      version: 2,
    };

    await setDoc(docRef, docData);

    if (typeof window !== 'undefined') {
      const nowIso = new Date().toISOString();
      localStorage.setItem('horizon_last_cloud_sync', nowIso);
      localStorage.setItem(LAST_WRITE_TIME_KEY, Date.now().toString());
      localStorage.setItem('horizon_sync_code', normalized);
      localStorage.setItem(LAST_PAYLOAD_HASH_KEY, uncompressedStr);
    }

    return {
      success: true,
      bytesSaved: Math.max(0, rawBytes - compressedBytes),
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const errCode = err?.code || '';
    const isQuota =
      errCode === 'resource-exhausted' ||
      errMsg.includes('resource-exhausted') ||
      errMsg.includes('Quota limit exceeded') ||
      errMsg.includes('Quota exceeded');

    if (isQuota) {
      setCloudQuotaExceededCooldown(60 * 60 * 1000); // 1-hour cooldown
      console.warn('[CloudSync] Firestore daily write quota limit reached. Switched to local offline storage.');
      return {
        success: false,
        error: 'Cloud backup quota reached for today. Your recovery data is safely saved on this device.',
        quotaExceeded: true,
      };
    }

    console.warn('[CloudSync] saveToCloud error:', errMsg);
    return { success: false, error: errMsg || 'Failed to save to cloud' };
  }
}

export async function restoreFromCloud(
  syncCode: string
): Promise<{
  success: boolean;
  data?: CloudPayload;
  error?: string;
  rawBytes?: number;
  compressedBytes?: number;
}> {
  try {
    const normalized = normalizeSyncCode(syncCode);
    if (!normalized || normalized.length < 5) {
      return { success: false, error: 'Invalid sync code format. Example: HZ-9K2P' };
    }

    const docRef = doc(db, 'sync_backups', normalized);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, error: 'Sync code not found. Please check and try again.' };
    }

    const docData = snap.data();
    if (!docData) {
      return { success: false, error: 'No data stored under this sync code.' };
    }

    let payload: CloudPayload;

    // Handle compressed v2 backups
    if (docData.compressed && typeof docData.cdata === 'string') {
      const decompressed = LZString.decompressFromBase64(docData.cdata);
      if (!decompressed) {
        return { success: false, error: 'Failed to decompress backup payload from cloud.' };
      }
      payload = JSON.parse(decompressed);
    } else if (docData.data) {
      // Backward-compatible fallback for legacy v1 uncompressed backups
      payload = docData.data as CloudPayload;
    } else {
      return { success: false, error: 'No valid recovery data found for this sync code.' };
    }

    return {
      success: true,
      data: payload,
      rawBytes: docData.rawBytes,
      compressedBytes: docData.compressedBytes,
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn('[CloudSync] restoreFromCloud error:', errMsg);
    return { success: false, error: errMsg || 'Failed to retrieve data from cloud' };
  }
}

export function exportLocalStateToCloudPayload(): CloudPayload {
  const payload: CloudPayload = {};
  if (typeof window === 'undefined') return payload;

  const date = localStorage.getItem('sobrietyStartDate');
  if (date) payload.sobrietyStartDate = date;

  const reflections = localStorage.getItem('reflections');
  if (reflections) {
    try {
      const parsed = JSON.parse(reflections);
      if (Array.isArray(parsed) && parsed.length > 0) {
        payload.reflections = parsed;
      }
    } catch {}
  }

  const steps = localStorage.getItem('steps');
  if (steps) {
    try {
      const parsed = JSON.parse(steps);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Always export compact step progress
        payload.steps = compactSteps(parsed);
      }
    } catch {}
  }

  const moods = localStorage.getItem('customMoods');
  if (moods) {
    try {
      const parsed = JSON.parse(moods);
      if (Array.isArray(parsed) && parsed.length > 0) {
        payload.customMoods = parsed;
      }
    } catch {}
  }

  const lang = localStorage.getItem('language');
  if (lang) payload.language = lang;

  const supNum = localStorage.getItem('supportNumber');
  if (supNum) payload.supportNumber = supNum;

  const spName = localStorage.getItem('sponsorName');
  if (spName) payload.sponsorName = spName;

  const spNum = localStorage.getItem('sponsorNumber');
  if (spNum) payload.sponsorNumber = spNum;

  const supLink = localStorage.getItem('supportLink');
  if (supLink) payload.supportLink = supLink;

  const checkIn = localStorage.getItem('lastSoberCheckInTime');
  if (checkIn) payload.lastSoberCheckInTime = checkIn;

  const brotherhoods = localStorage.getItem('brotherhoods');
  if (brotherhoods) {
    try {
      const parsed = JSON.parse(brotherhoods);
      if (Array.isArray(parsed) && parsed.length > 0) {
        payload.brotherhoods = parsed;
      }
    } catch {}
  }

  const dailyActivities = localStorage.getItem('dailyActivities');
  if (dailyActivities) {
    try {
      const parsed = JSON.parse(dailyActivities);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        payload.dailyActivities = parsed;
      }
    } catch {}
  }

  payload.onboarded = true;

  return payload;
}

export function writePayloadToLocalStorage(payload: CloudPayload, syncCode?: string): void {
  if (typeof window === 'undefined' || !payload) return;

  if (payload.sobrietyStartDate) {
    localStorage.setItem('sobrietyStartDate', payload.sobrietyStartDate);
  }
  if (payload.reflections) {
    localStorage.setItem('reflections', JSON.stringify(payload.reflections));
  }
  if (payload.steps) {
    // Save compact steps to localStorage to conserve browser storage as well
    localStorage.setItem('steps', JSON.stringify(compactSteps(payload.steps)));
  }
  if (payload.customMoods) {
    localStorage.setItem('customMoods', JSON.stringify(payload.customMoods));
  }
  if (payload.language) {
    localStorage.setItem('language', payload.language);
  }
  if (payload.supportNumber !== undefined) {
    localStorage.setItem('supportNumber', payload.supportNumber);
  }
  if (payload.sponsorName !== undefined) {
    localStorage.setItem('sponsorName', payload.sponsorName);
  }
  if (payload.sponsorNumber !== undefined) {
    localStorage.setItem('sponsorNumber', payload.sponsorNumber);
  }
  if (payload.supportLink !== undefined) {
    localStorage.setItem('supportLink', payload.supportLink);
  }
  if (payload.lastSoberCheckInTime) {
    localStorage.setItem('lastSoberCheckInTime', payload.lastSoberCheckInTime);
  }
  if (payload.brotherhoods) {
    localStorage.setItem('brotherhoods', JSON.stringify(payload.brotherhoods));
  }
  if (payload.dailyActivities) {
    localStorage.setItem('dailyActivities', JSON.stringify(payload.dailyActivities));
  }
  if (syncCode) {
    localStorage.setItem('horizon_sync_code', normalizeSyncCode(syncCode));
  }
  localStorage.setItem('onboarded', 'true');
}


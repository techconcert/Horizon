/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { db } from '../lib/firebase';

const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 chars without 0/O, 1/I ambiguity
const QUOTA_KEY = 'horizon_cloud_quota_exceeded_until';
const LAST_PAYLOAD_HASH_KEY = 'horizon_last_saved_payload_hash';

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
  onboarded?: boolean;
}

export interface SaveToCloudResult {
  success: boolean;
  error?: string;
  quotaExceeded?: boolean;
  unchanged?: boolean;
}

export async function saveToCloud(
  syncCode: string,
  data: CloudPayload
): Promise<SaveToCloudResult> {
  try {
    const normalized = normalizeSyncCode(syncCode);
    if (!normalized || normalized.length < 5) {
      return { success: false, error: 'Invalid sync code' };
    }

    // 1. Quota Circuit Breaker: Do not hammer Firestore if quota is reached
    if (isCloudQuotaExceeded()) {
      return {
        success: false,
        error: 'Cloud backup quota reached for today. Your recovery data is safely saved on this device.',
        quotaExceeded: true,
      };
    }

    // 2. Deduplication: Skip write if recovery state is identical to last successful sync
    const currentPayloadStr = JSON.stringify(data);
    if (typeof window !== 'undefined') {
      const lastPayloadStr = localStorage.getItem(LAST_PAYLOAD_HASH_KEY);
      if (lastPayloadStr === currentPayloadStr) {
        return { success: true, unchanged: true };
      }
    }

    const docRef = doc(db, 'sync_backups', normalized);
    const cleanData = {
      syncCode: normalized,
      data,
      updatedAt: new Date().toISOString(),
      version: 1
    };

    await setDoc(docRef, cleanData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('horizon_last_cloud_sync', new Date().toISOString());
      localStorage.setItem('horizon_sync_code', normalized);
      localStorage.setItem(LAST_PAYLOAD_HASH_KEY, currentPayloadStr);
    }
    return { success: true };
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
): Promise<{ success: boolean; data?: CloudPayload; error?: string }> {
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
    if (!docData || !docData.data) {
      return { success: false, error: 'No data stored under this sync code.' };
    }

    return { success: true, data: docData.data as CloudPayload };
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
      payload.reflections = JSON.parse(reflections);
    } catch {}
  }

  const steps = localStorage.getItem('steps');
  if (steps) {
    try {
      payload.steps = JSON.parse(steps);
    } catch {}
  }

  const moods = localStorage.getItem('customMoods');
  if (moods) {
    try {
      payload.customMoods = JSON.parse(moods);
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
    localStorage.setItem('steps', JSON.stringify(payload.steps));
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
  if (syncCode) {
    localStorage.setItem('horizon_sync_code', normalizeSyncCode(syncCode));
  }
  localStorage.setItem('onboarded', 'true');
}

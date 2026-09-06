import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 chars without 0/O, 1/I ambiguity

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

export async function saveToCloud(
  syncCode: string,
  data: CloudPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = normalizeSyncCode(syncCode);
    if (!normalized || normalized.length < 5) {
      return { success: false, error: 'Invalid sync code' };
    }

    const docRef = doc(db, 'sync_backups', normalized);
    const cleanData = {
      syncCode: normalized,
      data,
      updatedAt: new Date().toISOString(),
      version: 1
    };

    await setDoc(docRef, cleanData, { merge: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('horizon_last_cloud_sync', new Date().toISOString());
      localStorage.setItem('horizon_sync_code', normalized);
    }
    return { success: true };
  } catch (err: any) {
    console.error('[CloudSync] saveToCloud error:', err);
    return { success: false, error: err?.message || 'Failed to save to cloud' };
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
    console.error('[CloudSync] restoreFromCloud error:', err);
    return { success: false, error: err?.message || 'Failed to retrieve data from cloud' };
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

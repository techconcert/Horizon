/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore/lite';
import LZString from 'lz-string';
import { db } from '../lib/firebase';
import { CloudPayload } from '../services/cloudSync';
import {
  ShieldCheck,
  Search,
  Lock,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  Calendar,
  Users,
  Phone,
  Clock,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  X,
  FileText,
  CheckCircle2,
  HardDrive,
  Filter,
  Archive,
  ArchiveRestore,
  Trash2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export interface BackupRecord {
  syncCode: string;
  data: CloudPayload;
  updatedAt?: string;
  archivedAt?: string;
  archivedBy?: string;
  version?: number;
  origin?: string;
  appVersion?: string;
  compressed?: boolean;
  rawBytes?: number;
  compressedBytes?: number;
}

const ADMIN_TOKEN_KEY = 'hzadmin_session_token';
const ADMIN_EMAIL_KEY = 'hzadmin_saved_email';

function formatSobrietyDisplay(isoOrDateStr?: string): { formatted: string; daysAgo: number } | null {
  if (!isoOrDateStr) return null;
  const d = new Date(isoOrDateStr);
  if (isNaN(d.getTime())) return { formatted: isoOrDateStr, daysAgo: 0 };

  const formatted = d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return { formatted, daysAgo: daysAgo >= 0 ? daysAgo : 0 };
}

function extractFellowships(p: CloudPayload): string[] {
  const rawList = p.brotherhoods || (p as any).fellowships || [];
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item: any) => {
      if (typeof item === 'string') return item.trim();
      return (item?.brotherhood || item?.name || item?.fellowship || '').trim();
    })
    .filter(Boolean);
}

export const AdminConsoleView: React.FC = () => {
  const [token, setToken] = useState<string>(() => {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!sessionStorage.getItem(ADMIN_TOKEN_KEY);
  });

  const [inputEmail, setInputEmail] = useState<string>(() => {
    return localStorage.getItem(ADMIN_EMAIL_KEY) || 'cobaltmacawgames@gmail.com';
  });
  const [inputPasskey, setInputPasskey] = useState<string>('');
  const [showPasskey, setShowPasskey] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Table Data & Filter
  const [records, setRecords] = useState<BackupRecord[]>([]);
  const [legacyRecords, setLegacyRecords] = useState<BackupRecord[]>([]);
  const [archivedRecords, setArchivedRecords] = useState<BackupRecord[]>([]);
  const [collectionTab, setCollectionTab] = useState<'v2' | 'legacy' | 'archive'>('v2');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'PWA' | 'DEV' | 'WEB'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Administrative Action Status & Modals
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [actionLoadingCode, setActionLoadingCode] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<{ record: BackupRecord; fromArchive: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  // Inspection Modal State
  const [selectedRecord, setSelectedRecord] = useState<BackupRecord | null>(null);
  const [inspectTab, setInspectTab] = useState<'overview' | 'reflections' | 'steps' | 'json'>('overview');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputEmail.trim(),
          passkey: inputPasskey.trim()
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_EMAIL_KEY, inputEmail.trim());
      setToken(data.token);
      setIsAuthenticated(true);
      setInputPasskey('');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Check your network or credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken('');
    setIsAuthenticated(false);
    setRecords([]);
    setLegacyRecords([]);
    setArchivedRecords([]);
    setSelectedRecord(null);
  };

  const loadRecords = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      // 1. Primary authenticated server-side API request
      if (token) {
        const res = await fetch('/api/admin/records', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setRecords(Array.isArray(data.records) ? data.records : []);
            setLegacyRecords(Array.isArray(data.legacyRecords) ? data.legacyRecords : []);
            setArchivedRecords(Array.isArray(data.archivedRecords) ? data.archivedRecords : []);
            return;
          }
        } else if (res.status === 401) {
          handleLogout();
          setAuthError('Session expired. Please sign in again.');
          return;
        }
      }

      // 2. Direct Firestore fallback query
      const colRef = collection(db, 'sync_backups');
      const q = query(colRef, limit(500));
      const snap = await getDocs(q);

      const items: BackupRecord[] = [];
      const legacy: BackupRecord[] = [];
      snap.forEach((d) => {
        const raw = d.data();
        if (raw.cdata && typeof raw.cdata === 'string') {
          let payload: any = {};
          try {
            const decompressed = LZString.decompressFromBase64(raw.cdata);
            if (decompressed) {
              payload = JSON.parse(decompressed);
            }
          } catch (e) {
            console.error(`[AdminConsole] Failed to decompress record ${d.id}:`, e);
          }

          items.push({
            syncCode: raw.syncCode || d.id,
            data: payload,
            updatedAt: raw.updatedAt,
            version: raw.version || 2,
            origin: raw.origin || 'unknown',
            appVersion: raw.appVersion || 'unknown',
            compressed: true,
            rawBytes: raw.rawBytes || 0,
            compressedBytes: raw.compressedBytes || 0,
          });
        } else if (raw.data || raw.version === 1) {
          legacy.push({
            syncCode: raw.syncCode || d.id,
            data: raw.data || {},
            updatedAt: raw.updatedAt,
            version: 1,
            origin: raw.origin || 'legacy_v1',
            appVersion: raw.appVersion || 'legacy',
            compressed: false,
            rawBytes: JSON.stringify(raw.data || {}).length,
            compressedBytes: JSON.stringify(raw.data || {}).length,
          });
        }
      });

      const sortByTime = (a: BackupRecord, b: BackupRecord) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      };

      items.sort(sortByTime);
      legacy.sort(sortByTime);
      setRecords(items);
      setLegacyRecords(legacy);
    } catch (err: any) {
      console.error('[AdminConsole] Failed to query backups:', err);
      setFetchError(err?.message || 'Failed to load records from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRecords();
    }
  }, [isAuthenticated, token]);

  const handleArchiveRecord = async (syncCode: string) => {
    setActionLoadingCode(syncCode);
    try {
      const res = await fetch('/api/admin/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ syncCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to archive record.');
      }

      const target = records.find(r => r.syncCode === syncCode) || legacyRecords.find(r => r.syncCode === syncCode);
      if (target) {
        const archivedTarget: BackupRecord = {
          ...target,
          archivedAt: data.archivedAt || new Date().toISOString(),
          archivedBy: inputEmail,
        };
        setRecords(prev => prev.filter(r => r.syncCode !== syncCode));
        setLegacyRecords(prev => prev.filter(r => r.syncCode !== syncCode));
        setArchivedRecords(prev => [archivedTarget, ...prev]);
      }
      if (selectedRecord?.syncCode === syncCode) {
        setSelectedRecord(null);
      }
      setActionNotice({ type: 'success', text: `Record ${syncCode} safely moved to Archive Vault.` });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message || 'Error archiving record.' });
    } finally {
      setActionLoadingCode(null);
    }
  };

  const handleRestoreRecord = async (syncCode: string) => {
    setActionLoadingCode(syncCode);
    try {
      const res = await fetch('/api/admin/restore-archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ syncCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to restore record.');
      }

      const target = archivedRecords.find(r => r.syncCode === syncCode);
      if (target) {
        setArchivedRecords(prev => prev.filter(r => r.syncCode !== syncCode));
        if (target.version === 1 || !target.compressed) {
          setLegacyRecords(prev => [target, ...prev]);
        } else {
          setRecords(prev => [target, ...prev]);
        }
      }
      if (selectedRecord?.syncCode === syncCode) {
        setSelectedRecord(null);
      }
      setActionNotice({ type: 'success', text: `Record ${syncCode} restored to active backups.` });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message || 'Error restoring record.' });
    } finally {
      setActionLoadingCode(null);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    const { syncCode } = recordToDelete.record;
    const fromArchive = recordToDelete.fromArchive;

    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ syncCode, fromArchive }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to permanently delete record.');
      }

      setRecords(prev => prev.filter(r => r.syncCode !== syncCode));
      setLegacyRecords(prev => prev.filter(r => r.syncCode !== syncCode));
      setArchivedRecords(prev => prev.filter(r => r.syncCode !== syncCode));
      if (selectedRecord?.syncCode === syncCode) {
        setSelectedRecord(null);
      }
      setRecordToDelete(null);
      setActionNotice({
        type: 'success',
        text: `Record ${syncCode} permanently deleted from ${fromArchive ? 'Archive Vault' : 'database'}.`
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message || 'Error deleting record.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmPurgeArchive = async () => {
    setIsPurging(true);
    try {
      const res = await fetch('/api/admin/purge-archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to purge archive vault.');
      }

      const count = data.purgedCount || archivedRecords.length;
      setArchivedRecords([]);
      setShowPurgeModal(false);
      setActionNotice({
        type: 'success',
        text: `Successfully purged all ${count} records permanently from Archive Vault.`
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message || 'Error purging archives.' });
    } finally {
      setIsPurging(false);
    }
  };

  const copyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const returnToApp = () => {
    if (window.location.hash) {
      window.location.hash = '';
    }
    if (window.location.pathname.includes('hzadmin') || window.location.search.includes('hzadmin')) {
      window.location.href = '/';
    }
  };

  const currentDataset = useMemo(() => {
    if (collectionTab === 'legacy') return legacyRecords;
    if (collectionTab === 'archive') return archivedRecords;
    return records;
  }, [collectionTab, records, legacyRecords, archivedRecords]);

  // Filter across code, sobriety date, sponsor, fellowships, origin, and version
  const filteredRecords = useMemo(() => {
    let result = currentDataset;

    // Filter by Origin tab
    if (originFilter === 'PWA') {
      result = result.filter((r) => r.origin === 'standalone_pwa');
    } else if (originFilter === 'DEV') {
      result = result.filter((r) => r.origin?.includes('ai_studio') || r.origin?.includes('dev'));
    } else if (originFilter === 'WEB') {
      result = result.filter(
        (r) => r.origin?.startsWith('web_') || (r.origin && r.origin !== 'standalone_pwa' && !r.origin.includes('dev'))
      );
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) return result;

    return result.filter((rec) => {
      const p = rec.data || {};
      const codeMatch = (rec.syncCode || '').toLowerCase().includes(term);
      const dateMatch = (p.sobrietyStartDate || '').toLowerCase().includes(term);
      const sponsorMatch = `${p.sponsorName || ''} ${p.sponsorNumber || ''} ${p.supportNumber || ''}`.toLowerCase().includes(term);
      const fellowships = extractFellowships(p);
      const fellowshipMatch = fellowships.some((f) => f.toLowerCase().includes(term));
      const originMatch = (rec.origin || '').toLowerCase().includes(term);
      const versionMatch = (rec.appVersion || '').toLowerCase().includes(term);

      return codeMatch || dateMatch || sponsorMatch || fellowshipMatch || originMatch || versionMatch;
    });
  }, [currentDataset, searchTerm, originFilter]);

  // Aggregate Metrics for KPI Cards
  const stats = useMemo(() => {
    const total = records.length;
    let pwaCount = 0;
    let devCount = 0;
    let webCount = 0;
    let withSobriety = 0;
    let totalReflections = 0;
    let totalDaysLogged = 0;
    let totalRawBytes = 0;
    let totalCompressedBytes = 0;

    records.forEach((r) => {
      if (r.origin === 'standalone_pwa') pwaCount++;
      else if (r.origin?.includes('ai_studio') || r.origin?.includes('dev')) devCount++;
      else webCount++;

      const p = r.data || {};
      if (p.sobrietyStartDate) withSobriety++;
      if (Array.isArray(p.reflections)) totalReflections += p.reflections.length;
      if (p.dailyActivities && typeof p.dailyActivities === 'object') {
        totalDaysLogged += Object.keys(p.dailyActivities).length;
      }
      if (r.rawBytes) totalRawBytes += r.rawBytes;
      if (r.compressedBytes) totalCompressedBytes += r.compressedBytes;
    });

    const avgCompressionSaved =
      totalRawBytes > 0
        ? Math.round((1 - totalCompressedBytes / totalRawBytes) * 100)
        : 0;

    return {
      total,
      pwaCount,
      devCount,
      webCount,
      withSobriety,
      totalReflections,
      totalDaysLogged,
      avgCompressionSaved,
      totalRawKb: (totalRawBytes / 1024).toFixed(1),
      totalCompressedKb: (totalCompressedBytes / 1024).toFixed(1),
    };
  }, [records]);

  // -------------------------------------------------------------
  // VIEW: Authentication Gate
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#111613] text-[#F8F5F2] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#18201a] border border-[#2d3b31] rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#2d3b31] pb-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#26352a] flex items-center justify-center text-[#4ade80]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-serif text-base text-white">Horizon Records</h1>
                <p className="font-mono text-[10px] text-white/50">Admin Console</p>
              </div>
            </div>
            <button
              type="button"
              onClick={returnToApp}
              className="text-white/40 hover:text-white p-1 rounded text-xs transition-colors"
              title="Return to App"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-white/60 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                placeholder="cobaltmacawgames@gmail.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full bg-[#111613] border border-[#2d3b31] focus:border-[#4ade80] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-white/60">
                  Security Passkey
                </label>
                <span className="text-[9px] text-white/40 font-mono flex items-center gap-1">
                  <KeyRound className="w-2.5 h-2.5" /> Passkey Required
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPasskey ? 'text' : 'password'}
                  required
                  placeholder="Enter admin passkey"
                  value={inputPasskey}
                  onChange={(e) => setInputPasskey(e.target.value)}
                  className="w-full bg-[#111613] border border-[#2d3b31] focus:border-[#4ade80] rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder-white/20 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-0.5 cursor-pointer"
                  title={showPasskey ? 'Hide passkey' : 'Show passkey'}
                >
                  {showPasskey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-white/40 mt-1.5 leading-relaxed">
                Protected by server-side rate limiting and HMAC-SHA256 tokens.
              </p>
            </div>

            {authError && (
              <div className="p-2.5 bg-red-950/50 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-snug">{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-2.5 px-4 bg-[#3e6355] hover:bg-[#487363] disabled:opacity-50 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Main Admin Console (New Compressed Schema Only)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0e1310] text-[#e8e6e3] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#141b16]/95 backdrop-blur-sm border-b border-[#233026] px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#212c24] flex items-center justify-center text-[#4ade80] border border-[#3e6355]/30 shadow-sm">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base text-white tracking-wide">Horizon Admin Console</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                v2.4.3 Secure Archive & Delete
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-mono">
              Signed in as {inputEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadRecords}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#1a231d] hover:bg-[#233027] border border-[#2e3e32] text-xs text-white/80 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={returnToApp}
            className="px-3 py-1.5 bg-[#1a231d] hover:bg-[#233027] border border-[#2e3e32] text-xs text-white/80 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to App</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-4">
        {/* Action Notice Toast */}
        {actionNotice && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between border transition-all ${
              actionNotice.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-200'
                : actionNotice.type === 'error'
                ? 'bg-red-950/60 border-red-800/60 text-red-200'
                : 'bg-sky-950/60 border-sky-800/60 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : actionNotice.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <span>{actionNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-white/40 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#141b16] border border-[#233026] rounded-xl p-3.5 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Active Backups</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-white">{records.length}</span>
              <span className="text-[11px] text-emerald-400 font-mono">v2</span>
            </div>
            <span className="text-[10px] text-white/40 mt-1">Compressed LZString</span>
          </div>

          <div className="bg-[#141b16] border border-[#233026] rounded-xl p-3.5 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Legacy / Archive</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-amber-300">{legacyRecords.length}</span>
              <span className="text-[11px] text-purple-300 font-mono">v1 • {archivedRecords.length} vault</span>
            </div>
            <span className="text-[10px] text-white/40 mt-1">Safely manageable records</span>
          </div>

          <div className="bg-[#141b16] border border-[#233026] rounded-xl p-3.5 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Sobriety Tracked</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-amber-300">{stats.withSobriety}</span>
              <span className="text-[11px] text-white/60 font-mono">accounts</span>
            </div>
            <span className="text-[10px] text-white/40 mt-1">{stats.totalDaysLogged} check-ins logged</span>
          </div>

          <div className="bg-[#141b16] border border-[#233026] rounded-xl p-3.5 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Compression Saved</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-purple-300">
                {stats.avgCompressionSaved > 0 ? `-${stats.avgCompressionSaved}%` : '75%'}
              </span>
              <span className="text-[11px] text-white/60 font-mono">{stats.totalCompressedKb} KB</span>
            </div>
            <span className="text-[10px] text-white/40 mt-1">{stats.totalReflections} reflections saved</span>
          </div>
        </div>

        {/* Collection Tabs & Purge Option */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-[#233026] pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setCollectionTab('v2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                collectionTab === 'v2'
                  ? 'bg-[#1e2c22] text-[#86efac] border border-[#3e6355]'
                  : 'text-white/60 hover:text-white hover:bg-[#141b16] border border-transparent'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Active Backups (v2)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                {records.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCollectionTab('legacy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                collectionTab === 'legacy'
                  ? 'bg-[#292215] text-amber-300 border border-amber-800/60'
                  : 'text-white/60 hover:text-white hover:bg-[#141b16] border border-transparent'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Legacy Backups (v1)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60">
                {legacyRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCollectionTab('archive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                collectionTab === 'archive'
                  ? 'bg-[#22182b] text-purple-300 border border-purple-800/60'
                  : 'text-white/60 hover:text-white hover:bg-[#141b16] border border-transparent'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive Vault</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800/60">
                {archivedRecords.length}
              </span>
            </button>
          </div>

          {collectionTab === 'archive' && archivedRecords.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Permanently empty all archived records from database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Archive</span>
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#141b16] border border-[#233026] p-3 rounded-xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by code (e.g. HZ-XP6W), fellowship (NA, AA), sobriety date, or sponsor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0e1310] border border-[#233026] focus:border-[#4ade80] rounded-lg text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
            />
          </div>

          {/* Origin Filters */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setOriginFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                originFilter === 'ALL'
                  ? 'bg-[#233327] text-white border border-[#3e6355]'
                  : 'bg-[#101612] text-white/60 hover:text-white border border-transparent'
              }`}
            >
              All ({currentDataset.length})
            </button>
            <button
              type="button"
              onClick={() => setOriginFilter('PWA')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                originFilter === 'PWA'
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
                  : 'bg-[#101612] text-white/60 hover:text-white border border-transparent'
              }`}
            >
              Installed PWA
            </button>
            <button
              type="button"
              onClick={() => setOriginFilter('DEV')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                originFilter === 'DEV'
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-700/60'
                  : 'bg-[#101612] text-white/60 hover:text-white border border-transparent'
              }`}
            >
              AI Studio Dev
            </button>
            <button
              type="button"
              onClick={() => setOriginFilter('WEB')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                originFilter === 'WEB'
                  ? 'bg-sky-950/70 text-sky-300 border border-sky-700/60'
                  : 'bg-[#101612] text-white/60 hover:text-white border border-transparent'
              }`}
            >
              Web Users
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-[#141b16] border border-[#233026] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#101612] border-b border-[#233026] text-white/50 text-[10px] uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Sync Code</th>
                  <th className="py-3 px-4">Origin</th>
                  <th className="py-3 px-4">App Version</th>
                  {collectionTab === 'archive' ? (
                    <>
                      <th className="py-3 px-4">Archived At</th>
                      <th className="py-3 px-4">Archived By</th>
                      <th className="py-3 px-4">Payload Summary</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4">Sobriety Start</th>
                      <th className="py-3 px-4">Fellowships</th>
                      <th className="py-3 px-4">Sponsor</th>
                      <th className="py-3 px-4">Reflections</th>
                      <th className="py-3 px-4">Days Logged</th>
                    </>
                  )}
                  <th className="py-3 px-4">Last Synced</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b251e]">
                {isLoading && currentDataset.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-white/40 text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-[#4ade80] rounded-full animate-spin" />
                        <span>Querying Firestore records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-white/40 text-xs">
                      {searchTerm
                        ? 'No records match your search filter.'
                        : collectionTab === 'archive'
                        ? 'Archive vault is currently empty.'
                        : 'No records found in this category.'}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const p = rec.data || {};
                    const fellowships = extractFellowships(p);
                    const sobriety = formatSobrietyDisplay(p.sobrietyStartDate);
                    const daysCount =
                      p.dailyActivities && typeof p.dailyActivities === 'object'
                        ? Object.keys(p.dailyActivities).length
                        : 0;
                    const reflectionsCount = Array.isArray(p.reflections) ? p.reflections.length : 0;
                    const isCopied = copiedCode === rec.syncCode;
                    const isDev = rec.origin?.includes('ai_studio') || rec.origin?.includes('dev');
                    const isPwa = rec.origin === 'standalone_pwa';
                    const isActionLoading = actionLoadingCode === rec.syncCode;

                    return (
                      <tr
                        key={rec.syncCode}
                        onClick={() => setSelectedRecord(rec)}
                        className="hover:bg-[#18221b] transition-colors cursor-pointer group"
                      >
                        {/* Sync Code */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-[#86efac] tracking-wider group-hover:underline">
                            {rec.syncCode}
                          </span>
                        </td>

                        {/* Origin */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isDev ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              AI Studio Dev
                            </span>
                          ) : isPwa ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Installed PWA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                              {rec.origin?.replace('web_', '') || 'Web User'}
                            </span>
                          )}
                        </td>

                        {/* Version & Compression */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-white/70">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white">
                              {rec.appVersion ? `v${rec.appVersion}` : rec.version === 1 ? 'v1.x' : 'v2.x'}
                            </span>
                            {rec.compressed ? (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950/70 text-purple-300 border border-purple-800/50"
                                title={`LZ Base64 Compressed: ${rec.rawBytes ? (rec.rawBytes / 1024).toFixed(1) + 'KB' : ''} -> ${rec.compressedBytes ? (rec.compressedBytes / 1024).toFixed(1) + 'KB' : ''}`}
                              >
                                LZ {rec.rawBytes && rec.compressedBytes
                                  ? `-${Math.round((1 - rec.compressedBytes / rec.rawBytes) * 100)}%`
                                  : ''}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/40">
                                Uncompressed v1
                              </span>
                            )}
                          </div>
                        </td>

                        {collectionTab === 'archive' ? (
                          <>
                            {/* Archived At */}
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-purple-300 text-[11px]">
                              {rec.archivedAt ? new Date(rec.archivedAt).toLocaleString() : 'Archived'}
                            </td>

                            {/* Archived By */}
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-white/60 text-[11px]">
                              {rec.archivedBy || 'Admin'}
                            </td>

                            {/* Payload Summary */}
                            <td className="py-3 px-4 whitespace-nowrap text-white/70 text-[11px]">
                              {reflectionsCount} reflections • {daysCount} days logged
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Sobriety Start Date */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {sobriety ? (
                                <div className="flex flex-col">
                                  <span className="text-white font-medium">{sobriety.formatted}</span>
                                  <span className="text-[10px] font-mono text-[#86efac]/80">
                                    {sobriety.daysAgo} days clean
                                  </span>
                                </div>
                              ) : (
                                <span className="text-white/30 italic">Not set</span>
                              )}
                            </td>

                            {/* Fellowships */}
                            <td className="py-3 px-4">
                              {fellowships.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {fellowships.map((f, i) => (
                                    <span
                                      key={i}
                                      className="bg-[#1e2c22] text-[#86efac] border border-[#3e6355]/40 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                                    >
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-white/30 italic">None</span>
                              )}
                            </td>

                            {/* Sponsor */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {p.sponsorName ? (
                                <div className="flex flex-col">
                                  <span className="text-white font-medium">{p.sponsorName}</span>
                                  {p.sponsorNumber && (
                                    <span className="text-white/50 text-[10px] font-mono">{p.sponsorNumber}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-white/30 italic">None</span>
                              )}
                            </td>

                            {/* Reflections Count */}
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-white/70">
                              {reflectionsCount > 0 ? (
                                <span className="text-white font-medium">{reflectionsCount} entries</span>
                              ) : (
                                <span className="text-white/30 italic">0</span>
                              )}
                            </td>

                            {/* Activity Days */}
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-white/70">
                              {daysCount > 0 ? (
                                <span className="text-white">{daysCount} days</span>
                              ) : (
                                <span className="text-white/30 italic">0</span>
                              )}
                            </td>
                          </>
                        )}

                        {/* Last Synced */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-white/50 text-[11px]">
                          {rec.updatedAt ? new Date(rec.updatedAt).toLocaleString() : 'Unknown'}
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(rec)}
                              className="px-2 py-1 bg-[#162019] hover:bg-[#202e24] border border-[#2e3e32] text-white/80 hover:text-white rounded text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Inspect full recovery payload"
                            >
                              <Eye className="w-3 h-3 text-white/70" />
                              <span className="hidden sm:inline">Inspect</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => copyCode(rec.syncCode, e)}
                              className="px-2 py-1 bg-[#1e2c22] hover:bg-[#283b2e] border border-[#3e6355]/40 text-white rounded text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copy sync code to clipboard"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-white/60" />
                              )}
                            </button>

                            {collectionTab === 'archive' ? (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreRecord(rec.syncCode);
                                }}
                                className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 rounded text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Restore to active backups"
                              >
                                {isActionLoading ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ArchiveRestore className="w-3 h-3 text-emerald-400" />
                                )}
                                <span className="hidden sm:inline">Restore</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveRecord(rec.syncCode);
                                }}
                                className="px-2 py-1 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 rounded text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Safely move to Archive Vault"
                              >
                                {isActionLoading ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Archive className="w-3 h-3 text-amber-400" />
                                )}
                                <span className="hidden sm:inline">Archive</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRecordToDelete({ record: rec, fromArchive: collectionTab === 'archive' });
                              }}
                              className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 rounded text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Permanently delete record from database"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Confirmation Modal: Delete Single Record */}
      {recordToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRecordToDelete(null)}
        >
          <div
            className="bg-[#141b16] border border-red-900/60 rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/70 text-red-400 border border-red-800/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white">Permanently Delete Record?</h3>
                <p className="font-mono text-xs text-red-300/80">{recordToDelete.record.syncCode}</p>
              </div>
            </div>

            <div className="bg-[#0e1310] p-3.5 rounded-xl border border-[#233026] text-xs text-white/70 space-y-2">
              <p>
                This action will <strong className="text-white">permanently remove this record</strong> from the Firestore database ({recordToDelete.fromArchive ? 'Archive Vault' : 'Active Backups'}).
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] leading-relaxed">
                <strong>Real User Safeguard:</strong> The user's device stores their data offline locally. If a real user opens their app or taps "Sync to Cloud Now", their client will automatically re-upload a fresh backup!
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-[#1a231d] hover:bg-[#233027] border border-[#2e3e32] text-xs text-white/80 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPermanentDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Purge Entire Archive */}
      {showPurgeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPurgeModal(false)}
        >
          <div
            className="bg-[#141b16] border border-red-900/60 rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/70 text-red-400 border border-red-800/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white">Empty Archive Vault?</h3>
                <p className="font-mono text-xs text-red-300/80">Purge {archivedRecords.length} archived record(s)</p>
              </div>
            </div>

            <div className="bg-[#0e1310] p-3.5 rounded-xl border border-[#233026] text-xs text-white/70 space-y-2">
              <p>
                This will <strong className="text-white">permanently delete all {archivedRecords.length} records</strong> currently in the Archive Vault from Firestore.
              </p>
              <p className="text-white/50 text-[11px]">
                This action cannot be undone on the server.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                disabled={isPurging}
                className="px-3 py-1.5 bg-[#1a231d] hover:bg-[#233027] border border-[#2e3e32] text-xs text-white/80 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPurgeArchive}
                disabled={isPurging}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                {isPurging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Purge All Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Inspection Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-[#141b16] border border-[#2d3b31] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#233026] flex items-center justify-between bg-[#101612]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1e2c22] flex items-center justify-center text-[#4ade80] border border-[#3e6355]/40">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm font-bold text-white tracking-wide">
                      {selectedRecord.syncCode}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/40">
                      v{selectedRecord.appVersion || '2.4.3'} • {selectedRecord.origin || 'unknown'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 font-mono">
                    Last updated: {selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {collectionTab === 'archive' ? (
                  <button
                    type="button"
                    onClick={() => handleRestoreRecord(selectedRecord.syncCode)}
                    className="px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleArchiveRecord(selectedRecord.syncCode)}
                    className="px-2.5 py-1 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setRecordToDelete({ record: selectedRecord, fromArchive: collectionTab === 'archive' })}
                  className="px-2.5 py-1 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyCode(selectedRecord.syncCode)}
                  className="px-2.5 py-1 bg-[#1e2c22] hover:bg-[#283b2e] border border-[#3e6355]/40 text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedCode === selectedRecord.syncCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-white/60" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 px-5 border-b border-[#233026] bg-[#101612]/60 text-xs">
              <button
                type="button"
                onClick={() => setInspectTab('overview')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
                  inspectTab === 'overview'
                    ? 'border-[#4ade80] text-white'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setInspectTab('reflections')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
                  inspectTab === 'reflections'
                    ? 'border-[#4ade80] text-white'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Reflections ({selectedRecord.data?.reflections?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setInspectTab('steps')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
                  inspectTab === 'steps'
                    ? 'border-[#4ade80] text-white'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Steps ({selectedRecord.data?.steps?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setInspectTab('json')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
                  inspectTab === 'json'
                    ? 'border-[#4ade80] text-white'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Payload JSON
              </button>
            </div>

            {/* Modal Tab Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-grow text-xs">
              {inspectTab === 'overview' && (
                <div className="space-y-4">
                  {/* Compression Stats Banner */}
                  <div className="bg-[#101612] border border-[#233026] rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="font-medium text-white">LZString Compression</span>
                        <p className="text-[10px] text-white/40">
                          {selectedRecord.rawBytes
                            ? `${(selectedRecord.rawBytes / 1024).toFixed(2)} KB raw payload`
                            : 'Compact recovery schema'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-purple-300 font-bold text-sm">
                        {selectedRecord.compressedBytes
                          ? `${(selectedRecord.compressedBytes / 1024).toFixed(2)} KB`
                          : 'Optimized'}
                      </span>
                      {selectedRecord.rawBytes && selectedRecord.compressedBytes && (
                        <p className="text-[10px] text-emerald-400">
                          {Math.round((1 - selectedRecord.compressedBytes / selectedRecord.rawBytes) * 100)}% space saved
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sobriety & Grounded Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#101612] border border-[#233026] rounded-xl p-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                        Sobriety Start Date
                      </span>
                      <p className="text-sm font-bold text-white mt-1">
                        {selectedRecord.data?.sobrietyStartDate
                          ? formatSobrietyDisplay(selectedRecord.data.sobrietyStartDate)?.formatted
                          : 'Not set'}
                      </p>
                      {selectedRecord.data?.sobrietyStartDate && (
                        <span className="text-[10px] font-mono text-[#86efac]">
                          {formatSobrietyDisplay(selectedRecord.data.sobrietyStartDate)?.daysAgo} days grounded
                        </span>
                      )}
                    </div>

                    <div className="bg-[#101612] border border-[#233026] rounded-xl p-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                        Sponsor & Support
                      </span>
                      <p className="text-sm font-bold text-white mt-1">
                        {selectedRecord.data?.sponsorName || 'No sponsor listed'}
                      </p>
                      {selectedRecord.data?.sponsorNumber && (
                        <span className="text-[10px] font-mono text-white/50">
                          Phone: {selectedRecord.data.sponsorNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fellowships Breakdown */}
                  <div className="bg-[#101612] border border-[#233026] rounded-xl p-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-2 block">
                      Enrolled Fellowships & Brotherhoods
                    </span>
                    {extractFellowships(selectedRecord.data).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {extractFellowships(selectedRecord.data).map((fellowship, idx) => (
                          <span
                            key={idx}
                            className="bg-[#1e2c22] text-[#86efac] border border-[#3e6355]/50 px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                          >
                            {fellowship}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/40 italic">No fellowships configured</span>
                    )}
                  </div>

                  {/* Daily Activities Count */}
                  <div className="bg-[#101612] border border-[#233026] rounded-xl p-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1 block">
                      Daily Grounding Activities Logged
                    </span>
                    <p className="text-sm font-bold text-white">
                      {selectedRecord.data?.dailyActivities
                        ? Object.keys(selectedRecord.data.dailyActivities).length
                        : 0}{' '}
                      unique days
                    </p>
                  </div>
                </div>
              )}

              {inspectTab === 'reflections' && (
                <div className="space-y-2">
                  {selectedRecord.data?.reflections && selectedRecord.data.reflections.length > 0 ? (
                    selectedRecord.data.reflections.map((ref: any, idx: number) => (
                      <div key={idx} className="bg-[#101612] border border-[#233026] rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{ref.title || 'Daily Reflection'}</span>
                          <span className="text-[10px] font-mono text-white/40">
                            {ref.date ? new Date(ref.date).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-white/70 whitespace-pre-wrap leading-relaxed">{ref.content}</p>
                        {Array.isArray(ref.moods) && ref.moods.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {ref.moods.map((m: string, mi: number) => (
                              <span
                                key={mi}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/60 border border-white/10"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-white/40 italic">
                      No reflection journal entries recorded for this account.
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'steps' && (
                <div className="space-y-2">
                  {selectedRecord.data?.steps && selectedRecord.data.steps.length > 0 ? (
                    selectedRecord.data.steps.map((st: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-[#101612] border border-[#233026] rounded-xl p-2.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${st.completedDays > 0 ? 'text-emerald-400' : 'text-white/20'}`}
                          />
                          <span className="font-medium text-white">{st.id || `Step ${idx + 1}`}</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/50">
                          {st.completedDays || 0} days completed
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-white/40 italic">
                      No custom 12-step progress data recorded.
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'json' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/40">Decompressed Recovery Object</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedRecord.data, null, 2));
                      }}
                      className="px-2 py-1 rounded bg-[#1e2c22] text-white/80 hover:text-white text-[10px] font-mono cursor-pointer"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <pre className="bg-[#0e1310] border border-[#233026] rounded-xl p-3 font-mono text-[10px] text-emerald-300/90 overflow-x-auto max-h-96">
                    {JSON.stringify(selectedRecord.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

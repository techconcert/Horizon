/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore/lite';
import { db } from '../lib/firebase';
import { normalizeSyncCode, CloudPayload } from '../services/cloudSync';
import {
  ShieldAlert,
  Search,
  Lock,
  Key,
  Calendar,
  Heart,
  Users,
  CheckCircle2,
  Phone,
  Video,
  FileText,
  AlertCircle,
  Copy,
  Check,
  ArrowLeft,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  Eye,
  Filter,
  RefreshCw,
  HelpCircle,
  Hash,
  UserCheck,
  Bookmark
} from 'lucide-react';

interface BackupRecord {
  syncCode: string;
  data: CloudPayload;
  updatedAt?: string;
  version?: number;
}

const AUTHORIZED_ADMIN_EMAIL = 'cobaltmacawgames@gmail.com';
const ADMIN_SESSION_KEY = 'horizon_admin_session_auth';

export const AdminConsoleView: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });

  const [inputEmail, setInputEmail] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Lookup Mode: 'code' (exact code) or 'search' (partial recovery search)
  const [searchMode, setSearchMode] = useState<'search' | 'code'>('search');

  // Exact Code Lookup State
  const [syncCodeInput, setSyncCodeInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<BackupRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Partial Data Search Inputs (for lost codes)
  const [partialDate, setPartialDate] = useState<string>('');
  const [partialSponsor, setPartialSponsor] = useState<string>('');
  const [partialReflectionKeyword, setPartialReflectionKeyword] = useState<string>('');
  const [partialFellowship, setPartialFellowship] = useState<string>('');
  const [partialCodeSnippet, setPartialCodeSnippet] = useState<string>('');

  // Loaded database records for searching / filtering
  const [allBackups, setAllBackups] = useState<BackupRecord[]>([]);
  const [isFetchingBackups, setIsFetchingBackups] = useState<boolean>(false);
  const [hasFetchedBackups, setHasFetchedBackups] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (cleanEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      setAuthError('Unauthorized. Only the administrator account may access this recovery console.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setSelectedRecord(null);
    setAllBackups([]);
    setHasFetchedBackups(false);
  };

  // Fetch recent backups from Firestore for recovery indexing
  const fetchAllBackups = async () => {
    setIsFetchingBackups(true);
    setFetchError('');
    try {
      const colRef = collection(db, 'sync_backups');
      const q = query(colRef, limit(300));
      const snap = await getDocs(q);

      const records: BackupRecord[] = [];
      snap.forEach((d) => {
        const raw = d.data();
        records.push({
          syncCode: raw.syncCode || d.id,
          data: raw.data || {},
          updatedAt: raw.updatedAt,
          version: raw.version
        });
      });

      // Sort by latest updated first
      records.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });

      setAllBackups(records);
      setHasFetchedBackups(true);
    } catch (err: any) {
      console.error('[AdminConsole] Failed to fetch backups collection:', err);
      setFetchError(err?.message || 'Could not fetch database records.');
    } finally {
      setIsFetchingBackups(false);
    }
  };

  // Auto-fetch on authenticated mount
  useEffect(() => {
    if (isAuthenticated && !hasFetchedBackups && !isFetchingBackups) {
      fetchAllBackups();
    }
  }, [isAuthenticated, hasFetchedBackups]);

  // Exact single code lookup
  const handleCodeLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError('');
    setSelectedRecord(null);

    const norm = normalizeSyncCode(syncCodeInput.trim());
    if (!norm || norm.length < 4) {
      setSearchError('Please enter a valid sync code or suffix (e.g. HZ-XXXX or XXXX)');
      return;
    }

    setIsLoading(true);
    try {
      // First check local loaded cache
      const cached = allBackups.find(b => normalizeSyncCode(b.syncCode) === norm || b.syncCode.toUpperCase() === norm);
      if (cached) {
        setSelectedRecord(cached);
        setIsLoading(false);
        return;
      }

      // Query direct doc from Firestore
      const docRef = doc(db, 'sync_backups', norm);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        setSearchError(`No backup record found for sync code: ${norm}`);
      } else {
        const raw = snap.data() as BackupRecord;
        setSelectedRecord({
          syncCode: raw.syncCode || norm,
          data: raw.data || {},
          updatedAt: raw.updatedAt,
          version: raw.version
        });
      }
    } catch (err: any) {
      console.error('[AdminConsole] Lookup failed:', err);
      setSearchError(err?.message || 'Failed to query database. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Multi-criteria partial filtering for lost code recovery
  const matchedBackups = useMemo(() => {
    if (!allBackups || allBackups.length === 0) return [];

    const normDate = partialDate.trim().toLowerCase();
    const normSponsor = partialSponsor.trim().toLowerCase();
    const normReflection = partialReflectionKeyword.trim().toLowerCase();
    const normFellowship = partialFellowship.trim().toLowerCase();
    const normCodePart = partialCodeSnippet.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const hasAnyCriteria = normDate || normSponsor || normReflection || normFellowship || normCodePart;

    return allBackups.filter((item) => {
      // If no criteria entered, show all recent records
      if (!hasAnyCriteria) return true;

      const payload = item.data || {};

      // 1. Check sync code partial match
      if (normCodePart) {
        const cleanCode = (item.syncCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!cleanCode.includes(normCodePart)) {
          return false;
        }
      }

      // 2. Check Sobriety Date partial match (e.g. "2024", "2024-05", "May 2023", "05-12")
      if (normDate) {
        const dateStr = (payload.sobrietyStartDate || '').toLowerCase();
        if (!dateStr.includes(normDate)) {
          return false;
        }
      }

      // 3. Check Sponsor Name or Phone partial match
      if (normSponsor) {
        const sName = (payload.sponsorName || '').toLowerCase();
        const sPhone = (payload.sponsorNumber || '').toLowerCase();
        if (!sName.includes(normSponsor) && !sPhone.includes(normSponsor)) {
          return false;
        }
      }

      // 4. Check Fellowship Name match
      if (normFellowship) {
        const fellowships = payload.brotherhoods || [];
        const match = fellowships.some((f: any) =>
          (f.brotherhood || '').toLowerCase().includes(normFellowship) ||
          (f.id || '').toLowerCase().includes(normFellowship)
        );
        if (!match) return false;
      }

      // 5. Check Reflection Content or Title match
      if (normReflection) {
        const reflections = payload.reflections || [];
        const matchRefl = reflections.some((r: any) =>
          (r.title || '').toLowerCase().includes(normReflection) ||
          (r.content || '').toLowerCase().includes(normReflection)
        );
        if (!matchRefl) return false;
      }

      return true;
    });
  }, [allBackups, partialDate, partialSponsor, partialReflectionKeyword, partialFellowship, partialCodeSnippet]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const returnToApp = () => {
    window.location.hash = '';
  };

  const resetFilters = () => {
    setPartialDate('');
    setPartialSponsor('');
    setPartialReflectionKeyword('');
    setPartialFellowship('');
    setPartialCodeSnippet('');
  };

  // -------------------------------------------------------------
  // VIEW: Authentication Screen
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#111613] text-[#F8F5F2] flex flex-col items-center justify-center p-4 selection:bg-[#3e6355]">
        <div className="w-full max-w-md bg-[#18201a] border border-[#2d3b31] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2d3b31] pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#26352a] flex items-center justify-center border border-[#3e6355]/40 text-[#4ade80]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-normal text-white">
                  Horizon Admin Recovery Console
                </h1>
                <p className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
                  Lost Code & Backup Recovery
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={returnToApp}
              className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 text-xs font-sans"
              title="Return to Horizon App"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-white/70 mb-6 leading-relaxed">
            This console is restricted to administrator recovery assistance. It enables identifying a user's lost sync code when cache is deleted and partial memory (sobriety date, sponsor name, fellowship, reflection keywords) is provided.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-white/60 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full bg-[#111613] border border-[#2d3b31] focus:border-[#4ade80] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1.5 italic">
                Secured to administrator identity: <code className="text-[#4ade80]/90 font-mono">cobaltmacawgames@gmail.com</code>
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full py-2.5 px-4 bg-[#3e6355] hover:bg-[#487363] active:bg-[#345347] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Authenticate & Access Console</span>
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-[#2d3b31] flex justify-between items-center text-[10px] text-white/40">
            <span>Horizon Diagnostics</span>
            <span>Security Layer ABAC</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Admin Console Dashboard (Read-Only)
  // -------------------------------------------------------------
  const activePayload = selectedRecord?.data;
  const dailyKeys = activePayload?.dailyActivities ? Object.keys(activePayload.dailyActivities) : [];
  const reflectionsList = activePayload?.reflections || [];
  const brotherhoodsList = activePayload?.brotherhoods || [];
  const stepsList = activePayload?.steps || [];

  return (
    <div className="min-h-screen bg-[#0e1310] text-[#e8e6e3] selection:bg-[#3e6355] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#141b16]/95 backdrop-blur-md border-b border-[#233026] px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#212c24] flex items-center justify-center border border-[#3e6355]/40 text-[#4ade80]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base font-normal text-white">
                Horizon Admin Console
              </h1>
              <span className="bg-[#243328] text-[#86efac] border border-[#3e6355]/30 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                Lost Code Recovery
              </span>
            </div>
            <p className="text-[10px] text-white/40 font-mono">
              Admin: cobaltmacawgames@gmail.com
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={returnToApp}
            className="px-3 py-1.5 rounded-lg bg-[#1a231d] hover:bg-[#233027] text-white/80 hover:text-white border border-[#2e3e32] text-xs font-sans font-medium transition-colors flex items-center gap-1.5"
            title="Return to client application"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to App</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 text-xs font-sans font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Purpose Notice */}
        <div className="bg-[#17221a] border border-[#2d3f31] rounded-2xl p-4 flex items-start gap-3 text-xs text-white/80 shadow-sm">
          <Info className="w-4 h-4 text-[#86efac] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-white">Lost Sync Code Finder & Backup Inspector</p>
            <p className="text-white/60 text-[11px] mt-0.5 leading-relaxed">
              When a user clears their browser cache or reinstalls without copying their sync code, ask them for partial clues they remember (e.g. roughly when they started sobriety, their sponsor’s name, their fellowship, or a reflection title). Use the filter below to locate their exact sync code so they can restore their data.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAllBackups}
            disabled={isFetchingBackups}
            className="px-2.5 py-1 bg-[#212f25] hover:bg-[#2a3c30] border border-[#3e6355]/40 rounded-lg text-[11px] font-sans text-white/80 flex items-center gap-1 shrink-0 transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3 h-3 ${isFetchingBackups ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh DB ({allBackups.length})</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-[#233026] pb-3">
          <button
            type="button"
            onClick={() => setSearchMode('search')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
              searchMode === 'search'
                ? 'bg-[#3e6355] text-white shadow-sm'
                : 'bg-[#141b16] text-white/60 hover:text-white border border-[#233026]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Search by Partial Memory (Lost Code)</span>
            <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">
              {matchedBackups.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchMode('code')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
              searchMode === 'code'
                ? 'bg-[#3e6355] text-white shadow-sm'
                : 'bg-[#141b16] text-white/60 hover:text-white border border-[#233026]'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Direct Code Lookup</span>
          </button>
        </div>

        {/* MODE 1: Partial Memory Finder */}
        {searchMode === 'search' && (
          <div className="bg-[#141b16] border border-[#233026] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#233026] pb-3">
              <div>
                <h2 className="text-sm font-serif text-white font-normal flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#4ade80]" />
                  Filter by Partial Clues Provided by User
                </h2>
                <p className="text-[11px] text-white/50">
                  Fill in whatever partial details the user remembers to narrow down matching backups.
                </p>
              </div>
              {(partialDate || partialSponsor || partialReflectionKeyword || partialFellowship || partialCodeSnippet) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] text-[#86efac] hover:underline self-start sm:self-auto"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Filter Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Sobriety Date or Year */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#4ade80]" />
                  Sobriety Date / Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024, 2023-08, or 08-15"
                  value={partialDate}
                  onChange={(e) => setPartialDate(e.target.value)}
                  className="bg-[#0e1310] border border-[#233026] focus:border-[#4ade80] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              {/* Sponsor Name or Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3 text-[#4ade80]" />
                  Sponsor Name / Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bob, Dave, 555-1234"
                  value={partialSponsor}
                  onChange={(e) => setPartialSponsor(e.target.value)}
                  className="bg-[#0e1310] border border-[#233026] focus:border-[#4ade80] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              {/* Partial Code */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-[#4ade80]" />
                  Partial Code Snippet
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2K, 9B, HZ-..."
                  value={partialCodeSnippet}
                  onChange={(e) => setPartialCodeSnippet(e.target.value.toUpperCase())}
                  className="bg-[#0e1310] border border-[#233026] focus:border-[#4ade80] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              {/* Fellowship / Brotherhood */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-[#4ade80]" />
                  Fellowship Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. AA, NA, Al-Anon, Celebrate"
                  value={partialFellowship}
                  onChange={(e) => setPartialFellowship(e.target.value)}
                  className="bg-[#0e1310] border border-[#233026] focus:border-[#4ade80] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              {/* Journal Reflection Keyword */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-[#4ade80]" />
                  Reflection Words / Topics
                </label>
                <input
                  type="text"
                  placeholder="e.g. amends, gratitude, meeting, serenity"
                  value={partialReflectionKeyword}
                  onChange={(e) => setPartialReflectionKeyword(e.target.value)}
                  className="bg-[#0e1310] border border-[#233026] focus:border-[#4ade80] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Matching Results List */}
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>
                  Found <strong className="text-white">{matchedBackups.length}</strong> matching backup record(s) in database
                </span>
                {fetchError && <span className="text-red-400 text-[11px]">{fetchError}</span>}
              </div>

              {matchedBackups.length === 0 ? (
                <div className="p-6 bg-[#0e1310] rounded-xl border border-[#233026] text-center text-xs text-white/40">
                  No backup records match the current criteria. Try loosening dates or keyword filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {matchedBackups.map((item) => {
                    const p = item.data || {};
                    const isSelected = selectedRecord?.syncCode === item.syncCode;
                    const date = p.sobrietyStartDate || 'No start date';
                    const sponsor = p.sponsorName ? `${p.sponsorName}${p.sponsorNumber ? ` (${p.sponsorNumber})` : ''}` : 'No sponsor';
                    const fellowships = (p.brotherhoods || []).map((b: any) => b.brotherhood).join(', ') || 'None';
                    const reflCount = (p.reflections || []).length;
                    const daysCount = p.dailyActivities ? Object.keys(p.dailyActivities).length : 0;

                    return (
                      <div
                        key={item.syncCode}
                        onClick={() => setSelectedRecord(item)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#1b271f] border-[#4ade80] shadow-md'
                            : 'bg-[#0e1310] border-[#202c23] hover:border-[#3e6355] hover:bg-[#121a14]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-[#86efac] tracking-wider">
                                {item.syncCode}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item.syncCode, `list_${item.syncCode}`);
                                }}
                                className="text-white/40 hover:text-white p-1 rounded"
                                title="Copy sync code to share with user"
                              >
                                {copiedKey === `list_${item.syncCode}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-white/40 block font-mono">
                              Updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isSelected ? 'bg-[#3e6355] text-white' : 'bg-[#1c2820] text-[#86efac]'
                          }`}>
                            {isSelected ? 'Viewing' : 'Click to Inspect'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70 bg-[#121813] p-2 rounded-lg border border-black/20">
                          <div>
                            <span className="text-[9px] uppercase font-mono text-white/40 block">Sobriety Start</span>
                            <span className="text-white font-medium truncate block">{date}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono text-white/40 block">Sponsor</span>
                            <span className="text-white/90 truncate block">{sponsor}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono text-white/40 block">Fellowships</span>
                            <span className="text-white/80 truncate block">{fellowships}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono text-white/40 block">Data Records</span>
                            <span className="text-white/80 truncate block">
                              {reflCount} notes • {daysCount} days
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: Direct Sync Code Lookup */}
        {searchMode === 'code' && (
          <div className="bg-[#141b16] border border-[#233026] rounded-2xl p-5 shadow-sm">
            <form onSubmit={handleCodeLookup} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter Sync Code (e.g., HZ-2AB4)"
                  value={syncCodeInput}
                  onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0e1310] border border-[#233026] focus:border-[#4ade80] rounded-xl text-xs font-mono tracking-widest text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !syncCodeInput.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#3e6355] hover:bg-[#487363] disabled:opacity-50 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Code</span>
                  </>
                )}
              </button>
            </form>

            {searchError && (
              <div className="mt-4 p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{searchError}</span>
              </div>
            )}
          </div>
        )}

        {/* Selected Record Detail Presentation */}
        {selectedRecord && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Record Summary Card with prominent Sync Code */}
            <div className="bg-[#18231c] border-2 border-[#3e6355] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#223126] border border-[#4ade80]/40 flex items-center justify-center text-[#4ade80]">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest block">
                    Recovered Sync Code for User
                  </span>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="font-mono text-2xl font-black text-[#86efac] tracking-wider">
                      {selectedRecord.syncCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedRecord.syncCode, 'code_main')}
                      className="px-2.5 py-1 bg-[#28382c] hover:bg-[#344839] border border-[#4ade80]/40 rounded-lg text-xs font-mono text-white flex items-center gap-1.5 transition-colors"
                      title="Copy code to provide to user"
                    >
                      {copiedKey === 'code_main' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/60 flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3" />
                    Last cloud sync: {selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(selectedRecord, null, 2), 'all_json')}
                  className="px-3 py-1.5 bg-[#141b16] hover:bg-[#1d2720] border border-[#2d3f31] rounded-xl text-xs text-white/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === 'all_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Full JSON</span>
                </button>
              </div>
            </div>

            {/* Grid of Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Core Milestone & Check-in */}
              <div className="bg-[#141b16] border border-[#233026] rounded-2xl p-5 flex flex-col gap-4">
                <h2 className="font-serif text-sm font-normal text-white flex items-center gap-2 border-b border-[#233026] pb-2">
                  <Calendar className="w-4 h-4 text-[#4ade80]" />
                  Sobriety Dates & Check-ins
                </h2>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="bg-[#0e1310] p-3 rounded-xl border border-[#202b23] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-white/40 block">Sobriety Start Date</span>
                      <span className="font-mono text-sm text-white font-medium">
                        {activePayload?.sobrietyStartDate || 'Not set'}
                      </span>
                    </div>
                    {activePayload?.sobrietyStartDate && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activePayload.sobrietyStartDate!, 'start_date')}
                        className="text-white/40 hover:text-white p-1 rounded"
                        title="Copy date"
                      >
                        {copiedKey === 'start_date' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="bg-[#0e1310] p-3 rounded-xl border border-[#202b23]">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Last "Just for Today" Check-in</span>
                    <span className="font-mono text-xs text-white/80">
                      {activePayload?.lastSoberCheckInTime
                        ? `${new Date(activePayload.lastSoberCheckInTime).toLocaleString()} (${activePayload.lastSoberCheckInTime})`
                        : 'No check-in on record'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0e1310] p-3 rounded-xl border border-[#202b23]">
                      <span className="text-[10px] uppercase font-bold text-white/40 block">Preferred Language</span>
                      <span className="text-white font-medium">{activePayload?.language || 'English (default)'}</span>
                    </div>
                    <div className="bg-[#0e1310] p-3 rounded-xl border border-[#202b23]">
                      <span className="text-[10px] uppercase font-bold text-white/40 block">Onboarded Status</span>
                      <span className="text-emerald-400 font-medium">{activePayload?.onboarded ? 'Completed' : 'Pending'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Contacts & SOS */}
              <div className="bg-[#141b16] border border-[#233026] rounded-2xl p-5 flex flex-col gap-4">
                <h2 className="font-serif text-sm font-normal text-white flex items-center gap-2 border-b border-[#233026] pb-2">
                  <Phone className="w-4 h-4 text-[#4ade80]" />
                  Support Network Configuration
                </h2>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="bg-[#0e1310] p-3 rounded-xl border border-[#202b23]">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Sponsor Name & Phone</span>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-white font-medium">
                        {activePayload?.sponsorName || 'None listed'} {activePayload?.sponsorNumber ? `(${activePayload.sponsorNumber})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0e1310] p-3 rounded-xl border border-[#202b23]">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Custom Support Hotline</span>
                    <span className="text-white/80 font-mono mt-0.5 block">
                      {activePayload?.supportNumber || 'Default (988 Crisis Lifeline)'}
                    </span>
                  </div>

                  <div className="bg-[#0e1310] p-3 rounded-xl border border-[#202b23]">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">24/7 Meeting / Video Link</span>
                    <span className="text-white/80 font-mono text-[11px] truncate block mt-0.5">
                      {activePayload?.supportLink || 'None configured'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fellowship Entry Dates */}
              <div className="bg-[#141b16] border border-[#233026] rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-[#233026] pb-2">
                  <h2 className="font-serif text-sm font-normal text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#4ade80]" />
                    Fellowship Entry Dates ({brotherhoodsList.length})
                  </h2>
                </div>

                {brotherhoodsList.length === 0 ? (
                  <p className="text-xs text-white/40 italic py-2">No fellowship memberships logged.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {brotherhoodsList.map((b: any, idx: number) => (
                      <div key={b.id || idx} className="bg-[#0e1310] p-2.5 rounded-xl border border-[#202b23] flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-[#86efac]">{b.brotherhood}</span>
                          <span className="text-white/40 text-[10px] block font-mono">ID: {b.id}</span>
                        </div>
                        <span className="font-mono text-white/90 bg-[#17221a] px-2 py-1 rounded-md border border-[#243327]">
                          {b.entryDate}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daily Progress & Activity Records */}
              <div className="bg-[#141b16] border border-[#233026] rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-[#233026] pb-2">
                  <h2 className="font-serif text-sm font-normal text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                    Daily Progress & Practice Logs ({dailyKeys.length} days)
                  </h2>
                </div>

                {dailyKeys.length === 0 ? (
                  <p className="text-xs text-white/40 italic py-2">No daily practice records synced.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {dailyKeys.sort().reverse().slice(0, 14).map((dateKey) => {
                      const day = activePayload?.dailyActivities[dateKey] || {};
                      return (
                        <div key={dateKey} className="bg-[#0e1310] p-2.5 rounded-xl border border-[#202b23] flex justify-between items-center text-xs">
                          <span className="font-mono text-white/80">{dateKey}</span>
                          <div className="flex items-center gap-1">
                            {['justForToday', 'checkIn', 'meditation', 'breathing', 'lesson'].map((act) => {
                              const done = day[act];
                              return (
                                <span
                                  key={act}
                                  title={`${act}: ${done ? 'Completed' : 'Not done'}`}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                    done ? 'bg-[#243a2c] text-[#86efac] border border-[#3e6355]' : 'bg-black/30 text-white/20'
                                  }`}
                                >
                                  {act.substring(0, 3)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {dailyKeys.length > 14 && (
                      <span className="text-[10px] text-white/40 text-center block pt-1">
                        + {dailyKeys.length - 14} older logged days in backup
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Journal Reflections */}
            <div className="bg-[#141b16] border border-[#233026] rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-[#233026] pb-2">
                <h2 className="font-serif text-sm font-normal text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#4ade80]" />
                  Saved Journal Reflections ({reflectionsList.length})
                </h2>
              </div>

              {reflectionsList.length === 0 ? (
                <p className="text-xs text-white/40 italic py-2">No reflections recorded for this user.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                  {reflectionsList.map((r: any) => (
                    <div key={r.id} className="bg-[#0e1310] p-3.5 rounded-xl border border-[#202b23] flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-white">{r.title || 'Untitled Reflection'}</h3>
                          <span className="text-[10px] text-white/40 font-mono">
                            {r.date ? new Date(r.date).toLocaleString() : 'No date'}
                          </span>
                        </div>
                        {r.moods && r.moods.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {r.moods.map((m: string) => (
                              <span key={m} className="bg-[#1b261e] border border-[#293c2d] text-[#86efac] text-[9px] px-2 py-0.5 rounded-full font-sans">
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-white/70 whitespace-pre-wrap leading-relaxed text-[11px] bg-[#121914] p-2.5 rounded-lg mt-1 border border-black/30">
                        {r.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Moods and 12-Step Academy Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#141b16] border border-[#233026] rounded-2xl p-5 flex flex-col gap-3">
                <h2 className="font-serif text-sm font-normal text-white flex items-center gap-2 border-b border-[#233026] pb-2">
                  <Sparkles className="w-4 h-4 text-[#4ade80]" />
                  Custom Moods Added ({activePayload?.customMoods?.length || 0})
                </h2>
                {(!activePayload?.customMoods || activePayload.customMoods.length === 0) ? (
                  <p className="text-xs text-white/40 italic">No custom moods defined.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {activePayload.customMoods.map((m: string) => (
                      <span key={m} className="bg-[#19241b] border border-[#2c3d2f] text-white/80 text-xs px-2.5 py-1 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#141b16] border border-[#233026] rounded-2xl p-5 flex flex-col gap-3">
                <h2 className="font-serif text-sm font-normal text-white flex items-center gap-2 border-b border-[#233026] pb-2">
                  <Lock className="w-4 h-4 text-[#4ade80]" />
                  Step Progress Snapshot ({stepsList.length} Steps)
                </h2>
                {stepsList.length === 0 ? (
                  <p className="text-xs text-white/40 italic">Standard initial step progress (unmodified).</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {stepsList.map((s: any) => (
                      <div key={s.id} className="bg-[#0e1310] p-2 rounded-lg border border-[#202b23] text-center">
                        <span className="block text-white/40 text-[9px]">Step {s.number}</span>
                        <span className={`text-[11px] font-bold ${s.locked ? 'text-white/30' : 'text-[#86efac]'}`}>
                          {s.locked ? 'Locked' : `${s.completedDays || 0}/${s.totalDays || 7}d`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

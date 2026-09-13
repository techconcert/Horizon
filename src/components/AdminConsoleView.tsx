/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore/lite';
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
  Database
} from 'lucide-react';

interface BackupRecord {
  syncCode: string;
  data: CloudPayload;
  updatedAt?: string;
  version?: number;
}

const AUTHORIZED_ADMIN_EMAIL = 'cobaltmacawgames@gmail.com';
const ADMIN_SESSION_KEY = 'hzadmin_session_auth';

export const AdminConsoleView: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });

  const [inputEmail, setInputEmail] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Table Data & Filter
  const [records, setRecords] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (cleanEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      setAuthError('Unauthorized. Only the administrator account may access this console.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setRecords([]);
  };

  const loadRecords = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const colRef = collection(db, 'sync_backups');
      const q = query(colRef, limit(500));
      const snap = await getDocs(q);

      const items: BackupRecord[] = [];
      snap.forEach((d) => {
        const raw = d.data();
        items.push({
          syncCode: raw.syncCode || d.id,
          data: raw.data || {},
          updatedAt: raw.updatedAt,
          version: raw.version
        });
      });

      // Sort by newest sync first
      items.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });

      setRecords(items);
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
  }, [isAuthenticated]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const returnToApp = () => {
    window.location.hash = '';
  };

  // Simple filter across sync code, sobriety date, sponsor, and fellowships
  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return records;

    return records.filter((rec) => {
      const p = rec.data || {};
      const codeMatch = (rec.syncCode || '').toLowerCase().includes(term);
      const dateMatch = (p.sobrietyStartDate || '').toLowerCase().includes(term);
      const sponsorMatch = `${p.sponsorName || ''} ${p.sponsorNumber || ''}`.toLowerCase().includes(term);
      const fellowshipMatch = (p.brotherhoods || []).some((b: any) =>
        (b.brotherhood || '').toLowerCase().includes(term) || (b.id || '').toLowerCase().includes(term)
      );

      return codeMatch || dateMatch || sponsorMatch || fellowshipMatch;
    });
  }, [records, searchTerm]);

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
                <p className="font-mono text-[10px] text-white/50">Admin Access</p>
              </div>
            </div>
            <button
              type="button"
              onClick={returnToApp}
              className="text-white/40 hover:text-white p-1 rounded text-xs"
              title="Return to App"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-white/60 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@example.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full bg-[#111613] border border-[#2d3b31] focus:border-[#4ade80] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none"
              />
            </div>

            {authError && (
              <div className="p-2.5 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="mt-1 w-full py-2 px-4 bg-[#3e6355] hover:bg-[#487363] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Simple Records Table
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0e1310] text-[#e8e6e3] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#141b16]/95 backdrop-blur-sm border-b border-[#233026] px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#212c24] flex items-center justify-center text-[#4ade80] border border-[#3e6355]/30">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-serif text-base text-white">Horizon Backup Records</h1>
            <p className="text-[10px] text-white/40 font-mono">
              Total {records.length} synced accounts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadRecords}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#1a231d] hover:bg-[#233027] border border-[#2e3e32] text-xs text-white/80 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={returnToApp}
            className="px-3 py-1.5 bg-[#1a231d] hover:bg-[#233027] border border-[#2e3e32] text-xs text-white/80 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to App</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-4">
        {/* Simple Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141b16] border border-[#233026] p-3 rounded-xl">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Filter by code, sobriety date, sponsor, or fellowship..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0e1310] border border-[#233026] focus:border-[#4ade80] rounded-lg text-xs text-white placeholder-white/30 focus:outline-none"
            />
          </div>

          <div className="text-xs text-white/50 shrink-0 font-mono">
            Showing <strong className="text-white">{filteredRecords.length}</strong> of {records.length} records
          </div>
        </div>

        {fetchError && (
          <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Table View */}
        <div className="bg-[#141b16] border border-[#233026] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#101612] border-b border-[#233026] text-white/50 text-[10px] uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Sync Code</th>
                  <th className="py-3 px-4">Sobriety Start</th>
                  <th className="py-3 px-4">Fellowships</th>
                  <th className="py-3 px-4">Sponsor</th>
                  <th className="py-3 px-4">Days Logged</th>
                  <th className="py-3 px-4">Last Synced</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b251e]">
                {isLoading && records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/40 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-[#4ade80] rounded-full animate-spin" />
                        <span>Loading database records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/40 text-xs">
                      {searchTerm ? 'No records match your filter query.' : 'No backup records in database yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const p = rec.data || {};
                    const fellowships = (p.brotherhoods || []).map((b: any) => b.brotherhood).filter(Boolean);
                    const daysCount = p.dailyActivities ? Object.keys(p.dailyActivities).length : 0;
                    const isCopied = copiedCode === rec.syncCode;

                    return (
                      <tr
                        key={rec.syncCode}
                        className="hover:bg-[#18221b] transition-colors"
                      >
                        {/* Sync Code */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-[#86efac] tracking-wider">
                            {rec.syncCode}
                          </span>
                        </td>

                        {/* Sobriety Start Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-white font-medium">
                          {p.sobrietyStartDate || <span className="text-white/30 italic">Not set</span>}
                        </td>

                        {/* Fellowships */}
                        <td className="py-3 px-4">
                          {fellowships.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {fellowships.map((f: string, i: number) => (
                                <span
                                  key={i}
                                  className="bg-[#1c2820] text-white/80 border border-[#2c3d2f] text-[10px] px-1.5 py-0.5 rounded"
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
                            <span className="text-white">
                              {p.sponsorName}
                              {p.sponsorNumber && (
                                <span className="text-white/50 text-[11px] ml-1 font-mono">
                                  ({p.sponsorNumber})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-white/30 italic">None</span>
                          )}
                        </td>

                        {/* Activity Days */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-white/70">
                          {daysCount > 0 ? `${daysCount} days` : <span className="text-white/30 italic">0</span>}
                        </td>

                        {/* Last Synced */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-white/50 text-[11px]">
                          {rec.updatedAt ? new Date(rec.updatedAt).toLocaleString() : 'Unknown'}
                        </td>

                        {/* Quick Copy Action */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => copyCode(rec.syncCode)}
                            className="px-2.5 py-1 bg-[#1e2c22] hover:bg-[#283b2e] border border-[#3e6355]/40 text-white rounded text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copy sync code to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-white/60" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
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
    </div>
  );
};

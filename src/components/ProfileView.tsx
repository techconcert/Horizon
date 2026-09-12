/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSanctuary, formatLocalDateToYMD, parseSobrietyDateSafely, formatAccumulatedTime, calculateTimeGrounded } from '../context/SanctuaryContext';
import {
  Calendar,
  Lock,
  Globe,
  RefreshCw,
  User,
  Shield,
  CheckCircle,
  Database,
  ArrowRight,
  HeartHandshake,
  Phone,
  Video,
  BrainCircuit,
  Copy,
  Check,
  Cloud,
  CloudDownload,
  CloudUpload,
  Loader2,
  Users,
  Plus,
  Trash2
} from 'lucide-react';
import { forceClearCacheAndReload } from '../utils/versionCheck';

const FELLOWSHIP_OPTIONS: Record<'English' | 'Español' | 'Português', string[]> = {
  English: ['AA', 'NA', 'CA', 'CMA', 'MA', 'OA', 'GA', 'SLAA', 'SA', 'DA', 'Other'],
  Español: ['AA', 'NA', 'CA', 'CMA', 'MA', 'OA', 'GA', 'SLAA', 'SA', 'DA', 'Otro'],
  Português: ['AA', 'NA', 'CA', 'CMA', 'MA', 'CCA', 'JA', 'DASA', 'SA', 'DA', 'Outro'],
};

interface FellowshipTranslation {
  English: string;
  Español: string;
  Português: string;
}

const FELLOWSHIP_TRANSLATIONS: FellowshipTranslation[] = [
  { English: 'AA', Español: 'AA', Português: 'AA' },
  { English: 'NA', Español: 'NA', Português: 'NA' },
  { English: 'CA', Español: 'CA', Português: 'CA' },
  { English: 'CMA', Español: 'CMA', Português: 'CMA' },
  { English: 'MA', Español: 'MA', Português: 'MA' },
  { English: 'OA', Español: 'OA', Português: 'CCA' },
  { English: 'GA', Español: 'GA', Português: 'JA' },
  { English: 'SLAA', Español: 'SLAA', Português: 'DASA' },
  { English: 'SA', Español: 'SA', Português: 'SA' },
  { English: 'DA', Español: 'DA', Português: 'DA' },
  { English: 'Al-Anon', Español: 'Al-Anon', Português: 'Al-Anon' },
  { English: 'Alateen', Español: 'Alateen', Português: 'Alateen' },
  { English: 'CoDA', Español: 'CoDA', Português: 'CoDA' },
  { English: 'ACA', Español: 'ACA', Português: 'ACA' },
  { English: 'Other', Español: 'Otro', Português: 'Outro' },
];

/**
 * Translates fellowship abbreviations dynamically across languages.
 * E.g., SLAA in English/Spanish translates to DASA in Portuguese,
 * OA translates to CCA, and GA translates to JA.
 */
export function translateFellowship(
  code: string,
  targetLang: 'English' | 'Español' | 'Português'
): string {
  if (!code) return code;
  const trimmed = code.trim();
  const upper = trimmed.toUpperCase();

  for (const item of FELLOWSHIP_TRANSLATIONS) {
    if (
      item.English.toUpperCase() === upper ||
      item.Español.toUpperCase() === upper ||
      item.Português.toUpperCase() === upper
    ) {
      return item[targetLang];
    }
  }

  // Handle alternate variations
  if (upper === 'ASAA') {
    return targetLang === 'Português' ? 'DASA' : 'SLAA';
  }

  return trimmed;
}

const SHORT_MONTHS: Record<'English' | 'Español' | 'Português', string[]> = {
  English: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  Español: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  Português: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
};

/**
 * Formats a date string into a compact DD MMM YYYY format (e.g. 12 Jul 2026)
 * to maintain clean alignment and prevent overflowing or wrapping in tight rows.
 */
export const formatShortDate = (
  dateStr: string,
  lang: 'English' | 'Español' | 'Português' = 'English'
): string => {
  if (!dateStr) return '';
  const parsed = parseSobrietyDateSafely(dateStr);
  if (!parsed || isNaN(parsed.getTime())) return dateStr;

  const day = String(parsed.getDate()).padStart(2, '0');
  const monthIdx = parsed.getMonth();
  const year = parsed.getFullYear();
  const monthStr = SHORT_MONTHS[lang]?.[monthIdx] || SHORT_MONTHS.English[monthIdx];

  return `${day} ${monthStr} ${year}`;
};

export const ProfileView: React.FC = () => {
  const [isClearingCache, setIsClearingCache] = useState(false);
  const {
    state,
    setSobrietyStartDate,
    setLanguage,
    setBiometricLock,
    setSyncEnabled,
    getTranslation,
    timeGroundedString,
    setSupportNumber,
    setSponsorName,
    setSponsorNumber,
    setSupportLink,
    syncCode,
    lastCloudSync,
    cloudQuotaExceeded,
    syncToCloud,
    restoreFromSyncCode,
    addBrotherhood,
    deleteBrotherhood
  } = useSanctuary();

  const [dateInput, setDateInput] = useState(() => {
    // Format sobrietyStartDate as YYYY-MM-DD for standard html date input
    if (!state.sobrietyStartDate) return '';
    const d = parseSobrietyDateSafely(state.sobrietyStartDate);
    return d ? formatLocalDateToYMD(d) : '';
  });

  const milestoneDateRef = useRef<HTMLInputElement>(null);
  const brotherhoodDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.sobrietyStartDate) {
      const d = parseSobrietyDateSafely(state.sobrietyStartDate);
      if (d) {
        setDateInput(formatLocalDateToYMD(d));
      }
    } else {
      setDateInput('');
    }
  }, [state.sobrietyStartDate]);

  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Brotherhoods / Fellowships State
  const [selectedBrotherhood, setSelectedBrotherhood] = useState<string>('AA');
  const [customBrotherhoodInput, setCustomBrotherhoodInput] = useState<string>('');
  const [brotherhoodDateInput, setBrotherhoodDateInput] = useState<string>(() => formatLocalDateToYMD());
  const [brotherhoodSavedNotify, setBrotherhoodSavedNotify] = useState<boolean>(false);

  // Automatically update selected fellowship abbreviation when user switches languages (e.g. SLAA -> DASA)
  useEffect(() => {
    setSelectedBrotherhood((prev) => translateFellowship(prev, state.language));
  }, [state.language]);

  const isOtherSelected =
    selectedBrotherhood === 'Other' ||
    selectedBrotherhood === 'Otro' ||
    selectedBrotherhood === 'Outro';

  const handleAddBrotherhood = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isOtherSelected
      ? customBrotherhoodInput.trim()
      : selectedBrotherhood.trim();

    if (!finalName) return;
    if (!brotherhoodDateInput) return;

    addBrotherhood(finalName, brotherhoodDateInput);
    if (isOtherSelected) {
      setCustomBrotherhoodInput('');
    }
    setBrotherhoodSavedNotify(true);
    setTimeout(() => setBrotherhoodSavedNotify(false), 2500);
  };

  // Firestore Sync States
  const [remoteSyncCodeInput, setRemoteSyncCodeInput] = useState('');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isCloudRestoring, setIsCloudRestoring] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleCopySyncCode = () => {
    if (syncCode) {
      navigator.clipboard.writeText(syncCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleManualSync = async () => {
    setIsCloudSyncing(true);
    setCloudMessage(null);
    const success = await syncToCloud();
    setIsCloudSyncing(false);
    if (success) {
      setCloudMessage({
        type: 'success',
        text: state.language === 'Português' ? 'Dados sincronizados com sucesso na nuvem!' : state.language === 'Español' ? '¡Datos sincronizados con éxito en la nube!' : 'Data synced successfully to the cloud!'
      });
    } else {
      if (cloudQuotaExceeded) {
        setCloudMessage({
          type: 'info',
          text: state.language === 'Português'
            ? 'Limite diário da nuvem atingido. Seus dados estão seguros e salvos neste dispositivo.'
            : state.language === 'Español'
            ? 'Límite diario de la nube alcanzado. Tus datos están seguros y guardados en este dispositivo.'
            : 'Daily cloud limit reached. Your recovery data is safely saved on this device.'
        });
      } else {
        setCloudMessage({
          type: 'error',
          text: state.language === 'Português' ? 'Falha ao sincronizar com a nuvem' : state.language === 'Español' ? 'Error al sincronizar con la nube' : 'Failed to sync to cloud'
        });
      }
    }
    setTimeout(() => setCloudMessage(null), 5000);
  };

  const handleRestoreRemoteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteSyncCodeInput.trim()) return;

    setIsCloudRestoring(true);
    setCloudMessage(null);
    const res = await restoreFromSyncCode(remoteSyncCodeInput.trim());
    setIsCloudRestoring(false);
    if (res.success) {
      setRemoteSyncCodeInput('');
      setCloudMessage({
        type: 'success',
        text: state.language === 'Português' ? 'Dados restaurados com sucesso!' : state.language === 'Español' ? '¡Datos restaurados con éxito!' : 'Records successfully restored!'
      });
    } else {
      setCloudMessage({
        type: 'error',
        text: res.error || (state.language === 'Português' ? 'Código de sincronização não encontrado' : state.language === 'Español' ? 'Código de sincronización no encontrado' : 'Sync code not found')
      });
    }
    setTimeout(() => setCloudMessage(null), 5000);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateInput(val);
    if (val) {
      const [y, m, d] = val.split('-').map(Number);
      const oldDate = state.sobrietyStartDate ? parseSobrietyDateSafely(state.sobrietyStartDate) : null;
      const hours = oldDate ? oldDate.getHours() : 0;
      const minutes = oldDate ? oldDate.getMinutes() : 0;
      const newDate = new Date(y, m - 1, d, hours, minutes, 0, 0);
      setSobrietyStartDate(newDate.toISOString());

      setIsSavedNotify(true);
      setTimeout(() => setIsSavedNotify(false), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Cumulative Progress Card */}
      <section className="bg-black text-white rounded-3xl p-5 md:p-6 shadow-none relative overflow-hidden text-center">
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-white/60">
            {getTranslation('cumulative_progress')}
          </span>
          <h2 className="font-serif text-xl md:text-2xl font-normal mt-1 leading-snug">
            {formatAccumulatedTime(timeGroundedString, state.language)}
          </h2>
        </div>
      </section>

      {/* Profile Settings Bento Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto w-full">
        {/* Sobriety Reset/Update Settings */}
        <article className="bg-white rounded-3xl p-4 border border-black/10 shadow-none flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center gap-2 text-[#143224] mb-2">
              <Calendar className="w-4 h-4 shrink-0" />
              <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {state.language === 'English' ? 'Configure Horizon Milestone' : state.language === 'Español' ? 'Configurar Hito de Horizon' : 'Configurar Marco do Horizon'}
              </h3>
            </div>
            <p className="font-sans text-xs text-black/60 leading-relaxed mb-3">
              {state.language === 'English'
                ? 'Adjust your sobriety date for your accumulate progress.'
                : state.language === 'Español'
                ? 'Ajusta tu fecha de sobriedad para tu progreso acumulado.'
                : 'Ajuste sua data de sobriedade para o seu progresso acumulado.'}
            </p>
          </div>

          <div className="relative w-full min-w-0 max-w-full">
            <input
              ref={milestoneDateRef}
              type="date"
              value={dateInput}
              onChange={handleDateChange}
              max={formatLocalDateToYMD()}
              onClick={() => {
                try {
                  milestoneDateRef.current?.showPicker?.();
                } catch {}
              }}
              className="w-full min-w-0 max-w-full box-border bg-[#F8F5F2] border border-black/15 rounded-2xl p-3 pr-11 font-sans text-xs focus:outline-none focus:border-black text-[#111111] uppercase font-bold tracking-wider block cursor-pointer"
            />
            <div
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center text-black/60 pointer-events-none"
              aria-hidden="true"
            >
              <Calendar className="w-4 h-4" />
            </div>
            {isSavedNotify && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 text-black font-sans text-[9px] font-bold animate-fadeIn bg-[#F8F5F2] px-2 py-0.5 rounded-lg border border-black/5 shadow-2xs pointer-events-none">
                <CheckCircle className="w-3.5 h-3.5 fill-current text-green-700" />
                <span>{state.language === 'English' ? 'SAVED' : state.language === 'Español' ? 'GUARDADO' : 'SALVO'}</span>
              </div>
            )}
          </div>
        </article>

        {/* Bilingual Language Selection */}
        <article className="bg-white rounded-3xl p-4 border border-black/10 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#143224] mb-2">
              <Globe className="w-4 h-4" />
              <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {getTranslation('language')}
              </h3>
            </div>
            <p className="font-sans text-xs text-black/60 leading-relaxed mb-3">
              {state.language === 'English'
                ? 'Select your primary language preference.'
                : state.language === 'Español'
                ? 'Selecciona tu preferencia de idioma.'
                : 'Selecione a sua preferência de idioma principal.'}
            </p>
          </div>

          <div className="flex items-center justify-between bg-[#F8F5F2] p-3 rounded-2xl border border-black/10">
            <span className="font-sans text-xs font-bold text-black/75">
              {getTranslation('language')}
            </span>
            <select
              value={state.language}
              onChange={e => setLanguage(e.target.value as any)}
              className="bg-white border border-black/15 rounded-full px-3 py-1.5 text-xs font-bold text-[#111111] focus:outline-none cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Português">Português</option>
              <option value="Español">Español</option>
            </select>
          </div>
        </article>

        {/* Brotherhood & Fellowships Selection Card (Unlimited list with entrance date / 'ingresso') */}
        <article className="bg-white rounded-3xl p-4 md:p-5 border border-black/10 shadow-none flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center gap-2 text-[#143224] mb-2">
              <Users className="w-4 h-4" />
              <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {state.language === 'Português'
                  ? 'Irmandades de Recuperação'
                  : state.language === 'Español'
                  ? 'Comunidades y Confraternidades'
                  : 'Brotherhoods & Fellowships'}
              </h3>
            </div>

            <p className="font-sans text-xs text-black/60 leading-relaxed mb-4">
              {state.language === 'Português'
                ? 'Selecione uma irmandade e registre sua data de ingresso. Você pode acompanhar várias irmandades.'
                : state.language === 'Español'
                ? 'Selecciona una confraternidad y registra tu fecha de ingreso. Puedes registrar múltiples confraternidades.'
                : 'Select a fellowship and record your entrance date. You can track multiple fellowships.'}
            </p>

            {/* Brotherhood Add Form */}
            <form onSubmit={handleAddBrotherhood} className="bg-[#FAF8F5] border border-black/10 rounded-2xl p-3 sm:p-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                {/* Brotherhood Selector */}
                <div className="flex-1 min-w-[140px]">
                  <label className="font-sans text-[10px] font-bold text-black/60 uppercase tracking-widest block mb-1">
                    {state.language === 'Português'
                      ? 'Irmandade'
                      : state.language === 'Español'
                      ? 'Confraternidad'
                      : 'Brotherhood'}
                  </label>
                  <select
                    value={selectedBrotherhood}
                    onChange={(e) => setSelectedBrotherhood(e.target.value)}
                    className="w-full bg-white border border-black/15 rounded-2xl p-2.5 font-sans text-xs font-bold text-[#111111] focus:outline-none focus:border-black cursor-pointer uppercase tracking-wider"
                  >
                    {(FELLOWSHIP_OPTIONS[state.language] || FELLOWSHIP_OPTIONS.English).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Brotherhood Name if 'Other' chosen */}
                {isOtherSelected && (
                  <div className="flex-1 min-w-[140px] animate-fadeIn">
                    <label className="font-sans text-[10px] font-bold text-black/60 uppercase tracking-widest block mb-1">
                      {state.language === 'Português'
                        ? 'Nome / Sigla'
                        : state.language === 'Español'
                        ? 'Nombre / Sigla'
                        : 'Name / Abbreviation'}
                    </label>
                    <input
                      type="text"
                      value={customBrotherhoodInput}
                      onChange={(e) => setCustomBrotherhoodInput(e.target.value)}
                      placeholder={state.language === 'Português' ? 'ex. SAA, CMA, DRA...' : state.language === 'Español' ? 'ej. SAA, CMA, DRA...' : 'e.g. SAA, CMA, DRA...'}
                      className="w-full bg-white border border-black/15 rounded-2xl p-2.5 font-sans text-xs focus:outline-none focus:border-black text-[#111111] font-bold"
                    />
                  </div>
                )}

                {/* Entrance Date Picker with guaranteed mobile calendar button */}
                <div className="flex-1 min-w-0">
                  <label className="font-sans text-[10px] font-bold text-black/60 uppercase tracking-widest block mb-1">
                    {state.language === 'Português'
                      ? 'Data de ingresso'
                      : state.language === 'Español'
                      ? 'Fecha de ingreso'
                      : 'Entry Date'}
                  </label>
                  <div className="relative w-full min-w-0 max-w-full">
                    <input
                      ref={brotherhoodDateRef}
                      type="date"
                      value={brotherhoodDateInput}
                      onChange={(e) => setBrotherhoodDateInput(e.target.value)}
                      max={formatLocalDateToYMD()}
                      onClick={() => {
                        try {
                          brotherhoodDateRef.current?.showPicker?.();
                        } catch {}
                      }}
                      className="w-full min-w-0 max-w-full box-border bg-white border border-black/15 rounded-2xl p-2.5 pr-10 font-sans text-xs focus:outline-none focus:border-black text-[#111111] uppercase font-bold tracking-wider cursor-pointer"
                    />
                    <div
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-black/60 pointer-events-none"
                      aria-hidden="true"
                    >
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Add button */}
                <button
                  type="submit"
                  disabled={isOtherSelected && !customBrotherhoodInput.trim()}
                  className="bg-[#183628] hover:bg-[#254d3b] text-white font-sans text-xs font-bold px-4 py-2.5 rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {state.language === 'Português'
                      ? 'Adicionar'
                      : state.language === 'Español'
                      ? 'Agregar'
                      : 'Add'}
                  </span>
                </button>
              </div>

              {brotherhoodSavedNotify && (
                <div className="mt-2 text-emerald-800 font-sans text-[11px] font-bold flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {state.language === 'Português'
                      ? 'Irmandade adicionada com sucesso!'
                      : state.language === 'Español'
                      ? '¡Confraternidad agregada con éxito!'
                      : 'Fellowship added successfully!'}
                  </span>
                </div>
              )}
            </form>

            {/* Fellowship List (No limit) */}
            {state.brotherhoods && state.brotherhoods.length > 0 ? (
              <div className="flex flex-col gap-2.5 mt-4">
                {state.brotherhoods.map((entry) => {
                  const timeInFellowship = calculateTimeGrounded(entry.entryDate);
                  const formattedTime = formatAccumulatedTime(timeInFellowship, state.language);
                  const displayDate = formatShortDate(entry.entryDate, state.language);
                  const localizedAbbreviation = translateFellowship(entry.brotherhood, state.language);

                  return (
                    <div
                      key={entry.id}
                      className="bg-[#F8F5F2] border border-black/10 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="font-mono text-[11px] sm:text-xs font-black tracking-wider bg-black text-white w-16 sm:w-20 py-1.5 rounded-xl shrink-0 uppercase shadow-2xs text-center flex items-center justify-center whitespace-nowrap">
                          {localizedAbbreviation}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-sans text-[10px] font-bold text-black/50 uppercase tracking-wider truncate">
                            {state.language === 'Português'
                              ? 'Data de ingresso:'
                              : state.language === 'Español'
                              ? 'Fecha de ingreso:'
                              : 'Entry date:'}{' '}
                            <span className="text-black/80 font-semibold">{displayDate}</span>
                          </span>
                          <span className="font-serif text-sm text-[#143224] font-semibold mt-0.5 truncate">
                            {formattedTime}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteBrotherhood(entry.id)}
                        className="p-2 text-black/35 hover:text-red-600 hover:bg-black/5 rounded-xl transition-colors cursor-pointer shrink-0"
                        title={state.language === 'Português' ? 'Remover irmandade' : state.language === 'Español' ? 'Eliminar confraternidad' : 'Remove fellowship'}
                        aria-label={state.language === 'Português' ? 'Remover irmandade' : state.language === 'Español' ? 'Eliminar confraternidad' : 'Remove fellowship'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#FAF8F5] rounded-2xl p-3.5 text-center border border-dashed border-black/15 mt-3">
                <p className="font-sans text-xs text-black/50">
                  {state.language === 'Português'
                    ? 'Nenhuma irmandade adicionada ainda. Selecione uma opção acima para registrar sua data de ingresso.'
                    : state.language === 'Español'
                    ? 'Aún no has agregado confraternidades. Selecciona una arriba para registrar tu fecha de ingreso.'
                    : 'No fellowships added yet. Select a fellowship above to record your entrance date.'}
                </p>
              </div>
            )}
          </div>
        </article>

        {/* Support Settings & Contacts Card */}
        <article className="bg-white rounded-3xl p-4 border border-black/10 shadow-none flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center gap-2 text-[#143224] mb-2">
              <HeartHandshake className="w-4 h-4" />
              <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {state.language === 'English'
                  ? 'Reach Out & Support Contacts'
                  : state.language === 'Español'
                  ? 'Contactos de Apoyo y SOS'
                  : 'Contatos de Apoio e SOS'}
              </h3>
            </div>
            <p className="font-sans text-xs text-black/60 leading-relaxed mb-4">
              {state.language === 'English'
                ? 'Customize your preferred helpline, sponsor, and video conference links. These will instantly populate your "Reach Out" support panel.'
                : state.language === 'Español'
                ? 'Personaliza tu línea de ayuda, padrino y enlaces de videoconferencia. Estos se mostrarán al presionar "Pedir Apoyo".'
                : 'Personalize sua linha de apoio, padrinho/madrinha e links de videoconferência. Estes serão mostrados ao clicar em "Pedir Apoio".'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Support Helpline */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[10px] font-bold text-black/60 uppercase tracking-widest">
                  {state.language === 'English' ? 'Support Helpline Number' : state.language === 'Español' ? 'Línea de Ayuda' : 'Linha de Apoio'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40" />
                  <input
                    type="text"
                    value={state.supportNumber}
                    onChange={(e) => setSupportNumber(e.target.value)}
                    placeholder="e.g. 988"
                    className="w-full bg-[#F8F5F2] border border-black/15 rounded-2xl pl-10 pr-3.5 py-2.5 font-sans text-xs focus:outline-none focus:border-black text-[#111111]"
                  />
                </div>
              </div>

              {/* Support Link */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[10px] font-bold text-black/60 uppercase tracking-widest">
                  {state.language === 'English' ? '24/7 Meeting Link (Zoom/Teams)' : state.language === 'Español' ? 'Enlace de Reunión 24/7 (Zoom/Teams)' : 'Link de Reunião 24/7 (Zoom/Teams)'}
                </label>
                <div className="relative">
                  <Video className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40" />
                  <input
                    type="url"
                    value={state.supportLink || ''}
                    onChange={(e) => setSupportLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="w-full bg-[#F8F5F2] border border-black/15 rounded-2xl pl-10 pr-3.5 py-2.5 font-sans text-xs focus:outline-none focus:border-black text-[#111111]"
                  />
                </div>
              </div>

              {/* Sponsor Name */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[10px] font-bold text-black/60 uppercase tracking-widest">
                  {state.language === 'English' ? 'Sponsor Name' : state.language === 'Español' ? 'Nombre del Padrino' : 'Nome do Padrinho / Madrinha'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40" />
                  <input
                    type="text"
                    value={state.sponsorName || ''}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder={state.language === 'English' ? 'Sponsor name' : state.language === 'Español' ? 'Nombre del padrino' : 'Nome do padrinho/madrinha'}
                    className="w-full bg-[#F8F5F2] border border-black/15 rounded-2xl pl-10 pr-3.5 py-2.5 font-sans text-xs focus:outline-none focus:border-black text-[#111111]"
                  />
                </div>
              </div>

              {/* Sponsor Phone */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[10px] font-bold text-black/60 uppercase tracking-widest">
                  {state.language === 'English' ? 'Sponsor Phone Number' : state.language === 'Español' ? 'Teléfono del Padrino' : 'Telefone do Padrinho / Madrinha'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40" />
                  <input
                    type="text"
                    value={state.sponsorNumber || ''}
                    onChange={(e) => setSponsorNumber(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full bg-[#F8F5F2] border border-black/15 rounded-2xl pl-10 pr-3.5 py-2.5 font-sans text-xs focus:outline-none focus:border-black text-[#111111]"
                  />
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Anonymous Cloud Sync & Sync Code Section */}
      <section className="bg-white p-5 rounded-3xl border border-black/10 shadow-none max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-black/10">
          <div>
            <div className="flex items-center gap-2 text-[#143224] mb-1">
              <Cloud className="w-4 h-4" />
              <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {state.language === 'English' ? 'Anonymous Cloud Sync & Multi-Device' : state.language === 'Español' ? 'Sincronización Anónima en la Nube' : 'Sincronização Anônima na Nuvem'}
              </h3>
            </div>
            <p className="font-sans text-xs text-black/60 leading-relaxed max-w-xl">
              {state.language === 'English'
                ? 'Your recovery data is privately synced to Google Cloud Firestore using an anonymous device code. Use this code to access your progress across devices or transfer from the previous domain without needing an account.'
                : state.language === 'Español'
                ? 'Tus datos de recuperación se sincronizan de forma privada con Google Cloud Firestore mediante un código anónimo. Úsalo para acceder a tu progreso en varios dispositivos o transferir desde el sitio anterior sin necesidad de cuenta.'
                : 'Seus dados de recuperação são sincronizados privadamente com o Google Cloud Firestore usando um código anônimo. Use este código para acessar seu progresso em outros aparelhos ou transferir do site anterior sem precisar de conta.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={handleManualSync}
              disabled={isCloudSyncing}
              className="bg-[#EAE5DF] hover:bg-[#E0D8D0] text-black font-sans text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-full border border-black/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isCloudSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              <span>{state.language === 'English' ? 'Sync to Cloud Now' : state.language === 'Español' ? 'Sincronizar Ahora' : 'Sincronizar Agora'}</span>
            </button>
          </div>
        </div>

        {cloudQuotaExceeded && (
          <div className="mt-3 p-3 rounded-2xl text-xs font-sans font-medium flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200">
            <Shield className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              {state.language === 'English'
                ? 'Daily cloud backup limit reached. Local offline storage is active and protecting your data.'
                : state.language === 'Español'
                ? 'Límite diario de nube alcanzado. El almacenamiento local está activo y protegiendo tus datos.'
                : 'Limite diário de nuvem atingido. O armazenamento local está ativo e protegendo seus dados.'}
            </span>
          </div>
        )}

        {cloudMessage && (
          <div className={`mt-3 p-3 rounded-2xl text-xs font-sans font-medium flex items-center gap-2 animate-fadeIn ${
            cloudMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : cloudMessage.type === 'info'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {cloudMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <Shield className="w-4 h-4 shrink-0" />}
            <span>{cloudMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-1">
          {/* Active Device Sync Code Card */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-black/10 flex flex-col justify-between">
            <div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-black/50 block mb-1">
                {state.language === 'English' ? 'Your Current Sync Code' : state.language === 'Español' ? 'Tu Código de Sincronización' : 'Seu Código de Sincronização'}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold tracking-widest text-black bg-white px-3 py-1.5 rounded-xl border border-black/10">
                  {syncCode}
                </span>
                <button
                  onClick={handleCopySyncCode}
                  className="bg-black text-white hover:bg-black/80 p-2 rounded-xl transition-colors cursor-pointer"
                  title={state.language === 'English' ? 'Copy Sync Code' : 'Copiar Código'}
                >
                  {codeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="font-sans text-[11px] text-black/60 mt-2">
                {lastCloudSync 
                  ? `${state.language === 'Português' ? 'Última sincronização na nuvem:' : state.language === 'Español' ? 'Última sincronización:' : 'Last cloud sync:'} ${new Date(lastCloudSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : (state.language === 'Português' ? 'Sincronizado automaticamente com Firestore' : state.language === 'Español' ? 'Sincronizado automáticamente con Firestore' : 'Auto-synced with Firestore')}
              </p>
            </div>
          </div>

          {/* Retrieve / Pair with Another Code */}
          <form onSubmit={handleRestoreRemoteCode} className="bg-[#FAF8F5] p-4 rounded-2xl border border-black/10 flex flex-col justify-between">
            <div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-black/50 block mb-1">
                {state.language === 'English' ? 'Restore from Sync Code' : state.language === 'Español' ? 'Restaurar desde Código' : 'Restaurar por Código'}
              </span>
              <p className="font-sans text-[11px] text-black/60 mb-2">
                {state.language === 'English'
                  ? 'Enter the 6-character code from your old domain or another device:'
                  : state.language === 'Español'
                  ? 'Introduce el código de 6 caracteres de tu otro dispositivo o dominio anterior:'
                  : 'Digite o código de 6 caracteres do site anterior ou de outro dispositivo:'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="text"
                  value={remoteSyncCodeInput}
                  onChange={(e) => setRemoteSyncCodeInput(e.target.value.toUpperCase())}
                  placeholder="HZ-XXXX"
                  className="min-w-0 flex-1 w-full bg-white border border-black/20 rounded-xl px-3 py-2 text-xs font-mono uppercase tracking-wider text-black focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  disabled={isCloudRestoring || !remoteSyncCodeInput.trim()}
                  className="w-full sm:w-auto bg-black hover:bg-black/80 text-white font-sans text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 whitespace-nowrap"
                >
                  {isCloudRestoring ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudDownload className="w-3.5 h-3.5" />
                  )}
                  <span>{state.language === 'Português' ? 'Recuperar' : state.language === 'Español' ? 'Recuperar' : 'Retrieve'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* App License & Version Footer */}
      <footer className="text-center py-4 text-xs font-sans text-black/40 space-y-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <p className="font-medium text-black/50">Horizon v2.2.4</p>
          <span className="hidden sm:inline text-black/20">•</span>
          <button
            type="button"
            onClick={async () => {
              setIsClearingCache(true);
              await forceClearCacheAndReload();
            }}
            disabled={isClearingCache}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-black/60 hover:text-black transition-colors underline cursor-pointer disabled:opacity-50"
          >
            {isClearingCache ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            <span>
              {state.language === 'Español'
                ? 'Forzar actualización y vaciar caché'
                : state.language === 'Português'
                ? 'Forçar atualização e limpar cache'
                : 'Force update & clear cache'}
            </span>
          </button>
        </div>
        <p>
          {state.language === 'Español' ? 'Software libre bajo licencia GNU GPLv3' : state.language === 'Português' ? 'Software livre sob licença GNU GPLv3' : 'Free & Open Source Software under GNU GPLv3'}
        </p>
      </footer>
    </div>
  );
};

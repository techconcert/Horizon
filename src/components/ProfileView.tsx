/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect } from 'react';
import { useSanctuary, formatLocalDateToYMD, parseSobrietyDateSafely, formatAccumulatedTime } from '../context/SanctuaryContext';
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
  Loader2
} from 'lucide-react';

export const ProfileView: React.FC = () => {
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
    restoreFromSyncCode
  } = useSanctuary();

  const [dateInput, setDateInput] = useState(() => {
    // Format sobrietyStartDate as YYYY-MM-DD for standard html date input
    if (!state.sobrietyStartDate) return '';
    const d = parseSobrietyDateSafely(state.sobrietyStartDate);
    return d ? formatLocalDateToYMD(d) : '';
  });

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
      <section className="bg-black text-white rounded-3xl p-4 md:p-5 shadow-none relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F8F5F2]/10 border border-[#F8F5F2]/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-white/60">
                {getTranslation('cumulative_progress')}
              </span>
              <h2 className="font-serif text-xl md:text-2xl font-normal mt-0.5 leading-snug">
                {formatAccumulatedTime(timeGroundedString, state.language)}
              </h2>
              <p className="font-sans text-xs text-white/75 mt-0.5 leading-relaxed italic">
                {getTranslation('sanctuary_secure')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Settings Bento Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto w-full">
        {/* Sobriety Reset/Update Settings */}
        <article className="bg-white rounded-3xl p-4 border border-black/10 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-950 mb-2">
              <Calendar className="w-4 h-4" />
              <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {state.language === 'English' ? 'Configure Horizon Milestone' : state.language === 'Español' ? 'Configurar Hito de Horizon' : 'Configurar Marco do Horizon'}
              </h3>
            </div>
            <p className="font-sans text-xs text-black/60 leading-relaxed mb-3">
              {state.language === 'English'
                ? 'Adjust your sobriety date and starting time to accurately synchronize your grounding clock and cumulative milestones.'
                : state.language === 'Español'
                ? 'Ajusta tu fecha de sobriedad y la hora de inicio para sincronizar con precisión tu reloj y tus logros acumulativos.'
                : 'Ajuste sua data de sobriedade e hora de início para sincronizar com precisão o seu relógio e marcos acumulativos.'}
            </p>
          </div>

          <div className="relative w-full max-w-full min-w-0 box-border">
            <input
              type="date"
              value={dateInput}
              onChange={handleDateChange}
              max={formatLocalDateToYMD()}
              className="w-full max-w-full min-w-0 box-border bg-[#F8F5F2] border border-black/15 rounded-2xl p-3 font-sans text-xs focus:outline-none focus:border-black text-[#111111] uppercase font-bold tracking-wider block appearance-none"
            />
            {isSavedNotify && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-black font-sans text-[9px] font-bold animate-fadeIn bg-[#F8F5F2] px-2 py-0.5 rounded-lg border border-black/5">
                <CheckCircle className="w-3.5 h-3.5 fill-current text-green-700" />
                <span>{state.language === 'English' ? 'SAVED' : state.language === 'Español' ? 'GUARDADO' : 'SALVO'}</span>
              </div>
            )}
          </div>
        </article>



        {/* Bilingual Language Selection */}
        <article className="bg-white rounded-3xl p-4 border border-black/10 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-900 mb-2">
              <Globe className="w-4 h-4" />
              <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest">
                {getTranslation('preferences')}
              </h3>
            </div>
            <p className="font-sans text-xs text-black/60 leading-relaxed mb-3">
              {state.language === 'English'
                ? 'Select your primary language preference. The system automatically translates all features, lessons, and prompts.'
                : state.language === 'Español'
                ? 'Selecciona tu preferencia de idioma. El sistema traduce automáticamente todas las funciones, lecciones e indicaciones.'
                : 'Selecione a sua preferência de idioma principal. O sistema traduz automaticamente todas as funções, lições e comandos.'}
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



        {/* Support Settings & Contacts Card */}
        <article className="bg-white rounded-3xl p-4 border border-black/10 shadow-none flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center gap-2 text-red-900 mb-2">
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
                ? 'Customize your preferred helpline, sponsor (Padrinho/Madrinha), and video conference links. These will instantly populate your "Reach Out" support panel.'
                : state.language === 'Español'
                ? 'Personaliza tu línea de ayuda, patrocinador (Padrinho/Madrinha) y enlaces de videoconferencia. Estos se mostrarán al presionar "Pedir Apoyo".'
                : 'Personalize sua linha de ajuda, patrocinador (Padrinho/Madrinha) e links de videoconferência. Estes serão mostrados ao clicar em "Pedir Apoio".'}
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
                  {state.language === 'English' ? 'Sponsor Name' : state.language === 'Español' ? 'Nombre del Patrocinador' : 'Nome do Padrinho / Madrinha'}
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
                  {state.language === 'English' ? 'Sponsor Phone Number' : state.language === 'Español' ? 'Teléfono del Patrocinador' : 'Telefone do Padrinho / Madrinha'}
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
            <div className="flex items-center gap-2 text-amber-950 mb-1">
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
      <footer className="text-center py-4 text-xs font-sans text-black/40 space-y-0.5">
        <p className="font-medium text-black/50">Horizon v2.1.18</p>
        <p>
          {state.language === 'Español' ? 'Software libre bajo licencia GNU GPLv3' : state.language === 'Português' ? 'Software livre sob licença GNU GPLv3' : 'Free & Open Source Software under GNU GPLv3'}
        </p>
      </footer>
    </div>
  );
};

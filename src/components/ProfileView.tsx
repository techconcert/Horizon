/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSanctuary } from '../context/SanctuaryContext';
import {
  Calendar,
  Lock,
  Globe,
  RefreshCw,
  Download,
  Upload,
  User,
  Shield,
  CheckCircle,
  Database,
  ArrowRight,
  HeartHandshake,
  Phone,
  Video,
  BrainCircuit
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
    seed90DaysData
  } = useSanctuary();

  const [dateInput, setDateInput] = useState(() => {
    // Format sobrietyStartDate as YYYY-MM-DD for standard html date input
    const d = new Date(state.sobrietyStartDate);
    return d.toISOString().split('T')[0];
  });

  const [isSavedNotify, setIsSavedNotify] = useState(false);
  const [importError, setImportError] = useState('');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateInput(val);
    if (val) {
      // Keep existing hours/minutes offsets
      const oldDate = new Date(state.sobrietyStartDate);
      const newDate = new Date(val);
      newDate.setHours(oldDate.getHours());
      newDate.setMinutes(oldDate.getMinutes());
      setSobrietyStartDate(newDate.toISOString());

      setIsSavedNotify(true);
      setTimeout(() => setIsSavedNotify(false), 2500);
    }
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      sobrietyStartDate: state.sobrietyStartDate,
      reflections: state.reflections,
      customMoods: state.customMoods,
      settings: {
        language: state.language,
        biometricLock: state.biometricLock,
        syncEnabled: state.syncEnabled
      }
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'horizon-journal-export.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.sobrietyStartDate) localStorage.setItem('sobrietyStartDate', parsed.sobrietyStartDate);
        if (parsed.reflections) localStorage.setItem('reflections', JSON.stringify(parsed.reflections));
        if (parsed.customMoods) localStorage.setItem('customMoods', JSON.stringify(parsed.customMoods));
        if (parsed.settings) {
          if (parsed.settings.language) localStorage.setItem('language', parsed.settings.language);
          if (parsed.settings.biometricLock !== undefined) localStorage.setItem('biometricLock', String(parsed.settings.biometricLock));
          if (parsed.settings.syncEnabled !== undefined) localStorage.setItem('syncEnabled', String(parsed.settings.syncEnabled));
        }
        setImportError('');
        window.location.reload();
      } catch (err) {
        setImportError(state.language === 'English' ? 'Failed to parse backup file.' : 'No se pudo leer el archivo de copia de seguridad.');
      }
    };
    reader.readAsText(file);
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
                {timeGroundedString.years > 0 && `${timeGroundedString.years} ${state.language === 'English' ? 'Years' : state.language === 'Español' ? 'Años' : 'Anos'}, `}
                {timeGroundedString.months} {state.language === 'English' ? 'Months' : state.language === 'Español' ? 'Meses' : 'Meses'}, {timeGroundedString.days} {state.language === 'English' ? 'Days' : state.language === 'Español' ? 'Días' : 'Dias'}
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
                {state.language === 'English' ? 'Configure Horizon Milestone' : state.language === 'Español' ? 'Configurar Hito de Horizon' : 'Configurar Hito do Horizon'}
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
              max={new Date().toISOString().split('T')[0]}
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
              <option value="Español">Español</option>
              <option value="Português">Português</option>
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

      {/* Downloader Export & Backup Row */}
      <section className="bg-[#E5E1DB] p-4 rounded-3xl border border-black/10 flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full">
        <div className="flex-grow">
          <h4 className="font-serif text-base font-normal text-black mb-0.5">
            {state.language === 'English' ? 'Backup & Migrate Records' : state.language === 'Español' ? 'Copia de Seguridad y Migración' : 'Backup e Migração'}
          </h4>
          <p className="font-sans text-xs text-black/60 leading-relaxed max-w-xl">
            {state.language === 'English'
              ? 'Export your custom reflection history, sobriety logs, and configurations to a JSON file, or import an existing backup to restore your progress.'
              : state.language === 'Español'
              ? 'Exporta tu historial, registros y configuraciones a un archivo JSON, o importa una copia existente para restaurar tu progreso.'
              : 'Exporte o seu histórico, registros e configurações para um arquivo JSON, ou importe um backup existente para restaurar o progresso.'}
          </p>
          {importError && (
            <p className="font-sans text-xs text-red-800 font-semibold mt-2 animate-fadeIn">
              ⚠️ {importError}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          {/* Import Button with Hidden Input */}
          <label className="bg-white hover:bg-[#F8F5F2] text-black border border-black/15 font-sans text-[10px] font-bold tracking-widest uppercase px-5 py-2.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shadow-none select-none">
            <Upload className="w-4 h-4" />
            <span>{state.language === 'English' ? 'Import Backup' : state.language === 'Español' ? 'Importar Copia' : 'Importar Backup'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          {/* Export Button */}
          <button
            onClick={handleExportData}
            className="bg-black hover:bg-black/80 text-[#F8F5F2] font-sans text-[10px] font-bold tracking-widest uppercase px-5 py-2.5 rounded-full border border-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-none"
          >
            <Download className="w-4 h-4" />
            <span>{getTranslation('export_journal')}</span>
          </button>
        </div>
      </section>


    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect } from 'react';
import { useSanctuary } from '../context/SanctuaryContext';
import { detectDefaultLanguage } from '../utils/languageDetection';
import { 
  Globe, 
  Calendar, 
  HeartHandshake, 
  Phone, 
  Link, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Sparkles,
  Compass,
  CloudDownload,
  Loader2,
  AlertCircle
} from 'lucide-react';

const ONBOARD_TRANS = {
  welcome_title: {
    English: 'Welcome to Horizon',
    Español: 'Bienvenido a Horizon',
    Português: 'Bem-vindo ao Horizon'
  },
  welcome_subtitle: {
    English: 'Your private, safe space for reflection, recovery, and mindful daily inventory.',
    Español: 'Tu espacio privado y seguro para la reflexión, recuperación e inventario diario.',
    Português: 'O seu espaço privado e seguro para reflexão, recuperação e inventário diário.'
  },
  step_lang_title: {
    English: 'Choose Your Language',
    Español: 'Elige tu Idioma',
    Português: 'Escolha seu Idioma'
  },
  step_lang_desc: {
    English: 'Select your preferred language.',
    Español: 'Selecciona tu idioma preferido.',
    Português: 'Selecione o seu idioma de preferência.'
  },
  step_date_title: {
    English: 'Set Your Sobriety Milestone',
    Español: 'Establece tu Hito de Sobriedad',
    Português: 'Defina seu Marco de Sobriedade'
  },
  step_date_desc: {
    English: 'When did your journey of mindful grounding begin? This date calculates your personal milestones.',
    Español: '¿Cuándo comenzó tu camino de sobriedad? Esta fecha calcula tus hitos personales.',
    Português: 'Quando começou a sua jornada de sobriedade? Esta data calcula os seus marcos pessoais.'
  },
  step_care_title: {
    English: 'Your Care Circle (Optional)',
    Español: 'Tu Círculo de Apoyo (Opcional)',
    Português: 'Seu Círculo de Apoio (Opcional)'
  },
  step_care_desc: {
    English: 'Add contact numbers or a resource link. These are strictly optional and saved locally on your device.',
    Español: 'Agrega números de contacto o un enlace de ayuda. Son estrictamente opcionales y locales.',
    Português: 'Adicione números de contato ou links de suporte. São estritamente opcionais e locais.'
  },
  continue: {
    English: 'Continue',
    Español: 'Continuar',
    Português: 'Continuar'
  },
  back: {
    English: 'Back',
    Español: 'Atrás',
    Português: 'Voltar'
  },
  complete: {
    English: 'Enter Horizon',
    Español: 'Entrar a Horizon',
    Português: 'Entrar no Horizon'
  },
  today_is: {
    English: 'Today is:',
    Español: 'Hoy es:',
    Português: 'Hoje é:'
  },
  sponsor_label: {
    English: 'Sponsor / Trusted Contact Name',
    Español: 'Nombre del Padrino o Contacto',
    Português: 'Nome do Padrinho ou Contato'
  },
  sponsor_phone: {
    English: 'Sponsor Phone Number',
    Español: 'Teléfono del Padrino',
    Português: 'Telefone do Padrinho'
  },
  helpline_label: {
    English: 'Preferred Helpline / Crisis Number',
    Español: 'Línea de Ayuda Preferida',
    Português: 'Número de Apoio Preferencial'
  },
  support_link_label: {
    English: 'Custom Online Support Resource URL',
    Español: 'Enlace Web de Apoyo Customizado',
    Português: 'Link de Recurso de Suporte Online'
  },
  optional_field: {
    English: 'Optional',
    Español: 'Opcional',
    Português: 'Opcional'
  },
  milestone_preview: {
    English: 'Horizon Milestone Date:',
    Español: 'Fecha del Hito de Horizon:',
    Português: 'Data do Marco de Horizon:'
  }
};

export const OnboardingView: React.FC = () => {
  const { 
    state, 
    setLanguage, 
    setSobrietyStartDate, 
    setSupportNumber, 
    setSponsorName, 
    setSponsorNumber, 
    setSupportLink,
    setOnboarded,
    restoreFromSyncCode
  } = useSanctuary();

  const [stepIndex, setStepIndex] = useState(0);

  // Local state initialized with context or deduced default language
  const [localLang, setLocalLang] = useState<'English' | 'Español' | 'Português'>(() => {
    return state.language || detectDefaultLanguage();
  });

  // Ensure sanctuary context language matches deduced onboarding language if not explicitly stored
  useEffect(() => {
    const deduced = state.language || detectDefaultLanguage();
    if (deduced && deduced !== state.language) {
      setLanguage(deduced);
    }
  }, [state.language, setLanguage]);
  
  const [localDate, setLocalDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });

  const [localSupportNum, setLocalSupportNum] = useState('');
  const [localSponsorName, setLocalSponsorName] = useState('');
  const [localSponsorNum, setLocalSponsorNum] = useState('');
  const [localSupportLink, setLocalSupportLink] = useState('');

  // Firestore Sync Code Restore States
  const [inputSyncCode, setInputSyncCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showSyncInput, setShowSyncInput] = useState(false);

  const currentLang = localLang;

  const handleLanguageSelect = (lang: 'English' | 'Español' | 'Português') => {
    setLocalLang(lang);
    setLanguage(lang); // Updates translation instantly!
  };

  const handleRestoreSyncCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputSyncCode.trim()) {
      setSyncError(currentLang === 'Português' ? 'Digite o código de sincronização' : currentLang === 'Español' ? 'Introduce el código de sincronización' : 'Please enter your sync code');
      return;
    }
    setIsRestoring(true);
    setSyncError(null);
    const res = await restoreFromSyncCode(inputSyncCode.trim());
    setIsRestoring(false);
    if (!res.success) {
      setSyncError(res.error || (currentLang === 'Português' ? 'Código não encontrado' : currentLang === 'Español' ? 'Código no encontrado' : 'Sync code not found'));
    }
  };

  const handleNext = () => {
    if (stepIndex < 2) {
      setStepIndex(prev => prev + 1);
    } else {
      // Save all and complete onboarding
      const isoDateTime = new Date(localDate).toISOString();
      setSobrietyStartDate(isoDateTime);
      setSupportNumber(localSupportNum);
      setSponsorName(localSponsorName);
      setSponsorNumber(localSponsorNum);
      setSupportLink(localSupportLink);
      setOnboarded(true);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EDE9] flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md sm:max-w-lg bg-[#EAE5DF] rounded-[28px] border border-black/10 shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3 relative max-h-[96vh] overflow-y-auto">
        
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-900/10 via-black/10 to-amber-900/10" />

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center pb-1.5 border-b border-black/5 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#E5DCD3] flex items-center justify-center border border-black/5 mb-1 shadow-inner">
            <Compass className="w-4.5 h-4.5 text-amber-950/80 animate-spin-slow" />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-black leading-tight">
            {ONBOARD_TRANS.welcome_title[currentLang]}
          </h1>
          <p className="font-sans text-[11px] text-black/60 mt-0.5 max-w-sm leading-tight">
            {ONBOARD_TRANS.welcome_subtitle[currentLang]}
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="flex items-center justify-between px-3 gap-2 shrink-0">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="flex-1 flex items-center gap-1.5">
              <div 
                className={`h-1 flex-grow rounded-full transition-all duration-300 ${
                  idx <= stepIndex ? 'bg-black' : 'bg-black/10'
                }`} 
              />
              <span className={`font-mono text-[9px] font-bold ${
                idx === stepIndex ? 'text-black' : 'text-black/40'
              }`}>
                0{idx + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Step Contents */}
        <div className="flex flex-col py-1">
          
          {/* STEP 1: LANGUAGE SELECTION */}
          {stepIndex === 0 && (
            <div className="flex flex-col gap-2.5 animate-fadeIn">
              <div className="text-center sm:text-left">
                <h2 className="font-serif text-base sm:text-lg text-black font-semibold flex items-center gap-2 justify-center sm:justify-start">
                  <Globe className="w-4 h-4 text-amber-950/70" />
                  {ONBOARD_TRANS.step_lang_title[currentLang]}
                </h2>
                <p className="font-sans text-[11px] text-black/60 mt-0.5 leading-snug">
                  {ONBOARD_TRANS.step_lang_desc[currentLang]}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-1 mb-2.5">
                {(['English', 'Português', 'Español'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageSelect(lang)}
                    className={`w-full py-2.5 px-4 rounded-xl font-sans text-xs font-bold tracking-wider uppercase border transition-all flex items-center justify-between cursor-pointer shrink-0 ${
                      localLang === lang 
                        ? 'bg-black text-[#F8F5F2] border-black shadow-sm' 
                        : 'bg-[#F8F5F2] hover:bg-[#F2EDE7] text-[#111111] border-black/10'
                    }`}
                  >
                    <span>{lang}</span>
                    {localLang === lang && <Check className="w-4 h-4 text-[#F8F5F2]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: MILESTONE DATE */}
          {stepIndex === 1 && (
            <div className="flex flex-col gap-3 animate-fadeIn">
              <div className="text-center sm:text-left">
                <h2 className="font-serif text-base sm:text-lg text-black font-semibold flex items-center gap-2 justify-center sm:justify-start">
                  <Calendar className="w-4 h-4 text-amber-950/70" />
                  {ONBOARD_TRANS.step_date_title[currentLang]}
                </h2>
                <p className="font-sans text-[11px] text-black/60 mt-0.5 leading-snug">
                  {ONBOARD_TRANS.step_date_desc[currentLang]}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mt-1">
                <div className="relative w-full">
                  <input
                    type="date"
                    value={localDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setLocalDate(e.target.value)}
                    className="w-full min-w-0 bg-[#F8F5F2] border border-black/15 rounded-xl py-2.5 px-3 font-sans text-xs focus:outline-none focus:border-black text-[#111111] uppercase font-bold tracking-wider block appearance-none"
                  />
                </div>

                <div className="bg-[#E5DCD3] rounded-xl p-2.5 border border-black/5 flex items-start gap-2 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-950/70 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="block font-sans text-[9px] font-bold uppercase tracking-wider text-amber-950/80">
                      {ONBOARD_TRANS.milestone_preview[currentLang]}
                    </span>
                    <span className="font-serif text-xs sm:text-sm text-black">
                      {new Date(localDate).toLocaleDateString(
                        localLang === 'English' ? 'en-US' : localLang === 'Español' ? 'es-ES' : 'pt-BR',
                        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONTACT NUMBERS / SUPPORT CIRCLE */}
          {stepIndex === 2 && (
            <div className="flex flex-col gap-2.5 animate-fadeIn max-h-[340px] overflow-y-auto pr-1">
              <div className="text-center sm:text-left">
                <h2 className="font-serif text-base sm:text-lg text-black font-semibold flex items-center gap-2 justify-center sm:justify-start">
                  <HeartHandshake className="w-4 h-4 text-amber-950/70" />
                  {ONBOARD_TRANS.step_care_title[currentLang]}
                </h2>
                <p className="font-sans text-[11px] text-black/60 mt-0.5 leading-snug">
                  {ONBOARD_TRANS.step_care_desc[currentLang]}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-0.5">
                {/* Sponsor Name */}
                <div className="flex flex-col gap-0.5">
                  <label className="font-sans text-[9px] font-bold text-black/70 uppercase tracking-widest flex justify-between">
                    <span>{ONBOARD_TRANS.sponsor_label[currentLang]}</span>
                    <span className="text-black/40 normal-case italic font-normal">{ONBOARD_TRANS.optional_field[currentLang]}</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30" />
                    <input
                      type="text"
                      value={localSponsorName}
                      onChange={(e) => setLocalSponsorName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#F8F5F2] border border-black/15 rounded-lg py-1.5 pl-8 pr-2.5 font-sans text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Sponsor Phone */}
                <div className="flex flex-col gap-0.5">
                  <label className="font-sans text-[9px] font-bold text-black/70 uppercase tracking-widest flex justify-between">
                    <span>{ONBOARD_TRANS.sponsor_phone[currentLang]}</span>
                    <span className="text-black/40 normal-case italic font-normal">{ONBOARD_TRANS.optional_field[currentLang]}</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30" />
                    <input
                      type="tel"
                      value={localSponsorNum}
                      onChange={(e) => setLocalSponsorNum(e.target.value)}
                      placeholder="e.g. 555-0199"
                      className="w-full bg-[#F8F5F2] border border-black/15 rounded-lg py-1.5 pl-8 pr-2.5 font-sans text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Helpline Number */}
                <div className="flex flex-col gap-0.5">
                  <label className="font-sans text-[9px] font-bold text-black/70 uppercase tracking-widest flex justify-between">
                    <span>{ONBOARD_TRANS.helpline_label[currentLang]}</span>
                    <span className="text-black/40 normal-case italic font-normal">{ONBOARD_TRANS.optional_field[currentLang]}</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30" />
                    <input
                      type="text"
                      value={localSupportNum}
                      onChange={(e) => setLocalSupportNum(e.target.value)}
                      placeholder="e.g. 988"
                      className="w-full bg-[#F8F5F2] border border-black/15 rounded-lg py-1.5 pl-8 pr-2.5 font-sans text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Custom Resource URL */}
                <div className="flex flex-col gap-0.5">
                  <label className="font-sans text-[9px] font-bold text-black/70 uppercase tracking-widest flex justify-between">
                    <span>{ONBOARD_TRANS.support_link_label[currentLang]}</span>
                    <span className="text-black/40 normal-case italic font-normal">{ONBOARD_TRANS.optional_field[currentLang]}</span>
                  </label>
                  <div className="relative">
                    <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30" />
                    <input
                      type="url"
                      value={localSupportLink}
                      onChange={(e) => setLocalSupportLink(e.target.value)}
                      placeholder="e.g. https://www.samhsa.gov"
                      className="w-full bg-[#F8F5F2] border border-black/15 rounded-lg py-1.5 pl-8 pr-2.5 font-sans text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className={`flex items-center justify-between gap-3 shrink-0 ${stepIndex === 0 ? 'mt-0.5 pt-0.5' : 'pt-2.5 border-t border-black/5 mt-0.5'}`}>
          {stepIndex > 0 ? (
            <button
              onClick={handleBack}
              className="bg-transparent hover:bg-black/5 text-black font-sans text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{ONBOARD_TRANS.back[currentLang]}</span>
            </button>
          ) : (
            <div className="w-6" /> /* Placeholder to preserve button alignment spacing */
          )}

          <button
            onClick={handleNext}
            className="bg-black hover:bg-black/80 text-[#F8F5F2] font-sans text-[10px] font-bold tracking-widest uppercase px-5 py-2.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm ml-auto shrink-0"
          >
            <span>
              {stepIndex === 2 
                ? ONBOARD_TRANS.complete[currentLang] 
                : ONBOARD_TRANS.continue[currentLang]
              }
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Restore with Cloud Sync Code Card - Placed under the continue button and language chooser */}
        {stepIndex === 0 && (
          <div className="bg-[#E2DDD6] border border-black/10 rounded-xl p-2.5 sm:p-3 transition-all shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-left min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center border border-black/5 shrink-0">
                  <CloudDownload className="w-3.5 h-3.5 text-amber-950/80" />
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-[11px] font-bold text-black truncate">
                    {currentLang === 'Português' ? 'Já usa o Horizon?' : currentLang === 'Español' ? '¿Ya usas Horizon?' : 'Already using Horizon?'}
                  </p>
                  <p className="font-sans text-[10px] text-black/60 truncate">
                    {currentLang === 'Português' ? 'Insira seu código para recuperar seu progresso' : currentLang === 'Español' ? 'Introduce tu código para recuperar tu progreso' : 'Enter your 6-character cloud code to continue'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncInput(!showSyncInput)}
                className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-950 bg-black/5 hover:bg-black/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {showSyncInput 
                  ? (currentLang === 'Português' ? 'Fechar' : currentLang === 'Español' ? 'Cerrar' : 'Close') 
                  : (currentLang === 'Português' ? 'Inserir Código' : currentLang === 'Español' ? 'Código' : 'Sync Code')}
              </button>
            </div>

            {showSyncInput && (
              <form onSubmit={handleRestoreSyncCode} className="mt-2.5 pt-2.5 border-t border-black/10 flex flex-col gap-1.5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input
                    type="text"
                    value={inputSyncCode}
                    onChange={(e) => {
                      setInputSyncCode(e.target.value.toUpperCase());
                      setSyncError(null);
                    }}
                    placeholder="HZ-XXXX"
                    className="min-w-0 flex-1 w-full bg-white border border-black/20 rounded-lg px-2.5 py-1.5 text-xs font-mono tracking-wider uppercase text-black placeholder:text-black/40 focus:outline-none focus:border-black"
                  />
                  <button
                    type="submit"
                    disabled={isRestoring}
                    className="w-full sm:w-auto bg-black hover:bg-black/80 text-white font-sans text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isRestoring ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudDownload className="w-3.5 h-3.5" />
                    )}
                    <span>{currentLang === 'Português' ? 'Restaurar' : currentLang === 'Español' ? 'Restaurar' : 'Restore'}</span>
                  </button>
                </div>
                {syncError && (
                  <div className="flex items-center gap-1.5 text-red-800 text-[10px] font-sans font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{syncError}</span>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

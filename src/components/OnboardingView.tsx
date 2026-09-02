/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSanctuary } from '../context/SanctuaryContext';
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
  Compass
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
    English: 'Select your preferred language. All prompts, lessons, and journals will be tailored for you.',
    Español: 'Selecciona tu idioma preferido. Todas las lecciones, reflexiones y diarios se adaptarán a ti.',
    Português: 'Selecione o seu idioma de preferência. Todas as lições, reflexões e diários serão adaptados.'
  },
  step_date_title: {
    English: 'Set Your Sobriety Milestone',
    Español: 'Establece tu Hito de Sobriety',
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
    setOnboarded 
  } = useSanctuary();

  const [stepIndex, setStepIndex] = useState(0);

  // Local state initialized with context values
  const [localLang, setLocalLang] = useState<'English' | 'Español' | 'Português'>(state.language || 'English');
  
  const [localDate, setLocalDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });

  const [localSupportNum, setLocalSupportNum] = useState('');
  const [localSponsorName, setLocalSponsorName] = useState('');
  const [localSponsorNum, setLocalSponsorNum] = useState('');
  const [localSupportLink, setLocalSupportLink] = useState('');

  const currentLang = localLang;

  const handleLanguageSelect = (lang: 'English' | 'Español' | 'Português') => {
    setLocalLang(lang);
    setLanguage(lang); // Updates translation instantly!
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
    <div className="min-h-screen bg-[#F0EDE9] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#EAE5DF] rounded-[36px] border border-black/10 shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6 relative">
        
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-900/10 via-black/10 to-amber-900/10" />

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center pb-2 border-b border-black/5">
          <div className="w-12 h-12 rounded-full bg-[#E5DCD3] flex items-center justify-center border border-black/5 mb-2 shadow-inner">
            <Compass className="w-6 h-6 text-amber-950/80 animate-spin-slow" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-black">
            {ONBOARD_TRANS.welcome_title[currentLang]}
          </h1>
          <p className="font-sans text-xs text-black/60 mt-1 max-w-sm leading-relaxed">
            {ONBOARD_TRANS.welcome_subtitle[currentLang]}
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="flex items-center justify-between px-6 gap-2">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="flex-1 flex items-center gap-2">
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
        <div className="flex-grow flex flex-col py-2 min-h-[220px]">
          
          {/* STEP 1: LANGUAGE SELECTION */}
          {stepIndex === 0 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="text-center sm:text-left">
                <h2 className="font-serif text-lg text-black font-semibold flex items-center gap-2 justify-center sm:justify-start">
                  <Globe className="w-5 h-5 text-amber-950/70" />
                  {ONBOARD_TRANS.step_lang_title[currentLang]}
                </h2>
                <p className="font-sans text-xs text-black/60 mt-1 leading-relaxed">
                  {ONBOARD_TRANS.step_lang_desc[currentLang]}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mt-2">
                {(['English', 'Español', 'Português'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`w-full py-3.5 px-5 rounded-2xl font-sans text-xs font-bold tracking-wider uppercase border transition-all flex items-center justify-between cursor-pointer ${
                      localLang === lang 
                        ? 'bg-black text-[#F8F5F2] border-black shadow-md' 
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
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="text-center sm:text-left">
                <h2 className="font-serif text-lg text-black font-semibold flex items-center gap-2 justify-center sm:justify-start">
                  <Calendar className="w-5 h-5 text-amber-950/70" />
                  {ONBOARD_TRANS.step_date_title[currentLang]}
                </h2>
                <p className="font-sans text-xs text-black/60 mt-1 leading-relaxed">
                  {ONBOARD_TRANS.step_date_desc[currentLang]}
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <div className="relative w-full">
                  <input
                    type="date"
                    value={localDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setLocalDate(e.target.value)}
                    className="w-full min-w-0 bg-[#F8F5F2] border border-black/15 rounded-2xl p-4 font-sans text-xs focus:outline-none focus:border-black text-[#111111] uppercase font-bold tracking-wider block appearance-none"
                  />
                </div>

                <div className="bg-[#E5DCD3] rounded-2xl p-3.5 border border-black/5 flex items-start gap-2.5 mt-1">
                  <Sparkles className="w-4 h-4 text-amber-950/70 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-amber-950/80 mb-0.5">
                      {ONBOARD_TRANS.milestone_preview[currentLang]}
                    </span>
                    <span className="font-serif text-sm text-black">
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
            <div className="flex flex-col gap-4 animate-fadeIn max-h-[360px] overflow-y-auto pr-1">
              <div className="text-center sm:text-left">
                <h2 className="font-serif text-lg text-black font-semibold flex items-center gap-2 justify-center sm:justify-start">
                  <HeartHandshake className="w-5 h-5 text-amber-950/70" />
                  {ONBOARD_TRANS.step_care_title[currentLang]}
                </h2>
                <p className="font-sans text-xs text-black/60 mt-1 leading-relaxed">
                  {ONBOARD_TRANS.step_care_desc[currentLang]}
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-1">
                {/* Sponsor Name */}
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-[10px] font-bold text-black/70 uppercase tracking-widest flex justify-between">
                    <span>{ONBOARD_TRANS.sponsor_label[currentLang]}</span>
                    <span className="text-black/40 normal-case italic font-normal">{ONBOARD_TRANS.optional_field[currentLang]}</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="text"
                      value={localSponsorName}
                      onChange={(e) => setLocalSponsorName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#F8F5F2] border border-black/15 rounded-xl py-2.5 pl-9 pr-3 font-sans text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Sponsor Phone */}
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-[10px] font-bold text-black/70 uppercase tracking-widest flex justify-between">
                    <span>{ONBOARD_TRANS.sponsor_phone[currentLang]}</span>
                    <span className="text-black/40 normal-case italic font-normal">{ONBOARD_TRANS.optional_field[currentLang]}</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="tel"
                      value={localSponsorNum}
                      onChange={(e) => setLocalSponsorNum(e.target.value)}
                      placeholder="e.g. 555-0199"
                      className="w-full bg-[#F8F5F2] border border-black/15 rounded-xl py-2.5 pl-9 pr-3 font-sans text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Helpline Number */}
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-[10px] font-bold text-black/70 uppercase tracking-widest flex justify-between">
                    <span>{ONBOARD_TRANS.helpline_label[currentLang]}</span>
                    <span className="text-black/40 normal-case italic font-normal">{ONBOARD_TRANS.optional_field[currentLang]}</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="text"
                      value={localSupportNum}
                      onChange={(e) => setLocalSupportNum(e.target.value)}
                      placeholder="e.g. 988"
                      className="w-full bg-[#F8F5F2] border border-black/15 rounded-xl py-2.5 pl-9 pr-3 font-sans text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Custom Resource URL */}
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-[10px] font-bold text-black/70 uppercase tracking-widest flex justify-between">
                    <span>{ONBOARD_TRANS.support_link_label[currentLang]}</span>
                    <span className="text-black/40 normal-case italic font-normal">{ONBOARD_TRANS.optional_field[currentLang]}</span>
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="url"
                      value={localSupportLink}
                      onChange={(e) => setLocalSupportLink(e.target.value)}
                      placeholder="e.g. https://www.samhsa.gov"
                      className="w-full bg-[#F8F5F2] border border-black/15 rounded-xl py-2.5 pl-9 pr-3 font-sans text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-black/5 shrink-0">
          {stepIndex > 0 ? (
            <button
              onClick={handleBack}
              className="bg-transparent hover:bg-black/5 text-black font-sans text-[10px] font-bold tracking-widest uppercase px-5 py-3 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{ONBOARD_TRANS.back[currentLang]}</span>
            </button>
          ) : (
            <div className="w-10" /> /* Placeholder to preserve button alignment spacing */
          )}

          <button
            onClick={handleNext}
            className="bg-black hover:bg-black/80 text-[#F8F5F2] font-sans text-[10px] font-bold tracking-widest uppercase px-6 py-3 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shadow-md ml-auto"
          >
            <span>
              {stepIndex === 2 
                ? ONBOARD_TRANS.complete[currentLang] 
                : ONBOARD_TRANS.continue[currentLang]
              }
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

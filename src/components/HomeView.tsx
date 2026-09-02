/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSanctuary } from '../context/SanctuaryContext';
import { Sparkles, BrainCircuit, Play, Check, Compass, HeartHandshake, RotateCcw, CheckCircle2, ShieldAlert, Info, Flower2, FileText } from 'lucide-react';

export const HomeView: React.FC = () => {

  const {
    state,
    getTranslation,
    timeGroundedString,
    generateAIIntention,
    aiLoading,
    aiUsageCount,
    limitReached,
    setActiveTab,
    setSobrietyStartDate,
    toggleSoberCheckIn
  } = useSanctuary();
  const getLangText = (en: string, es: string, pt: string) => {
    if (state.language === 'English') return en;
    if (state.language === 'Español') return es;
    return pt;
  };

  const [generatedIntention, setGeneratedIntention] = useState<string>(() => {
    if (state.language === 'English') {
      return 'I give myself permission to rest, to reset, and to begin again without judgment.';
    } else if (state.language === 'Español') {
      return 'Me doy permiso para descansar, reiniciar y comenzar de nuevo sin juzgarme.';
    } else {
      return 'Dou-me permissão para descansar, recomeçar e iniciar novamente sem julgamento.';
    }
  });

  const [showResetModal, setShowResetModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [openBottomSheet, setOpenBottomSheet] = useState<'renew' | 'reset' | null>(null);
  const [liveSeconds, setLiveSeconds] = useState(new Date().getSeconds());

  // Trigger a re-render every second to keep the visual countdown ticks perfectly aligned
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveSeconds(new Date().getSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerAIIntention = async () => {
    const mainMood = state.reflections[0]?.moods?.[0] || 'Calm';
    const mantra = await generateAIIntention(mainMood);
    setGeneratedIntention(mantra);
  };

  const handleResetClock = () => {
    setSobrietyStartDate(new Date().toISOString());
    if (state.soberCheckedInToday) {
      toggleSoberCheckIn();
    }
    setShowResetModal(false);
  };

  // Trilingual text helper
  const getText = (key: string, customVal?: any): string => {
    const lang = state.language;
    const data: Record<string, Record<'English' | 'Español' | 'Português', string>> = {
      day_in_progress: {
        English: `DAY ${timeGroundedString.totalDays + 1} IN PROGRESS`,
        Español: `DÍA ${timeGroundedString.totalDays + 1} EN CURSO`,
        Português: `DIA ${timeGroundedString.totalDays + 1} EM PROGRESSO`
      },
      of_current_block: {
        English: 'of current 24h block',
        Español: 'del ciclo de 24h actual',
        Português: 'do ciclo de 24h atual'
      },
      days_completed: {
        English: `${timeGroundedString.totalDays} ${timeGroundedString.totalDays === 1 ? 'day' : 'days'} completed`,
        Español: `${timeGroundedString.totalDays} ${timeGroundedString.totalDays === 1 ? 'día completado' : 'días completados'}`,
        Português: `${timeGroundedString.totalDays} ${timeGroundedString.totalDays === 1 ? 'dia concluído' : 'dias concluídos'}`
      },
      cycle_explanation: {
        English: 'Sobriety is built one breath, one choice, and 24 hours at a time. The dial above displays your current active day. When the 24-hour block completes, it rolls over to a new day and increases your cumulative score.',
        Español: 'La sobriedad se construye con cada respiración, cada decisión y 24 horas a la vez. El dial de arriba muestra tu día activo. Al completarse las 24 horas, se reinicia e incrementa tus días acumulados.',
        Português: 'A sobriedade é construída a cada respiração, escolha e 24 horas de cada vez. O mostrador acima exibe o seu dia ativo atual. Quando o bloco de 24 horas se completa, ele recomeça e aumenta o seu total acumulado.'
      },
      commitment_title: {
        English: 'Daily 24-Hour Commitment',
        Español: 'Compromiso de 24 Horas',
        Português: 'Compromisso Diário de 24 Horas'
      },
      commitment_renewed: {
        English: 'Commitment Active',
        Español: 'Compromiso Activo',
        Português: 'Compromisso Ativo'
      },
      commitment_desc_active: {
        English: 'You have renewed your commitment for today. Focus on this current breath. You are safe, you are sober, and you are here.',
        Español: 'Has renovado tu compromiso para hoy. Enfócate en la respiración presente. Estás a salvo, estás sobrio y estás aquí.',
        Português: 'Você renovou o seu compromisso para hoje. Foque na respiração do presente. Você está seguro, está sóbrio e está aqui.'
      },
      renew_btn: {
        English: 'Renew 24-Hour Commitment',
        Español: 'Renovar Compromiso de 24h',
        Português: 'Renovar Compromisso de 24h'
      },
      renew_btn_sub: {
        English: "Tap to affirm: 'I will stay sober for the next 24 hours.'",
        Español: "Toca para afirmar: 'Me mantendré sobrio durante las próximas 24 horas.'",
        Português: "Toque para afirmar: 'Vou manter-me sóbrio pelas próximas 24 horas.'"
      },
      how_it_knows_title: {
        English: 'How does it know if I haven\'t relapsed?',
        Español: '¿Cómo sabe el sistema si no he recaído?',
        Português: 'Como o sistema sabe se eu não recaí?'
      },
      how_it_knows_desc: {
        English: 'Recovery thrives on absolute honesty. The app doesn\'t spy on you—it relies on your conscious confirmation. If you experience a relapse, you can compassionately reset the clock to begin a brand-new 24-hour cycle of healing with no judgment.',
        Español: 'La recuperación florece con la honestidad absoluta. La aplicación no te espía, depende de tu confirmación consciente. Si sufres una recaída, puedes reiniciar el reloj con compasão para comenzar de nuevo sin juicio.',
        Português: 'A recuperação floresce com honestidade absoluta. O aplicativo não espiona você — ele depende da sua confirmação consciente. Se você tiver uma recaída, pode reiniciar o relógio com autocompaixão para iniciar um ciclo limpo sem julgamentos.'
      },
      reset_btn: {
        English: 'Reset Clock / New Start',
        Español: 'Reiniciar Reloj / Nuevo Inicio',
        Português: 'Reiniciar Relógio / Novo Começo'
      },
      modal_title: {
        English: 'Begin a Fresh 24 Hours?',
        Español: '¿Comenzar un ciclo nuevo de 24h?',
        Português: 'Iniciar um Novo Ciclo de 24h?'
      },
      modal_desc: {
        English: 'Recovery is a path of brave restarts. A relapse or slip is simply a moment to pause, learn, and begin again. Restarting your clock takes immense courage. Your past reflection journals will always be kept here for your growth. Would you like to start a fresh 24-hour cycle right now?',
        Español: 'La recuperación es un camino de valientes reinicios. Una recaída o desliz es simplemente un momento para pausar, aprender y comenzar de nuevo. Reiniciar el reloj requiere un valor inmenso. Tus diarios de reflexión pasados se conservarán para tu crecimiento. ¿Quieres comenzar un nuevo ciclo de 24 horas ahora?',
        Português: 'A recuperação é um caminho de recomeços corajosos. Uma recaída ou deslize é apenas um momento para pausar, aprender e recomeçar. Reiniciar o relógio exige imensa coragem. O seu histórico de reflexões será mantido para o seu crescimento. Deseja iniciar um ciclo limpo de 24 horas agora?'
      },
      confirm_reset: {
        English: 'Confirm New Start',
        Español: 'Confirmar Nuevo Inicio',
        Português: 'Confirmar Novo Começo'
      },
      cancel: {
        English: 'Cancel',
        Español: 'Cancelar',
        Português: 'Cancelar'
      }
    };
    return data[key]?.[lang] || key;
  };

  // Precise mathematical progress calculations for the 24-hour ring
  const elapsedMinutesInCurrentDay = (timeGroundedString.hours * 60) + timeGroundedString.minutes;
  const totalMinutesInDay = 24 * 60;
  const progressRatio = Math.min(Math.max(elapsedMinutesInCurrentDay / totalMinutesInDay, 0), 1);
  const strokeOffset = 301.59 * (1 - progressRatio);

  const getRemainingCommitmentTime = () => {
    if (!state.lastSoberCheckInTime) return '';
    const diffMs = (24 * 60 * 60 * 1000) - (Date.now() - new Date(state.lastSoberCheckInTime).getTime());
    if (diffMs <= 0) return '';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    const hrStr = hours.toString().padStart(2, '0');
    const minStr = minutes.toString().padStart(2, '0');
    const secStr = seconds.toString().padStart(2, '0');

    if (state.language === 'Español') {
      return `Quedan ${hrStr}h ${minStr}m ${secStr}s de compromiso`;
    } else if (state.language === 'Português') {
      return `Restam ${hrStr}h ${minStr}m ${secStr}s de compromisso`;
    }
    return `${hrStr}h ${minStr}m ${secStr}s remaining on commitment`;
  };

  return (
    <div className="flex flex-col gap-5 items-center justify-center max-w-2xl mx-auto w-full">
      
      {/* Centered Hero: Elegant Sobriety Arc Clock with Radial Glow */}
      <section className="flex flex-col items-center justify-center w-full relative py-3 select-none">
        
        {/* Soft Ethereal Sage Glow Backdrop */}
        <div className="absolute w-72 h-72 rounded-full bg-[#3e6355]/15 blur-3xl pointer-events-none z-0 animate-pulse" />
        
        {/* Circle Card Container */}
        <div 
          onClick={() => setShowInfoModal(true)}
          title="Click to view explanation"
          className={`relative z-10 flex flex-col items-center justify-center w-60 h-60 md:w-64 md:h-64 rounded-full border transition-all duration-300 p-5 text-center cursor-pointer group shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
            state.soberCheckedInToday
              ? 'bg-[#e2f1ec] border-emerald-800/15'
              : 'bg-white border-black/5'
          }`}
        >
          {/* Informational (i) absolute badge inside the circle */}
          <div className="absolute top-4 right-4 text-black/30 group-hover:text-[#3e6355] hover:scale-110 transition-all duration-300">
            <Info className="w-3.5 h-3.5" />
          </div>

          {/* Ethereal Outer Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" className="stroke-black/[0.03]" strokeWidth="0.5" />
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              className="stroke-[#3e6355] transition-all duration-1000"
              strokeWidth="1.75"
              strokeDasharray="301.59"
              strokeDashoffset={strokeOffset.toFixed(2)}
              strokeLinecap="round"
            />
          </svg>

          {/* Tiny Sage Dot Indicator at Top */}
          <div className="w-1.5 h-1.5 rounded-full bg-[#3e6355] mb-1.5 shadow-sm" />

          {/* Current Day Label */}
          <span className="font-sans text-[9px] font-extrabold text-[#3e6355] uppercase tracking-[0.25em] mb-1.5 select-none">
            {getText('day_in_progress')}
          </span>

          {/* Big Elegant Digits for Elapsed Hours & Minutes & Seconds of the current Day */}
          <h2 className="font-serif text-2xl md:text-3xl font-light text-[#111111] leading-none select-none tracking-tight">
            {timeGroundedString.hours.toString().padStart(2, '0')}h{' '}
            {timeGroundedString.minutes.toString().padStart(2, '0')}m{' '}
            <span className="text-black/40 text-xl font-normal">
              {timeGroundedString.seconds.toString().padStart(2, '0')}s
            </span>
          </h2>

          {/* Spaced Label */}
          <span className="font-sans text-[8px] font-bold text-black/45 uppercase tracking-[0.15em] mt-2">
            {getText('of_current_block')}
          </span>

          {/* Cumulative Completed Milestone Tag */}
          <div className="mt-2.5 px-2.5 py-0.5 bg-[#E5E1DB] border border-black/5 text-black font-sans text-[8px] font-extrabold tracking-widest uppercase rounded-full">
            {getText('days_completed')}
          </div>
        </div>
      </section>

      {/* Side-by-Side Commitment & Reset Oval Buttons */}
      <section className="w-full max-w-xl px-4 z-20">
        <div className="flex gap-3 w-full">
          {/* Renew Commitment Button */}
          <button
            onClick={() => setOpenBottomSheet('renew')}
            className={`flex-1 py-3 px-4 rounded-full font-sans text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
              state.soberCheckedInToday
                ? 'bg-[#3e6355] hover:bg-[#314f44] text-white border border-[#3e6355]'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {state.soberCheckedInToday ? (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{getLangText('Active', 'Activo', 'Ativo')}</span>
              </>
            ) : (
              <>
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <span>{getLangText('Renew', 'Renovar', 'Renovar')}</span>
              </>
            )}
          </button>

          {/* Reset Clock Button */}
          <button
            onClick={() => setOpenBottomSheet('reset')}
            className="flex-1 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-full font-sans text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{getLangText('Reset', 'Reiniciar', 'Zerar')}</span>
          </button>
        </div>
      </section>

      {/* Focus / Intention Card (Moved ABOVE the start ritual and check circular buttons) */}
      <section className="max-w-xl mx-auto w-full z-10 border-t border-black/5 pt-4 mt-1 px-4">
        <div className="bg-white/40 rounded-3xl py-5 px-5 border border-black/5 shadow-sm text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-black/60" />
            <h2 className="font-sans text-[10px] font-bold text-black/60 uppercase tracking-[0.2em]">
              {getTranslation('focus_today')}
            </h2>
          </div>
          
          <blockquote className="font-serif text-base md:text-lg text-[#111111] italic leading-relaxed text-center min-h-[48px] transition-all">
            "{generatedIntention}"
          </blockquote>
          
          {limitReached && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-900/10 text-amber-900/80 rounded-2xl text-left max-w-lg mx-auto">
              <p className="font-serif text-xs font-semibold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                {getTranslation('ai_limit_reached')}
              </p>
              <p className="font-sans text-[11px] leading-relaxed">
                {getTranslation('ai_limit_desc')}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              onClick={triggerAIIntention}
              disabled={aiLoading}
              className="font-sans text-[10px] font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <BrainCircuit className="w-3 h-3" />
              {aiLoading ? (getLangText('GENERATING...', 'GENERANDO...', 'GERANDO...')) : getTranslation('new_intention')}
            </button>
            <span className="text-[9px] font-sans font-bold tracking-widest text-black/40 uppercase">
              {getTranslation('ai_remaining_credits')}: {aiUsageCount}/3
            </span>
          </div>
        </div>
      </section>

      {/* Action Buttons: Start Ritual and Check In Navigation (Moved BELOW Focus/Intention Card) */}
      <section className="flex items-center justify-center gap-8 z-20 w-full border-t border-black/5 pt-5">
        {/* Start Ritual button */}
        <button
          onClick={() => setActiveTab('tools')}
          className="font-sans text-[10px] font-bold text-[#53766a] hover:text-[#3e6355] transition-colors focus:outline-none flex flex-col items-center gap-2 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full border border-[#53766a]/20 flex items-center justify-center group-hover:border-[#53766a] transition-all duration-300 shadow-[0_2px_8px_rgba(45,49,50,0.02)] bg-white">
            <Flower2 className="w-5 h-5 text-[#53766a] group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="uppercase tracking-widest text-[9px]">
            {getLangText('Start Ritual', 'Empezar ritual', 'Começar ritual')}
          </span>
        </button>

        {/* Check In button */}
        <button
          onClick={() => setActiveTab('trackers')}
          className="font-sans text-[10px] font-bold text-[#3e6355] hover:text-[#2d493e] transition-colors focus:outline-none flex flex-col items-center gap-2 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full border border-[#3e6355]/20 flex items-center justify-center group-hover:border-[#3e6355] transition-all duration-300 shadow-[0_2px_8px_rgba(45,49,50,0.02)] bg-white">
            <FileText className="w-5 h-5 text-[#3e6355] group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="uppercase tracking-widest text-[9px]">
            {getLangText('Check In', 'Registrarse', 'Fazer check-in')}
          </span>
        </button>
      </section>

      {/* Info Explanation Modal (Tapping the Circle) */}
      {showInfoModal && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 md:p-10 overflow-y-auto z-[100] animate-fadeIn pt-10 md:pt-20">
          <div className="bg-[#F8F5F2] rounded-3xl max-w-md w-full p-6 border border-black/25 shadow-2xl my-auto sm:my-0">
            <div className="flex justify-between items-center pb-2.5 border-b border-black/5 shrink-0 mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#3e6355]" />
                <h3 className="font-sans text-xs font-extrabold text-black uppercase tracking-widest">
                  {getLangText('Understanding the 24-Hour Cycle', 'Entendiendo el ciclo de 24 horas', 'Entendendo o ciclo de 24 horas')}
                </h3>
              </div>
            </div>
            
            <p className="font-sans text-xs text-[#444444] leading-relaxed mb-6">
              {getText('cycle_explanation')}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-6 py-2.5 bg-[#3e6355] text-white font-sans text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-emerald-800 cursor-pointer transition-colors"
              >
                {getLangText('Got It', 'Entendido', 'Entendi')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RENEW COMMITMENT BOTTOM SHEET */}
      {openBottomSheet === 'renew' && createPortal(
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] flex items-end justify-center animate-fadeIn"
          onClick={() => setOpenBottomSheet(null)}
        >
          <div 
            className="bg-[#F8F5F2] w-full max-w-md rounded-t-[2rem] border-t border-black/10 shadow-2xl p-6 pb-8 flex flex-col gap-4 animate-slideUp max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative slider bar handle at top */}
            <div className="w-12 h-1 bg-black/10 rounded-full mx-auto mb-1 shrink-0" />

            {/* Header */}
            <div className="flex items-center gap-2 pb-2.5 border-b border-black/5 shrink-0">
              <HeartHandshake className="w-5 h-5 text-[#3e6355]" />
              <h3 className="font-sans text-xs font-extrabold text-black uppercase tracking-widest">
                {getText('commitment_title')}
              </h3>
            </div>

            {/* Body Content */}
            <div className="flex flex-col gap-4 overflow-y-auto">
              {state.soberCheckedInToday ? (
                /* Checked-In State Banner */
                <div className="bg-[#f5fff8] border border-emerald-900/10 p-5 rounded-2xl flex flex-col gap-2 w-full text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-sans text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest flex justify-between items-center w-full">
                      <span>{getText('commitment_renewed')}</span>
                      <span className="text-[9px] text-[#3e6355] bg-[#3e6355]/10 px-1.5 py-0.5 font-normal lowercase tracking-wider rounded-md">active</span>
                    </span>
                  </div>
                  
                  <p className="font-sans text-xs text-emerald-900/80 leading-relaxed">
                    {getText('commitment_desc_active')}
                  </p>
                  
                  {state.lastSoberCheckInTime && (
                    <div className="mt-1 text-[10px] font-mono text-emerald-800 bg-emerald-900/5 border border-emerald-900/10 px-2 py-1.5 w-full text-center rounded-xl font-bold">
                      {getRemainingCommitmentTime()}
                    </div>
                  )}
                </div>
              ) : (
                /* Interactive Renewal Action Button inside bottom sheet */
                <div className="flex flex-col gap-3 text-left">
                  <p className="font-sans text-xs text-black/60 leading-relaxed">
                    {state.language === 'English' 
                      ? 'Renew your conscious commitment to sobriety. This daily affirmation aligns your mind and focus on the current 24-hour block.'
                      : state.language === 'Español'
                      ? 'Renueva tu compromiso consciente con la sobriedad. Esta afirmación diaria enfoca tu mente en el ciclo actual de 24 horas.'
                      : 'Renove o seu compromisso consciente com a sobriedade. Esta afirmação diária foca a sua mente no ciclo atual de 24 horas.'}
                  </p>
                  <button
                    onClick={() => {
                      toggleSoberCheckIn();
                    }}
                    className="w-full py-4 bg-[#3e6355] hover:bg-[#314f44] text-white border border-black/10 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <span className="font-sans text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      {getText('renew_btn')}
                    </span>
                    <span className="font-sans text-[9px] text-white/70 uppercase tracking-wider text-center">
                      {getText('renew_btn_sub')}
                    </span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RESET COMMITMENT BOTTOM SHEET */}
      {openBottomSheet === 'reset' && createPortal(
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] flex items-end justify-center animate-fadeIn"
          onClick={() => setOpenBottomSheet(null)}
        >
          <div 
            className="bg-[#F8F5F2] w-full max-w-md rounded-t-[2rem] border-t border-black/10 shadow-2xl p-6 pb-8 flex flex-col gap-4 animate-slideUp max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative slider bar handle at top */}
            <div className="w-12 h-1 bg-black/10 rounded-full mx-auto mb-1 shrink-0" />

            {/* Header */}
            <div className="flex items-center gap-2 pb-2.5 border-b border-black/5 shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-900" />
              <h3 className="font-sans text-xs font-extrabold text-black uppercase tracking-widest">
                {getText('modal_title')}
              </h3>
            </div>

            {/* Body Content */}
            <div className="flex flex-col gap-4 overflow-y-auto text-left">
              <p className="font-sans text-xs text-[#444444] leading-relaxed">
                {getText('modal_desc')}
              </p>

              {/* Compassionate reinforcement note */}
              <div className="bg-rose-50/50 border border-rose-900/5 p-4 rounded-2xl">
                <p className="font-sans text-[11px] text-rose-900/80 leading-relaxed italic">
                  {state.language === 'English'
                    ? 'There is no shame in a new start. Every single step forward contributes to your long-term growth and neural rewiring.'
                    : state.language === 'Español'
                    ? 'No hay vergüenza en un nuevo comienzo. Cada paso adelante contribuye a tu crecimiento a largo plazo y tu reconfiguración neuronal.'
                    : 'Não há vergonha em um novo recomeço. Cada passo à frente contribui para o seu crescimento a longo prazo e a sua reorganização neural.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-black/5 shrink-0 flex gap-3 justify-end">
              <button
                onClick={() => {
                  handleResetClock();
                  setOpenBottomSheet(null);
                }}
                className="px-5 py-2.5 bg-red-900 text-[#F8F5F2] font-sans text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-950 cursor-pointer transition-colors"
              >
                {getText('confirm_reset')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};


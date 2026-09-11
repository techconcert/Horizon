/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSanctuary, formatAccumulatedTime } from '../context/SanctuaryContext';
import { getDailyFocusMessage } from '../data/dailyFocusMessages';
import {
  Sparkles,
  Check,
  HeartHandshake,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Info,
  Flower2,
  FileText,
  Calendar
} from 'lucide-react';

interface KeytagBadgeProps {
  totalDays: number;
  months?: number;
  years?: number;
  language: 'English' | 'Español' | 'Português';
}

// NA Keytag Droplet-shaped anniversary badge with official Narcotics Anonymous color milestones
const NAKeytagBadge: React.FC<KeytagBadgeProps> = ({ totalDays, months = 0, years = 0, language }) => {
  let value: number | string = 0;
  let unit = '';
  let fullText = '';
  let bg = '#EA580C';
  let border = '#C2410C';
  let innerBorder = 'rgba(255,255,255,0.45)';
  let text = '#FFFFFF';
  let textSub = 'rgba(255,255,255,0.95)';
  let holeBorder = 'rgba(255,255,255,0.6)';

  if (years >= 1) {
    // Whole calendar years milestone (1 Year, 2+ Years)
    value = years;
    if (language === 'Español') unit = years === 1 ? 'año' : 'años';
    else if (language === 'Português') unit = years === 1 ? 'ano' : 'anos';
    else unit = years === 1 ? 'year' : 'years';
    fullText = `${years} ${unit}`;

    if (years === 1) {
      // NA 1 Year: Celebrated Glow-in-the-Dark / Moonglow luminescent keytag
      bg = '#DCFCE7';
      border = '#86EFAC';
      innerBorder = '#4ADE80';
      text = '#065F46';
      textSub = '#047857';
      holeBorder = '#10B981';
    } else {
      // NA Multiple Years (2+ Years): Classic Deep Black with Metallic Gold accents
      bg = '#18181B';
      border = '#27272A';
      innerBorder = '#EAB308';
      text = '#FFFFFF';
      textSub = '#FDE047';
      holeBorder = '#71717A';
    }
  } else if (months >= 1) {
    // NA Month fellowship milestones (1 Month, 2 Months, etc.)
    value = months;
    if (language === 'Español') unit = months === 1 ? 'mes' : 'meses';
    else if (language === 'Português') unit = months === 1 ? 'mês' : 'meses';
    else unit = months === 1 ? 'month' : 'months';
    fullText = `${months} ${unit}`;

    // Official NA Fellowship milestones & colors:
    // 30 Days (1 month): Orange
    // 60 Days (2 months): Green
    // 90 Days (3-5 months): Red
    // 6 Months (6-8 months): Blue
    // 9 Months (9-11 months): Yellow / Amber
    if (months === 1) {
      // 30 Days: Orange
      bg = '#EA580C';
      border = '#C2410C';
      innerBorder = 'rgba(255,255,255,0.45)';
      text = '#FFFFFF';
      textSub = 'rgba(255,255,255,0.95)';
      holeBorder = 'rgba(255,255,255,0.6)';
    } else if (months === 2) {
      // 60 Days: Green
      bg = '#16A34A';
      border = '#15803D';
      innerBorder = 'rgba(255,255,255,0.45)';
      text = '#FFFFFF';
      textSub = 'rgba(255,255,255,0.95)';
      holeBorder = 'rgba(255,255,255,0.6)';
    } else if (months >= 3 && months < 6) {
      // 90 Days (3-5 months): Red
      bg = '#DC2626';
      border = '#B91C1C';
      innerBorder = 'rgba(255,255,255,0.45)';
      text = '#FFFFFF';
      textSub = 'rgba(255,255,255,0.95)';
      holeBorder = 'rgba(255,255,255,0.6)';
    } else if (months >= 6 && months < 9) {
      // 6 Months (6-8 months): Blue
      bg = '#2563EB';
      border = '#1D4ED8';
      innerBorder = 'rgba(255,255,255,0.45)';
      text = '#FFFFFF';
      textSub = 'rgba(255,255,255,0.95)';
      holeBorder = 'rgba(255,255,255,0.6)';
    } else {
      // 9 Months (9-11 months): Yellow / Amber
      bg = '#D97706';
      border = '#B45309';
      innerBorder = 'rgba(255,255,255,0.45)';
      text = '#FFFFFF';
      textSub = 'rgba(255,255,255,0.95)';
      holeBorder = 'rgba(255,255,255,0.6)';
    }
  } else {
    // Under 30 days: NA White keytag (shows accumulated active day count, min 1)
    const displayDays = totalDays >= 1 ? totalDays : 1;
    value = displayDays;
    if (language === 'Español') unit = displayDays === 1 ? 'día' : 'días';
    else if (language === 'Português') unit = displayDays === 1 ? 'dia' : 'dias';
    else unit = displayDays === 1 ? 'day' : 'days';
    fullText = `${displayDays} ${unit}`;
    bg = '#FFFFFF';
    border = '#D1D5DB';
    innerBorder = '#E5E7EB';
    text = '#1F2937';
    textSub = '#4B5563';
    holeBorder = '#9CA3AF';
  }

  return (
    <div
      className="relative flex items-center justify-center shrink-0 select-none group-hover:scale-105 transition-transform"
      title={`Narcotics Anonymous Keytag: ${fullText}`}
      aria-label={`NA Keytag: ${fullText}`}
    >
      <svg viewBox="0 0 54 70" className="w-11 h-14 md:w-12 md:h-15 drop-shadow-sm shrink-0" fill="none">
        {/* Outer Droplet / NA Keytag body */}
        <path
          d="M27 4 C33 4, 38 12, 45 27 C50 38, 50 51, 42 61 C36 67, 18 67, 12 61 C4 51, 4 38, 9 27 C16 12, 21 4, 27 4 Z"
          fill={bg}
          stroke={border}
          strokeWidth="1.2"
        />
        {/* Debossed inner keytag border ridge */}
        <path
          d="M27 7.5 C31.5 7.5, 35.5 14, 41 27 C45.5 36, 45.5 48, 38.5 56.5 C33.5 62, 20.5 62, 15.5 56.5 C8.5 48, 8.5 36, 13 27 C18.5 14, 22.5 7.5, 27 7.5 Z"
          fill="none"
          stroke={innerBorder}
          strokeWidth="0.8"
        />
        {/* Keyring hole at top */}
        <circle cx="27" cy="12" r="3.2" fill="#F8F5F2" stroke={holeBorder} strokeWidth="1" />

        {/* Milestone Number - positioned higher in the body */}
        <text
          x="27"
          y="30"
          textAnchor="middle"
          dominantBaseline="central"
          fill={text}
          className="font-serif font-bold text-[14px]"
          style={{ fill: text }}
        >
          {value}
        </text>

        {/* Milestone Unit - positioned directly at the widest point of the keyring */}
        <text
          x="27"
          y="42"
          textAnchor="middle"
          dominantBaseline="central"
          fill={textSub}
          className="font-sans font-extrabold uppercase text-[7px] tracking-wider"
          style={{ fill: textSub }}
        >
          {unit}
        </text>
      </svg>
    </div>
  );
};

export const HomeView: React.FC = () => {

  const {
    state,
    getTranslation,
    timeGroundedString,
    setActiveTab,
    setSobrietyStartDate,
    toggleSoberCheckIn
  } = useSanctuary();
  const getLangText = (en: string, es: string, pt: string) => {
    if (state.language === 'English') return en;
    if (state.language === 'Español') return es;
    return pt;
  };

  // Today's focus message changes automatically every day and adapts to current language
  const [todayFocusMessage, setTodayFocusMessage] = useState<string>(() => {
    return getDailyFocusMessage(new Date(), state.language);
  });

  // Keep focus message in sync when language switches
  useEffect(() => {
    setTodayFocusMessage(getDailyFocusMessage(new Date(), state.language));
  }, [state.language]);

  // Automatically update focus message if app is kept open across midnight (daily rollover)
  useEffect(() => {
    const timer = setInterval(() => {
      setTodayFocusMessage(getDailyFocusMessage(new Date(), state.language));
    }, 60000);
    return () => clearInterval(timer);
  }, [state.language]);

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

  // Local time calculations starting from local midnight (00:00:00)
  const now = new Date();
  const hoursToday = now.getHours();
  const minutesToday = now.getMinutes();
  const secondsToday = now.getSeconds();
  const totalSecondsToday = (hoursToday * 3600) + (minutesToday * 60) + secondsToday;
  const totalSecondsInDay = 86400; // 24 * 3600
  const dailyProgressRatio = Math.min(Math.max(totalSecondsToday / totalSecondsInDay, 0), 1);
  const dailyProgressPercent = Math.min(100, Math.max(0, Math.round(dailyProgressRatio * 100)));
  const dailyProgressPercentExact = (dailyProgressRatio * 100).toFixed(1);

  const hoursTodayStr = hoursToday.toString().padStart(2, '0');
  const minutesTodayStr = minutesToday.toString().padStart(2, '0');
  const secondsTodayStr = secondsToday.toString().padStart(2, '0');

  const getAccumulatedTimeString = () => {
    return formatAccumulatedTime(timeGroundedString, state.language);
  };

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
      
      {/* 1. Thin Tile at Top: Accumulated Progress with NA Keytag Droplet Badge */}
      <section className="w-full max-w-xl mx-auto px-4 z-20">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="w-full bg-white hover:bg-[#FAF8F5] border border-black/10 rounded-2xl p-3.5 sm:p-4 shadow-sm transition-all hover:shadow hover:scale-[1.005] active:scale-[0.995] flex items-center justify-between gap-3 text-left cursor-pointer group"
          title={getLangText('Tap to open Settings', 'Toca para abrir Ajustes', 'Toque para abrir Configurações')}
        >
          <div className="flex flex-col min-w-0 pr-2 overflow-hidden">
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-extrabold text-black/50 block mb-0.5 whitespace-nowrap">
              {getLangText('Accumulated Progress', 'Progreso Acumulado', 'Progresso Acumulado')}
            </span>
            <h2 className="font-serif text-base sm:text-lg md:text-xl text-[#111111] font-normal tracking-tight leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
              {getAccumulatedTimeString()}
            </h2>
          </div>

          <div className="shrink-0 flex items-center">
            <NAKeytagBadge
              totalDays={timeGroundedString.totalAccumulatedDays}
              months={timeGroundedString.months}
              years={timeGroundedString.years}
              language={state.language}
            />
          </div>
        </button>
      </section>

      {/* 2. Tile for Daily Progress of 'Just for Today' wrapping progress, renew, and reset */}
      <section className="w-full max-w-xl mx-auto px-4 z-20">
        <div className={`border rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-sm flex flex-col gap-2.5 sm:gap-3 relative transition-all duration-300 ${
          state.soberCheckedInToday
            ? 'bg-[#e2f1ec] border-emerald-800/20'
            : 'bg-white border-black/10'
        }`}>
          {/* Header row */}
          <div className="flex items-center justify-between pb-2 border-b border-black/5">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 text-[#3e6355] shrink-0" />
              <h3 className="font-sans text-xs md:text-sm font-extrabold text-black uppercase tracking-widest whitespace-nowrap">
                {getLangText('Just for Today', 'Sólo por hoy', 'Só Por Hoje')}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                title={getLangText('Understanding the 24-hour cycle', 'Entendiendo el ciclo de 24 horas', 'Entendendo o ciclo de 24 horas')}
                className="text-black/30 hover:text-[#3e6355] transition-colors p-1 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Digital Time elapsed since local time midnight */}
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#111111] leading-none select-none tracking-tight">
              {hoursTodayStr}h {minutesTodayStr}m{' '}
              <span className="text-black/40 text-xl md:text-2xl font-normal">
                {secondsTodayStr}s
              </span>
            </h2>
          </div>

          {/* Horizontal Progress Bar from Left to Right */}
          <div className="w-full flex flex-col gap-1">
            <div className={`w-full h-3 md:h-3.5 rounded-full overflow-hidden p-0.5 border ${
              state.soberCheckedInToday
                ? 'bg-[#cbe3db] border-emerald-800/10'
                : 'bg-[#E5E1DB] border-black/5'
            }`}>
              <div
                className="h-full bg-[#3e6355] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${dailyProgressPercentExact}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-sans font-bold text-black/45 uppercase tracking-wider px-0.5">
              <span>0</span>
              <span>{dailyProgressPercent}%</span>
              <span>24</span>
            </div>
          </div>

          {/* Side-by-Side Commitment & Reset Oval Buttons inside this tile */}
          <div className="flex gap-2.5 w-full pt-2 border-t border-black/5">
            {/* Renew Commitment Button */}
            <button
              type="button"
              onClick={() => setOpenBottomSheet('renew')}
              className={`flex-1 py-2.5 px-3 rounded-full font-sans text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
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
              type="button"
              onClick={() => setOpenBottomSheet('reset')}
              className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-full font-sans text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>{getLangText('Reset', 'Reiniciar', 'Zerar')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Focus Message Card (Changes automatically every day without asking for a new intention) */}
      <section className="max-w-xl mx-auto w-full z-10 border-t border-black/5 pt-4 mt-1 px-4">
        <div className="bg-white/40 rounded-3xl py-5 px-6 border border-black/5 shadow-sm text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-black/60" />
            <h2 className="font-sans text-[10px] font-bold text-black/60 uppercase tracking-[0.2em]">
              {getTranslation('focus_today')}
            </h2>
          </div>
          
          <blockquote className="font-serif text-base md:text-lg text-[#111111] italic leading-relaxed text-center min-h-[48px] transition-all">
            "{todayFocusMessage}"
          </blockquote>
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
                      <span className="text-[9px] text-[#3e6355] bg-[#3e6355]/10 px-1.5 py-0.5 font-normal lowercase tracking-wider rounded-md">
                        {getLangText('active', 'activo', 'ativo')}
                      </span>
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


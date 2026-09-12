/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSanctuary } from '../context/SanctuaryContext';
import {
  Volume2,
  Heart,
  Info,
  X
} from 'lucide-react';

interface BreathingPattern {
  name: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  description: string;
  durationText: string;
}

const BREATHING_TECHNIQUES: BreathingPattern[] = [
  {
    name: 'Box Breathing',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    description: 'A structured technique to heighten concentration and deeply relax the nervous system.',
    durationText: '5 mins'
  },
  {
    name: 'Relaxing Breath',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    description: "Known as the 'relaxing breath', acts as a natural tranquilizer for the nervous system.",
    durationText: '3 mins'
  },
  {
    name: 'Deep Belly',
    inhale: 5,
    hold1: 0,
    exhale: 5,
    hold2: 0,
    description: 'Diaphragmatic breathing encourages full oxygen exchange, lowering heart rate and stabilizing blood pressure.',
    durationText: '10 mins'
  }
];

const BREATHING_TRANSLATIONS: Record<string, Record<'English' | 'Español' | 'Português', { name: string; line1: string; line2: string; description: string; durationText: string }>> = {
  'Box Breathing': {
    English: {
      name: 'Box Breathing',
      line1: 'Box',
      line2: 'Breathing',
      description: 'A structured technique to heighten concentration and deeply relax the nervous system.',
      durationText: '5 mins'
    },
    Español: {
      name: 'Respiración de Caja',
      line1: 'Respiración',
      line2: 'de Caja',
      description: 'Una técnica estructurada para aumentar la concentración y relajar profundamente el sistema nervioso.',
      durationText: '5 min'
    },
    Português: {
      name: 'Respiração Quadrada',
      line1: 'Respiração',
      line2: 'Quadrada',
      description: 'Uma técnica estruturada para aumentar a concentração e relaxar profundamente o sistema nervoso.',
      durationText: '5 min'
    }
  },
  'Relaxing Breath': {
    English: {
      name: 'Relaxing Breath',
      line1: 'Relaxing',
      line2: 'Breath',
      description: "Known as the 'relaxing breath', acts as a natural tranquilizer for the nervous system.",
      durationText: '3 mins'
    },
    Español: {
      name: 'Respiración Relajante',
      line1: 'Respiración',
      line2: 'Relajante',
      description: "Conocida como la 'respiración relajante', actúa como un tranquilizador natural para el sistema nervioso.",
      durationText: '3 min'
    },
    Português: {
      name: 'Respiração Relaxante',
      line1: 'Respiração',
      line2: 'Relaxante',
      description: "Conhecida como a 'respiração relaxante', atua como um tranquilizador natural para o sistema nervoso.",
      durationText: '3 min'
    }
  },
  'Deep Belly': {
    English: {
      name: 'Deep Belly',
      line1: 'Deep',
      line2: 'Belly',
      description: 'Diaphragmatic breathing encourages full oxygen exchange, lowering heart rate and stabilizing blood pressure.',
      durationText: '10 mins'
    },
    Español: {
      name: 'Respiración Abdominal',
      line1: 'Respiración',
      line2: 'Abdominal',
      description: 'La respiración diafragmática fomenta el intercambio completo de oxígeno, disminuyendo el ritmo cardíaco y estabilizando la presión arterial.',
      durationText: '10 min'
    },
    Português: {
      name: 'Respiração Abdominal',
      line1: 'Respiração',
      line2: 'Abdominal',
      description: 'A respiração diafragmática estimula a troca completa de oxigênio, diminuindo o ritmo cardíaco e estabilizando a pressão arterial.',
      durationText: '10 min'
    }
  }
};

interface PhaseStyle {
  hex: string;
  outerBg: string;
  innerBg: string;
  textColor: string;
  borderColor: string;
}

const PHASE_STYLES: Record<'Inhale' | 'Hold' | 'Exhale' | 'Rest', PhaseStyle> = {
  Inhale: {
    hex: '#4A6B5D',
    outerBg: 'rgba(74, 107, 93, 0.12)',
    innerBg: 'bg-[#4A6B5D]',
    textColor: 'text-[#F8F5F2]',
    borderColor: '#4A6B5D',
  },
  Hold: {
    hex: '#A38D6F',
    outerBg: 'rgba(163, 141, 111, 0.12)',
    innerBg: 'bg-[#A38D6F]',
    textColor: 'text-[#F8F5F2]',
    borderColor: '#A38D6F',
  },
  Exhale: {
    hex: '#5A7A8C',
    outerBg: 'rgba(90, 122, 140, 0.12)',
    innerBg: 'bg-[#5A7A8C]',
    textColor: 'text-[#F8F5F2]',
    borderColor: '#5A7A8C',
  },
  Rest: {
    hex: '#8C6B70',
    outerBg: 'rgba(140, 107, 112, 0.12)',
    innerBg: 'bg-[#8C6B70]',
    textColor: 'text-[#F8F5F2]',
    borderColor: '#8C6B70',
  },
};

export const BreathingView: React.FC = () => {
  const { state, getTranslation, addReflection } = useSanctuary();

  const getText = (en: string, es: string, pt: string) => {
    if (state.language === 'English') return en;
    if (state.language === 'Español') return es;
    return pt;
  };

  const getTranslatedPhase = (phase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest', lang: string): string => {
    const translations = {
      Inhale: { English: 'Breathe In', Español: 'Inhala', Português: 'Inspire' },
      Hold: { English: 'Hold', Español: 'Mantén', Português: 'Segure' },
      Exhale: { English: 'Breathe Out', Español: 'Exhala', Português: 'Expire' },
      Rest: { English: 'Rest', Español: 'Descansa', Português: 'Descanse' },
    };
    const key = lang === 'English' ? 'English' : lang === 'Español' ? 'Español' : 'Português';
    return translations[phase][key];
  };

  const getTranslatedBreathing = (tech: BreathingPattern) => {
    const lang = state.language;
    const entry = BREATHING_TRANSLATIONS[tech.name];
    if (entry) {
      return entry[lang];
    }
    const words = tech.name.split(' ');
    return {
      name: tech.name,
      line1: words[0] || tech.name,
      line2: words.slice(1).join(' ') || '',
      description: tech.description,
      durationText: tech.durationText
    };
  };

  // Sensory Feedback States
  const [feedbackTone, setFeedbackTone] = useState<boolean>(true);
  const [feedbackHaptic, setFeedbackHaptic] = useState<boolean>(true);

  const feedbackOptionsRef = useRef({ feedbackTone, feedbackHaptic, language: state.language });
  useEffect(() => {
    feedbackOptionsRef.current = { feedbackTone, feedbackHaptic, language: state.language };
  }, [feedbackTone, feedbackHaptic, state.language]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    return audioCtxRef.current;
  };

  const initAudioAndFeedback = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }

      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      const iosHaptic = (window as any).webkit?.messageHandlers?.haptic || (window as any).haptic;
      if (iosHaptic) {
        if (typeof iosHaptic.postMessage === 'function') {
          iosHaptic.postMessage({ type: 'impact', style: 'soft' });
        } else if (typeof iosHaptic.trigger === 'function') {
          iosHaptic.trigger('soft');
        }
      }
    } catch (e) {
      console.warn('Feedback initialization error:', e);
    }
  };

  const triggerHapticFeedback = (style: 'soft' | 'light') => {
    try {
      if (navigator.vibrate) {
        if (style === 'soft') {
          navigator.vibrate([15]);
        } else {
          navigator.vibrate([35]);
        }
      }
      const iosHaptic = (window as any).webkit?.messageHandlers?.haptic || (window as any).haptic;
      if (iosHaptic) {
        if (typeof iosHaptic.postMessage === 'function') {
          iosHaptic.postMessage({ type: 'impact', style });
        } else if (typeof iosHaptic.trigger === 'function') {
          iosHaptic.trigger(style);
        }
      }
    } catch (e) {
      console.warn('Haptic trigger error:', e);
    }
  };

  const playPhaseTone = (phase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest') => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = 'sine';

      // Soft frequencies for phase transitions
      let freq = 220; // Inhale
      if (phase === 'Hold') freq = 277.18; // C#4
      if (phase === 'Exhale') freq = 329.63; // E4
      if (phase === 'Rest') freq = 369.99; // F#4

      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Tone play error:', e);
    }
  };

  const triggerPhaseFeedback = (phase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest') => {
    const opts = feedbackOptionsRef.current;
    if (opts.feedbackTone) {
      playPhaseTone(phase);
    }
    if (opts.feedbackHaptic) {
      const style = (phase === 'Hold' || phase === 'Rest') ? 'soft' : 'light';
      triggerHapticFeedback(style);
    }
  };

  // Breathing Coach State
  const [selectedBreathing, setSelectedBreathing] = useState<BreathingPattern>(BREATHING_TECHNIQUES[0]);
  const [infoTech, setInfoTech] = useState<BreathingPattern | null>(null);
  const [isBreathingRunning, setIsBreathingRunning] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState<number>(4);
  const [breathingSessionTimeLeft, setBreathingSessionTimeLeft] = useState<number>(300);
  const [breathingProgress, setBreathingProgress] = useState<number>(0);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound chime helper
  const playBreathingChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 3.0);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 3.0);
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  };

  // Breathing Coach cycle logic with sub-second interval for smooth scaling
  useEffect(() => {
    if (isBreathingRunning) {
      const durationSeconds = selectedBreathing.name.includes('Box') 
        ? 300 
        : (selectedBreathing.name.includes('Relaxing') || selectedBreathing.name.includes('4-7-8'))
        ? 180 
        : 600;

      setBreathingSecondsLeft(selectedBreathing.inhale);
      setBreathingPhase('Inhale');
      setBreathingProgress(0);
      setBreathingSessionTimeLeft(durationSeconds);

      // Trigger initial breathing feedback
      triggerPhaseFeedback('Inhale');

      let currentPhase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest' = 'Inhale';
      let phaseDuration = selectedBreathing.inhale;
      let phaseElapsedMs = 0;
      let sessionTimeLeftMs = durationSeconds * 1000;

      breathingTimerRef.current = setInterval(() => {
        phaseElapsedMs += 100;
        sessionTimeLeftMs -= 100;

        // Session timer calculation
        const currentSessionSecs = Math.max(0, Math.ceil(sessionTimeLeftMs / 1000));
        setBreathingSessionTimeLeft(currentSessionSecs);

        // Check overall completion
        if (sessionTimeLeftMs <= 0) {
          setIsBreathingRunning(false);
          if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
          playBreathingChime();
          addReflection(
            getText('Breathing Exercise Complete', 'Ejercicio de respiración completado', 'Exercício de respiración concluído'),
            getText(
              `Completed a centering ${getTranslatedBreathing(selectedBreathing).name} session. Synchronized body and mind with deliberate breathing patterns.`,
              `Completé una sesión centradora de ${getTranslatedBreathing(selectedBreathing).name}. Sincronicé mi cuerpo y mente con mi respiración.`,
              `Completei uma sessão de ${getTranslatedBreathing(selectedBreathing).name}. Sincronizei corpo e mente respirando fundo.`
            ),
            ['Calm', 'Peaceful', 'Content']
          );
          alert(getText('Your breathing exercise session is complete. Feel the stillness.', 'Tu ejercicio de respiración ha terminado. Siente la quietud.', 'Seu exercício de respiração acabou. Sinta a calma.'));
          return;
        }

        // Calculate visual progress fraction (from 0 to 1) for smooth scale
        const progress = Math.min(1, phaseElapsedMs / (phaseDuration * 1000));
        setBreathingProgress(progress);

        // Seconds remaining in current phase
        const secondsLeft = Math.max(0, Math.ceil(phaseDuration - (phaseElapsedMs / 1000)));
        setBreathingSecondsLeft(secondsLeft);

        // Transition to next phase upon completion
        if (phaseElapsedMs >= phaseDuration * 1000) {
          phaseElapsedMs = 0;
          setBreathingProgress(0);

          if (currentPhase === 'Inhale') {
            if (selectedBreathing.hold1 > 0) {
              currentPhase = 'Hold';
              phaseDuration = selectedBreathing.hold1;
            } else {
              currentPhase = 'Exhale';
              phaseDuration = selectedBreathing.exhale;
            }
          } else if (currentPhase === 'Hold') {
            currentPhase = 'Exhale';
            phaseDuration = selectedBreathing.exhale;
          } else if (currentPhase === 'Exhale') {
            if (selectedBreathing.hold2 > 0) {
              currentPhase = 'Rest';
              phaseDuration = selectedBreathing.hold2;
            } else {
              currentPhase = 'Inhale';
              phaseDuration = selectedBreathing.inhale;
            }
          } else if (currentPhase === 'Rest') {
            currentPhase = 'Inhale';
            phaseDuration = selectedBreathing.inhale;
          }

          setBreathingPhase(currentPhase);
          setBreathingSecondsLeft(phaseDuration);

          // Trigger transition feedback
          triggerPhaseFeedback(currentPhase);
        }
      }, 100);
    } else {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
      setBreathingPhase('Inhale');
      setBreathingSecondsLeft(selectedBreathing.inhale);
      setBreathingProgress(0);
      const defaultSeconds = selectedBreathing.name.includes('Box') 
        ? 300 
        : (selectedBreathing.name.includes('Relaxing') || selectedBreathing.name.includes('4-7-8'))
        ? 180 
        : 600;
      setBreathingSessionTimeLeft(defaultSeconds);
    }

    return () => {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, [isBreathingRunning, selectedBreathing, state.language]);

  const handleBreathingSelect = (tech: BreathingPattern) => {
    setSelectedBreathing(tech);
    setIsBreathingRunning(false);
    setBreathingSecondsLeft(tech.inhale);
    setBreathingPhase('Inhale');
    setBreathingProgress(0);
    const secs = tech.name.includes('Box') 
      ? 300 
      : (tech.name.includes('Relaxing') || tech.name.includes('4-7-8')) 
      ? 180 
      : 600;
    setBreathingSessionTimeLeft(secs);
  };

  const getBreathingScale = () => {
    if (!isBreathingRunning) return 1.0;
    const minScale = 0.85;
    const maxScale = 1.25;
    const diff = maxScale - minScale;
    
    switch (breathingPhase) {
      case 'Inhale':
        return minScale + diff * breathingProgress;
      case 'Hold':
        return maxScale;
      case 'Exhale':
        return maxScale - diff * breathingProgress;
      case 'Rest':
        return minScale;
      default:
        return 1.0;
    }
  };

  const getPhaseInstruction = (phase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest', lang: string): string => {
    const instructions = {
      Inhale: { English: 'Inhale deeply', Español: 'Inhala profundamente', Português: 'Inspire profundamente' },
      Hold: { English: 'Hold your breath', Español: 'Mantén el aire', Português: 'Segure a respiração' },
      Exhale: { English: 'Exhale slowly', Español: 'Exhala lentamente', Português: 'Expire lentamente' },
      Rest: { English: 'Rest and relax', Español: 'Descansa y relájate', Português: 'Descanse e relaxe' },
    };
    const key = lang === 'English' ? 'English' : lang === 'Español' ? 'Español' : 'Português';
    return instructions[phase][key];
  };

  const currentScale = getBreathingScale();

  const getWaterFillPercentage = () => {
    if (!isBreathingRunning) return 0;
    switch (breathingPhase) {
      case 'Inhale':
        return Math.min(100, Math.max(0, breathingProgress * 100));
      case 'Hold':
        return 100;
      case 'Exhale':
        return Math.min(100, Math.max(0, (1 - breathingProgress) * 100));
      case 'Rest':
        return 0;
      default:
        return 0;
    }
  };

  const waterFill = getWaterFillPercentage();
  const currentPhaseHex = isBreathingRunning ? PHASE_STYLES[breathingPhase].hex : '#4A6B5D';

  return (
    <div className="flex flex-col gap-2">
      {/* Breathing Header with reduced whitespace */}
      <section className="text-center max-w-2xl mx-auto flex flex-col items-center pt-0 pb-1 w-full">
        <h2 className="font-serif text-2xl sm:text-3xl text-black mb-1 font-normal tracking-tight">
          {getTranslation('breathing_exercises')}
        </h2>
        <p className="font-sans text-xs text-black/60 italic leading-snug max-w-lg mb-0">
          {getText(
            'Conscious diaphragmatic breathing exercises to regulate the nervous system and anchor your awareness.',
            'Ejercicios conscientes de respiración diafragmática para regular el sistema nervioso y anclar tu atención.',
            'Exercícios conscientes de respiração diafragmática para regular o sistema nervoso e ancorar a sua atenção.'
          )}
        </p>
      </section>

      {/* Breathing Coach visual visualization */}
      <section className="flex flex-col items-center justify-center w-full max-w-md mx-auto pt-1 pb-3 relative">
        {/* 3 Boxed Breathing Technique Options with balanced padding */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full max-w-md mx-auto mb-2">
          {BREATHING_TECHNIQUES.map(tech => {
            const isSelected = selectedBreathing.name === tech.name;
            const trans = getTranslatedBreathing(tech);
            const ratioLabel = tech.name === 'Box Breathing' ? '4-4-4-4' : (tech.name.includes('Relaxing') || tech.name.includes('4-7-8')) ? '4-7-8' : '5-5';

            return (
              <div
                key={tech.name}
                role="button"
                tabIndex={0}
                onClick={() => handleBreathingSelect(tech)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleBreathingSelect(tech);
                  }
                }}
                className={`relative flex flex-col items-center justify-between py-2 px-1.5 rounded-2xl border transition-all cursor-pointer text-center select-none min-h-[64px] ${
                  isSelected
                    ? 'bg-black text-[#F8F5F2] border-black shadow-sm ring-1 ring-black'
                    : 'bg-white/70 hover:bg-white text-black/80 border-black/10 hover:border-black/30'
                }`}
              >
                {/* Little (i) button to show popup */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoTech(tech);
                  }}
                  aria-label={`${trans.name} info`}
                  className={`absolute top-1 right-1 p-1 rounded-full transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-[#F8F5F2]/70 hover:text-[#F8F5F2] hover:bg-white/15'
                      : 'text-black/40 hover:text-black hover:bg-black/5'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                {/* 2-line Name */}
                <div className="flex flex-col items-center justify-center font-sans text-[11px] sm:text-xs font-bold leading-tight px-0.5">
                  <span className="block">{trans.line1}</span>
                  <span className="block">{trans.line2}</span>
                </div>

                {/* Ratio Label */}
                <span className={`font-mono text-[10px] sm:text-[11px] mt-1 font-semibold tracking-tight ${
                  isSelected ? 'text-[#F8F5F2]/70' : 'text-black/50'
                }`}>
                  {ratioLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Combined Start/Stop and Countdown Duration Pill - placed immediately below 3 boxes with minimal whitespace */}
        <div className="mt-1 mb-2 relative z-20">
          <button
            onClick={() => {
              initAudioAndFeedback();
              setIsBreathingRunning(!isBreathingRunning);
            }}
            className={`cursor-pointer px-6 py-2.5 rounded-full font-sans text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-sm flex items-center gap-2 border touch-manipulation active:scale-95 ${
              isBreathingRunning
                ? 'bg-red-800/90 hover:bg-red-700 text-white border-red-900/30'
                : 'bg-black hover:bg-black/80 text-[#F8F5F2] border-black'
            }`}
          >
            {isBreathingRunning ? (
              <>
                <span>{getTranslation('pause_session')}</span>
                <span className="opacity-65">•</span>
                <span className="font-mono text-[10px] font-normal tracking-normal text-[#F8F5F2]">
                  {Math.floor(breathingSessionTimeLeft / 60)}:{String(breathingSessionTimeLeft % 60).padStart(2, '0')}
                </span>
              </>
            ) : (
              <>
                <span>{getTranslation('start_session')}</span>
                <span className="opacity-65">•</span>
                <span className="font-mono text-[10px] font-normal tracking-normal text-[#F8F5F2]">
                  {Math.floor(breathingSessionTimeLeft / 60)}:{String(breathingSessionTimeLeft % 60).padStart(2, '0')}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Breathing circle container with just enough clearance for expansion boundary */}
        <div className="relative w-[284px] h-[284px] flex items-center justify-center pointer-events-none my-1">
          {/* Subtle guideline showing max breath expansion boundary */}
          <div
            className="absolute w-56 h-56 rounded-full border border-black/10 pointer-events-none transition-opacity duration-500"
            style={{
              transform: 'scale(1.22)',
              opacity: isBreathingRunning ? 0.25 : 0.1,
            }}
          />

          {/* Main Breathing Circle (Glass Vessel) with thin outline */}
          <div
            className="relative z-10 w-48 h-48 sm:w-52 sm:h-52 rounded-full overflow-hidden flex flex-col items-center justify-center text-white border-[1.5px] pointer-events-none transition-all"
            style={{
              transform: `scale(${currentScale})`,
              borderColor: isBreathingRunning ? PHASE_STYLES[breathingPhase].borderColor : 'rgba(0, 0, 0, 0.15)',
              backgroundColor: '#161918',
              boxShadow: isBreathingRunning
                ? `0 10px 25px -4px rgba(0, 0, 0, 0.22), 0 0 0 1px ${PHASE_STYLES[breathingPhase].borderColor}33`
                : '0 4px 16px -2px rgba(0, 0, 0, 0.12)',
              transition: 'transform 100ms linear, border-color 400ms ease, box-shadow 400ms ease',
            }}
          >
            {/* Water Liquid Body - Fills and empties like a glass of water */}
            <div
              className="absolute bottom-0 left-0 right-0 overflow-visible pointer-events-none"
              style={{
                height: `${waterFill}%`,
                opacity: waterFill > 0 ? 1 : 0,
                backgroundColor: currentPhaseHex,
                transition: 'height 100ms linear, background-color 400ms ease, opacity 200ms ease',
              }}
            >
              {/* Fluid water surface waves */}
              {waterFill > 0 && waterFill < 99 && (
                <>
                  <svg
                    className="absolute -top-3 left-0 w-[200%] h-4 text-white/20 animate-wave-slow pointer-events-none"
                    viewBox="0 0 800 40"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0 20 Q 100 35 200 20 T 400 20 Q 500 35 600 20 T 800 20 L 800 40 L 0 40 Z"
                      fill="currentColor"
                    />
                  </svg>
                  <svg
                    className="absolute -top-2.5 left-0 w-[200%] h-4 text-black/15 animate-wave-fast pointer-events-none"
                    viewBox="0 0 800 40"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0 20 Q 100 5 200 20 T 400 20 Q 500 5 600 20 T 800 20 L 800 40 L 0 40 Z"
                      fill="currentColor"
                    />
                  </svg>
                </>
              )}

              {/* Subtle water depth shading */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/15 pointer-events-none" />
            </div>

            {/* Subtle glass reflection highlight on the curved vessel */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/12 via-transparent to-black/20 pointer-events-none z-10" />

            {/* Center Phase and Timer Content */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center px-4">
              <span className="font-serif text-xl sm:text-2xl font-normal mb-1.5 text-[#F8F5F2] tracking-wide text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                {isBreathingRunning ? getTranslatedPhase(breathingPhase, state.language) : (getText('Breathing', 'Respirando', 'Respirando'))}
              </span>
              
              <span className="font-sans text-[20px] sm:text-[22px] font-bold text-[#F8F5F2] select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] tracking-tight">
                {isBreathingRunning ? `${breathingSecondsLeft}s` : '•••'}
              </span>

              <span className="font-sans text-[8.5px] sm:text-[9px] font-bold uppercase tracking-widest text-[#F8F5F2]/80 mt-1.5 text-center px-4 leading-normal max-w-[140px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                {isBreathingRunning
                  ? getPhaseInstruction(breathingPhase, state.language)
                  : getTranslation('find_center')}
              </span>
            </div>
          </div>
        </div>

        {/* Sensory Guidance Preferences Option Panel */}
        <div className="bg-[#E5E1DB]/40 border border-black/5 rounded-3xl p-4 w-full max-w-sm mx-auto text-center mt-2">
          <span className="font-sans text-[9px] font-extrabold tracking-widest uppercase text-black/50 block mb-3">
            {getText('Sensory Guidance', 'Guía sensorial', 'Guia sensorial')}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const newVal = !feedbackTone;
                setFeedbackTone(newVal);
                initAudioAndFeedback();
                if (newVal) {
                  setTimeout(() => playPhaseTone('Inhale'), 50);
                }
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer ${
                feedbackTone 
                  ? 'border-black bg-black text-[#F8F5F2]' 
                  : 'border-black/10 bg-white/50 text-black/60 hover:bg-black/5'
              }`}
            >
              <Volume2 className="w-4 h-4 mb-1" />
              <span className="font-sans text-[9px] font-bold tracking-tight">
                {getText('Tones', 'Tonos', 'Tons')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const newVal = !feedbackHaptic;
                setFeedbackHaptic(newVal);
                initAudioAndFeedback();
                if (newVal) {
                  setTimeout(() => triggerHapticFeedback('light'), 50);
                }
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer ${
                feedbackHaptic 
                  ? 'border-black bg-black text-[#F8F5F2]' 
                  : 'border-black/10 bg-white/50 text-black/60 hover:bg-black/5'
              }`}
            >
              <Heart className="w-4 h-4 mb-1" />
              <span className="font-sans text-[9px] font-bold tracking-tight">
                {getText('Haptics', 'Vibración', 'Tátil')}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Information Modal for Breathing Technique - rendered via Portal centered on visible screen */}
      {infoTech && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn"
          onClick={() => setInfoTech(null)}
        >
          <div
            className="bg-[#F8F5F2] border border-black/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInfoTech(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 text-black/60 hover:text-black cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2 pr-8">
              <span className="inline-flex p-1.5 rounded-xl bg-black/5 text-black shrink-0">
                <Info className="w-4 h-4" />
              </span>
              <h4 className="font-serif text-xl font-normal text-black leading-snug">
                {getTranslatedBreathing(infoTech).name}
              </h4>
            </div>

            <div className="inline-block bg-black/5 font-mono text-[10px] text-black/70 px-2.5 py-0.5 rounded-full mb-3 font-semibold">
              {infoTech.name === 'Box Breathing' ? '4-4-4-4' : (infoTech.name.includes('Relaxing') || infoTech.name.includes('4-7-8')) ? '4-7-8' : '5-5'} • {getTranslatedBreathing(infoTech).durationText}
            </div>

            <p className="font-sans text-xs text-black/70 leading-relaxed mb-4">
              {getTranslatedBreathing(infoTech).description}
            </p>

            <div className="text-[11px] font-sans text-black/70 bg-white border border-black/5 rounded-2xl p-3 mb-5">
              <span className="font-bold text-black block mb-2 uppercase tracking-widest text-[9px]">
                {getText('Rhythm Breakdown', 'Desglose de ritmo', 'Detalhamento do ritmo')}
              </span>
              <div className="flex justify-around text-center pt-1 border-t border-black/5">
                <div>
                  <div className="font-bold text-black font-mono text-xs">{infoTech.inhale}s</div>
                  <div className="text-[9px] text-black/50 uppercase tracking-wider mt-0.5">{getTranslation('inhale')}</div>
                </div>
                {infoTech.hold1 > 0 && (
                  <div>
                    <div className="font-bold text-black font-mono text-xs">{infoTech.hold1}s</div>
                    <div className="text-[9px] text-black/50 uppercase tracking-wider mt-0.5">{getTranslation('hold')}</div>
                  </div>
                )}
                <div>
                  <div className="font-bold text-black font-mono text-xs">{infoTech.exhale}s</div>
                  <div className="text-[9px] text-black/50 uppercase tracking-wider mt-0.5">{getTranslation('exhale')}</div>
                </div>
                {infoTech.hold2 > 0 && (
                  <div>
                    <div className="font-bold text-black font-mono text-xs">{infoTech.hold2}s</div>
                    <div className="text-[9px] text-black/50 uppercase tracking-wider mt-0.5">{getText('Rest', 'Descanso', 'Descanso')}</div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleBreathingSelect(infoTech);
                setInfoTech(null);
              }}
              className="w-full bg-black text-[#F8F5F2] hover:bg-black/80 rounded-full py-3 font-sans text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer text-center"
            >
              {selectedBreathing.name === infoTech.name
                ? getText('Selected Pattern', 'Técnica seleccionada', 'Padrão selecionado')
                : getText('Select Pattern', 'Seleccionar técnica', 'Selecionar padrão')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

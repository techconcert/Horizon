/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSanctuary } from '../context/SanctuaryContext';
import { MoodType } from '../types';
import {
  Play,
  Pause,
  Clock,
  Sparkles,
  BookOpen,
  Volume2,
  X,
  Compass,
  CheckCircle2,
  Heart
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
    name: '4-7-8 Relaxing Breath',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    description: "Known as the 'relaxing breath', acts as a natural tranquilizer for the nervous system.",
    durationText: '3 mins'
  },
  {
    name: 'Deep Belly Breathing',
    inhale: 5,
    hold1: 0,
    exhale: 5,
    hold2: 0,
    description: 'Diaphragmatic breathing encourages full oxygen exchange, lowering heart rate and stabilizing blood pressure.',
    durationText: '10 mins'
  }
];

const BREATHING_TRANSLATIONS: Record<string, Record<'English' | 'Español' | 'Português', { name: string; description: string; durationText: string }>> = {
  'Box Breathing': {
    English: {
      name: 'Box Breathing',
      description: 'A structured technique to heighten concentration and deeply relax the nervous system.',
      durationText: '5 mins'
    },
    Español: {
      name: 'Respiración de Caja',
      description: 'Una técnica estructurada para aumentar la concentración y relajar profundamente el sistema nervioso.',
      durationText: '5 min'
    },
    Português: {
      name: 'Respiração Quadrada',
      description: 'Uma técnica estruturada para aumentar a concentração e relaxar profundamente o sistema nervoso.',
      durationText: '5 min'
    }
  },
  '4-7-8 Relaxing Breath': {
    English: {
      name: '4-7-8 Relaxing Breath',
      description: "Known as the 'relaxing breath', acts as a natural tranquilizer for the nervous system.",
      durationText: '3 mins'
    },
    Español: {
      name: 'Respiración Relajante 4-7-8',
      description: "Conocida como la 'respiración relajante', actúa como un tranquilizador natural para el sistema nervioso.",
      durationText: '3 min'
    },
    Português: {
      name: 'Respiração Relaxante 4-7-8',
      description: "Conhecida como a 'respiração relaxante', atua como um tranquilizador natural para o sistema nervoso.",
      durationText: '3 min'
    }
  },
  'Deep Belly Breathing': {
    English: {
      name: 'Deep Belly Breathing',
      description: 'Diaphragmatic breathing encourages full oxygen exchange, lowering heart rate and stabilizing blood pressure.',
      durationText: '10 mins'
    },
    Español: {
      name: 'Respiración Abdominal Profunda',
      description: 'La respiración diafragmática fomenta el intercambio completo de oxígeno, disminuyendo el ritmo cardíaco y estabilizando la presión arterial.',
      durationText: '10 min'
    },
    Português: {
      name: 'Respiração Abdominal Profunda',
      description: 'A respiração diafragmática estimula a troca completa de oxigênio, diminuindo o ritmo cardíaco e estabilizando a pressão arterial.',
      durationText: '10 min'
    }
  }
};

interface PhaseStyle {
  outerBg: string;
  innerBg: string;
  textColor: string;
  borderColor: string;
}

const PHASE_STYLES: Record<'Inhale' | 'Hold' | 'Exhale' | 'Rest', PhaseStyle> = {
  Inhale: {
    outerBg: 'rgba(180, 210, 195, 0.6)',
    innerBg: 'bg-[#4A6B5D]',
    textColor: 'text-[#F8F5F2]',
    borderColor: 'border-[#3D574B]',
  },
  Hold: {
    outerBg: 'rgba(235, 218, 193, 0.6)',
    innerBg: 'bg-[#A38D6F]',
    textColor: 'text-[#F8F5F2]',
    borderColor: 'border-[#8B775C]',
  },
  Exhale: {
    outerBg: 'rgba(188, 204, 219, 0.6)',
    innerBg: 'bg-[#5A7A8C]',
    textColor: 'text-[#F8F5F2]',
    borderColor: 'border-[#465E6D]',
  },
  Rest: {
    outerBg: 'rgba(216, 198, 198, 0.6)',
    innerBg: 'bg-[#8C6B70]',
    textColor: 'text-[#F8F5F2]',
    borderColor: 'border-[#70565A]',
  },
};

export const ToolsView: React.FC = () => {
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
    return { name: tech.name, description: tech.description, durationText: tech.durationText };
  };

  const [activeSubTab, setActiveSubTab] = useState<'meditation' | 'breathing'>('meditation');

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
      // 1. Initialize & resume the Web Audio API Context inside a user gesture
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }

      // 2. Perform a tiny haptic trigger to register permission on mobile browsers
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      // 3. Trigger iOS Haptics Bridge if available
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
      console.log(`[Haptic Feedback] Triggered ${style} vibration`);
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

      // Very soothing soft frequencies for phase transitions
      let freq = 220; // Inhale
      if (phase === 'Hold') freq = 277.18; // C#4
      if (phase === 'Exhale') freq = 329.63; // E4
      if (phase === 'Rest') freq = 369.99; // F#4

      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.12); // Quiet/gentle level
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

  // Silent Meditation Timer State
  const [meditationTime, setMeditationTime] = useState<number>(600); // 10 mins default
  const [isMeditationRunning, setIsMeditationRunning] = useState<boolean>(false);
  const [selectedMedDuration, setSelectedMedDuration] = useState<number>(10); // 5, 10, 20
  const medTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Breathing Coach State
  const [selectedBreathing, setSelectedBreathing] = useState<BreathingPattern>(BREATHING_TECHNIQUES[0]);
  const [isBreathingRunning, setIsBreathingRunning] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState<number>(4);
  const [breathingSessionTimeLeft, setBreathingSessionTimeLeft] = useState<number>(300);
  const [breathingProgress, setBreathingProgress] = useState<number>(0);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Guided Prompts state
  const [selectedPrompt, setSelectedPrompt] = useState<{ title: string; content: string; questions: string[] } | null>(null);
  const [promptReflectionText, setPromptReflectionText] = useState('');

  // Sound generator (Web Audio API) for meditation bell
  const playMeditationChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 3.0); // drop pitch

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0); // smooth fade out

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 3.0);
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  };

  // Meditation timer countdown logic
  useEffect(() => {
    if (isMeditationRunning) {
      medTimerRef.current = setInterval(() => {
        setMeditationTime(prev => {
          if (prev <= 1) {
            setIsMeditationRunning(false);
            if (medTimerRef.current) clearInterval(medTimerRef.current);
            playMeditationChime();
            // Automatically log a quiet calm reflection of meditation
            addReflection(
              getText('Silent Meditation Complete', 'Meditación silenciosa completada', 'Meditação silenciosa completada'),
              getText(`Completed a beautiful ${selectedMedDuration}-minute silent meditation. Allowed my thoughts to pass like clouds and returned with a grounded mind.`, `Completé una hermosa meditación silenciosa de ${selectedMedDuration} minutos. Dejé pasar mis pensamientos como nubes y regresé con la mente conectada.`, `Completei uma bela meditação silenciosa de ${selectedMedDuration} minutos. Deixei meus pensamentos passarem como nuvens e retornei com a mente mais focada.`),
              ['Calm', 'Peaceful']
            );
            alert(getText('Your silent meditation session is complete. Return gently.', 'Tu sesión de meditación ha terminado. Regresa suavemente.', 'Sua sessão de meditação acabou. Retorne com calma.'));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (medTimerRef.current) clearInterval(medTimerRef.current);
    }

    return () => {
      if (medTimerRef.current) clearInterval(medTimerRef.current);
    };
  }, [isMeditationRunning, selectedMedDuration, state.language]);

  const handleMeditationDurationSelect = (mins: number) => {
    setSelectedMedDuration(mins);
    setMeditationTime(mins * 60);
    setIsMeditationRunning(false);
  };

  // Breathing Coach cycle logic with sub-second interval for smooth scaling
  useEffect(() => {
    if (isBreathingRunning) {
      const durationSeconds = selectedBreathing.name.includes('Box') 
        ? 300 
        : selectedBreathing.name.includes('4-7-8') 
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
          playMeditationChime();
          addReflection(
            getText('Breathing Exercise Complete', 'Ejercicio de respiración completado', 'Exercício de respiración concluído'),
            getText(`Completed a centering ${getTranslatedBreathing(selectedBreathing).name} session. Synchronized body and mind with deliberate breathing patterns.`, `Completé una sesión centradora de ${getTranslatedBreathing(selectedBreathing).name}. Sincronicé mi cuerpo y mente con mi respiración.`, `Completei uma sessão de ${getTranslatedBreathing(selectedBreathing).name}. Sincronizei corpo e mente respirando fundo.`),
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
        : selectedBreathing.name.includes('4-7-8') 
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
    const secs = tech.name.includes('Box') ? 300 : tech.name.includes('4-7-8') ? 180 : 600;
    setBreathingSessionTimeLeft(secs);
  };

  // Guided prompt journal saver
  const handleSavePromptReflection = () => {
    if (!promptReflectionText.trim() || !selectedPrompt) return;
    addReflection(selectedPrompt.title, promptReflectionText.trim(), ['Peaceful', 'Grateful']);
    setPromptReflectionText('');
    setSelectedPrompt(null);
    alert(getText('Reflection saved successfully to your past logs!', '¡Reflexión guardada con éxito en tus registros!', 'Reflexão salva com sucesso nos seus registros!'));
  };

  const prompts = [
    {
      title: getTranslation('morning_gratitude'),
      content: getTranslation('morning_grat_desc'),
      questions: [
        getText('What are three simple things you can touch or see right now that you are grateful for?', '¿Cuáles son tres cosas sencillas que puedes ver o tocar en este momento por las que te sientas agradecido?', 'Quais são três coisas simples que você pode ver ou tocar agora e pelas quais sente gratidão?'),
        getText('How does recognizing these blessings shift your immediate mental state?', '¿Cómo cambia tu estado de ánimo al reconocer estas cosas buenas?', 'Como reconhecer essas coisas boas muda o seu humor agora?')
      ]
    },
    {
      title: getTranslation('serenity_prayer'),
      content: getTranslation('serenity_desc'),
      questions: [
        getText('What is one specific situation today that you need to surrender control over?', '¿Hay alguna situación de hoy en la que necesites soltar el control?', 'Existe alguma situação de hoje em que você precise abrir mão do controle?'),
        getText('What is one small action of courage you can take that lies completely in your hands?', '¿Cuál es un pequeño acto de valor que puedes hacer que dependa solo de ti?', 'Qual pequena atitude de coragem você pode tomar que dependa apenas de você?')
      ]
    },
    {
      title: getTranslation('evening_release'),
      content: getTranslation('evening_desc'),
      questions: [
        getText('What is one interaction or burden from today that you want to release before sleep?', '¿Qué situación o carga de hoy te gustaría soltar antes de dormir?', 'Que situação ou peso de hoje você gostaria de soltar antes de dormir?'),
        getText('Can you breathe in peace and exhale all remaining guilt or expectations?', '¿Puedes inhalar paz y exhalar cualquier culpa o expectativa que quede?', 'Você consegue inspirar paz e expirar qualquer culpa ou expectativa que sobrou?')
      ]
    }
  ];

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

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-tab Navigation */}
      <div className="flex justify-center border-b border-black/10 pb-2 max-w-md mx-auto w-full">
        <div className="flex justify-center space-x-8">
          <button
            onClick={() => setActiveSubTab('meditation')}
            className={`font-sans text-[10px] font-bold uppercase tracking-widest pb-1 transition-all border-b-2 cursor-pointer ${
              activeSubTab === 'meditation'
                ? 'text-black border-black font-extrabold'
                : 'text-black/40 border-transparent hover:text-black'
            }`}
          >
            {getTranslation('daily_meditation')}
          </button>
          <button
            onClick={() => setActiveSubTab('breathing')}
            className={`font-sans text-[10px] font-bold uppercase tracking-widest pb-1 transition-all border-b-2 cursor-pointer ${
              activeSubTab === 'breathing'
                ? 'text-black border-black font-extrabold'
                : 'text-black/40 border-transparent hover:text-black'
            }`}
          >
            {getTranslation('breathing_exercises')}
          </button>
        </div>
      </div>

      {activeSubTab === 'meditation' ? (
        <>
          {/* Daily Meditation Header */}
          <section className="text-center max-w-2xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#E5E1DB] mb-2 border border-black/10">
              <Compass className="w-3.5 h-3.5 text-black/60" />
              <span className="font-sans text-[9px] font-bold text-black/60 uppercase tracking-widest">Step 11 Tools</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-black mb-2 font-normal tracking-tight">
              {getTranslation('daily_meditation')}
            </h2>
            <p className="font-sans text-xs text-black/60 italic leading-relaxed max-w-lg">
              {getTranslation('meditation_sub')}
            </p>
          </section>

          {/* Daily Meditation Bento Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 max-w-5xl mx-auto w-full">
            {/* Daily Reflection Journal Card (Hero) */}
            <article className="md:col-span-8 bg-white rounded-3xl p-5 md:p-6 border border-black/10 shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 text-black/5 opacity-5">
                <BookOpen className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <span className="font-sans text-[10px] font-bold text-red-900 mb-2 block uppercase tracking-widest">
                  {getTranslation('reflection_day')}
                </span>
                <h3 className="font-serif text-xl md:text-2xl text-black font-normal mb-3 pr-8">
                  {getTranslation('space_thoughts')}
                </h3>
                <div className="font-sans text-xs text-black/70 leading-relaxed space-y-3 mb-4">
                  <p>{getTranslation('space_desc')}</p>
                  <p>{getTranslation('space_footer')}</p>
                </div>
                <button
                  onClick={() => {
                    // Navigate to prompt
                    setSelectedPrompt({
                      title: getTranslation('space_thoughts'),
                      content: getTranslation('space_desc'),
                      questions: [
                        getText('Write about what arises when you try to find silence today.', 'Escribe sobre lo que sientes cuando intentas buscar el silencio hoy.', 'Escreva sobre o que você sente quando tenta buscar o silêncio hoje.'),
                        getText('How does listening to stillness change your perspective?', '¿Cómo cambia tu perspectiva al simplemente escuchar la quietud?', 'Como sua perspectiva muda ao simplesmente escutar o silêncio?')
                      ]
                    });
                  }}
                  className="inline-flex items-center gap-1.5 bg-transparent text-black border border-black hover:bg-black hover:text-[#F8F5F2] px-5 py-3 font-sans text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer rounded-full"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{getTranslation('journal_thoughts')}</span>
                </button>
              </div>
            </article>

            {/* Silent Meditation Timer Component */}
            <aside className="md:col-span-4 bg-[#E5E1DB] rounded-3xl p-4 border border-black/10 shadow-none flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-2">
                  <span className="font-sans text-[10px] font-bold text-black uppercase tracking-widest">
                    {getTranslation('silent_meditation')}
                  </span>
                  <Clock className="w-4 h-4 text-black/60" />
                </div>

                {/* Circular Timer Clock Display */}
                <div className="aspect-square w-full max-w-[150px] mx-auto rounded-full border-2 border-black/10 flex items-center justify-center mb-4 relative bg-white">
                  {/* Visual Progress Highlight */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      className="stroke-black"
                      strokeWidth="2.5"
                      strokeDasharray="289.02"
                      strokeDashoffset={(289.02 * (1 - meditationTime / (selectedMedDuration * 60))).toFixed(2)}
                    />
                  </svg>
                  <span className="font-serif text-3xl text-[#111111] font-normal tracking-tight">
                    {Math.floor(meditationTime / 60)}:{String(meditationTime % 60).padStart(2, '0')}
                  </span>
                </div>

                {/* Duration select button controls */}
                <div className="flex justify-center gap-2 mb-4">
                  {[5, 10, 20].map(mins => (
                    <button
                      key={mins}
                      onClick={() => handleMeditationDurationSelect(mins)}
                      className={`px-3 py-1.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest cursor-pointer border transition-colors ${
                        selectedMedDuration === mins
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-black/10 text-black/60 hover:bg-[#E5E1DB]'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  initAudioAndFeedback();
                  setIsMeditationRunning(!isMeditationRunning);
                }}
                className="w-full bg-black text-[#F8F5F2] hover:bg-black/80 rounded-full py-3 font-sans text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-black shadow-none"
              >
                {isMeditationRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isMeditationRunning ? 'Pause Silence' : getTranslation('begin_silence')}</span>
              </button>
            </aside>
          </div>

          {/* Guided Prayers Collection */}
          <section className="max-w-5xl mx-auto w-full mt-4">
            <h3 className="font-serif text-xl text-black mb-2 font-normal border-b border-black/5 pb-2">
              {getTranslation('guided_prompts')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {prompts.map(p => (
                <div
                  key={p.title}
                  onClick={() => setSelectedPrompt(p)}
                  className="bg-white rounded-3xl p-5 border border-black/10 shadow-none hover:border-black/30 cursor-pointer group transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#E5E1DB] text-black flex items-center justify-center mb-3 border border-black/10">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif text-lg font-normal text-[#111111] mb-1.5">
                    {p.title}
                  </h4>
                  <p className="font-sans text-xs text-black/60 leading-relaxed line-clamp-2">
                    {p.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* Breathing Exercises Sub-Tab Panel */
        <>
          <section className="text-center max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="font-serif text-3xl md:text-4xl text-black mb-2 font-normal tracking-tight">
              {getTranslation('breathing_exercises')}
            </h2>
            <p className="font-sans text-xs text-black/60 italic">
              {getTranslation('find_center')}
            </p>
          </section>

          {/* Breathing Coach visual visualization */}
          <section className="flex flex-col items-center justify-center w-full max-w-md mx-auto py-6 relative">
            {/* Technique Title above the circle */}
            <div className="mb-6 text-center">
              <h3 className="font-sans text-[11px] font-bold text-black tracking-widest uppercase">
                {getTranslatedBreathing(selectedBreathing).name}
              </h3>
              <span className="font-serif text-xs italic text-black/50 mt-1 block">
                ({selectedBreathing.inhale}-{selectedBreathing.hold1}-{selectedBreathing.exhale}-{selectedBreathing.hold2})
              </span>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center pointer-events-none">
              {/* Outer pulsing scaling circle */}
              <div
                className="absolute inset-0 rounded-full transition-all pointer-events-none"
                style={{
                  backgroundColor: isBreathingRunning ? PHASE_STYLES[breathingPhase].outerBg : 'rgba(229, 225, 219, 0.5)',
                  transform: `scale(${currentScale * 1.15})`,
                  opacity: isBreathingRunning ? 1 : 0.4,
                  transition: 'transform 100ms linear, background-color 400ms ease, opacity 400ms ease'
                }}
              />

              {/* Inner core circle */}
              <div
                className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center text-white shadow-none border border-white/5 transition-all duration-300 pointer-events-none ${
                  isBreathingRunning ? PHASE_STYLES[breathingPhase].innerBg : 'bg-black'
                }`}
                style={{
                  transform: `scale(${currentScale})`,
                  transition: 'transform 100ms linear, background-color 300ms ease'
                }}
              >
                <span className="font-serif text-xl font-normal mb-1.5 text-[#F8F5F2] tracking-wide text-center px-4">
                  {isBreathingRunning ? getTranslatedPhase(breathingPhase, state.language) : (getText('Breathing', 'Respirando', 'Respirando'))}
                </span>
                
                <span className="font-sans text-[18px] font-bold text-[#F8F5F2] select-none">
                  {isBreathingRunning ? `${breathingSecondsLeft}s` : '•••'}
                </span>

                <span className="font-sans text-[8px] font-bold uppercase tracking-widest text-[#F8F5F2]/60 mt-1.5 text-center px-4 leading-normal max-w-[150px]">
                  {isBreathingRunning
                    ? getPhaseInstruction(breathingPhase, state.language)
                    : getTranslation('current_badge')}
                </span>
              </div>
            </div>

            {/* Combined Start/Stop and Countdown Duration Pill */}
            <div className="mt-8 mb-6 relative z-20">
              <button
                onClick={() => {
                  initAudioAndFeedback();
                  setIsBreathingRunning(!isBreathingRunning);
                }}
                className="bg-black text-[#F8F5F2] hover:bg-black/80 font-sans text-[10px] font-bold tracking-widest uppercase px-8 py-3 rounded-full transition-all cursor-pointer border border-black shadow-none flex items-center justify-center gap-2 min-w-[200px] relative z-20"
              >
                {isBreathingRunning ? (
                  <>
                    <span>{getTranslation('stop_session')}</span>
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

            {/* Sensory Guidance Preferences Option Panel */}
            <div className="bg-[#E5E1DB]/40 border border-black/5 rounded-3xl p-4 w-full max-w-sm mx-auto text-center">
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

          {/* List of Breathing Techniques */}
          <section className="w-full max-w-2xl mx-auto">
            <h3 className="font-serif text-2xl text-black mb-4 font-normal border-b border-black/5 pb-2">
              {getTranslation('techniques')}
            </h3>
            <div className="flex flex-col gap-4">
              {BREATHING_TECHNIQUES.map(tech => {
                const isSelected = selectedBreathing.name === tech.name;
                const trans = getTranslatedBreathing(tech);
                return (
                  <article
                    key={tech.name}
                    onClick={() => handleBreathingSelect(tech)}
                    className={`rounded-3xl p-5 border transition-all cursor-pointer shadow-none ${
                      isSelected ? 'border-black bg-white' : 'border-black/10 bg-white/40 hover:bg-black/5'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        {isSelected && (
                          <span className="inline-block bg-black text-white font-sans text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {getTranslation('current_badge')}
                          </span>
                        )}
                        <h4 className="font-serif text-lg font-normal text-black">{trans.name}</h4>
                      </div>
                      <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-black/50">{trans.durationText}</span>
                    </div>
                    <p className="font-sans text-xs text-black/70 leading-relaxed mb-3">
                      {trans.description}
                    </p>
                    <span className="font-sans text-[9px] text-black/50 font-bold uppercase tracking-widest">
                      Ratio: Inhale {tech.inhale}s {tech.hold1 > 0 ? `| Hold ${tech.hold1}s` : ''} | Exhale {tech.exhale}s {tech.hold2 > 0 ? `| Rest ${tech.hold2}s` : ''}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Guided Prompts Detail Modal Sheet */}
      {selectedPrompt && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 md:p-10 overflow-y-auto z-[100] pt-10 md:pt-20">
          <div className="bg-[#F8F5F2] rounded-3xl max-w-lg w-full p-6 border border-black/25 shadow-2xl animate-fadeIn my-auto sm:my-0">
            <div className="flex justify-between items-center pb-2.5 border-b border-black/5 shrink-0 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#3e6355]" />
                <h3 className="font-sans text-xs font-extrabold text-black uppercase tracking-widest">
                  {selectedPrompt.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedPrompt(null);
                  setPromptReflectionText('');
                }}
                className="text-black/50 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-xs text-black/70 leading-relaxed mb-4 italic bg-[#E5E1DB] border border-black/10 p-4 rounded-2xl">
              {selectedPrompt.content}
            </p>

            <div className="flex flex-col gap-4 mb-4">
              <span className="font-sans text-[10px] font-bold text-red-900 uppercase tracking-widest">
                Reflection Questions:
              </span>
              <ul className="list-disc pl-5 flex flex-col gap-2 font-sans text-xs text-[#111111] leading-relaxed">
                {selectedPrompt.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            <textarea
              required
              rows={4}
              value={promptReflectionText}
              onChange={e => setPromptReflectionText(e.target.value)}
              placeholder={getText('Write your reflection answers here...', 'Escribe aquí tus reflexiones...', 'Escreva aqui suas reflexões...')}
              className="w-full bg-white border border-black/15 rounded-2xl p-3.5 font-sans text-xs focus:outline-none focus:border-black resize-none text-[#111111] mb-4"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSelectedPrompt(null);
                  setPromptReflectionText('');
                }}
                className="bg-white text-black border border-black/15 px-4 py-2 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePromptReflection}
                className="bg-black text-[#F8F5F2] hover:bg-black/80 px-5 py-2.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest cursor-pointer border border-black shadow-none"
              >
                {getTranslation('save_entry')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

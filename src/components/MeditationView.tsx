/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSanctuary } from '../context/SanctuaryContext';
import {
  Play,
  Pause,
  Clock,
  Sparkles,
  BookOpen,
  X
} from 'lucide-react';

export const MeditationView: React.FC = () => {
  const { state, getTranslation, addReflection } = useSanctuary();

  const getText = (en: string, es: string, pt: string) => {
    if (state.language === 'English') return en;
    if (state.language === 'Español') return es;
    return pt;
  };

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

  const initAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  };

  // Silent Meditation Timer State
  const [meditationTime, setMeditationTime] = useState<number>(600); // 10 mins default
  const [isMeditationRunning, setIsMeditationRunning] = useState<boolean>(false);
  const [selectedMedDuration, setSelectedMedDuration] = useState<number>(10); // 5, 10, 20
  const medTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Guided Prompts state
  const [selectedPrompt, setSelectedPrompt] = useState<{ id?: string; title: string; content: string; questions: string[] } | null>(null);
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
              getText(
                `Completed a beautiful ${selectedMedDuration}-minute silent meditation. Allowed my thoughts to pass like clouds and returned with a grounded mind.`,
                `Completé una hermosa meditación silenciosa de ${selectedMedDuration} minutos. Dejé pasar mis pensamientos como nubes y regresé con la mente conectada.`,
                `Completei uma bela meditação silenciosa de ${selectedMedDuration} minutos. Deixei meus pensamentos passarem como nuvens e retornei com a mente mais focada.`
              ),
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
      id: 'gratitude',
      title: getTranslation('gratitude'),
      content: getTranslation('gratitude_desc'),
      questions: [
        getText('What are three simple things you can touch or see right now that you are grateful for?', '¿Cuáles son tres cosas sencillas que puedes ver o tocar en este momento por las que te sientas agradecido?', 'Quais são três coisas simples que você pode ver ou tocar agora e pelas quais sente gratidão?'),
        getText('How does recognizing these blessings shift your immediate mental state?', '¿Cómo cambia tu estado de ánimo al reconocer estas cosas buenas?', 'Como reconhecer essas coisas boas muda o seu humor agora?')
      ]
    },
    {
      id: 'serenity',
      title: getTranslation('serenity_prayer'),
      content: getTranslation('serenity_desc'),
      questions: [
        getText('What is one specific situation that you need to surrender control over?', '¿Hay alguna situación en la que necesites soltar el control?', 'Existe alguma situação em que você precise abrir mão do controle?'),
        getText('What is one small action of courage you can take that lies completely in your hands?', '¿Cuál es un pequeño acto de valor que puedes hacer que dependa solo de ti?', 'Qual pequena atitude de coragem você pode tomar que dependa apenas de você?')
      ]
    },
    {
      id: 'release',
      title: getTranslation('release'),
      content: getTranslation('release_desc'),
      questions: [
        getText('What is one thought, interaction, or burden that you want to release right now?', '¿Qué pensamiento, interacción o carga te gustaría soltar en este momento?', 'Que pensamento, interação ou peso você gostaria de soltar neste momento?'),
        getText('Can you breathe in peace and exhale any remaining tension, guilt, or expectations?', '¿Puedes inhalar paz y exhalar cualquier tensión, culpa o expectativa?', 'Você consegue inspirar paz e expirar qualquer tensão, culpa ou expectativa?')
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Daily Meditation Header */}
      <section className="text-center max-w-2xl mx-auto flex flex-col items-center pt-0 pb-1 w-full">
        <h2 className="font-serif text-2xl sm:text-3xl text-black mb-1 font-normal tracking-tight">
          {getText('Meditation & Prayer', 'Meditación y Oración', 'Meditação e Oração')}
        </h2>
        <p className="font-sans text-xs text-black/60 italic leading-snug max-w-lg mb-0">
          {getTranslation('meditation_sub')}
        </p>
      </section>

      {/* Silent Meditation Timer Component */}
      <div className="max-w-md mx-auto w-full">
        <aside className="bg-[#E5E1DB] rounded-3xl p-5 sm:p-6 border border-black/10 shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-2">
              <span className="font-sans text-[10px] font-bold text-black uppercase tracking-widest">
                {getTranslation('silent_meditation')}
              </span>
              <Clock className="w-4 h-4 text-black/60" />
            </div>

            {/* Circular Timer Clock Display */}
            <div className="aspect-square w-full max-w-[160px] mx-auto rounded-full border-2 border-black/10 flex items-center justify-center mb-5 relative bg-white">
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
              <span className="font-serif text-3xl sm:text-4xl text-[#111111] font-normal tracking-tight">
                {Math.floor(meditationTime / 60)}:{String(meditationTime % 60).padStart(2, '0')}
              </span>
            </div>

            {/* Duration select button controls */}
            <div className="flex justify-center gap-2 mb-5">
              {[5, 10, 20].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleMeditationDurationSelect(mins)}
                  className={`px-3.5 py-1.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest cursor-pointer border transition-colors ${
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
              initAudio();
              setIsMeditationRunning(!isMeditationRunning);
            }}
            className="w-full bg-black text-[#F8F5F2] hover:bg-black/80 rounded-full py-3 font-sans text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-black shadow-none"
          >
            {isMeditationRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isMeditationRunning ? getText('Pause Silence', 'Pausar silencio', 'Pausar silêncio') : getTranslation('begin_silence')}</span>
          </button>
        </aside>
      </div>

      {/* Guided Prayers Collection */}
      <section className="max-w-5xl mx-auto w-full mt-4">
        <h3 className="font-serif text-xl text-black mb-2 font-normal border-b border-black/5 pb-2">
          {getTranslation('guided_prompts')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {prompts.map(p => {
            const isRelease = p.id === 'release';
            return (
              <div
                key={p.title}
                onClick={() => setSelectedPrompt(p)}
                className={`rounded-3xl p-5 border transition-all cursor-pointer shadow-none ${
                  isRelease
                    ? 'border-black/10 bg-white/40 hover:bg-black/5'
                    : 'bg-white border-black/10 hover:border-black/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl text-black flex items-center justify-center mb-3 border border-black/10 ${
                  isRelease ? 'bg-[#E5E1DB]/60' : 'bg-[#E5E1DB]'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-serif text-lg font-normal text-[#111111] mb-1.5">
                  {p.title}
                </h4>
                <p className="font-sans text-xs text-black/60 leading-relaxed line-clamp-2">
                  {p.content}
                </p>
              </div>
            );
          })}
        </div>
      </section>

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
                {getTranslation('reflection_questions')}:
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
                {getText('Cancel', 'Cancelar', 'Cancelar')}
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

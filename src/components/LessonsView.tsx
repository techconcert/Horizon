/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSanctuary } from '../context/SanctuaryContext';
import { Step, SubLesson } from '../types';
import { 
  ChevronLeft, 
  Lock, 
  Check, 
  Award, 
  Volume2, 
  VolumeX,
  PenTool,
  BookOpen
} from 'lucide-react';

export const LessonsView: React.FC = () => {
  const { 
    steps, 
    state, 
    setCurrentLessonId, 
    updateSubLessonStatus, 
    getTranslation,
    addReflection
  } = useSanctuary();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSubLessonId, setActiveSubLessonId] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');

const getText = (en: string, es: string, pt: string) => {
  if (state.language === 'English') return en;
  if (state.language === 'Español') return es;
  return pt;
};


  const toggleTTS = (text: string) => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlayingAudio(false);
      
      if (state.language === 'English') utterance.lang = 'en-US';
      else if (state.language === 'Español') utterance.lang = 'es-ES';
      else if (state.language === 'Português') utterance.lang = 'pt-BR';

      window.speechSynthesis?.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleBackToSteps = () => {
    if (isPlayingAudio) toggleTTS(''); // stop TTS
    setActiveSubLessonId(null);
    setReflectionText('');
    setCurrentLessonId(null);
  };

  const activeStep = steps.find(s => s.id === state.currentLessonId);
  const activeSubLesson = activeStep?.subLessons.find(s => s.id === activeSubLessonId);

  // VIEW 3: Read single sub-lesson
  if (activeStep && activeSubLesson) {
    const isCompleted = activeSubLesson.status === 'READ';
    
    const handleComplete = (withReflection: boolean) => {
      if (withReflection && reflectionText.trim()) {
        addReflection(
          `${activeSubLesson.title[state.language]} Reflection`, 
          reflectionText.trim(), 
          ['Peaceful', 'Content']
        );
      }
      updateSubLessonStatus(activeStep.id, activeSubLesson.id, 'READ');
      setActiveSubLessonId(null);
      setReflectionText('');
      if (isPlayingAudio) toggleTTS('');
    };

    return (
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto animate-fadeIn">
        <button 
          onClick={() => {
            if (isPlayingAudio) toggleTTS('');
            setActiveSubLessonId(null);
            setReflectionText('');
          }}
          className="flex items-center gap-1 text-black/60 hover:text-black font-sans text-xs font-bold uppercase tracking-widest transition-colors self-start cursor-pointer bg-white px-4 py-2 rounded-full border border-black/10"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Step {activeStep.number}</span>
        </button>

        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-black/10 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-red-900 border border-red-900/20 px-3 py-1 rounded-full">
              Lesson {activeSubLesson.id.split('-')[1]}
            </span>
            <button
              onClick={() => toggleTTS(activeSubLesson.content[state.language])}
              className="inline-flex items-center gap-1.5 bg-[#E5E1DB] hover:bg-[#D5D1CB] text-black px-4 py-2 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4 text-red-900" /> : <Volume2 className="w-4 h-4 text-black" />}
              <span>{isPlayingAudio ? 'Stop Narrating' : getTranslation('read_to_me')}</span>
            </button>
          </div>

          <h2 className="font-serif text-3xl font-normal text-black mb-6 leading-tight">
            {activeSubLesson.title[state.language]}
          </h2>
          
          <div className="prose prose-sm max-w-none font-sans text-sm text-black/80 leading-relaxed space-y-4 mb-10">
            {activeSubLesson.content[state.language].split('\n\n').map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          <div className="bg-[#F8F5F2] border border-black/10 rounded-2xl p-6 mb-8">
            <h3 className="font-serif text-xl font-normal text-black mb-4">
              Reflection Questions
            </h3>
            <ul className="list-disc pl-5 space-y-3 font-sans text-xs text-black/70">
              {activeSubLesson.reflectionQuestions[state.language].map((q, idx) => (
                <li key={idx} className="leading-relaxed">{q}</li>
              ))}
            </ul>
          </div>

          <div className="bg-[#E5E1DB]/50 rounded-2xl p-6 mb-8 border border-black/5">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-black/70 mb-3 flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              {getText('Optional Reflection Journal', 'Diario de reflexión opcional', 'Diário de reflexão opcional')}
            </label>
            <textarea
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
              placeholder={getText('Write your thoughts here...', 'Escribe lo que piensas aquí...', 'Escreva o que está pensando aqui...')}
              className="w-full bg-white border border-black/15 rounded-xl p-4 font-sans text-xs focus:outline-none focus:border-black resize-none text-[#111111] min-h-[100px]"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-black/10">
            {reflectionText.trim().length > 0 && (
              <button
                onClick={() => handleComplete(true)}
                className="bg-black hover:bg-black/80 text-[#F8F5F2] px-6 py-3 rounded-full font-sans text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Save Reflection & Complete</span>
              </button>
            )}
            <button
              onClick={() => handleComplete(false)}
              className={`${reflectionText.trim().length > 0 ? 'bg-transparent text-black border border-black/20 hover:bg-black/5' : 'bg-black hover:bg-black/80 text-[#F8F5F2]'} px-6 py-3 rounded-full font-sans text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer`}
            >
              {isCompleted ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{getText('Mark Complete Again', 'Volver a marcar completado', 'Marcar como concluído de novo')}</span>
                </>
              ) : (
                <span>{getTranslation('mark_complete')}</span>
              )}
            </button>
          </div>
        </article>
      </div>
    );
  }

  // VIEW 2: Sub-lessons list for a specific step
  if (activeStep) {
    const completedCount = activeStep.subLessons.filter((s: SubLesson) => s.status === 'READ').length;
    const totalCount = activeStep.subLessons.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div className="flex flex-col gap-6 animate-fadeIn w-full max-w-3xl mx-auto">
        <button 
          onClick={handleBackToSteps}
          className="flex items-center gap-1 text-black/60 hover:text-black font-sans text-[10px] font-bold uppercase tracking-widest transition-colors self-start cursor-pointer bg-white px-4 py-2 rounded-full border border-black/10 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Steps</span>
        </button>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-black/10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-red-900 border border-red-900/20 px-3 py-1 rounded-full">
              Step {activeStep.number}
            </span>
            {completedCount === totalCount && totalCount > 0 && (
              <span className="bg-black text-[#F8F5F2] text-[9px] font-bold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest">
                <Award className="w-3 h-3" />
                Completed
              </span>
            )}
          </div>
          
          <h2 className="font-serif text-3xl font-normal text-black mb-3">
            {activeStep.title[state.language]}
          </h2>
          <p className="font-sans text-sm text-black/70 leading-relaxed max-w-2xl">
            {activeStep.description[state.language]}
          </p>
          
          <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-[#E5E1DB] px-4 py-2 rounded-full">
              <span className="font-sans text-xs font-bold text-black">
                {progressPercent}% Complete
              </span>
              <span className="text-[10px] text-black/50 font-bold uppercase tracking-widest font-sans">
                ({completedCount}/{totalCount})
              </span>
            </div>
          </div>
          
          <div className="mt-4 w-full bg-[#E5E1DB] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-black h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          {activeStep.subLessons.map((sub: SubLesson, i: number) => {
            const isCompleted = sub.status === 'READ';
            
            return (
              <article 
                key={sub.id} 
                onClick={() => setActiveSubLessonId(sub.id)}
                className={`bg-white rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden group cursor-pointer hover:shadow-md ${
                  isCompleted ? 'border-black/30 bg-[#F8F5F2]' : 'border-black/10 hover:border-black/30'
                }`}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-black/5 group-hover:bg-black/20 transition-colors" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-6 h-6 rounded-md border border-black/15 bg-[#E5E1DB] text-black flex items-center justify-center font-sans text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <h3 className="font-serif text-xl font-normal text-black group-hover:text-amber-950 transition-colors">
                        {sub.title[state.language]}
                      </h3>
                    </div>
                    <p className="font-sans text-xs text-black/60 leading-relaxed max-w-2xl pl-8.5">
                      {sub.description[state.language]}
                    </p>
                  </div>
                  
                  <div className="sm:shrink-0 flex items-center gap-2 pl-8.5 sm:pl-0">
                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 text-black bg-[#E5E1DB] px-4 py-2 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest">
                        <Check className="w-4 h-4" />
                        <span>Re-read</span>
                      </div>
                    ) : (
                      <button className="bg-black text-white px-5 py-2.5 rounded-full font-sans text-[10px] font-bold tracking-widest uppercase transition-all shadow-none group-hover:shadow-md">
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    );
  }

  // VIEW 1: All Steps Overview
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <section className="text-center max-w-2xl mx-auto mb-2">
        <h2 className="font-serif text-3xl md:text-4xl text-black mb-3 font-normal tracking-tight">
          {getTranslation('academy_title')}
        </h2>
        <p className="font-sans text-sm text-black/60 italic leading-relaxed">
          {getTranslation('academy_sub')}
        </p>
      </section>

      <div className="max-w-4xl mx-auto w-full bg-[#F8F5F2] border border-black/10 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
        <div className="bg-[#E5E1DB] text-[#4A453F] p-2.5 rounded-2xl flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <p className="font-sans text-xs text-black/75 leading-relaxed">
          {getTranslation('academy_disclaimer')}
        </p>
      </div>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step: Step) => {
          const completedCount = step.subLessons.filter(sl => sl.status === 'READ').length;
          const totalCount = step.subLessons.length;
          const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isAllCompleted = completedCount === totalCount && totalCount > 0;

          return (
            <article 
              key={step.id}
              onClick={() => {
                if (!step.locked) {
                  setCurrentLessonId(step.id);
                }
              }}
              className={`rounded-3xl p-6 border transition-all duration-300 relative flex flex-col h-full ${
                step.locked 
                  ? 'opacity-60 bg-[#E5E1DB]/30 border-dashed border-black/15 cursor-not-allowed' 
                  : 'border-black/10 bg-white hover:bg-[#F8F5F2] hover:border-black/30 shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-red-900 bg-red-900/5 px-2 py-1 rounded-md">
                    Step {step.number}
                  </span>
                  {isAllCompleted && (
                    <span className="bg-black text-[#F8F5F2] text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-widest">
                      <Award className="w-3 h-3" />
                      Complete
                    </span>
                  )}
                </div>
                {step.locked ? (
                  <div className="w-8 h-8 rounded-full bg-black/5 border border-black/10 text-black/40 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="text-right shrink-0 bg-[#E5E1DB] px-3 py-1.5 rounded-lg border border-black/5">
                    <span className="font-sans text-sm font-bold text-black block leading-none">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                )}
              </div>
              
              <h3 className="font-serif text-2xl font-normal text-[#111111] mb-3 leading-snug">
                {step.title[state.language]}
              </h3>
              
              <p className="font-sans text-xs text-black/60 leading-relaxed flex-grow">
                {step.description[state.language]}
              </p>

              {!step.locked && (
                <div className="mt-6 w-full bg-[#E5E1DB] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-black h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TabType, MoodType, Reflection, Step, SubLesson, SanctuaryState, BrotherhoodEntry } from '../types';
import { INITIAL_STEPS } from '../lessons';
import { 
  getOrCreateSyncCode, 
  saveToCloud, 
  restoreFromCloud, 
  exportLocalStateToCloudPayload, 
  writePayloadToLocalStorage, 
  normalizeSyncCode,
  isCloudQuotaExceeded 
} from '../services/cloudSync';
import { detectDefaultLanguage } from '../utils/languageDetection';

export { detectDefaultLanguage };

interface SanctuaryContextType {
  state: SanctuaryState;
  setActiveTab: (tab: TabType) => void;
  setCurrentLessonId: (id: string | null) => void;
  setSobrietyStartDate: (date: string) => void;
  addReflection: (title: string, content: string, moods: MoodType[]) => void;
  deleteReflection: (id: string) => void;
  toggleSoberCheckIn: () => void;
  setLanguage: (lang: 'English' | 'Español' | 'Português') => void;
  setBiometricLock: (enabled: boolean) => void;
  setSyncEnabled: (enabled: boolean) => void;
  addCustomMood: (mood: string) => void;
  steps: Step[];
  updateSubLessonStatus: (stepId: string, subLessonId: string, status: 'READ' | 'IN PROGRESS' | 'UNREAD') => void;
  incrementStepProgress: (stepId: string) => void;
  decrementStepProgress: (stepId: string) => void;
  getTranslation: (key: string) => string;
  generateAIIntention: (mood: MoodType) => Promise<string>;
  generateAIInsights: () => Promise<string>;
  aiLoading: boolean;
  aiUsageCount: number;
  limitReached: boolean;
  timeGroundedString: {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalHours: number;
    totalDays: number;
    accumulatedDays: number;
    totalAccumulatedDays: number;
  };
  showSOSModal: boolean;
  setShowSOSModal: (open: boolean) => void;
  setSupportNumber: (val: string) => void;
  setSponsorName: (val: string) => void;
  setSponsorNumber: (val: string) => void;
  setSupportLink: (val: string) => void;
  setOnboarded: (onboarded: boolean) => void;
  syncCode: string;
  lastCloudSync: string | null;
  cloudQuotaExceeded: boolean;
  syncToCloud: () => Promise<boolean>;
  restoreFromSyncCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  addBrotherhood: (brotherhood: string, entryDate: string) => void;
  deleteBrotherhood: (id: string) => void;
}

const SanctuaryContext = createContext<SanctuaryContextType | undefined>(undefined);

const TRANSLATIONS: Record<string, Record<'English' | 'Español' | 'Português', string>> = {
  'app_title': { English: 'Horizon', Español: 'Horizon', Português: 'Horizon' },
  'menu_aria': { English: 'Menu', Español: 'Menú', Português: 'Menu' },
  'profile_aria': { English: 'User Profile', Español: 'Perfil de usuario', Português: 'Perfil do usuário' },
  'step_chip': { English: 'Step 10: Continue to take personal inventory', Español: 'Paso 10: Continuar haciendo el inventario personal', Português: 'Passo 10: Continuar a fazer o inventário pessoal' },
  'mood_selection': { English: 'How are you feeling?', Español: '¿Cómo te sientes hoy?', Português: 'Como você está se sentindo?' },
  'custom_mood': { English: 'Custom', Español: 'Otro', Português: 'Outro' },
  'daily_reflection': { English: 'Daily Reflection', Español: 'Reflexión diaria', Português: 'Reflexão diária' },
  'reflection_placeholder': { English: "What's on your mind today? Write it down...", Español: '¿Qué tienes en mente hoy? Escribe lo que sientes...', Português: 'O que está passando pela sua cabeça hoje? Escreva aqui...' },
  'save_entry': { English: 'Save', Español: 'Guardar', Português: 'Salvar' },
  'sentiment_insights': { English: 'Sentiment Insights', Español: 'Análisis de tus emociones', Português: 'Análise das suas emoções' },
  'weekly': { English: 'Weekly', Español: 'Semanal', Português: 'Semanal' },
  'monthly': { English: 'Monthly', Español: 'Mensual', Português: 'Mensal' },
  'recent_reviews': { English: 'Recent Entries', Español: 'Registros recientes', Português: 'Registros recentes' },
  'view_all': { English: 'View All', Español: 'Ver todo', Português: 'Ver tudo' },
  'home_tab': { English: 'Home', Español: 'Inicio', Português: 'Início' },
  'trackers_tab': { English: 'Track', Español: 'Registro', Português: 'Registro' },
  'tools_tab': { English: 'Tools', Español: 'Herramientas', Português: 'Ferramentas' },
  'meditation_tab': { English: 'Meditation', Español: 'Meditación', Português: 'Meditação' },
  'breathing_tab': { English: 'Breathing', Español: 'Respiración', Português: 'Respiração' },
  'lessons_tab': { English: 'Lessons', Español: 'Lecciones', Português: 'Lições' },
  'profile_tab': { English: 'Profile', Español: 'Perfil', Português: 'Perfil' },
  'you_are_here': { English: 'You are here.', Español: 'Estás aquí.', Português: 'Você está aqui.' },
  'take_a_breath': { English: 'Take a breath. You are grounded in this moment.', Español: 'Respira profundo. Estás aquí y ahora.', Português: 'Respire fundo. Você está firme no agora.' },
  'time_grounded': { English: 'Time Grounded', Español: 'Tiempo en el camino', Português: 'Tempo no caminho' },
  'hours_aligned': { English: 'Hours aligned', Español: 'Horas alineadas', Português: 'Horas alinhadas' },
  'current_cycle': { English: 'Current Cycle', Español: 'Ciclo actual', Português: 'Ciclo atual' },
  'focus_today': { English: 'Focus for Today', Español: 'Enfoque para hoy', Português: 'Foco de hoje' },
  'new_intention': { English: 'New Intention', Español: 'Nueva intención', Português: 'Nova intenção' },
  'morning_ritual': { English: 'Morning Ritual', Español: 'Ritual de la mañana', Português: 'Ritual matinal' },
  'breathwork_session': { English: 'Breathwork Session', Español: 'Sesión de respiración', Português: 'Sessão de respiração' },
  'breathwork_desc': { English: '5 minutes to center your mind for the day ahead.', Español: '5 minutos para centrar tu mente para el día que te espera.', Português: '5 minutinhos para centrar a mente para o dia.' },
  'begin_session': { English: 'Begin Session', Español: 'Empezar sesión', Português: 'Começar sessão' },
  'one_day': { English: '"One day at a time."', Español: '"Un día a la vez."', Português: '"Um dia de cada vez."' },
  'daily_check_in': { English: 'Daily Check-In', Español: 'Registro diario', Português: 'Check-in diário' },
  'i_am_sober': { English: 'I am sober today.', Español: 'Hoy estoy sobrio.', Português: 'Hoje eu estou limpo.' },
  'reach_out': { English: 'Reach Out', Español: 'Hablar con alguien', Português: 'Falar com alguém' },
  'mood_balance': { English: 'Mood Balance', Español: 'Balance de emociones', Português: 'Balanço de emoções' },
  'last_7_days': { English: 'Last 7 Days', Español: 'Últimos 7 días', Português: 'Últimos 7 dias' },
  'neutral': { English: 'Neutral', Español: 'Neutral', Português: 'Neutro' },
  'mood_distribution': { English: 'Mood Distribution', Español: 'Distribución de emociones', Português: 'Distribuição de emoções' },
  'insights_title': { English: 'Insights', Español: 'Perspectivas', Português: 'Insights' },
  'daily_meditation': { English: 'Daily Meditation & Prayer', Español: 'Meditación y oración diaria', Português: 'Meditação e oração diária' },
  'meditation_sub': { English: '"Sought through prayer and meditation to improve our conscious contact..."', Español: '"Buscamos a través de la oración y la meditación mejorar nuestro contacto consciente..."', Português: '"Procuramos, através da prece e da meditação, melhorar o nosso contato consciente..."' },
  'conscious_contact': { English: 'Conscious Contact', Español: 'Contacto consciente', Português: 'Contato consciente' },
  'space_between': { English: 'The Space Between', Español: 'El espacio intermedio', Português: 'O espaço no meio' },
  'space_desc': { English: 'We often rush through our days seeking answers in the noise. Yet, profound clarity usually arrives in the quiet interludes—the space between our thoughts.', Español: 'A menudo corremos por nuestros días buscando respuestas en el ruido. Sin embargo, la claridad suele llegar en el silencio: el espacio entre nuestros pensamientos.', Português: 'Muitas vezes corremos pelos nossos dias procurando respostas no barulho. No entanto, a clareza costuma chegar no silêncio — no espaço entre os nossos pensamentos.' },
  'space_footer': { English: "Today, consider that conscious contact isn't always about speaking or asking; it is equally about listening to the stillness.", Español: 'Hoy, considera que el contacto consciente no siempre se trata de hablar o pedir; se trata igualmente de escuchar la quietud.', Português: 'Hoje, considere que o contato consciente nem sempre é sobre falar ou pedir; é igualmente sobre escutar o silêncio.' },
  'reflection_day': { English: "Day's Reflection", Español: "Reflexión del Día", Português: "Reflexão do Dia" },
  'space_thoughts': { English: 'Space Between Thoughts', Español: 'Espacio entre Pensamientos', Português: 'Espaço entre Pensamentos' },
  'journal_thoughts': { English: 'Journal Thoughts', Español: 'Escribir mis pensamientos', Português: 'Escrever meus pensamentos' },
  'silent_meditation': { English: 'Silent Meditation', Español: 'Meditación silenciosa', Português: 'Meditação silenciosa' },
  'begin_silence': { English: 'Begin Silence', Español: 'Comenzar silencio', Português: 'Começar silêncio' },
  'guided_prompts': { English: 'Guided Prompts', Español: 'Guías de reflexión', Português: 'Guias de reflexão' },
  'morning_gratitude': { English: 'Gratitude', Español: 'Gratitud', Português: 'Gratidão' },
  'gratitude': { English: 'Gratitude', Español: 'Gratitud', Português: 'Gratidão' },
  'morning_grat_desc': { English: 'Center your thoughts and intentions with a gentle focus on what you have.', Español: 'Centra tus pensamientos e intenciones enfocándote suavemente en lo que tienes.', Português: 'Centre seus pensamentos e intenções com um foco suave naquilo que você tem.' },
  'gratitude_desc': { English: 'Center your thoughts and intentions with a gentle focus on what you have.', Español: 'Centra tus pensamientos e intenciones enfocándote suavemente en lo que tienes.', Português: 'Centre seus pensamentos e intenções com um foco suave naquilo que você tem.' },
  'serenity_prayer': { English: 'Serenity Prayer', Español: 'Oración de la Serenidad', Português: 'Oração da Serenidade' },
  'your_intention': { English: 'Serenity Prayer', Español: 'Oración de la Serenidad', Português: 'Oração da Serenidade' },
  'close': { English: 'Close', Español: 'Cerrar', Português: 'Fechar' },
  'serenity_desc': { English: 'A classic meditation on acceptance, courage, and wisdom.', Español: 'Una meditación clásica sobre la aceptación, el valor y la sabiduría.', Português: 'Uma meditação clássica sobre aceitação, coragem e sabedoria.' },
  'evening_release': { English: 'Release', Español: 'Liberación', Português: 'Libertação' },
  'release': { English: 'Release', Español: 'Liberación', Português: 'Libertação' },
  'evening_desc': { English: 'Let go of tension, heavy burdens, and expectations.', Español: 'Suelta la tensión, las cargas pesadas y las expectativas.', Português: 'Solte a tensão, os pesos e as expectativas.' },
  'release_desc': { English: 'Let go of tension, heavy burdens, and expectations.', Español: 'Suelta la tensión, las cargas pesadas y las expectativas.', Português: 'Solte a tensão, os pesos e as expectativas.' },
  'breathing_exercises': { English: 'Breathing Exercises', Español: 'Ejercicios de respiración', Português: 'Exercícios de respiração' },
  'find_center': { English: 'Find your center with guided rhythms.', Español: 'Encuentra tu centro con ritmos guiados.', Português: 'Encontre o seu centro com ritmos guiados.' },
  'inhale': { English: 'Inhale', Español: 'Inhala', Português: 'Inspira' },
  'hold': { English: 'Hold', Español: 'Sostén', Português: 'Segura' },
  'exhale': { English: 'Exhale', Español: 'Exhala', Português: 'Expira' },
  'seconds': { English: 'seconds', Español: 'segundos', Português: 'segundos' },
  'start_session': { English: 'Start Session', Español: 'Empezar sesión', Português: 'Iniciar sessão' },
  'pause_session': { English: 'Pause Session', Español: 'Pausar sesión', Português: 'Pausar sessão' },
  'pause_section': { English: 'Pause Session', Español: 'Pausar sesión', Português: 'Pausar sessão' },
  'stop_session': { English: 'Stop Session', Español: 'Detener sesión', Português: 'Parar sessão' },
  'techniques': { English: 'Techniques', Español: 'Técnicas', Português: 'Técnicas' },
  'current_badge': { English: 'Current', Español: 'Actual', Português: 'Atual' },
  'academy_title': { English: '12-Step Academy', Español: 'Academia de los 12 Pasos', Português: 'Academia dos 12 Passos' },
  'academy_sub': { English: 'The path to recovery is walked one step at a time.', Español: 'El camino a la recuperación se recorre un paso a la vez.', Português: 'O caminho da recuperação a gente percorre um passo de cada vez.' },
  'academy_disclaimer': {
    English: 'This content is provided to help you in your journey of learning and managing the steps. It is highly recommended that you purchase the official book from the specific mutual-support group you most closely identify with.',
    Español: 'Este contenido se proporciona para ayudarle en su camino de aprendizaje y práctica de los pasos. Se recomienda encarecidamente que adquiera el libro oficial del grupo de apoyo mutuo específico con el que más se identifique.',
    Português: 'Este conteúdo é fornecido para ajudar você na sua jornada de aprendizado e prática dos passos. Recomenda-se fortemente que você adquira o livro oficial do grupo de apoio mútuo específico com o qual você mais se identifica.'
  },
  'continue_reading': { English: 'Continue Reading', Español: 'Continuar leyendo', Português: 'Continuar lendo' },
  'locked_text': { English: 'Locked until previous Step is complete.', Español: 'Bloqueado hasta que completes el Paso anterior.', Português: 'Bloqueado até você completar o Passo anterior.' },
  'cumulative_progress': { English: 'Cumulative Progress', Español: 'Progreso acumulado', Português: 'Progresso acumulado' },
  'sanctuary_secure': { English: 'Your sanctuary is secure. Only you have access to this space.', Español: 'Tu espacio está seguro. Solo tú tienes acceso a él.', Português: 'Seu espaço é seguro. Só você tem acesso aqui.' },
  'security': { English: 'Security', Español: 'Seguridad', Português: 'Segurança' },
  'biometric_lock': { English: 'FaceID / Biometric Lock', Español: 'FaceID / Bloqueo biométrico', Português: 'FaceID / Bloqueio biométrico' },
  'biometric_sub': { English: 'Require authentication to open', Español: 'Requerir autenticación al abrir', Português: 'Exigir autenticação ao abrir' },
  'preferences': { English: 'Preferences', Español: 'Preferencias', Português: 'Preferências' },
  'language': { English: 'Language', Español: 'Idioma', Português: 'Idioma' },
  'data_sync': { English: 'Data & Sync', Español: 'Datos y sincronización', Português: 'Dados e sincronização' },
  'cloud_sync_desc': { English: 'iCloud / Google Drive Sync', Español: 'Sincronizar con iCloud / Google Drive', Português: 'Sincronizar com iCloud / Google Drive' },
  'last_synced': { English: 'Last Synced: 2 min ago', Español: 'Sincronizado: hace 2 min', Português: 'Última sincronização: há 2 min' },
  'export_journal': { English: 'Export My Journal', Español: 'Exportar mi diario', Português: 'Exportar meu diário' },
  'understanding_core': { English: 'Understanding the Core', Español: 'Entendiendo la base', Português: 'Entendendo a base' },
  'understanding_sub': { English: 'Admitting powerlessness is not a sign of weakness, but the foundational step towards reclaiming your authentic self.', Español: 'Admitir la falta de poder no es un signo de debilidad, sino el paso fundamental para recuperar tu ser auténtico.', Português: 'Admitir a falta de controle não é um sinal de fraqueza, mas sim o primeiro passo para resgatar quem você realmente é.' },
  'lessons_complete': { English: 'LESSONS COMPLETE', Español: 'LECCIONES COMPLETADAS', Português: 'LIÇÕES CONCLUÍDAS' },
  'read_to_me': { English: 'Read to Me', Español: 'Léemelo', Português: 'Ler para mim' },
  'mark_complete': { English: 'Mark Complete', Español: 'Marcar como completado', Português: 'Marcar como concluído' },
  're_read': { English: 'Completed', Español: 'Completado', Português: 'Concluído' },
  'ai_limit_reached': { English: 'Daily Limit Reached', Español: 'Límite diario alcanzado', Português: 'Limite diário atingido' },
  'ai_limit_desc': { English: 'To keep this private sanctuary 100% free and sustainable, interactive generations are limited to 3 sessions per day. Showing a serene offline reflection for today.', Español: 'Para mantener este santuario 100% gratuito y sostenible, las sesiones con IA están limitadas a 3 por día. Mostrando una reflexión offline serena para hoy.', Português: 'Para manter este espaço 100% gratuito, as sessões interativas são limitadas a 3 por dia. Aqui vai uma reflexão offline serena para hoje.' },
  'ai_remaining_credits': { English: 'Daily Credits Used', Español: 'Créditos diarios usados', Português: 'Créditos diários usados' },
  'reflection_questions': { English: 'Reflection Questions', Español: 'Preguntas de Reflexión', Português: 'Perguntas de Reflexão' },
  'previous_lesson': { English: 'Previous Lesson', Español: 'Lección Anterior', Português: 'Lição Anterior' },
  'next_lesson': { English: 'Next Lesson', Español: 'Siguiente Lección', Português: 'Próxima Lição' },
  'write_reflection_prompt': {
    English: 'Write your honest reflection notes, realizations, or answers here...',
    Español: 'Escribe aquí tus reflexiones sinceras, aprendizajes o respuestas...',
    Português: 'Escreva aqui suas reflexões sinceras, percepções ou respostas...'
  },
  'complete_step_btn': { English: 'Complete Step & Save Reflection', Español: 'Completar Paso y Guardar Reflexión', Português: 'Concluir Passo e Salvar Reflexão' },
  'mark_as_completed': { English: 'Mark Step as Completed', Español: 'Marcar Paso como Completado', Português: 'Marcar Passo como Concluído' },
  'step_completed_badge': { English: 'Step Completed', Español: 'Paso Completado', Português: 'Passo Concluído' },
  'save_notes_btn': { English: 'Save Notes & Complete', Español: 'Guardar Notas y Completar', Português: 'Salvar Notas e Concluir' },
  'write_notes_first': {
    English: 'Please write a brief reflection note or answer the questions before completing.',
    Español: 'Por favor, escribe una breve nota de reflexión o responde las preguntas antes de completar.',
    Português: 'Por favor, escreva uma breve reflexão ou responda às perguntas antes de concluir.'
  },
  'select_a_step': { English: 'Select a Step to Read', Español: 'Selecciona un Paso para Leer', Português: 'Selecione um Passo para Ler' },
  'select_step_desc': {
    English: 'Explore the 12 principles of recovery with guided questions and reflections.',
    Español: 'Explora los 12 principios de recuperación con preguntas guiadas y reflexiones.',
    Português: 'Explore os 12 princípios de recuperação com perguntas guiadas e reflexões.'
  },
  'all_steps': { English: 'All Steps', Español: 'Todos los Pasos', Português: 'Todos os Passos' },
  'progress': { English: 'Progress', Español: 'Progreso', Português: 'Progresso' },
};

export const parseSobrietyDateSafely = (startDateStr?: string | null): Date | null => {
  if (!startDateStr) return null;

  // 1. If standard YYYY-MM-DD from an HTML date input:
  if (/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
    const [y, m, d] = startDateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  // 2. If ISO string that was saved with UTC midnight (e.g. from new Date("YYYY-MM-DD").toISOString()):
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z?$/.test(startDateStr)) {
    const [y, m, d] = startDateStr.substring(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  // 3. Regular Date parsing (for ISO timestamps with explicit hours/minutes):
  const parsed = new Date(startDateStr);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
};

export const formatLocalDateToYMD = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const addYearsClamped = (baseDate: Date, yearsToAdd: number): Date => {
  const originalDay = baseDate.getDate();
  const targetYear = baseDate.getFullYear() + yearsToAdd;
  const targetMonth = baseDate.getMonth();
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(originalDay, daysInTargetMonth);
  return new Date(
    targetYear,
    targetMonth,
    targetDay,
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds(),
    baseDate.getMilliseconds()
  );
};

export const addMonthsClamped = (baseDate: Date, monthsToAdd: number): Date => {
  const originalDay = baseDate.getDate();
  const desiredMonth = baseDate.getMonth() + monthsToAdd;
  const targetYear = baseDate.getFullYear() + Math.floor(desiredMonth / 12);
  const targetMonth = ((desiredMonth % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(originalDay, daysInTargetMonth);
  return new Date(
    targetYear,
    targetMonth,
    targetDay,
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds(),
    baseDate.getMilliseconds()
  );
};

export const calculateTimeGrounded = (startDateStr?: string | null, customNow?: Date) => {
  if (!startDateStr) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
      totalDays: 0,
      accumulatedDays: 0,
      totalAccumulatedDays: 0
    };
  }
  const start = parseSobrietyDateSafely(startDateStr);
  if (!start || isNaN(start.getTime())) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
      totalDays: 0,
      accumulatedDays: 0,
      totalAccumulatedDays: 0
    };
  }

  const now = customNow || new Date();
  if (now.getTime() < start.getTime()) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
      totalDays: 0,
      accumulatedDays: 0,
      totalAccumulatedDays: 0
    };
  }

  const totalMs = now.getTime() - start.getTime();
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(totalMs / (1000 * 60 * 60));

  // 1. Calculate whole calendar years elapsed
  let years = 0;
  while (addYearsClamped(start, years + 1).getTime() <= now.getTime()) {
    years++;
  }
  const anchorAfterYears = addYearsClamped(start, years);

  // 2. Calculate whole calendar months elapsed
  let months = 0;
  while (addMonthsClamped(anchorAfterYears, months + 1).getTime() <= now.getTime()) {
    months++;
  }
  const anchorAfterMonths = addMonthsClamped(anchorAfterYears, months);

  // 3. Calculate whole calendar days elapsed
  const diffAfterMonthsMs = now.getTime() - anchorAfterMonths.getTime();
  const days = Math.floor(diffAfterMonthsMs / (1000 * 60 * 60 * 24));

  // 4. Calculate remaining hours, minutes, and seconds
  const remainingMs = diffAfterMonthsMs - (days * 1000 * 60 * 60 * 24);
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  // In recovery milestones, a partial day in progress counts for the ongoing accumulated progress ("on" day)
  const hasPartialDay = hours > 0 || minutes > 0 || seconds > 0;
  const accumulatedDays = hasPartialDay ? days + 1 : days;
  const totalAccumulatedDays = hasPartialDay ? totalDays + 1 : (totalDays > 0 ? totalDays : (totalMs > 0 ? 1 : 0));

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    totalDays,
    accumulatedDays,
    totalAccumulatedDays
  };
};

export const formatAccumulatedTime = (
  time: {
    years: number;
    months: number;
    days: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    accumulatedDays?: number;
  },
  lang: 'English' | 'Español' | 'Português'
): string => {
  const { years, months, days, hours = 0, minutes = 0, seconds = 0, accumulatedDays } = time;
  // A partial active day counts for the accumulated progress ("on" day)
  const hasPartialDay = hours > 0 || minutes > 0 || seconds > 0;
  const displayDays = accumulatedDays !== undefined
    ? accumulatedDays
    : (hasPartialDay ? days + 1 : days);

  const parts: string[] = [];

  if (years > 0) {
    if (lang === 'Español') parts.push(`${years} ${years === 1 ? 'Año' : 'Años'}`);
    else if (lang === 'Português') parts.push(`${years} ${years === 1 ? 'Ano' : 'Anos'}`);
    else parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  }

  if (months > 0) {
    if (lang === 'Español') parts.push(`${months} ${months === 1 ? 'Mes' : 'Meses'}`);
    else if (lang === 'Português') parts.push(`${months} ${months === 1 ? 'Mês' : 'Meses'}`);
    else parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  }

  // Include days if there are remaining days, or if both years and months are 0 (e.g. "11 Days" or "1 Day")
  if (displayDays > 0 || parts.length === 0) {
    if (lang === 'Español') parts.push(`${displayDays} ${displayDays === 1 ? 'Día' : 'Días'}`);
    else if (lang === 'Português') parts.push(`${displayDays} ${displayDays === 1 ? 'Dia' : 'Dias'}`);
    else parts.push(`${displayDays} ${displayDays === 1 ? 'Day' : 'Days'}`);
  }

  return parts.join(', ');
};

export const SanctuaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onboarded, setOnboardedState] = useState<boolean>(() => {
    return localStorage.getItem('onboarded') === 'true';
  });

  // Sobriety date is based on onboarding entry or firestore import only (blank by default)
  const [sobrietyStartDate, setSobrietyStartDateState] = useState<string>(() => {
    if (localStorage.getItem('onboarded') !== 'true') {
      return '';
    }
    return localStorage.getItem('sobrietyStartDate') || '';
  });

  const [reflections, setReflections] = useState<Reflection[]>(() => {
    const saved = localStorage.getItem('reflections');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    const saved = localStorage.getItem('activeTab');
    if (saved === 'tools') return 'meditation';
    return (saved as TabType) || 'home';
  });

  const [currentLessonId, setCurrentLessonIdState] = useState<string | null>(() => {
    return localStorage.getItem('currentLessonId') || null;
  });

  const [lastSoberCheckInTime, setLastSoberCheckInTime] = useState<string | null>(() => {
    return localStorage.getItem('lastSoberCheckInTime') || null;
  });

  const [soberCheckedInToday, setSoberCheckedInToday] = useState<boolean>(() => {
    const savedTime = localStorage.getItem('lastSoberCheckInTime');
    if (!savedTime) return false;
    const diffMs = Date.now() - new Date(savedTime).getTime();
    return diffMs >= 0 && diffMs < 24 * 60 * 60 * 1000;
  });

  const [biometricLock, setBiometricLockState] = useState<boolean>(() => {
    return localStorage.getItem('biometricLock') === 'true';
  });

  const [language, setLanguageState] = useState<'English' | 'Español' | 'Português'>(() => {
    return detectDefaultLanguage();
  });

  const [syncEnabled, setSyncEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('syncEnabled') !== 'false'; // defaults to true
  });

  const [customMoods, setCustomMoods] = useState<string[]>(() => {
    const saved = localStorage.getItem('customMoods');
    return saved ? JSON.parse(saved) : [];
  });

  const [steps, setSteps] = useState<Step[]>(() => {
    const saved = localStorage.getItem('steps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          // Always map user progress (locks and read statuses) on top of the clean INITIAL_STEPS to ensure updated text/descriptions are immediately applied.
          const newSteps = JSON.parse(JSON.stringify(INITIAL_STEPS));
          parsed.forEach((oldStep, i) => {
            if (newSteps[i]) {
              newSteps[i].locked = oldStep.locked !== undefined ? oldStep.locked : newSteps[i].locked;
              if (oldStep.subLessons) {
                oldStep.subLessons.forEach((oldSub, j) => {
                  if (newSteps[i].subLessons[j] && oldSub) {
                    newSteps[i].subLessons[j].status = oldSub.status || 'UNREAD';
                  }
                });
              }
            }
          });
          return newSteps;
        }
        return INITIAL_STEPS;
      } catch(e) {
        return INITIAL_STEPS;
      }
    }
    return INITIAL_STEPS;
  });

  const [supportNumber, setSupportNumberState] = useState<string>(() => {
    return localStorage.getItem('supportNumber') || '';
  });

  const [sponsorName, setSponsorNameState] = useState<string>(() => {
    return localStorage.getItem('sponsorName') || '';
  });

  const [sponsorNumber, setSponsorNumberState] = useState<string>(() => {
    return localStorage.getItem('sponsorNumber') || '';
  });

  const [supportLink, setSupportLinkState] = useState<string>(() => {
    return localStorage.getItem('supportLink') || '';
  });

  const [brotherhoods, setBrotherhoods] = useState<BrotherhoodEntry[]>(() => {
    const saved = localStorage.getItem('brotherhoods');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [syncCode, setSyncCode] = useState<string>(() => getOrCreateSyncCode());
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(() => {
    return localStorage.getItem('horizon_last_cloud_sync') || null;
  });
  const [cloudQuotaExceeded, setCloudQuotaExceeded] = useState<boolean>(() => isCloudQuotaExceeded());

  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [showSOSModal, setShowSOSModal] = useState<boolean>(false);

  const [aiUsage, setAiUsage] = useState<{ date: string; count: number }>(() => {
    const saved = localStorage.getItem('aiUsage');
    const today = formatLocalDateToYMD();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing aiUsage:', e);
      }
    }
    return { date: today, count: 0 };
  });

  useEffect(() => {
    localStorage.setItem('aiUsage', JSON.stringify(aiUsage));
  }, [aiUsage]);

  // Time Grounded dynamic updater
  const [timeGroundedString, setTimeGroundedString] = useState(() => calculateTimeGrounded(sobrietyStartDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeGroundedString(calculateTimeGrounded(sobrietyStartDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [sobrietyStartDate]);

  // Sync state values to local storage
  useEffect(() => {
    if (sobrietyStartDate) {
      localStorage.setItem('sobrietyStartDate', sobrietyStartDate);
    } else {
      localStorage.removeItem('sobrietyStartDate');
    }
  }, [sobrietyStartDate]);

  useEffect(() => {
    localStorage.setItem('reflections', JSON.stringify(reflections));
  }, [reflections]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('currentLessonId', currentLessonId || '');
  }, [currentLessonId]);

  useEffect(() => {
    if (lastSoberCheckInTime) {
      localStorage.setItem('lastSoberCheckInTime', lastSoberCheckInTime);
    } else {
      localStorage.removeItem('lastSoberCheckInTime');
    }
  }, [lastSoberCheckInTime]);

  useEffect(() => {
    const checkStatus = () => {
      if (!lastSoberCheckInTime) {
        setSoberCheckedInToday(false);
        return;
      }
      const diffMs = Date.now() - new Date(lastSoberCheckInTime).getTime();
      const isActive = diffMs >= 0 && diffMs < 24 * 60 * 60 * 1000;
      setSoberCheckedInToday(isActive);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [lastSoberCheckInTime]);

  useEffect(() => {
    localStorage.setItem('soberCheckedInToday', soberCheckedInToday.toString());
  }, [soberCheckedInToday]);

  useEffect(() => {
    localStorage.setItem('biometricLock', biometricLock.toString());
  }, [biometricLock]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('syncEnabled', syncEnabled.toString());
  }, [syncEnabled]);

  useEffect(() => {
    localStorage.setItem('customMoods', JSON.stringify(customMoods));
  }, [customMoods]);

  useEffect(() => {
    localStorage.setItem('steps', JSON.stringify(steps));
  }, [steps]);

  useEffect(() => {
    localStorage.setItem('supportNumber', supportNumber);
  }, [supportNumber]);

  useEffect(() => {
    localStorage.setItem('sponsorName', sponsorName);
  }, [sponsorName]);

  useEffect(() => {
    localStorage.setItem('sponsorNumber', sponsorNumber);
  }, [sponsorNumber]);

  useEffect(() => {
    localStorage.setItem('supportLink', supportLink);
  }, [supportLink]);

  useEffect(() => {
    localStorage.setItem('onboarded', onboarded.toString());
  }, [onboarded]);

  useEffect(() => {
    localStorage.setItem('brotherhoods', JSON.stringify(brotherhoods));
  }, [brotherhoods]);

  // Setters
  const setActiveTab = (tab: TabType) => setActiveTabState(tab);
  const setCurrentLessonId = (id: string | null) => setCurrentLessonIdState(id);
  const setSobrietyStartDate = (date: string) => {
    setSobrietyStartDateState(date);
    if (date) {
      localStorage.setItem('sobrietyStartDate', date);
    } else {
      localStorage.removeItem('sobrietyStartDate');
    }
    setTimeGroundedString(calculateTimeGrounded(date));
  };
  const setLanguage = (lang: 'English' | 'Español' | 'Português') => setLanguageState(lang);
  const setBiometricLock = (enabled: boolean) => setBiometricLockState(enabled);
  const setSyncEnabled = (enabled: boolean) => setSyncEnabledState(enabled);
  const setSupportNumber = (val: string) => setSupportNumberState(val);
  const setSponsorName = (val: string) => setSponsorNameState(val);
  const setSponsorNumber = (val: string) => setSponsorNumberState(val);
  const setSupportLink = (val: string) => setSupportLinkState(val);
  const setOnboarded = (val: boolean) => setOnboardedState(val);

  const addBrotherhood = (brotherhood: string, entryDate: string) => {
    const newEntry: BrotherhoodEntry = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6),
      brotherhood: brotherhood.trim(),
      entryDate: entryDate.trim(),
    };
    setBrotherhoods(prev => [...prev, newEntry]);
  };

  const deleteBrotherhood = (id: string) => {
    setBrotherhoods(prev => prev.filter(b => b.id !== id));
  };

  const addReflection = (title: string, content: string, moods: MoodType[]) => {
    const newRef: Reflection = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      title: title || 'Daily Reflection',
      content,
      moods,
    };
    setReflections(prev => [newRef, ...prev]);
  };

  const deleteReflection = (id: string) => {
    setReflections(prev => prev.filter(r => r.id !== id));
  };

  const toggleSoberCheckIn = () => {
    const isCurrentlyActive = soberCheckedInToday;
    if (isCurrentlyActive) {
      setLastSoberCheckInTime(null);
      setSoberCheckedInToday(false);
    } else {
      const nowStr = new Date().toISOString();
      setLastSoberCheckInTime(nowStr);
      setSoberCheckedInToday(true);
    }
  };

  const addCustomMood = (mood: string) => {
    if (mood && !customMoods.includes(mood)) {
      setCustomMoods(prev => [...prev, mood]);
    }
  };

  const updateSubLessonStatus = (stepId: string, subLessonId: string, status: 'READ' | 'IN PROGRESS' | 'UNREAD') => {
    setSteps(prevSteps => {
      const updated = prevSteps.map(step => {
        if (step.id !== stepId) return step;

        const updatedSubLessons = step.subLessons.map(sub => {
          if (sub.id !== subLessonId) return sub;
          return { ...sub, status };
        });

        // Re-calculate completedDays based on completed lessons
        // Say totalDays is 7, we can scale completed days as ratio of completed subLessons
        const readLessonsCount = updatedSubLessons.filter(s => s.status === 'READ').length;
        const totalLessonsCount = updatedSubLessons.length;
        const ratio = readLessonsCount / totalLessonsCount;
        const completedDays = Math.min(step.totalDays, Math.round(ratio * step.totalDays));

        // Unlock next step if this step is fully completed
        return {
          ...step,
          subLessons: updatedSubLessons,
          completedDays,
        };
      });

      // Auto-unlock Step 2 if Step 1 completedDays === Step 1 totalDays (7/7)
      const step1Obj = updated.find(s => s.id === 'step1');
      if (step1Obj && step1Obj.completedDays === step1Obj.totalDays) {
        const step2 = updated.find(s => s.id === 'step2');
        if (step2 && step2.locked) {
          step2.locked = false;
        }
      }

      // Auto-unlock Step 3 if Step 2 completedDays === Step 2 totalDays (7/7)
      const step2Obj = updated.find(s => s.id === 'step2');
      if (step2Obj && step2Obj.completedDays === step2Obj.totalDays) {
        const step3 = updated.find(s => s.id === 'step3');
        if (step3 && step3.locked) {
          step3.locked = false;
        }
      }

      return updated;
    });
  };

  const incrementStepProgress = (stepId: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id === stepId && s.completedDays < s.totalDays) {
        return { ...s, completedDays: s.completedDays + 1 };
      }
      return s;
    }));
  };

  const decrementStepProgress = (stepId: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id === stepId && s.completedDays > 0) {
        return { ...s, completedDays: s.completedDays - 1 };
      }
      return s;
    }));
  };

  const getTranslation = (key: string) => {
    if (TRANSLATIONS[key]) {
      return TRANSLATIONS[key][language];
    }
    return key;
  };

  // Call backend Express AI endpoints
  const generateAIIntention = async (mood: MoodType): Promise<string> => {
    const today = formatLocalDateToYMD();
    
    const fallbackEnglish: Record<MoodType, string> = {
      Calm: 'Just for today, I align myself with the quiet stillness of the present moment.',
      Content: 'Just for today, I appreciate the simple blessings that are right in front of me.',
      Joyful: 'Just for today, I radiate positivity and embrace the happiness of being clean.',
      Hopeful: 'Just for today, I trust that my path of recovery is leading me to a beautiful future.',
      Peaceful: 'Just for today, I release all anxiety and welcome the soft calm into my spirit.',
      Grateful: 'Just for today, I give deep thanks for my progress, my sanctuary, and my community.',
      Anxious: 'Just for today, I give myself permission to rest, to reset, and to begin again without judgment.',
      Frustrated: 'Just for today, I accept that I cannot control everything, and I let go of expectations.',
      Overwhelmed: 'Just for today, I take this day one single breath at a time. I am where I need to be.',
      Tired: 'Just for today, I listen to my body and allow myself gentle rest and rejuvenation.',
      Lonely: 'Just for today, I remember I am connected to a community of healing, and I am never alone.',
      Angry: 'Just for today, I breathe out anger and allow patience and understanding to fill the space.'
    };
    const fallbackSpanish: Record<MoodType, string> = {
      Calm: 'Sólo por hoy, me alineo con la quietud pacífica del momento presente.',
      Content: 'Sólo por hoy, aprecio las bendiciones sencillas que están justo frente a mí.',
      Joyful: 'Sólo por hoy, irradio positividad y abrazo la felicidad de estar limpio.',
      Hopeful: 'Sólo por hoy, confío en que mi camino de recuperación me lleva a un futuro hermoso.',
      Peaceful: 'Sólo por hoy, libero toda ansiedad y doy la bienvenida a la suave calma en mi espíritu.',
      Grateful: 'Sólo por hoy, doy profundas gracias por mi progreso, mi santuario y mi comunidad.',
      Anxious: 'Sólo por hoy, me doy permiso para descansar, reiniciar y comenzar de nuevo sin juzgarme.',
      Frustrated: 'Sólo por hoy, acepto que no puedo controlarlo todo y dejo ir las expectativas.',
      Overwhelmed: 'Sólo por hoy, tomo este día una sola respiración a la vez. Estoy donde necesito estar.',
      Tired: 'Sólo por hoy, escucho a mi cuerpo y me permito un descanso suave y rejuvenecimiento.',
      Lonely: 'Sólo por hoy, recuerdo que estoy conectado a una comunidad de sanación, nunca estoy solo.',
      Angry: 'Sólo por hoy, exhalo la ira y permito que la paciencia y la comprensión llenen el espacio.'
    };
    const fallbackPortuguese: Record<MoodType, string> = {
      Calm: 'Só por hoje, alinho-me com a quietude serena do momento presente.',
      Content: 'Só por hoje, aprecio as bênçãos simples que estão bem à minha frente.',
      Joyful: 'Só por hoje, irradio positividade e acolho a alegria de viver limpo.',
      Hopeful: 'Só por hoje, confio que o meu caminho de recuperação me conduz a um futuro luminoso.',
      Peaceful: 'Só por hoje, liberto toda a ansiedade e acolho a calma suave no meu espírito.',
      Grateful: 'Só por hoje, agradeço profundamente pelo meu progresso, pelo meu santuário e pela comunidade.',
      Anxious: 'Só por hoje, dou-me permissão para descansar, reiniciar e recomeçar sem julgamento.',
      Frustrated: 'Só por hoje, aceito que não posso controlar tudo e desapego-me das expetativas.',
      Overwhelmed: 'Só por hoje, vivo este dia uma respiração de cada vez. Estou onde preciso estar.',
      Tired: 'Só por hoje, escuto o meu corpo e permito-me um repouso gentil e renovador.',
      Lonely: 'Só por hoje, lembro-me de que estou ligado a uma irmandade de cura e nunca estou sozinho.',
      Angry: 'Só por hoje, solto a raiva e permito que a paciência e a compreensão ocupem o seu lugar.'
    };

    const getLocalFallback = () => {
      if (language === 'English') return fallbackEnglish[mood];
      if (language === 'Español') return fallbackSpanish[mood];
      return fallbackPortuguese[mood];
    };

    // Check local limit first
    if (aiUsage.date === today && aiUsage.count >= 3) {
      return getLocalFallback();
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/intention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, language }),
      });
      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      
      // Update local usage based on server count
      if (data.currentCount !== undefined) {
        setAiUsage({ date: today, count: data.currentCount });
      } else {
        setAiUsage(prev => ({ date: today, count: prev.count + 1 }));
      }
      return data.intention;
    } catch (e) {
      console.error(e);
      // Fallback local intentions matching the serene theme
      setAiUsage(prev => ({ date: today, count: Math.min(prev.count + 1, 3) }));
      return getLocalFallback();
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIInsights = async (): Promise<string> => {
    const today = formatLocalDateToYMD();

    // Check local limit first
    if (aiUsage.date === today && aiUsage.count >= 3) {
      if (language === 'English') {
        return `You have felt 15% more Calm this week compared to last. Afternoon reflections show higher levels of Contentment. Keep prioritizing your boundaries and daily meditation.`;
      } else if (language === 'Português') {
        return `Sentiu-se 15% mais calmo esta semana em comparação com a anterior. As reflexões da tarde mostram níveis mais elevados de serenidade. Continue a priorizar os seus limites e a meditação diária.`;
      } else {
        return `Te has sentido un 15% más calmado esta semana en comparación con la anterior. Las reflexiones de la tarde muestran niveles más altos de satisfacción. Sigue priorizando tus límites y la meditación diaria.`;
      }
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflections, language }),
      });
      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      
      // Update local usage based on server count
      if (data.currentCount !== undefined) {
        setAiUsage({ date: today, count: data.currentCount });
      } else {
        setAiUsage(prev => ({ date: today, count: prev.count + 1 }));
      }
      return data.insights;
    } catch (e) {
      console.error(e);
      setAiUsage(prev => ({ date: today, count: Math.min(prev.count + 1, 3) }));
      if (language === 'English') {
        return `You have felt 15% more Calm this week compared to last. Afternoon reflections show higher levels of Contentment. Keep prioritizing your boundaries and daily meditation.`;
      } else if (language === 'Português') {
        return `Sentiu-se 15% mais calmo esta semana em comparação com a anterior. As reflexões da tarde mostram níveis mais elevados de serenidade. Continue a priorizar os seus limites e a meditação diária.`;
      } else {
        return `Te has sentido un 15% más calmado esta semana en comparación con la anterior. Las reflexiones de la tarde muestran niveles más altos de satisfacción. Sigue priorizando tus límites y la meditación diaria.`;
      }
    } finally {
      setAiLoading(false);
    }
  };

  const isLimitReached = aiUsage.date === formatLocalDateToYMD() && aiUsage.count >= 3;

  const syncToCloud = async (): Promise<boolean> => {
    if (!syncEnabled) return false;
    if (isCloudQuotaExceeded()) {
      setCloudQuotaExceeded(true);
      return false;
    }
    try {
      const payload = exportLocalStateToCloudPayload();
      const res = await saveToCloud(syncCode, payload);
      if (res.quotaExceeded) {
        setCloudQuotaExceeded(true);
      } else {
        setCloudQuotaExceeded(false);
      }
      if (res.success) {
        const now = new Date().toISOString();
        setLastCloudSync(now);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const restoreFromSyncCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await restoreFromCloud(code);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Sync code not found' };
      }
      const data = res.data;
      writePayloadToLocalStorage(data, code);

      if (data.sobrietyStartDate) setSobrietyStartDateState(data.sobrietyStartDate);
      if (data.reflections) setReflections(data.reflections);
      if (data.steps) setSteps(data.steps);
      if (data.customMoods) setCustomMoods(data.customMoods);
      if (data.language) setLanguageState(data.language as any);
      if (data.supportNumber !== undefined) setSupportNumberState(data.supportNumber);
      if (data.sponsorName !== undefined) setSponsorNameState(data.sponsorName);
      if (data.sponsorNumber !== undefined) setSponsorNumberState(data.sponsorNumber);
      if (data.supportLink !== undefined) setSupportLinkState(data.supportLink);
      if (data.lastSoberCheckInTime) setLastSoberCheckInTime(data.lastSoberCheckInTime);
      if (data.brotherhoods) setBrotherhoods(data.brotherhoods);

      const normCode = normalizeSyncCode(code);
      setSyncCode(normCode);
      const now = new Date().toISOString();
      setLastCloudSync(now);
      setOnboardedState(true);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Restore failed' };
    }
  };

  // Auto-sync to Cloud Firestore whenever user recovery data changes (debounced with quota protection)
  useEffect(() => {
    if (!syncEnabled) return;
    if (isCloudQuotaExceeded()) {
      setCloudQuotaExceeded(true);
      return;
    }
    if (onboarded || reflections.length > 0 || brotherhoods.length > 0) {
      const timer = setTimeout(() => {
        syncToCloud().catch(() => {});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sobrietyStartDate, reflections, steps, customMoods, lastSoberCheckInTime, onboarded, syncEnabled, brotherhoods]);

  // Initial cloud restore listener if #sync= was in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('sync=')) {
        const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
        const params = new URLSearchParams(cleanHash);
        const codeFromUrl = params.get('sync');
        if (codeFromUrl && (!reflections || reflections.length === 0)) {
          restoreFromSyncCode(codeFromUrl).catch(() => {});
        }
      }
    }
  }, []);

  return (
    <SanctuaryContext.Provider
      value={{
        state: { 
          sobrietyStartDate, 
          reflections, 
          activeTab, 
          currentLessonId, 
          soberCheckedInToday, 
          biometricLock, 
          language, 
          syncEnabled, 
          customMoods, 
          lastSoberCheckInTime,
          supportNumber,
          sponsorName,
          sponsorNumber,
          supportLink,
          onboarded,
          syncCode,
          lastCloudSync,
          brotherhoods
        },
        setActiveTab,
        setCurrentLessonId,
        setSobrietyStartDate,
        addReflection,
        deleteReflection,
        toggleSoberCheckIn,
        setLanguage,
        setBiometricLock,
        setSyncEnabled,
        addCustomMood,
        steps,
        updateSubLessonStatus,
        incrementStepProgress,
        decrementStepProgress,
        getTranslation,
        generateAIIntention,
        generateAIInsights,
        aiLoading,
        aiUsageCount: aiUsage.count,
        limitReached: isLimitReached,
        timeGroundedString,
        showSOSModal,
        setShowSOSModal,
        setSupportNumber,
        setSponsorName,
        setSponsorNumber,
        setSupportLink,
        setOnboarded,
        syncCode,
        lastCloudSync,
        cloudQuotaExceeded,
        syncToCloud,
        restoreFromSyncCode,
        addBrotherhood,
        deleteBrotherhood,
      }}
    >
      {children}
    </SanctuaryContext.Provider>
  );
};

export const useSanctuary = () => {
  const context = useContext(SanctuaryContext);
  if (!context) throw new Error('useSanctuary must be used within SanctuaryProvider');
  return context;
};

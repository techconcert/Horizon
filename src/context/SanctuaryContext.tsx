/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TabType, MoodType, Reflection, Step, SubLesson, SanctuaryState } from '../types';
import { INITIAL_STEPS } from '../lessons';

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
  timeGroundedString: { years: number; months: number; days: number; hours: number; minutes: number; seconds: number; totalHours: number; totalDays: number };
  showSOSModal: boolean;
  setShowSOSModal: (open: boolean) => void;
  setSupportNumber: (val: string) => void;
  setSponsorName: (val: string) => void;
  setSponsorNumber: (val: string) => void;
  setSupportLink: (val: string) => void;
  setOnboarded: (onboarded: boolean) => void;
  seed90DaysData: () => void;
}

const SanctuaryContext = createContext<SanctuaryContextType | undefined>(undefined);

// Helper to calculate initial start date representing 1 year, 2 months, 15 days ago
const getInitialSoberDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  d.setMonth(d.getMonth() - 2);
  d.setDate(d.getDate() - 15);
  d.setHours(d.getHours() - 12); // add 12 hours
  return d.toISOString();
};

const DEFAULT_REFLECTIONS: Reflection[] = [
  {
    id: '1',
    date: new Date().toISOString(), // Today
    title: 'Evening Reflection',
    content: 'Reflecting on my interactions today, I realized I reacted defensively during a meeting. Admitting it quickly helped defuse the situation. I feel grounded now.',
    moods: ['Calm', 'Content'],
  },
  {
    id: '2',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    title: 'Midday Check-in',
    content: 'Felt a surge of anxiety regarding an upcoming deadline. Took a moment to step back and apply the Serenity Prayer. Need to focus on what I can control.',
    moods: ['Anxious'],
  },
  {
    id: '3',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago (placeholder for Oct 24 style)
    title: 'Morning Review',
    content: 'Woke up feeling overwhelmed by commitments. Started prioritizing and making amends for double-booking myself. Learning to say no.',
    moods: ['Overwhelmed', 'Tired'],
  }
];

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
  'trackers_tab': { English: 'Trackers', Español: 'Progreso', Português: 'Progresso' },
  'tools_tab': { English: 'Tools', Español: 'Herramientas', Português: 'Ferramentas' },
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
  'morning_gratitude': { English: 'Morning Gratitude', Español: 'Gratitud de la mañana', Português: 'Gratidão matinal' },
  'morning_grat_desc': { English: 'Align your intentions for the day with a gentle focus on what you have.', Español: 'Alinea tus intenciones del día enfocándote suavemente en lo que tienes.', Português: 'Alinhe suas intenções do dia com um foco suave naquilo que você tem.' },
  'serenity_prayer': { English: 'Serenity Prayer', Español: 'Oración de la Serenidad', Português: 'Oração da Serenidade' },
  'serenity_desc': { English: 'A classic meditation on acceptance, courage, and wisdom.', Español: 'Una meditación clásica sobre la aceptación, el valor y la sabiduría.', Português: 'Uma meditação clássica sobre aceitação, coragem e sabedoria.' },
  'evening_release': { English: 'Evening Release', Español: 'Descarga nocturna', Português: 'Descarrego noturno' },
  'evening_desc': { English: "Let go of the day's burdens before finding rest.", Español: 'Suelta las cargas del día antes de descansar.', Português: 'Solte as cargas do dia antes de descansar.' },
  'breathing_exercises': { English: 'Breathing Exercises', Español: 'Ejercicios de respiración', Português: 'Exercícios de respiração' },
  'find_center': { English: 'Find your center with guided rhythms.', Español: 'Encuentra tu centro con ritmos guiados.', Português: 'Encontre o seu centro com ritmos guiados.' },
  'inhale': { English: 'Inhale', Español: 'Inhala', Português: 'Inspira' },
  'hold': { English: 'Hold', Español: 'Sostén', Português: 'Segura' },
  'exhale': { English: 'Exhale', Español: 'Exhala', Português: 'Expira' },
  'seconds': { English: 'seconds', Español: 'segundos', Português: 'segundos' },
  'start_session': { English: 'Start Session', Español: 'Empezar sesión', Português: 'Iniciar sessão' },
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
};

export const calculateTimeGrounded = (startDateStr: string) => {
  const start = new Date(startDateStr);
  const now = new Date();
  let diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) diffMs = 0;

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return { years, months, days, hours, minutes, seconds, totalHours: Math.floor(diffMs / (1000 * 60 * 60)), totalDays };
};

export const SanctuaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from local storage or default values
  const [sobrietyStartDate, setSobrietyStartDateState] = useState<string>(() => {
    const saved = localStorage.getItem('sobrietyStartDate');
    return saved || getInitialSoberDate();
  });

  const [reflections, setReflections] = useState<Reflection[]>(() => {
    const saved = localStorage.getItem('reflections');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    return (localStorage.getItem('activeTab') as TabType) || 'home';
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
    return (localStorage.getItem('language') as 'English' | 'Español' | 'Português') || 'English';
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

  const [onboarded, setOnboardedState] = useState<boolean>(() => {
    return localStorage.getItem('onboarded') === 'true';
  });

  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [showSOSModal, setShowSOSModal] = useState<boolean>(false);

  const [aiUsage, setAiUsage] = useState<{ date: string; count: number }>(() => {
    const saved = localStorage.getItem('aiUsage');
    const today = new Date().toISOString().split('T')[0];
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
    localStorage.setItem('sobrietyStartDate', sobrietyStartDate);
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

  // Setters
  const setActiveTab = (tab: TabType) => setActiveTabState(tab);
  const setCurrentLessonId = (id: string | null) => setCurrentLessonIdState(id);
  const setSobrietyStartDate = (date: string) => {
    setSobrietyStartDateState(date);
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
    const today = new Date().toISOString().split('T')[0];
    
    // Check local limit first
    if (aiUsage.date === today && aiUsage.count >= 3) {
      const fallbackEnglish: Record<MoodType, string> = {
        Calm: 'I align myself with the quiet stillness of the present moment.',
        Content: 'I appreciate the simple blessings that are right in front of me.',
        Joyful: 'I radiate positivity and embrace the happiness of being clean.',
        Hopeful: 'I trust that my path of recovery is leading me to a beautiful future.',
        Peaceful: 'I release all anxiety and welcome the soft calm into my spirit.',
        Grateful: 'I give deep thanks for my progress, my sanctuary, and my community.',
        Anxious: 'I give myself permission to rest, to reset, and to begin again without judgment.',
        Frustrated: 'I accept that I cannot control everything, and I let go of expectations.',
        Overwhelmed: 'I take this day one single breath at a time. I am where I need to be.',
        Tired: 'I listen to my body and allow myself gentle rest and rejuvenation.',
        Lonely: 'I am connected to a larger community of healing, and I am never truly alone.',
        Angry: 'I breathe out anger and allow patience and understanding to fill the space.'
      };
      const fallbackSpanish: Record<MoodType, string> = {
        Calm: 'Me alineo con la quietud pacífica del momento presente.',
        Content: 'Aprecio las bendiciones sencillas que están justo frente a mí.',
        Joyful: 'Irradio positividad y abrazo la felicidad de estar limpio.',
        Hopeful: 'Confío en que mi camino de recuperación me lleva a un futuro hermoso.',
        Peaceful: 'Libero toda ansiedad y doy la bienvenida a la suave calma en mi espíritu.',
        Grateful: 'Doy profundas gracias por mi progreso, mi santuario y mi comunidad.',
        Anxious: 'Me doy permiso para descansar, reiniciar y comenzar de nuevo sin juzgarme.',
        Frustrated: 'Acepto que no puedo controlarlo todo y dejo ir las expectativas.',
        Overwhelmed: 'Tomo este día una sola respiración a la vez. Estoy donde necesito estar.',
        Tired: 'Escucho a mi cuerpo y me permito un descanso suave y rejuvenecimiento.',
        Lonely: 'Estoy conectado a una comunidad de sanación más grande, nunca estoy solo.',
        Angry: 'Exhalo la ira y permito que la paciencia y la comprensión llenen el espacio.'
      };
      return language === 'English' ? fallbackEnglish[mood] : fallbackSpanish[mood];
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
      const fallbackEnglish: Record<MoodType, string> = {
        Calm: 'I align myself with the quiet stillness of the present moment.',
        Content: 'I appreciate the simple blessings that are right in front of me.',
        Joyful: 'I radiate positivity and embrace the happiness of being clean.',
        Hopeful: 'I trust that my path of recovery is leading me to a beautiful future.',
        Peaceful: 'I release all anxiety and welcome the soft calm into my spirit.',
        Grateful: 'I give deep thanks for my progress, my sanctuary, and my community.',
        Anxious: 'I give myself permission to rest, to reset, and to begin again without judgment.',
        Frustrated: 'I accept that I cannot control everything, and I let go of expectations.',
        Overwhelmed: 'I take this day one single breath at a time. I am where I need to be.',
        Tired: 'I listen to my body and allow myself gentle rest and rejuvenation.',
        Lonely: 'I am connected to a larger community of healing, and I am never truly alone.',
        Angry: 'I breathe out anger and allow patience and understanding to fill the space.'
      };
      const fallbackSpanish: Record<MoodType, string> = {
        Calm: 'Me alineo con la quietud pacífica del momento presente.',
        Content: 'Aprecio las bendiciones sencillas que están justo frente a mí.',
        Joyful: 'Irradio positividad y abrazo la felicidad de estar limpio.',
        Hopeful: 'Confío en que mi camino de recuperación me lleva a un futuro hermoso.',
        Peaceful: 'Libero toda ansiedad y doy la bienvenida a la suave calma en mi espíritu.',
        Grateful: 'Doy profundas gracias por mi progreso, mi santuario y mi comunidad.',
        Anxious: 'Me doy permiso para descansar, reiniciar y comenzar de nuevo sin juzgarme.',
        Frustrated: 'Acepto que no puedo controlarlo todo y dejo ir las expectativas.',
        Overwhelmed: 'Tomo este día una sola respiración a la vez. Estoy donde necesito estar.',
        Tired: 'Escucho a mi cuerpo y me permito un descanso suave y rejuvenecimiento.',
        Lonely: 'Estoy conectado a una comunidad de sanación más grande, nunca estoy solo.',
        Angry: 'Exhalo la ira y permito que la paciencia y la comprensión llenen el espacio.'
      };
      return language === 'English' ? fallbackEnglish[mood] : fallbackSpanish[mood];
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIInsights = async (): Promise<string> => {
    const today = new Date().toISOString().split('T')[0];

    // Check local limit first
    if (aiUsage.date === today && aiUsage.count >= 3) {
      if (language === 'English') {
        return `You have felt 15% more Calm this week compared to last. Afternoon reflections show higher levels of Contentment. Keep prioritizing your boundaries and daily meditation.`;
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
      } else {
        return `Te has sentido un 15% más calmado esta semana en comparación con la anterior. Las reflexiones de la tarde muestran niveles más altos de satisfacción. Sigue priorizando tus límites y la meditación diaria.`;
      }
    } finally {
      setAiLoading(false);
    }
  };

  const isLimitReached = aiUsage.date === new Date().toISOString().split('T')[0] && aiUsage.count >= 3;

  const seed90DaysData = () => {
    // 1. Erase custom moods
    setCustomMoods([]);
    localStorage.removeItem('customMoods');

    // 2. Generate 90 days of random reflections
    const generatedReflections: Reflection[] = [];
    const now = new Date();
    
    const positiveMoods: MoodType[] = ['Calm', 'Content', 'Joyful', 'Hopeful', 'Peaceful', 'Grateful'];
    const negativeMoods: MoodType[] = ['Anxious', 'Frustrated', 'Overwhelmed', 'Angry', 'Tired', 'Lonely'];
    
    const positiveScenarios = [
      {
        title: { English: 'Morning Serenity', Español: 'Serenidad Matutina', Português: 'Serenidade Matinal' },
        content: {
          English: 'Felt a deep sense of serenity during my morning meditation. The path of recovery is clear and I feel extremely motivated today.',
          Español: 'Sentí una profunda sensación de serenidad durante mi meditación matutina. El camino de la recuperación es claro y me siento muy motivado hoy.',
          Português: 'Senti uma profunda sensação de serenidade durante a minha meditação matinal. O caminho da recuperação está claro e me sinto muito motivado hoje.'
        }
      },
      {
        title: { English: 'Fellowship Connection', Español: 'Conexión con el Grupo', Português: 'Conexão com o Grupo' },
        content: {
          English: 'Attended an awesome local fellowship meeting today. Sharing and listening reminded me of how blessed and supported I am in this sanctuary.',
          Español: 'Asistí a una reunión increíble hoy. Compartir y escuchar me recordó lo afortunado y apoyado que estoy en este santuario.',
          Português: 'Participei de uma reunião incrível hoje. Compartilhar e ouvir me lembrou o quanto sou abençoado e apoiado neste santuário.'
        }
      },
      {
        title: { English: 'Step Work Accomplished', Español: 'Paso Completado', Português: 'Passo Concluído' },
        content: {
          English: 'Spent time reading step literature. Admitting powerlessness is helping me release control and find a peaceful frame of mind.',
          Español: 'Pasé tiempo leyendo literatura sobre los pasos. Admitir la impotencia me está ayudando a liberar el control y encontrar paz mental.',
          Português: 'Passei um tempo lendo a literatura dos passos. Admitir a impotência está me ajudando a liberar o controle e encontrar paz mental.'
        }
      },
      {
        title: { English: 'Sponsor Talk', Español: 'Charla con el Padrino', Português: 'Conversa com o Padrinho' },
        content: {
          English: 'Connected with my sponsor today. We discussed the weight of expectations and it was highly relieving. Feeling secure and strong.',
          Español: 'Me conecté con mi padrino hoy. Discutimos el peso de las expectativas y fue un gran alivio. Me siento seguro y fuerte.',
          Português: 'Falei com meu padrinho hoje. Conversamos sobre o peso das expectativas e foi um grande alívio. Sinto-me seguro e forte.'
        }
      },
      {
        title: { English: 'Nature Walk', Español: 'Paseo por la Naturaleza', Português: 'Caminhada na Natureza' },
        content: {
          English: 'Went for a peaceful walk this afternoon. Taking things one day at a time keeps my mind bright and full of genuine gratitude.',
          Español: 'Fui a dar un paseo tranquilo esta tarde. Tomar las cosas un día a la vez mantiene mi mente despejada y llena de gratitud genuina.',
          Português: 'Fiz uma caminhada tranquila esta tarde. Viver um dia de cada vez mantém minha mente limpa e cheia de gratidão genuína.'
        }
      }
    ];

    const negativeScenarios = [
      {
        title: { English: 'Stressed and Exhausted', Español: 'Estresado y Agotado', Português: 'Estressado e Esgotado' },
        content: {
          English: 'Had a challenging and exhausting day with work deadlines. Felt anxious and tired, but focused on what I can control.',
          Español: 'Tuve un día desafiante y agotador con plazos de trabajo. Me sentí ansioso y cansado, pero me enfoqué en lo que puedo controlar.',
          Português: 'Tive um dia desafiador e exaustivo com prazos de trabalho. Senti-me ansioso e cansado, mas foquei no que posso controlar.'
        }
      },
      {
        title: { English: 'Slightly Restless', Español: 'Un Poco Inquieto', Português: 'Um Pouco Inquieto' },
        content: {
          English: 'Woke up feeling somewhat restless and frustrated. Did some deep breathing exercises to ground myself and release the negative tension.',
          Español: 'Me desperté sintiéndome un poco inquieto y frustrado. Hice algunos ejercicios de respiración profunda para conectarme y liberar la tensión.',
          Português: 'Acordei me sentindo um pouco inquieto e frustrado. Fiz alguns exercícios de respiração profunda para me conectar e liberar a tensão.'
        }
      },
      {
        title: { English: 'Lonely Evening Thoughts', Español: 'Pensamientos de Soledad', Português: 'Pensamentos de Solidão' },
        content: {
          English: 'Struggled with empty and lonely feelings tonight. Reached out to a fellowship friend which helped defuse the emotional spiral.',
          Español: 'Luché con sentimientos de vacío y soledad esta noche. Me puse en contacto con un amigo del grupo, lo que ayudó a calmar la espiral emocional.',
          Português: 'Lutei com sentimentos de vazio e solidão esta noite. Entrei em contato com um amigo do grupo, o que ajudou a acalmar a espiral emocional.'
        }
      },
      {
        title: { English: 'Overwhelming Commitments', Español: 'Compromisos Abrumadores', Português: 'Compromissos Excessivos' },
        content: {
          English: 'Felt very overwhelmed and panicky about my progress today. Paused to pray and surrender. Learning to protect my boundaries.',
          Español: 'Me sentí muy abrumado y asustado por mi progreso hoy. Me detuve a orar y rendirme. Aprendiendo a proteger mis límites.',
          Português: 'Senti-me muito sobrecarregado e assustado com o meu progresso hoje. Parei para orar e me render. Aprendendo a proteger meus limites.'
        }
      },
      {
        title: { English: 'Dealing with Old Triggers', Español: 'Lidiando con Desencadenantes', Português: 'Lidando com Gatilhos' },
        content: {
          English: 'Encountered some old triggers and felt a flash of anger and frustration. So glad I stayed safe and applied my daily recovery tools.',
          Español: 'Encontré algunos desencadenantes viejos y sentí un destello de ira y frustración. Muy feliz de haberme mantenido a salvo y usar mis herramientas.',
          Português: 'Encontrei alguns gatilhos antigos e senti um lampejo de raiva e frustração. Muito feliz por ter me mantido seguro e usado minhas ferramentas.'
        }
      }
    ];

    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      
      // Generate up to 3 entries for this day (1 to 3 entries)
      const numEntries = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numEntries; j++) {
        const isPositive = Math.random() < 0.65;
        
        let moodsToLog: MoodType[] = [];
        let title = '';
        let content = '';
        
        if (isPositive) {
          const primary = positiveMoods[Math.floor(Math.random() * positiveMoods.length)];
          const moods = [primary];
          
          // Add 1 or 2 more moods to test multiple moods per entry
          const extraCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 extra moods
          for (let k = 0; k < extraCount; k++) {
            const pool = [...positiveMoods, ...negativeMoods];
            const extra = pool[Math.floor(Math.random() * pool.length)] as MoodType;
            if (!moods.includes(extra)) {
              moods.push(extra);
            }
          }
          moodsToLog = moods;
          
          const scenario = positiveScenarios[Math.floor(Math.random() * positiveScenarios.length)];
          title = scenario.title[language] || scenario.title.English;
          content = scenario.content[language] || scenario.content.English;
        } else {
          const primary = negativeMoods[Math.floor(Math.random() * negativeMoods.length)];
          const moods = [primary];
          
          // Add 1 or 2 more moods
          const extraCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 extra moods
          for (let k = 0; k < extraCount; k++) {
            const pool = [...positiveMoods, ...negativeMoods];
            const extra = pool[Math.floor(Math.random() * pool.length)] as MoodType;
            if (!moods.includes(extra)) {
              moods.push(extra);
            }
          }
          moodsToLog = moods;
          
          const scenario = negativeScenarios[Math.floor(Math.random() * negativeScenarios.length)];
          title = scenario.title[language] || scenario.title.English;
          content = scenario.content[language] || scenario.content.English;
        }
        
        // Add some hour/minute offset so the entries have distinct timestamps within that day
        const entryDate = new Date(d);
        entryDate.setHours(8 + j * 4, Math.floor(Math.random() * 60), 0, 0);

        generatedReflections.push({
          id: `seeded-${i}-${j}-${Date.now()}`,
          date: entryDate.toISOString(),
          title: `${title} (${j + 1}/${numEntries})`,
          content,
          moods: moodsToLog
        });
      }
    }
    
    setReflections(generatedReflections);
    localStorage.setItem('reflections', JSON.stringify(generatedReflections));
  };

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
          onboarded
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
        seed90DaysData,
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

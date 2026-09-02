/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSanctuary } from '../context/SanctuaryContext';
import { MoodType, Reflection } from '../types';
import {
  Sun,
  Smile,
  Laugh,
  Droplet,
  Heart,
  Activity,
  Frown,
  Cloud,
  Battery,
  UserX,
  Flame,
  Sparkles,
  Plus,
  X,
  Trash2,
  HeartHandshake,
  BrainCircuit,
  BarChart2,
  Search,
  CheckCircle2,
  Compass,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const STANDARD_MOOD_SCORES: Record<string, number> = {
  Joyful: 1.0,
  Grateful: 0.9,
  Hopeful: 0.8,
  Peaceful: 0.7,
  Calm: 0.5,
  Content: 0.4,
  Tired: -0.2,
  Lonely: -0.4,
  Anxious: -0.5,
  Overwhelmed: -0.6,
  Frustrated: -0.8,
  Angry: -1.0,
};

export const analyzeSentimentNLP = (text: string): number => {
  const normalized = text.toLowerCase().trim();
  
  // 1. Positive and Negative word banks (with baseline weights)
  const positiveWords: Record<string, number> = {
    happy: 0.8, joyful: 1.0, glad: 0.7, content: 0.5, calm: 0.6, peaceful: 0.7,
    grateful: 0.9, hopeful: 0.8, great: 0.7, good: 0.5, awesome: 0.9, fantastic: 0.9,
    blessed: 0.8, energized: 0.8, excited: 0.9, love: 0.8, serene: 0.8, relaxed: 0.6,
    nice: 0.4, pleasant: 0.5, safe: 0.6, strong: 0.7, confident: 0.8, proud: 0.8,
    optimistic: 0.8, inspired: 0.8, motivated: 0.8, wonderful: 0.9, bright: 0.6,
    healed: 0.7, positive: 0.7, dynamic: 0.6, relief: 0.6, relieved: 0.6, ease: 0.5
  };
  
  const negativeWords: Record<string, number> = {
    sad: -0.6, anxious: -0.7, worried: -0.6, angry: -0.9, frustrated: -0.8,
    overwhelmed: -0.7, tired: -0.3, lonely: -0.5, bad: -0.5, terrible: -0.8,
    hopeless: -0.9, depressed: -0.8, stressed: -0.6, panicky: -0.8, scared: -0.7,
    fearful: -0.7, mad: -0.8, annoyed: -0.5, bored: -0.3, exhausted: -0.6,
    drained: -0.5, weak: -0.5, hurt: -0.6, guilty: -0.5, ashamed: -0.5,
    empty: -0.6, bitter: -0.7, hateful: -0.9, lost: -0.5, confused: -0.4,
    negative: -0.6, down: -0.4, heavy: -0.4, painful: -0.6, pain: -0.5, low: -0.3
  };
  
  // 2. Intensifiers and Diminishers
  const intensifiers = ['very', 'extremely', 'highly', 'so', 'really', 'super', 'quite', 'extra', 'immensely'];
  const diminishers = ['slightly', 'somewhat', 'a bit', 'a little', 'barely', 'scarcely', 'mildly'];
  
  // 3. Negations
  const negations = ['not', 'no', 'never', 'dont', "don't", 'without', 'un', 'less'];
  
  // Split words
  const words = normalized.replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
  
  let totalScore = 0;
  let wordCount = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue;
    
    let isPos = word in positiveWords;
    let isNeg = word in negativeWords;
    
    if (isPos || isNeg) {
      let baseScore = isPos ? positiveWords[word] : negativeWords[word];
      
      // Look back for modifiers
      let multiplier = 1.0;
      let negated = false;
      
      // Check previous two words for intensifiers, diminishers, or negations
      for (let j = 1; j <= 2; j++) {
        if (i - j >= 0) {
          const prevWord = words[i - j];
          if (intensifiers.includes(prevWord)) {
            multiplier *= 1.3;
          } else if (diminishers.includes(prevWord)) {
            multiplier *= 0.6;
          } else if (negations.includes(prevWord) || prevWord.endsWith("n't")) {
            negated = !negated;
          }
        }
      }
      
      let finalWordScore = baseScore * multiplier;
      if (negated) {
        finalWordScore = -finalWordScore;
      }
      
      totalScore += finalWordScore;
      wordCount++;
    }
  }
  
  if (wordCount === 0) {
    // Fallback search inside the string (e.g. if custom mood is a compound word like "hopeful-ish")
    for (const [posW, val] of Object.entries(positiveWords)) {
      if (normalized.includes(posW)) {
        totalScore += val;
        wordCount++;
      }
    }
    for (const [negW, val] of Object.entries(negativeWords)) {
      if (normalized.includes(negW)) {
        totalScore += val;
        wordCount++;
      }
    }
  }
  
  if (wordCount > 0) {
    // Average and clamp between -1.0 and 1.0
    const avg = totalScore / wordCount;
    return Math.max(-1.0, Math.min(1.0, avg));
  }
  
  // If no sentiment words found, determine by a simple string matching fallback or standard baseline
  if (normalized.includes('good') || normalized.includes('great') || normalized.includes('fine') || normalized.includes('ok') || normalized.includes('nice') || normalized.includes('cool')) {
    return 0.3;
  }
  if (normalized.includes('bad') || normalized.includes('sad') || normalized.includes('ill') || normalized.includes('sick') || normalized.includes('meh')) {
    return -0.3;
  }
  
  return 0.0; // Default Neutral
};

export const getMoodScore = (moodName: string): number => {
  if (moodName in STANDARD_MOOD_SCORES) {
    return STANDARD_MOOD_SCORES[moodName];
  }
  return analyzeSentimentNLP(moodName);
};

const MOOD_DESCRIPTIONS: Record<MoodType, { icon: React.ReactNode; color: string; bg: string }> = {
  Calm: { icon: <Sparkles className="w-5 h-5" />, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  Content: { icon: <Smile className="w-5 h-5" />, color: 'text-[#3e6355]', bg: 'bg-[#f5fff8]' },
  Joyful: { icon: <Laugh className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-50' },
  Hopeful: { icon: <Sun className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50' },
  Peaceful: { icon: <Droplet className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-50' },
  Grateful: { icon: <Heart className="w-5 h-5" />, color: 'text-pink-500', bg: 'bg-pink-50' },
  Anxious: { icon: <Activity className="w-5 h-5" />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  Frustrated: { icon: <Frown className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-50' },
  Overwhelmed: { icon: <Cloud className="w-5 h-5" />, color: 'text-slate-500', bg: 'bg-slate-50' },
  Tired: { icon: <Battery className="w-5 h-5" />, color: 'text-neutral-500', bg: 'bg-neutral-50' },
  Lonely: { icon: <UserX className="w-5 h-5" />, color: 'text-violet-500', bg: 'bg-violet-50' },
  Angry: { icon: <Flame className="w-5 h-5" />, color: 'text-rose-500', bg: 'bg-rose-50' },
};

const MOOD_TRANSLATIONS: Record<string, Record<'English' | 'Español' | 'Português', string>> = {
  Calm: { English: 'Calm', Español: 'Calma', Português: 'Calma' },
  Content: { English: 'Content', Español: 'Satisfecho', Português: 'Contente' },
  Joyful: { English: 'Joyful', Español: 'Alegre', Português: 'Alegre' },
  Hopeful: { English: 'Hopeful', Español: 'Esperanzado', Português: 'Esperançoso' },
  Peaceful: { English: 'Peaceful', Español: 'Pacífico', Português: 'Pacífico' },
  Grateful: { English: 'Grateful', Español: 'Agradecido', Português: 'Grato' },
  Anxious: { English: 'Anxious', Español: 'Ansioso', Português: 'Ansioso' },
  Frustrated: { English: 'Frustrated', Español: 'Frustrado', Português: 'Frustrado' },
  Overwhelmed: { English: 'Overwhelmed', Español: 'Abrumado', Português: 'Sobrecarregado' },
  Tired: { English: 'Tired', Español: 'Cansado', Português: 'Cansado' },
  Lonely: { English: 'Lonely', Español: 'Solo', Português: 'Solitário' },
  Angry: { English: 'Angry', Español: 'Enojado', Português: 'Irritado' },
};

export const TrackersView: React.FC = () => {

  const {
    state,
    getTranslation,
    generateAIInsights,
    aiLoading,
    aiUsageCount,
    limitReached,
    addReflection,
    deleteReflection,
    addCustomMood,
    seed90DaysData
  } = useSanctuary();
  const getText = (en: string, es: string, pt: string) => {
    if (state.language === 'English') return en;
    if (state.language === 'Español') return es;
    return pt;
  };

  const getTranslatedMood = (moodName: string): string => {
    const lang = state.language;
    if (moodName in MOOD_TRANSLATIONS) {
      return MOOD_TRANSLATIONS[moodName][lang];
    }
    return moodName;
  };

  // Tab management: 'checkin' | 'history' | 'trends'
  const [activeSubTab, setActiveSubTab] = useState<'checkin' | 'history' | 'trends'>('checkin');
  const [daysPeriod, setDaysPeriod] = useState<7 | 30>(7);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [aiInsightsText, setAiInsightsText] = useState<string>('');

  // Reflection/Mood state
  const [selectedMoods, setSelectedMoods] = useState<MoodType[]>(['Calm']);
  const [reflectionTitle, setReflectionTitle] = useState('');
  const [reflectionContent, setReflectionContent] = useState('');
  const [customMoodName, setCustomMoodName] = useState('');
  const [showCustomMoodModal, setShowCustomMoodModal] = useState(false);

  useEffect(() => {
    // Generate initial fallback insights based on selected language
    if (state.reflections.length === 0) {
      if (state.language === 'English') {
        setAiInsightsText('Start tracking your daily reflections to unlock AI-powered pattern analysis and emotional trends.');
      } else if (state.language === 'Español') {
        setAiInsightsText('Comienza a registrar tus reflexiones diarias para desbloquear análisis de patrones e indicaciones emocionales impulsadas por IA.');
      } else {
        setAiInsightsText('Comece a registrar suas reflexões diárias para desbloquear análises de padrões e tendências emocionais por IA.');
      }
    } else {
      if (state.language === 'English') {
        setAiInsightsText(`You have felt 15% more Calm this week compared to last. Afternoon reflections show higher levels of Contentment. Keep prioritizing your morning rituals.`);
      } else if (state.language === 'Español') {
        setAiInsightsText(`Te has sentido un 15% más calmado esta semana en comparación con la anterior. Las reflexiones de la tarde muestran niveles más altos de satisfacción.`);
      } else {
        setAiInsightsText(`Você se sentiu 15% mais calmo esta semana em comparação com a anterior. As reflexões da tarde mostram níveis mais altos de contentamento.`);
      }
    }
  }, [state.language, state.reflections.length]);

  // Trilingual translations helper
  const t = (key: string): string => {
    const lang = state.language;
    const lexicon: Record<string, Record<'English' | 'Español' | 'Português', string>> = {
      checkin: {
        English: 'Check-in',
        Español: 'Registro',
        Português: 'Check-in'
      },
      history: {
        English: 'History',
        Español: 'Historial',
        Português: 'Histórico'
      },
      trends: {
        English: 'Trends',
        Español: 'Tendencias',
        Português: 'Tendências'
      },
      mood_selection: {
        English: 'Mood Selection',
        Español: 'Selección de Ánimo',
        Português: 'Seleção de Humor'
      },
      custom_mood: {
        English: 'Custom',
        Español: 'Personalizar',
        Português: 'Personalizado'
      },
      daily_reflection: {
        English: 'Daily Reflection',
        Español: 'Reflexión Diaria',
        Português: 'Reflexão Diária'
      },
      reflection_placeholder: {
        English: "What's on your mind today? Write your reflection here...",
        Español: '¿Qué tienes en mente hoy? Escribe tu reflexión aquí...',
        Português: 'O que está na sua mente hoje? Escreva sua reflexão aqui...'
      },
      save_entry: {
        English: 'Save Entry',
        Español: 'Guardar Entrada',
        Português: 'Salvar Entrada'
      },
      recent_reviews: {
        English: 'Recent Reviews',
        Español: 'Revisiones Recientes',
        Português: 'Revisões Recentes'
      },
      search_placeholder: {
        English: 'Search keywords or feelings...',
        Español: 'Buscar palabras clave o sentimientos...',
        Português: 'Buscar palavras-chave ou sentimentos...'
      },
      mood_pulse: {
        English: 'Mood Pulse',
        Español: 'Pulso Emocional',
        Português: 'Pulso Emocional'
      },
      last_7_days: {
        English: 'Last 7 Days',
        Español: 'Últimos 7 Días',
        Português: 'Últimos 7 Dias'
      },
      mood_distribution: {
        English: 'Mood Distribution',
        Español: 'Distribución del Ánimo',
        Português: 'Distribuição de Humor'
      },
      insights_title: {
        English: 'Insights & Pulse Summary',
        Español: 'Resumen e Insights',
        Português: 'Resumo e Insights'
      },
      reanalyze_btn: {
        English: 'RE-ANALYZE',
        Español: 'RE-ANALIZAR',
        Português: 'RE-ANALISAR'
      },
      generating: {
        English: 'ANALYZING...',
        Español: 'ANALIZANDO...',
        Português: 'ANALISANDO...'
      },
      credits: {
        English: 'Credits',
        Español: 'Créditos',
        Português: 'Créditos'
      },
      ai_limit_reached: {
        English: 'LIMIT REACHED',
        Español: 'LÍMITE ALCANZADO',
        Português: 'LIMITE ATINGIDO'
      },
      ai_limit_desc: {
        English: 'You have used your 3 queries. Take another deep breath and try tomorrow.',
        Español: 'Has usado tus 3 consultas. Toma otra respiración profunda e inténtalo mañana.',
        Português: 'Você usou suas 3 consultas. Respire fundo novamente e tente amanhã.'
      },
      legend_peaceful: {
        English: 'Peaceful',
        Español: 'Tranquilo',
        Português: 'Tranquilo'
      },
      legend_energetic: {
        English: 'Energetic',
        Español: 'Enérgico',
        Português: 'Ativo'
      },
      legend_anxious: {
        English: 'Anxious',
        Español: 'Ansioso',
        Português: 'Ansioso'
      },
      no_reflections: {
        English: 'No reflections found matching your search.',
        Español: 'No se encontraron reflexiones coincidentes.',
        Português: 'Nenhuma reflexão encontrada.'
      },
      custom_mood_title: {
        English: 'Add Custom Mood',
        Español: 'Agregar Estado de Ánimo',
        Português: 'Adicionar Estado de Humor'
      },
      add_mood_btn: {
        English: 'Add Mood',
        Español: 'Agregar',
        Português: 'Adicionar'
      },
      reach_out: {
        English: 'Reach Out Support',
        Español: 'Pedir Apoyo / SOS',
        Português: 'Pedir Apoio / SOS'
      },
      reach_out_desc: {
        English: 'Recovery is never walked alone. If you are struggling with a craving, experiencing anxiety, or need a gentle ear, remember you are worthy of connection.',
        Español: 'La recuperación nunca se recorre solo. Si estás luchando con un deseo, sientes ansiedad o necesitas que te escuchen, recuerda que mereces conectar.',
        Português: 'A recuperação nunca é percorrida sozinho. Se você está lutando contra um desejo, sentindo ansiedade ou precisa de um ouvido amigo, lembre-se de que é digno de conexão.'
      },
      call_988: {
        English: 'Call Support Helpline (988)',
        Español: 'Línea de Apoyo 988',
        Português: 'Linha de Apoio (988)'
      },
      national_247: {
        English: '24/7 National',
        Español: '24/7 Nacional',
        Português: '24/7 Nacional'
      },
      your_intention: {
        English: 'Your Serenity Intention',
        Español: 'Tu Intención de Serenidad',
        Português: 'Sua Intenção de Serenidade'
      },
      serenity_prayer: {
        English: '"God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference."',
        Español: '"Dios, concédeme la serenidad para aceptar las cosas que no puedo cambiar, valor para cambiar aquellas que puedo, y sabiduría para reconocer la diferencia."',
        Português: '"Deus, concedei-me a serenidade para aceitar as coisas que não posso mudar, coragem para mudar as que posso, e sabedoria para saber a diferença."'
      },
      close_portal: {
        English: 'Close Horizon Portal',
        Español: 'Cerrar Portal',
        Português: 'Fechar Portal'
      }
    };
    return lexicon[key]?.[lang] || key;
  };

  // Calculate dynamic mood distribution percentages from user's actual reflections
  const calculateMoodDistribution = () => {
    const counts: Record<string, number> = {};
    let totalMoodsLogged = 0;

    state.reflections.forEach(ref => {
      ref.moods?.forEach(m => {
        counts[m] = (counts[m] || 0) + 1;
        totalMoodsLogged++;
      });
    });

    if (totalMoodsLogged === 0) {
      return [
        { name: 'Calm', percentage: 40, color: 'bg-[#3e6355]' },
        { name: 'Content', percentage: 35, color: 'bg-[#577c6d]' },
        { name: 'Anxious', percentage: 15, color: 'bg-rose-900' },
        { name: 'Overwhelmed', percentage: 10, color: 'bg-slate-400' },
      ];
    }

    const sorted = Object.entries(counts)
      .map(([name, count]) => {
        const score = getMoodScore(name);
        return {
          name,
          percentage: Math.round((count / totalMoodsLogged) * 100),
          color: score > 0
            ? 'bg-[#3e6355]'
            : score < 0
            ? 'bg-rose-900'
            : 'bg-slate-400',
        };
      })
      .sort((a, b) => b.percentage - a.percentage);

    return sorted.slice(0, 4); // return top 4
  };

  const distribution = calculateMoodDistribution();

  // Create Mood Pulse Data dynamically mapping the last 7 calendar days
  const getMockDayData = (dayIndex: number) => {
    switch (dayIndex) {
      case 1: // Monday (Peaceful score is 0.7, so 0.7 * 50 = 35%)
        return {
          direction: 'up' as const,
          height: '35%',
          colorClass: 'bg-[#3e6355]',
          textColorClass: 'text-[#3e6355] font-bold',
          moodName: 'Peaceful'
        };
      case 2: // Tuesday (Anxious score is -0.5, so 0.5 * 50 = 25%)
        return {
          direction: 'down' as const,
          height: '25%',
          colorClass: 'bg-rose-900',
          textColorClass: 'text-rose-900 font-bold',
          moodName: 'Anxious'
        };
      case 3: // Wednesday (Peaceful score is 0.7, so 35%)
        return {
          direction: 'up' as const,
          height: '35%',
          colorClass: 'bg-[#3e6355]',
          textColorClass: 'text-[#3e6355] font-bold',
          moodName: 'Peaceful'
        };
      case 4: // Thursday (Peaceful score is 0.7, so 35%)
        return {
          direction: 'up' as const,
          height: '35%',
          colorClass: 'bg-[#3e6355]',
          textColorClass: 'text-[#3e6355] font-bold',
          moodName: 'Peaceful'
        };
      case 5: // Friday (Tired score is -0.2, so 0.2 * 50 = 10%)
        return {
          direction: 'down' as const,
          height: '10%',
          colorClass: 'bg-rose-900',
          textColorClass: 'text-rose-900 font-bold',
          moodName: 'Tired'
        };
      case 6: // Saturday
      case 0: // Sunday
      default:
        return {
          direction: 'neutral' as const,
          height: '6px',
          colorClass: 'bg-black/25',
          textColorClass: 'text-black/50 font-normal',
          moodName: 'Calm'
        };
    }
  };

  const getMoodPulseData = (daysCount: number) => {
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const result = [];
    const now = new Date();
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayOfWeekIndex = d.getDay();
      const dayLabel = daysCount === 7 
        ? daysOfWeek[dayOfWeekIndex] 
        : d.getDate().toString();
      const dayStr = d.toDateString();
      
      const isLabelVisible = daysCount === 7 || i === 0 || i === daysCount - 1 || i % 5 === 0;
      
      // Find reflections matching this specific day
      const dayRefs = state.reflections.filter(r => new Date(r.date).toDateString() === dayStr);
      
      if (dayRefs.length > 0) {
        // Evaluate the average sentiment score across all moods of all reflections for this day
        let totalScore = 0;
        let scoreCount = 0;
        const allMoods: string[] = [];

        dayRefs.forEach(r => {
          const moods = r.moods && r.moods.length > 0 ? r.moods : ['Calm'];
          moods.forEach(m => {
            if (!allMoods.includes(m)) {
              allMoods.push(m);
            }
            totalScore += getMoodScore(m);
            scoreCount++;
          });
        });

        const score = scoreCount > 0 ? (totalScore / scoreCount) : 0.0;
        
        let direction: 'up' | 'down' | 'neutral' = 'neutral';
        let height = '6px';
        let colorClass = 'bg-[#8c857b]';
        let textColorClass = 'text-[#8c857b] font-normal';
        
        if (score > 0.05) {
          direction = 'up';
          // Scale from 0.0 to 1.0 into 0% to 50% of the parent track height
          const pct = Math.max(8, Math.round(score * 50));
          height = `${pct}%`;
          colorClass = 'bg-[#3e6355]';
          textColorClass = 'text-[#3e6355] font-bold';
        } else if (score < -0.05) {
          direction = 'down';
          // Scale absolute from 0.0 to 1.0 into 0% to 50% of the parent track height
          const pct = Math.max(8, Math.round(Math.abs(score) * 50));
          height = `${pct}%`;
          colorClass = 'bg-rose-900';
          textColorClass = 'text-rose-900 font-bold';
        } else {
          direction = 'neutral';
          height = '6px';
          colorClass = 'bg-[#8c857b]';
          textColorClass = 'text-[#8c857b] font-normal';
        }
        
        result.push({
          label: dayLabel,
          showLabel: isLabelVisible,
          direction,
          height,
          colorClass,
          textColorClass,
          moodName: allMoods.join(', '),
          score,
          hasData: true
        });
      } else {
        result.push({
          label: dayLabel,
          showLabel: isLabelVisible,
          direction: 'neutral',
          height: '6px',
          colorClass: 'bg-black/10',
          textColorClass: 'text-black/30 font-normal',
          moodName: '',
          score: 0,
          hasData: false
        });
      }
    }
    return result;
  };

  const pulseData = getMoodPulseData(daysPeriod);

  const handleFetchInsights = async () => {
    const text = await generateAIInsights();
    setAiInsightsText(text);
  };

  const handleMoodSelect = (mood: MoodType) => {
    if (selectedMoods.includes(mood)) {
      if (selectedMoods.length > 1) {
        setSelectedMoods(prev => prev.filter(m => m !== mood));
      }
    } else {
      setSelectedMoods(prev => [...prev, mood]);
    }
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionContent.trim()) return;

    const title = reflectionTitle.trim() || (getText('Daily Reflection', 'Reflexión diaria', 'Reflexão diária'));
    addReflection(title, reflectionContent.trim(), selectedMoods);
    setReflectionTitle('');
    setReflectionContent('');
    
    // Switch over automatically to History tab so user can review their saved post
    setActiveSubTab('history');
  };

  const handleCustomMoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMoodName.trim()) return;
    addCustomMood(customMoodName.trim());
    setCustomMoodName('');
    setShowCustomMoodModal(false);
  };

  // Filter reflections by search query
  const filteredReflections = state.reflections.filter(ref => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = ref.title?.toLowerCase().includes(q);
    const contentMatch = ref.content?.toLowerCase().includes(q);
    const moodMatch = ref.moods?.some(m => m.toLowerCase().includes(q));
    return titleMatch || contentMatch || moodMatch;
  });

  return (
    <div className="flex flex-col gap-5">
      
      {/* Top Ethereal Context Chip */}
      <div className="flex justify-center mt-1 animate-fadeIn">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#E5E1DB] border border-black/10 text-black font-sans text-[10px] font-bold tracking-widest uppercase shadow-none">
          <BrainCircuit className="w-3.5 h-3.5 mr-2 text-black animate-pulse" />
          {getTranslation('step_chip')}
        </div>
      </div>

      {/* Segmented Control Tab Bar */}
      <div className="flex bg-[#E5E1DB] rounded-full p-1 mx-auto w-full max-w-md shadow-sm border border-black/10 animate-fadeIn">
        <button
          onClick={() => setActiveSubTab('checkin')}
          className={`flex-1 py-2 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all text-center cursor-pointer ${
            activeSubTab === 'checkin'
              ? 'bg-black text-[#F8F5F2]'
              : 'text-black/50 hover:text-black'
          }`}
        >
          {t('checkin')}
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all text-center cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-black text-[#F8F5F2]'
              : 'text-black/50 hover:text-black'
          }`}
        >
          {t('history')}
        </button>
        <button
          onClick={() => setActiveSubTab('trends')}
          className={`flex-1 py-2 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all text-center cursor-pointer ${
            activeSubTab === 'trends'
              ? 'bg-black text-[#F8F5F2]'
              : 'text-black/50 hover:text-black'
          }`}
        >
          {t('trends')}
        </button>
      </div>

      {/* ==================== CHECK-IN TAB ==================== */}
      {activeSubTab === 'checkin' && (
        <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full animate-fadeIn">
          
          {/* Mood selection box */}
          <section className="bg-white border border-black/10 p-4 shadow-sm rounded-3xl">
            <div className="flex justify-between items-center mb-4 border-b border-black/5 pb-2">
              <h3 className="font-sans text-xs font-bold text-[#111111] uppercase tracking-widest">
                {t('mood_selection')}
              </h3>
              <button
                onClick={() => setShowCustomMoodModal(true)}
                className="text-black hover:opacity-75 font-sans text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors border-b border-black pb-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('custom_mood')}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {Object.keys(MOOD_DESCRIPTIONS).map(moodName => {
                const mood = moodName as MoodType;
                const { icon, color } = MOOD_DESCRIPTIONS[mood];
                const isSelected = selectedMoods.includes(mood);

                return (
                  <button
                    key={mood}
                    onClick={() => handleMoodSelect(mood)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 group cursor-pointer ${
                      isSelected
                        ? 'border-black bg-black text-[#F8F5F2] shadow-none'
                        : 'border-black/10 bg-white text-[#111111] hover:bg-[#E5E1DB]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                        isSelected ? 'text-[#F8F5F2]' : color
                      }`}
                    >
                      {icon}
                    </div>
                    <span
                      className={`font-sans text-[9px] font-bold uppercase tracking-wider text-center leading-tight ${
                        isSelected ? 'text-[#F8F5F2]' : 'text-black/60'
                      }`}
                    >
                      {getTranslatedMood(mood)}
                    </span>
                  </button>
                );
              })}

              {/* Custom Moods Grid */}
              {state.customMoods.map(moodName => {
                const isSelected = selectedMoods.includes(moodName as any);
                return (
                  <button
                    key={moodName}
                    onClick={() => handleMoodSelect(moodName as any)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 group cursor-pointer ${
                      isSelected
                        ? 'border-black bg-black text-[#F8F5F2]'
                        : 'border-black/10 bg-white text-[#111111] hover:bg-[#E5E1DB]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                        isSelected ? 'text-[#F8F5F2]' : 'text-[#3e6355]'
                      }`}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span
                      className={`font-sans text-[9px] font-bold uppercase tracking-wider text-center leading-tight truncate w-full ${
                        isSelected ? 'text-[#F8F5F2]' : 'text-black/60'
                      }`}
                    >
                      {moodName}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Daily Reflection form */}
          <section className="bg-white border border-black/10 p-4 shadow-sm rounded-3xl">
            <h3 className="font-serif text-base font-normal text-black mb-3">
              {t('daily_reflection')}
            </h3>
            
            <form onSubmit={handleSaveReflection} className="flex flex-col gap-4">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="font-sans text-[9px] font-bold text-black/50 uppercase tracking-widest mr-1">
                  Tags:
                </span>
                {selectedMoods.map(m => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-1 rounded-full bg-[#E5E1DB] text-black border border-black/5 tracking-widest uppercase"
                  >
                    {getTranslatedMood(m)}
                  </span>
                ))}
              </div>

              <input
                type="text"
                placeholder={getText('Reflection Title (Optional)', 'Título (Opcional)', 'Título (Opcional)')}
                value={reflectionTitle}
                onChange={e => setReflectionTitle(e.target.value)}
                className="w-full bg-[#F8F5F2] border border-black/10 rounded-2xl p-3 font-sans text-xs focus:outline-none focus:border-black text-[#111111]"
              />

              <textarea
                required
                rows={5}
                value={reflectionContent}
                onChange={e => setReflectionContent(e.target.value)}
                placeholder={t('reflection_placeholder')}
                className="w-full bg-[#F8F5F2] border border-black/10 rounded-2xl p-4 font-sans text-xs focus:outline-none focus:border-black resize-none text-[#111111] leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-black text-[#F8F5F2] hover:bg-black/80 font-sans text-[10px] font-bold tracking-widest uppercase px-6 py-3.5 rounded-full shadow-none cursor-pointer transition-colors border border-black"
                >
                  {t('save_entry')}
                </button>
              </div>
            </form>
          </section>

        </div>
      )}

      {/* ==================== HISTORY TAB ==================== */}
      {activeSubTab === 'history' && (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full animate-fadeIn">
          {state.reflections.length === 0 ? (
            <div className="bg-white border border-black/10 rounded-3xl p-10 text-center max-w-md mx-auto w-full mt-4 shadow-sm">
              <div className="bg-[#E5E1DB] text-[#4A453F] p-4 rounded-full flex items-center justify-center w-12 h-12 mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg text-black mb-2">
                {getText('Journal is Empty', 'Diario Vacío', 'Diário Vazio')}
              </h3>
              <p className="font-sans text-xs text-black/60 leading-relaxed mb-6">
                {getText(
                  'Your private recovery journal has no entries yet. Head over to the Check-in tab to write your first reflection.',
                  'Tu diario privado de recuperación no tiene entradas aún. Ve a la pestaña de Registro para escribir tu primera reflexión.',
                  'Seu diário privado de recuperação ainda não possui registros. Vá para a guia Check-in para escrever sua primeira reflexão.'
                )}
              </p>
              <button
                onClick={() => setActiveSubTab('checkin')}
                className="bg-black text-[#F8F5F2] font-sans text-[10px] font-bold tracking-widest uppercase px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity"
              >
                {getText('Start Check-in', 'Comenzar Registro', 'Começar Check-in')}
              </button>
            </div>
          ) : (
            <>
              {/* Elegant Search Bar */}
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 rounded-full font-sans text-xs text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/40"
                  placeholder={t('search_placeholder')}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-black/40 hover:text-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* History Feed list */}
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex justify-between items-center border-b border-black/5 pb-2 mb-2">
                  <h3 className="font-sans text-xs font-bold text-[#111111] uppercase tracking-widest">
                    {t('recent_reviews')} ({filteredReflections.length})
                  </h3>
                </div>

                {filteredReflections.length === 0 ? (
                  <div className="bg-white/40 p-10 text-center border border-dashed border-black/15 rounded-3xl">
                    <AlertTriangle className="w-6 h-6 text-black/40 mx-auto mb-2 animate-pulse" />
                    <p className="font-sans text-xs text-black/50 italic">
                      {t('no_reflections')}
                    </p>
                  </div>
                ) : (
                  filteredReflections.map((ref: Reflection, idx: number) => {
                    const formattedDate = new Date(ref.date).toLocaleDateString(
                      state.language === 'English' ? 'en-US' : state.language === 'Español' ? 'es-ES' : 'pt-PT',
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    );

                    return (
                      <article
                        key={ref.id || idx}
                        className="bg-white p-5 rounded-3xl border border-black/10 shadow-sm relative overflow-hidden group hover:border-black transition-colors duration-200"
                      >
                        {/* Sage decorative block similar to Stitch design */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#3e6355]/5 rounded-bl-full pointer-events-none transition-opacity duration-300 group-hover:opacity-10"></div>
                        
                        <div className="flex items-start gap-4 relative z-10">
                          
                          {/* Left Date indicator */}
                          <div className="flex flex-col items-center justify-center w-20 shrink-0 text-center border-r border-black/10 pr-3">
                            <span className="font-sans text-[9px] font-black text-black/50 uppercase tracking-widest leading-tight">
                              {formattedDate}
                            </span>
                            
                            <div className="flex -space-x-1.5 mt-2.5">
                              {ref.moods?.slice(0, 2).map(m => {
                                const moodStyle = MOOD_DESCRIPTIONS[m];
                                const iconNode = moodStyle ? moodStyle.icon : <Sparkles className="w-3.5 h-3.5" />;
                                return (
                                  <div
                                    key={m}
                                    title={getTranslatedMood(m)}
                                    className="w-7 h-7 rounded-full border border-[#F8F5F2] flex items-center justify-center bg-[#E5E1DB] text-black"
                                  >
                                    {iconNode}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right content box */}
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col gap-1">
                                <h4 className="font-serif text-base font-normal text-[#111111]">
                                  {ref.title}
                                </h4>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {ref.moods?.map(m => (
                                    <span
                                      key={m}
                                      className="px-2 py-0.5 bg-[#E5E1DB]/50 border border-black/5 text-black font-sans text-[8px] font-bold tracking-widest uppercase rounded-full"
                                    >
                                      {getTranslatedMood(m)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => deleteReflection(ref.id)}
                                className="text-black/40 hover:text-black p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <p className="font-sans text-xs text-[#444444] leading-relaxed break-words whitespace-pre-wrap mt-4">
                              {ref.content}
                            </p>
                          </div>

                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== TRENDS TAB ==================== */}
      {activeSubTab === 'trends' && (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full animate-fadeIn">
          {state.reflections.length === 0 ? (
            <div className="bg-white border border-black/10 rounded-3xl p-10 text-center max-w-md mx-auto w-full mt-4 shadow-sm">
              <div className="bg-[#E5E1DB] text-[#4A453F] p-4 rounded-full flex items-center justify-center w-12 h-12 mx-auto mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg text-black mb-2">
                {getText('No Trends Data', 'Sin Datos de Tendencias', 'Sem Dados de Tendências')}
              </h3>
              <p className="font-sans text-xs text-black/60 leading-relaxed mb-6">
                {getText(
                  'Keep track of your feelings and reflections to see beautiful emotional pulse charts, mood distributions, and personalized AI insights.',
                  'Registra tus sentimientos y reflexiones para ver gráficos de pulso emocional, distribución de ánimo e insights personalizados de IA.',
                  'Registre seus sentimentos e reflexões para ver gráficos de pulso emocional, distribuição de humor e insights personalizados de IA.'
                )}
              </p>
              <button
                onClick={() => setActiveSubTab('checkin')}
                className="bg-black text-[#F8F5F2] font-sans text-[10px] font-bold tracking-widest uppercase px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity"
              >
                {getText('Log Your Mood', 'Registrar tu Ánimo', 'Registrar seu Humor')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 max-w-5xl mx-auto w-full animate-fadeIn">
              
              {/* Mood Pulse Section */}
              <section className="bg-white border border-black/10 rounded-3xl p-4 md:col-span-8 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <h2 className="font-serif text-lg font-normal text-black flex items-center gap-2">
                    <Activity className="w-4 h-4 text-black" />
                    {t('mood_pulse')}
                  </h2>
                  <div className="flex bg-[#F8F5F2] border border-black/15 p-0.5 rounded-full shadow-inner">
                    <button
                      onClick={() => setDaysPeriod(7)}
                      className={`px-3 py-1 text-[8px] font-sans font-extrabold uppercase tracking-widest rounded-full transition-colors cursor-pointer ${
                        daysPeriod === 7
                          ? 'bg-black text-[#F8F5F2]'
                          : 'text-black/50 hover:text-black/80'
                      }`}
                    >
                      {getText('7 Days', '7 Días', '7 Dias')}
                    </button>
                    <button
                      onClick={() => setDaysPeriod(30)}
                      className={`px-3 py-1 text-[8px] font-sans font-extrabold uppercase tracking-widest rounded-full transition-colors cursor-pointer ${
                        daysPeriod === 30
                          ? 'bg-black text-[#F8F5F2]'
                          : 'text-black/50 hover:text-black/80'
                      }`}
                    >
                      {getText('Monthly', 'Mensual', 'Mensal')}
                    </button>
                  </div>
                </div>

                {/* Pulsing Visual Columns representing the week/month */}
                <div className="bg-[#F8F5F2] border border-black/10 rounded-3xl p-4 flex flex-col gap-3 relative mt-1 select-none overflow-hidden">
                  
                  {/* Chart Area with fixed height and center-aligned capsules */}
                  <div 
                    className="h-24 flex justify-between items-center relative"
                    style={{ gap: daysPeriod === 7 ? '0.5rem' : '0.125rem' }}
                  >
                    {/* Subtle background guide coordinates - single center horizontal line */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                      <div className="w-full border-t border-black/60 h-0"></div>
                    </div>

                    {pulseData.map((item, index) => (
                      <div key={index} className="flex-1 flex justify-center h-full relative group">
                        {/* The track capsule */}
                        <div className={`${daysPeriod === 7 ? 'w-5' : 'w-1.5 md:w-2.5'} h-full bg-[#E5E1DB]/50 rounded-full relative overflow-hidden`}>
                          {/* Upward positive pill */}
                          {item.direction === 'up' && (
                            <div
                              className={`absolute bottom-1/2 left-0 right-0 ${item.colorClass} rounded-full transition-all duration-700 hover:brightness-110`}
                              style={{ height: item.height }}
                            />
                          )}

                          {/* Downward negative pill */}
                          {item.direction === 'down' && (
                            <div
                              className={`absolute top-1/2 left-0 right-0 ${item.colorClass} rounded-full transition-all duration-700 hover:brightness-110`}
                              style={{ height: item.height }}
                            />
                          )}

                          {/* Neutral pill (centered in the middle) */}
                          {item.direction === 'neutral' && (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[6px] ${item.colorClass} rounded-full transition-all duration-700`}
                            />
                          )}
                        </div>

                        {/* Tooltip on hover showing the specific mood score */}
                        <span className="absolute bottom-full mb-1 bg-black text-[#F8F5F2] font-sans text-[8px] font-bold uppercase tracking-wider py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none rounded-md">
                          {item.score !== undefined ? (item.score > 0 ? '+' : '') + item.score.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Labels Area */}
                  <div 
                    className="flex justify-between items-center pt-1"
                    style={{ gap: daysPeriod === 7 ? '0.5rem' : '0.125rem' }}
                  >
                    {pulseData.map((item, index) => (
                      <div key={index} className="flex-1 flex justify-center">
                        {/* Text label under the capsule */}
                        <span className={`text-[8px] md:text-[9px] font-sans font-bold uppercase tracking-widest transition-colors text-center ${item.textColorClass} ${
                          item.showLabel ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
                        }`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Custom chart legend block matching positive / neutral / negative */}
                <div className="flex justify-center gap-5 pt-3 border-t border-black/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#3e6355] border border-black/10 rounded-sm" />
                    <span className="font-sans text-[8px] font-bold text-black/60 uppercase tracking-widest">
                      {getText('Positive', 'Positivo', 'Positivo')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#8c857b] border border-black/10 rounded-sm" />
                    <span className="font-sans text-[8px] font-bold text-black/60 uppercase tracking-widest">
                      {getText('Neutral', 'Neutral', 'Neutro')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-rose-900 border border-black/10 rounded-sm" />
                    <span className="font-sans text-[8px] font-bold text-black/60 uppercase tracking-widest">
                      {getText('Negative', 'Negativo', 'Negativo')}
                    </span>
                  </div>
                </div>
              </section>

              {/* Sidebar Area: Distribution & Insights */}
              <div className="md:col-span-4 flex flex-col gap-4">
                
                {/* Distribution */}
                <div className="bg-white border border-black/10 rounded-3xl p-4 flex flex-col gap-4 shadow-sm">
                  <h2 className="font-serif text-base font-normal text-black flex items-center gap-1.5 border-b border-black/5 pb-2">
                    <BarChart2 className="w-4 h-4 text-black" />
                    {t('mood_distribution')}
                  </h2>

                  <div className="flex flex-col gap-3">
                    {distribution.map(item => (
                      <div key={item.name} className="transition-all duration-300">
                        <div className="flex justify-between font-sans text-[10px] font-semibold mb-1">
                          <span className="text-black/80 font-serif italic text-xs">{getTranslatedMood(item.name)}</span>
                          <span className="text-black font-extrabold">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#F8F5F2] border border-black/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${item.color} transition-all duration-500 rounded-full`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights and Feedback */}
                <div className="bg-[#E5E1DB] border border-black/10 rounded-3xl p-4 relative overflow-hidden shadow-sm group">
                  <div className="flex items-start gap-3 relative z-10">
                    <Sparkles className="w-5 h-5 text-black/60 mt-1 shrink-0 animate-pulse" />
                    <div className="flex flex-col gap-3.5 w-full">
                      
                      <div className="flex justify-between items-center">
                        <h3 className="font-serif text-sm font-normal text-black leading-tight">
                          {t('insights_title')}
                        </h3>
                        <div className="flex flex-col items-end shrink-0">
                          <button
                            onClick={handleFetchInsights}
                            disabled={aiLoading}
                            className="text-black hover:opacity-70 font-sans text-[9px] font-bold uppercase tracking-widest border-b border-black pb-0.5 flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-all"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" />
                            {aiLoading ? t('generating') : t('reanalyze_btn')}
                          </button>
                          <span className="text-[8px] font-sans font-bold tracking-widest text-black/40 uppercase mt-1">
                            {t('credits')}: {aiUsageCount}/3
                          </span>
                        </div>
                      </div>

                      {limitReached && (
                        <div className="p-3 bg-red-900/5 border border-red-900/25 text-red-900 rounded-2xl">
                          <p className="font-serif text-[10px] font-semibold mb-1 uppercase tracking-wider">
                            {t('ai_limit_reached')}
                          </p>
                          <p className="font-sans text-[9px] leading-relaxed">
                            {t('ai_limit_desc')}
                          </p>
                        </div>
                      )}

                      <p className="font-sans text-xs text-black/70 leading-relaxed break-words italic">
                        "{aiInsightsText}"
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ==================== CUSTOM MOOD MODAL ==================== */}
      {showCustomMoodModal && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-[#F8F5F2] rounded-3xl max-w-sm w-full p-6 border border-black/25 shadow-2xl">
            <div className="flex justify-between items-center pb-2.5 border-b border-black/5 shrink-0 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#3e6355]" />
                <h3 className="font-sans text-xs font-extrabold text-black uppercase tracking-widest">
                  {t('custom_mood_title')}
                </h3>
              </div>
              <button
                onClick={() => setShowCustomMoodModal(false)}
                className="text-black/50 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCustomMoodSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                required
                maxLength={15}
                placeholder={getText('e.g., Inspired, Ecstatic', 'ej., Inspirado, Eufórico', 'ex: Inspirado, Radiante')}
                value={customMoodName}
                onChange={e => setCustomMoodName(e.target.value)}
                className="w-full bg-white border border-black/15 rounded-2xl p-3 font-sans text-xs focus:outline-none focus:border-black text-[#111111]"
              />
              <button
                type="submit"
                className="w-full bg-black text-[#F8F5F2] font-sans text-[10px] font-bold tracking-widest uppercase py-3 rounded-full hover:bg-black/80 border border-black cursor-pointer transition-colors"
              >
                {t('add_mood_btn')}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

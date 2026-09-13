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
  X,
  HeartHandshake,
  Feather,
  CheckCircle2,
  Users,
  Shield,
  Moon,
  Sun,
  LifeBuoy,
  Copy,
  Check
} from 'lucide-react';

interface PromptItem {
  id: string;
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  questions: string[];
}

interface PrayerItem {
  id: string;
  title: string;
  sub: string;
  fellowships: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

export const MeditationView: React.FC = () => {
  const { state, getTranslation, addReflection, recordDailyActivity } = useSanctuary();

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
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [promptReflectionText, setPromptReflectionText] = useState('');

  // Universal Prayers state
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerItem | null>(null);
  const [copiedPrayer, setCopiedPrayer] = useState(false);
  const [savedPrayerToast, setSavedPrayerToast] = useState(false);

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
            recordDailyActivity('meditation', true);
            // Automatically log a quiet calm reflection of meditation
            addReflection(
              getText('Silent Meditation Complete', 'Meditación silenciosa completada', 'Meditação silenciosa completada'),
              getText(
                `Completed a peaceful ${selectedMedDuration}-minute silent meditation. Allowed thoughts to pass like clouds and returned with a grounded spirit.`,
                `Completé una serena meditación silenciosa de ${selectedMedDuration} minutos. Dejé pasar los pensamientos y regresé con la mente en calma.`,
                `Completei uma serena meditação silenciosa de ${selectedMedDuration} minutos. Deixei os pensamentos passarem e retornei com a mente tranquila.`
              ),
              ['Calm', 'Peaceful']
            );
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
    recordDailyActivity('meditation', true);
    addReflection(selectedPrompt.title, promptReflectionText.trim(), ['Peaceful', 'Grateful']);
    setPromptReflectionText('');
    setSelectedPrompt(null);
  };

  const handleCopyPrayer = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedPrayer(true);
    setTimeout(() => setCopiedPrayer(false), 2000);
  };

  const handleSavePrayerReflection = (prayer: PrayerItem) => {
    recordDailyActivity('meditation', true);
    addReflection(
      getText(`${prayer.title} Prayer`, `Oración: ${prayer.title}`, `Oração: ${prayer.title}`),
      getText(
        `Recited and meditated on the ${prayer.title}:\n\n"${prayer.text}"`,
        `Recité y medité sobre la ${prayer.title}:\n\n"${prayer.text}"`,
        `Recitei e meditei sobre a ${prayer.title}:\n\n"${prayer.text}"`
      ),
      ['Peaceful', 'Grateful']
    );
    setSavedPrayerToast(true);
    setTimeout(() => {
      setSavedPrayerToast(false);
      setSelectedPrayer(null);
    }, 1200);
  };

  // 6 Guided Prompts acceptable across recovery brotherhoods
  const prompts: PromptItem[] = [
    {
      id: 'gratitude',
      title: getText('Gratitude & Blessings', 'Gratitud y Bendiciones', 'Gratidão e Bênçãos'),
      content: getText(
        'Center your thoughts and intentions with a gentle focus on what you have right now.',
        'Centra tus pensamientos e intenciones enfocándote con serenidad en lo que tienes hoy.',
        'Centre seus pensamentos e intenções com foco sereno no que você tem hoje.'
      ),
      icon: HeartHandshake,
      questions: [
        getText(
          'What are three simple blessings you can see, feel, or experience right now that you are grateful for?',
          '¿Cuáles son tres bendiciones sencillas que puedes ver, sentir o experimentar ahora por las que estés agradecido?',
          'Quais são três bênçãos simples que você pode ver, sentir ou vivenciar agora pelas quais sente gratidão?'
        ),
        getText(
          'How does recognizing these gifts immediately soften fear, entitlement, or anxiety?',
          '¿Cómo calma tus temores o ansiedad el reconocer estos dones hoy?',
          'Como reconhecer essas bênçãos alivia seus temores ou ansiedade hoje?'
        )
      ]
    },
    {
      id: 'acceptance',
      title: getText('Acceptance & Surrender', 'Aceptación y Rendición', 'Aceitação e Rendição'),
      content: getText(
        'Rest in willing acceptance rather than willful resistance to people, places, and events.',
        'Descansa en la aceptación sincera en vez de luchar contra personas, lugares y circunstancias.',
        'Descanse na aceitação sincera em vez de lutar contra pessoas, lugares e circunstâncias.'
      ),
      icon: Feather,
      questions: [
        getText(
          'What specific situation or person are you currently trying to control, change, or micromanage?',
          '¿Qué situación o persona estás intentando controlar, cambiar o forzar en este momento?',
          'Que situação ou pessoa você está tentando controlar, mudar ou forçar neste momento?'
        ),
        getText(
          'What relief enters your body and spirit when you exhale and hand that outcome over?',
          '¿Qué sensación de alivio sientes al exhalar y soltar ese resultado?',
          'Qual sensação de alívio você sente ao expirar e entregar esse resultado?'
        )
      ]
    },
    {
      id: 'inventory',
      title: getText('Daily Inventory & Pause', 'Inventario Diario y Pausa', 'Inventário Diário e Pausa'),
      content: getText(
        'A gentle pulse-check on honesty, fear, resentment, and character growth throughout the day.',
        'Un chequeo sereno sobre honestidad, miedos, resentimientos y crecimiento personal durante el día.',
        'Um exame sereno sobre honestidade, medos, ressentimentos e crescimento durante o dia.'
      ),
      icon: CheckCircle2,
      questions: [
        getText(
          'Was I resentful, fearful, or dishonest today, and is a prompt amends or pause needed?',
          '¿Fui intolerante, temeroso o deshonesto hoy, y necesito pedir disculpas o hacer una pausa?',
          'Fui intolerante, receoso ou desonesto hoje, e preciso de uma reparação ou pausa?'
        ),
        getText(
          'What healthy choice did I make today that honored my authentic recovery and values?',
          '¿Qué decisión sana tomé hoy que honró mi recuperación auténtica y mis valores?',
          'Que decisão saudável tomei hoje honrando minha recuperação autêntica e meus valores?'
        )
      ]
    },
    {
      id: 'fellowship',
      title: getText('Fellowship & Service', 'Compañerismo y Servicio', 'Irmandade e Serviço'),
      content: getText(
        'Moving out of self-centered isolation by turning attention toward helping another fellow.',
        'Salir del aislamiento egocéntrico dirigiendo la atención hacia ayudar a otro compañero.',
        'Saindo do isolamento egocêntrico voltando a atenção para ajudar outro companheiro.'
      ),
      icon: Users,
      questions: [
        getText(
          'Who in your recovery circle, family, or community could use an encouraging word or phone call?',
          '¿A quién en tu grupo, familia o comunidad le vendría bien unas palabras de aliento o una llamada?',
          'Quem no seu grupo, família ou comunidade se beneficiaria de uma palavra de apoio ou uma ligação?'
        ),
        getText(
          'How does being of service liberate you from obsessive self-centered thoughts?',
          '¿Cómo te libera servir a los demás de tus pensamientos obsesivos sobre ti mismo?',
          'Como servir ao próximo liberta você dos seus pensamentos obsessivos sobre si mesmo?'
        )
      ]
    },
    {
      id: 'courage',
      title: getText('Courage & Honesty', 'Valor y Honestidad', 'Coragem e Honestidade'),
      content: getText(
        'Facing fear with truth and taking the next right small action one day at a time.',
        'Enfrentar el miedo con sinceridad y dar el siguiente paso correcto, un día a la vez.',
        'Enfrentar o medo com sinceridade e dar o próximo passo certo, um dia de cada vez.'
      ),
      icon: Shield,
      questions: [
        getText(
          'What uncomfortable truth or conversation have you felt hesitant to admit or share?',
          '¿Qué verdad incómoda o conversación has tenido dudas o temor de admitir o compartir?',
          'Que verdade incômoda ou conversa você tem hesitado em admitir ou compartilhar?'
        ),
        getText(
          'What is one small, courageous action you can take right now to honor your recovery truth?',
          '¿Cuál es un pequeño acto de valor que puedes hacer ahora para honrar tu verdad en recuperación?',
          'Qual pequena atitude de coragem você pode tomar agora para honrar sua verdade na recuperação?'
        )
      ]
    },
    {
      id: 'release',
      title: getText('Release & Evening Peace', 'Liberación y Paz Nocturna', 'Libertação e Paz Noturna'),
      content: getText(
        'Putting down the day’s weight, releasing guilt, and resting in serene stillness.',
        'Soltar las cargas del día, liberar la culpa y descansar en serena tranquilidad.',
        'Deixar de lado os pesos do dia, libertar a culpa e descansar em serena tranquilidade.'
      ),
      icon: Moon,
      questions: [
        getText(
          'What thought, interaction, or burden will you intentionally lay down tonight?',
          '¿Qué pensamiento, interacción o carga vas a soltar conscientemente esta noche?',
          'Que pensamento, interação ou peso você vai deixar de lado esta noite?'
        ),
        getText(
          'Can you breathe in peace, exhale tension, and thank yourself for another clean 24 hours?',
          '¿Puedes inhalar paz, exhalar tensión y agradecerte por otras 24 horas limpias y sobrias?',
          'Você consegue inspirar paz, expirar a tensão e agradecer por mais 24 horas limpas e sóbrias?'
        )
      ]
    }
  ];

  // 6 Universal Prayers acceptable to all brotherhoods (AA, NA, Al-Anon, CoDA, OA, GA, SLAA, etc.)
  const prayers: PrayerItem[] = [
    {
      id: 'serenity',
      title: getText('Serenity Prayer', 'Oración de la Serenidad', 'Oração da Serenidade'),
      sub: getText('Acceptance, courage, and wisdom', 'Aceptación, valor y sabiduría', 'Aceitação, coragem e sabedoria'),
      fellowships: getText('Universal across all 12-Step fellowships', 'Universal en todas las hermandades de 12 Pasos', 'Universal em todas as irmandades de 12 Passos'),
      icon: Sparkles,
      text: getText(
        'God (or Higher Power), grant me the serenity to accept the things I cannot change, the courage to change the things I can, and the wisdom to know the difference.',
        'Dios (o Poder Superior), concédeme la serenidad para aceptar las cosas que no puedo cambiar, valor para cambiar las que puedo, y sabiduría para reconocer la diferencia.',
        'Concedei-me, Senhor (ou Poder Superior), a serenidade necessária para aceitar as coisas que não posso modificar, coragem para modificar aquelas que posso, e sabedoria para distinguir umas das outras.'
      )
    },
    {
      id: 'third_step',
      title: getText('Third Step Surrender', 'Tercer Paso de Rendición', 'Terceiro Passo de Rendição'),
      sub: getText('Relief from the bondage of self', 'Liberación de las ataduras del ego', 'Libertação da escravidão do ego'),
      fellowships: getText('Step 3 prayer of willingness', 'Oración del Paso 3 de buena voluntad', 'Oração do Passo 3 de boa vontade'),
      icon: HeartHandshake,
      text: getText(
        'God (or Higher Power), I offer myself to Thee — to build with me and to do with me as Thou wilt. Relieve me of the bondage of self, that I may better do Thy will. Take away my difficulties, that victory over them may bear witness to those I would help of Thy Power, Thy Love, and Thy Way of life. May I do Thy will always.',
        'Dios (o Poder Superior), me ofrezco a Ti para que obres en mí y hagas conmigo Tu voluntad. Líbrame de mi propio encadenamiento, para que pueda cumplir mejor con Tu voluntad. Líbrame de mis dificultades, y que la victoria sobre ellas sea el testimonio para aquellos a quienes ayude de Tu poder, Tu amor y Tu forma de vida. Que siempre haga Tu voluntad.',
        'Deus (ou Poder Superior), ofereço-me a Ti, para que trabalhes em mim e faças comigo o que desejares. Liberta-me da escravidão do ego, para que eu possa realizar melhor a Tua vontade. Remove as minhas dificuldades, para que a vitória sobre elas possa dar testemunho, diante daqueles a quem ajudarei, de Teu Poder, de Teu Amor e de Teu Modo de Vida. Que eu faça sempre a Tua vontade.'
      )
    },
    {
      id: 'seventh_step',
      title: getText('Seventh Step Humility', 'Séptimo Paso de Humildad', 'Sétimo Passo de Humildade'),
      sub: getText('Removal of character defects', 'Eliminación de defectos de carácter', 'Remoção dos defeitos de caráter'),
      fellowships: getText('Step 7 prayer of humble transformation', 'Oración del Paso 7 de humilde transformación', 'Oração do Passo 7 de humilde transformação'),
      icon: Feather,
      text: getText(
        'My Creator, I am now willing that you should have all of me, good and bad. I pray that you now remove from me every single defect of character which stands in the way of my usefulness to you and my fellows. Grant me strength, as I go out from here, to do your bidding. Amen.',
        'Creador mío, estoy dispuesto a que tomes todo lo que soy, bueno y malo. Te ruego que elimines de mí cada uno de los defectos de carácter que me obstaculizan en el camino para que logre ser útil a Ti y a mis semejantes. Dame la fortaleza para que, al salir de aquí, cumpla con Tu voluntad. Amén.',
        'Meu Criador, agora estou pronto para que tenhas tudo de mim, o bom e o mau. Rogo-Te que removas de mim cada defeito de caráter que esteja no caminho da minha utilidade para Ti e para meus semelhantes. Concede-me forças para que, ao sair daqui, eu faça a Tua vontade. Amém.'
      )
    },
    {
      id: 'instrument_peace',
      title: getText('Instrument of Peace', 'Instrumento de Paz', 'Instrumento de Paz'),
      sub: getText('Unconditional love and understanding', 'Amor incondicional y comprensión', 'Amor incondicional e compreensão'),
      fellowships: getText('Step 11 St. Francis meditation', 'Oración de San Francisco para el Paso 11', 'Oração de São Francisco para o Passo 11'),
      icon: Sun,
      text: getText(
        'Lord, make me an instrument of your peace: where there is hatred, let me sow love; where there is injury, pardon; where there is doubt, faith; where there is despair, hope; where there is darkness, light; where there is sadness, joy. Grant that I may not so much seek to be consoled as to console; to be understood as to understand; to be loved as to love.',
        'Señor, hazme un instrumento de tu paz: donde haya odio, siembre yo amor; donde haya ofensa, perdón; donde haya discordia, unión; donde haya duda, fe; donde haya desesperación, esperanza; donde haya tinieblas, luz; donde haya tristeza, alegría. Concédeme que no busque tanto ser consolado como consolar; ser comprendido como comprender; ser amado como amar.',
        'Senhor, fazei-me um instrumento de vossa paz: onde houver ódio, que eu leve o amor; onde houver ofensa, que eu leve o perdão; onde houver discórdia, que eu leve a união; onde houver dúvida, que eu leve a fé; onde houver desespero, que eu leve a esperança; onde houver trevas, que eu leve a luz; onde houver tristeza, que eu leve a alegria. Fazei que eu procure mais consolar que ser consolado; compreender que ser compreendido; amar que ser amado.'
      )
    },
    {
      id: 'set_aside',
      title: getText('Set-Aside Prayer', 'Oración de Dejar a un Lado', 'Oração do Desapego'),
      sub: getText('Open mind and a fresh spiritual awakening', 'Mente abierta y despertar espiritual', 'Mente aberta e despertar espiritual'),
      fellowships: getText('Shared across workshops and sponsorship', 'Compartida en talleres y padrinazgo', 'Compartilhada em oficinas e apadrinhamento'),
      icon: BookOpen,
      text: getText(
        'Higher Power, please set aside everything that I think I know about myself, my disease, the 12 Steps, and You; that I may have an open mind and a completely new experience of all these things, and find truth and healing.',
        'Poder Superior, por favor haz a un lado todo lo que creo saber sobre mí mismo, mi enfermedad, los 12 Pasos y sobre Ti; para que pueda tener una mente abierta y una experiencia completamente nueva de todas estas cosas, y encontrar la verdad y la recuperación.',
        'Poder Superior, por favor afasta tudo o que penso saber sobre mim mesmo, minha doença, os 12 Passos e sobre Ti; para que eu possa ter a mente aberta e uma experiência completamente nova de todas essas coisas, encontrando a verdade e a recuperação.'
      )
    },
    {
      id: 'responsibility',
      title: getText('Fellowship Responsibility', 'Declaración de Responsabilidad', 'Declaração de Responsabilidade'),
      sub: getText('Reaching out the hand of recovery', 'Extender la mano de la recuperación', 'Estender a mão da recuperação'),
      fellowships: getText('Universal Declaration of mutual support', 'Declaración universal de apoyo mutuo', 'Declaração universal de apoio mútuo'),
      icon: LifeBuoy,
      text: getText(
        'I am responsible. When anyone, anywhere, reaches out for help, I want the hand of recovery always to be there. And for that: I am responsible. May we walk together in honesty, humility, and loving fellowship, one day at a time.',
        'Yo soy responsable... Cuando cualquiera, dondequiera, extienda su mano pidiendo ayuda, quiero que la mano de la recuperación esté siempre allí. Y por esto: yo soy responsable. Que caminemos juntos con honestidad, humildad y fraternidad, un día a la vez.',
        'Eu sou responsável... Quando qualquer um, seja onde for, estender a mão pedindo ajuda, quero que a mão da recuperação esteja sempre ali. E por isto: eu sou responsável. Que caminhemos juntos com honestidade, humildade e fraternidade, um dia de cada vez.'
      )
    }
  ];

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
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

      {/* Guided Prompts Collection (2 per row grid) */}
      <section className="w-full mt-2">
        <div className="flex items-center justify-between border-b border-black/5 pb-2 mb-3">
          <div>
            <h3 className="font-serif text-lg sm:text-xl text-black font-normal">
              {getTranslation('guided_prompts')}
            </h3>
            <p className="font-sans text-[11px] text-black/55">
              {getText(
                'Reflective journaling and mindful inquiries for recovery.',
                'Preguntas reflexivas y escritura consciente para la recuperación.',
                'Perguntas reflexivas e escrita consciente para a recuperação.'
              )}
            </p>
          </div>
        </div>

        {/* 2-per-row grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {prompts.map((p) => {
            const PromptIcon = p.icon;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPrompt(p)}
                className="rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer shadow-none flex flex-col justify-between gap-2.5 group bg-white border-black/10 hover:border-black/30"
              >
                {/* Title in-line with the small unique icon, even if title wraps into 2 rows */}
                <div className="flex items-start gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center text-black shrink-0 mt-0.5 transition-colors bg-[#E5E1DB]/80 group-hover:bg-[#E5E1DB]">
                    <PromptIcon className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <h4 className="font-serif text-xs sm:text-sm font-semibold text-[#111111] leading-snug break-words">
                    {p.title}
                  </h4>
                </div>

                <p className="font-sans text-[11px] text-black/60 leading-relaxed line-clamp-2">
                  {p.content}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Universal Prayers Collection (2 per row grid) */}
      <section className="w-full mt-2">
        <div className="flex items-center justify-between border-b border-black/5 pb-2 mb-3">
          <div>
            <h3 className="font-serif text-lg sm:text-xl text-black font-normal">
              {getText('Universal Prayers', 'Oraciones Universales', 'Orações Universais')}
            </h3>
            <p className="font-sans text-[11px] text-black/55">
              {getText(
                'Spiritual foundations shared across recovery fellowships and brotherhoods.',
                'Bases espirituales compartidas entre las distintas hermandades de recuperación.',
                'Fundamentos espirituais compartilhados entre as diversas irmandades de recuperação.'
              )}
            </p>
          </div>
        </div>

        {/* 2-per-row grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {prayers.map((prayer, idx) => {
            const PrayerIcon = prayer.icon;
            const isBottomTile = prayer.id === 'set_aside' || prayer.id === 'responsibility' || idx >= prayers.length - 2;
            return (
              <div
                key={prayer.id}
                onClick={() => {
                  setSelectedPrayer(prayer);
                  setCopiedPrayer(false);
                  setSavedPrayerToast(false);
                }}
                className={`rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer shadow-none flex flex-col justify-between gap-2.5 group ${
                  isBottomTile
                    ? 'border-black/10 bg-white/40 hover:bg-black/5'
                    : 'bg-white border-black/10 hover:border-black/30'
                }`}
              >
                {/* Title in-line with the small unique icon, even if title wraps into 2 rows */}
                <div className="flex items-start gap-2 sm:gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center text-black shrink-0 mt-0.5 transition-colors ${
                      isBottomTile ? 'bg-[#E5E1DB]/60' : 'bg-[#E5E1DB]/80 group-hover:bg-[#E5E1DB]'
                    }`}
                  >
                    <PrayerIcon className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <h4 className="font-serif text-xs sm:text-sm font-semibold text-[#111111] leading-snug break-words">
                    {prayer.title}
                  </h4>
                </div>

                <p className="font-sans text-[11px] text-black/60 leading-relaxed line-clamp-2">
                  {prayer.sub}
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

            <div className="flex flex-col gap-3 mb-4">
              <span className="font-sans text-[10px] font-bold text-[#3e6355] uppercase tracking-widest">
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

      {/* Universal Prayers Detail Modal */}
      {selectedPrayer && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 md:p-10 overflow-y-auto z-[100] pt-10 md:pt-20">
          <div className="bg-[#F8F5F2] rounded-3xl max-w-lg w-full p-6 border border-black/25 shadow-2xl animate-fadeIn my-auto sm:my-0">
            <div className="flex justify-between items-center pb-2.5 border-b border-black/5 shrink-0 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#E5E1DB] border border-black/10 flex items-center justify-center text-black shrink-0">
                  <selectedPrayer.icon className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans text-xs font-extrabold text-black uppercase tracking-widest truncate">
                    {selectedPrayer.title}
                  </h3>
                  <span className="font-sans text-[10px] text-black/50 block truncate">
                    {selectedPrayer.fellowships}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrayer(null)}
                className="text-black/50 hover:text-black cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prayer Text */}
            <div className="bg-[#E5E1DB] border border-black/10 p-5 rounded-2xl mb-4 relative">
              <blockquote className="font-serif text-sm sm:text-base leading-relaxed text-[#111111] italic text-center">
                "{selectedPrayer.text}"
              </blockquote>
            </div>

            {/* Subtle spiritual principle */}
            <p className="font-sans text-xs text-black/60 text-center mb-5 italic">
              {selectedPrayer.sub}
            </p>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-black/5">
              <button
                type="button"
                onClick={() => handleCopyPrayer(selectedPrayer.text)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-black/15 bg-white hover:bg-black/5 font-sans text-[10px] font-bold uppercase tracking-widest text-black/80 transition-colors cursor-pointer"
              >
                {copiedPrayer ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                    <span className="text-emerald-800">{getText('Copied!', '¡Copiado!', 'Copiado!')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{getText('Copy Prayer', 'Copiar Oración', 'Copiar Oração')}</span>
                  </>
                )}
              </button>

              <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPrayer(null)}
                  className="px-4 py-2 rounded-full border border-black/15 bg-white hover:bg-black/5 font-sans text-[10px] font-bold uppercase tracking-widest text-black/70 cursor-pointer"
                >
                  {getText('Close', 'Cerrar', 'Fechar')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePrayerReflection(selectedPrayer)}
                  className="px-5 py-2 rounded-full bg-black text-[#F8F5F2] hover:bg-black/80 font-sans text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer border border-black shadow-none flex items-center justify-center gap-1.5"
                >
                  {savedPrayerToast ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{getText('Saved to Log!', '¡Guardado!', 'Salvo!')}</span>
                    </>
                  ) : (
                    <span>{getText('Reflect & Save', 'Meditar y Guardar', 'Meditar e Salvar')}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

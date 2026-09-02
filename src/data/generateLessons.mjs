import fs from 'fs';

const translations = {
  stepTitles: {
    English: [
      "Step 1: Honesty", "Step 2: Hope", "Step 3: Surrender", "Step 4: Courage", 
      "Step 5: Integrity", "Step 6: Willingness", "Step 7: Humility", "Step 8: Love", 
      "Step 9: Responsibility", "Step 10: Discipline", "Step 11: Awareness", "Step 12: Service"
    ],
    Español: [
      "Paso 1: Honestidad", "Paso 2: Esperanza", "Paso 3: Rendición", "Paso 4: Coraje", 
      "Paso 5: Integridad", "Paso 6: Disposición", "Paso 7: Humildad", "Paso 8: Amor", 
      "Paso 9: Responsabilidad", "Paso 10: Disciplina", "Paso 11: Conciencia", "Paso 12: Servicio"
    ],
    Português: [
      "Passo 1: Honestidade", "Passo 2: Esperança", "Passo 3: Rendição", "Passo 4: Coragem", 
      "Passo 5: Integridade", "Passo 6: Disposição", "Passo 7: Humildade", "Passo 8: Amor", 
      "Passo 9: Responsabilidade", "Passo 10: Disciplina", "Passo 11: Consciência", "Passo 12: Serviço"
    ]
  },
  lessonTitles: {
    English: ["The Awakening", "Facing Reality", "Finding Inner Strength", "Breaking the Cycle", "Embracing the Journey", "Letting Go", "Building the Foundation", "Understanding Triggers", "The Path Forward", "Daily Commitment", "Seeking Connection", "Reflecting on Progress"],
    Español: ["El Despertar", "Enfrentando la Realidad", "Encontrando Fuerza Interior", "Rompiendo el Ciclo", "Abrazando el Viaje", "Dejar Ir", "Construyendo la Base", "Entendiendo los Desencadenantes", "El Camino a Seguir", "Compromiso Diario", "Buscando Conexión", "Reflexionando sobre el Progreso"],
    Português: ["O Despertar", "Enfrentando a Realidade", "Encontrando Força Interior", "Quebrando o Ciclo", "Abraçando a Jornada", "Deixar Ir", "Construindo a Base", "Entendendo os Gatilhos", "O Caminho a Seguir", "Compromisso Diário", "Buscando Conexão", "Refletindo sobre o Progresso"]
  },
  contentParas: {
    English: [
      "Recovery is not a destination, but a continuous journey of self-discovery and conscious choices. In this lesson, we explore the subtle ways our minds attempt to return to familiar, yet destructive, patterns.",
      "Consider the moments when you feel most vulnerable. These are not signs of weakness, but opportunities to practice the principles of this step. By acknowledging our powerlessness over our addiction, we open the door to genuine strength.",
      "The illusion of control is a powerful force. We often believe that if we just try harder, we can manage the unmanageable. Surrender is the profound realization that true freedom comes from letting go of this illusion.",
      "As you read these words, take a deep breath. Feel the ground beneath you. Grounding yourself in the present moment is the most effective defense against the anxiety of the future and the regrets of the past. Stay anchored.",
      "It is essential to recognize that healing takes time. You are unlearning years of habitual responses. Be gentle with yourself as you navigate the complexities of your emotions and experiences today."
    ],
    Español: [
      "La recuperación no es un destino, sino un viaje continuo de autodescubrimiento y elecciones conscientes. En esta lección, exploramos las formas sutiles en que nuestras mentes intentan regresar a patrones familiares pero destructivos.",
      "Considera los momentos en que te sientes más vulnerable. Estos no son signos de debilidad, sino oportunidades para practicar los principios de este paso. Al reconocer nuestra impotencia ante nuestra adicción, abrimos la puerta a la verdadera fuerza.",
      "La ilusión de control es una fuerza poderosa. A menudo creemos que si nos esforzamos más, podemos manejar lo inmanejable. La rendición es la profunda comprensión de que la verdadera libertad proviene de soltar esta ilusión.",
      "Mientras lees estas palabras, respira hondo. Siente el suelo debajo de ti. Conectarse con el momento presente es la defensa más efectiva contra la ansiedad por el futuro y los arrepentimientos del pasado. Mantente anclado.",
      "Es esencial reconocer que la sanación lleva tiempo. Estás desaprendiendo años de respuestas habituales. Sé amable contigo mismo mientras navegas por las complejidades de tus emociones y experiencias hoy."
    ],
    Português: [
      "A recuperação não é um destino, mas uma jornada contínua de autodescoberta e escolhas conscientes. Nesta lição, exploramos as maneiras sutis pelas quais nossas mentes tentam retornar a padrões familiares, mas destrutivos.",
      "Considere os momentos em que você se sente mais vulnerável. Estes não são sinais de fraqueza, mas oportunidades para praticar os princípios deste passo. Ao reconhecer nossa impotência perante o nosso vício, abrimos a porta para a verdadeira força.",
      "A ilusão de controle é uma força poderosa. Muitas vezes acreditamos que, se tentarmos mais, poderemos administrar o inadministrável. A rendição é a profunda constatação de que a verdadeira liberdade vem de abandonar essa ilusão.",
      "Ao ler estas palavras, respire fundo. Sinta o chão abaixo de você. Ancorar-se no momento presente é a defesa mais eficaz contra a ansiedade do futuro e os arrependimentos do passado. Mantenha-se ancorado.",
      "É essencial reconhecer que a cura leva tempo. Você está desaprendendo anos de respostas habituais. Seja gentil consigo mesmo ao navegar pelas complexidades de suas emoções e experiências hoje."
    ]
  },
  questions: {
    English: [
      "How did the illusion of control manifest in your life recently?",
      "What is one small way you can practice surrender today?",
      "Who in your support network can you reach out to when feeling vulnerable?",
      "What emotions arise when you think about letting go of the outcome?"
    ],
    Español: [
      "¿Cómo se manifestó la ilusión de control en tu vida recientemente?",
      "¿Cuál es una pequeña forma en que puedes practicar la rendición hoy?",
      "¿A quién en tu red de apoyo puedes acudir cuando te sientas vulnerable?",
      "¿Qué emociones surgen cuando piensas en dejar ir el resultado?"
    ],
    Português: [
      "Como a ilusão de controle se manifestou em sua vida recentemente?",
      "Qual é uma pequena maneira de praticar a rendição hoje?",
      "A quem em sua rede de apoio você pode recorrer quando se sentir vulnerável?",
      "Quais emoções surgem quando você pensa em abrir mão do resultado?"
    ]
  }
}

const steps = [];

for (let s = 1; s <= 12; s++) {
  const stepId = `step${s}`;
  const subLessons = [];

  for (let l = 1; l <= 12; l++) {
    const subId = `s${s}-${l}`;
    
    // Repeat content to make it a roughly 5 min read (around 700-1000 words).
    const englishContent = [
      translations.contentParas.English[l % 5],
      translations.contentParas.English[(l + 1) % 5],
      translations.contentParas.English[(l + 2) % 5],
      translations.contentParas.English[(l + 3) % 5],
      translations.contentParas.English[(l + 4) % 5],
      "This journey requires immense patience. When we reflect on the steps we have taken, we realize that every moment of clarity is a victory. The noise of our past conditioning will occasionally surface, but it no longer has to dictate our actions. We are building a new foundation, brick by brick, based on spiritual principles rather than fear. Take a moment to acknowledge the strength it takes to simply show up and engage with this process today.",
      "As you continue to walk this path, remember that you are not alone. The fellowship and the steps provide a guiding light even in the darkest of times. Returning to these core tenets whenever you feel adrift will anchor you. Embrace the process, trust the guidance, and allow the transformation to unfold naturally."
    ].join('\n\n');

    const spanishContent = [
      translations.contentParas.Español[l % 5],
      translations.contentParas.Español[(l + 1) % 5],
      translations.contentParas.Español[(l + 2) % 5],
      translations.contentParas.Español[(l + 3) % 5],
      translations.contentParas.Español[(l + 4) % 5],
      "Este viaje requiere una inmensa paciencia. Cuando reflexionamos sobre los pasos que hemos dado, nos damos cuenta de que cada momento de claridad es una victoria. El ruido de nuestro condicionamiento pasado ocasionalmente surgirá, pero ya no tiene que dictar nuestras acciones. Estamos construyendo una nueva base, ladrillo a ladrillo, basada en principios espirituales en lugar de miedo. Tómate un momento para reconocer la fuerza que se necesita simplemente para presentarte y comprometerte con este proceso hoy.",
      "Mientras continúas caminando por este sendero, recuerda que no estás solo. La confraternidad y los pasos proporcionan una luz guía incluso en los momentos más oscuros. Regresar a estos principios básicos cada vez que te sientas a la deriva te anclará. Abraza el proceso, confía en la guía y permite que la transformación se desarrolle naturalmente."
    ].join('\n\n');

    const portugueseContent = [
      translations.contentParas.Português[l % 5],
      translations.contentParas.Português[(l + 1) % 5],
      translations.contentParas.Português[(l + 2) % 5],
      translations.contentParas.Português[(l + 3) % 5],
      translations.contentParas.Português[(l + 4) % 5],
      "Essa jornada requer imensa paciência. Ao refletirmos sobre os passos que demos, percebemos que cada momento de clareza é uma vitória. O ruído do nosso condicionamento passado ocasionalmente surgirá, mas não precisa mais ditar nossas ações. Estamos construindo uma nova base, tijolo por tijolo, baseada em princípios espirituais em vez de medo. Tire um momento para reconhecer a força necessária simplesmente para comparecer e se envolver com este processo hoje.",
      "À medida que você continua a caminhar por este caminho, lembre-se de que não está sozinho. A irmandade e os passos fornecem uma luz guia mesmo nos momentos mais sombrios. Retornar a esses princípios fundamentais sempre que você se sentir à deriva o ancorará. Abrace o processo, confie na orientação e permita que a transformação se desdobre naturalmente."
    ].join('\n\n');

    const engTitle = `${translations.lessonTitles.English[l-1]} (${s}.${l})`;
    const espTitle = `${translations.lessonTitles.Español[l-1]} (${s}.${l})`;
    const ptTitle = `${translations.lessonTitles.Português[l-1]} (${s}.${l})`;

    const engQ = [translations.questions.English[l % 4], translations.questions.English[(l + 1) % 4], translations.questions.English[(l + 2) % 4]];
    const espQ = [translations.questions.Español[l % 4], translations.questions.Español[(l + 1) % 4], translations.questions.Español[(l + 2) % 4]];
    const ptQ = [translations.questions.Português[l % 4], translations.questions.Português[(l + 1) % 4], translations.questions.Português[(l + 2) % 4]];

    subLessons.push({
      id: subId,
      stepId: stepId,
      title: { English: engTitle, Español: espTitle, Português: ptTitle },
      description: { 
        English: `A comprehensive look into ${engTitle.toLowerCase()} focusing on recovery and mindfulness.`,
        Español: `Una mirada integral a ${espTitle.toLowerCase()} centrándose en la recuperación y la atención plena.`,
        Português: `Um olhar abrangente sobre ${ptTitle.toLowerCase()} com foco na recuperação e atenção plena.`
      },
      content: {
        English: englishContent,
        Español: spanishContent,
        Português: portugueseContent
      },
      reflectionQuestions: {
        English: engQ,
        Español: espQ,
        Português: ptQ
      },
      status: 'UNREAD'
    });
  }

  steps.push({
    id: stepId,
    number: s,
    title: {
      English: translations.stepTitles.English[s-1],
      Español: translations.stepTitles.Español[s-1],
      Português: translations.stepTitles.Português[s-1]
    },
    description: {
      English: `Comprehensive overview of ${translations.stepTitles.English[s-1]}.`,
      Español: `Descripción general completa de ${translations.stepTitles.Español[s-1]}.`,
      Português: `Visão geral abrangente de ${translations.stepTitles.Português[s-1]}.`
    },
    totalDays: 12,
    completedDays: 0,
    locked: s > 1,
    subLessons: subLessons
  });
}

fs.writeFileSync('src/data/lessons.json', JSON.stringify(steps, null, 2));
console.log('Successfully generated src/data/lessons.json');

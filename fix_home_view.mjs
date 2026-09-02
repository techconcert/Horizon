import fs from 'fs';

let content = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

const helper = `
const getText = (en, es, pt) => {
  if (state.language === 'English') return en;
  if (state.language === 'Español') return es;
  return pt;
};
`;

content = content.replace(
  "state.language === 'English' ? 'Active' : state.language === 'Español' ? 'Activo' : 'Ativo'",
  "getText('Active', 'Activo', 'Ativo')"
);
content = content.replace(
  "state.language === 'English' ? 'Renew' : state.language === 'Español' ? 'Renovar' : 'Renovar'",
  "getText('Renew', 'Renovar', 'Renovar')"
);
content = content.replace(
  "state.language === 'English' ? 'Reset' : state.language === 'Español' ? 'Reiniciar' : 'Reiniciar'",
  "getText('Reset', 'Reiniciar', 'Zerar')"
);
content = content.replace(
  "state.language === 'English' ? 'GENERATING...' : 'GENERANDO...'",
  "getText('GENERATING...', 'GENERANDO...', 'GERANDO...')"
);
content = content.replace(
  "state.language === 'English' ? 'Start Ritual' : state.language === 'Español' ? 'Iniciar Ritual' : 'Iniciar Ritual'",
  "getText('Start Ritual', 'Empezar ritual', 'Começar ritual')"
);
content = content.replace(
  "state.language === 'English' ? 'Check In' : state.language === 'Español' ? 'Registrarse' : 'Registro'",
  "getText('Check In', 'Registrarse', 'Fazer check-in')"
);
content = content.replace(
  "state.language === 'English' ? 'Understanding the 24-Hour Cycle' : state.language === 'Español' ? 'Entender el ciclo de 24 horas' : 'Entender o Ciclo de 24 Horas'",
  "getText('Understanding the 24-Hour Cycle', 'Entendiendo el ciclo de 24 horas', 'Entendendo o ciclo de 24 horas')"
);
content = content.replace(
  "state.language === 'English' ? 'Got It' : state.language === 'Español' ? 'Entendido' : 'Entendido'",
  "getText('Got It', 'Entendido', 'Entendi')"
);

content = content.replace(
  "state.language === 'English' \n                      ? 'One day at a time.' \n                      : state.language === 'Español'\n                        ? 'Un día a la vez.' \n                        : 'Um dia de cada vez.'",
  "getText('One day at a time.', 'Un día a la vez.', 'Um dia de cada vez.')"
);

content = content.replace(
  "state.language === 'English'\n                    ? \"When we focus on today, the burden of the past and the anxiety of the future lose their power over us.\"\n                    : state.language === 'Español'\n                      ? \"Cuando nos enfocamos en el presente, la carga del pasado y la ansiedad del futuro pierden su poder.\"\n                      : \"Quando focamos no hoje, o peso do passado e a ansiedade do futuro perdem sua força sobre nós.\"",
  "getText('When we focus on today, the burden of the past and the anxiety of the future lose their power over us.', 'Cuando nos enfocamos en hoy, el peso del pasado y la ansiedad del futuro pierden su poder sobre nosotros.', 'Quando focamos no hoje, o peso do passado e a ansiedade do futuro perdem a força sobre nós.')"
);


if (!content.includes('const getText')) {
  content = content.replace('const { state, setSobrietyStartDate, setActiveTab, getTranslation, generateAIIntention, aiLoading } = useSanctuary();', 'const { state, setSobrietyStartDate, setActiveTab, getTranslation, generateAIIntention, aiLoading } = useSanctuary();\n' + helper);
}

fs.writeFileSync('src/components/HomeView.tsx', content);

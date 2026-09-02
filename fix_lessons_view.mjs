import fs from 'fs';

let content = fs.readFileSync('src/components/LessonsView.tsx', 'utf8');

const helper = `
const getText = (en, es, pt) => {
  if (state.language === 'English') return en;
  if (state.language === 'Español') return es;
  return pt;
};
`;

content = content.replace(
  "state.language === 'English' ? 'Optional Reflection Journal' : state.language === 'Español' ? 'Diario de Reflexión Opcional' : 'Diário de Reflexão Opcional'",
  "getText('Optional Reflection Journal', 'Diario de reflexión opcional', 'Diário de reflexão opcional')"
);

content = content.replace(
  "state.language === 'English' ? 'Write your thoughts here...' : 'Escribe tus pensamientos aquí...'",
  "getText('Write your thoughts here...', 'Escribe lo que piensas aquí...', 'Escreva o que está pensando aqui...')"
);

content = content.replace(
  "state.language === 'English' ? 'Mark Complete Again' : 'Marcar Completado de Nuevo'",
  "getText('Mark Complete Again', 'Volver a marcar completado', 'Marcar como concluído de novo')"
);

if (!content.includes('const getText')) {
  content = content.replace('const [reflectionText, setReflectionText] = useState(\'\');', 'const [reflectionText, setReflectionText] = useState(\'\');\n' + helper);
}

fs.writeFileSync('src/components/LessonsView.tsx', content);

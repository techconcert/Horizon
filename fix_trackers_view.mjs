import fs from 'fs';

let content = fs.readFileSync('src/components/TrackersView.tsx', 'utf8');

const helper = `
const getText = (en, es, pt) => {
  if (state.language === 'English') return en;
  if (state.language === 'Español') return es;
  return pt;
};
`;

content = content.replace(
  "state.language === 'English' ? 'Daily Reflection' : state.language === 'Español' ? 'Reflexión Diaria' : 'Reflexão Diária'",
  "getText('Daily Reflection', 'Reflexión diaria', 'Reflexão diária')"
);
content = content.replace(
  "state.language === 'English' ? 'Reflection Title (Optional)' : state.language === 'Español' ? 'Título (Opcional)' : 'Título (Opcional)'",
  "getText('Reflection Title (Optional)', 'Título (Opcional)', 'Título (Opcional)')"
);
content = content.replace(
  "state.language === 'English' ? '7 Days' : state.language === 'Español' ? '7 Días' : '7 Dias'",
  "getText('7 Days', '7 Días', '7 Dias')"
);
content = content.replace(
  "state.language === 'English' ? 'Monthly' : state.language === 'Español' ? 'Mensual' : 'Mensal'",
  "getText('Monthly', 'Mensual', 'Mensal')"
);
content = content.replace(
  "state.language === 'English' ? 'Positive' : state.language === 'Español' ? 'Positivo' : 'Positivo'",
  "getText('Positive', 'Positivo', 'Positivo')"
);
content = content.replace(
  "state.language === 'English' ? 'Neutral' : state.language === 'Español' ? 'Neutro' : 'Neutro'",
  "getText('Neutral', 'Neutral', 'Neutro')"
);
content = content.replace(
  "state.language === 'English' ? 'Negative' : state.language === 'Español' ? 'Negativo' : 'Negativo'",
  "getText('Negative', 'Negativo', 'Negativo')"
);
content = content.replace(
  "state.language === 'English' ? 'e.g., Inspired, Ecstatic' : state.language === 'Español' ? 'ej., Inspirado, Eufórico' : 'ex: Inspirado, Radiante'",
  "getText('e.g., Inspired, Ecstatic', 'ej., Inspirado, Eufórico', 'ex: Inspirado, Radiante')"
);

if (!content.includes('const getText')) {
  content = content.replace('const [customMoodModalOpen, setCustomMoodModalOpen] = useState(false);', 'const [customMoodModalOpen, setCustomMoodModalOpen] = useState(false);\n' + helper);
}

fs.writeFileSync('src/components/TrackersView.tsx', content);

import fs from 'fs';

let content = fs.readFileSync('src/context/SanctuaryContext.tsx', 'utf8');

const newStrings = `  'reflection_day': { English: "Day's Reflection", Español: "Reflexión del Día", Português: "Reflexão do Dia" },
  'space_thoughts': { English: 'Space Between Thoughts', Español: 'Espacio entre Pensamientos', Português: 'Espaço entre Pensamentos' },
  'journal_thoughts':`;

content = content.replace("  'journal_thoughts':", newStrings);

fs.writeFileSync('src/context/SanctuaryContext.tsx', content);


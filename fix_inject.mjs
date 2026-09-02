import fs from 'fs';

let hv = fs.readFileSync('src/components/HomeView.tsx', 'utf8');
const helperHV = `
const getLangText = (en: string, es: string, pt: string) => {
  if (state.language === 'English') return en;
  if (state.language === 'Español') return es;
  return pt;
};
`;
hv = hv.replace('const timeGroundedString = calculateTimeGrounded(state.sobrietyStartDate);', helperHV + '\n  const timeGroundedString = calculateTimeGrounded(state.sobrietyStartDate);');
fs.writeFileSync('src/components/HomeView.tsx', hv);

let tv = fs.readFileSync('src/components/TrackersView.tsx', 'utf8');
const helperTV = `
const getText = (en: string, es: string, pt: string) => {
  if (state.language === 'English') return en;
  if (state.language === 'Español') return es;
  return pt;
};
`;
tv = tv.replace('const recentReflections = [...state.reflections]', helperTV + '\n  const recentReflections = [...state.reflections]');
fs.writeFileSync('src/components/TrackersView.tsx', tv);


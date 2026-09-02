import fs from 'fs';

let hv = fs.readFileSync('src/components/HomeView.tsx', 'utf8');
const helperHV = `
const getLangText = (en: string, es: string, pt: string) => {
  if (state.language === 'English') return en;
  if (state.language === 'Español') return es;
  return pt;
};
`;
if (!hv.includes('const getLangText =')) {
  hv = hv.replace('const { state, setSobrietyStartDate, setActiveTab, getTranslation, generateAIIntention, aiLoading } = useSanctuary();', 'const { state, setSobrietyStartDate, setActiveTab, getTranslation, generateAIIntention, aiLoading } = useSanctuary();\n' + helperHV);
  fs.writeFileSync('src/components/HomeView.tsx', hv);
}

let tv = fs.readFileSync('src/components/TrackersView.tsx', 'utf8');
const helperTV = `
const getText = (en: string, es: string, pt: string) => {
  if (state.language === 'English') return en;
  if (state.language === 'Español') return es;
  return pt;
};
`;
if (!tv.includes('const getText =')) {
  tv = tv.replace('const [customMoodModalOpen, setCustomMoodModalOpen] = useState(false);', 'const [customMoodModalOpen, setCustomMoodModalOpen] = useState(false);\n' + helperTV);
  fs.writeFileSync('src/components/TrackersView.tsx', tv);
}


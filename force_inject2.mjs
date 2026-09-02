import fs from 'fs';

// HomeView
let hv = fs.readFileSync('src/components/HomeView.tsx', 'utf8');
hv = hv.replace(
  'export const HomeView: React.FC = () => {',
  `export const HomeView: React.FC = () => {
  const { state } = useSanctuary();
  const getLangText = (en: string, es: string, pt: string) => {
    if (state.language === 'English') return en;
    if (state.language === 'Español') return es;
    return pt;
  };
  `
);
fs.writeFileSync('src/components/HomeView.tsx', hv);

// TrackersView
let tv = fs.readFileSync('src/components/TrackersView.tsx', 'utf8');
tv = tv.replace(
  'export const TrackersView: React.FC = () => {',
  `export const TrackersView: React.FC = () => {
  const { state } = useSanctuary();
  const getText = (en: string, es: string, pt: string) => {
    if (state.language === 'English') return en;
    if (state.language === 'Español') return es;
    return pt;
  };
  `
);
fs.writeFileSync('src/components/TrackersView.tsx', tv);

import fs from 'fs';

let hv = fs.readFileSync('src/components/HomeView.tsx', 'utf8');
hv = hv.replace(/  const getLangText = \(en: string, es: string, pt: string\) => \{\n    if \(state\.language === 'English'\) return en;\n    if \(state\.language === 'Español'\) return es;\n    return pt;\n  \};\n  /, '');
hv = hv.replace(
  '  } = useSanctuary();',
  `  } = useSanctuary();
  const getLangText = (en: string, es: string, pt: string) => {
    if (state.language === 'English') return en;
    if (state.language === 'Español') return es;
    return pt;
  };`
);
fs.writeFileSync('src/components/HomeView.tsx', hv);

let tv = fs.readFileSync('src/components/TrackersView.tsx', 'utf8');
tv = tv.replace(/  const getText = \(en: string, es: string, pt: string\) => \{\n    if \(state\.language === 'English'\) return en;\n    if \(state\.language === 'Español'\) return es;\n    return pt;\n  \};\n  /, '');
tv = tv.replace(
  '  } = useSanctuary();',
  `  } = useSanctuary();
  const getText = (en: string, es: string, pt: string) => {
    if (state.language === 'English') return en;
    if (state.language === 'Español') return es;
    return pt;
  };`
);
fs.writeFileSync('src/components/TrackersView.tsx', tv);

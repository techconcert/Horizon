import fs from 'fs';

// HomeView
let hv = fs.readFileSync('src/components/HomeView.tsx', 'utf8');
hv = hv.replace(
  '  const { state } = useSanctuary();\n',
  ''
);
fs.writeFileSync('src/components/HomeView.tsx', hv);

// TrackersView
let tv = fs.readFileSync('src/components/TrackersView.tsx', 'utf8');
tv = tv.replace(
  '  const { state } = useSanctuary();\n',
  ''
);
fs.writeFileSync('src/components/TrackersView.tsx', tv);

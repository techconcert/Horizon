import fs from 'fs';

let content = fs.readFileSync('src/components/OnboardingView.tsx', 'utf8');
content = content.replace(
  'className="w-full bg-[#F8F5F2] border border-black/15 rounded-2xl p-4 font-sans text-xs focus:outline-none focus:border-black text-[#111111] uppercase font-bold tracking-widest block"',
  'className="w-full min-w-0 bg-[#F8F5F2] border border-black/15 rounded-2xl p-4 font-sans text-xs focus:outline-none focus:border-black text-[#111111] uppercase font-bold tracking-wider block appearance-none"'
);
fs.writeFileSync('src/components/OnboardingView.tsx', content);

let profileContent = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');
profileContent = profileContent.replace(
  'className="w-full max-w-full min-w-0 box-border bg-[#F8F5F2] border border-black/15 rounded-2xl p-3 font-sans text-xs focus:outline-none focus:border-black text-[#111111] uppercase font-bold tracking-widest block"',
  'className="w-full max-w-full min-w-0 box-border bg-[#F8F5F2] border border-black/15 rounded-2xl p-3 font-sans text-xs focus:outline-none focus:border-black text-[#111111] uppercase font-bold tracking-wider block appearance-none"'
);
fs.writeFileSync('src/components/ProfileView.tsx', profileContent);


import fs from 'fs';

let content = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

content = content.replace(
  "const getText = (en, es, pt) => {",
  "const getLangText = (en: string, es: string, pt: string) => {"
);

content = content.replace(/getText\('Active'/g, "getLangText('Active'");
content = content.replace(/getText\('Renew'/g, "getLangText('Renew'");
content = content.replace(/getText\('Reset'/g, "getLangText('Reset'");
content = content.replace(/getText\('GENERATING...'/g, "getLangText('GENERATING...'");
content = content.replace(/getText\('Start Ritual'/g, "getLangText('Start Ritual'");
content = content.replace(/getText\('Check In'/g, "getLangText('Check In'");
content = content.replace(/getText\('Understanding the 24-Hour Cycle'/g, "getLangText('Understanding the 24-Hour Cycle'");
content = content.replace(/getText\('Got It'/g, "getLangText('Got It'");
content = content.replace(/getText\('One day at a time.'/g, "getLangText('One day at a time.'");
content = content.replace(/getText\('When we focus on today/g, "getLangText('When we focus on today");


fs.writeFileSync('src/components/HomeView.tsx', content);

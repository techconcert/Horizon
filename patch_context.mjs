import fs from 'fs';

let content = fs.readFileSync('src/context/SanctuaryContext.tsx', 'utf8');

content = content.replace(
`  const [steps, setSteps] = useState<Step[]>(() => {
    const saved = localStorage.getItem('steps');
    return saved ? JSON.parse(saved) : INITIAL_STEPS;
  });`,
`  const [steps, setSteps] = useState<Step[]>(() => {
    const saved = localStorage.getItem('steps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0 && typeof parsed[0].title === 'string') {
          // Attempt to migrate progress
          const newSteps = JSON.parse(JSON.stringify(INITIAL_STEPS));
          parsed.forEach((oldStep, i) => {
            if (newSteps[i]) {
              newSteps[i].locked = oldStep.locked;
              if (oldStep.subLessons) {
                oldStep.subLessons.forEach((oldSub, j) => {
                  if (newSteps[i].subLessons[j]) {
                    newSteps[i].subLessons[j].status = oldSub.status;
                  }
                });
              }
            }
          });
          return newSteps;
        }
        return parsed;
      } catch(e) {
        return INITIAL_STEPS;
      }
    }
    return INITIAL_STEPS;
  });`
);

fs.writeFileSync('src/context/SanctuaryContext.tsx', content);

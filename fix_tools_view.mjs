import fs from 'fs';

let content = fs.readFileSync('src/components/ToolsView.tsx', 'utf8');

// We'll replace the ternary branches with a helper function to keep things clean.
const helper = `
const getText = (en, es, pt) => {
  if (state.language === 'English') return en;
  if (state.language === 'Español') return es;
  return pt;
};
`;

// Replace lines with better localized text
content = content.replace(
  "state.language === 'English' ? 'Silent Meditation Complete' : 'Meditación Silenciosa Completada'",
  "getText('Silent Meditation Complete', 'Meditación silenciosa completada', 'Meditação silenciosa completada')"
);

content = content.replace(
  "state.language === 'English'\n                ? `Completed a beautiful ${selectedMedDuration}-minute silent meditation. Allowed my thoughts to pass like clouds and returned with a grounded mind.`\n                : `Completé una hermosa meditación silenciosa de ${selectedMedDuration} minutos. Permití que mis pensamientos pasaran como nubes y regresé con la mente conectada.`",
  "getText(`Completed a beautiful ${selectedMedDuration}-minute silent meditation. Allowed my thoughts to pass like clouds and returned with a grounded mind.`, `Completé una hermosa meditación silenciosa de ${selectedMedDuration} minutos. Dejé pasar mis pensamientos como nubes y regresé con la mente conectada.`, `Completei uma bela meditação silenciosa de ${selectedMedDuration} minutos. Deixei meus pensamentos passarem como nuvens e retornei com a mente mais focada.`)"
);

content = content.replace(
  "alert(state.language === 'English' ? 'Your silent meditation session is complete. Return gently.' : 'Tu sesión de meditación silenciosa ha terminado. Regresa suavemente.');",
  "alert(getText('Your silent meditation session is complete. Return gently.', 'Tu sesión de meditación ha terminado. Regresa suavemente.', 'Sua sessão de meditação acabou. Retorne com calma.'));"
);

content = content.replace(
  "state.language === 'English' ? 'Breathing Exercise Complete' : 'Ejercicio de Respiración Completado'",
  "getText('Breathing Exercise Complete', 'Ejercicio de respiración completado', 'Exercício de respiração concluído')"
);

content = content.replace(
  "state.language === 'English'\n              ? `Completed a centering ${selectedBreathing.name} session. Synchronized body and mind with deliberate breathing patterns.`\n              : `Completé una sesión de respiración centradora con ${selectedBreathing.name}. Sincronicé el cuerpo y la mente con patrones de respiración deliberados.`",
  "getText(`Completed a centering ${selectedBreathing.name} session. Synchronized body and mind with deliberate breathing patterns.`, `Completé una sesión centradora de ${selectedBreathing.name}. Sincronicé mi cuerpo y mente con mi respiración.`, `Completei uma sessão de ${selectedBreathing.name}. Sincronizei corpo e mente respirando fundo.`)"
);

content = content.replace(
  "alert(\n            state.language === 'English'\n              ? 'Your breathing exercise session is complete. Feel the stillness.'\n              : 'Tu sesión de ejercicio de respiración ha terminado. Siente la quietud.'\n          );",
  "alert(getText('Your breathing exercise session is complete. Feel the stillness.', 'Tu ejercicio de respiración ha terminado. Siente la quietud.', 'Seu exercício de respiração acabou. Sinta a calma.'));"
);

content = content.replace(
  "alert(state.language === 'English' ? 'Reflection saved successfully to your past logs!' : 'Reflexión guardada con éxito en tus registros pasados.');",
  "alert(getText('Reflection saved successfully to your past logs!', '¡Reflexión guardada con éxito en tus registros!', 'Reflexão salva com sucesso nos seus registros!'));"
);

// Prompts
content = content.replace(
  "state.language === 'English' ? 'What are three simple things you can touch or see right now that you are grateful for?' : '¿Cuáles son tres cosas simples que puedes ver o tocar en este momento por las que estás agradecido?'",
  "getText('What are three simple things you can touch or see right now that you are grateful for?', '¿Cuáles son tres cosas sencillas que puedes ver o tocar en este momento por las que te sientas agradecido?', 'Quais são três coisas simples que você pode ver ou tocar agora e pelas quais sente gratidão?')"
);
content = content.replace(
  "state.language === 'English' ? 'How does recognizing these blessings shift your immediate mental state?' : '¿Cómo cambia tu estado mental inmediato al reconocer estas bendiciones?'",
  "getText('How does recognizing these blessings shift your immediate mental state?', '¿Cómo cambia tu estado de ánimo al reconocer estas cosas buenas?', 'Como reconhecer essas coisas boas muda o seu humor agora?')"
);

content = content.replace(
  "state.language === 'English' ? 'What is one specific situation today that you need to surrender control over?' : '¿Cuál es una situación específica hoy sobre la cual necesitas entregar el control?'",
  "getText('What is one specific situation today that you need to surrender control over?', '¿Hay alguna situación de hoy en la que necesites soltar el control?', 'Existe alguma situação de hoje em que você precise abrir mão do controle?')"
);
content = content.replace(
  "state.language === 'English' ? 'What is one small action of courage you can take that lies completely in your hands?' : '¿Cuál es una pequeña acción de valor que puedes tomar que está completamente en tus manos?'",
  "getText('What is one small action of courage you can take that lies completely in your hands?', '¿Cuál es un pequeño acto de valor que puedes hacer que dependa solo de ti?', 'Qual pequena atitude de coragem você pode tomar que dependa apenas de você?')"
);

content = content.replace(
  "state.language === 'English' ? 'What is one interaction or burden from today that you want to release before sleep?' : '¿Cuál es una interacción o carga de hoy de la que deseas liberarte antes de dormir?'",
  "getText('What is one interaction or burden from today that you want to release before sleep?', '¿Qué situación o carga de hoy te gustaría soltar antes de dormir?', 'Que situação ou peso de hoje você gostaria de soltar antes de dormir?')"
);
content = content.replace(
  "state.language === 'English' ? 'Can you breathe in peace and exhale all remaining guilt or expectations?' : '¿Puedes inhalar paz y exhalar toda culpa o expectativa restante?'",
  "getText('Can you breathe in peace and exhale all remaining guilt or expectations?', '¿Puedes inhalar paz y exhalar cualquier culpa o expectativa que quede?', 'Você consegue inspirar paz e expirar qualquer culpa ou expectativa que sobrou?')"
);

content = content.replace(
  "state.language === 'English' ? 'Write about what arises when you try to find silence today.' : 'Escribe sobre lo que surge cuando intentas buscar el silencio hoy.'",
  "getText('Write about what arises when you try to find silence today.', 'Escribe sobre lo que sientes cuando intentas buscar el silencio hoy.', 'Escreva sobre o que você sente quando tenta buscar o silêncio hoje.')"
);
content = content.replace(
  "state.language === 'English' ? 'How does listening to stillness change your perspective?' : '¿Cómo cambia tu perspectiva al escuchar la quietud?'",
  "getText('How does listening to stillness change your perspective?', '¿Cómo cambia tu perspectiva al simplemente escuchar la quietud?', 'Como sua perspectiva muda ao simplesmente escutar o silêncio?')"
);

content = content.replace(
  "state.language === 'English' ? 'Session Remaining' : 'Tiempo de Sesión'",
  "getText('Session Remaining', 'Tiempo restante', 'Tempo restante')"
);

content = content.replace(
  "state.language === 'English' ? 'Breathing' : 'Respirar'",
  "getText('Breathing', 'Respirando', 'Respirando')"
);

content = content.replace(
  "state.language === 'English' ? 'Write your deep reflection answers here...' : 'Escribe aquí las respuestas de tu reflexión profunda...'",
  "getText('Write your reflection answers here...', 'Escribe aquí tus reflexiones...', 'Escreva aqui suas reflexões...')"
);

// Inject helper at the top of the component
if (!content.includes('const getText')) {
  content = content.replace('const { state, getTranslation, addReflection } = useSanctuary();', 'const { state, getTranslation, addReflection } = useSanctuary();\n' + helper);
}

fs.writeFileSync('src/components/ToolsView.tsx', content);

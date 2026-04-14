import fs from 'fs';
import path from 'path';

// Mock types removed for JS

function parseLatex(latexContent, defaultSubject = "Physics") {
  const questions = [];

  let content = latexContent;
  const docStart = content.indexOf('\\begin{document}');
  if (docStart !== -1) content = content.substring(docStart);

  content = content.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, '');
  content = content.replace(/\\begin\{center\}/g, '').replace(/\\end\{center\}/g, '');

  const splits = content.split(/\\item\s+/);

  let currentQuestionText = "";
  let currentOptions = [];
  let inOptionsPhase = false;
  let correctLetter = '';

  for (let i = 1; i < splits.length; i++) {
    let block = splits[i].trim();

    if (inOptionsPhase) {
      const endEnumIndex = block.indexOf('\\end{enumerate}');

      if (endEnumIndex !== -1) {
        const optionText = block.substring(0, endEnumIndex).trim();
        const id = `opt-${Math.random().toString(36).substr(2, 9)}`;
        if (optionText) currentOptions.push({ id, text: optionText });

        let correctAnswerId = '';
        if (correctLetter) {
          const letterIndex = correctLetter.charCodeAt(0) - 65;
          if (letterIndex >= 0 && letterIndex < currentOptions.length) {
            correctAnswerId = currentOptions[letterIndex].id;
          }
        }

        if (currentQuestionText && currentOptions.length > 0) {
          questions.push({
            id: `tex-q-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
            text: currentQuestionText,
            options: [...currentOptions],
            correctAnswerId,
            topic: "Imported (LaTeX)",
            subject: defaultSubject
          });
        }

        inOptionsPhase = false;
        currentOptions = [];
        correctLetter = '';

      } else {
        const id = `opt-${Math.random().toString(36).substr(2, 9)}`;
        if (block) currentOptions.push({ id, text: block });
      }
    }
    else {
      const beginEnumIndex = block.indexOf('\\begin{enumerate}');

      if (beginEnumIndex !== -1) {
        currentQuestionText = block.substring(0, beginEnumIndex).trim();
        const answerMatch = currentQuestionText.match(/\\hfill\s*\\textbf{\s*(?:\({1,2}(.+?)\){1,2}|\((.+?)\))/);
        if (answerMatch) {
          correctLetter = (answerMatch[1] || answerMatch[2]).trim().toUpperCase();
          currentQuestionText = currentQuestionText.replace(answerMatch[0], '').trim();
        }
        currentOptions = [];
        inOptionsPhase = true;
      } else {
        const optionRegexFilter = /(?:^|\s|\\+)(?:\([A-Ea-e]\)|[A-Ea-e]\))/g;
        const matchInline = block.match(optionRegexFilter);
        if (matchInline && matchInline.length >= 2) {
          const matchResult = block.match(/(?:^|\s|\\+)(?:\([A-Ea-e]\)|[A-Ea-e]\))/);
          const firstOptionIndex = matchResult ? matchResult.index || 0 : -1;
          
          if (firstOptionIndex !== -1) {
              currentQuestionText = block.substring(0, firstOptionIndex).trim();
              const answerMatch = currentQuestionText.match(/\\hfill\s*\\textbf{\s*(?:\({1,2}([A-Ea-e])\){1,2}|\(([A-Ea-e])\))/i);
              if (answerMatch) {
                correctLetter = (answerMatch[1] || answerMatch[2]).trim().toUpperCase();
                currentQuestionText = currentQuestionText.replace(answerMatch[0], '').trim();
              }

              const optionsString = block.substring(firstOptionIndex).trim();
              const optRegex = /(?:^|\s|\\+)(?:\(([A-Ea-e])\)|([A-Ea-e])\))\s*([\s\S]*?)(?=\s*(?:^|\s|\\+)(?:\([A-Ea-e]\)|[A-Ea-e]\))(?:[^a-zA-Z]|$)|$)/gi;
              let optExec;
              let foundCorrectId = '';

              while ((optExec = optRegex.exec(optionsString)) !== null) {
                const letter = (optExec[1] || optExec[2]).toUpperCase();
                const id = `opt-${Math.random().toString(36).substr(2, 9)}`;
                currentOptions.push({ id, text: optExec[3].trim() });
                if (correctLetter === letter) {
                  foundCorrectId = id;
                }
              }

              if (currentQuestionText && currentOptions.length >= 2) {
                questions.push({
                  id: `tex-q-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
                  text: currentQuestionText,
                  options: [...currentOptions],
                  correctAnswerId: foundCorrectId,
                  topic: "Imported (LaTeX)",
                  subject: defaultSubject
                });
              }
              currentOptions = [];
              correctLetter = '';
          }
        }
      }
    }
  }

  return questions;
}

const filePath = '/home/kavyapratapsingh/Desktop/vidyaheist/papers/biology/Biology Latex Code Question(Ch. 1 to 38)/ch06_anatomy_flowering_plants.tex';
const content = fs.readFileSync(filePath, 'utf-8');
const questions = parseLatex(content, "Biology");

console.log(`Parsed ${questions.length} questions from ${path.basename(filePath)}`);
if (questions.length > 0) {
    console.log("Example Question 1:");
    console.log("Text:", questions[0].text);
    console.log("Options:", questions[0].options.map(o => o.text).join(" | "));
}

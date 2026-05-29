import type { QuestionType, QuestionOption } from './types';

export function parseQuestionFile(content: string, type: 'tex' | 'txt', subject: string = "Physics"): QuestionType[] {
  // Intelligent sniffing: if it's meant to be a TXT but contains LaTeX code, switch it.
  if (type === 'txt' && (content.includes('\\item') || content.includes('\\begin{document}'))) {
    type = 'tex';
  }

  if (type === 'tex') {
    return parseLatex(content, subject);
  } else if (type === 'txt') {
    return parseText(content, subject);
  }
  return [];
}

export function parseLatex(latexContent: string, defaultSubject: string = "Physics"): QuestionType[] {
  const questions: QuestionType[] = [];

  let content = latexContent;
  const docStart = content.indexOf('\\begin{document}');
  if (docStart !== -1) content = content.substring(docStart);

  // Strip tikzpicture and center environments to clean up the text
  content = content.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, '');
  content = content.replace(/\\begin\{center\}/g, '').replace(/\\end\{center\}/g, '');

  const splits = content.split(/\\item\s+/);

  let currentQuestionText = "";
  let currentOptions: QuestionOption[] = [];
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

        // Try finding inline correct answer hint
        const answerMatch = currentQuestionText.match(/\\hfill\s*\\textbf{\s*(?:\({1,2}(.+?)\){1,2}|\((.+?)\))/);
        if (answerMatch) {
          correctLetter = (answerMatch[1] || answerMatch[2]).trim().toUpperCase();
          currentQuestionText = currentQuestionText.replace(answerMatch[0], '').trim();
        }

        currentOptions = [];
        inOptionsPhase = true;
      } else {
        // Fallback: If no \begin{enumerate} found, check if options are inline e.g. (A) Option1, A) Option2
        const optionRegexFilter = /(?:^|[\s\\]+)(?:\([A-Ea-e]\)|[A-Ea-e]\))/g;
        const matchInline = block.match(optionRegexFilter);
        if (matchInline && matchInline.length >= 2) {
          const matchResult = block.match(/(?:^|[\s\\]+)(?:\([A-Ea-e]\)|[A-Ea-e]\))/);
          const firstOptionIndex = matchResult ? matchResult.index || 0 : -1;
          
          if (firstOptionIndex !== -1) {
              currentQuestionText = block.substring(0, firstOptionIndex).trim();

              // Handle optional answer marking inside question text or at the end
              const answerMatch = currentQuestionText.match(/\\hfill\s*\\textbf{\s*(?:\({1,2}([A-Ea-e])\){1,2}|\(([A-Ea-e])\))/i);
              if (answerMatch) {
                correctLetter = (answerMatch[1] || answerMatch[2]).trim().toUpperCase();
                currentQuestionText = currentQuestionText.replace(answerMatch[0], '').trim();
              }

              const optionsString = block.substring(firstOptionIndex).trim();
              const optRegex = /(?:^|[\s\\]+)(?:\(([A-Ea-e])\)|([A-Ea-e])\))\s*([\s\S]*?)(?=\s*(?:^|[\s\\]+)(?:\([A-Ea-e]\)|[A-Ea-e]\))(?:[^a-zA-Z]|$)|$)/gi;
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

export function parseText(textContent: string, defaultSubject: string = "General"): QuestionType[] {
  const questions: QuestionType[] = [];
  const questionBlocks = textContent.split(/(?:^|\n)Q\.\s*/).slice(1);

  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];

    const answerMatch = block.match(/Answer:\s*([A-Za-z])/i);
    const correctAnswerLetter = answerMatch ? answerMatch[1].toUpperCase() : null;

    const cleanBlock = (answerMatch ? block.replace(answerMatch[0], '') : block).trim();

    const firstOptionIndex = cleanBlock.search(/\s*\([A-Z]\)/);
    if (firstOptionIndex === -1) continue;

    const questionText = cleanBlock.substring(0, firstOptionIndex).trim();
    const optionsString = cleanBlock.substring(firstOptionIndex).trim();

    const optionRegex = /\(([A-Z])\)\s*([\s\S]*?)(?=\s*\([A-Z]\)\s|$)/g;
    let optionMatch;
    const options: QuestionOption[] = [];
    let foundCorrectAnswerId = '';

    while ((optionMatch = optionRegex.exec(optionsString)) !== null) {
      const optionLetter = optionMatch[1].trim().toUpperCase();
      const optionText = optionMatch[2].trim();
      const id = `opt-${Math.random().toString(36).substr(2, 9)}`;
      options.push({ id, text: optionText });
      if (optionLetter === correctAnswerLetter) {
        foundCorrectAnswerId = id;
      }
    }

    if (questionText && options.length > 0) {
      questions.push({
        id: `txt-q-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
        text: questionText,
        options: options,
        correctAnswerId: foundCorrectAnswerId,
        topic: "Imported",
        subject: defaultSubject,
      });
    }
  }

  return questions;
}

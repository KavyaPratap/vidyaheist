
import type { QuestionType, QuestionOption } from './types';

function parseLatex(latexContent: string): QuestionType[] {
  const questions: QuestionType[] = [];

  // Start parsing from \begin{document}
  const docContentStartIndex = latexContent.indexOf('\\begin{document}');
  if (docContentStartIndex === -1) {
    return [];
  }
  const content = latexContent.substring(docContentStartIndex);

  // Split the document into question blocks based on '\item Q.'
  const questionBlocks = content.split('\\item Q.').slice(1);

  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    
    // Improved regex to find the correct answer, e.g., \hfill \textbf{((A))} or \textbf{(A)}
    const answerMatch = block.match(/\\hfill\s*\\textbf{\s*(?:\({2}(.+?)\){2}|\((.+?)\))/);
    const correctAnswerLetter = answerMatch ? (answerMatch[1] || answerMatch[2]).trim() : null;

    // Clean the block by removing the answer part and trimming whitespace
    const cleanBlock = (answerMatch ? block.replace(answerMatch[0], '') : block).trim();

    // Find the start of the options, which is the first occurrence of `(A)` or `(a)`
    const firstOptionIndex = cleanBlock.search(/\s*\([A-Za-z]\)/);
    if (firstOptionIndex === -1) {
      continue;
    }

    const questionText = cleanBlock.substring(0, firstOptionIndex).trim();
    const optionsString = cleanBlock.substring(firstOptionIndex).trim();
    
    // Regex to capture options like (A) text (B) text
    const optionRegex = /\(([A-Z])\) (.*?)(?=\s*\([A-Z]\)\s|\\end{enumerate}|$)/gs;
    let optionMatch;
    const options: QuestionOption[] = [];
    let correctAnswerId = '';
    let optionCounter = 0;
    
    while ((optionMatch = optionRegex.exec(optionsString)) !== null) {
        const optionLetter = optionMatch[1].trim();
        // Clean up option text from any trailing LaTeX commands or whitespace
        const optionText = optionMatch[2].replace(/\\hfill/g, '').trim(); 
        
        // Using question index `i` and an internal counter `optionCounter` to guarantee uniqueness
        const id = `q-${i}-opt-${optionCounter++}`;
        options.push({ id, text: optionText });
        if (optionLetter === correctAnswerLetter) {
            correctAnswerId = id;
        }
    }
    
    if (questionText && options.length > 0 && correctAnswerId) {
        questions.push({
            id: `tex-q-${i}`,
            text: questionText,
            options: options,
            correctAnswerId: correctAnswerId,
            topic: "Question Bank",
            subject: "General",
        });
    }
  }

  return questions;
}

export async function getQuestionsFromTex(): Promise<QuestionType[]> {
  if (typeof window === 'undefined') {
    // Cannot fetch on server side during build, return empty.
    // The fetch will happen on the client.
    return [];
  }
  try {
    const response = await fetch(`${window.location.origin}/question_bank.tex`);
    if (!response.ok) {
        throw new Error(`Network response was not ok for question_bank.tex: ${response.statusText}`);
    }
    const latexContent = await response.text();
    return parseLatex(latexContent);
  } catch (error) {
    console.error("Failed to fetch or parse question bank:", error);
    return [];
  }
}

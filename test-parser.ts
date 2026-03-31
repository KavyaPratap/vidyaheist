const fs = require('fs');
const path = require('path');
const { parseQuestionFile } = require('./src/lib/tex-parser'); // Oh wait, tex-parser.ts is typescript!

// Let me just write the script in TS and use tsx/ts-node.
import { parseQuestionFile } from './src/lib/tex-parser';

const fileContent = fs.readFileSync(path.join(process.cwd(), 'papers/physics/4.tex'), 'utf-8');
const questions = parseQuestionFile(fileContent, 'tex');

console.log(`Parsed ${questions.length} questions from 4.tex`);
if (questions.length > 0) {
    console.log(questions[0].text);
    console.log(questions[0].options);
}

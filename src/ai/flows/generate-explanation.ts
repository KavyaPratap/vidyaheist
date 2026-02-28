// src/ai/flows/generate-explanation.ts
'use server';

/**
 * @fileOverview AI-powered explanation generator for incorrect answers.
 *
 * - generateExplanation - A function that generates explanations for incorrect answers.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationInputSchema = z.object({
  question: z.string().describe('The question that was answered incorrectly.'),
  studentAnswer: z.string().describe('The student\'s incorrect answer.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  topic: z.string().describe('The topic of the question.'),
});

export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of why the student\'s answer was incorrect and why the correct answer is correct.'),
});

export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationPrompt',
  input: {schema: GenerateExplanationInputSchema},
  output: {schema: GenerateExplanationOutputSchema},
  prompt: `You are an AI expert in generating detailed explanations for students who have answered questions incorrectly. Your goal is to help them understand their mistakes and learn the underlying concepts.

  Here is the question, the student's answer, and the correct answer:

  Topic: {{{topic}}}
  Question: {{{question}}}
  Student's Answer: {{{studentAnswer}}}
  Correct Answer: {{{correctAnswer}}}

  Provide a clear and concise explanation of why the student's answer was incorrect and why the correct answer is correct. Focus on the specific misunderstanding that led to the incorrect answer.
  `,
});

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

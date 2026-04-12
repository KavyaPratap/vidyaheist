import { appRoute } from '@genkit-ai/next';
import { generateExplanationFlow } from '@/ai/flows/generate-explanation';

export const POST = appRoute(generateExplanationFlow);

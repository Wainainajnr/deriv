import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
});

if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn("WARNING: GOOGLE_GENAI_API_KEY is not set. AI features may not work.");
}

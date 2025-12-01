'use server';

/**
 * @fileOverview Provides automated trade suggestions for Even/Odd trades based on real-time market data analysis using an LLM.
'use server';

/**
 * @fileOverview Provides automated trade suggestions for Even/Odd trades based on real-time market data analysis using an LLM.
 *
 * - automatedTradeSuggestions - A function that generates trade suggestions.
 * - AutomatedTradeSuggestionsInput - The input type for the automatedTradeSuggestions function.
 * - AutomatedTradeSuggestionsOutput - The return type for the automatedTradeSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AutomatedTradeSuggestionsInputSchema = z.object({
  evenOddPercentage: z
    .number()
    .describe('The current percentage of even vs odd digits in the market data.'),
  patternDominance: z
    .string()
    .describe('The dominant pattern of even/odd digits (e.g., Evens or Odds).'),
  lastTenPatterns: z
    .string()
    .describe('The sequence of the last 10 even/odd patterns (e.g., E O E E O O E O E O).'),
  signalStrength: z
    .string()
    .describe('The current signal strength indicator (weak, medium, strong).'),
});
export type AutomatedTradeSuggestionsInput = z.infer<
  typeof AutomatedTradeSuggestionsInputSchema
>;

const AutomatedTradeSuggestionsOutputSchema = z.object({
  tradeSuggestion: z
    .string()
    .describe(
      'A trade suggestion (ENTER EVEN NOW, ENTER ODD NOW, or NO ENTRY) based on the analysis.'
    ),
  confidenceLevel: z
    .string()
    .describe(
      'A confidence level (high, medium, low) for the trade suggestion based on the strength of the signals.'
    ),
  reasoning: z
    .string()
    .describe(
      'The detailed reasoning behind the trade suggestion, considering all input factors.'
    ),
});
export type AutomatedTradeSuggestionsOutput = z.infer<
  typeof AutomatedTradeSuggestionsOutputSchema
>;

export async function automatedTradeSuggestions(
  input: AutomatedTradeSuggestionsInput
): Promise<AutomatedTradeSuggestionsOutput> {
  return automatedTradeSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automatedTradeSuggestionsPrompt',
  input: { schema: AutomatedTradeSuggestionsInputSchema },
  output: { schema: AutomatedTradeSuggestionsOutputSchema },
  prompt: `You are an expert trading advisor specializing in Even/Odd digit trading on the Deriv platform. Analyze the provided real-time market data and provide a trade suggestion, a confidence level, and a detailed reasoning.

Data:
Even/Odd Percentage: {{{evenOddPercentage}}}
Pattern Dominance: {{{patternDominance}}}
Last 10 Patterns: {{{lastTenPatterns}}}
Signal Strength: {{{signalStrength}}}

Based on this data, provide a trade suggestion (ENTER EVEN NOW, ENTER ODD NOW, or NO ENTRY), a confidence level (high, medium, low), and a detailed reasoning behind the suggestion.

Trade Suggestion:`,
});

const automatedTradeSuggestionsFlow = ai.defineFlow(
  {
    name: 'automatedTradeSuggestionsFlow',
    inputSchema: AutomatedTradeSuggestionsInputSchema,
    outputSchema: AutomatedTradeSuggestionsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input, { model: 'googleai/gemini-1.5-flash' });
    return output!;
  }
);

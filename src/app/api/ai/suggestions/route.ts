import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const input = await req.json();

        // Validate input
        if (!input) {
            return NextResponse.json(
                { error: "Invalid input: Body is missing" },
                { status: 400 }
            );
        }

        // Check for API key
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) {
            console.error('GOOGLE_GENAI_API_KEY is not set');
            return NextResponse.json(
                { error: 'API key not configured. Please set GOOGLE_GENAI_API_KEY in environment variables.' },
                { status: 500 }
            );
        }

        // Initialize the Google AI SDK
        const genAI = new GoogleGenerativeAI(apiKey);

        // Get the model - using gemini-1.0-pro (free tier compatible)
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

        // Build the prompt
        const prompt = `You are an expert trading advisor specializing in Even/Odd digit trading on the Deriv platform. Analyze the provided real-time market data and provide a trade suggestion, a confidence level, and a detailed reasoning.

Data:
Even/Odd Percentage: ${input.evenOddPercentage}
Pattern Dominance: ${input.patternDominance}
Last 10 Patterns: ${input.lastTenPatterns}
Signal Strength: ${input.signalStrength}

Based on this data, provide:
1. A trade suggestion (ENTER EVEN NOW, ENTER ODD NOW, or NO ENTRY)
2. A confidence level (high, medium, low)
3. Detailed reasoning behind the suggestion

Format your response as JSON with these exact keys:
{
  "tradeSuggestion": "ENTER EVEN NOW" | "ENTER ODD NOW" | "NO ENTRY",
  "confidenceLevel": "high" | "medium" | "low",
  "reasoning": "your detailed explanation here"
}`;

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();

        // Parse the JSON response
        let parsedResult;
        try {
            parsedResult = JSON.parse(generatedText);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', generatedText);
            // Fallback: extract values manually
            parsedResult = {
                tradeSuggestion: generatedText.includes('ENTER EVEN') ? 'ENTER EVEN NOW' :
                    generatedText.includes('ENTER ODD') ? 'ENTER ODD NOW' : 'NO ENTRY',
                confidenceLevel: generatedText.toLowerCase().includes('high') ? 'high' :
                    generatedText.toLowerCase().includes('low') ? 'low' : 'medium',
                reasoning: generatedText
            };
        }

        return NextResponse.json(parsedResult);

    } catch (error) {
        console.error('Error in AI suggestions API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

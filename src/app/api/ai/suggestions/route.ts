import { NextRequest, NextResponse } from 'next/server';

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

        // Call Gemini API directly
        const geminiResponse = await fetch(
            'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                        responseMimeType: 'application/json',
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API Error:', errorText);
            return NextResponse.json(
                { error: `Gemini API error: ${geminiResponse.status} - ${errorText}` },
                { status: 500 }
            );
        }

        const geminiData = await geminiResponse.json();

        // Extract the text response
        const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            console.error('No text in Gemini response:', geminiData);
            return NextResponse.json(
                { error: 'Invalid response from Gemini API' },
                { status: 500 }
            );
        }

        // Parse the JSON response from Gemini
        let result;
        try {
            result = JSON.parse(generatedText);
        } catch (parseError) {
            console.error('Failed to parse Gemini response as JSON:', generatedText);
            // Fallback: extract values manually if JSON parsing fails
            result = {
                tradeSuggestion: generatedText.includes('ENTER EVEN') ? 'ENTER EVEN NOW' :
                    generatedText.includes('ENTER ODD') ? 'ENTER ODD NOW' : 'NO ENTRY',
                confidenceLevel: generatedText.toLowerCase().includes('high') ? 'high' :
                    generatedText.toLowerCase().includes('low') ? 'low' : 'medium',
                reasoning: generatedText
            };
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in AI suggestions API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

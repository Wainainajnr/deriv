import { automatedTradeSuggestions, type AutomatedTradeSuggestionsInput } from '@/ai/flows/automated-trade-suggestions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const input: AutomatedTradeSuggestionsInput = await req.json();

        if (!input) {
            return NextResponse.json(
                { error: "Invalid input: Body is missing" },
                { status: 400 }
            );
        }

        const result = await automatedTradeSuggestions(input);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in AI suggestions API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

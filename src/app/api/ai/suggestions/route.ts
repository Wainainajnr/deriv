import { automatedTradeSuggestions, type AutomatedTradeSuggestionsInput } from '@/ai/flows/automated-trade-suggestions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const input: AutomatedTradeSuggestionsInput = await req.json();
        const result = await automatedTradeSuggestions(input);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in AI suggestions API:', error);
        return NextResponse.json(
            { error: 'Failed to generate AI suggestion' },
            { status: 500 }
        );
    }
}

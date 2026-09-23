export const runtime = 'edge';
import { NextResponse } from 'next/server';

/**
 * Server-Side AI Command Route Handler
 * Safe server boundary for processing AI queries without exposing API keys to client.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Foundation Sprint Stub Response
    // In future sprints, this route will invoke OpenAI securely from the server side:
    // const response = await openai.chat.completions.create({ model: 'gpt-4o', messages: [...] });

    return NextResponse.json({
      status: 'success',
      prompt,
      message: `Founder Cockpit AI received: "${prompt}". Server-side API handler route is initialized and ready for OpenAI API key integration.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process AI command' },
      { status: 500 }
    );
  }
}

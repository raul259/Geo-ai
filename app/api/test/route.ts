import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 30;

export async function GET() {
  try {
    console.log('[TEST] Testing API key...');
    console.log('[TEST] API Key exists:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    
    const result = await streamText({
      model: google('gemini-1.5-flash'),
      prompt: 'Di "Hola, la API funciona correctamente" en español.',
    });

    console.log('[TEST] Stream object created');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[TEST] Starting to read fullStream...');
          for await (const part of result.fullStream) {
            console.log('[TEST] Part type:', part.type);
            if (part.type === 'text-delta') {
              console.log('[TEST] Text chunk:', part.text);
              controller.enqueue(encoder.encode(part.text));
            }
          }
          controller.close();
          console.log('[TEST] Stream completed successfully');
        } catch (error) {
          console.error('[TEST] Error in stream:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      }
    });
  } catch (error) {
    console.error('[TEST] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error en la prueba',
      details: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

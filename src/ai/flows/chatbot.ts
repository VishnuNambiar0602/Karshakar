
'use server';
import 'server-only';

/**
 * @fileOverview A chatbot flow to assist users of the Earth Insights Dashboard.
 *
 * - chatbot - A function that handles the chatbot conversation.
 * - ChatbotInput - The input type for the chatbot function.
 * - ChatbotOutput - The return type for the chatbot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ChatMessageSchema } from '@/lib/types';
import { generateAudio } from '@/ai/flows/text-to-speech';
import { executePromptWithFallback } from '@/ai/ai-utils';
import { logger } from '@/lib/logger';
import { redactSensitive } from '@/lib/security';

const ChatbotInputSchema = z.object({
  messages: z.array(ChatMessageSchema),
  latitude: z.number().optional().describe('The current latitude from the dashboard for context.'),
  longitude: z.number().optional().describe('The current longitude from the dashboard for context.'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe("The chatbot's response to the user."),
  audioDataUri: z.string().optional().describe("The generated audio for the response, as a data URI in WAV format."),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

const chatbotPrompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: { schema: z.object({messages: z.array(ChatMessageSchema), latitude: z.number().optional(), longitude: z.number().optional()}) },
  prompt: `You are Stark, the friendly and brilliant AI guide for the "Earth Insights Dashboard". Your personality is curious, encouraging, and enthusiastic about data and space.

Your primary goal is to help users, but you can also chat about a wide range of topics. Feel free to answer general knowledge questions.

Here are your instructions:
- When asked about the app, be specific and helpful. You know all about NDVI, NDWI, NDBI, and how the dashboard works.
- Maintain a positive and encouraging tone.
- Keep your answers concise and clear.
- You can use simple emojis like 🛰️ or ✨ to add a bit of personality, but don't overdo it.

This is the conversation history. Use it to understand the user's needs.
{{#each messages}}
{{role}}: {{{content}}}
{{/each}}
{{#if latitude}}
Current location context: Latitude {{latitude}}, Longitude {{longitude}}.
{{/if}}
model:`,
});

export async function chatbot(input: ChatbotInput): Promise<ChatbotOutput> {
    try {
      // Use the fallback mechanism for better resilience
      const response = await executePromptWithFallback(chatbotPrompt, input, {
        retryConfig: { maxRetries: 3, retryDelayMs: 1000 }
      }, 'chatbot');
      
      const textResponse = response.text;
      
      if (!textResponse) {
        throw new Error("The AI model did not return a response.");
      }
      
      // Generate audio for the response (non-blocking, with fallback)
      let audioDataUri: string | undefined;
      try {
        audioDataUri = await generateAudio(textResponse);
      } catch (audioError) {
        logger.warn('chatbot_audio_generation_failed', {
          scope: 'ai.flows.chatbot',
          error: redactSensitive(audioError instanceof Error ? audioError.message : String(audioError)),
        });
        // Continue without audio - it's optional
      }

      return { 
          response: textResponse,
          audioDataUri,
      };
    } catch (error: any) {
      logger.error('chatbot_flow_failed', {
        scope: 'ai.flows.chatbot',
        error: redactSensitive(error?.message || String(error)),
      });
      
      // Provide a helpful fallback response
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return {
          response: "I'm currently experiencing high demand. Please try again in a moment. 🙏",
          audioDataUri: undefined,
        };
      }
      
      throw error;
    }
}

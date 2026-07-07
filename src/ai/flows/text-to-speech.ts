
'use server';

/**
 * @fileOverview A flow for converting text to speech.
 * - textToSpeech - A function that handles the text to speech conversion.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI in WAV format."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// TTS model options to try in order
const TTS_MODELS = [
  'gemini-2.5-flash-preview-tts',
  'gemini-2.0-flash-preview-tts', 
  'gemini-2.0-flash',
];

export async function generateAudio(text: string): Promise<string | undefined> {
    if (!text.trim()) return undefined;

    let lastError: Error | null = null;

    for (const modelName of TTS_MODELS) {
      try {
        const { media } = await ai.generate({
            model: googleAI.model(modelName),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Algenib' },
                  },
                },
            },
            prompt: text,
        });

        if (!media) {
            continue; // Try next model
        }

        const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
        );

        const wavData = await toWav(audioBuffer);
        return 'data:audio/wav;base64,' + wavData;

      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || '';
        
        // If model not found or not supported, try next model
        if (errorMessage.includes('404') || 
            errorMessage.includes('not found') ||
            errorMessage.includes('not supported')) {
          console.warn(`TTS model ${modelName} not available, trying fallback...`);
          continue;
        }
        
        // For rate limit errors, log and continue to next model
        if (errorMessage.includes('429') || errorMessage.includes('quota')) {
          console.warn(`Rate limit hit on TTS model ${modelName}, trying fallback...`);
          continue;
        }
        
        console.error(`Error with TTS model ${modelName}:`, error);
      }
    }

    // If all TTS models fail, return undefined (audio is optional)
    console.warn("All TTS models failed, returning without audio.", lastError?.message);
    return undefined;
}


export async function textToSpeech({ text }: TextToSpeechInput): Promise<TextToSpeechOutput> {
    const audioDataUri = await generateAudio(text);

    if (!audioDataUri) {
        throw new Error('No audio was generated from the text.');
    }
    
    return { audioDataUri };
}

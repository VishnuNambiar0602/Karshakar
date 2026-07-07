
'use server';
/**
 * @fileOverview A flow for generating a time-lapse video of an environmental metric.
 * - generateTimelapseVideo - Generates a video from a text prompt derived from dashboard settings.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { GenerateTimelapseVideoInputSchema, GenerateTimelapseVideoOutputSchema, type GenerateTimelapseVideoInput, type GenerateTimelapseVideoOutput } from '@/lib/types';

// Video model options to try in order
const VIDEO_MODELS = [
  'veo-3.0-generate-preview',
  'veo-2.0-generate-preview',
  'imagen-3.0-generate-001',
];

export async function generateTimelapseVideo({ metricName, locationDescription, startDate, endDate }: GenerateTimelapseVideoInput): Promise<GenerateTimelapseVideoOutput> {
    const prompt = `Create a cinematic, realistic time-lapse video showing the change in ${metricName} over the ${locationDescription} from ${startDate} to ${endDate}. 
      Show the landscape from a satellite's perspective. 
      If the metric is NDVI, visualize the change in vegetation greenness. 
      If it's NDWI, show the changes in surface water. 
      If it's NDBI, show the subtle expansion or contraction of built-up urban areas. 
      The video should be a smooth and continuous evolution.`;
    
    let operation;
    let lastError: Error | null = null;

    // Try each video model in order
    for (const modelName of VIDEO_MODELS) {
      try {
        const result = await ai.generate({
            model: googleAI.model(modelName),
            prompt,
        });
        operation = result.operation;
        if (operation) break; // Success, exit the loop
      } catch (e: any) {
        lastError = e;
        const errorMessage = e.message || '';
        
        // Billing/precondition errors - give specific message
        if (errorMessage.includes('FAILED_PRECONDITION') || errorMessage.includes('billing enabled')) {
            throw new Error("Video generation with Veo requires Google Cloud Platform billing to be enabled for your project. Please enable billing in your GCP account settings to use this feature.");
        }
        
        // Model not found - try next model
        if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('not supported')) {
          console.warn(`Video model ${modelName} not available, trying fallback...`);
          continue;
        }
        
        // Rate limit - try next model
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          console.warn(`Rate limit hit on video model ${modelName}, trying fallback...`);
          continue;
        }
        
        // Unknown error, throw
        throw e;
      }
    }


    if (!operation) {
      throw lastError || new Error('Video generation did not start correctly. All video models failed or are unavailable.');
    }

    // Poll for completion
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video || !video.media?.url) {
      throw new Error('Failed to find the generated video in the operation output.');
    }

    // The URL from Veo is temporary and needs authentication for access.
    // We will fetch it server-side and convert to a data URI to send to the client.
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key (GEMINI_API_KEY or GOOGLE_GENAI_API_KEY) environment variable is not set.");
    }
    const videoDownloadUrl = video.media.url;
    
    let videoResponse;
    try {
        const fetch = (await import('node-fetch')).default;
        // Use header instead of URL param to prevent key leak in logs
        videoResponse = await fetch(videoDownloadUrl, {
          headers: { 'x-goog-api-key': apiKey }
        });
    } catch (error: any) {
        throw new Error(`Network error while downloading video file: ${error.message}`);
    }

    if (!videoResponse.ok || !videoResponse.body) {
        throw new Error(`Failed to download video file. Status: ${videoResponse.status}`);
    }

    const arrayBuffer = await videoResponse.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);
    const videoBase64 = videoBuffer.toString('base64');
    const videoDataUri = `data:video/mp4;base64,${videoBase64}`;

    return { videoDataUri };
}

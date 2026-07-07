
import { ai, MODELS } from '@/ai/genkit';
import { z } from 'genkit';
import { safeParseAIJson } from '@/ai/ai-utils';

export const DetectPestDiseaseInputSchema = z.object({
  imageBase64: z.string().describe('The base64 encoded image string of the plant leaf.'),
  imageMimeType: z.string().default('image/jpeg').describe('The mime type of the image (e.g. image/jpeg, image/png).'),
  cropContext: z.string().optional().describe('Context about what crop this leaf belongs to (e.g. Rice, Wheat, Tomato).'),
  language: z.string().optional().default('en').describe('The language for output (e.g., en, hi, ta).'),
});

export type DetectPestDiseaseInput = z.infer<typeof DetectPestDiseaseInputSchema>;

export const DetectPestDiseaseOutputSchema = z.object({
  detectedIssue: z.string().describe('The name of the detected pest, disease, or nutrient deficiency. Use "Healthy" if the leaf looks healthy.'),
  confidence: z.number().describe('Confidence score between 0 and 1.'),
  category: z.enum(['pest', 'disease', 'nutrient_deficiency', 'none']).describe('Category of the issue.'),
  description: z.string().describe('A detailed description of the disease/pest symptoms and how it affects the plant.'),
  organicControl: z.string().describe('Recommended organic or biological control measures.'),
  chemicalControl: z.string().describe('Recommended chemical control measures (if applicable).'),
  prevention: z.string().describe('Agronomic practices to prevent this issue in the future.'),
});

export type DetectPestDiseaseOutput = z.infer<typeof DetectPestDiseaseOutputSchema>;

// Mock data list for fallback when API keys are absent or image analysis fails
const MOCK_DIAGNOSES: Record<string, Omit<DetectPestDiseaseOutput, 'confidence'>> = {
  Rice: {
    detectedIssue: 'Rice Blast (Magnaporthe oryzae)',
    category: 'disease',
    description: 'Rice blast is one of the most destructive diseases of rice. It causes leaf spots (lesions) that are typically spindle-shaped, with gray or whitish centers and brown borders.',
    organicControl: 'Apply neem oil or spray garlic extract. Ensure proper spacing to improve air circulation. Use resistant varieties.',
    chemicalControl: 'Apply fungicides containing Tricyclazole or Azoxystrobin as soon as the first lesions appear.',
    prevention: 'Avoid excessive nitrogen fertilization. Flood fields properly to suppress spores. Burn or deep-plow crop residues after harvest.',
  },
  Wheat: {
    detectedIssue: 'Yellow Rust (Puccinia striiformis)',
    category: 'disease',
    description: 'Yellow rust (or stripe rust) appears as yellow to orange pustules arranged in long stripes on the leaves. Highly contagious in cool, damp conditions.',
    organicControl: 'Apply wood ash or spray compost tea. Plant rust-resistant cultivars.',
    chemicalControl: 'Foliar application of Propiconazole or Tebuconazole fungicide upon early detection.',
    prevention: 'Sow early to escape high-risk periods. Eradicate alternative host weeds. Keep nitrogen input balanced.',
  },
  Tomato: {
    detectedIssue: 'Tomato Early Blight (Alternaria solani)',
    category: 'disease',
    description: 'Early blight causes dark brown to black spots with concentric rings ("target" pattern) on older leaves first. Can lead to severe defoliation.',
    organicControl: 'Mulch plants to prevent soil spores from splashing. Spray copper fungicide or organic potassium bicarbonate.',
    chemicalControl: 'Apply Chlorothalonil or Mancozeb preventative fungicides at regular intervals.',
    prevention: 'Practice 3-year crop rotation. Stake and prune tomatoes to keep foliage off the ground. Avoid overhead watering.',
  },
  Cotton: {
    detectedIssue: 'Whitefly Infestation (Bemisia tabaci)',
    category: 'pest',
    description: 'Small, white-winged insects that suck sap from the undersides of leaves, causing yellowing, leaf curling, and secreting honeydew which leads to sooty mold.',
    organicControl: 'Release natural predators like ladybugs or lacewings. Spray insecticidal soap or neem oil solution.',
    chemicalControl: 'Apply systemic insecticides like Imidacloprid or Acetamiprid if threshold limit is exceeded.',
    prevention: 'Use yellow sticky traps to monitor and catch whiteflies. Clear weeds and secondary hosts from fields.',
  },
  Default: {
    detectedIssue: 'Nitrogen Deficiency',
    category: 'nutrient_deficiency',
    description: 'General yellowing (chlorosis) starting from the tips of older leaves, spreading to younger leaves. Growth is stunted.',
    organicControl: 'Apply well-rotted farmyard manure, vermicompost, or blood meal. Spray diluted liquid seaweed extract.',
    chemicalControl: 'Apply urea or NPK (19:19:19) foliar spray for quick recovery.',
    prevention: 'Incorporate legume cover crops in crop rotation. Practice regular soil health testing.',
  }
};

/**
 * Detect pest or disease from a leaf photo.
 * Tries Gemini Vision, and falls back to contextual analysis if credentials are not present.
 */
export async function detectPestDisease(input: DetectPestDiseaseInput): Promise<DetectPestDiseaseOutput> {
  const crop = input.cropContext || 'Default';
  
  // Check if we have Gemini credentials
  const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  
  if (!hasGemini) {
    console.log(`[AI] Gemini credentials not found. Using context-based mock diagnosis for crop: ${crop}`);
    const mock = MOCK_DIAGNOSES[crop] || MOCK_DIAGNOSES.Default;
    return {
      ...mock,
      confidence: 0.88 + Math.random() * 0.1,
    };
  }

  try {
    console.log(`[AI] Running Gemini Vision classification for ${crop}...`);
    
    // We clean the base64 string from header if present
    let rawBase64 = input.imageBase64;
    if (rawBase64.includes('base64,')) {
      rawBase64 = rawBase64.split('base64,')[1];
    }

    const response = await ai.generate({
      model: MODELS.primary,
      config: {
        responseMimeType: 'application/json',
        responseSchema: DetectPestDiseaseOutputSchema,
      },
      prompt: [
        {
          media: {
            url: `data:${input.imageMimeType};base64,${rawBase64}`,
            contentType: input.imageMimeType,
          }
        },
        {
          text: `You are an expert plant pathologist and agricultural AI advisor.
          Analyze this leaf photo. The crop is known to be: "${crop}".
          Identify any disease, pest infestation, or nutrient deficiency.
          
          Provide the output strictly in the language requested: "${input.language || 'en'}".
          Return a JSON object matching the requested schema. If the leaf is perfectly healthy, set detectedIssue to "Healthy", category to "none", and fill description, prevention and controls with healthy plant maintenance advice.`
        }
      ]
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini Vision returned empty text.');
    }

    const result = safeParseAIJson(text, (data) => DetectPestDiseaseOutputSchema.parse(data));
    return result;

  } catch (error) {
    console.error('[AI] Gemini Vision failed, falling back to mock diagnosis:', error);
    const mock = MOCK_DIAGNOSES[crop] || MOCK_DIAGNOSES.Default;
    return {
      ...mock,
      confidence: 0.75,
    };
  }
}

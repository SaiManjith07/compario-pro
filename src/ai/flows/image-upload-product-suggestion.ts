'use server';

/**
 * @fileOverview Image upload and product suggestion flow.
 *
 * This flow takes an image as input, detects the product using Google Vision API,
 * and suggests similar product names using GenAI.
 *
 * @exported
 * - `imageUploadProductSuggestion`: The main function to trigger the flow.
 * - `ImageUploadProductSuggestionInput`: The input type for the flow.
 * - `ImageUploadProductSuggestionOutput`: The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageUploadProductSuggestionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageUploadProductSuggestionInput = z.infer<
  typeof ImageUploadProductSuggestionInputSchema
>;

const ImageUploadProductSuggestionOutputSchema = z.object({
  productName: z.string().describe('The detected product name.'),
  labels: z.array(z.string()).describe('Labels extracted from the image.'),
  suggestedProductNames: z
    .array(z.string())
    .describe('Suggested similar product names.'),
});

export type ImageUploadProductSuggestionOutput = z.infer<
  typeof ImageUploadProductSuggestionOutputSchema
>;

export async function imageUploadProductSuggestion(
  input: ImageUploadProductSuggestionInput
): Promise<ImageUploadProductSuggestionOutput> {
  return imageUploadProductSuggestionFlow(input);
}

const productIdentificationPrompt = ai.definePrompt({
  name: 'productIdentificationPrompt',
  input: {
    schema: ImageUploadProductSuggestionInputSchema,
  },
  output: {
    schema: z.object({
      productName: z.string().describe('The detected product name, including its brand and model.'),
      labels: z.array(z.string()).describe('Labels extracted from the image.'),
    }),
  },
  prompt: `You are a highly precise product identification engine. Your sole purpose is to analyze an image and extract the exact product name, brand, and model from it.

CRITICAL INSTRUCTIONS:
1.  **Prioritize Visible Information:** Base your identification strictly on any visible text, logos, or branding on the product in the image.
2.  **Do Not Hallucinate:** If you cannot clearly identify a brand or model from the image, state that. Do not guess or suggest similar-sounding brands.
3.  **Be Specific:** Provide the most specific name possible. For example, instead of "headphones," identify it as "Sony WH-1000XM5 Headphones" if that information is visible. Instead of "iPhone", identify it as "iPhone 15 Pro Max" if the details are discernible.

Analyze the attached image and return the product name.

Image: {{media url=photoDataUri}}`,
});


const productSuggestionPrompt = ai.definePrompt({
  name: 'productSuggestionPrompt',
  input: {
    schema: z.object({
      productName: z.string(),
      labels: z.array(z.string()),
    }),
  },
  output: {
    schema: z.object({
      suggestedProductNames: z
        .array(z.string())
        .describe('Suggested similar product names.'),
    }),
  },
  prompt: `Given the product name "{{productName}}" and labels "{{labels}}", suggest 3 similar product names. Return them as a JSON array.`,
});

const imageUploadProductSuggestionFlow = ai.defineFlow(
  {
    name: 'imageUploadProductSuggestionFlow',
    inputSchema: ImageUploadProductSuggestionInputSchema,
    outputSchema: ImageUploadProductSuggestionOutputSchema,
  },
  async input => {
    // Call Genkit Vision prompt to extract labels + best matching product name
    const { output: visionApiResult } = await productIdentificationPrompt(input);

    if (!visionApiResult) {
        throw new Error("Could not identify product from image.");
    }
    
    // Extract labels and product name from the result
    const { productName, labels } = visionApiResult;

    // Call the product suggestion prompt to get similar product names
    const {output} = await productSuggestionPrompt({
      productName: productName,
      labels: labels,
    });

    if (!output) {
        throw new Error("Could not generate product suggestions.");
    }

    // Return the combined result
    return {
      productName: productName,
      labels: labels,
      suggestedProductNames: output.suggestedProductNames,
    };
  }
);

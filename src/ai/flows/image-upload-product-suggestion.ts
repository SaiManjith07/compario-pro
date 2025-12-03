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
      productName: z.string().describe('The detected product name, including its brand.'),
      labels: z.array(z.string()).describe('Labels extracted from the image.'),
    }),
  },
  prompt: `Based on the attached image, identify the main product shown, including its brand if possible. Provide a concise product name (e.g., "Apple iPhone 15 Pro") and up to 3 relevant labels.

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

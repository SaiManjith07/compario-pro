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
      'A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
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
  prompt: `Given the product name "{{productName}}" and labels "{{labels}}", suggest 3 similar product names. Return them as a JSON array.`, // Updated prompt instructions and format
});

const imageUploadProductSuggestionFlow = ai.defineFlow(
  {
    name: 'imageUploadProductSuggestionFlow',
    inputSchema: ImageUploadProductSuggestionInputSchema,
    outputSchema: ImageUploadProductSuggestionOutputSchema,
  },
  async input => {
    // Call Google Vision API to extract labels + best matching product name
    const visionApiResult = await callGoogleVisionAPI(input.photoDataUri);

    // Extract labels and product name from Google Vision API result
    const productName = visionApiResult.productName;
    const labels = visionApiResult.labels;

    // Call the product suggestion prompt to get similar product names
    const {output} = await productSuggestionPrompt({
      productName: productName,
      labels: labels,
    });

    // Return the combined result
    return {
      productName: productName,
      labels: labels,
      suggestedProductNames: output!.suggestedProductNames,
    };
  }
);

// Dummy implementation for Google Vision API call
async function callGoogleVisionAPI(photoDataUri: string): Promise<{
  productName: string;
  labels: string[];
}> {
  // Simulate Google Vision API response
  return {
    productName: 'iPhone 13',
    labels: ['phone', 'electronics', 'iphone'],
  };
}

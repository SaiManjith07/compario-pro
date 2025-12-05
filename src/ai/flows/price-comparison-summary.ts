'use server';

/**
 * @fileOverview A price comparison summary AI agent.
 *
 * - getPriceComparisonSummary - A function that handles the price comparison summary process.
 * - PriceComparisonSummaryInput - The input type for the getPriceComparisonSummary function.
 * - PriceComparisonSummaryOutput - The return type for the getPriceComparisonSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PriceComparisonSummaryInputSchema = z.object({
  productName: z.string().describe('The name of the product being compared.'),
  results: z.array(
    z.object({
      store: z.string().describe('The name of the store.'),
      title: z.string().describe('The title of the product in the store.'),
      price: z.number().describe('The price of the product in the store.'),
      url: z.string().url().describe('The URL of the product page in the store.'),
      image: z.string().url().describe('The URL of the product image in the store.').optional(),
    })
  ).describe('An array of price comparison results from different stores.'),
});
export type PriceComparisonSummaryInput = z.infer<typeof PriceComparisonSummaryInputSchema>;

const PriceComparisonSummaryOutputSchema = z.object({
  summary: z.string().describe('A short summary of the price comparison, highlighting key differences and best deals.'),
});
export type PriceComparisonSummaryOutput = z.infer<typeof PriceComparisonSummaryOutputSchema>;

export async function getPriceComparisonSummary(input: PriceComparisonSummaryInput): Promise<PriceComparisonSummaryOutput> {
  return priceComparisonSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'priceComparisonSummaryPrompt',
  input: {schema: PriceComparisonSummaryInputSchema},
  output: {schema: PriceComparisonSummaryOutputSchema},
  prompt: `You are an AI assistant that summarizes price comparisons for products. The currency for all prices is Indian Rupees (₹).

  Given the product name and a list of price comparison results from different stores, your task is to generate a concise summary. This summary should highlight the key differences and the best deals available. Always use the '₹' symbol for prices in your summary.

  Product Name: {{{productName}}}

  Price Comparison Results (in ₹):
  {{#each results}}
  - Store: {{store}}, Title: {{title}}, Price: {{price}}, URL: {{url}}
  {{/each}}

  Summary:`, // Keep it simple and concise
});

const priceComparisonSummaryFlow = ai.defineFlow(
  {
    name: 'priceComparisonSummaryFlow',
    inputSchema: PriceComparisonSummaryInputSchema,
    outputSchema: PriceComparisonSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

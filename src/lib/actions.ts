'use server';

import { imageUploadProductSuggestion } from '@/ai/flows/image-upload-product-suggestion';
import { getPriceComparisonSummary } from '@/ai/flows/price-comparison-summary';
import type { ComparisonData, PriceResult } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

async function fileToDataURI(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  return `data:${file.type};base64,${base64}`;
}

export async function detectProductFromImage(prevState: any, formData: FormData) {
  const imageFile = formData.get('image') as File;

  if (!imageFile || imageFile.size === 0) {
    return { status: 'error', message: 'Please select an image file.' };
  }

  try {
    const dataUri = await fileToDataURI(imageFile);
    const result = await imageUploadProductSuggestion({ photoDataUri: dataUri });

    return {
      status: 'success',
      productName: result.productName,
      suggestedNames: result.suggestedProductNames,
      labels: result.labels,
    };
  } catch (error) {
    console.error('Error in detectProductFromImage:', error);
    return { status: 'error', message: 'Failed to detect product from image. Please try again.' };
  }
}

function generateMockPrices(productName: string): PriceResult[] {
  const stores = ['Amazon', 'eBay'];
  const results: PriceResult[] = [];
  const basePrice = 500 + Math.random() * 500;

  if (PlaceHolderImages.length === 0) {
    return [];
  }

  stores.forEach((store) => {
    const priceVariation = (Math.random() - 0.5) * 100;
    const price = parseFloat((basePrice + priceVariation).toFixed(2));
    const imageIndex = Math.floor(Math.random() * PlaceHolderImages.length);

    results.push({
      store,
      title: `${productName} - ${store} Special Edition`,
      price,
      url: `https://example.com/${store.toLowerCase()}/${productName.replace(/\s/g, '-')}`,
      image: PlaceHolderImages[imageIndex].imageUrl,
    });
  });

  return results;
}

export async function searchPrices(productName: string): Promise<ComparisonData> {
  if (!productName) {
    throw new Error('Product name is required.');
  }

  const results = generateMockPrices(productName);

  if (results.length === 0) {
    return {
      productName,
      results: [],
      bestPrice: null,
      summary: 'No prices found for this product.',
    };
  }

  const summaryResult = await getPriceComparisonSummary({
    productName,
    results,
  });

  const bestPrice = results.reduce((best, current) => (current.price < best.price ? current : best), results[0]);

  return {
    productName,
    results,
    bestPrice,
    summary: summaryResult.summary,
  };
}


async function parseCsv(file: File): Promise<string[]> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map(h => h.trim());
    const productIndex = header.findIndex(h => h.toLowerCase() === 'productname');

    if (productIndex === -1) {
        throw new Error("CSV must have a 'ProductName' column.");
    }

    return lines.slice(1).map(line => {
        const columns = line.split(',');
        return columns[productIndex]?.trim();
    }).filter(Boolean);
}


export async function processCsv(prevState: any, formData: FormData) {
    const csvFile = formData.get('csv') as File;

    if (!csvFile || csvFile.size === 0) {
        return { status: 'error', message: 'Please select a CSV file.' };
    }

    try {
        const productNames = await parseCsv(csvFile);
        
        const comparisonResults = await Promise.all(
            productNames.map(name => searchPrices(name))
        );

        return {
            status: 'success',
            results: comparisonResults,
        };

    } catch (error: any) {
        console.error('Error in processCsv:', error);
        return { status: 'error', message: error.message || 'Failed to process CSV file.' };
    }
}

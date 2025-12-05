'use server';

import { imageUploadProductSuggestion } from '@/ai/flows/image-upload-product-suggestion';
import { getPriceComparisonSummary } from '@/ai/flows/price-comparison-summary';
import type { ComparisonData, PriceResult, SearchHistoryEntry } from '@/lib/types';
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
  const stores = ['Amazon', 'eBay', 'Walmart', 'Best Buy', 'Target'];
  const results: PriceResult[] = [];
  
  // Use a hash of the product name to generate a more consistent base price
  const nameHash = productName.toLowerCase().split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  
  const basePrice = (Math.abs(nameHash) % 80000) + 10000; // Prices between ₹10,000 and ₹90,000

  stores.forEach((store, index) => {
    // Each store has a slightly different pricing strategy.
    let storeMultiplier: number;
    // Simple pseudo-random number generator based on hash and index to keep it deterministic
    const pseudoRandom = () => {
        let seed = nameHash + index * 100;
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    switch(store) {
      case 'Amazon':
        storeMultiplier = 0.95 + (pseudoRandom() * 0.1); // -5% to +5%
        break;
      case 'Walmart':
        storeMultiplier = 0.92 + (pseudoRandom() * 0.1); // -8% to +2% (often cheaper)
        break;
      case 'eBay':
        storeMultiplier = 0.98 + (pseudoRandom() * 0.15); // Wider range for marketplace
        break;
      case 'Best Buy':
        storeMultiplier = 1.0 + (pseudoRandom() * 0.1); // MSRP or slightly higher
        break;
      case 'Target':
        storeMultiplier = 0.97 + (pseudoRandom() * 0.12); // Competitive pricing
        break;
      default:
        storeMultiplier = 1.0;
    }

    const price = parseFloat((basePrice * storeMultiplier).toFixed(2));
    
    let url = '';
    const encodedProductName = encodeURIComponent(productName);
    switch (store) {
      case 'Amazon':
        url = `https://www.amazon.in/s?k=${encodedProductName}`;
        break;
      case 'eBay':
        url = `https://www.ebay.in/sch/i.html?_nkw=${encodedProductName}`;
        break;
      case 'Walmart':
        url = `https://www.walmart.com/search?q=${encodedProductName}`;
        break;
      case 'Best Buy':
        url = `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedProductName}`;
        break;
      case 'Target':
        url = `https://www.target.com/s?searchTerm=${encodedProductName}`;
        break;
      default:
        url = `https://www.google.com/search?q=${encodedProductName}+${encodeURIComponent(store)}`;
    }

    results.push({
      store,
      title: `${productName}`,
      price,
      url,
    });
  });

  return results.sort((a, b) => a.price - b.price);
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
      summary: `We couldn't find any reliable prices for "${productName}" at the moment. Please try a different search term or check back later.`,
    };
  }

  const summaryResult = await getPriceComparisonSummary({
    productName,
    results,
  });

  const bestPrice = results.length > 0 
    ? results.reduce((best, current) => (current.price < best.price ? current : best), results[0])
    : null;

  return {
    productName,
    results,
    bestPrice,
    summary: summaryResult.summary,
  };
}


async function parseCsv(file: File): Promise<string[]> {
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (lines.length < 2) return [];

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.replace(/"/g, '').trim());
    const productIndex = headers.indexOf('productname');

    if (productIndex === -1) {
        throw new Error("CSV must have a 'ProductName' column.");
    }

    return lines.slice(1).map(line => {
        // This is a simple parser, for more complex CSVs a library would be better
        const columns = line.split(',');
        return columns[productIndex]?.replace(/"/g, '').trim();
    }).filter(Boolean);
}


export async function processCsv(prevState: any, formData: FormData) {
    const csvFile = formData.get('csv') as File;

    if (!csvFile || csvFile.size === 0) {
        return { status: 'error', message: 'Please select a CSV file.', results: [] };
    }

    try {
        const productNames = await parseCsv(csvFile);
        
        if (productNames.length === 0) {
            return { status: 'error', message: 'No products found in the CSV file.', results: [] };
        }
        
        const comparisonResults = await Promise.all(
            productNames.map(name => searchPrices(name))
        );

        return {
            status: 'success',
            results: comparisonResults,
            message: '',
        };

    } catch (error: any) {
        console.error('Error in processCsv:', error);
        return { status: 'error', message: error.message || 'Failed to process CSV file.', results: [] };
    }
}

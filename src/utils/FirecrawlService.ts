import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface ScrapePriceResponse {
  success: true;
  data: {
    price?: string;
    unavailable?: boolean;
    actualCondition?: string;
    usedFallback?: boolean;
    method?: string;
  };
}

interface ScrapeEbayResponse {
  success: true;
  data: {
    averagePrice: number;
    salesCount: number;
    soldItems: any[];
    searchUrl: string;
  };
}

interface ScrapePSAResponse {
  success: true;
  data: {
    certNumber: string;
    cardName: string;
    grade: string;
    year?: string;
    set?: string;
    cardNumber?: string;
    imageUrl?: string | null;
    game: string;
  };
}

interface Scrape130PointResponse {
  success: true;
  data: {
    averagePrice: number;
    salesCount: number;
    sales: any[];
    searchUrl: string;
    query: string;
  };
}

type FirecrawlResponse = ScrapePriceResponse | ScrapeEbayResponse | ScrapePSAResponse | Scrape130PointResponse | ErrorResponse;

export class FirecrawlService {
  private static firecrawlApp: FirecrawlApp | null = null;
  private static readonly API_KEY = 'fc-2dea0a85f9e84cb6ae0783193103e207';

  private static getApp(): FirecrawlApp {
    if (!this.firecrawlApp) {
      this.firecrawlApp = new FirecrawlApp({ apiKey: this.API_KEY });
    }
    return this.firecrawlApp;
  }

  // Scrape TCGPlayer prices with proper DOM parsing
  static async scrapeTCGPlayerPrice(
    productId: string,
    condition: string,
    language: string = 'English',
    isFirstEdition: boolean = false,
    isHolo: boolean = false,
    isReverseHolo: boolean = false
  ): Promise<FirecrawlResponse> {
    try {
      console.log('Scraping TCGPlayer price with Firecrawl:', { productId, condition });
      
      // Build the TCGPlayer URL
      let url = `https://www.tcgplayer.com/product/${productId}?Language=${language}&page=1`;
      
      if (isFirstEdition === true && isHolo === true) {
        url += '&Printing=1st+Edition+Holofoil';
      } else if (isFirstEdition === true && isReverseHolo === true) {
        url += '&Printing=1st+Edition+Reverse+Holofoil';
      } else if (isFirstEdition === true) {
        url += '&Printing=1st+Edition';
      } else if (isHolo === true) {
        url += '&Printing=Holofoil';
      } else if (isReverseHolo === true) {
        url += '&Printing=Reverse+Holofoil';
      }
      
      if (condition) {
        const formattedCondition = condition 
          ? condition.split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join('+')
          : 'Near+Mint';
        url += `&Condition=${formattedCondition}`;
      }

      const app = this.getApp();
      const scrapeResult = await app.scrapeUrl(url, {
        formats: ['html'],
        timeout: 30000,
        waitFor: 3000
      });

      if (!scrapeResult.success) {
        console.error('Firecrawl scrape failed:', scrapeResult);
        return { success: false, error: 'Failed to scrape TCGPlayer page with Firecrawl' };
      }

      const htmlContent = (scrapeResult as any).data?.html || '';
      console.log('Firecrawl HTML received:', { 
        length: htmlContent.length,
        containsPrice: htmlContent.includes('$'),
        snippet: htmlContent.substring(0, 500)
      });

      // Parse HTML using DOMParser (browser environment)
      let doc: Document;
      if (typeof window !== 'undefined' && window.DOMParser) {
        const parser = new DOMParser();
        doc = parser.parseFromString(htmlContent, 'text/html');
      } else {
        // For Node.js environment, use jsdom or similar
        try {
          const { JSDOM } = await import('jsdom');
          const dom = new JSDOM(htmlContent);
          doc = dom.window.document;
        } catch (e) {
          console.log('JSDOM not available, falling back to regex');
          doc = null as any;
        }
      }

      // Use TCGPlayer-specific selectors (matching edge function)
      const priceSelectors = [
        ".spotlight__price",
        "[data-testid='price-guide-price']",
        ".price-guide__spotlight-price",
        ".price-points__point-value", // Additional selector
        ".inventory__price" // Additional selector
      ];
      
      let price: string | undefined;
      if (doc) {
        for (const selector of priceSelectors) {
          const priceEl = doc.querySelector(selector);
          if (priceEl?.textContent) {
            price = priceEl.textContent.trim();
            console.log('Found price with selector:', { selector, price });
            break;
          }
        }
      }

      // Fallback to regex if DOM parsing fails
      if (!price) {
        console.log('DOM selectors failed, trying regex fallback');
        const priceMatches = htmlContent.match(/\$[\d,]+\.?\d*/g);
        if (priceMatches && priceMatches.length > 0) {
          price = priceMatches[0];
          console.log('Found price with regex:', price);
        }
      }
      
      if (!price) {
        console.error('No price found in Firecrawl response');
        return {
          success: true,
          data: { 
            price: "0.00", 
            unavailable: true,
            actualCondition: condition,
            method: 'firecrawl'
          }
        };
      }

      // Clean and validate price (matching edge function logic)
      const cleanPrice = price.replace(/[^0-9.]/g, '');
      const priceValue = parseFloat(cleanPrice);
      
      if (!cleanPrice || isNaN(priceValue) || !isFinite(priceValue)) {
        console.error('Invalid price format:', { price, cleanPrice, priceValue });
        return {
          success: true,
          data: { 
            price: "0.00", 
            unavailable: true,
            actualCondition: condition,
            method: 'firecrawl'
          }
        };
      }

      const formattedPrice = priceValue.toFixed(2);
      console.log('Successfully extracted price:', { 
        raw: price, 
        cleaned: cleanPrice, 
        formatted: formattedPrice 
      });

      return {
        success: true,
        data: {
          price: formattedPrice,
          unavailable: false,
          actualCondition: condition,
          method: 'firecrawl'
        }
      };
    } catch (error) {
      console.error('Error scraping TCGPlayer with Firecrawl:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Firecrawl scraping failed' };
    }
  }

  // Scrape eBay sold listings
  static async scrapeEbaySoldListings(searchQuery: string): Promise<FirecrawlResponse> {
    try {
      console.log('Scraping eBay sold listings with Firecrawl:', searchQuery);
      
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=0&LH_Sold=1&LH_Complete=1&_sop=13`;

      const app = this.getApp();
      const scrapeResult = await app.scrapeUrl(url, {
        formats: ['markdown', 'html']
      });

      if (!scrapeResult.success) {
        return { success: false, error: 'Failed to scrape eBay sold listings' };
      }

      // Parse HTML to extract sold items
      const htmlContent = (scrapeResult as any).data?.html || '';
      const priceMatches = [...htmlContent.matchAll(/\$[\d,]+\.?\d*/g)];
      
      if (priceMatches.length === 0) {
        return { success: false, error: 'No sold items found' };
      }

      const prices = priceMatches.slice(0, 20).map(match => {
        const priceString = match[0].replace(/[^\d.]/g, '');
        return parseFloat(priceString);
      }).filter(price => !isNaN(price) && price > 0);

      const soldItems = prices.map((price, index) => ({
        title: `Sold Item ${index + 1}`,
        price,
        soldDate: new Date().toISOString(),
        url: url
      }));

      const averagePrice = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;

      return {
        success: true,
        data: {
          averagePrice: parseFloat(averagePrice.toFixed(2)),
          salesCount: soldItems.length,
          soldItems,
          searchUrl: url
        }
      };
    } catch (error) {
      console.error('Error scraping eBay with Firecrawl:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Scrape PSA certificate data
  static async scrapePSACertificate(certNumber: string): Promise<FirecrawlResponse> {
    try {
      console.log('Scraping PSA certificate with Firecrawl:', certNumber);
      
      const url = `https://www.psacard.com/cert/${certNumber}`;

      const app = this.getApp();
      const scrapeResult = await app.scrapeUrl(url, {
        formats: ['markdown', 'html']
      });

      if (!scrapeResult.success) {
        return { success: false, error: 'Failed to scrape PSA certificate' };
      }

      // Parse HTML to extract certificate data
      const htmlContent = (scrapeResult as any).data?.html || '';
      const markdownContent = (scrapeResult as any).data?.markdown || '';
      
      // Extract card name, grade, etc. from content
      const gradeMatch = markdownContent.match(/Grade\s*:?\s*(\d+)/i) || htmlContent.match(/Grade\s*:?\s*(\d+)/i);
      const cardNameMatch = markdownContent.match(/Card\s*:?\s*([^\n\r]+)/i) || htmlContent.match(/<title[^>]*>([^<]+)/i);
      
      const extractedData = {
        cardName: cardNameMatch?.[1]?.trim() || 'Unknown Card',
        grade: gradeMatch?.[1] || '10',
        year: undefined,
        set: undefined,
        cardNumber: undefined,
        imageUrl: undefined
      };
      
      return {
        success: true,
        data: {
          certNumber,
          cardName: extractedData.cardName || 'Unknown Card',
          grade: extractedData.grade || '10',
          year: extractedData.year,
          set: extractedData.set,
          cardNumber: extractedData.cardNumber,
          imageUrl: extractedData.imageUrl,
          game: 'pokemon' // Default to pokemon
        }
      };
    } catch (error) {
      console.error('Error scraping PSA with Firecrawl:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Scrape 130point.com sales data
  static async scrape130PointSales(
    cardName: string,
    setName: string,
    cardNumber: string,
    grade: string
  ): Promise<FirecrawlResponse> {
    try {
      console.log('Scraping 130point sales with Firecrawl:', { cardName, setName, cardNumber, grade });
      
      const searchQuery = `PSA ${grade} Pokemon ${cardName} ${setName} ${cardNumber}`.trim();
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://130point.com/sales/?search=${encodedQuery}&searchButton=&sortBy=date_desc`;

      const app = this.getApp();
      const scrapeResult = await app.scrapeUrl(url, {
        formats: ['markdown', 'html']
      });

      if (!scrapeResult.success) {
        return { success: false, error: 'Failed to scrape 130point sales data' };
      }

      // Parse HTML to extract sales data
      const htmlContent = (scrapeResult as any).data?.html || '';
      const priceMatches = [...htmlContent.matchAll(/\$[\d,]+\.?\d*/g)];
      
      if (priceMatches.length === 0) {
        return { success: false, error: 'No sales data found' };
      }

      const prices = priceMatches.slice(0, 15).map(match => {
        const priceString = match[0].replace(/[^\d.]/g, '');
        return parseFloat(priceString);
      }).filter(price => !isNaN(price) && price > 0);

      const sales = prices.map((price, index) => ({
        date: new Date().toISOString(),
        title: `Sale ${index + 1}`,
        price,
        auction: '130point',
        bids: '1'
      }));

      const averagePrice = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;

      return {
        success: true,
        data: {
          averagePrice: parseFloat(averagePrice.toFixed(2)),
          salesCount: sales.length,
          sales,
          searchUrl: url,
          query: searchQuery
        }
      };
    } catch (error) {
      console.error('Error scraping 130point with Firecrawl:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
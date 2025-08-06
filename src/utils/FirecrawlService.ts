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

  // Scrape TCGPlayer prices
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
        formats: ['markdown', 'html']
      });

      if (!scrapeResult.success) {
        return { success: false, error: 'Failed to scrape TCGPlayer page' };
      }

      // Extract price from HTML content
      const htmlContent = (scrapeResult as any).data?.html || '';
      const priceMatch = htmlContent.match(/\$[\d,]+\.?\d*/g);
      
      if (!priceMatch || priceMatch.length === 0) {
        return {
          success: true,
          data: { price: "0.00", unavailable: true }
        };
      }

      // Clean the price data
      const priceString = priceMatch[0].replace(/[^\d.]/g, '');
      const priceValue = parseFloat(priceString);
      
      if (isNaN(priceValue) || !isFinite(priceValue)) {
        return {
          success: true,
          data: { price: "0.00", unavailable: true }
        };
      }

      return {
        success: true,
        data: {
          price: priceValue.toFixed(2),
          unavailable: false,
          actualCondition: condition
        }
      };
    } catch (error) {
      console.error('Error scraping TCGPlayer with Firecrawl:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
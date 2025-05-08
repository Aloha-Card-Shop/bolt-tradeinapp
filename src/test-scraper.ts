import { fetchCardPrices } from './utils/scraper';

async function testScraper() {
  try {
    console.log('Starting scraper test...');
    
    const result = await fetchCardPrices(
      '497689', // Iono card ID
      'Near_Mint',
      false, // isFirstEdition
      false, // isHolo
      'pokemon'
    );
    
    console.log('Scraping Result:', result);
  } catch (error) {
    console.error('Scraping Error:', error);
  }
}

testScraper();
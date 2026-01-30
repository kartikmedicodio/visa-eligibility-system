import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

class USCISScraper {
  /**
   * Scrape USCIS page and extract eligibility requirements
   * @param {string} url - USCIS page URL
   * @returns {Promise<Object>} - Scraped content and structured data
   */
  async scrapePage(url) {
    try {
      // Try with axios first (faster for static pages)
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 30000
        });
        
        const $ = cheerio.load(response.data);
        return this.extractRequirements($, url);
      } catch (error) {
        // If axios fails, try with Puppeteer (for JavaScript-rendered pages)
        console.log('Axios failed, trying Puppeteer...');
        return await this.scrapeWithPuppeteer(url);
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Scrape using Puppeteer for dynamic content
   */
  async scrapeWithPuppeteer(url) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const content = await page.content();
      await browser.close();
      
      const $ = cheerio.load(content);
      return this.extractRequirements($, url);
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Extract eligibility requirements from HTML
   */
  extractRequirements($, url) {
    const requirements = [];
    const rawContent = $('body').text();
    
    // Find common patterns for requirements
    // Look for headings like "Requirements", "Eligibility", "Qualifications"
    const requirementKeywords = [
      'requirement', 'eligibility', 'qualification', 'criteria',
      'must have', 'must be', 'must provide', 'must demonstrate'
    ];
    
    // Extract from headings and lists
    $('h1, h2, h3, h4').each((i, elem) => {
      const text = $(elem).text().toLowerCase();
      if (requirementKeywords.some(keyword => text.includes(keyword))) {
        const section = $(elem).nextUntil('h1, h2, h3, h4');
        section.find('li, p').each((j, item) => {
          const requirementText = $(item).text().trim();
          if (requirementText.length > 20) { // Filter out very short text
            requirements.push({
              description: requirementText,
              category: this.categorizeRequirement(requirementText),
              required: true
            });
          }
        });
      }
    });
    
    // Also extract from bullet lists
    $('ul li, ol li').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.length > 20 && requirementKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
        requirements.push({
          description: text,
          category: this.categorizeRequirement(text),
          required: true
        });
      }
    });
    
    // If no requirements found, extract main content sections
    if (requirements.length === 0) {
      $('main article, .content, #content').find('p, li').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > 30 && text.length < 500) {
          requirements.push({
            description: text,
            category: this.categorizeRequirement(text),
            required: true
          });
        }
      });
    }
    
    // Remove duplicates
    const uniqueRequirements = requirements.filter((req, index, self) =>
      index === self.findIndex(r => r.description === req.description)
    );
    
    return {
      requirements: uniqueRequirements.slice(0, 50), // Limit to 50 requirements
      rawContent: rawContent.substring(0, 50000) // Limit raw content size
    };
  }

  /**
   * Categorize requirement based on keywords
   */
  categorizeRequirement(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('education') || lowerText.includes('degree') || lowerText.includes('diploma')) {
      return 'education';
    }
    if (lowerText.includes('employ') || lowerText.includes('job') || lowerText.includes('work')) {
      return 'employment';
    }
    if (lowerText.includes('financial') || lowerText.includes('income') || lowerText.includes('salary') || lowerText.includes('fund')) {
      return 'financial';
    }
    if (lowerText.includes('passport') || lowerText.includes('travel') || lowerText.includes('visa')) {
      return 'documentation';
    }
    if (lowerText.includes('experience') || lowerText.includes('year')) {
      return 'experience';
    }
    
    return 'general';
  }
}

export default new USCISScraper();


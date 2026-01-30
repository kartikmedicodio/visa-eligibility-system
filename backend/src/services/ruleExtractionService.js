import uscisScraper from './uscisScraper.js';
import VisaRule from '../models/VisaRule.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class RuleExtractionService {
  /**
   * Scrape USCIS page and extract structured eligibility rules
   * @param {string} visaType - Visa type code (e.g., 'H-1B')
   * @param {string} url - USCIS page URL (optional, will use default if not provided)
   * @returns {Promise<Object>} - Stored visa rule
   */
  async extractAndStoreRules(visaType, url = null) {
    try {
      // Get URL if not provided
      if (!url) {
        const { USCIS_URLS } = await import('../utils/uscisUrls.js');
        url = USCIS_URLS[visaType.toUpperCase()] || USCIS_URLS['H-1B'];
      }
      
      console.log(`Scraping ${visaType} from ${url}...`);
      
      // Scrape the page
      const scrapedData = await uscisScraper.scrapePage(url);
      
      // Use OpenAI to structure the requirements better
      const structuredRequirements = await this.structureRequirementsWithAI(
        scrapedData.requirements,
        visaType
      );
      
      // Store in database
      const visaRule = await VisaRule.findOneAndUpdate(
        { visaType: visaType.toUpperCase() },
        {
          visaType: visaType.toUpperCase(),
          requirements: structuredRequirements,
          sourceUrl: url,
          rawContent: scrapedData.rawContent,
          lastUpdated: new Date(),
          version: '1.0'
        },
        { upsert: true, new: true }
      );
      
      console.log(`Successfully stored rules for ${visaType}`);
      return visaRule;
    } catch (error) {
      console.error(`Error extracting rules for ${visaType}:`, error);
      throw error;
    }
  }

  /**
   * Use OpenAI to structure and enhance scraped requirements
   */
  async structureRequirementsWithAI(requirements, visaType) {
    try {
      const prompt = `You are an immigration law expert. Analyze the following eligibility requirements for ${visaType} visa and structure them into a JSON array.

For each requirement, extract:
- category: education, employment, financial, documentation, experience, or general
- description: clear, concise description
- required: true/false
- field: the data field this maps to (e.g., "educationLevel", "hasJobOffer", "yearsOfExperience")
- operator: comparison operator if applicable (==, !=, >, <, >=, <=, includes, exists)
- value: expected value if applicable
- weight: importance weight (1-10)

Requirements to analyze:
${JSON.stringify(requirements.slice(0, 30), null, 2)}

Return ONLY a valid JSON array of requirement objects, no other text.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at structuring immigration eligibility requirements. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // If response is not JSON, try to extract JSON from text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = { requirements: requirements };
        }
      }
      
      // Handle both array and object with array property
      return parsed.requirements || parsed.array || (Array.isArray(parsed) ? parsed : requirements);
    } catch (error) {
      console.error('Error structuring requirements with AI:', error);
      // Fallback to basic structure
      return requirements.map(req => ({
        category: req.category || 'general',
        description: req.description,
        required: req.required !== undefined ? req.required : true,
        field: null,
        operator: null,
        value: null,
        weight: 1
      }));
    }
  }

  /**
   * Get rules for a visa type
   */
  async getRules(visaType) {
    const rule = await VisaRule.findOne({ visaType: visaType.toUpperCase() });
    if (!rule) {
      throw new Error(`No rules found for visa type: ${visaType}`);
    }
    return rule;
  }

  /**
   * List all available visa types
   */
  async listAllVisaTypes() {
    const rules = await VisaRule.find({}, 'visaType lastUpdated version');
    return rules;
  }
}

export default new RuleExtractionService();


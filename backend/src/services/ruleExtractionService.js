import uscisScraper from './uscisScraper.js';
import VisaRule from '../models/VisaRule.js';
import dataCleaner from './dataCleaner.js';
import requirementOrganizer from './requirementOrganizer.js';
import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
};

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
      
      // Clean and normalize the scraped requirements first
      const cleanedRequirements = dataCleaner.clean(scrapedData.requirements);
      
      // Validate and set field mappings (CRITICAL for evaluation)
      const requirementsWithFields = requirementOrganizer.validateFieldMappings(cleanedRequirements);
      
      // Use OpenAI to structure the cleaned requirements better
      const structuredRequirements = await this.structureRequirementsWithAI(
        requirementsWithFields,
        visaType
      );
      
      // Organize by sections for better structure
      const requirementsBySection = requirementOrganizer.organizeBySection(structuredRequirements);
      
      // Store in database
      const visaRule = await VisaRule.findOneAndUpdate(
        { visaType: visaType.toUpperCase() },
        {
          visaType: visaType.toUpperCase(),
          requirements: structuredRequirements,  // Flat array for evaluation
          requirementsBySection: requirementsBySection,  // Grouped by sections for display
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
      const prompt = `You are an immigration law expert. Analyze the following eligibility requirements for ${visaType} visa and structure them into a JSON object with a "requirements" array.

For each requirement, extract:
- category: education, employment, financial, documentation, experience, or general
- description: clear, concise description (remove HTML, navigation items, keep only actual eligibility criteria)
- required: true/false (true for "must", "required", "mandatory"; false for "preferred", "should")
- field: the data field this maps to (e.g., "educationLevel", "hasJobOffer", "yearsOfExperience", "salary", "financialSupport")
- operator: comparison operator if applicable (==, !=, >, <, >=, <=, includes, exists)
- value: expected value if applicable (e.g., "bachelor", 3, true)
- weight: importance weight (1-10, where 10 is critical/mandatory)

IMPORTANT:
- Remove navigation items, menu items, and non-eligibility content
- Only include actual eligibility requirements
- Extract numeric values for years, salary amounts, etc.
- Map education levels: "bachelor" or "bachelor's" -> "bachelor", "master" or "master's" -> "master"

Requirements to analyze:
${JSON.stringify(requirements.slice(0, 40), null, 2)}

Return ONLY a valid JSON object with this structure:
{
  "requirements": [
    {
      "category": "education",
      "description": "Must have a bachelor's degree or equivalent",
      "required": true,
      "field": "educationLevel",
      "operator": ">=",
      "value": "bachelor",
      "weight": 10
    }
  ]
}`;

      const response = await getOpenAIClient().chat.completions.create({
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
          // Fallback: use cleaned requirements with basic structure
          return requirements.map(req => ({
            ...req,
            field: req.field || null,
            operator: req.operator || null,
            value: req.value || null,
            weight: req.weight || 1
          }));
        }
      }
      
      // Handle response structure
      let finalRequirements = parsed.requirements || parsed.array || (Array.isArray(parsed) ? parsed : []);
      
      // If OpenAI didn't return requirements, use cleaned requirements
      if (!finalRequirements || finalRequirements.length === 0) {
        finalRequirements = requirements;
      } else {
        // Merge OpenAI structured data with cleaned requirements
        // Prioritize: cleanedReq field mappings > OpenAI field mappings
        finalRequirements = finalRequirements.map((aiReq, idx) => {
          const cleanedReq = requirements[idx] || {};
          return {
            category: aiReq.category || cleanedReq.category || 'general',
            description: cleanedReq.description || aiReq.description || '',
            required: aiReq.required !== undefined ? aiReq.required : (cleanedReq.required !== undefined ? cleanedReq.required : true),
            // Prioritize cleaned field mappings (they're more accurate)
            field: cleanedReq.field || aiReq.field || null,
            operator: cleanedReq.operator || aiReq.operator || null,
            value: cleanedReq.value !== undefined ? cleanedReq.value : (aiReq.value !== undefined ? aiReq.value : null),
            weight: aiReq.weight || cleanedReq.weight || 1
          };
        });
      }
      
      // Final validation: ensure field mappings are set
      finalRequirements = requirementOrganizer.validateFieldMappings(finalRequirements);
      
      return finalRequirements;
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


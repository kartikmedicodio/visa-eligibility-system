import ruleExtractionService from '../services/ruleExtractionService.js';

export const scrapeRules = async (req, res, next) => {
  try {
    const { visaType, url } = req.body;

    if (!visaType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Visa type is required' 
      });
    }

    const rule = await ruleExtractionService.extractAndStoreRules(visaType, url);

    res.json({
      success: true,
      data: {
        visaType: rule.visaType,
        requirementsCount: rule.requirements.length,
        lastUpdated: rule.lastUpdated,
        sourceUrl: rule.sourceUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRules = async (req, res, next) => {
  try {
    const { visaType } = req.params;
    const rule = await ruleExtractionService.getRules(visaType);

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

export const listAllRules = async (req, res, next) => {
  try {
    const visaTypes = await ruleExtractionService.listAllVisaTypes();

    res.json({
      success: true,
      data: visaTypes
    });
  } catch (error) {
    next(error);
  }
};


import EligibilityResult from '../models/EligibilityResult.js';
import eligibilityEngine from '../services/eligibilityEngine.js';
import scoringService from '../services/scoringService.js';
import Application from '../models/Application.js';

export const checkEligibility = async (req, res, next) => {
  try {
    const { applicationId, visaTypes } = req.body;

    if (!applicationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Application ID is required' 
      });
    }

    // Get application and profile
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        error: 'Application not found' 
      });
    }

    if (!application.extractedProfile || Object.keys(application.extractedProfile).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Application documents not processed yet. Please process documents first.' 
      });
    }

    // Evaluate eligibility for specified visa types or all
    const evaluations = await eligibilityEngine.evaluateMultiple(
      application.extractedProfile,
      visaTypes
    );

    // Calculate scores and generate results
    const results = [];
    for (const evaluation of evaluations) {
      const score = scoringService.calculateScore(evaluation, application.extractedProfile);
      const recommendations = scoringService.generateRecommendations(
        evaluation,
        application.extractedProfile
      );

      // Save result to database
      const result = new EligibilityResult({
        applicationId: application._id,
        visaType: evaluation.visaType,
        isEligible: evaluation.isEligible,
        score: score,
        criteria: evaluation.criteria,
        missingRequirements: evaluation.missingRequirements,
        recommendations: recommendations,
        details: evaluation.details
      });

      await result.save();
      results.push(result);
    }

    // Update application status
    application.status = 'completed';
    await application.save();

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

export const getEligibilityResults = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const results = await EligibilityResult.find({ applicationId })
      .sort({ score: -1 });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};


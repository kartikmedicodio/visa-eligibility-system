import VisaRule from '../models/VisaRule.js';
import ruleExtractionService from './ruleExtractionService.js';

class EligibilityEngine {
  /**
   * Evaluate eligibility for a visa type
   * @param {string} visaType - Visa type to evaluate
   * @param {Object} applicantProfile - Extracted applicant data
   * @returns {Promise<Object>} - Eligibility assessment
   */
  async evaluateEligibility(visaType, applicantProfile) {
    try {
      // Get rules from database
      const rules = await ruleExtractionService.getRules(visaType);
      
      if (!rules || !rules.requirements || rules.requirements.length === 0) {
        throw new Error(`No eligibility rules found for ${visaType}`);
      }

      const evaluation = {
        visaType: visaType,
        isEligible: true,
        criteria: {},
        missingRequirements: [],
        metRequirements: [],
        details: {}
      };

      // Evaluate each requirement
      for (const requirement of rules.requirements) {
        const result = this.evaluateRequirement(requirement, applicantProfile);
        
        evaluation.criteria[requirement.field || requirement.category] = {
          required: requirement.required,
          met: result.met,
          description: requirement.description,
          value: result.value
        };

        if (result.met) {
          evaluation.metRequirements.push(requirement.description);
        } else if (requirement.required) {
          evaluation.missingRequirements.push(requirement.description);
          evaluation.isEligible = false;
        }
      }

      // Determine overall eligibility
      // If critical requirements are missing, not eligible
      const criticalMissing = evaluation.missingRequirements.filter(req => {
        const requirement = rules.requirements.find(r => r.description === req);
        return requirement && requirement.required;
      });

      if (criticalMissing.length > 0) {
        evaluation.isEligible = false;
      }

      return evaluation;
    } catch (error) {
      console.error('Error evaluating eligibility:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single requirement against applicant profile
   */
  evaluateRequirement(requirement, profile) {
    const field = requirement.field;
    const operator = requirement.operator;
    const expectedValue = requirement.value;

    // If no field specified, check if description matches any profile data
    if (!field) {
      // Simple keyword matching
      const description = requirement.description.toLowerCase();
      const profileStr = JSON.stringify(profile).toLowerCase();
      return {
        met: profileStr.includes(description.substring(0, 20)),
        value: null
      };
    }

    // Get value from profile using dot notation (e.g., "education.degrees")
    const value = this.getNestedValue(profile, field);

    if (value === undefined || value === null) {
      return { met: false, value: null };
    }

    // Apply operator
    switch (operator) {
      case '==':
        return { met: value == expectedValue, value };
      case '!=':
        return { met: value != expectedValue, value };
      case '>':
        return { met: value > expectedValue, value };
      case '<':
        return { met: value < expectedValue, value };
      case '>=':
        return { met: value >= expectedValue, value };
      case '<=':
        return { met: value <= expectedValue, value };
      case 'includes':
        if (Array.isArray(value)) {
          return { met: value.includes(expectedValue), value };
        }
        return { met: String(value).includes(String(expectedValue)), value };
      case 'exists':
        return { met: value !== null && value !== undefined, value };
      default:
        // Default: check if value exists and is truthy
        return { met: !!value, value };
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  }

  /**
   * Evaluate multiple visa types
   */
  async evaluateMultiple(applicantProfile, visaTypes = null) {
    try {
      let typesToEvaluate = visaTypes;
      
      if (!typesToEvaluate) {
        // Get all available visa types
        const allTypes = await ruleExtractionService.listAllVisaTypes();
        typesToEvaluate = allTypes.map(t => t.visaType);
      }

      const results = [];
      for (const visaType of typesToEvaluate) {
        try {
          const evaluation = await this.evaluateEligibility(visaType, applicantProfile);
          results.push(evaluation);
        } catch (error) {
          console.error(`Error evaluating ${visaType}:`, error.message);
        }
      }

      return results;
    } catch (error) {
      console.error('Error evaluating multiple visa types:', error);
      throw error;
    }
  }
}

export default new EligibilityEngine();


/**
 * Organize requirements by sections for better structure and display
 */
class RequirementOrganizer {
  /**
   * Group requirements by category/section
   */
  organizeBySection(requirements) {
    const grouped = {
      education: [],
      employment: [],
      financial: [],
      documentation: [],
      experience: [],
      general: []
    };

    for (const req of requirements) {
      const category = req.category || 'general';
      if (grouped[category]) {
        grouped[category].push(req);
      } else {
        grouped.general.push(req);
      }
    }

    // Remove empty sections
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  }

  /**
   * Ensure field mappings are correct for evaluation
   * This is critical for matching extracted document data to requirements
   */
  validateFieldMappings(requirements) {
    const fieldMapping = {
      // Education fields
      'educationLevel': 'education.degrees',
      'degree': 'education.degrees',
      'bachelor': 'education.degrees',
      'master': 'education.degrees',
      
      // Employment fields
      'hasJobOffer': 'employment.hasJobOffer',
      'jobOffer': 'employment.hasJobOffer',
      'employer': 'employment.companies',
      'position': 'employment.positions',
      'salary': 'employment.currentSalary',
      'wage': 'employment.currentSalary',
      
      // Experience fields
      'yearsOfExperience': 'employment.yearsOfExperience',
      'experience': 'employment.yearsOfExperience',
      
      // Financial fields
      'financialSupport': 'financial.income',
      'income': 'financial.income',
      'assets': 'financial.assets',
      'funds': 'financial.assets',
      
      // Documentation fields
      'hasPassport': 'personalInfo.passportNumber',
      'passport': 'personalInfo.passportNumber'
    };

    return requirements.map(req => {
      // If field is not set, try to infer from description
      if (!req.field) {
        const desc = req.description.toLowerCase();
        
        // Check for education
        if (desc.includes('degree') || desc.includes('bachelor') || desc.includes('master') || desc.includes('education')) {
          req.field = 'educationLevel';
          if (desc.includes('bachelor')) {
            req.operator = '>=';
            req.value = 'bachelor';
          } else if (desc.includes('master')) {
            req.operator = '>=';
            req.value = 'master';
          }
        }
        // Check for employment
        else if (desc.includes('job offer') || desc.includes('employer') || desc.includes('employment')) {
          req.field = 'hasJobOffer';
          req.operator = '==';
          req.value = true;
        }
        // Check for experience
        else if (desc.includes('year') && (desc.includes('experience') || desc.match(/\d+\s*year/))) {
          req.field = 'yearsOfExperience';
          const yearMatch = desc.match(/(\d+)\s*year/);
          if (yearMatch) {
            req.operator = '>=';
            req.value = parseInt(yearMatch[1]);
          }
        }
        // Check for financial
        else if (desc.includes('financial') || desc.includes('fund') || desc.includes('income') || desc.includes('salary')) {
          req.field = 'financialSupport';
          req.operator = 'exists';
        }
        // Check for passport
        else if (desc.includes('passport')) {
          req.field = 'hasPassport';
          req.operator = 'exists';
        }
      }

      return req;
    });
  }
}

export default new RequirementOrganizer();


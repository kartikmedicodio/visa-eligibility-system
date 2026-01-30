import eligibilityEngine from './eligibilityEngine.js';

class ScoringService {
  /**
   * Calculate eligibility score for a visa type
   * @param {Object} evaluation - Eligibility evaluation result
   * @param {Object} applicantProfile - Applicant profile data
   * @returns {number} - Score from 0-100
   */
  calculateScore(evaluation, applicantProfile) {
    let score = 0;
    const maxScore = 100;

    // Base score if eligible
    if (evaluation.isEligible) {
      score = 70; // Base score for meeting requirements
    } else {
      score = 30; // Lower base if not eligible
    }

    // Calculate based on met requirements
    const totalRequirements = evaluation.metRequirements.length + evaluation.missingRequirements.length;
    if (totalRequirements > 0) {
      const metRatio = evaluation.metRequirements.length / totalRequirements;
      score = Math.max(score, metRatio * 100);
    }

    // Bonus points for strong qualifications
    score += this.calculateBonusPoints(applicantProfile, evaluation.visaType);

    // Penalty for missing critical requirements
    if (evaluation.missingRequirements.length > 0) {
      const penalty = Math.min(evaluation.missingRequirements.length * 5, 30);
      score = Math.max(0, score - penalty);
    }

    // Ensure score is between 0-100
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Calculate bonus points based on profile strength
   */
  calculateBonusPoints(profile, visaType) {
    let bonus = 0;

    // Education bonus
    if (profile.education?.degrees?.length > 0) {
      const hasAdvancedDegree = profile.education.degrees.some(deg => 
        deg.toLowerCase().includes('master') || 
        deg.toLowerCase().includes('phd') ||
        deg.toLowerCase().includes('doctorate')
      );
      if (hasAdvancedDegree) bonus += 10;
      else bonus += 5;
    }

    // Experience bonus
    if (profile.employment?.yearsOfExperience) {
      const years = parseInt(profile.employment.yearsOfExperience) || 0;
      if (years >= 5) bonus += 10;
      else if (years >= 3) bonus += 5;
    }

    // Financial stability bonus
    if (profile.financial?.income || profile.financial?.assets) {
      bonus += 5;
    }

    // Visa-specific bonuses
    if (visaType === 'H-1B' && profile.employment?.currentSalary) {
      // Higher salary = better chance
      const salary = parseInt(profile.employment.currentSalary.replace(/[^0-9]/g, '')) || 0;
      if (salary > 100000) bonus += 10;
      else if (salary > 75000) bonus += 5;
    }

    if (visaType === 'EB-1' && profile.education?.degrees?.length > 0) {
      // Advanced degrees are important for EB-1
      bonus += 5;
    }

    return Math.min(bonus, 20); // Cap bonus at 20 points
  }

  /**
   * Generate recommendations based on evaluation
   */
  generateRecommendations(evaluation, applicantProfile) {
    const recommendations = [];

    // Recommendations for missing requirements
    if (evaluation.missingRequirements.length > 0) {
      recommendations.push(
        `Missing ${evaluation.missingRequirements.length} required criteria. Please provide additional documentation.`
      );
    }

    // Specific recommendations based on visa type
    if (evaluation.visaType === 'H-1B') {
      if (!applicantProfile.employment?.hasJobOffer) {
        recommendations.push('Obtain a job offer from a US employer.');
      }
      if (!applicantProfile.education?.degrees || applicantProfile.education.degrees.length === 0) {
        recommendations.push('Provide educational degree certificates.');
      }
    }

    if (evaluation.visaType === 'F-1') {
      if (!applicantProfile.education?.institutions || applicantProfile.education.institutions.length === 0) {
        recommendations.push('Provide acceptance letter from SEVP-certified school.');
      }
      if (!applicantProfile.financial?.income && !applicantProfile.financial?.assets) {
        recommendations.push('Provide proof of sufficient financial support.');
      }
    }

    if (evaluation.visaType === 'B-2') {
      if (!applicantProfile.financial?.income && !applicantProfile.financial?.assets) {
        recommendations.push('Provide proof of sufficient funds for travel.');
      }
      recommendations.push('Provide evidence of ties to home country.');
    }

    // General recommendations
    if (evaluation.score < 50) {
      recommendations.push('Consider consulting with an immigration attorney for guidance.');
    }

    return recommendations;
  }

  /**
   * Calculate score and generate full assessment
   */
  async generateFullAssessment(visaType, applicantProfile) {
    const eligibilityEngine = (await import('./eligibilityEngine.js')).default;
    const evaluation = await eligibilityEngine.evaluateEligibility(visaType, applicantProfile);
    const score = this.calculateScore(evaluation, applicantProfile);
    const recommendations = this.generateRecommendations(evaluation, applicantProfile);

    return {
      ...evaluation,
      score,
      recommendations
    };
  }
}

export default new ScoringService();


/**
 * Normalize extracted document data to match requirement field mappings
 */
class DataNormalizer {
  /**
   * Normalize education level from degrees array
   */
  normalizeEducationLevel(degrees) {
    if (!degrees || !Array.isArray(degrees) || degrees.length === 0) {
      return null;
    }

    const degreesStr = degrees.join(' ').toLowerCase();

    // Check for highest degree first
    if (degreesStr.includes('phd') || degreesStr.includes('doctorate') || degreesStr.includes('ph.d')) {
      return 'phd';
    }
    if (degreesStr.includes('master') || degreesStr.includes('m.s') || degreesStr.includes('mba') || degreesStr.includes('m.a')) {
      return 'master';
    }
    if (degreesStr.includes('bachelor') || degreesStr.includes('b.s') || degreesStr.includes('b.a') || degreesStr.includes('b.tech')) {
      return 'bachelor';
    }
    if (degreesStr.includes('diploma') || degreesStr.includes('certificate')) {
      return 'diploma';
    }

    return null;
  }

  /**
   * Calculate years of experience from employment data
   */
  calculateYearsOfExperience(employment) {
    if (!employment) return 0;

    // If already calculated, use it
    if (employment.yearsOfExperience && typeof employment.yearsOfExperience === 'number') {
      return employment.yearsOfExperience;
    }

    // Calculate from companies/positions count
    if (employment.companies && Array.isArray(employment.companies)) {
      // Estimate: each company = ~2-3 years
      return Math.max(employment.companies.length * 2, 1);
    }

    // Calculate from years array if available
    if (employment.years && Array.isArray(employment.years)) {
      const sortedYears = employment.years.filter(y => y && y > 1900 && y < 2100).sort();
      if (sortedYears.length >= 2) {
        return new Date().getFullYear() - sortedYears[0];
      }
    }

    return 0;
  }

  /**
   * Normalize salary to numeric value
   */
  normalizeSalary(salary) {
    if (!salary) return null;

    // If already a number
    if (typeof salary === 'number') {
      return salary;
    }

    // Extract number from string (remove currency symbols, commas)
    const salaryStr = String(salary).replace(/[^0-9.]/g, '');
    const numValue = parseFloat(salaryStr);

    return isNaN(numValue) ? null : numValue;
  }

  /**
   * Determine if job offer exists
   */
  hasJobOffer(employment) {
    if (!employment) return false;

    // Check explicit field
    if (employment.hasJobOffer !== undefined) {
      return Boolean(employment.hasJobOffer);
    }

    // Check if current employer or job title exists
    if (employment.companies && employment.companies.length > 0) {
      return true;
    }

    if (employment.positions && employment.positions.length > 0) {
      return true;
    }

    if (employment.currentSalary || employment.salary) {
      return true;
    }

    return false;
  }

  /**
   * Check financial support availability
   */
  hasFinancialSupport(financial) {
    if (!financial) return false;

    // Check explicit field
    if (financial.financialSupport !== undefined) {
      return Boolean(financial.financialSupport);
    }

    // Check if income or assets exist
    const income = this.normalizeSalary(financial.income);
    const assets = this.normalizeSalary(financial.assets);

    return (income && income > 0) || (assets && assets > 0) || financial.bankStatements === true;
  }

  /**
   * Normalize entire extracted data structure
   */
  normalize(extractedData) {
    if (!extractedData) {
      return {
        personalInfo: {},
        education: {},
        employment: {},
        financial: {},
        other: {}
      };
    }

    const normalized = {
      personalInfo: {
        ...extractedData.personalInfo,
        hasPassport: extractedData.personalInfo?.passportNumber ? true : false
      },
      education: {
        ...extractedData.education,
        educationLevel: this.normalizeEducationLevel(extractedData.education?.degrees),
        highestDegree: this.normalizeEducationLevel(extractedData.education?.degrees)
      },
      employment: {
        ...extractedData.employment,
        yearsOfExperience: this.calculateYearsOfExperience(extractedData.employment),
        hasJobOffer: this.hasJobOffer(extractedData.employment),
        currentSalary: this.normalizeSalary(extractedData.employment?.currentSalary || extractedData.employment?.salary)
      },
      financial: {
        ...extractedData.financial,
        financialSupport: this.hasFinancialSupport(extractedData.financial),
        income: this.normalizeSalary(extractedData.financial?.income),
        assets: this.normalizeSalary(extractedData.financial?.assets)
      },
      other: extractedData.other || {}
    };

    return normalized;
  }
}

export default new DataNormalizer();


class DataCleaner {
  /**
   * Clean and normalize scraped requirements
   */
  cleanRequirements(requirements) {
    if (!Array.isArray(requirements)) {
      return [];
    }

    return requirements
      .map(req => this.cleanRequirement(req))
      .filter(req => this.isValidRequirement(req))
      .map(req => this.normalizeRequirement(req));
  }

  /**
   * Clean a single requirement
   */
  cleanRequirement(requirement) {
    if (!requirement || !requirement.description) {
      return null;
    }

    let description = requirement.description;

    // Remove HTML tags
    description = description.replace(/<[^>]*>/g, '');

    // Remove excessive whitespace and newlines
    description = description.replace(/\s+/g, ' ').trim();

    // Remove navigation/menu items
    const navigationKeywords = [
      'skip to main content',
      'sign in',
      'create account',
      'menu',
      'topics',
      'forms',
      'newsroom',
      'citizenship',
      'green card',
      'laws',
      'tools',
      'contact us',
      'multilingual resources',
      'breadcrumb',
      'return to top',
      'was this page helpful',
      'official website',
      'privacy policy',
      'site map',
      'a-z index'
    ];

    const lowerDesc = description.toLowerCase();
    if (navigationKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return null;
    }

    // Remove very short descriptions (likely navigation items)
    if (description.length < 20) {
      return null;
    }

    // Remove very long descriptions (likely containing multiple items)
    if (description.length > 500) {
      return null;
    }

    // Remove descriptions that are mostly navigation links
    if (description.split(/\s+/).length > 50) {
      return null;
    }

    return {
      ...requirement,
      description: description
    };
  }

  /**
   * Check if requirement is valid
   */
  isValidRequirement(requirement) {
    if (!requirement || !requirement.description) {
      return false;
    }

    const desc = requirement.description.toLowerCase();

    // Must contain eligibility-related keywords
    const eligibilityKeywords = [
      'require', 'must', 'need', 'qualify', 'eligible', 'criteria',
      'degree', 'education', 'experience', 'employment', 'job',
      'employer', 'salary', 'wage', 'financial', 'fund',
      'passport', 'visa', 'document', 'application', 'petition',
      'bachelor', 'master', 'phd', 'diploma', 'certificate',
      'year', 'month', 'minimum', 'maximum', 'at least'
    ];

    const hasEligibilityKeyword = eligibilityKeywords.some(keyword => 
      desc.includes(keyword)
    );

    if (!hasEligibilityKeyword) {
      return false;
    }

    // Exclude common non-requirement phrases
    const excludePhrases = [
      'click here', 'learn more', 'read more', 'see also',
      'related links', 'additional information', 'for more',
      'this page', 'last reviewed', 'was this helpful'
    ];

    const hasExcludePhrase = excludePhrases.some(phrase => 
      desc.includes(phrase)
    );

    if (hasExcludePhrase) {
      return false;
    }

    return true;
  }

  /**
   * Normalize requirement structure
   */
  normalizeRequirement(requirement) {
    const desc = requirement.description.toLowerCase();

    // Extract field mappings
    let field = requirement.field;
    let operator = requirement.operator;
    let value = requirement.value;

    // Auto-detect field based on content
    if (!field) {
      if (desc.includes('degree') || desc.includes('education') || desc.includes('bachelor') || desc.includes('master')) {
        field = 'educationLevel';
      } else if (desc.includes('experience') || desc.includes('year')) {
        field = 'yearsOfExperience';
      } else if (desc.includes('employ') || desc.includes('job offer')) {
        field = 'hasJobOffer';
      } else if (desc.includes('salary') || desc.includes('wage') || desc.includes('income')) {
        field = 'salary';
      } else if (desc.includes('financial') || desc.includes('fund')) {
        field = 'financialSupport';
      } else if (desc.includes('passport')) {
        field = 'hasPassport';
      }
    }

    // Extract operator and value
    if (!operator) {
      if (desc.includes('at least') || desc.includes('minimum') || desc.includes('more than')) {
        operator = '>=';
        // Try to extract numeric value
        const numMatch = desc.match(/(\d+)\s*(?:year|month|month)/i);
        if (numMatch) {
          value = parseInt(numMatch[1]);
        }
      } else if (desc.includes('less than') || desc.includes('maximum')) {
        operator = '<=';
        const numMatch = desc.match(/(\d+)\s*(?:year|month)/i);
        if (numMatch) {
          value = parseInt(numMatch[1]);
        }
      } else if (desc.includes('must have') || desc.includes('required') || desc.includes('must be')) {
        operator = 'exists';
        value = true;
      } else if (desc.includes('bachelor') || desc.includes("bachelor's")) {
        operator = '>=';
        value = 'bachelor';
        field = 'educationLevel';
      } else if (desc.includes('master') || desc.includes("master's")) {
        operator = '>=';
        value = 'master';
        field = 'educationLevel';
      }
    }

    // Set weight based on keywords
    let weight = requirement.weight || 1;
    if (desc.includes('must') || desc.includes('required') || desc.includes('mandatory')) {
      weight = 10; // Critical requirement
    } else if (desc.includes('should') || desc.includes('preferred')) {
      weight = 5; // Preferred but not required
    }

    return {
      category: requirement.category || 'general',
      description: requirement.description,
      required: requirement.required !== undefined ? requirement.required : (weight >= 8),
      field: field,
      operator: operator,
      value: value,
      weight: weight
    };
  }

  /**
   * Remove duplicates based on description similarity
   */
  removeDuplicates(requirements) {
    const seen = new Set();
    const cleaned = [];

    for (const req of requirements) {
      // Create a normalized key for comparison
      const key = req.description
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100); // Use first 100 chars for comparison

      if (!seen.has(key)) {
        seen.add(key);
        cleaned.push(req);
      }
    }

    return cleaned;
  }

  /**
   * Full cleaning pipeline
   */
  clean(requirements) {
    let cleaned = this.cleanRequirements(requirements);
    cleaned = this.removeDuplicates(cleaned);
    
    // Sort by weight (most important first)
    cleaned.sort((a, b) => (b.weight || 1) - (a.weight || 1));

    return cleaned;
  }
}

export default new DataCleaner();


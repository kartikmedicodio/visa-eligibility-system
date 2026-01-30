import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

/**
 * Service to extract data from documents using the engine API
 * This calls the Flask API at http://localhost:8000/api/parse-document
 */
class DocumentExtractionService {
  constructor() {
    this.engineApiUrl = process.env.ENGINE_API_URL || 'http://localhost:8000/api/parse-document';
  }

  /**
   * Extract data from document using engine API
   * @param {string} filepath - Path to the document file
   * @param {string} mimetype - MIME type of the file
   * @returns {Promise<Object>} - Extracted and normalized data
   */
  async extractDocumentData(filepath, mimetype) {
    try {
      // Create form data
      const form = new FormData();
      
      // Get filename from path
      const filename = filepath.split('/').pop();
      
      // Append file to form data
      form.append('file', fs.createReadStream(filepath), {
        filename: filename,
        contentType: mimetype
      });

      // Call engine API
      const response = await axios.post(this.engineApiUrl, form, {
        headers: {
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000 // 60 second timeout
      });

      // Transform engine API response to our standardized format
      return this.transformToStandardFormat(response.data);
    } catch (error) {
      console.error('Error calling engine API:', error.message);
      throw error;
    }
  }

  /**
   * Transform engine API response to standardized format
   * Engine API returns: { document_type, extracted_sections, inconsistencies, confidence_indication }
   * We need: { personalInfo, education, employment, financial }
   */
  transformToStandardFormat(engineResponse) {
    const sections = engineResponse.extracted_sections || {};
    
    // Initialize standardized structure
    const standardized = {
      personalInfo: {},
      education: {},
      employment: {},
      financial: {},
      other: {},
      metadata: {
        documentType: engineResponse.document_type,
        confidence: engineResponse.confidence_indication,
        inconsistencies: engineResponse.inconsistencies || []
      }
    };

    // Extract personal info from sections
    this.extractPersonalInfo(sections, standardized.personalInfo);
    
    // Extract education info
    this.extractEducationInfo(sections, standardized.education);
    
    // Extract employment info
    this.extractEmploymentInfo(sections, standardized.employment);
    
    // Extract financial info
    this.extractFinancialInfo(sections, standardized.financial);

    return standardized;
  }

  /**
   * Extract personal information
   */
  extractPersonalInfo(sections, personalInfo) {
    // Look for passport/ID fields
    const commonFields = {
      'name': ['name', 'full name', 'given names', 'surname'],
      'dateOfBirth': ['date of birth', 'dob', 'birth date', 'date de naissance'],
      'nationality': ['nationality', 'nationalité', 'country'],
      'passportNumber': ['passport no', 'passport number', 'passport no.', 'no. de pasaporte'],
      'placeOfBirth': ['place of birth', 'lieu de naissance', 'lugar de nacimiento']
    };

    for (const [key, searchTerms] of Object.entries(commonFields)) {
      for (const [sectionName, sectionData] of Object.entries(sections)) {
        if (typeof sectionData === 'object') {
          for (const [fieldLabel, value] of Object.entries(sectionData)) {
            const lowerLabel = fieldLabel.toLowerCase();
            if (searchTerms.some(term => lowerLabel.includes(term))) {
              personalInfo[key] = value;
              break;
            }
          }
        }
      }
    }

    // Set hasPassport if passport number exists
    personalInfo.hasPassport = !!personalInfo.passportNumber;
  }

  /**
   * Extract education information
   */
  extractEducationInfo(sections, education) {
    education.degrees = [];
    education.institutions = [];
    education.years = [];

    for (const [sectionName, sectionData] of Object.entries(sections)) {
      if (typeof sectionData === 'object') {
        for (const [fieldLabel, value] of Object.entries(sectionData)) {
          const lowerLabel = fieldLabel.toLowerCase();
          
          if (lowerLabel.includes('degree') || lowerLabel.includes('education') || lowerLabel.includes('qualification')) {
            if (value && !education.degrees.includes(value)) {
              education.degrees.push(value);
            }
          }
          
          if (lowerLabel.includes('institution') || lowerLabel.includes('university') || lowerLabel.includes('college') || lowerLabel.includes('school')) {
            if (value && !education.institutions.includes(value)) {
              education.institutions.push(value);
            }
          }
          
          if (lowerLabel.includes('year') && lowerLabel.includes('graduat')) {
            if (value) {
              education.years.push(value);
            }
          }
        }
      }
    }

    // Normalize education level
    education.educationLevel = this.normalizeEducationLevel(education.degrees);
    education.highestDegree = education.educationLevel;
  }

  /**
   * Extract employment information
   */
  extractEmploymentInfo(sections, employment) {
    employment.companies = [];
    employment.positions = [];
    employment.yearsOfExperience = 0;

    for (const [sectionName, sectionData] of Object.entries(sections)) {
      if (typeof sectionData === 'object') {
        for (const [fieldLabel, value] of Object.entries(sectionData)) {
          const lowerLabel = fieldLabel.toLowerCase();
          
          if (lowerLabel.includes('company') || lowerLabel.includes('employer') || lowerLabel.includes('organization')) {
            if (value && !employment.companies.includes(value)) {
              employment.companies.push(value);
            }
          }
          
          if (lowerLabel.includes('position') || lowerLabel.includes('job title') || lowerLabel.includes('role')) {
            if (value && !employment.positions.includes(value)) {
              employment.positions.push(value);
            }
          }
          
          if (lowerLabel.includes('salary') || lowerLabel.includes('wage') || lowerLabel.includes('income')) {
            employment.currentSalary = value || '';
          }
          
          if (lowerLabel.includes('experience') && lowerLabel.includes('year')) {
            const years = parseInt(value) || 0;
            employment.yearsOfExperience = Math.max(employment.yearsOfExperience, years);
          }
        }
      }
    }

    // Derive hasJobOffer
    employment.hasJobOffer = employment.companies.length > 0 || employment.positions.length > 0;
  }

  /**
   * Extract financial information
   */
  extractFinancialInfo(sections, financial) {
    for (const [sectionName, sectionData] of Object.entries(sections)) {
      if (typeof sectionData === 'object') {
        for (const [fieldLabel, value] of Object.entries(sectionData)) {
          const lowerLabel = fieldLabel.toLowerCase();
          
          if (lowerLabel.includes('income') || lowerLabel.includes('salary')) {
            financial.income = value || '';
          }
          
          if (lowerLabel.includes('asset') || lowerLabel.includes('saving') || lowerLabel.includes('fund')) {
            financial.assets = value || '';
          }
          
          if (lowerLabel.includes('bank') || lowerLabel.includes('statement')) {
            financial.bankStatements = true;
          }
        }
      }
    }

    // Derive financialSupport
    financial.financialSupport = !!(financial.income || financial.assets);
  }

  /**
   * Normalize education level
   */
  normalizeEducationLevel(degrees) {
    if (!degrees || degrees.length === 0) return null;

    const degreeStr = degrees.join(' ').toLowerCase();
    
    if (degreeStr.includes('phd') || degreeStr.includes('doctorate') || degreeStr.includes('doctoral')) {
      return 'phd';
    }
    if (degreeStr.includes('master') || degreeStr.includes('ms') || degreeStr.includes('mba')) {
      return 'master';
    }
    if (degreeStr.includes('bachelor') || degreeStr.includes('bs') || degreeStr.includes('ba') || degreeStr.includes('bsc')) {
      return 'bachelor';
    }
    if (degreeStr.includes('diploma') || degreeStr.includes('certificate')) {
      return 'diploma';
    }

    return null;
  }
}

export default new DocumentExtractionService();


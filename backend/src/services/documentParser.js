import openaiService from './openaiService.js';
import Document from '../models/Document.js';

class DocumentParser {
  /**
   * Process and extract data from a document
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} - Extracted data
   */
  async processDocument(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Update status to processing
      document.processingStatus = 'processing';
      await document.save();

      // Extract data using OpenAI
      const extractedData = await openaiService.extractDocumentData(
        document.filepath,
        document.mimetype
      );

      // Update document with extracted data
      document.extractedData = extractedData;
      document.processingStatus = 'completed';
      await document.save();

      return extractedData;
    } catch (error) {
      console.error('Error processing document:', error);
      
      // Update document status to failed
      const document = await Document.findById(documentId);
      if (document) {
        document.processingStatus = 'failed';
        await document.save();
      }
      
      throw error;
    }
  }

  /**
   * Merge extracted data from multiple documents into a single profile
   * @param {Array<string>} documentIds - Array of document IDs
   * @returns {Promise<Object>} - Merged applicant profile
   */
  async mergeDocumentData(documentIds) {
    try {
      const documents = await Document.find({ _id: { $in: documentIds } });
      
      const mergedProfile = {
        personalInfo: {},
        education: {},
        employment: {},
        financial: {},
        other: {}
      };

      for (const doc of documents) {
        if (doc.extractedData) {
          // Merge personal info
          if (doc.extractedData.personalInfo) {
            mergedProfile.personalInfo = {
              ...mergedProfile.personalInfo,
              ...doc.extractedData.personalInfo
            };
          }

          // Merge education (combine arrays)
          if (doc.extractedData.education) {
            mergedProfile.education = {
              degrees: [
                ...(mergedProfile.education.degrees || []),
                ...(doc.extractedData.education.degrees || [])
              ],
              institutions: [
                ...(mergedProfile.education.institutions || []),
                ...(doc.extractedData.education.institutions || [])
              ],
              years: [
                ...(mergedProfile.education.years || []),
                ...(doc.extractedData.education.years || [])
              ]
            };
          }

          // Merge employment
          if (doc.extractedData.employment) {
            mergedProfile.employment = {
              ...mergedProfile.employment,
              ...doc.extractedData.employment
            };
            // Combine companies and positions arrays
            if (doc.extractedData.employment.companies) {
              mergedProfile.employment.companies = [
                ...(mergedProfile.employment.companies || []),
                ...doc.extractedData.employment.companies
              ];
            }
            if (doc.extractedData.employment.positions) {
              mergedProfile.employment.positions = [
                ...(mergedProfile.employment.positions || []),
                ...doc.extractedData.employment.positions
              ];
            }
          }

          // Merge financial
          if (doc.extractedData.financial) {
            mergedProfile.financial = {
              ...mergedProfile.financial,
              ...doc.extractedData.financial
            };
          }

          // Merge other
          if (doc.extractedData.other) {
            mergedProfile.other = {
              ...mergedProfile.other,
              ...doc.extractedData.other
            };
          }
        }
      }

      // Calculate years of experience from employment data
      if (mergedProfile.employment.companies && mergedProfile.employment.companies.length > 0) {
        // Estimate based on number of companies and positions
        mergedProfile.employment.yearsOfExperience = 
          mergedProfile.employment.yearsOfExperience || 
          Math.max(mergedProfile.employment.companies.length * 2, 1);
      }

      return mergedProfile;
    } catch (error) {
      console.error('Error merging document data:', error);
      throw error;
    }
  }
}

export default new DocumentParser();


import OpenAI from 'openai';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class OpenAIService {
  /**
   * Extract structured data from document
   * @param {string} filepath - Path to the document file
   * @param {string} mimetype - MIME type of the file
   * @returns {Promise<Object>} - Extracted structured data
   */
  async extractDocumentData(filepath, mimetype) {
    try {
      let content = '';
      let images = [];

      // Handle PDF files
      if (mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filepath);
        const pdfData = await pdfParse(dataBuffer);
        content = pdfData.text;
      }
      // Handle image files
      else if (mimetype.startsWith('image/')) {
        // Convert image to base64 for GPT-4 Vision
        const imageBuffer = fs.readFileSync(filepath);
        const base64Image = imageBuffer.toString('base64');
        images.push({
          type: 'image_url',
          image_url: {
            url: `data:${mimetype};base64,${base64Image}`
          }
        });
      }
      // Handle text files
      else if (mimetype.startsWith('text/')) {
        content = fs.readFileSync(filepath, 'utf-8');
      }

      // Use GPT-4 Vision for images or GPT-4 for text
      if (images.length > 0) {
        return await this.extractFromImage(images);
      } else {
        return await this.extractFromText(content);
      }
    } catch (error) {
      console.error('Error extracting document data:', error);
      throw error;
    }
  }

  /**
   * Extract data from image using GPT-4 Vision
   */
  async extractFromImage(images) {
    const prompt = `Extract all relevant information from this document. Return a JSON object with the following structure:
{
  "personalInfo": {
    "name": "",
    "dateOfBirth": "",
    "nationality": "",
    "passportNumber": ""
  },
  "education": {
    "degrees": [],
    "institutions": [],
    "years": []
  },
  "employment": {
    "companies": [],
    "positions": [],
    "yearsOfExperience": 0,
    "currentSalary": ""
  },
  "financial": {
    "bankStatements": false,
    "income": "",
    "assets": ""
  },
  "other": {}
}

Extract all visible information. If a field is not found, use null or empty string.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...images
          ]
        }
      ],
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (e) {
      // If not JSON, try to extract JSON from text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: content };
    }
  }

  /**
   * Extract data from text using GPT-4
   */
  async extractFromText(text) {
    const prompt = `Extract all relevant information from this document text. Return a JSON object with the following structure:
{
  "personalInfo": {
    "name": "",
    "dateOfBirth": "",
    "nationality": "",
    "passportNumber": ""
  },
  "education": {
    "degrees": [],
    "institutions": [],
    "years": []
  },
  "employment": {
    "companies": [],
    "positions": [],
    "yearsOfExperience": 0,
    "currentSalary": ""
  },
  "financial": {
    "bankStatements": false,
    "income": "",
    "assets": ""
  },
  "other": {}
}

Document text:
${text.substring(0, 8000)}

Extract all relevant information. If a field is not found, use null or empty string. Return ONLY valid JSON.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured data from documents. Return only valid JSON.'
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
    try {
      return JSON.parse(content);
    } catch (e) {
      return { raw: content };
    }
  }
}

export default new OpenAIService();


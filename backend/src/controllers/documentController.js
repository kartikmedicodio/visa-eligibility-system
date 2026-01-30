import Document from '../models/Document.js';
import documentParser from '../services/documentParser.js';
import fs from 'fs';

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const document = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      documentType: req.body.documentType || 'other'
    });

    await document.save();

    // Process document asynchronously
    documentParser.processDocument(document._id).catch(err => {
      console.error('Error processing document:', err);
    });

    res.status(201).json({
      success: true,
      data: {
        documentId: document._id,
        filename: document.originalName,
        status: document.processingStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

export const processDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const extractedData = await documentParser.processDocument(id);

    res.json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    next(error);
  }
};


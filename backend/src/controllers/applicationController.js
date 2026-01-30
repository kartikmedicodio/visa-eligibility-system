import Application from '../models/Application.js';
import documentParser from '../services/documentParser.js';

export const createApplication = async (req, res, next) => {
  try {
    const { name, email, documentIds } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and email are required' 
      });
    }

    const application = new Application({
      name,
      email,
      documents: documentIds || [],
      status: 'pending'
    });

    await application.save();

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('documents');

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        error: 'Application not found' 
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const application = await Application.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        error: 'Application not found' 
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

export const processApplicationDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate('documents');

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        error: 'Application not found' 
      });
    }

    // Process all documents
    const documentIds = application.documents.map(doc => doc._id.toString());
    
    // Merge extracted data from all documents
    const mergedProfile = await documentParser.mergeDocumentData(documentIds);

    // Update application with extracted profile
    application.extractedProfile = mergedProfile;
    application.status = 'processing';
    await application.save();

    res.json({
      success: true,
      data: {
        applicationId: application._id,
        profile: mergedProfile
      }
    });
  } catch (error) {
    next(error);
  }
};


// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import documentsRoutes from './routes/documents.js';
import applicationsRoutes from './routes/applications.js';
import eligibilityRoutes from './routes/eligibility.js';
import rulesRoutes from './routes/rules.js';

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/documents', documentsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/rules', rulesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});


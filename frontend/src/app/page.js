'use client';

import { useState } from 'react';
import DocumentUpload from '../components/DocumentUpload';
import EligibilityResults from '../components/EligibilityResults';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  createApplication,
  processApplicationDocuments,
  checkEligibility,
  getEligibilityResults,
} from '../lib/api';

export default function Home() {
  const [step, setStep] = useState(1); // 1: upload, 2: info, 3: results
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [applicationId, setApplicationId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleUploadComplete = (documents) => {
    setUploadedDocuments(documents);
    setStep(2);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create application
      const documentIds = uploadedDocuments.map(doc => doc.documentId);
      const appResult = await createApplication(name, email, documentIds);
      const appId = appResult.data._id;
      setApplicationId(appId);

      // Process documents
      await processApplicationDocuments(appId);
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check eligibility
      const eligibilityResult = await checkEligibility(appId);
      setResults(eligibilityResult.data);
      setStep(3);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Visa Eligibility Determination System
          </h1>
          <p className="text-gray-600">
            Upload your documents to check eligibility for multiple visa types
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Step 1: Upload Documents</h2>
            <DocumentUpload onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Step 2: Applicant Information</h2>
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="pt-4">
                <p className="text-sm text-gray-600 mb-4">
                  Uploaded {uploadedDocuments.length} document(s)
                </p>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Check Eligibility'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <button
                onClick={() => {
                  setStep(1);
                  setResults([]);
                  setUploadedDocuments([]);
                  setApplicationId(null);
                  setName('');
                  setEmail('');
                }}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← Start New Application
              </button>
            </div>
            <EligibilityResults results={results} loading={loading} />
          </div>
        )}

        {loading && step !== 2 && <LoadingSpinner message="Processing your documents..." />}
      </div>
    </main>
  );
}


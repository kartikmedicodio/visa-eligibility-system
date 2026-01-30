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
    <main className="min-h-screen bg-dark-bg py-8 px-4">
      {/* Purple glow background effect */}
      <div className="fixed top-0 left-0 right-0 h-[600px] bg-purple-glow opacity-30 pointer-events-none -z-10"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Visa Eligibility <span className="text-purple-500">System</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload your documents to check eligibility for multiple visa types with AI-powered analysis
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="bg-dark-card rounded-xl shadow-2xl p-8 border border-dark-border">
            <h2 className="text-3xl font-semibold mb-6 text-white">
              Step 1: <span className="text-purple-500">Upload Documents</span>
            </h2>
            <DocumentUpload onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {step === 2 && (
          <div className="bg-dark-card rounded-xl shadow-2xl p-8 border border-dark-border">
            <h2 className="text-3xl font-semibold mb-6 text-white">
              Step 2: <span className="text-purple-500">Applicant Information</span>
            </h2>
            <form onSubmit={handleSubmitApplication} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div className="pt-4">
                <p className="text-sm text-gray-400 mb-6">
                  Uploaded <span className="text-purple-500 font-semibold">{uploadedDocuments.length}</span> document(s)
                </p>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-dark-border rounded-lg text-gray-300 hover:bg-dark-surface hover:border-purple-500/50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed font-semibold transition-all shadow-lg shadow-purple-500/20"
                  >
                    {loading ? 'Processing...' : 'Check Eligibility'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-dark-card rounded-xl shadow-2xl p-8 border border-dark-border">
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
                className="text-purple-400 hover:text-purple-300 mb-4 transition-colors flex items-center gap-2"
              >
                <span>←</span> Start New Application
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


'use client';

import VisaTypeCard from './VisaTypeCard';

export default function EligibilityResults({ results, loading }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Processing eligibility results...</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No eligibility results available.</p>
      </div>
    );
  }

  // Sort by score (highest first)
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-white mb-2">
        Eligibility <span className="text-purple-500">Results</span>
      </h2>
      <p className="text-gray-400 mb-8">Your visa eligibility assessment across all visa types</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedResults.map((result, index) => (
          <VisaTypeCard key={index} result={result} />
        ))}
      </div>
    </div>
  );
}


'use client';

import VisaTypeCard from './VisaTypeCard';

export default function EligibilityResults({ results, loading }) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Processing eligibility results...</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No eligibility results available.</p>
      </div>
    );
  }

  // Sort by score (highest first)
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Eligibility Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedResults.map((result, index) => (
          <VisaTypeCard key={index} result={result} />
        ))}
      </div>
    </div>
  );
}


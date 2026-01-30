'use client';

export default function VisaTypeCard({ result }) {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = (isEligible) => {
    return isEligible ? (
      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
        Eligible
      </span>
    ) : (
      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
        Not Eligible
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">{result.visaType}</h3>
        {getStatusBadge(result.isEligible)}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Eligibility Score</span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(result.score)}`}>
            {result.score}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              result.score >= 70 ? 'bg-green-500' :
              result.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${result.score}%` }}
          ></div>
        </div>
      </div>

      {result.missingRequirements && result.missingRequirements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Missing Requirements:</h4>
          <ul className="list-disc list-inside space-y-1">
            {result.missingRequirements.slice(0, 5).map((req, index) => (
              <li key={index} className="text-sm text-gray-600">{req}</li>
            ))}
          </ul>
        </div>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommendations:</h4>
          <ul className="list-disc list-inside space-y-1">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-600">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


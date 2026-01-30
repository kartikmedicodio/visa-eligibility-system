'use client';

export default function VisaTypeCard({ result }) {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-400 bg-green-900/30 border-green-500/50';
    if (score >= 50) return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
    return 'text-red-400 bg-red-900/30 border-red-500/50';
  };

  const getStatusBadge = (isEligible) => {
    return isEligible ? (
      <span className="px-4 py-1.5 bg-green-900/30 text-green-400 border border-green-500/50 rounded-full text-sm font-semibold">
        Eligible
      </span>
    ) : (
      <span className="px-4 py-1.5 bg-red-900/30 text-red-400 border border-red-500/50 rounded-full text-sm font-semibold">
        Not Eligible
      </span>
    );
  };

  return (
    <div className="bg-dark-card rounded-xl shadow-2xl p-6 border border-dark-border hover:border-purple-500/50 transition-all">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">{result.visaType}</h3>
        {getStatusBadge(result.isEligible)}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-400">Eligibility Score</span>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getScoreColor(result.score)}`}>
            {result.score}/100
          </span>
        </div>
        <div className="w-full bg-dark-surface rounded-full h-3 border border-dark-border">
          <div
            className={`h-3 rounded-full transition-all ${
              result.score >= 70 ? 'bg-green-500' :
              result.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${result.score}%` }}
          ></div>
        </div>
      </div>

      {result.missingRequirements && result.missingRequirements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Missing Requirements:</h4>
          <ul className="list-disc list-inside space-y-2">
            {result.missingRequirements.slice(0, 5).map((req, index) => (
              <li key={index} className="text-sm text-gray-400">{req}</li>
            ))}
          </ul>
        </div>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Recommendations:</h4>
          <ul className="list-disc list-inside space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-purple-400">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


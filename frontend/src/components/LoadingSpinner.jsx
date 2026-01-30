'use client';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-dark-border border-t-purple-500 mb-6"></div>
      <p className="text-gray-400 text-lg">{message}</p>
    </div>
  );
}


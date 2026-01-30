'use client';

import { useState, useCallback } from 'react';
import { uploadDocument } from '../lib/api';

export default function DocumentUpload({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedDocuments = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }));
        const result = await uploadDocument(file, 'other');
        uploadedDocuments.push(result.data);
        setUploadProgress(prev => ({ ...prev, [file.name]: 'completed' }));
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }));
      }
    }

    setUploading(false);
    if (onUploadComplete) {
      onUploadComplete(uploadedDocuments);
    }
  };

  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-dark-border rounded-xl p-12 text-center hover:border-purple-500/50 transition-all bg-dark-surface/50 backdrop-blur-sm"
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          accept="image/*,.pdf,.doc,.docx"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <svg
            className="w-16 h-16 text-purple-500 mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-gray-300 mb-2 text-lg font-medium">
            Drag and drop files here, or click to select
          </p>
          <p className="text-sm text-gray-500">
            Supports images, PDFs, and documents (max 10MB each)
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Selected Files:</h3>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-dark-surface rounded-lg border border-dark-border"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-200">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  {uploadProgress[file.name] === 'uploading' && (
                    <span className="text-xs text-purple-400">Uploading...</span>
                  )}
                  {uploadProgress[file.name] === 'completed' && (
                    <span className="text-xs text-green-400">✓ Uploaded</span>
                  )}
                  {uploadProgress[file.name] === 'error' && (
                    <span className="text-xs text-red-400">✗ Error</span>
                  )}
                </div>
                <button
                  onClick={() => removeFile(file.name)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-6 w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed font-semibold transition-all shadow-lg shadow-purple-500/20"
          >
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </div>
      )}
    </div>
  );
}


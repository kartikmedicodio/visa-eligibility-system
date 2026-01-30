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
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
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
            className="w-12 h-12 text-gray-400 mb-4"
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
          <p className="text-gray-600 mb-2">
            Drag and drop files here, or click to select
          </p>
          <p className="text-sm text-gray-500">
            Supports images, PDFs, and documents (max 10MB each)
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Selected Files:</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  {uploadProgress[file.name] === 'uploading' && (
                    <span className="text-xs text-blue-500">Uploading...</span>
                  )}
                  {uploadProgress[file.name] === 'completed' && (
                    <span className="text-xs text-green-500">✓ Uploaded</span>
                  )}
                  {uploadProgress[file.name] === 'error' && (
                    <span className="text-xs text-red-500">✗ Error</span>
                  )}
                </div>
                <button
                  onClick={() => removeFile(file.name)}
                  className="text-red-500 hover:text-red-700"
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
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </div>
      )}
    </div>
  );
}


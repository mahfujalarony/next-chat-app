"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';

const Step3Form: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { uid } = useSelector((state: any) => state.register);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      // Validate file type and size
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const imageUrl = data.url;
      setUploadedUrl(imageUrl);

      // Update user profile with image URL in Firebase Authentication
      const user = auth.currentUser;
      if (user) {
        // MongoDB-তে avatar update
        await fetch('/api/users/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: user.uid,
            avatar: imageUrl
          })
        });

        await updateProfile(user, {
          photoURL: imageUrl,
        });
        console.log('✅ Image URL saved to Firebase Authentication profile');
      } else {
        throw new Error('User not logged in');
      }
    } catch (err: any) {
      console.error('Upload error:', err.message);
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Skip button handler
  const handleSkip = () => {
    router.push('/'); // Redirect to home page if skipped
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Profile Picture</h2>
          <p className="mt-2 text-sm text-gray-600">
            Upload your profile picture (JPEG, PNG, less than 5MB)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  {file ? file.name : 'JPEG, PNG (max 5MB)'}
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-between space-x-4">
            {file && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isUploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Image'
                )}
              </button>
            )}
            <button
              onClick={handleSkip}
              disabled={isUploading}
              className={`flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 ${
                isUploading
                  ? 'bg-gray-200 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              Skip
            </button>
          </div>

          {uploadedUrl && (
            <div className="mt-6 text-center">
              <div className="flex justify-center">
                <img
                  src={uploadedUrl}
                  alt="Uploaded preview"
                  className="w-48 h-48 object-cover rounded-full border-4 border-white shadow"
                />
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Image uploaded successfully!
              </p>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
              >
                View full image
              </a>
              <button
                onClick={() => router.push('/')}
                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Complete Setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step3Form;
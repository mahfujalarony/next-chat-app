'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Page: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // 🟢 Redux থেকে uid (step2 তে সেট করা) আনছি
  const { uid } = useSelector((state: any) => state.register);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      console.log('📁 Selected file:', selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

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

      // 🟢 Firestore এ profileImage আপডেট করো
      if (uid) {
        await updateDoc(doc(db, 'users', uid), {
          profileImage: imageUrl,
        });
        console.log('✅ Image URL saved to Firestore');
      } else {
        console.warn('⚠️ UID not found in Redux state');
      }
    } catch (err: any) {
      console.error('Upload error:', err.message);
      alert(err.message || 'Upload failed');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Step 3: Upload Image</h2>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      {file && <p className="mt-2 text-sm">Selected: {file.name}</p>}

      <button
        onClick={handleUpload}
        className="mt-2 bg-blue-600 text-white px-4 py-1 rounded"
      >
        Upload
      </button>

      {uploadedUrl && (
        <div className="mt-4">
          <p className="text-sm">Uploaded File URL:</p>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {uploadedUrl}
          </a>
          <img
            src={uploadedUrl}
            alt="Uploaded"
            className="mt-2 w-48 border rounded"
          />

          <button>Finis</button>
        </div>
      )}
    </div>
  );
};

export default Page;

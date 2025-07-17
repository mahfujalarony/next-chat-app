"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaUser, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Handle case where auth is null during initialization
  const [user, loading, error] = useAuthState(auth!);
  const [photo, setPhoto] = useState('/nouser.png');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && user.photoURL) {
      setPhoto(user.photoURL);
    }
  }, [user]);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, mounted]);

  const handleBackToChats = () => {
    router.push('/chats');
  };

  // Don't render anything until component is mounted (client-side only)
  if (!mounted) {
    return null;
  }

  // Handle case where auth is null
  if (!auth) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error.message}
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-12">
      <div className="max-w-md mx-auto">
        {/* Back to Chats Button */}
        <button 
          onClick={handleBackToChats}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-300 font-medium"
        >
          <FaArrowLeft className="text-sm" /> Back to Chats
        </button>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 text-white text-center">
            <div className="relative w-32 h-32 rounded-full border-4 border-white overflow-hidden mx-auto mb-4 shadow-md">
              <img 
                src={photo} 
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/nouser.png') {
                    target.onerror = null;
                    target.src = '/nouser.png';
                    setPhoto('/nouser.png');
                  }
                }}
              />
            </div>
            <h1 className="text-2xl font-bold">
              {user.displayName || 'No Name'}
            </h1>
            <p className="text-blue-100 mt-1">{user.email}</p>
          </div>

          {/* Profile Image URL Debug Section */}
          <div className="p-4 bg-yellow-50 border-b">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Profile Image URL:</h3>
            <p className="text-xs text-gray-600 break-all bg-white p-2 rounded border">
              {user.photoURL || 'No photo URL'}
            </p>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center">
              <FaUser className="mr-2 text-blue-500" /> Account Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <p className="text-sm text-gray-500 font-medium">Email</p>
                <p className="font-medium text-gray-800 break-all">{user.email}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <p className="text-sm text-gray-500 font-medium flex items-center">
                  <FaCalendarAlt className="mr-1 text-blue-500" /> Account Created
                </p>
                <p className="font-medium text-gray-800">
                  {user.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <p className="text-sm text-gray-500 font-medium flex items-center">
                  <FaClock className="mr-1 text-blue-500" /> Last Sign In
                </p>
                <p className="font-medium text-gray-800">
                  {user.metadata.lastSignInTime 
                    ? new Date(user.metadata.lastSignInTime).toLocaleString()
                    : 'Unknown'
                  }
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <p className="text-sm text-gray-500 font-medium">Email Verified</p>
                <p className="font-medium flex items-center text-gray-800">
                  {user.emailVerified ? (
                    <><FaCheckCircle className="mr-1 text-green-500" /> Yes</>
                  ) : (
                    <><FaTimesCircle className="mr-1 text-red-500" /> No</>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer with action buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button 
              onClick={handleBackToChats}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <FaArrowLeft className="text-sm" /> Return to Chats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
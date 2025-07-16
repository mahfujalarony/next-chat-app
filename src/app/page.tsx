"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isHoverLogin, setIsHoverLogin] = useState(false);
  const [isHoverRegister, setIsHoverRegister] = useState(false);
  const router = useRouter();

  // Check auth state on component mount
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to chats
        router.push("/chats");
      } else {
        // No user is signed in, stop loading
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  // Loading spinner while checking auth state
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-indigo-600 font-medium">Checking authentication...</p>
      </div>
    );
  }

  // Main landing page content
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Animated card */}
        <div 
          className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:flex transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
        >
          {/* Left side with animated icon */}
          <div className="md:flex-shrink-0 bg-gradient-to-b from-indigo-600 to-indigo-500 md:w-48 flex items-center justify-center p-6">
            <svg 
              className="h-20 w-20 text-white animate-bounce" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </div>
          
          {/* Right side with content */}
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">
              Real-Time Chat Application
            </div>
            <h2 className="mt-2 text-2xl leading-tight font-bold text-gray-900">
              Welcome to Our Chat Platform
            </h2>
            <p className="mt-4 text-gray-600">
              Connect with friends and colleagues through our secure messaging platform. 
              Please login or register to continue.
            </p>
            
            {/* Interactive buttons with hover effects */}
            <div className="mt-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => router.push("/login")}
                onMouseEnter={() => setIsHoverLogin(true)}
                onMouseLeave={() => setIsHoverLogin(false)}
                className={`px-6 py-3 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center
                  ${isHoverLogin ? 'bg-indigo-700 shadow-md' : 'bg-indigo-600 shadow'}
                `}
              >
                Login
                {isHoverLogin && (
                  <svg className="ml-2 h-4 w-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => router.push("/register")}
                onMouseEnter={() => setIsHoverRegister(true)}
                onMouseLeave={() => setIsHoverRegister(false)}
                className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center
                  ${isHoverRegister ? 'bg-gray-200 shadow-md text-gray-900' : 'bg-gray-100 shadow text-gray-800'}
                `}
              >
                Register
                {isHoverRegister && (
                  <svg className="ml-2 h-4 w-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Additional features section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🔒',
              title: 'Secure',
              description: 'End-to-end encrypted messages for your privacy'
            },
            {
              icon: '⚡',
              title: 'Fast',
              description: 'Real-time messaging with no delays'
            },
            {
              icon: '🌐',
              title: 'Accessible',
              description: 'Available on all your devices'
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
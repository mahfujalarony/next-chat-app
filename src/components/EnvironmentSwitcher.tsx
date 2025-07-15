"use client";

import { useState } from 'react';
import { ENV } from '@/lib/env';

interface EnvironmentSwitcherProps {
  className?: string;
}

export default function EnvironmentSwitcher({ className = "" }: EnvironmentSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  // শুধুমাত্র development mode এ দেখাবে
  if (!ENV.IS_DEVELOPMENT) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs hover:bg-gray-700 transition-colors"
      >
        🌐 ENV
      </button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[300px] text-xs">
          <h3 className="font-semibold mb-3 text-gray-800">Environment Configuration</h3>
          
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-600">API URL:</span>
              <div className="bg-gray-100 p-1 rounded font-mono text-green-700">
                {ENV.API_URL}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-600">Socket URL:</span>
              <div className="bg-gray-100 p-1 rounded font-mono text-blue-700">
                {ENV.SOCKET_URL}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-600">Environment:</span>
              <div className="bg-gray-100 p-1 rounded font-mono text-purple-700">
                {process.env.NODE_ENV}
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600">Firebase Project:</span>
              <div className="bg-gray-100 p-1 rounded font-mono text-orange-700">
                {ENV.FIREBASE.PROJECT_ID || "Not configured"}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${ENV.API_URL.includes('localhost') ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-gray-600">
                {ENV.API_URL.includes('localhost') ? 'Local Development' : 'Production'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

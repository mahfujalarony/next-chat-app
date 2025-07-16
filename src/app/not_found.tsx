import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found - 404',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md p-8 bg-white shadow-lg rounded-lg text-center">
        <h1 className="text-6xl font-bold text-red-500">404</h1>
        <h2 className="text-3xl font-semibold mb-4 text-gray-800">Page Not Found</h2>
        <p className="mb-6 text-gray-600">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
          <Link 
            href="/chats"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useDispatch } from "react-redux";
import { setStep1 } from "@/lib/redux/features/registerSlice";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth/googleAuth"; 


export default function Step1Form() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
    const handleGoogleLogin = async () => {
      try {
        const { user, isNewUser } = await signInWithGoogle();
        // Redirect to chat after login or registration
        router.push("/chat");
      } catch (err: any) {
        setError(err.message || "Google login failed!");
      }
    };



  

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const firstName = e.currentTarget.firstName.value;
    const lastName = e.currentTarget.lastName.value;

    dispatch(setStep1({ firstName, lastName }));
    router.push("/register/step2");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Register - Step 1
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please enter your basic information
          </p>
         {error && (
            <div className="text-sm text-red-500 text-center">{error}</div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleNext}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="firstName" className="sr-only">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="First Name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="sr-only">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Last Name"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next
            </button>
          </div>
        </form>


      <div className="text-center mt-4">
        <button
          type="button"
          className="text-sm text-indigo-600 hover:text-indigo-500"
          onClick={() => router.push("/login")}
        >
          Already have an account? Log in
        </button>
      </div>

      {/* oauth google  */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-100 focus:outline-none"
          onClick={handleGoogleLogin}
        >
          <svg
            className="w-5 h-5 mr-2"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                d="M44.5 20H24V28.5H36.9C35.6 32.6 31.6 35.5 27 35.5C21.2 35.5 16.2 30.5 16.2 24.7C16.2 18.9 21.2 13.9 27 13.9C29.6 13.9 32 14.8 33.8 16.3L39.2 11C36.1 8.3 31.8 6.5 27 6.5C16.8 6.5 8.5 14.8 8.5 24.7C8.5 34.6 16.8 42.9 27 42.9C36.2 42.9 44.5 34.6 44.5 24.7C44.5 23.5 44.4 22.2 44.2 21H44.5V20Z"
                fill="#4285F4"
              />
              <path
                d="M6.3 14.1L13.1 19.1C15.1 15.2 20.1 13.9 27 13.9C29.6 13.9 32 14.8 33.8 16.3L39.2 11C36.1 8.3 31.8 6.5 27 6.5C18.7 6.5 11.5 12.7 9.1 20.1L6.3 14.1Z"
                fill="#EA4335"
              />
              <path
                d="M27 42.9C31.6 42.9 35.6 40 36.9 35.9L29.1 30.9C27.9 31.7 26.5 32.1 25 32.1C21.2 32.1 17.9 29.2 16.9 25.7L6.3 35.3C9.1 41.1 17.1 42.9 27 42.9Z"
                fill="#34A853"
              />
              <path
                d="M44.5 24.7C44.5 23.5 44.4 22.2 44.2 21H24V28.5H36.9C36.3 30.3 35.2 31.9 33.8 33.1L39.2 38.1C41.7 35.8 44.5 31.7 44.5 24.7Z"
                fill="#FBBC05"
              />
            </g>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>

      </div>
  );
}
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { applyActionCode, checkActionCode, sendEmailVerification, onAuthStateChanged } from 'firebase/auth';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying your email...');
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!auth) {
    return <div>Firebase not initialized...</div>;
  }

  // Track user authentication state
  useEffect(() => {
    // auth null check করুন
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmail(user.email || '');
        setIsVerified(user.emailVerified);
        if (user.emailVerified) {
          setStatus('Email successfully verified!');
        }
      } else {
        setEmail('');
        setIsVerified(false);
        setStatus('User not logged in. Please log in.');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email verification handling
  useEffect(() => {
    const verifyEmail = async () => {
      // auth null check করুন
      if (!auth) {
        setStatus('Firebase not initialized');
        setIsLoading(false);
        return;
      }

      try {
        const oobCode = searchParams?.get('oobCode');
        const mode = searchParams?.get('mode');
        const emailParam = searchParams?.get('email');

        if (emailParam) setEmail(emailParam);

        if (mode === 'verifyEmail' && oobCode) {
          // Check and apply verification link
          await checkActionCode(auth, oobCode);
          await applyActionCode(auth, oobCode);

          // Update state if verification is successful
          setIsVerified(true);
          setStatus('Email successfully verified!');
        } else if (emailParam) {
          setStatus('Verification email sent. Please check your inbox.');
        } else {
          throw new Error('Invalid verification link');
        }
      } catch (error) {
        console.error('Verification error:', error);
        let msg = 'Verification failed.';
        if (error instanceof Error) msg = `Verification failed: ${error.message}`;
        setStatus(msg);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  // Resend verification email
  const resendVerification = async () => {
    // auth null check করুন
    if (!auth) {
      setStatus('Firebase not initialized');
      return;
    }

    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');
      await sendEmailVerification(user);
      setStatus('Verification email resent. Please check your inbox.');
    } catch (error) {
      console.error('Resend error:', error);
      let msg = 'Failed to resend verification email.';
      if (error instanceof Error) msg = `Failed to resend verification email: ${error.message}`;
      setStatus(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Proceed to next step
  const handleNextStep = () => {
    // auth null check করুন
    if (!auth) {
      setStatus('Firebase not initialized');
      return;
    }

    if (auth.currentUser?.emailVerified || isVerified) {
      router.push('/register/step3');
    } else {
      setStatus('Sorry, you cannot proceed to the next step without verifying your email.');
    }
  };

  // Stay on verification page if verification is successful
  useEffect(() => {
    if (isVerified && !isLoading) {
      setStatus('Email successfully verified! Please click the button below to proceed to the next step.');
    }
  }, [isVerified, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
          {isLoading ? (
            <p className="mb-6">Loading...</p>
          ) : (
            <p className="mb-6">{status}</p>
          )}

          {status.includes('failed') && (
            <button
              onClick={resendVerification}
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4 w-full ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Resend Verification Email
            </button>
          )}

          {auth && (auth.currentUser?.emailVerified || isVerified) && !isLoading && (
            <button
              onClick={handleNextStep}
              disabled={isLoading}
              className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-4 w-full ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Proceed to Next Step (Upload Photo)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
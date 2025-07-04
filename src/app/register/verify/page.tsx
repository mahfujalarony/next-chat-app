'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, sendEmailVerification, reload } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { setEmailVerified } from '@/lib/redux/features/registerSlice';
import { RootState } from '@/lib/redux/store';

const VerifyPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { email, uid } = useSelector((state: RootState) => state.register);
  
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email || !uid) {
      router.push('/register');
      return;
    }

    // Auth state পরিবর্তন listen করুন
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User কে reload করুন latest verification status পেতে
        await reload(user);
        
        if (user.emailVerified) {
          setIsVerified(true);
          
          // Firestore আপডেট করুন
          await updateDoc(doc(db, 'users', user.uid), {
            emailVerified: true,
            verifiedAt: new Date(),
          });
          
          // Redux আপডেট করুন
          dispatch(setEmailVerified());
          localStorage.setItem('isEmailVerified', 'true');
          
          // Success message দেখান
          setMessage('✅ Email verification সফল হয়েছে!');
          
          // ২ সেকেন্ড পরে next step এ নিয়ে যান
          setTimeout(() => {
            router.push('/register/step3');
          }, 2000);
        }
      }
    });

    return () => unsubscribe();
  }, [email, uid, router, dispatch]);

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    
    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage('📧 Verification email আবার পাঠানো হয়েছে!');
    } catch (error: any) {
      setMessage('❌ Email পাঠাতে সমস্যা হয়েছে');
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!auth.currentUser) return;
    
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        setIsVerified(true);
        setMessage('✅ Email verification সফল হয়েছে!');
      } else {
        setMessage('⏳ এখনও verify হয়নি, email check করুন');
      }
    } catch (error) {
      console.error('Check verification error:', error);
    }
  };

  if (isVerified) {
    return (
      <div className="p-4 text-center">
        <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-800 mb-2">
            Email Verified!
          </h2>
          <p className="text-green-600">
            আপনার email verify হয়ে গেছে। Step 3 এ যাচ্ছি...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-md mx-auto bg-white border rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-xl font-bold mb-2">Email Verify করুন</h2>
          <p className="text-gray-600 text-sm">
            আমরা <strong>{email}</strong> এ একটি verification link পাঠিয়েছি।
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>কী করতে হবে:</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-1 space-y-1">
              <li>1. আপনার email inbox check করুন</li>
              <li>2. Verification link এ click করুন</li>
              <li>3. এই page এ ফিরে এসে "Check Status" এ click করুন</li>
            </ol>
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.includes('❌')
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={checkVerificationStatus}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Verification Status Check করুন
            </button>

            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300"
            >
              {isResending ? 'পাঠানো হচ্ছে...' : 'Email আবার পাঠান'}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push('/register')}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              শুরু থেকে আবার করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
"use client";

import { useDispatch, useSelector } from "react-redux";
import { setStep2 } from "@/lib/redux/features/registerSlice";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RootState } from "@/lib/redux/store";
import StepGuard from "@/components/StepGuard";

export default function Step2Form() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  const { firstName, lastName } = useSelector((state: RootState) => state.register);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;

    try {
      // Account তৈরি করুন
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Email verification পাঠান
      await sendEmailVerification(user);

      // Firestore এ user data save করুন
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        emailVerified: false,
        createdAt: new Date(),
      });

      localStorage.setItem("firstName", firstName);
      localStorage.setItem("lastName", lastName);
      localStorage.setItem("email", email);
      localStorage.setItem("uid", user.uid);
    

      dispatch(setStep2({ email, uid: user.uid }));
      
      // Verification page এ redirect করুন
      router.push("/register/verify");
      
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Already have a account';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      default:
        return 'Registration failed, please try again';
    }
  };

  return (
    <StepGuard >

    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Step 2: Create A account</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <input 
          name="email" 
          type="email" 
          placeholder="Email Address"
          className="w-full p-2 border rounded"
          required
          disabled={loading}
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Password (minimam 6 digit)"
          className="w-full p-2 border rounded"
          required
          disabled={loading}
          minLength={6}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full px-4 py-2 rounded text-white ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Account Creating...' : 'Create A Account'}
        </button>
      </form>
    </div>
          </StepGuard>
  );
}
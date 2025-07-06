"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function UserProfile() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Please log in to view your profile.</div>;

  return (
    <div>
      <p>Name: {user.displayName || "N/A"}</p>
      <p>Email: {user.email}</p>
      <p>Email Verified: {user.emailVerified ? "Yes" : "No"}</p>
      <p>UID: {user.uid}</p>
      <p>Photo URL: {user.photoURL || "No photo available"}</p>
      <p>Created At: {user.metadata.creationTime}</p>
      <p>Last Sign In: {user.metadata.lastSignInTime}</p>
      <p>Provider: {user.providerData.map(pd => pd.providerId).join(', ')}</p>
      <p>Phone Number: {user.phoneNumber || "No phone number"}</p>

    </div>
  );
}
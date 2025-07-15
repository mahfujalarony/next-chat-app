import { auth, googleProvider, signInWithPopup } from '../firebase';
import { getAdditionalUserInfo } from "firebase/auth";

export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error("Firebase is not initialized on the client side.");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    const isNewUser = additionalInfo?.isNewUser;

    await fetch('/api/users/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebaseUid: user.uid,
        email: user.email,
        fullName: user.displayName,
        avatar: user.photoURL,
        username: user.displayName?.split(' ')[0]?.toLowerCase() || '',
        bio: '',
        phoneNumber: user.phoneNumber || null
      })
    });

    console.log(isNewUser ? '🆕 New Google user registered' : '✅ Existing Google user logged in');

    return { user, isNewUser };
  } catch (error: unknown) {
    console.error("Google Sign-in Error:", error);
    throw error;
  }
}
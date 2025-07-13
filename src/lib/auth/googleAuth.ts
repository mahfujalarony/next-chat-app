import { auth, googleProvider, signInWithPopup } from '../firebase';
import { getAdditionalUserInfo } from "firebase/auth";

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    const isNewUser = additionalInfo?.isNewUser;

    // ✅ Step: MongoDB তে upsert করো
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
  } catch (err: any) {
    console.error("Google Sign-in Error:", err);
    throw err;
  }
}

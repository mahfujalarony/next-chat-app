import { auth, googleProvider, signInWithPopup } from '../firebase';
import { getAdditionalUserInfo } from "firebase/auth";

export async function signInWithGoogle() {
    
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    if (additionalInfo?.isNewUser) {
      // Newly registered user (you can save extra info to Firestore if needed)
      console.log("This is a new user. Registered:", user.email);
    } else {
      // Already registered, just logged in
      console.log("Existing user logged in:", user.email);
    }
    return { user, isNewUser: additionalInfo?.isNewUser };
  } catch (err: any) {
    throw err;
  }
}
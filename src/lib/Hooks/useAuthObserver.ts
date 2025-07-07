import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setUser, clearUser } from '@/lib/redux/features/userSlice';
import { AppDispatch } from '@/lib/redux/store';

export default function useAuthObserver() {
  const dispatch = useDispatch<AppDispatch>();
// hooks/useAuthObserver.ts
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    //console.log("👤 Firebase user changed:", user); // <-- এটা যোগ করুন

    if (user) {
      dispatch(setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }));
    } else {
      dispatch(clearUser());
    }
  });

  return () => unsubscribe();
}, [dispatch]);

}

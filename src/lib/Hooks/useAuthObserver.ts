import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from '@/lib/redux/features/userSlice';
import { AppDispatch } from '@/lib/redux/store';

export default function useAuthObserver() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Client-side only
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;

    // Dynamic import of Firebase to avoid SSR issues
    const initFirebaseAuth = async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        if (!auth) {
          console.error('Firebase auth not initialized');
          return;
        }

        unsubscribe = onAuthStateChanged(auth, (user) => {
          
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
      } catch (error) {
        console.error('Firebase auth initialization failed:', error);
      }
    };

    initFirebaseAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dispatch]);
}

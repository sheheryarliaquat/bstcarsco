'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOutUser,
  getUserData,
  onAuthStateChanged as authOnAuthStateChanged,
} from '@/lib/firebase/auth';
import type { User as AppUser } from '@/types';

interface AuthState {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
  signIn: typeof authSignIn;
  signUp: typeof authSignUp;
  signOut: typeof signOutUser;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authOnAuthStateChanged(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        try {
          const data = await getUserData(authUser.uid);
          setUserData(data);
        } catch {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (...args: Parameters<typeof authSignIn>) => {
    const result = await authSignIn(...args);
    return result;
  }, []);

  const signUp = useCallback(async (...args: Parameters<typeof authSignUp>) => {
    const result = await authSignUp(...args);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  return {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
  };
}

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, testConnection } from '../config/firebase';
import { verifySecret } from '../config/securityLock';
import { UserSettings } from '../types/finance';
import { getUserSettings } from '../services/dbService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOwner: boolean; // True for any authenticated user on their own workspace
  authError: string | null;
  isLocked: boolean;
  isOnline: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  lockApp: () => void;
  unlockApp: (input: string) => Promise<boolean>;
  settings: UserSettings | null;
  setSettingsState: React.Dispatch<React.SetStateAction<UserSettings | null>>;
  lockoutSecondsRemaining: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [settings, setSettingsState] = useState<UserSettings | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lockoutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Online/Offline network detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      testConnection();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection test
    testConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      setLoading(true);
      setAuthError(null);

      if (currentUser) {
        setUser(currentUser);
        setIsOwner(true);

        // Fetch user settings
        try {
          const userSet = await getUserSettings(currentUser.uid);
          if (userSet) {
            setSettingsState(userSet);
            // If PIN or Password is enabled, start with app locked
            if (userSet.pinEnabled || userSet.passwordEnabled) {
              setIsLocked(true);
            }
          } else {
            setSettingsState(null);
          }
        } catch (err) {
          console.error('Error fetching settings on auth:', err);
        }
      } else {
        setUser(null);
        setIsOwner(false);
        setIsLocked(false);
        setSettingsState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-lock inactivity detection
  useEffect(() => {
    if (!user || !settings || isLocked) return;
    const timeoutMinutes = settings.autoLockMinutes;
    if (!timeoutMinutes || timeoutMinutes <= 0) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        if (settings.pinEnabled || settings.passwordEnabled) {
          setIsLocked(true);
        }
      }, timeoutMs);
    };

    resetTimer();

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetTimer();

    activityEvents.forEach((evt) => window.addEventListener(evt, handleActivity));

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [user, settings, isLocked]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSecondsRemaining > 0) {
      lockoutIntervalRef.current = setInterval(() => {
        setLockoutSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(lockoutIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current);
    };
  }, [lockoutSecondsRemaining]);

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setAuthError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      let msg = err.message || 'Failed to sign in with email and password';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please check your credentials or register a new account.';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    try {
      setAuthError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      // Send email verification
      if (userCredential.user) {
        try {
          await sendEmailVerification(userCredential.user);
        } catch (vErr) {
          console.warn('Could not send verification email immediately:', vErr);
        }
      }
    } catch (err: any) {
      console.error('Email sign-up error:', err);
      let msg = err.message || 'Failed to register account';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      setAuthError(null);
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Password reset error:', err);
      let msg = err.message || 'Failed to send password reset email';
      if (err.code === 'auth/user-not-found') {
        msg = 'No user found with this email address.';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No user currently signed in');
    await sendEmailVerification(auth.currentUser);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsOwner(false);
    setIsLocked(false);
    setSettingsState(null);
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const unlockApp = async (input: string): Promise<boolean> => {
    if (lockoutSecondsRemaining > 0) {
      return false;
    }

    if (!settings) {
      setIsLocked(false);
      return true;
    }

    let isValid = false;

    // Check PIN first if enabled
    if (settings.pinEnabled && settings.pinHash && settings.pinSalt) {
      isValid = await verifySecret(input, settings.pinSalt, settings.pinHash);
    }

    // Check Password if PIN didn't match or wasn't enabled
    if (!isValid && settings.passwordEnabled && settings.passwordHash && settings.passwordSalt) {
      isValid = await verifySecret(input, settings.passwordSalt, settings.passwordHash);
    }

    // If neither is enabled, unlocking is always valid
    if (!settings.pinEnabled && !settings.passwordEnabled) {
      isValid = true;
    }

    if (isValid) {
      setFailedAttempts(0);
      setIsLocked(false);
      return true;
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      if (nextFail >= 5) {
        setLockoutSecondsRemaining(120); // 2 min lockout
      } else if (nextFail >= 3) {
        setLockoutSecondsRemaining(30); // 30s lockout
      }
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOwner,
        authError,
        isLocked,
        isOnline,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        resendVerificationEmail,
        logout,
        lockApp,
        unlockApp,
        settings,
        setSettingsState,
        lockoutSecondsRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

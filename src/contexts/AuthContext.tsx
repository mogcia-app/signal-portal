"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    additionalData: {
      companyName?: string;
      representativeName?: string;
      phone?: string;
      userType: "toC" | "toB";
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  isSessionExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// セッションタイムアウト時間（3時間 = 3 * 60 * 60 * 1000 ミリ秒）
const SESSION_TIMEOUT_MS = 3 * 60 * 60 * 1000;

// localStorage のキー
const SESSION_START_TIME_KEY = "sessionStartTime";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // セッション開始時刻を保存
  const saveSessionStartTime = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_START_TIME_KEY, Date.now().toString());
    }
  }, []);

  // セッション開始時刻をクリア
  const clearSessionStartTime = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_START_TIME_KEY);
    }
  }, []);

  // セッションタイムアウトをチェック
  const isSessionExpired = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    
    const sessionStartTime = localStorage.getItem(SESSION_START_TIME_KEY);
    if (!sessionStartTime) return false;

    const elapsed = Date.now() - parseInt(sessionStartTime, 10);
    return elapsed >= SESSION_TIMEOUT_MS;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // セッションタイムアウトをチェック
      if (firebaseUser && isSessionExpired()) {
        // セッションが期限切れの場合はログアウト
        await signOut(auth);
        clearSessionStartTime();
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        // ログイン成功時にセッション開始時刻を保存
        saveSessionStartTime();

        // Firestoreからユーザープロフィールを取得
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserProfile({
            id: userDoc.id,
            ...userDoc.data(),
          } as UserProfile);
        } else {
          // プロフィールが存在しない場合は作成
          const newProfile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            name: firebaseUser.displayName || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
        clearSessionStartTime();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [saveSessionStartTime, clearSessionStartTime, isSessionExpired]);

  // 定期的にセッションタイムアウトをチェック（1分ごと）
  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(() => {
      if (isSessionExpired()) {
        signOut(auth);
        clearSessionStartTime();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }, 60000); // 1分ごとにチェック

    return () => clearInterval(checkInterval);
  }, [user, isSessionExpired, clearSessionStartTime]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // ログイン成功時にセッション開始時刻を保存
    saveSessionStartTime();
  };

  const signup = async (
    email: string,
    password: string,
    additionalData: {
      companyName?: string;
      representativeName?: string;
      phone?: string;
      userType: "toC" | "toB";
    }
  ) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Firestoreにユーザープロフィールを保存
    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userProfile: UserProfile = {
      id: userCredential.user.uid,
      email: userCredential.user.email || undefined,
      name: additionalData.representativeName || undefined,
      companyName: additionalData.companyName,
      representativeName: additionalData.representativeName,
      phone: additionalData.phone,
      userType: additionalData.userType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setUserProfile(userProfile);
    // 新規登録成功時にもセッション開始時刻を保存
    saveSessionStartTime();
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    clearSessionStartTime();
  };

  const sendPasswordReset = async (email: string) => {
    const redirectUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/login`
      : "/login";
    await sendPasswordResetEmail(auth, email, {
      url: redirectUrl,
      handleCodeInApp: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        signup,
        logout,
        sendPasswordReset,
        isSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


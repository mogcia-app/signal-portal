"use client";

import { useAuth } from "@/contexts/AuthContext";

/**
 * ユーザープロフィールを取得するフック
 * AuthContextのuserProfileをラップして提供
 */
export function useUserProfile() {
  const { userProfile, user, loading } = useAuth();

  return {
    userProfile,
    user,
    loading,
  };
}


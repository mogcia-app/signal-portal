"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireUserType?: "toC";
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireUserType,
}: AuthGuardProps) {
  const { user, userProfile, loading, isSessionExpired, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (requireAuth) {
      // セッションタイムアウトチェック
      if (user && isSessionExpired()) {
        logout();
        router.push("/");
        return;
      }

      // 認証が必要だが、ユーザーがログインしていない場合
      if (!user) {
        router.push("/");
        return;
      }

      // userProfileがまだ読み込まれていない場合は何もしない（待つ）
      if (userProfile === null) {
        return;
      }

      // ユーザータイプのチェック（userProfileが存在し、userTypeが設定されている場合のみ）
      if (requireUserType && userProfile && userProfile.userType && userProfile.userType !== requireUserType) {
        router.push("/");
        return;
      }
    }
  }, [user, userProfile, loading, requireAuth, requireUserType, router, pathname, isSessionExpired, logout]);

  // ローディング中
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証が必要な場合、ユーザーがログインしていない場合は何も表示しない
  if (requireAuth && !user) {
    return null;
  }

  // ユーザータイプチェック（userProfileがまだ読み込まれていない場合は待つ）
  if (requireUserType && userProfile === null && user) {
    // ユーザーは認証されているが、userProfileがまだ読み込まれていない
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  // ユーザータイプチェック（userProfileが読み込まれた後、タイプが一致しない場合）
  // userProfileが存在し、userTypeが設定されていて、それが一致しない場合のみブロック
  if (requireUserType && userProfile && userProfile.userType && userProfile.userType !== requireUserType) {
    return null;
  }

  return <>{children}</>;
}

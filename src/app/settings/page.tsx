"use client";

import { useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

export default function SettingsPage() {
  const { userProfile, loading } = useUserProfile();
  const { user } = useAuth();
  
  // パスワード変更関連のstate
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError("");
    setPasswordChangeSuccess(false);

    // バリデーション
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError("すべてのフィールドを入力してください");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordChangeError("新しいパスワードは8文字以上である必要があります");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError("新しいパスワードと確認用パスワードが一致しません");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordChangeError("新しいパスワードは現在のパスワードと異なる必要があります");
      return;
    }

    setPasswordChangeLoading(true);

    try {
      if (!user || !user.email) {
        throw new Error("ユーザー情報を取得できませんでした");
      }

      // 再認証
      await signInWithEmailAndPassword(auth, user.email, currentPassword);

      // パスワード変更
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      setPasswordChangeSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setPasswordChangeError("現在のパスワードが正しくありません");
      } else if (error.code === "auth/weak-password") {
        setPasswordChangeError("パスワードが弱すぎます。より強力なパスワードを設定してください");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordChangeError("セキュリティのため、再度ログインしてからパスワードを変更してください");
      } else {
        setPasswordChangeError(error.message || "パスワードの変更に失敗しました");
      }
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAuth>
        <div className="container mx-auto py-8">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth>
      <div className="container mx-auto py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">設定</h1>

        {/* Stripe設定が必要な場合の通知 */}
        {userProfile?.billingInfo?.requiresStripeSetup &&
          userProfile?.billingInfo?.paymentMethod === "credit_card" && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <div className="flex items-start gap-2 mb-2">
                <svg
                  className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h2 className="font-semibold text-yellow-900">
                  支払い方法の設定が必要です
                </h2>
              </div>
              <p className="text-sm text-yellow-800 mb-3">
                クレジットカード決済の設定を行ってください。
              </p>
              <Link
                href="/settings/payment"
                className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                支払い方法を設定
              </Link>
            </div>
          )}

        {/* 支払い設定セクション */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">支払い設定</h2>
          <Link
            href="/settings/payment"
            className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            支払い方法を管理
          </Link>
        </div>

        {/* パスワード変更セクション */}
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">パスワード変更</h2>
          
          <form onSubmit={handlePasswordChange}>
            {/* 現在のパスワード */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在のパスワード
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="現在のパスワードを入力"
                  disabled={passwordChangeLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={passwordChangeLoading}
                >
                  {showCurrentPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 新しいパスワード */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="8文字以上で入力してください"
                  disabled={passwordChangeLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={passwordChangeLoading}
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">8文字以上で入力してください</p>
            </div>

            {/* 新しいパスワード（確認） */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード（確認）
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="新しいパスワードを再度入力"
                  disabled={passwordChangeLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={passwordChangeLoading}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* エラーメッセージ */}
            {passwordChangeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                {passwordChangeError}
              </div>
            )}

            {/* 成功メッセージ */}
            {passwordChangeSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm">
                パスワードの変更に成功しました
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={passwordChangeLoading}
              className="px-6 py-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {passwordChangeLoading ? "変更中..." : "パスワードを変更"}
            </button>
          </form>
        </div>

        {/* その他の設定項目 */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">アカウント設定</h2>
          <p className="text-gray-600">
            その他の設定項目は順次追加予定です。
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}









"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

export default function SettingsPage() {
  const { userProfile, loading } = useUserProfile();

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









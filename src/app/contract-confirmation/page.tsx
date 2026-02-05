"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";
import AuthGuard from "@/components/AuthGuard";

export default function ContractConfirmationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    // Firestoreからユーザーデータを取得（リアルタイム監視）
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as UserProfile;
          setUserData(data);
          setLoadingData(false);

          // accessGrantedがtrueになったら/homeにリダイレクト
          if (data.accessGranted) {
            router.push("/home");
          }
        } else {
          setLoadingData(false);
        }
      },
      (error) => {
        console.error("Error fetching user data:", error);
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [user, router]);

  if (loadingData) {
    return (
      <AuthGuard requireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!userData) {
    return (
      <AuthGuard requireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">ユーザーデータが見つかりませんでした</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700"
            >
              ログインページに戻る
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const planName =
    userData.billingInfo?.plan === "light"
      ? "ベーシックプラン"
      : userData.billingInfo?.plan === "standard"
      ? "スタンダードプラン"
      : userData.billingInfo?.plan === "professional"
      ? "プロプラン"
      : "プラン未設定";

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm border border-gray-200 p-12 mb-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light text-gray-900 tracking-wide mb-2">契約内容の確認</h1>
              <div className="h-px w-24 bg-gray-300 mx-auto"></div>
            </div>

            {/* 支払い確認状況 */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200">
              <h2 className="font-semibold mb-3">支払い確認状況</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>初期費用:</span>
                  <span
                    className={`font-semibold ${
                      userData.initialPaymentConfirmed
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {userData.initialPaymentConfirmed
                      ? "✓ 確認済み"
                      : "⏳ 確認待ち"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>初月分:</span>
                  <span
                    className={`font-semibold ${
                      userData.firstMonthPaymentConfirmed
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {userData.firstMonthPaymentConfirmed
                      ? "✓ 確認済み"
                      : "⏳ 確認待ち"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span>アクセス許可:</span>
                  <span
                    className={`font-semibold ${
                      userData.accessGranted ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {userData.accessGranted ? "✓ 許可済み" : "⏳ 許可待ち"}
                  </span>
                </div>
              </div>
            </div>

            {/* 契約内容の表示 */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">契約プラン</h2>
                <div className="bg-gray-50 p-4">
                  <p className="font-medium">{planName}</p>
                  <p className="text-gray-600 mt-1">
                    月額: ¥
                    {userData.billingInfo?.monthlyFee?.toLocaleString() || 0}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">利用規約</h2>
                <div className="bg-gray-50 p-4 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    【利用規約】
                    {"\n\n"}
                    1. 本サービスは、Signal Appの会員向けサービスです。
                    {"\n"}
                    2. 月額料金は契約開始日に請求されます。
                    {"\n"}
                    3. 解約は契約期間終了日の30日前までに申し出てください。
                    {"\n"}
                    4. サービスの内容は予告なく変更される場合があります。
                    {"\n"}
                    5. 個人情報の取り扱いについては、プライバシーポリシーに準拠します。
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">支払いについて</h2>
                <div className="bg-yellow-50 border border-yellow-200 p-4">
                  <p className="text-sm text-gray-700">
                    初期費用と初月分の支払い確認が完了次第、管理者より会員サイトへのアクセス許可が行われます。
                    確認が完了するまで、しばらくお待ちください。
                  </p>
                </div>
              </section>
            </div>

            {/* アクセス許可待ちメッセージ */}
            {!userData.accessGranted && (
              <div className="mt-8 p-4 bg-gray-100 border border-gray-300 text-center">
                <p className="text-gray-700 font-medium mb-2">
                  ⏳ アクセス許可をお待ちください
                </p>
                <p className="text-sm text-gray-600">
                  支払い確認が完了次第、自動的に会員サイトにアクセスできるようになります。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}







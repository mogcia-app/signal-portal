"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

const plans: { [key: string]: { name: string; price: number } } = {
  light: { name: "ライト", price: 15000 },
  standard: { name: "スタンダード", price: 60000 },
};

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  const planIdFromUrl = searchParams.get("plan");
  // プランIDの優先順位: URLパラメータ > ユーザープロフィールのselectedPlanId > デフォルト
  const planId = planIdFromUrl || userProfile?.selectedPlanId || "standard";
  const selectedPlan = plans[planId] || plans.standard;

  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 決済完了時にプラン情報をFirestoreに保存
    if (userProfile?.id && planId) {
      try {
        const userDocRef = doc(db, "users", userProfile.id);
        await updateDoc(userDocRef, {
          selectedPlanId: planId,
          "billingInfo.plan": planId, // billingInfoにも保存（後方互換性のため）
          "billingInfo.monthlyFee": selectedPlan.price,
          "billingInfo.currency": "JPY",
          "billingInfo.paymentMethod": "credit_card",
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to save payment information:", error);
        // エラーが発生しても進む
      }
    }
    
    // デモ：決済完了
    router.push("/complete");
  };

  return (
    <AuthGuard requireAuth requireUserType="toC">
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            クレジットカード決済
          </h1>
        </div>

        {/* 選択したプラン情報 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            選択したプラン
          </h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-900 font-medium">{selectedPlan.name}</p>
              <p className="text-sm text-gray-600">
                {selectedPlan.name === "ライト" && "投稿文・ハッシュタグ生成"}
                {selectedPlan.name === "スタンダード" && "全機能"}
                {selectedPlan.name === "ライト＋" && "運用計画・投稿文・ハッシュタグ生成・KPIコンソール"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ¥{selectedPlan.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">/月</p>
            </div>
          </div>
        </div>

        {/* 決済情報フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            決済情報
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カード番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentData.cardNumber}
                onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カード名義 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentData.cardName}
                onChange={(e) => handleInputChange("cardName", e.target.value)}
                placeholder="TARO YAMADA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有効期限 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentData.expiryDate}
                  onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  placeholder="123"
                  maxLength={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-700">月額料金</span>
              <span className="text-xl font-bold text-gray-900">
                ¥{selectedPlan.price.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                戻る
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                決済を完了する
              </button>
            </div>
          </div>
        </form>
          </div>
        </div>
      </AuthGuard>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}


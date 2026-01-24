"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    id: "light",
    name: "ライト",
    price: 15000,
    features: ["投稿文・ハッシュタグ生成"],
  },
  {
    id: "standard",
    name: "スタンダード",
    price: 60000,
    features: ["全機能"],
  },
];

export default function PlanSelectionPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleNext = async () => {
    if (selectedPlan && userProfile?.id) {
      try {
        // Firestoreに選択したプランIDを保存
        const userDocRef = doc(db, "users", userProfile.id);
        await updateDoc(userDocRef, {
          selectedPlanId: selectedPlan,
          updatedAt: serverTimestamp(),
        });

        // 契約データを取得して支払方法を確認
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          const contractData = data.contractData;
          
          // 請求書発行を選択している場合は請求書ページへ、Stripe決済の場合は決済ページへ
          if (contractData?.paymentMethods?.includes("請求書発行")) {
            router.push(`/initial-invoice?plan=${selectedPlan}`);
          } else {
            router.push(`/payment?plan=${selectedPlan}`);
          }
        } else {
          router.push(`/payment?plan=${selectedPlan}`);
        }
      } catch (error) {
        console.error("Failed to save plan selection:", error);
        // エラーが発生しても進む
        router.push(`/payment?plan=${selectedPlan}`);
      }
    }
  };

  return (
    <AuthGuard requireAuth requireUserType="toC">
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            プラン選択
          </h1>
          <p className="text-gray-600">
            ご希望のプランをお選びください
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? "border-orange-600 shadow-lg"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ¥{plan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/月</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  機能
                </h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-orange-600 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedPlan === plan.id && (
                <div className="mt-4 text-center">
                  <span className="inline-block px-4 py-1 bg-orange-600 text-white text-sm rounded-full">
                    選択中
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedPlan}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedPlan
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            次へ
          </button>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}





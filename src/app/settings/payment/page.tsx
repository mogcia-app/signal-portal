"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useUserProfile } from "@/hooks/useUserProfile";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { userProfile, user } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user || !userProfile?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // 1. SetupIntentを作成（サーバーサイドで実装が必要）
      const response = await fetch("/api/stripe/create-setup-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userProfile.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "SetupIntentの作成に失敗しました");
      }

      const { clientSecret } = await response.json();

      // 2. Stripeで支払い方法を確認
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: userProfile.email || user.email || undefined,
              name: userProfile.name || userProfile.representativeName || undefined,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // 3. Firestoreに支払い方法IDを保存
      if (userProfile.id && setupIntent?.payment_method) {
        const userRef = doc(db, "users", userProfile.id);
        await updateDoc(userRef, {
          "billingInfo.stripePaymentMethodId": setupIntent.payment_method,
          "billingInfo.stripeSetupIntentId": setupIntent.id,
          "billingInfo.requiresStripeSetup": false,
          updatedAt: new Date().toISOString(),
        });

        setSuccess(true);
        // 3秒後にページをリロード
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // Stripe設定が必要な場合のみ表示
  if (!userProfile?.billingInfo?.requiresStripeSetup) {
    return (
      <div className="p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">支払い方法</h2>
        {userProfile?.billingInfo?.stripePaymentMethodId ? (
          <p className="text-green-600">✓ 支払い方法が設定されています</p>
        ) : (
          <p className="text-gray-600">支払い方法の設定は不要です</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-6 border rounded-lg bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-semibold mb-4">Stripe決済設定</h2>
        <p className="text-sm text-gray-600 mb-4">
          クレジットカード決済の設定を行ってください。
        </p>

        <div className="p-4 border rounded-lg bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            ✓ 支払い方法の設定が完了しました
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "処理中..." : "支払い方法を設定"}
        </button>
      </div>
    </form>
  );
}

export default function PaymentSettingsPage() {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <AuthGuard requireAuth>
        <div className="container mx-auto py-8 max-w-2xl">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Stripeの設定が完了していません。環境変数
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEYを設定してください。
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth>
      <div className="container mx-auto py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">支払い設定</h1>

        <Elements stripe={stripePromise}>
          <PaymentForm />
        </Elements>
      </div>
    </AuthGuard>
  );
}








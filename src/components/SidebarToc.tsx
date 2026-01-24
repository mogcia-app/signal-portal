"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SidebarToc() {
  const { userProfile } = useAuth();
  const [hasInvoicePayment, setHasInvoicePayment] = useState(false);

  useEffect(() => {
    const checkPaymentMethod = async () => {
      if (!userProfile?.id) {
        setHasInvoicePayment(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", userProfile.id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const paymentMethods = data.contractData?.paymentMethods || [];
          setHasInvoicePayment(paymentMethods.includes("請求書発行"));
        }
      } catch (error) {
        console.error("Error checking payment method:", error);
        setHasInvoicePayment(false);
      }
    };

    checkPaymentMethod();
  }, [userProfile]);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
      {/* Signal.ボタン */}
      <div className="mb-8">
        <div className="inline-block px-4 py-2 text-2xl font-semibold text-gray-900">
          Signal<span style={{ color: '#FF8a15' }}>.</span>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          メニュー
        </h2>
        
        <Link
          href="/home"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          ホーム
        </Link>
        
        <Link
          href="/usage-video"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          使い方動画
        </Link>
        
        <Link
          href="/support"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          サポート
        </Link>
        
        <Link
          href="/account"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          アカウント管理
        </Link>
        
        {hasInvoicePayment && (
          <Link
            href="/invoice"
            className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            請求書
          </Link>
        )}
        
        <Link
          href="/terms"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          契約確認
        </Link>
      </nav>
    </aside>
  );
}


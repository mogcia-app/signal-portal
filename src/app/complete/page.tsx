"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompletePage() {
  const router = useRouter();

  useEffect(() => {
    // 3秒後にホームページにリダイレクト
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ご登録ありがとうございました。
            </h1>
            <p className="text-gray-600">
              ホームページにリダイレクトします...
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            ホームページへ
          </button>
        </div>
      </div>
    </div>
  );
}


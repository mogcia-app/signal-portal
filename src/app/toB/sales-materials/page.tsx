"use client";

import SidebarTob from "@/components/SidebarTob";
import FloatingQnA from "@/components/FloatingQnA";
import AuthGuard from "@/components/AuthGuard";

const materials = [
  { id: 1, title: "Signal.サービス概要資料" },
  { id: 2, title: "導入事例集" },
  { id: 3, title: "料金プラン詳細" },
  { id: 4, title: "機能説明書" },
  { id: 5, title: "ROI試算ツール" },
];

export default function SalesMaterialsPage() {
  return (
    <AuthGuard requireAuth requireUserType="toB">
      <div className="flex min-h-screen bg-gray-50">
        {/* toB専用サイドバー */}
        <SidebarTob />

      {/* メインコンテンツエリア */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            営業資料
          </h1>

          {/* 資料一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
              >
                {/* 資料サムネイル（グレー四角） */}
                <div className="w-full aspect-video bg-gray-300 rounded-lg flex items-center justify-center mb-3">
                  <p className="text-gray-500 text-xs">
                    資料サムネイル
                  </p>
                </div>

                {/* タイトルとダウンロードアイコン */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-gray-900 flex-1">
                    {material.title}
                  </h3>
                  <button className="p-2 text-gray-600 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

        {/* 右下フローティングQ&A */}
        <FloatingQnA />
      </div>
    </AuthGuard>
  );
}




"use client";

import SidebarTob from "@/components/SidebarTob";
import FloatingQnA from "@/components/FloatingQnA";
import AuthGuard from "@/components/AuthGuard";

const videoSections = [
  { id: 1, title: "Signal.概要" },
  { id: 2, title: "計画ページ" },
  { id: 3, title: "投稿ラボ" },
  { id: 4, title: "フィード分析" },
  { id: 5, title: "リール分析" },
  { id: 6, title: "月次レポート" },
  { id: 7, title: "KPI" },
];

export default function ToBUsageVideoPage() {
  return (
    <AuthGuard requireAuth requireUserType="toB">
      <div className="flex min-h-screen bg-gray-50">
        {/* toB専用サイドバー */}
        <SidebarTob />

      {/* メインコンテンツエリア */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            使い方動画
          </h1>

          {/* 動画セクション */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoSections.map((section) => (
              <div key={section.id} className="flex flex-col">
                {/* 動画エリア（グレー四角） */}
                <div className="w-full aspect-video bg-gray-300 rounded-lg flex items-center justify-center mb-3">
                  <p className="text-gray-500 text-sm">
                    動画（後から埋め込み予定）
                  </p>
                </div>
                {/* タイトル */}
                <h3 className="text-lg font-medium text-gray-900 text-center">
                  {section.title}
                </h3>
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




"use client";

import { useState } from "react";
import SidebarToc from "@/components/SidebarToc";
import FloatingQnA from "@/components/FloatingQnA";
import AuthGuard from "@/components/AuthGuard";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Home() {
  const { userProfile } = useUserProfile();
  const [checklist, setChecklist] = useState([
    { id: 1, text: "プロフィール設定をする", completed: false, link: "https://signaltool.app/login" },
    { id: 2, text: "最初の投稿を作ってみる", completed: false, link: "https://signaltool.app/login" },
    { id: 3, text: "分析画面を見てみる", completed: false, link: "https://signaltool.app/login" },
  ]);

  const toggleChecklist = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedCount = checklist.filter(item => item.completed).length;

  return (
    <AuthGuard requireAuth requireUserType="toC">
      <div className="flex min-h-screen bg-gray-50">
        {/* toC専用サイドバー */}
        <SidebarToc />

        {/* メインコンテンツエリア */}
        <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold text-gray-900">
            ホーム
          </h1>

          {/* Signal.ツールへのアクセスボタン */}
          {userProfile?.signalToolAccessUrl && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1 text-gray-900">
                    Signal.ツールにアクセス
                  </h2>
                  <p className="text-sm text-gray-600">
                    SNS投稿作成や分析機能を使用できます
                  </p>
                </div>
                <button
                  onClick={() => {
                    // URLにアクセス（Signal.ツール側で認証処理が行われる）
                    if (userProfile.signalToolAccessUrl) {
                      console.log('Opening Signal Tool URL:', userProfile.signalToolAccessUrl);
                      window.open(userProfile.signalToolAccessUrl, '_blank');
                    } else {
                      console.error('signalToolAccessUrl is not set');
                      alert('Signal.ツールへのアクセスURLが設定されていません。管理者にお問い合わせください。');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Signal.ツールを開く
                </button>
              </div>
            </div>
          )}
          
          {/* ① はじめに見る動画（メイン） */}
          <div>
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                はじめに見る動画
              </h2>
              <p className="text-sm text-gray-600">
                何ができるツールか・まず何をすればいいか・どこを見れば迷わないか
              </p>
            </div>
            <div className="w-full h-96 bg-gray-300 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">
                概要説明動画（後から埋め込み予定・3分以内・1本完結）
          </p>
        </div>
          </div>

          {/* ② 「次にやること」チェックリスト */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                次にやること
              </h2>
              <span className="text-sm text-gray-600">
                {completedCount} / {checklist.length} 完了
              </span>
            </div>
            <div className="space-y-3">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklist(item.id)}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.completed
                        ? "text-gray-500 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {item.text}
                  </span>
                  <a
                    href={item.link}
            target="_blank"
            rel="noopener noreferrer"
                    className="text-xs text-orange-600 hover:text-orange-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    開く →
                  </a>
                </label>
              ))}
            </div>
          </div>

          {/* ③ 今月の利用状況 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              今月の利用状況
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">今月の利用回数</span>
                <span className="text-sm font-medium text-gray-900">5 / 30</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">次回更新日</span>
                <span className="text-sm font-medium text-gray-900">2月15日</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">現在のプラン</span>
                <span className="text-sm font-medium text-gray-900">Standard</span>
              </div>
            </div>
          </div>

          {/* ④ 困ったらここ（サポート導線） */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              困ったらここ
            </h2>
            <div className="space-y-2">
              <a
                href="#"
                className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
              >
                • よくある質問
              </a>
              <a
                href="/support"
                className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
              >
                • お問い合わせ
          </a>
          <a
                href="/usage-video"
                className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
          >
                • 使い方動画一覧
              </a>
            </div>
          </div>
        </div>
      </main>

        {/* 右下フローティングQ&A */}
        <FloatingQnA />
      </div>
    </AuthGuard>
  );
}


"use client";

import { useState } from "react";
import SidebarTob from "@/components/SidebarTob";
import FloatingQnA from "@/components/FloatingQnA";

const mockCases = [
  {
    id: 1,
    type: "success",
    title: "Instagram投稿で月間フォロワー5000人増加",
    description: "Signal.の投稿計画機能を活用し、一貫性のある投稿スケジュールを組むことで、月間で5000人のフォロワー増加を達成しました。",
    author: "A社",
    date: "2026/01/10",
    tags: ["Instagram", "フォロワー増加", "投稿計画"],
  },
  {
    id: 2,
    type: "success",
    title: "TikTokリールで再生数100万回突破",
    description: "分析機能を使って最適な投稿時間を把握し、タイミングよく投稿することで再生数を大幅に改善しました。",
    author: "B社",
    date: "2025/12/25",
    tags: ["TikTok", "リール", "再生数"],
  },
  {
    id: 3,
    type: "failure",
    title: "ハッシュタグ戦略の失敗から学んだこと",
    description: "人気のハッシュタグばかりを使いすぎて、逆に埋もれてしまった失敗事例。適切なハッシュタグの選定方法を学びました。",
    author: "C社",
    date: "2025/12/15",
    tags: ["ハッシュタグ", "戦略", "学習"],
  },
  {
    id: 4,
    type: "success",
    title: "ブランド認知度向上のためのKPI設定と達成",
    description: "明確なKPIを設定し、月次レポートを活用しながら戦略を調整。3ヶ月でブランド認知度を30%向上させることができました。",
    author: "D社",
    date: "2025/12/05",
    tags: ["KPI", "ブランド認知", "戦略"],
  },
];

export default function CaseStudiesPage() {
  const [activeTab, setActiveTab] = useState<"all" | "success" | "failure">("all");
  const [showPostForm, setShowPostForm] = useState(false);

  const filteredCases =
    activeTab === "all"
      ? mockCases
      : mockCases.filter((caseItem) => caseItem.type === activeTab);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarTob />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              成功事例・失敗事例の共有
            </h1>
            <button
              onClick={() => setShowPostForm(!showPostForm)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              {showPostForm ? "キャンセル" : "事例を投稿"}
            </button>
          </div>

          {/* タブ */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "all"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setActiveTab("success")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "success"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              成功事例
            </button>
            <button
              onClick={() => setActiveTab("failure")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "failure"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              失敗事例
            </button>
          </div>

          {/* 投稿フォーム */}
          {showPostForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                新しい事例を投稿
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイプ
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input type="radio" name="caseType" value="success" className="mr-2" />
                      <span className="text-sm text-gray-700">成功事例</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="caseType" value="failure" className="mr-2" />
                      <span className="text-sm text-gray-700">失敗事例</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル
                  </label>
                  <input
                    type="text"
                    placeholder="事例のタイトルを入力"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容
                  </label>
                  <textarea
                    rows={4}
                    placeholder="事例の詳細を入力"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タグ（カンマ区切り）
                  </label>
                  <input
                    type="text"
                    placeholder="例: Instagram, フォロワー増加, 投稿計画"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowPostForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    キャンセル
                  </button>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                    投稿する
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 事例一覧 */}
          <div className="space-y-4">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        caseItem.type === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {caseItem.type === "success" ? "成功事例" : "失敗事例"}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {caseItem.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  {caseItem.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {caseItem.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>投稿者: {caseItem.author}</span>
                    <span>{caseItem.date}</span>
                  </div>
                  <button className="text-orange-600 hover:text-orange-700">
                    詳細を見る →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ページネーション（デモ用） */}
          <div className="mt-8 flex justify-center gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              前へ
            </button>
            <button className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm">
              1
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              次へ
            </button>
          </div>
        </div>
      </main>

      <FloatingQnA />
    </div>
  );
}


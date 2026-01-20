"use client";

import { useState } from "react";
import SidebarTob from "@/components/SidebarTob";
import FloatingQnA from "@/components/FloatingQnA";
import AuthGuard from "@/components/AuthGuard";

const mockInvoices = [
  {
    id: 1,
    invoiceNumber: "INV-2026-001",
    issueDate: "2026/01/01",
    dueDate: "2026/01/31",
    amount: 180000,
    status: "paid",
    plan: "スタンダード × 3アカウント",
  },
  {
    id: 2,
    invoiceNumber: "INV-2025-012",
    issueDate: "2025/12/01",
    dueDate: "2025/12/31",
    amount: 180000,
    status: "paid",
    plan: "スタンダード × 3アカウント",
  },
  {
    id: 3,
    invoiceNumber: "INV-2025-011",
    issueDate: "2025/11/01",
    dueDate: "2025/11/30",
    amount: 180000,
    status: "paid",
    plan: "スタンダード × 3アカウント",
  },
];

export default function InvoicePage() {
  const [selectedYear, setSelectedYear] = useState("2026");

  return (
    <AuthGuard requireAuth requireUserType="toB">
      <div className="flex min-h-screen bg-gray-50">
        <SidebarTob />

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              請求書関係
            </h1>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="2026">2026年</option>
              <option value="2025">2025年</option>
              <option value="2024">2024年</option>
            </select>
          </div>

          {/* 契約内容確認 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              契約内容確認
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">契約プラン</span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  スタンダード × 3アカウント
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  （1アカウントあたり ¥60,000 × 3 = ¥180,000）
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">月額料金</span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  ¥180,000
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  アカウント数 × 単価で自動計算
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">契約開始日</span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  2025/11/01
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">次回請求日</span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  2026/02/01
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a
                href="/toB/accounts"
                className="text-sm text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
              >
                アカウント一覧を確認する →
              </a>
            </div>
          </div>

          {/* 請求書一覧 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              請求書一覧
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      請求書番号
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      発行日
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      支払期限
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      金額
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      ステータス
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {invoice.issueDate}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {invoice.dueDate}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        ¥{invoice.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : invoice.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {invoice.status === "paid"
                            ? "支払い済み"
                            : invoice.status === "pending"
                            ? "支払い待ち"
                            : "支払い期限切れ"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button className="text-sm text-orange-600 hover:text-orange-700">
                            表示
                          </button>
                          <span className="text-gray-300">|</span>
                          <button className="text-sm text-orange-600 hover:text-orange-700">
                            DL
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 請求書詳細（モーダル表示用のプレースホルダー） */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                ※ 請求書の「表示」をクリックすると詳細が表示されます
              </p>
            </div>
          </div>
        </div>
      </main>

        <FloatingQnA />
      </div>
    </AuthGuard>
  );
}


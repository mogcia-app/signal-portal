"use client";

import { useState } from "react";
import SidebarTob from "@/components/SidebarTob";
import FloatingQnA from "@/components/FloatingQnA";

const mockAccounts = [
  {
    id: 1,
    name: "アカウント1",
    course: "Standard",
    kpiRate: 85,
    contractDate: "2026/01/01",
    status: "active",
    instagramUrl: "https://instagram.com/account1",
  },
  {
    id: 2,
    name: "アカウント2",
    course: "Premium",
    kpiRate: 92,
    contractDate: "2025/12/15",
    status: "active",
    instagramUrl: "https://instagram.com/account2",
  },
  {
    id: 3,
    name: "アカウント3",
    course: "Standard",
    kpiRate: 78,
    contractDate: "2025/12/01",
    status: "inactive",
    instagramUrl: "",
  },
];

export default function AccountsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [accounts, setAccounts] = useState(mockAccounts);
  const [formData, setFormData] = useState({
    name: "",
    course: "Standard",
    contractDate: "",
    instagramUrl: "",
  });

  // 請求書情報（実際はFirestoreなどから取得）
  const contractPlan = {
    planName: "スタンダード",
    accountCount: 3,
    totalAccounts: accounts.length,
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount = {
      id: accounts.length + 1,
      name: formData.name,
      course: formData.course,
      kpiRate: 0,
      contractDate: formData.contractDate,
      status: "active" as const,
      instagramUrl: formData.instagramUrl,
    };
    setAccounts([...accounts, newAccount]);
    setFormData({ name: "", course: "Standard", contractDate: "", instagramUrl: "" });
    setShowAddForm(false);
  };

  const handleEditInstagramUrl = (id: number, url: string) => {
    setAccounts(accounts.map(acc => 
      acc.id === id ? { ...acc, instagramUrl: url } : acc
    ));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarTob />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                アカウント一覧
              </h1>
              <p className="text-sm text-gray-600">
                契約プラン: {contractPlan.planName} × {contractPlan.accountCount}アカウント
                <span className="ml-4">
                  （登録済み: {contractPlan.totalAccounts} / {contractPlan.accountCount}）
                </span>
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={contractPlan.totalAccounts >= contractPlan.accountCount}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                contractPlan.totalAccounts >= contractPlan.accountCount
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              {showAddForm ? "キャンセル" : "新規アカウント登録"}
            </button>
          </div>

          {/* アカウント数制限の通知 */}
          {contractPlan.totalAccounts >= contractPlan.accountCount && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                契約プランでは最大{contractPlan.accountCount}アカウントまで登録可能です。
                アカウント数を追加する場合は、プラン変更または追加契約が必要です。
              </p>
            </div>
          )}

          {/* 新規登録フォーム */}
          {showAddForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                新規アカウント登録
              </h2>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    アカウント名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    コース <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => handleInputChange("course", e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Basic">Basic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    契約日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.contractDate}
                    onChange={(e) => handleInputChange("contractDate", e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={formData.instagramUrl}
                    onChange={(e) => handleInputChange("instagramUrl", e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    登録
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* アカウント一覧 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      アカウント名
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      コース
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      KPI達成率
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      契約日
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Instagram URL
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      ステータス
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                        {account.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {account.course}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {account.kpiRate}%
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {account.contractDate}
                      </td>
                      <td className="py-3 px-4">
                        {account.instagramUrl ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={account.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-orange-600 hover:text-orange-700 truncate max-w-xs"
                            >
                              {account.instagramUrl}
                            </a>
                            <button
                              onClick={() => {
                                const newUrl = prompt("Instagram URLを入力してください", account.instagramUrl);
                                if (newUrl !== null) {
                                  handleEditInstagramUrl(account.id, newUrl);
                                }
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              編集
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const newUrl = prompt("Instagram URLを入力してください", "");
                              if (newUrl) {
                                handleEditInstagramUrl(account.id, newUrl);
                              }
                            }}
                            className="text-sm text-orange-600 hover:text-orange-700"
                          >
                            URLを追加
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            account.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {account.status === "active" ? "アクティブ" : "非アクティブ"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <FloatingQnA />
    </div>
  );
}


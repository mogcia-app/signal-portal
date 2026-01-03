import SidebarTob from "@/components/SidebarTob";
import FloatingQnA from "@/components/FloatingQnA";

export default function ToBHomePage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* toB専用サイドバー */}
      <SidebarTob />

      {/* メインコンテンツエリア */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            ホーム
          </h1>

          {/* 運営からのお知らせ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              運営からのお知らせ
            </h2>
            <div className="space-y-4">
              <div className="border-l-4 border-orange-600 pl-4">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  システムメンテナンスのお知らせ
                </p>
                <p className="text-xs text-gray-500">
                  2026年1月15日 10:00 - 12:00
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  システムメンテナンスのため、一時的にサービスがご利用いただけません。
                </p>
              </div>
            </div>
          </div>

          {/* 稼働アカウント一覧 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              稼働アカウント一覧
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
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
                      ステータス
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      アカウント1
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      Standard
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      85%
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      2026/01/01
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        アクティブ
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      アカウント2
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      Premium
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      92%
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      2025/12/15
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        アクティブ
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <a
                href="/toB/accounts"
                className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                アカウントを追加
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* 右下フローティングQ&A */}
      <FloatingQnA />
    </div>
  );
}


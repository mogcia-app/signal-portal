export default function SidebarTob() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <nav className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          メニュー
        </h2>
        
        <a
          href="#usage-video"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          使い方動画
        </a>
        
        <a
          href="#sales-materials"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          営業資料
        </a>
        
        <a
          href="#support"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          サポート
        </a>
        
        <a
          href="#case-studies"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          成功事例・失敗事例
        </a>
        
        <a
          href="#invoice"
          className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          請求書関係
        </a>
      </nav>
    </aside>
  );
}


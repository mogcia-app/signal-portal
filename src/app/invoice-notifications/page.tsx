'use client'

import React, { useState } from 'react'
import { Search, RefreshCw, FileText, AlertCircle } from 'lucide-react'
import { InvoiceNotificationCard } from '@/components/user-notifications/invoice-notification-card'
import { useInvoiceNotifications } from '@/hooks/useUserNotifications'
import { useUserProfile } from '@/hooks/useUserProfile'
import AuthGuard from '@/components/AuthGuard'

export default function InvoiceNotificationsPage() {
  const { userProfile } = useUserProfile()
  const { 
    notifications, 
    loading, 
    error, 
    markAsRead,
    archive,
    refreshNotifications
  } = useInvoiceNotifications(userProfile?.id)
  
  const [filteredNotifications, setFilteredNotifications] = useState(notifications)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // 検索とフィルタリング
  React.useEffect(() => {
    let filtered = notifications || []

    // ステータスフィルター
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(notification => notification.status === selectedStatus)
    }

    // 検索クエリフィルター
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.metadata?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchQuery, selectedStatus])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
      alert('通知を既読にしました')
    } catch (err) {
      alert('通知の既読処理に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleArchive = async (notificationId: string) => {
    if (confirm('この通知をアーカイブしますか？')) {
      try {
        await archive(notificationId)
        alert('通知をアーカイブしました')
      } catch (err) {
        alert('通知のアーカイブに失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }
    }
  }

  // 統計情報の計算
  const stats = React.useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter(n => n.status === 'unread').length
    const read = notifications.filter(n => n.status === 'read').length
    const archived = notifications.filter(n => n.status === 'archived').length
    
    return { total, unread, read, archived }
  }, [notifications])

  return (
    <AuthGuard requireAuth>
      <div className="container mx-auto py-8 px-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">請求書発行通知</h1>
            <p className="text-gray-600">
              あなた宛ての請求書発行通知を確認できます
              {error && <span className="text-red-600 ml-2">({error})</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={refreshNotifications} 
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              更新
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">総通知数</h3>
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats.total}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">未読</h3>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '-' : stats.unread}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">既読</h3>
              <FileText className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '-' : stats.read}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">アーカイブ</h3>
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-600">
              {loading ? '-' : stats.archived}
            </div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="search"
              placeholder="タイトル、内容、請求書番号で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">すべてのステータス</option>
            <option value="unread">未読</option>
            <option value="read">既読</option>
            <option value="archived">アーカイブ</option>
          </select>
        </div>

        {/* 通知一覧 */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 p-6 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">請求書発行通知がありません</h3>
            <p className="text-gray-600">
              {searchQuery || selectedStatus !== 'all' 
                ? '検索条件に一致する通知が見つかりませんでした。'
                : 'まだ請求書発行通知はありません。'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <InvoiceNotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}


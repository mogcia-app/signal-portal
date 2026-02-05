'use client'

import React, { useState } from 'react'
import { NotificationCard } from '@/components/notifications/notification-card'
import { usePublishedNotifications } from '@/hooks/useNotifications'
import { getUserPlanTier } from '@/lib/plan-access'
import { useUserProfile } from '@/hooks/useUserProfile'
import { incrementClickCount } from '@/lib/notifications'
import AuthGuard from '@/components/AuthGuard'

export default function NotificationsPage() {
  const { userProfile, loading: profileLoading } = useUserProfile()
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null)

  // プラン階層に基づいて対象オーディエンスを決定
  const planTier = userProfile ? getUserPlanTier(userProfile) : null
  const targetAudience = planTier === 'ume' ? 'trial' : 'paid'
  
  const { notifications, loading, error } = usePublishedNotifications(targetAudience)

  const handleNotificationClick = async (notificationId: string) => {
    setSelectedNotification(notificationId)
    try {
      await incrementClickCount(notificationId)
    } catch (error) {
      console.error('Error incrementing click count:', error)
    }
  }

  if (profileLoading || loading) {
    return (
      <AuthGuard requireAuth>
        <div className="container mx-auto py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">お知らせを読み込み中...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard requireAuth>
        <div className="container mx-auto py-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">お知らせの読み込みに失敗しました</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">お知らせ</h1>
          <p className="text-gray-600">
            最新のお知らせやメンテナンス情報をお知らせします
          </p>
        </div>
        
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-lg font-semibold mb-2">お知らせはありません</h3>
            <p className="text-gray-600">
              現在、表示するお知らせはありません
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification.id)}
                className={selectedNotification === notification.id ? 'ring-2 ring-orange-500' : ''}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

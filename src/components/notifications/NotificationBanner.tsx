"use client";

import React, { useState, useEffect } from 'react'
import { Notification } from '@/types/notification'
import { getPublishedNotifications, markNotificationAsRead } from '@/lib/notifications'
import { getUserPlanTier } from '@/lib/plan-access'
import { UserProfile } from '@/types/user'

interface NotificationBannerProps {
  userProfile?: UserProfile | null
  fixed?: boolean // 固定位置で表示するかどうか（デフォルト: true）
}

export function NotificationBanner({ userProfile, fixed = true }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // ユーザーのプラン階層に基づいてtargetAudienceを決定
        const planTier = getUserPlanTier(userProfile)
        const targetAudience = planTier === 'ume' ? 'trial' : 'paid'
        
        const publishedNotifications = await getPublishedNotifications(targetAudience)
        setNotifications(publishedNotifications)

        // localStorageから非表示済みIDを取得
        if (typeof window !== 'undefined') {
          const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]')
          setDismissedIds(new Set(dismissed))
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [userProfile])

  const handleDismiss = (notificationId: string) => {
    setDismissedIds(prev => {
      const newSet = new Set([...prev, notificationId])
      // localStorageに保存して永続化
      if (typeof window !== 'undefined') {
        localStorage.setItem('dismissedNotifications', JSON.stringify(Array.from(newSet)))
      }
      return newSet
    })
  }

  const handleClick = async (notification: Notification) => {
    if (userProfile?.id) {
      await markNotificationAsRead(notification.id, userProfile.id)
    }
  }

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'maintenance':
        return 'bg-gray-50 border-gray-200 text-gray-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  // 固定表示のお知らせと通常のお知らせを分ける
  const stickyNotifications = notifications.filter(n => n.isSticky && !dismissedIds.has(n.id))
  const regularNotifications = notifications
    .filter(n => !n.isSticky && !dismissedIds.has(n.id))
    .slice(0, 3) // 最大3件まで表示

  const hasNotifications = stickyNotifications.length > 0 || regularNotifications.length > 0

  if (loading) {
    return null
  }

  // 通知がない場合でも、fixed={false}の場合はメッセージを表示
  if (!hasNotifications && fixed) {
    return null
  }

  const containerClass = fixed 
    ? "fixed top-0 left-0 right-0 z-50 space-y-2 p-4"
    : "space-y-2 mb-4";

  return (
    <div className={containerClass}>
      {/* 通知がない場合のメッセージ（fixed={false}の場合のみ） */}
      {!hasNotifications && !fixed && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-gray-600 text-sm">
          <p>通知はここに表示されます</p>
        </div>
      )}

      {/* 固定表示のお知らせ */}
      {stickyNotifications.map(notification => (
        <div
          key={notification.id}
          className={`border rounded-lg p-4 shadow-lg ${getTypeStyles(notification.type)}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">{notification.title}</h3>
              <p className="text-sm whitespace-pre-wrap">{notification.content}</p>
              {notification.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {notification.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white/50 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleDismiss(notification.id)}
              className="flex-shrink-0 text-current opacity-70 hover:opacity-100"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* 通常のお知らせ */}
      {regularNotifications.map(notification => (
        <div
          key={notification.id}
          onClick={() => handleClick(notification)}
          className={`border rounded-lg p-3 shadow-md cursor-pointer transition-all hover:shadow-lg ${getTypeStyles(notification.type)}`}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{notification.title}</h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDismiss(notification.id)
              }}
              className="flex-shrink-0 text-current opacity-70 hover:opacity-100"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}





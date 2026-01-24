"use client";

import React, { useState, useEffect } from 'react'
import { getPublishedNotifications } from '@/lib/notifications'
import { Notification } from '@/types/notification'
import { getUserPlanTier } from '@/lib/plan-access'
import { useUserProfile } from '@/hooks/useUserProfile'
import AuthGuard from '@/components/AuthGuard'

export default function NotificationsPage() {
  const { userProfile, loading: profileLoading } = useUserProfile()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (profileLoading || !userProfile) {
        return
      }

      try {
        const planTier = getUserPlanTier(userProfile)
        const targetAudience = planTier === 'ume' ? 'trial' : 'paid'
        
        const publishedNotifications = await getPublishedNotifications(targetAudience)
        setNotifications(publishedNotifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [userProfile, profileLoading])

  if (profileLoading || loading) {
    return (
      <AuthGuard requireAuth>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth>
      <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8 text-gray-900">お知らせ</h1>
      
      {notifications.length === 0 ? (
        <p className="text-gray-600">お知らせはありません</p>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => {
            const getTypeStyles = (type: Notification['type']) => {
              switch (type) {
                case 'info':
                  return 'border-blue-200 bg-blue-50'
                case 'success':
                  return 'border-green-200 bg-green-50'
                case 'warning':
                  return 'border-yellow-200 bg-yellow-50'
                case 'error':
                  return 'border-red-200 bg-red-50'
                case 'maintenance':
                  return 'border-gray-200 bg-gray-50'
                default:
                  return 'border-gray-200 bg-gray-50'
              }
            }

            return (
              <div
                key={notification.id}
                className={`border rounded-lg p-6 shadow-sm ${getTypeStyles(notification.type)}`}
              >
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{notification.title}</h2>
                <div className="text-sm text-gray-500 mb-4">
                  {new Date(notification.publishedAt || notification.createdAt).toLocaleDateString('ja-JP')}
                </div>
                <div className="whitespace-pre-wrap text-gray-700">{notification.content}</div>
                {notification.tags.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {notification.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/70 rounded text-xs text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>
    </AuthGuard>
  )
}





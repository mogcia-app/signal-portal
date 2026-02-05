'use client'

import React, { useState, useEffect } from 'react'
import { X, AlertCircle, Info, CheckCircle, AlertTriangle, Wrench, Bell } from 'lucide-react'
import { getPublishedNotifications, incrementReadCount } from '@/lib/notifications'
import { Notification } from '@/types/notification'
import { getUserPlanTier } from '@/lib/plan-access'
import { UserProfile } from '@/types/user'
import { useAuth } from '@/contexts/AuthContext'

interface NotificationBannerProps {
  userProfile?: UserProfile | null
  targetAudience?: 'all' | 'trial' | 'paid'
  maxDisplay?: number
  className?: string
}

export function NotificationBanner({ 
  userProfile,
  targetAudience,
  maxDisplay = 3,
  className = '' 
}: NotificationBannerProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      // 未ログイン時は通知を取得しない
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // targetAudienceが指定されていない場合は、ユーザーのプラン階層に基づいて決定
        let finalTargetAudience = targetAudience
        if (!finalTargetAudience && userProfile) {
          const planTier = getUserPlanTier(userProfile)
          finalTargetAudience = planTier === 'ume' ? 'trial' : 'paid'
        }
        
        const publishedNotifications = await getPublishedNotifications(finalTargetAudience || 'all')
        
        const now = new Date().toISOString()
        const validNotifications = publishedNotifications
          .filter(n => {
            const isNotExpired = !n.expiresAt || n.expiresAt > now
            const isScheduled = !n.scheduledAt || n.scheduledAt <= now
            return isNotExpired && isScheduled
          })
          .sort((a, b) => {
            if (a.isSticky && !b.isSticky) return -1
            if (!a.isSticky && b.isSticky) return 1
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
            const aPriority = priorityOrder[a.priority] || 0
            const bPriority = priorityOrder[b.priority] || 0
            if (aPriority !== bPriority) return bPriority - aPriority
            return new Date(b.publishedAt || b.createdAt).getTime() - 
                   new Date(a.publishedAt || a.createdAt).getTime()
          })
          .slice(0, maxDisplay)

        setNotifications(validNotifications)
        
        // localStorageから非表示済みIDを取得
        if (typeof window !== 'undefined') {
          const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]')
          setDismissedIds(dismissed)
        }

        // 読了数を増やす
        validNotifications.forEach(async (notification) => {
          try {
            await incrementReadCount(notification.id)
          } catch (error) {
            console.error('Error incrementing read count:', error)
          }
        })
      } catch (error: any) {
        // 権限エラーの場合は無視（未ログイン時の正常な挙動）
        if (error?.code === 'permission-denied') {
          console.debug('Permission denied for notifications (user not authenticated)')
          return
        }
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user, userProfile, targetAudience, maxDisplay])

  const handleDismiss = (id: string) => {
    const newDismissedIds = [...dismissedIds, id]
    setDismissedIds(newDismissedIds)
    // localStorageに保存して永続化
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissedIds))
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-5 w-5" />
      case 'success': return <CheckCircle className="h-5 w-5" />
      case 'warning': return <AlertTriangle className="h-5 w-5" />
      case 'error': return <AlertCircle className="h-5 w-5" />
      case 'maintenance': return <Wrench className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'maintenance': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent') {
      return (
        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold">
          緊急
        </span>
      )
    }
    if (priority === 'high') {
      return (
        <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold">
          重要
        </span>
      )
    }
    return null
  }

  if (loading) {
    return null
  }

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id))

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleNotifications.map((notification) => {
        const isExpanded = expandedId === notification.id
        const typeColor = getTypeColor(notification.type)
        
        return (
          <div
            key={notification.id}
            className={`border-l-4 p-4 shadow-sm ${typeColor} ${
              notification.isSticky ? 'ring-2 ring-yellow-300' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5 flex-shrink-0">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm md:text-base">
                      {notification.title}
                    </h3>
                    {getPriorityBadge(notification.priority)}
                    {notification.isSticky && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold">
                        固定
                      </span>
                    )}
                  </div>
                  
                  {isExpanded ? (
                    <div className="mt-2">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {notification.content}
                      </p>
                      {notification.tags && notification.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {notification.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-white/50 text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => setExpandedId(null)}
                        className="mt-3 text-xs underline hover:no-underline"
                      >
                        折りたたむ
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-sm line-clamp-2">
                        {notification.content}
                      </p>
                      {notification.content.length > 100 && (
                        <button
                          onClick={() => setExpandedId(notification.id)}
                          className="mt-2 text-xs underline hover:no-underline"
                        >
                          続きを読む
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs opacity-75">
                    {new Date(notification.publishedAt || notification.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDismiss(notification.id)}
                className="ml-2 flex-shrink-0 h-6 w-6 p-0 hover:bg-white/50"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

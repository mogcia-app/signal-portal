'use client'

import { useState, useEffect } from 'react'
import { Notification } from '@/types/notification'
import { getPublishedNotifications } from '@/lib/notifications'

export function usePublishedNotifications(targetAudience?: 'all' | 'trial' | 'paid') {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPublishedNotifications = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getPublishedNotifications(targetAudience || 'all')
        setNotifications(data)
      } catch (err) {
        console.error('Error fetching published notifications:', err)
        setError(err instanceof Error ? err.message : '公開中のお知らせの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchPublishedNotifications()
  }, [targetAudience])

  return {
    notifications,
    loading,
    error
  }
}


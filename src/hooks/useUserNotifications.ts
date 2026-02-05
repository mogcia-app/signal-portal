'use client'

import { useState, useEffect } from 'react'
import { UserNotification } from '@/types/user-notification'
import { 
  getUserNotifications,
  getInvoiceNotifications,
  markUserNotificationAsRead,
  archiveUserNotification
} from '@/lib/user-notifications'

export function useUserNotifications(userId?: string, type?: string, status?: string) {
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getUserNotifications(userId, type, status)
      setNotifications(data)
    } catch (err) {
      console.error('Error fetching user notifications:', err)
      setError(err instanceof Error ? err.message : '通知の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [userId, type, status])

  const markAsRead = async (id: string) => {
    try {
      await markUserNotificationAsRead(id)
      setNotifications(prev => prev.map(notification =>
        notification.id === id
          ? { 
              ...notification, 
              status: 'read' as const,
              readAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : notification
      ))
    } catch (err) {
      console.error('Error marking notification as read:', err)
      throw err
    }
  }

  const archive = async (id: string) => {
    try {
      await archiveUserNotification(id)
      setNotifications(prev => prev.map(notification =>
        notification.id === id
          ? { 
              ...notification, 
              status: 'archived' as const,
              updatedAt: new Date().toISOString()
            }
          : notification
      ))
    } catch (err) {
      console.error('Error archiving notification:', err)
      throw err
    }
  }

  return {
    notifications,
    loading,
    error,
    markAsRead,
    archive,
    refreshNotifications: fetchNotifications
  }
}

export function useInvoiceNotifications(userId?: string, status?: string) {
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getInvoiceNotifications(userId, status)
      setNotifications(data)
    } catch (err) {
      console.error('Error fetching invoice notifications:', err)
      setError(err instanceof Error ? err.message : '請求書発行通知の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [userId, status])

  const markAsRead = async (id: string) => {
    try {
      await markUserNotificationAsRead(id)
      setNotifications(prev => prev.map(notification =>
        notification.id === id
          ? { 
              ...notification, 
              status: 'read' as const,
              readAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : notification
      ))
    } catch (err) {
      console.error('Error marking notification as read:', err)
      throw err
    }
  }

  const archive = async (id: string) => {
    try {
      await archiveUserNotification(id)
      setNotifications(prev => prev.map(notification =>
        notification.id === id
          ? { 
              ...notification, 
              status: 'archived' as const,
              updatedAt: new Date().toISOString()
            }
          : notification
      ))
    } catch (err) {
      console.error('Error archiving notification:', err)
      throw err
    }
  }

  return {
    notifications,
    loading,
    error,
    markAsRead,
    archive,
    refreshNotifications: fetchNotifications
  }
}


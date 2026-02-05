'use client'

import React from 'react'
import { 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Wrench,
  Calendar,
  Tag as TagIcon
} from 'lucide-react'
import { Notification } from '@/types/notification'

interface NotificationCardProps {
  notification: Notification
  onClick?: () => void
  className?: string
}

export function NotificationCard({ notification, onClick, className = '' }: NotificationCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-5 w-5 text-blue-600" />
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'maintenance': return <Wrench className="h-5 w-5 text-purple-600" />
      default: return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800'
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = () => {
    if (!notification.expiresAt) return false
    return new Date(notification.expiresAt) < new Date()
  }

  return (
    <div 
      className={`bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer ${className} ${
        isExpired() ? 'opacity-75' : ''
      } ${notification.isSticky ? 'border-yellow-300 border-2' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1 flex-shrink-0">
            {getTypeIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="text-lg font-semibold">{notification.title}</h3>
              {notification.isSticky && (
                <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold">
                  固定
                </span>
              )}
              <span className={`px-2 py-1 text-xs font-semibold ${getTypeColor(notification.type)}`}>
                {notification.type === 'info' ? '情報' :
                 notification.type === 'success' ? '成功' :
                 notification.type === 'warning' ? '警告' :
                 notification.type === 'error' ? 'エラー' :
                 notification.type === 'maintenance' ? 'メンテナンス' : notification.type}
              </span>
              <span className={`px-2 py-1 text-xs font-semibold border ${getPriorityColor(notification.priority)}`}>
                {notification.priority === 'urgent' ? '🚨 緊急' :
                 notification.priority === 'high' ? '🔥 高' :
                 notification.priority === 'medium' ? '📋 中' :
                 notification.priority === 'low' ? '📝 低' : notification.priority}
              </span>
              {isExpired() && (
                <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                  期限切れ
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(notification.publishedAt || notification.createdAt)}
              </span>
              {notification.expiresAt && (
                <span className={`flex items-center gap-1 ${isExpired() ? 'text-red-600' : 'text-orange-600'}`}>
                  期限: {formatDate(notification.expiresAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
          {notification.content}
        </p>
        
        {notification.tags && notification.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {notification.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs"
              >
                <TagIcon className="h-3 w-3" />
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}




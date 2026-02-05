'use client'

import React from 'react'
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  Archive,
  AlertCircle
} from 'lucide-react'
import { UserNotification } from '@/types/user-notification'

interface InvoiceNotificationCardProps {
  notification: UserNotification
  onMarkAsRead?: (id: string) => void
  onArchive?: (id: string) => void
  className?: string
}

export function InvoiceNotificationCard({ 
  notification, 
  onMarkAsRead,
  onArchive,
  className = '' 
}: InvoiceNotificationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'read': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'archived': return 'bg-gray-50 text-gray-600 border-gray-200'
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const isOverdue = () => {
    if (!notification.metadata?.dueDate) return false
    return new Date(notification.metadata.dueDate) < new Date()
  }

  return (
    <div 
      className={`bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow ${
        notification.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''
      } ${isOverdue() && notification.status !== 'archived' ? 'border-red-300 bg-red-50/50' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-lg font-semibold">{notification.title}</h3>
            
            <span className={`px-2 py-1 text-xs font-semibold border ${getStatusColor(notification.status)}`}>
              {notification.status === 'unread' ? '未読' :
               notification.status === 'read' ? '既読' :
               notification.status === 'archived' ? 'アーカイブ' : notification.status}
            </span>
            
            <span className={`px-2 py-1 text-xs font-semibold border ${getPriorityColor(notification.priority)}`}>
              {notification.priority === 'urgent' ? '🚨 緊急' :
               notification.priority === 'high' ? '🔥 高' :
               notification.priority === 'medium' ? '📋 中' :
               notification.priority === 'low' ? '📝 低' : notification.priority}
            </span>

            {isOverdue() && notification.status !== 'archived' && (
              <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                期限超過
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 mb-4 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(notification.createdAt)}
            </span>
            {notification.metadata?.invoiceNumber && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                請求書番号: {notification.metadata.invoiceNumber}
              </span>
            )}
            {notification.metadata?.amount && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                金額: {formatCurrency(notification.metadata.amount)}
              </span>
            )}
            {notification.metadata?.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue() ? 'text-red-600 font-semibold' : ''}`}>
                <Calendar className="h-3 w-3" />
                支払期限: {formatDate(notification.metadata.dueDate)}
              </span>
            )}
            {notification.readAt && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                既読: {formatDate(notification.readAt)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {notification.content}
        </p>

        {/* アクションボタン */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t">
          {notification.status === 'unread' && onMarkAsRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              既読にする
            </button>
          )}
          
          {notification.status !== 'archived' && onArchive && (
            <button
              onClick={() => onArchive(notification.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-orange-600 hover:text-orange-700"
            >
              <Archive className="h-4 w-4" />
              アーカイブ
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


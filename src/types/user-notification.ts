// 個別通知（請求書発行など、特定ユーザー向け）
export interface UserNotification {
  id: string
  userId: string // 通知対象ユーザーID
  userName?: string // ユーザー名（表示用）
  userEmail?: string // ユーザーメールアドレス（表示用）
  type: 'invoice' | 'payment' | 'contract' | 'billing' | 'system' | 'other'
  title: string
  content: string
  status: 'unread' | 'read' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: {
    invoiceId?: string
    invoiceNumber?: string
    amount?: number
    dueDate?: string
    [key: string]: any
  }
  createdAt: string
  updatedAt: string
  readAt?: string
  createdBy: string
}


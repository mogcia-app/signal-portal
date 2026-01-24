export interface Notification {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'draft' | 'published' | 'archived'
  targetAudience: 'all' | 'trial' | 'paid' | 'admin'
  scheduledAt?: string
  publishedAt?: string
  expiresAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  tags: string[]
  isSticky: boolean
  readCount: number
  clickCount: number
}







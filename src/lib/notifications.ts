import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  increment,
  Timestamp,
  limit
} from 'firebase/firestore'
import { db } from './firebase'
import { Notification } from '@/types/notification'

/**
 * 公開中のお知らせを取得（ユーザー向け）
 * @param targetAudience 対象ユーザーグループ（'all' | 'trial' | 'paid'）
 * @param userId ユーザーID（未読チェック用、オプション）
 */
export async function getPublishedNotifications(
  targetAudience: 'all' | 'trial' | 'paid' = 'all',
  userId?: string
): Promise<Notification[]> {
  try {
    const now = Timestamp.now()
    
    // 基本クエリ: status === 'published'
    // 注意: 複数のorderByを使う場合は、Firestoreの複合インデックスが必要な場合があります
    // まずは publishedAt でソート（isStickyは取得後にソート）
    let q = query(
      collection(db, 'notifications'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(50)
    )

    // targetAudienceフィルター（'all'の場合は全て表示）
    if (targetAudience !== 'all') {
      q = query(
        collection(db, 'notifications'),
        where('status', '==', 'published'),
        where('targetAudience', 'in', ['all', targetAudience]), // 'all'または対象グループ
        orderBy('publishedAt', 'desc'),
        limit(50)
      )
    }

    const snapshot = await getDocs(q)
    
    const notifications = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        publishedAt: doc.data().publishedAt?.toDate?.()?.toISOString() || doc.data().publishedAt,
        expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || doc.data().expiresAt,
        scheduledAt: doc.data().scheduledAt?.toDate?.()?.toISOString() || doc.data().scheduledAt,
      })) as Notification[]

    // 期限切れのお知らせをフィルタリング
    const validNotifications = notifications.filter(notification => {
      if (!notification.expiresAt) return true
      const expiresDate = new Date(notification.expiresAt)
      return expiresDate > new Date()
    })

    // スケジュール済みのお知らせをフィルタリング
    const activeNotifications = validNotifications.filter(notification => {
      if (!notification.scheduledAt) return true
      const scheduledDate = new Date(notification.scheduledAt)
      return scheduledDate <= new Date()
    })

    // isStickyでソート（固定表示を先に）
    const sortedNotifications = activeNotifications.sort((a, b) => {
      if (a.isSticky && !b.isSticky) return -1
      if (!a.isSticky && b.isSticky) return 1
      return 0
    })

    return sortedNotifications
  } catch (error: any) {
    // 権限エラーの場合は空配列を返す（未ログイン時の正常な挙動）
    if (error?.code === 'permission-denied') {
      console.debug('Permission denied for notifications (user not authenticated)')
      return []
    }
    console.error('Error fetching notifications:', error)
    throw error
  }
}

/**
 * 通知の閲覧数を更新
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId)
    await updateDoc(notificationRef, {
      readCount: increment(1),
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    // エラーは無視（読み取り数の更新は重要ではない）
  }
}


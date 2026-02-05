import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { UserNotification } from '@/types/user-notification'

const COLLECTIONS = {
  USER_NOTIFICATIONS: 'userNotifications'
}

/**
 * ユーザー向けの個別通知を取得
 * @param userId ユーザーID
 * @param type 通知タイプ（オプション）
 * @param status ステータス（オプション）
 */
export async function getUserNotifications(
  userId: string,
  type?: string,
  status?: string
): Promise<UserNotification[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.USER_NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    if (type) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      )
    }

    if (status) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )
    }

    if (type && status) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('userId', '==', userId),
        where('type', '==', type),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt,
    })) as UserNotification[]
  } catch (error) {
    console.error('Error fetching user notifications:', error)
    throw error
  }
}

/**
 * 請求書発行通知を取得
 * @param userId ユーザーID
 * @param status ステータス（オプション）
 */
export async function getInvoiceNotifications(
  userId: string,
  status?: string
): Promise<UserNotification[]> {
  return getUserNotifications(userId, 'invoice', status)
}

/**
 * 通知を既読にする
 * @param notificationId 通知ID
 */
export async function markUserNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_NOTIFICATIONS, notificationId)
    await updateDoc(docRef, {
      status: 'read',
      readAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * 通知をアーカイブする
 * @param notificationId 通知ID
 */
export async function archiveUserNotification(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_NOTIFICATIONS, notificationId)
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error archiving notification:', error)
    throw error
  }
}


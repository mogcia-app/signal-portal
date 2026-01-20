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
import { BlogPost } from '@/types/blog'

/**
 * 公開中のブログ記事一覧を取得
 * @param category カテゴリでフィルタリング（オプション）
 * @param tag タグでフィルタリング（オプション）
 * @param limitCount 取得件数
 */
export async function getPublishedBlogPosts(
  category?: string,
  tag?: string,
  limitCount: number = 20
): Promise<BlogPost[]> {
  try {
    let q = query(
      collection(db, 'blogPosts'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    )

    if (category) {
      q = query(
        collection(db, 'blogPosts'),
        where('status', '==', 'published'),
        where('category', '==', category),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      )
    }

    if (tag) {
      q = query(
        collection(db, 'blogPosts'),
        where('status', '==', 'published'),
        where('tags', 'array-contains', tag),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      )
    }

    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      publishedAt: doc.data().publishedAt?.toDate?.()?.toISOString() || doc.data().publishedAt,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as BlogPost[]
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    throw error
  }
}

/**
 * スラッグからブログ記事を取得
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const q = query(
      collection(db, 'blogPosts'),
      where('status', '==', 'published'),
      where('slug', '==', slug),
      limit(1)
    )

    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }

    const docData = snapshot.docs[0].data()
    return {
      id: snapshot.docs[0].id,
      ...docData,
      publishedAt: docData.publishedAt?.toDate?.()?.toISOString() || docData.publishedAt,
      createdAt: docData.createdAt?.toDate?.()?.toISOString() || docData.createdAt,
      updatedAt: docData.updatedAt?.toDate?.()?.toISOString() || docData.updatedAt,
    } as BlogPost
  } catch (error) {
    console.error('Error fetching blog post by slug:', error)
    throw error
  }
}

/**
 * 閲覧数を更新
 */
export async function incrementBlogPostViewCount(postId: string): Promise<void> {
  try {
    const postRef = doc(db, 'blogPosts', postId)
    await updateDoc(postRef, {
      viewCount: increment(1),
    })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    // エラーは無視
  }
}



export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: string
  images: string[]
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  createdAt: string
  updatedAt: string
  author: string
  viewCount: number
  seoTitle?: string
  seoDescription?: string
  readingTime?: number
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  postCount: number
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  color?: string
  postCount: number
}







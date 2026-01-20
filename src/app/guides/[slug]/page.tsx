"use client";

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getBlogPostBySlug, incrementBlogPostViewCount } from '@/lib/blog'
import { BlogPost } from '@/types/blog'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const blogPost = await getBlogPostBySlug(slug)
        setPost(blogPost)
        
        // 閲覧数を更新
        if (blogPost) {
          await incrementBlogPostViewCount(blogPost.id)
        }
      } catch (error) {
        console.error('Error fetching blog post:', error)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPost()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">記事が見つかりませんでした</h1>
          <Link href="/guides" className="text-orange-600 hover:text-orange-700">
            ガイド一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* メタ情報 */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">{post.category}</div>
        <h1 className="text-4xl font-bold mb-4 text-gray-900">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {post.publishedAt && (
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
            </div>
          )}
          {post.readingTime && (
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {post.readingTime}分
            </div>
          )}
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.viewCount || 0}
          </div>
        </div>
      </div>

      {/* 本文 */}
      <div className="prose max-w-none mb-8">
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {post.content}
        </div>
      </div>

      {/* タグ */}
      {post.tags.length > 0 && (
        <div className="flex gap-2 mt-8 pt-8 border-t border-gray-200">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}


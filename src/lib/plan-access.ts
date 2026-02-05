import { UserProfile, PlanTier } from '@/types/user'

export const PLAN_FEATURES = {
  ume: {
    canAccessLab: true,
    canAccessPosts: false,
    canAccessAnalytics: false,
    canAccessPlan: false,
    canAccessReport: false,
    canAccessKPI: false,
    canAccessLearning: false,
  },
  take: {
    canAccessLab: true,
    canAccessPosts: true,
    canAccessAnalytics: false,
    canAccessPlan: false,
    canAccessReport: false,
    canAccessKPI: false,
    canAccessLearning: false,
  },
  matsu: {
    canAccessLab: true,
    canAccessPosts: true,
    canAccessAnalytics: true,
    canAccessPlan: true,
    canAccessReport: true,
    canAccessKPI: true,
    canAccessLearning: true,
  },
} as const

/**
 * ユーザーのプラン階層を取得（デフォルトは"ume"）
 */
export function getUserPlanTier(userProfile: UserProfile | null | undefined): PlanTier {
  return userProfile?.planTier || 'ume'
}

/**
 * 特定機能へのアクセス権限をチェック
 */
export function canAccessFeature(
  userProfile: UserProfile | null | undefined,
  feature: keyof typeof PLAN_FEATURES.ume
): boolean {
  const tier = getUserPlanTier(userProfile)
  return PLAN_FEATURES[tier][feature]
}

/**
 * プラン階層に基づいてアクセス拒否メッセージを取得
 */
export function getAccessDeniedMessage(feature: string): string {
  return `${feature}機能は、現在のプランではご利用いただけません。プランのアップグレードをご検討ください。`
}

/**
 * プランの表示名を取得
 */
export function getPlanName(tier: PlanTier): string {
  const names = {
    ume: '梅プラン',
    take: '竹プラン',
    matsu: '松プラン',
  }
  return names[tier]
}










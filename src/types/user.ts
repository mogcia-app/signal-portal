export interface UserProfile {
  id?: string
  email?: string
  name?: string
  companyName?: string
  representativeName?: string
  phone?: string
  userType?: 'toC' | 'toB' // ユーザータイプ（個人/企業）
  planTier?: 'ume' | 'take' | 'matsu'
  signalToolAccessUrl?: string // Signal.ツールへのアクセスURL
  /**
   * 支払い確認・アクセス制御フラグ
   */
  initialPaymentConfirmed?: boolean // 初期費用確認済み（Admin側で設定）
  firstMonthPaymentConfirmed?: boolean // 初月分確認済み（Admin側で設定）
  accessGranted?: boolean // 会員サイトアクセス許可（Admin側で設定）
  billingInfo?: {
    plan?: 'trial' | 'basic' | 'light' | 'standard' | 'professional' | 'enterprise'
    monthlyFee?: number
    currency?: 'JPY' | 'USD'
    paymentMethod?: 'credit_card' | 'bank_transfer' | 'invoice'
    nextBillingDate?: string
    paymentStatus?: 'paid' | 'pending' | 'overdue'
    stripeCustomerId?: string
    stripePaymentMethodId?: string
    stripeSetupIntentId?: string
    requiresStripeSetup?: boolean
  }
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

export type PlanTier = 'ume' | 'take' | 'matsu'



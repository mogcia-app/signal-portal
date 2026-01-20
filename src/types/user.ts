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
  billingInfo?: {
    plan?: 'trial' | 'basic' | 'professional' | 'enterprise'
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



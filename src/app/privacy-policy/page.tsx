"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

const PRIVACY_POLICY_AGREED_KEY = "privacyPolicyAgreed";
const PRIVACY_POLICY_AGREED_DATE_KEY = "privacyPolicyAgreedDate";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isAgreedPersisted, setIsAgreedPersisted] = useState(false);
  const [agreedDate, setAgreedDate] = useState<string>("");

  // ページ読み込み時にlocalStorageから同意状態を確認
  useEffect(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem(PRIVACY_POLICY_AGREED_KEY);
      const persistedDate = localStorage.getItem(PRIVACY_POLICY_AGREED_DATE_KEY);
      if (persisted === "true") {
        setAgreed(true);
        setIsAgreedPersisted(true);
        if (persistedDate) {
          setAgreedDate(persistedDate);
        }
      }
    }
  }, []);

  const handleAgreementChange = (checked: boolean) => {
    setAgreed(checked);
    if (checked && typeof window !== "undefined") {
      // 同意したらlocalStorageに保存（日付も保存）
      const now = new Date();
      const dateString = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
      localStorage.setItem(PRIVACY_POLICY_AGREED_KEY, "true");
      localStorage.setItem(PRIVACY_POLICY_AGREED_DATE_KEY, dateString);
      setIsAgreedPersisted(true);
      setAgreedDate(dateString);
    }
  };

  const handleNext = () => {
    if (agreed) {
      router.push("/contract");
    }
  };

  return (
    <AuthGuard requireAuth>
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                プライバシーポリシー
              </h1>
              <p className="text-gray-600">
                個人情報の取り扱いについてご確認ください
              </p>
            </div>

            <div className="prose max-w-none mb-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Signal<span style={{ color: '#FF8a15' }}>.</span> プライバシーポリシー
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  株式会社MOGCIA（以下「当社」といいます。）は、当社が提供するSNS運用支援ツール「Signal.」および関連する会員サイト（以下総称して「本サービス」といいます。）において取得する個人情報および利用情報について、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  本ポリシーは、法人契約を前提とし、契約法人の役員・従業員・業務委託者等（以下「利用者」）による利用を想定して定められています。
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">第1条（適用範囲）</h3>
                  <p className="mb-3">
                    本ポリシーは、本サービスの提供に関連して当社が取得するすべての情報に適用されます。
                  </p>
                  <p className="mb-3">
                    本ポリシーは、本サービスの利用に関し、当社と契約者との間で締結される利用契約および関連規約と一体として適用されます。
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第2条（取得する情報）</h3>
                  <p className="mb-3">
                    当社は、本サービスの提供および適切な運営・管理のため、以下の情報を取得します。
                  </p>
                  
                  <div className="mb-3">
                    <h4 className="font-medium mb-2">1. 契約・アカウント情報</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1 mb-3">
                      <li>氏名、メールアドレス、所属企業名、部署名、役職</li>
                      <li>アカウントID、認証情報（パスワードそのものは含みません）</li>
                    </ul>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-medium mb-2">2. 利用状況ログ情報（ログ監視対象）</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1 mb-3">
                      <li>ログイン日時、ログアウト日時</li>
                      <li>IPアドレス</li>
                      <li>端末情報（OS、ブラウザ種別、UserAgent 等）</li>
                      <li>アクセス元地域情報（推定情報）</li>
                      <li>本サービス内での操作履歴</li>
                      <li>各画面・機能の閲覧履歴および滞在時間</li>
                      <li>コンテンツ閲覧・動画再生・資料表示等の利用状況</li>
                    </ul>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-medium mb-2">3. その他の情報</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>問い合わせ内容および対応履歴</li>
                      <li>契約管理、請求・支払に関連する情報</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第3条（利用目的）</h3>
                  <p className="mb-3">
                    当社は、取得した情報を以下の目的で利用します。
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-3">
                    <li>本サービスの提供、維持、改善および品質向上のため</li>
                    <li>契約内容の管理、利用状況の把握およびサポート対応のため</li>
                    <li>不正利用、規約違反、情報漏洩、競合・模倣行為等の防止および調査のため</li>
                    <li>利用規約または利用契約違反の有無を判断するため</li>
                    <li>利用停止、契約解除、損害賠償請求その他法的措置を講じるための証拠・根拠として利用するため</li>
                    <li>システム障害対応、セキュリティ確保およびトラブル防止のため</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第4条（ログ監視および分析について）</h3>
                  <p className="mb-3">
                    当社は、本サービスの適正な運営および知的財産の保護を目的として、利用状況ログの取得および監視を行います。
                  </p>
                  <p className="mb-3">
                    当該ログには、画面閲覧状況、滞在時間、操作履歴等が含まれる場合があります。
                  </p>
                  <p className="mb-3">
                    利用者は、本サービスを利用することにより、前各項のログ取得および監視に同意したものとみなされます。
                  </p>
                  <p className="mb-3">
                    当社は、取得したログ情報を、契約違反の有無の判断、是正措置、法的措置の根拠として利用することがあります。
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第5条（第三者提供の制限）</h3>
                  <p className="mb-3">
                    当社は、法令に基づく場合を除き、取得した個人情報および利用状況ログを第三者に提供しません。
                  </p>
                  <p className="mb-3">
                    ただし、本サービスの運営に必要な範囲で、業務委託先に対して情報を提供する場合があります。この場合、当社は適切な管理・監督を行います。
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第6条（法人契約における取扱い）</h3>
                  <p className="mb-3">
                    本サービスが法人契約に基づき提供される場合、利用者の利用状況は、契約法人の管理責任のもとで利用されるものとします。
                  </p>
                  <p className="mb-3">
                    当社は、契約法人からの正当な要請があった場合、契約法人の管理目的に限り、利用状況情報を開示することがあります。
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第7条（情報の管理）</h3>
                  <p className="mb-3">
                    当社は、取得した情報について、不正アクセス、漏洩、改ざん、滅失等を防止するため、合理的かつ適切な安全管理措置を講じます。
                  </p>
                  <p className="mb-3">
                    当社は、情報の取扱いを第三者に委託する場合、適切な契約および監督を行います。
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第8条（保存期間）</h3>
                  <p className="mb-3">
                    当社は、取得した情報について、利用目的に照らして必要な期間保存し、不要となった場合は適切な方法により削除または匿名化します。
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第9条（開示・訂正・削除等）</h3>
                  <p className="mb-3">
                    利用者は、当社所定の方法により、自己の個人情報について開示、訂正、利用停止等を請求することができます。ただし、契約管理および法的義務の履行に必要な情報については、この限りではありません。
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第10条（改定）</h3>
                  <p className="mb-3">
                    当社は、法令の改正、サービス内容の変更等に応じて、本ポリシーを改定することがあります。改定後の内容は、本サービス上への掲載その他当社が適切と判断する方法により通知します。
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">第11条（お問い合わせ窓口）</h3>
                  <p className="mb-3">
                    本ポリシーに関するお問い合わせは、以下の窓口までご連絡ください。
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm leading-relaxed">
                      <strong>株式会社MOGCIA</strong><br />
                      〒810-0001<br />
                      福岡県福岡市中央区天神4-6-28 いちご天神ノースビル7階<br />
                      <br />
                      TEL: 092-517-9804<br />
                      Email: info@mogcia.jp<br />
                      受付時間: 平日 10:00-17:00
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    【制定日】2025年06月01日
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              {isAgreedPersisted ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800">
                    ✓ プライバシーポリシーに同意済みです。同意日: {agreedDate}
                  </p>
                </div>
              ) : (
                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => handleAgreementChange(e.target.checked)}
                    className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">
                    プライバシーポリシーの内容を確認し、同意します
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={handleNext}
                  disabled={!agreed}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    agreed
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}


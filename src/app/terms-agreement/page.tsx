"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

const MEMBER_SITE_TERMS_AGREED_KEY = "memberSiteTermsAgreed";
const MEMBER_SITE_TERMS_AGREED_DATE_KEY = "memberSiteTermsAgreedDate";

export default function TermsAgreementPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isAgreedPersisted, setIsAgreedPersisted] = useState(false);
  const [agreedDate, setAgreedDate] = useState<string>("");

  // ページ読み込み時にlocalStorageから同意状態を確認
  useEffect(() => {
    if (typeof window !== "undefined") {
      const persisted = localStorage.getItem(MEMBER_SITE_TERMS_AGREED_KEY);
      const persistedDate = localStorage.getItem(MEMBER_SITE_TERMS_AGREED_DATE_KEY);
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
      localStorage.setItem(MEMBER_SITE_TERMS_AGREED_KEY, "true");
      localStorage.setItem(MEMBER_SITE_TERMS_AGREED_DATE_KEY, dateString);
      setIsAgreedPersisted(true);
      setAgreedDate(dateString);
    }
  };

  const handleNext = () => {
    if (agreed) {
      router.push("/tool-terms-agreement");
    }
  };

  return (
    <AuthGuard requireAuth>
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            会員サイト利用規約への同意
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-bold text-gray-900">Signal</span><span style={{ color: '#ff8a15' }}>.</span>会員サイトをご利用いただくための規約にご同意ください
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Signal. 会員サイト利用規約
            </h2>
            <div className="text-sm text-gray-700 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">第1条（適用）</h3>
                <p>
                  本規約は、株式会社MOGCIA（以下「当社」といいます。）が提供する会員サイトおよび関連する各種サービス（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザー（以下「ユーザー」といいます。）は、本規約に同意のうえ、本サービスを利用するものとします。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第2条（利用登録）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本サービスの利用を希望する者は、本規約に同意のうえ、当社所定の方法により利用登録を申請するものとします。</li>
                  <li>当社が当該申請を承認した時点で、利用登録が完了するものとします。</li>
                  <li>法人として本サービスを利用する場合、当該法人は管理責任者を定め、当該管理責任者は、法人に所属する利用者の行為について一切の責任を負うものとします。</li>
                  <li>当社は、以下のいずれかに該当すると判断した場合、利用登録を承認しない、または承認後であっても登録を取消すことがあります。
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>登録内容に虚偽、誤記または記載漏れがあった場合</li>
                      <li>過去に本規約違反等により利用停止または登録抹消を受けたことがある場合</li>
                      <li>反社会的勢力に該当、または関係を有すると判断した場合</li>
                      <li>その他、当社が利用登録を相当でないと判断した場合</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第3条（ユーザーIDおよびパスワードの管理）</h3>
                <p>
                  ユーザーは、自己の責任においてユーザーIDおよびパスワードを適切に管理・保管するものとします。ユーザーIDまたはパスワードの第三者による使用により生じた損害について、当社は故意または重大な過失がある場合を除き、一切の責任を負いません。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第4条（利用料金および支払い方法）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>ユーザーは、本サービス利用の対価として、当社が別途定め本サービス上に表示する利用料金を、当社指定の方法により支払うものとします。</li>
                  <li>支払い方法は、Stripeによるクレジットカード決済、口座振替、または請求書発行による銀行振込とします。</li>
                  <li>Stripe決済の場合、課金開始日、無料利用期間の有無、次回更新日および支払日は、Stripe上に表示される内容に準ずるものとします。</li>
                  <li>口座振替または請求書発行の場合、支払期日は、当社とユーザー間で締結する契約書または申込書に定める支払日とし、ユーザーは当該期日を厳守するものとします。</li>
                  <li>支払い期限を過ぎてもなお支払いが行われない場合、ユーザーは年14.6％の割合による遅延損害金を支払うものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第5条（プランおよび機能制限）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本サービスには複数の料金プランがあり、プランごとに利用可能な機能が異なります。</li>
                  <li>ユーザーは、当社所定の方法によりプランの変更（アップグレードまたはダウングレード）を行うことができます。</li>
                  <li>ダウングレードの場合、変更後プランで利用できない機能・データにアクセスできなくなることについて、当社は一切の責任を負いません。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第6条（禁止事項）</h3>
                <p>
                  ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為またはこれに関連する行為</li>
                  <li>本サービスに含まれる著作権、商標権その他の知的財産権を侵害する行為</li>
                  <li>当社または第三者のサーバー、ネットワークの機能を妨害する行為</li>
                  <li>本サービスで得られた情報を、当社の許可なく第三者へ提供または商業利用する行為</li>
                  <li>不正アクセスまたはこれを試みる行為</li>
                  <li>他のユーザーの個人情報を不正に収集または利用する行為</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第7条（サービス内容の変更・停止）</h3>
                <p>
                  当社は、事前の通知なく、本サービスの内容を変更、追加、停止または中断することがあります。これによりユーザーに生じた損害について、当社は一切の責任を負いません。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第8条（利用停止・登録抹消）</h3>
                <p>
                  当社は、ユーザーが本規約に違反した場合、事前の通知なく、本サービスの全部または一部の利用停止、または利用登録の抹消を行うことができます。この場合でも、既に支払われた利用料金の返金は行いません。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第9条（AI生成コンテンツおよび免責）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本サービスにより生成される投稿案、分析結果、アドバイス等は、情報提供および意思決定支援を目的とするものであり、成果や効果を保証するものではありません。</li>
                  <li>SNSのフォロワー数増加、エンゲージメント向上、売上増加等の成果について、当社は一切保証しません。</li>
                  <li>外部SNS（Instagram、X、TikTok等）の仕様変更、アルゴリズム変更、API制限等により生じた不利益について、当社は責任を負いません。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第10条（知的財産権）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本サービスを通じて生成されたコンテンツの利用権は、ユーザーに帰属します。</li>
                  <li>当社は、サービス改善および品質向上を目的として、個人を特定しない形で生成データを利用できるものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第11条（個人情報の取扱い）</h3>
                <p>
                  当社は、本サービスの利用により取得した個人情報を、当社が別途定めるプライバシーポリシーに従い、適切に取り扱います。本規約とプライバシーポリシーの内容に相違がある場合は、プライバシーポリシーの定めが優先されるものとします。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第12条（解約・退会）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>ユーザーは、当社所定の方法により、いつでも本サービスを解約することができます。</li>
                  <li>Stripe決済の場合、解約は次回更新日の前日までに行うものとし、当該更新日以降の利用料金は発生しません。</li>
                  <li>無料利用期間が設定されている場合、当該期間内に解約が行われない限り、無料期間終了日の翌日から自動的に有料プランへ移行します。</li>
                  <li>口座振替または請求書発行の場合、解約の効力は、当社とユーザー間で定めた契約期間満了時に生じるものとします。</li>
                  <li>解約後も、解約時点までに発生した利用料金の支払義務は存続します。</li>
                  <li>解約後、一定期間経過後にユーザーデータは削除されることがあります。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第13条（反社会的勢力の排除）</h3>
                <p>
                  ユーザーは、自らが反社会的勢力に該当しないこと、および将来にわたっても該当しないことを保証するものとします。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第14条（利用規約の変更）</h3>
                <p>
                  当社は、必要と判断した場合、ユーザーの同意を得ることなく本規約を変更することができます。変更後の規約は、本サービス上に掲載した時点で効力を生じるものとします。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第15条（通知または連絡）</h3>
                <p>
                  当社からユーザーへの通知または連絡は、本サービス上の表示、電子メールその他当社が適当と判断する方法により行います。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第16条（準拠法および管轄）</h3>
                <p>
                  本規約は日本法を準拠法とし、本サービスに関して生じた紛争については、福岡地方裁判所を第一審の専属的合意管轄裁判所とします。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            {isAgreedPersisted ? (
              <div className="flex items-center gap-2">
                <label htmlFor="agree" className="text-sm text-gray-700">
                  <Link href="/terms" className="text-orange-600 hover:text-orange-700 underline">
                    会員サイト利用規約
                  </Link>
                  <span className="ml-2 text-green-600 font-medium">に同意済みです。</span>
                  {agreedDate && (
                    <span className="ml-2 text-sm text-gray-600">
                      同意日 {agreedDate}
                    </span>
                  )}
                </label>
              </div>
            ) : (
              <>
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => handleAgreementChange(e.target.checked)}
                  className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                  <Link href="/terms" className="text-orange-600 hover:text-orange-700 underline">
                    会員サイト利用規約
                  </Link>
                  に同意します
                </label>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            disabled={!agreed && !isAgreedPersisted}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              agreed || isAgreedPersisted
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            次へ
          </button>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}





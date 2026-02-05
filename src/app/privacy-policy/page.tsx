"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { checkAllAgreements, getNextAgreementPage } from "@/lib/agreementCheck";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isAgreedPersisted, setIsAgreedPersisted] = useState(false);
  const [agreedDate, setAgreedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // ページ読み込み時にFirestoreから同意状態を確認
  useEffect(() => {
    const loadAgreementStatus = async () => {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      try {
        // まず、すべての同意状態をチェックして、既に同意済みの場合は即座にリダイレクト
        const status = await checkAllAgreements(userProfile.id);
        const nextPage = getNextAgreementPage(status);
        
        // プライバシーポリシーが既に同意済みで、次のページが別のページの場合は即座にリダイレクト
        if (status.privacyPolicy && nextPage && nextPage !== "/privacy-policy") {
          router.replace(nextPage);
          return;
        }
        if (status.privacyPolicy && nextPage === null) {
          router.replace("/home");
          return;
        }

        const userDocRef = doc(db, "users", userProfile.id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // サブコレクションから最新の同意履歴を読み込む
          try {
            const consentRef = collection(db, "users", userProfile.id, "privacyPolicyConsents");
            const consentQuery = query(consentRef, orderBy("agreedAt", "desc"), limit(1));
            const consentSnapshot = await getDocs(consentQuery);
            
            if (!consentSnapshot.empty) {
              // サブコレクションが存在する場合（新しい構造で保存されている）
              // 同意済みとして表示する
              const latestConsent = consentSnapshot.docs[0].data();
              setAgreed(true);
              setIsAgreedPersisted(true);
              if (latestConsent.agreedAt) {
                const agreedAt = latestConsent.agreedAt;
                let date: Date;
                if (agreedAt?.toDate) {
                  date = agreedAt.toDate();
                } else if (typeof agreedAt === 'string') {
                  date = new Date(agreedAt);
                } else {
                  date = new Date();
                }
                const dateStr = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
                const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                setAgreedDate(`${dateStr} ${timeStr}`);
              }
            } else {
              // サブコレクションが存在しない場合（古いデータ）
              const privacyPolicyAgreed = data.privacyPolicyAgreed;
              const privacyPolicyAgreedDate = data.privacyPolicyAgreedDate;
              const privacyPolicyAgreedAt = data.privacyPolicyAgreedAt;
              
              if (privacyPolicyAgreed === true && privacyPolicyAgreedDate) {
                // 古いデータがある場合は同意済みとして表示
                setAgreed(true);
                setIsAgreedPersisted(true);
                if (privacyPolicyAgreedAt) {
                  let date: Date;
                  if (privacyPolicyAgreedAt?.toDate) {
                    date = privacyPolicyAgreedAt.toDate();
                  } else if (typeof privacyPolicyAgreedAt === 'string') {
                    date = new Date(privacyPolicyAgreedAt);
                  } else {
                    date = new Date();
                  }
                  const dateStr = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
                  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                  setAgreedDate(`${dateStr} ${timeStr}`);
                } else {
                  setAgreedDate(privacyPolicyAgreedDate);
                }
              } else {
                setAgreed(false);
                setIsAgreedPersisted(false);
              }
            }
          } catch (consentError) {
            console.error("Failed to load consent history:", consentError);
            // エラー時は古いデータを確認
            const privacyPolicyAgreed = data.privacyPolicyAgreed;
            const privacyPolicyAgreedDate = data.privacyPolicyAgreedDate;
            const privacyPolicyAgreedAt = data.privacyPolicyAgreedAt;
            
            if (privacyPolicyAgreed === true && privacyPolicyAgreedDate) {
              setAgreed(true);
              setIsAgreedPersisted(true);
              if (privacyPolicyAgreedAt) {
                let date: Date;
                if (privacyPolicyAgreedAt?.toDate) {
                  date = privacyPolicyAgreedAt.toDate();
                } else if (typeof privacyPolicyAgreedAt === 'string') {
                  date = new Date(privacyPolicyAgreedAt);
                } else {
                  date = new Date();
                }
                const dateStr = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
                const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                setAgreedDate(`${dateStr} ${timeStr}`);
              } else {
                setAgreedDate(privacyPolicyAgreedDate);
              }
            } else {
              setAgreed(false);
              setIsAgreedPersisted(false);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load agreement status:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAgreementStatus();
  }, [userProfile]);

  // 同意済みの場合、次のページにリダイレクト
  useEffect(() => {
    const redirectIfAgreed = async () => {
      if (!userProfile?.id || loading) return;
      
      if (isAgreedPersisted) {
        // すべての同意状態をチェック
        const status = await checkAllAgreements(userProfile.id);
        const nextPage = getNextAgreementPage(status);
        
        if (nextPage === null) {
          // すべて同意済みの場合は/homeにリダイレクト
          router.push("/home");
        } else if (nextPage !== "/privacy-policy") {
          // 次の同意ページにリダイレクト
          router.push(nextPage);
        }
      }
    };

    redirectIfAgreed();
  }, [isAgreedPersisted, userProfile, loading, router]);

  const handleAgreementChange = async (checked: boolean) => {
    // 既に保存済みの場合は変更不可
    if (isAgreedPersisted) {
      return;
    }

    if (!checked) {
      setAgreed(false);
      return;
    }

    setAgreed(true);
    
    if (!userProfile?.id) {
      alert("ユーザー情報が取得できませんでした。再度お試しください。");
      return;
    }

    try {
      // APIルーター経由でサーバー側に保存（IPアドレス、User-Agent、タイムスタンプも記録）
      const response = await fetch("/api/agreements/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "privacyPolicy",
          agreed: true,
          userId: userProfile.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "同意状態の保存に失敗しました");
      }

      const result = await response.json();
      
      setIsAgreedPersisted(true);
      setAgreed(true);
      // 日付と時間を表示（APIから返されたtimestampを使用）
      if (result.data.timestamp) {
        const date = new Date(result.data.timestamp);
        const dateStr = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        setAgreedDate(`${dateStr} ${timeStr}`);
      } else {
        setAgreedDate(result.data.date);
      }
      
      console.log("同意状態をサーバー側に保存しました:", result.data);
    } catch (error) {
      console.error("Failed to save agreement status:", error);
      alert("同意状態の保存に失敗しました。再度お試しください。");
      setAgreed(false);
    }
  };

  const handleNext = () => {
    if (agreed || isAgreedPersisted) {
      router.push("/contract");
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAuth>
        <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm border border-gray-200 p-12 mb-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light text-gray-900 tracking-wide mb-2">プライバシーポリシー</h1>
              <div className="h-px w-24 bg-gray-300 mx-auto mb-4"></div>
              <p className="text-gray-600">
                個人情報の取り扱いについてご確認ください
              </p>
            </div>

            <div className="prose max-w-none mb-8">
              <div className="bg-gray-50 border border-gray-200 p-6 mb-6">
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
                  <div className="bg-gray-50 border border-gray-200 p-4">
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
                <div className="bg-gray-100 border-2 border-black p-4 mb-4">
                  <p className="text-sm text-red-800 font-bold flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-red-800 bg-white">
                      <svg className="w-3 h-3 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    プライバシーポリシーに同意済みです。同意日: {agreedDate}
                  </p>
                </div>
              ) : (
                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => handleAgreementChange(e.target.checked)}
                    disabled={isAgreedPersisted}
                    className={`mt-1 w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500 ${
                      isAgreedPersisted ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                  <span className={`text-sm text-gray-700 ${
                    isAgreedPersisted ? "cursor-default" : ""
                  }`}>
                    プライバシーポリシーの内容を確認し、同意します
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={handleNext}
                  disabled={!agreed && !isAgreedPersisted}
                  className={`px-6 py-2 font-medium transition-colors ${
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
        </div>
      </div>
    </AuthGuard>
  );
}


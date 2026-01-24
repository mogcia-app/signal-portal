"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

export default function ToolTermsAgreementPage() {
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
        const userDocRef = doc(db, "users", userProfile.id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // サブコレクションから最新の同意履歴を読み込む
          try {
            const consentRef = collection(db, "users", userProfile.id, "toolTermsConsents");
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
              const toolTermsAgreed = data.toolTermsAgreed;
              const toolTermsAgreedDate = data.toolTermsAgreedDate;
              const toolTermsAgreedAt = data.toolTermsAgreedAt;
              
              if (toolTermsAgreed === true && toolTermsAgreedDate) {
                // 古いデータがある場合は同意済みとして表示
                setAgreed(true);
                setIsAgreedPersisted(true);
                if (toolTermsAgreedAt) {
                  let date: Date;
                  if (toolTermsAgreedAt?.toDate) {
                    date = toolTermsAgreedAt.toDate();
                  } else if (typeof toolTermsAgreedAt === 'string') {
                    date = new Date(toolTermsAgreedAt);
                  } else {
                    date = new Date();
                  }
                  const dateStr = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
                  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                  setAgreedDate(`${dateStr} ${timeStr}`);
                } else {
                  setAgreedDate(toolTermsAgreedDate);
                }
              } else {
                setAgreed(false);
                setIsAgreedPersisted(false);
              }
            }
          } catch (consentError) {
            console.error("Failed to load consent history:", consentError);
            // エラー時は古いデータを確認
            const toolTermsAgreed = data.toolTermsAgreed;
            const toolTermsAgreedDate = data.toolTermsAgreedDate;
            const toolTermsAgreedAt = data.toolTermsAgreedAt;
            
            if (toolTermsAgreed === true && toolTermsAgreedDate) {
              setAgreed(true);
              setIsAgreedPersisted(true);
              if (toolTermsAgreedAt) {
                let date: Date;
                if (toolTermsAgreedAt?.toDate) {
                  date = toolTermsAgreedAt.toDate();
                } else if (typeof toolTermsAgreedAt === 'string') {
                  date = new Date(toolTermsAgreedAt);
                } else {
                  date = new Date();
                }
                const dateStr = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
                const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                setAgreedDate(`${dateStr} ${timeStr}`);
              } else {
                setAgreedDate(toolTermsAgreedDate);
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
          type: "toolTerms",
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
      console.error("Failed to save tool terms agreement:", error);
      alert("同意状態の保存に失敗しました。再度お試しください。");
      setAgreed(false);
    }
  };

  const handleNext = async () => {
    if (agreed || isAgreedPersisted) {
      // 契約書確認ページへリダイレクト（初期費用の支払い確認待ち）
      router.push("/contract-confirmation");
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
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="font-bold text-gray-900">Signal</span><span style={{ color: '#ff8a15' }}>.</span>ツール利用規約への同意
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-bold text-gray-900">Signal</span><span style={{ color: '#ff8a15' }}>.</span>ツール（SNS投稿作成・分析ツール）をご利用いただくための規約にご同意ください
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Signal. ツール利用規約
            </h2>
            <div className="text-sm text-gray-700 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">第1条（適用）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本規約は、株式会社MOGCIA（以下「当社」といいます。）が提供する Signal.ツール（以下「本ツール」といいます。）の利用条件を定めるものです。</li>
                  <li>本ツールの利用にあたっては、当社が別途定める「Signal.会員サイト利用規約」（以下「会員サイト規約」といいます。）も併せて適用されるものとします。</li>
                  <li>本規約と会員サイト規約の内容に相違がある場合は、本ツールの利用に関しては本規約が優先して適用されるものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第2条（本ツールの内容）</h3>
                <p>
                  本ツールは、以下の機能を提供します。
                </p>
                <ol className="list-decimal list-inside ml-2 space-y-1 mt-2">
                  <li>SNS投稿文およびハッシュタグの生成機能</li>
                  <li>SNS投稿計画・運用プランの作成機能</li>
                  <li>SNS投稿データの分析機能（フィード分析、リール分析等）</li>
                  <li>KPIの設定および管理機能</li>
                  <li>月次・期間別レポート生成機能</li>
                  <li>その他、当社が提供する付随的機能</li>
                </ol>
                <p className="mt-3 text-xs text-gray-600">
                  ※ 利用可能な機能は、ユーザーが契約するプランにより制限される場合があります。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第3条（利用開始および同意）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>ユーザーは、会員サイトでの利用登録完了後、本ツールに初めてアクセスした時点で、本規約の内容に同意したものとみなされます。</li>
                  <li>ユーザーが本ツールを利用した場合、本規約に同意したものと推定されます。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第4条（生成コンテンツの取扱い）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本ツールにより生成された投稿文、ハッシュタグ、分析結果、画像その他のアウトプット（以下「生成コンテンツ」といいます。）の利用権は、ユーザーに帰属します。</li>
                  <li>ユーザーは、生成コンテンツを自己の責任において確認・編集したうえで利用するものとします。</li>
                  <li>当社は、生成コンテンツが第三者の権利を侵害しないこと、正確性、有用性、適法性を有することについて一切保証しません。</li>
                  <li>生成コンテンツの利用によりユーザーまたは第三者に生じた損害について、当社は一切の責任を負いません。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第5条（ユーザーデータの取扱い）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>ユーザーが本ツールに入力または登録したデータ（投稿内容、KPI設定、分析対象データ等を含みます。以下「ユーザーデータ」といいます。）の管理責任は、ユーザー自身に帰属します。</li>
                  <li>当社は、以下の目的の範囲内で、ユーザーデータを利用することができるものとします。
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>本ツールの提供、運用、保守および改善</li>
                      <li>ユーザーサポートおよび問い合わせ対応</li>
                      <li>個人を特定できない形式での統計データ作成および分析</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第6条（禁止事項）</h3>
                <p>
                  ユーザーは、本ツールの利用にあたり、以下の行為を行ってはなりません。
                </p>
                <ol className="list-decimal list-inside ml-2 space-y-1 mt-2">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>虚偽または不正確な情報を入力する行為</li>
                  <li>本ツールまたは当社のサーバー、ネットワークの運営を妨害する行為</li>
                  <li>不正アクセス、またはこれを試みる行為</li>
                  <li>本ツールのシステム、プログラム、データを改ざん、破壊、解析する行為</li>
                  <li>リバースエンジニアリング、逆アセンブル、逆コンパイル、ソースコード解析、構造解析、アルゴリズム解析、モデル抽出、学習推定行為</li>
                  <li>API通信、レスポンス、挙動、出力結果等を解析し、本ツールと同一または類似するサービス、機能、AIモデルを開発・提供する行為</li>
                  <li>本ツールの生成結果、仕様、UI、プロンプト構造等を利用した競合または類似サービスの開発</li>
                  <li>本ツールの全部または一部を第三者に再許諾、貸与、販売、転売、共有する行為</li>
                  <li>当社の許可なく、本ツールを商業目的で再利用または二次利用する行為</li>
                  <li>同業者または競合目的での調査、模倣、解析、検証を目的として本ツールを利用する行為</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第7条（利用制限および登録抹消）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>当社は、以下のいずれかに該当する場合、事前の通知なく、本ツールの全部または一部へのアクセス制限、利用停止、またはユーザー登録の抹消を行うことができます。
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>本規約または会員サイト規約に違反した場合</li>
                      <li>本ツールの安全性、信頼性、継続提供に重大な影響を及ぼすおそれがある場合</li>
                      <li>緊急性を要するシステム障害、セキュリティインシデント、外部攻撃、マルウェア感染の疑いがある場合</li>
                      <li>利用料金の支払いが確認できない場合</li>
                      <li>その他、当社が本ツールの利用を不適切と判断した場合</li>
                    </ul>
                  </li>
                  <li>前項に基づく措置によりユーザーに損害が生じた場合であっても、当社は一切の責任を負いません。、事前の通知なく、本ツールの全部または一部の利用を制限し、またはユーザー登録を抹消することができます。</li>
                  <li>本規約のいずれかに違反した場合</li>
                  <li>登録情報に虚偽の内容が含まれていた場合</li>
                  <li>会員サイトの利用料金の支払いが確認できない場合</li>
                  <li>本ツールの不正利用、濫用、または不当利用が認められた場合</li>
                  <li>その他、当社が本ツールの利用を不適切と判断した場合</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第8条（保証の否認および免責）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>当社は、本ツールについて、事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定目的への適合性、セキュリティ、エラー、バグ、権利侵害等）がないことを明示的にも黙示的にも保証しません。</li>
                  <li>本ツールが生成するコンテンツ、分析結果、提案内容について、その成果、効果、正確性、完全性、有用性を保証するものではありません。</li>
                  <li>ユーザーの端末、ネットワーク、ソフトウェア環境に起因するマルウェア感染、不正プログラムの混入、第三者による攻撃等により本ツールまたは当社システムに損害が生じた場合、当社は責任を負いません。</li>
                  <li>当社は、必要に応じて、アクセスログ、IPアドレス、端末情報等を調査し、当該事案の原因究明および再発防止措置を講じることがあります。</li>
                  <li>ユーザーの故意または重大な過失により当社に損害が生じた場合、当社は当該ユーザーに対し、損害賠償を請求できるものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第9条（サービス内容の変更・終了）</h3>
                <p>
                  当社は、事前の通知なく、本ツールの内容を変更、追加、停止、または終了することができます。これによりユーザーに生じた損害について、当社は一切の責任を負いません。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第10条（規約の変更）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>当社は、法令の変更、サービス内容の変更その他必要と判断した場合、ユーザーの個別の同意を得ることなく、本規約を変更することができます。</li>
                  <li>変更後の本規約は、本ツールまたは本ウェブサイト上に掲載した時点から効力を生じるものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第11条（準拠法および管轄）</h3>
                <p>
                  本規約は日本法を準拠法とし、本ツールに関して生じた紛争については、福岡地方裁判所を第一審の専属的合意管轄裁判所とします。
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 italic">
                  ※ 本規約は AI・SaaS・分析ツールに特化した内容として整理しています。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="toolAgree"
              checked={agreed}
              onChange={(e) => handleAgreementChange(e.target.checked)}
              disabled={isAgreedPersisted}
              className={`mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 ${
                isAgreedPersisted ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
            <label 
              htmlFor="toolAgree" 
              className={`text-sm text-gray-700 ${
                isAgreedPersisted ? "cursor-default" : "cursor-pointer"
              }`}
            >
              {isAgreedPersisted ? (
                <>
                  同意済み
                  {agreedDate && (
                    <span className="ml-2 text-xs text-gray-500">
                      （同意日: {agreedDate}）
                    </span>
                  )}
                </>
              ) : (
                "Signal.ツール利用規約に同意します"
              )}
            </label>
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


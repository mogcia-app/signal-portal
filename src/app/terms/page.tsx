"use client";

import { useState, useEffect, useRef } from "react";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SidebarToc from "@/components/SidebarToc";
import FloatingQnA from "@/components/FloatingQnA";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfile } from "@/types/user";
import { AGREEMENT_ITEMS } from "@/lib/contractVersions";

const plans: { [key: string]: { name: string; price: number; description: string } } = {
  light: { 
    name: "ベーシック", 
    price: 15000,
    description: "投稿作成をAIで効率化。まずは「続ける」ための基本プラン。週次スケジュール設定、投稿文・ハッシュタグ生成、コメント返信AIなど、日々の投稿作業をまとめてサポート。"
  },
  standard: { 
    name: "スタンダード", 
    price: 30000,
    description: "投稿の結果を見ながら、改善できる運用プラン。投稿一覧の管理と簡易分析で、どの投稿が伸びたのかを可視化。感覚頼りの運用から一歩先へ。"
  },
  professional: {
    name: "プロ",
    price: 60000,
    description: "戦略設計から成果最大化までAIが伴走。運用計画、シミュレーション、月次レポート、KPI分析まで網羅。学習型AIが、あなた専用の改善提案を行います。"
  },
};

const INITIAL_FEE = 200000;
const TAX_RATE = 0.1;

type TabType = "privacy" | "contract" | "invoice" | "memberSiteTerms" | "toolTerms";

export default function TermsPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("privacy");
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [agreementItems, setAgreementItems] = useState<any>(null);
  const [consentHistory, setConsentHistory] = useState<any>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [agreementStatus, setAgreementStatus] = useState({
    privacyPolicy: { agreed: false, date: "" },
    contract: { agreed: false, date: "" },
    initialInvoice: { agreed: false, date: "" },
    terms: { agreed: false, date: "" },
    toolTerms: { agreed: false, date: "" },
  });

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", userProfile.id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({ id: userDoc.id, ...data } as UserProfile);
          const savedContractData = data.contractData;
          // contractDataはネストされた構造（contractData.contractData）または直接フィールドの両方に対応
          // ネストされた構造がある場合はそれを使用、なければ直接フィールドを使用
          const contractDataToSet = savedContractData?.contractData || savedContractData || {};
          // contractDataには会社情報だけでなく、paymentMethods、invoicePaymentDate、contractDateなども含める
          setContractData({
            ...contractDataToSet,
            paymentMethods: savedContractData?.paymentMethods || [],
            invoicePaymentDate: savedContractData?.invoicePaymentDate || "",
            contractDate: savedContractData?.contractDate || "",
            confirmedDueDate: savedContractData?.confirmedDueDate || data.confirmedDueDate || "",
          });
          
          // 最新の同意履歴を読み込み
          try {
            const consentRef = collection(db, "users", userProfile.id, "contractConsents");
            const consentQuery = query(consentRef, orderBy("agreedAt", "desc"), limit(1));
            const consentSnapshot = await getDocs(consentQuery);
            if (!consentSnapshot.empty) {
              const latestConsent = consentSnapshot.docs[0].data();
              setConsentHistory(latestConsent);
              if (latestConsent.items) {
                setAgreementItems({
                  fullContract: latestConsent.items.fullContract?.agreed || false,
                  unpaidTermination: latestConsent.items.unpaidTermination?.agreed || false,
                  analysisProhibition: latestConsent.items.analysisProhibition?.agreed || false,
                  suspension: latestConsent.items.suspension?.agreed || false,
                  confidentialInfo: latestConsent.items.confidentialInfo?.agreed || false,
                });
              }
            } else {
              // サブコレクションが存在しない場合、トップレベルのagreementItemsを確認
              const savedItems = savedContractData?.agreementItems || {};
              setAgreementItems({
                fullContract: savedItems.fullContract || false,
                unpaidTermination: savedItems.unpaidTermination || false,
                analysisProhibition: savedItems.analysisProhibition || false,
                suspension: savedItems.suspension || false,
                confidentialInfo: savedItems.confidentialInfo || false,
              });
            }
          } catch (consentError) {
            console.error("Failed to load consent history:", consentError);
            // エラー時はトップレベルのagreementItemsを確認
            const savedItems = savedContractData?.agreementItems || {};
            setAgreementItems({
              fullContract: savedItems.fullContract || false,
              unpaidTermination: savedItems.unpaidTermination || false,
              analysisProhibition: savedItems.analysisProhibition || false,
              suspension: savedItems.suspension || false,
              confidentialInfo: savedItems.confidentialInfo || false,
            });
          }
          
          // 各書類の同意状態を取得
          setAgreementStatus({
            privacyPolicy: {
              agreed: data.privacyPolicyAgreed === true,
              date: data.privacyPolicyAgreedDate || "",
            },
            contract: {
              agreed: savedContractData?.agreed === true || data.contractAgreed === true,
              date: savedContractData?.agreedDate || data.contractAgreedDate || savedContractData?.contractDate || "",
            },
            initialInvoice: {
              agreed: data.datesSaved === true || data.initialInvoiceAgreed === true,
              date: data.initialInvoiceAgreedDate || (data.datesSaved ? (data.invoiceDate || savedContractData?.invoiceDate || "") : ""),
            },
            terms: {
              agreed: data.memberSiteTermsAgreed === true,
              date: data.memberSiteTermsAgreedDate || "",
            },
            toolTerms: {
              agreed: data.toolTermsAgreed === true,
              date: data.toolTermsAgreedDate || "",
            },
          });
          
          // 請求書データを構築
          const invoiceDate = data.invoiceDate || data.contractData?.invoiceDate || new Date().toISOString().split('T')[0];
          // 入金期日を複数の場所から取得（優先順位: トップレベル > contractData > savedContractData）
          const confirmedDueDate = data.confirmedDueDate || savedContractData?.confirmedDueDate || data.contractData?.confirmedDueDate || "";
          
          // プランIDの取得（monthlyFeeから判定）
          let calculatedPlanId: string | null = null;
          const monthlyFee = data.billingInfo?.monthlyFee;
          
          if (monthlyFee) {
            if (monthlyFee === 15000) calculatedPlanId = 'light';
            else if (monthlyFee === 30000) calculatedPlanId = 'standard';
            else if (monthlyFee === 60000) calculatedPlanId = 'professional';
          }
          
          if (!calculatedPlanId && data.billingInfo?.plan) {
            const billingPlan = data.billingInfo.plan;
            // basic, trial, enterprise も考慮
            if (billingPlan === 'light' || billingPlan === 'standard' || billingPlan === 'professional') {
              calculatedPlanId = billingPlan;
            } else if (billingPlan === 'basic' || billingPlan === 'trial') {
              calculatedPlanId = 'light';
            } else if (billingPlan === 'enterprise') {
              calculatedPlanId = 'professional';
            }
          }
          
          if (!calculatedPlanId) {
            calculatedPlanId = data.selectedPlanId || null;
          }
          
          setPlanId(calculatedPlanId);

          // 支払方法の判定
          const paymentMethods = savedContractData?.paymentMethods || data.contractData?.paymentMethods || [];
          const hasStripe = paymentMethods.includes("Stripe決済");
          const hasInvoice = paymentMethods.includes("請求書発行");

          // 金額計算（calculatedPlanIdを使用）
          let subtotal = INITIAL_FEE;
          let lineItems: { description: string; quantity: number; unitPrice: number; amount: number }[] = [
            { description: "初期費用", quantity: 1, unitPrice: INITIAL_FEE, amount: INITIAL_FEE }
          ];

          if (hasStripe) {
            // Stripe決済の場合: 初期費用20万円のみ
            subtotal = INITIAL_FEE;
          } else if (hasInvoice) {
            // 請求書発行の場合: 初期費用 + 初月プラン費用
            if (calculatedPlanId && plans[calculatedPlanId]) {
              const planPrice = plans[calculatedPlanId].price;
              subtotal += planPrice;
              lineItems.push({
                description: `${plans[calculatedPlanId].name}プラン 初月利用料`,
                quantity: 1,
                unitPrice: planPrice,
                amount: planPrice
              });
            }
          } else {
            // 支払方法が設定されていない場合も、初期費用のみを表示
            subtotal = INITIAL_FEE;
          }

          const tax = Math.floor(subtotal * TAX_RATE);
          const total = subtotal + tax;

          // 会社名と住所を取得（contractDataから直接取得）
          // contractDataは直接保存されている構造（contractData.companyName）またはネストされた構造（contractData.contractData.companyName）
          // 優先順位: 直接フィールド > ネストされた構造 > contractData state > その他
          const companyName = savedContractData?.companyName || savedContractData?.contractData?.companyName || contractDataToSet?.companyName || data.companyName || userData?.companyName || "";
          const address = savedContractData?.address || savedContractData?.contractData?.address || contractDataToSet?.address || data.address || userData?.address || "";
          const representativeName = savedContractData?.representativeName || savedContractData?.contractData?.representativeName || contractDataToSet?.representativeName || "";
          const email = savedContractData?.email || savedContractData?.contractData?.email || contractDataToSet?.email || "";
          const phone = savedContractData?.phone || savedContractData?.contractData?.phone || contractDataToSet?.phone || "";
          
          setInvoiceData({
            invoiceNumber: data.invoiceNumber || "",
            invoiceDate,
            planId: calculatedPlanId,
            lineItems,
            subtotal,
            tax,
            total,
            hasInvoice: hasInvoice || false,
            confirmedDueDate,
            companyName,
            address,
            representativeName,
            email,
            phone,
          });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile]);

  if (loading) {
    return (
      <AuthGuard requireAuth>
        <div className="flex min-h-screen bg-gray-50 items-center justify-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </AuthGuard>
    );
  }

  const planName =
    planId === "light"
      ? "ベーシックプラン"
      : planId === "standard"
      ? "スタンダードプラン"
      : planId === "professional"
      ? "プロプラン"
      : "プラン未設定";

  const tabNames: { [key: string]: string } = {
    privacy: "プライバシーポリシー",
    contract: "Signal. 利用契約書",
    invoice: "請求書",
    memberSiteTerms: "会員サイト利用規約",
    toolTerms: "Signal.ツール利用規約",
  };

  return (
    <AuthGuard requireAuth>
      <div className="flex min-h-screen bg-gray-50">
        <SidebarToc />
        
        <main className="flex-1 pt-6 pb-6 px-4">
          <div className="max-w-full mx-auto px-8">
          <div className="bg-white shadow-sm border border-gray-200 p-12 mb-12">
            <div className="text-center mb-12 pt-6">
              <h1 className="text-4xl font-light text-gray-900 tracking-wide mb-2">
                {activeTab === "contract" ? (
                  <><span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span> 利用契約書</>
                ) : activeTab === "toolTerms" ? (
                  <><span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>ツール利用規約</>
                ) : (
                  tabNames[activeTab]
                )}
              </h1>
              <div className="h-px w-24 bg-gray-300 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">
                契約内容の確認
              </p>
            </div>

            {/* タブ */}
            <div className="mb-8 border-b border-gray-200">
              <nav className="flex justify-center space-x-8">
                {[
                  { id: "privacy" as TabType, label: "プライバシーポリシー" },
                  { id: "contract" as TabType, label: "契約書" },
                  { id: "invoice" as TabType, label: "初回請求書" },
                  { id: "memberSiteTerms" as TabType, label: "会員サイト利用規約" },
                  { id: "toolTerms" as TabType, label: (<><span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>ツール利用規約</>) },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-orange-600 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* コンテンツ */}
            <div>
              {/* プライバシーポリシー */}
              {activeTab === "privacy" && (
                <div className="space-y-6">
                  {agreementStatus.privacyPolicy.agreed && (
                    <div className="bg-gray-100 border-2 border-black p-4 mb-4">
                      <p className="text-sm text-red-800 font-bold flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-red-800 bg-white">
                          <svg className="w-3 h-3 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        プライバシーポリシーに同意済みです。同意日: {agreementStatus.privacyPolicy.date}
                      </p>
                    </div>
                  )}
                  <div className="border-2 border-gray-300 p-6 mb-6 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span> プライバシーポリシー
                    </h2>
                    <div className="text-sm text-gray-700 space-y-4">
                      <div className="bg-gray-50 border border-gray-200 p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span> プライバシーポリシー
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        株式会社MOGCIA（以下「当社」といいます。）は、当社が提供するSNS運用支援ツール「<span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>」および関連する会員サイト（以下総称して「本サービス」といいます。）において取得する個人情報および利用情報について、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        本ポリシーは、法人契約を前提とし、契約法人の役員・従業員・業務委託者等（以下「利用者」）による利用を想定して定められています。
                      </p>
                    </div>

                    <div className="space-y-4 text-sm text-gray-700">
                      <div>
                        <h4 className="font-semibold mb-2">第1条（適用範囲）</h4>
                        <p className="mb-2">本ポリシーは、本サービスの提供に関連して当社が取得するすべての情報に適用されます。</p>
                        <p>本ポリシーは、本サービスの利用に関し、当社と契約者との間で締結される利用契約および関連規約と一体として適用されます。</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">第2条（取得する情報）</h4>
                        <p className="mb-2">当社は、本サービスの提供および適切な運営・管理のため、以下の情報を取得します。</p>
                        <div className="ml-4 space-y-2">
                          <div>
                            <h5 className="font-medium mb-1">1. 契約・アカウント情報</h5>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                              <li>氏名、メールアドレス、所属企業名、部署名、役職</li>
                              <li>アカウントID、認証情報（パスワードそのものは含みません）</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium mb-1">2. 利用状況ログ情報（ログ監視対象）</h5>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                              <li>ログイン日時、ログアウト日時</li>
                              <li>IPアドレス、端末情報、アクセス元地域情報</li>
                              <li>本サービス内での操作履歴、各画面・機能の閲覧履歴および滞在時間</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">第3条（利用目的）</h4>
                        <p>当社は、取得した情報を本サービスの提供、維持、改善、契約内容の管理、不正利用の防止、システム障害対応等の目的で利用します。</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">第4条（ログ監視および分析について）</h4>
                        <p className="mb-2">当社は、本サービスの適正な運営および知的財産の保護を目的として、利用状況ログの取得および監視を行います。</p>
                        <p>利用者は、本サービスを利用することにより、ログ取得および監視に同意したものとみなされます。</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">第5条（第三者提供の制限）</h4>
                        <p>当社は、法令に基づく場合を除き、取得した個人情報および利用状況ログを第三者に提供しません。</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">第6条（情報の管理）</h4>
                        <p>当社は、取得した情報について、不正アクセス、漏洩、改ざん、滅失等を防止するため、合理的かつ適切な安全管理措置を講じます。</p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 p-4">
                        <h4 className="font-semibold mb-2">お問い合わせ窓口</h4>
                        <p className="text-sm leading-relaxed">
                          <strong>株式会社MOGCIA</strong><br />
                          〒810-0001 福岡県福岡市中央区天神4-6-28 いちご天神ノースビル7階<br />
                          TEL: 092-517-9804<br />
                          Email: info@mogcia.jp<br />
                          受付時間: 平日 10:00-17:00
                        </p>
                        <p className="text-xs text-gray-500 mt-4">【制定日】2025年06月01日</p>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 契約書 */}
              {activeTab === "contract" && (
                <div className="space-y-6">
                  {agreementStatus.contract.agreed && (
                    <div className="bg-gray-100 border-2 border-black p-4 mb-4">
                      <p className="text-sm text-red-800 font-bold flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-red-800 bg-white">
                          <svg className="w-3 h-3 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span> 利用契約書に同意済みです。同意日: {agreementStatus.contract.date}
                      </p>
                    </div>
                  )}
                  
                  {contractData ? (
                    <div className="space-y-4">
                      {/* 契約内容 */}
                      <div className="border-2 border-gray-300 p-6 mb-6 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span> 利用契約書
                        </h3>
                        <div className="text-sm text-gray-700 space-y-4">
                          <div>
                            <p className="mb-4">
                              本契約書（以下「本契約」といいます。）は、株式会社MOGCIA（以下「当社」といいます。）が提供するSNS運用支援ツール「<span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>」（以下「本サービス」といいます。）の利用条件について、当社と本サービスを利用する個人または法人（以下「契約者」といいます。）との間で締結されるものです。
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第1条（契約の成立）</h4>
                            <ol className="list-decimal list-inside ml-2 space-y-2">
                              <li>本契約は、契約者が本契約の内容を確認し、当社所定の方法により同意の意思表示を行った時点で成立するものとします。</li>
                              <li>契約者は、本契約が電子的手続（チェックボックスへの同意、日時・IPアドレス等の記録）により成立することを承諾するものとします。</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第2条（本サービスの内容）</h4>
                            <ol className="list-decimal list-inside ml-2 space-y-2">
                              <li>本サービスは、SNS投稿文・ハッシュタグ生成、投稿計画作成、分析、KPI管理、レポート生成等の機能を提供するものです。</li>
                              <li>利用可能な機能は、契約者が選択したプラン内容に応じて異なります。</li>
                              <li>当社は、本サービスの内容を予告なく変更・追加・削除することがあります。</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第3条（利用形態）</h4>
                            <ol className="list-decimal list-inside ml-2 space-y-2">
                              <li>契約者が法人である場合、本契約は当該法人を当事者とし、当該法人の役員・従業員その他本サービスを利用する者の行為は、すべて当該法人の行為とみなします。</li>
                              <li>契約者が個人である場合、当該個人が本契約上の一切の義務を負うものとします。</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第4条（利用料金および支払方法）</h4>
                            <ol className="list-decimal list-inside ml-2 space-y-2">
                              <li>契約者は、本サービスの利用対価として、当社が別途定める利用料金を支払うものとします。</li>
                              <li>本サービスの利用開始は、初期費用および当社が指定する初回利用料金の入金確認後とします。</li>
                              <li>契約者は、以下のいずれかの支払方法を選択するものとします。
                                <ol className="list-[lower-alpha] list-inside ml-4 mt-2 space-y-1">
                                  <li>Stripe決済</li>
                                  <li>請求書発行</li>
                                </ol>
                              </li>
                            </ol>
                            
                            <div className="mt-4 mb-2">
                              <p className="font-semibold text-sm">■ Stripe決済に関する規定</p>
                            </div>
                            <ol className="list-decimal list-inside ml-2 space-y-2" start={4}>
                              <li>Stripe決済を選択した場合、支払日、課金周期、無料期間、次回更新日等は、Stripeが定める決済条件および当社が提示する内容に準ずるものとします。</li>
                            </ol>

                            <div className="mt-4 mb-2">
                              <p className="font-semibold text-sm">■ 請求書発行に関する規定</p>
                            </div>
                            <ol className="list-decimal list-inside ml-2 space-y-2" start={5}>
                              <li>請求書発行を選択した場合、当社は毎月契約日に、本サービスの会員サイト内にて請求書を発行し、契約者に通知するものとします。</li>
                              <li>契約者は、請求書発行を選択した場合、各月末日（30日）を支払期日として、当社指定の方法により当該請求金額を支払うものとします。</li>
                              <li>請求書に定める支払期日が金融機関の休業日に該当する場合、当該支払期日の前営業日を支払期日とするものとします。</li>
                              <li>支払期限の翌日から1日を経過してもなお入金が確認できない場合、当社は、入金が確認されるまで、本サービスおよび付随するツールの利用を停止することができるものとします。</li>
                              <li>支払期限から5日を経過しても契約者からの連絡がない場合、または当社からの連絡に応答がない場合、当社は契約者の都合による契約解除とみなし、契約者は残存契約期間分の利用料金および当該残存金額の10％に相当する違約金を支払うものとします。</li>
                              <li>当社は、本サービスの利用停止または契約解除により契約者に生じた損害について、一切の責任を負わないものとします。</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第5条（知的財産権）</h4>
                            <ol className="list-decimal list-inside ml-2 space-y-2">
                              <li>本サービスに関するプログラム、UI、構成、アルゴリズム、ノウハウその他一切の知的財産権は、すべて当社に帰属します。</li>
                              <li>本サービスにより生成されたコンテンツの著作権は、契約者に帰属します。ただし、当社は統計分析およびサービス改善目的に限り、無償で利用できるものとします。</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第6条（禁止事項）</h4>
                            <p className="mb-2">契約者は、以下の行為を行ってはなりません。</p>
                            <ol className="list-decimal list-inside ml-2 space-y-1">
                              <li>本サービス、本ツール、会員サイトの解析、逆コンパイル、リバースエンジニアリングその他これに類する行為</li>
                              <li>本サービスのアルゴリズム、モデル、プロンプト、構成、UI、画面遷移、設計思想等を抽出・模倣・解析する行為</li>
                              <li>当社または第三者のサービスと競合する目的で本サービスを利用する行為</li>
                              <li>本サービス、会員サイトおよびツール内に掲載される情報を、第三者に対して開示、共有、提供、転載、販売、貸与する行為</li>
                              <li>法令または公序良俗に反する行為</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第7条（競合契約の制限）</h4>
                            <p>当社は、同業者または競合サービスの開発・調査・模倣等を目的とした契約であると判断した場合、契約の締結または継続を拒否できるものとします。</p>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第8条（セキュリティおよび責任）</h4>
                            <ol className="list-decimal list-inside ml-2 space-y-2">
                              <li>契約者は、本サービスの利用にあたり、自己の責任において端末、ネットワークおよび利用環境の安全性を確保するものとします。</li>
                              <li>契約者の故意または過失により、ウイルス感染、不正アクセス、情報漏洩、第三者への情報流出等が発生し、当社に損害が生じた場合、契約者は当該損害を賠償する責任を負うものとします。</li>
                              <li>当社は、不正利用の疑い、情報漏洩の可能性、支払遅延、システム障害その他緊急性を要すると判断した場合、事前通知なく本サービスへのアクセス制御または利用停止を行うことができます。</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第9条（秘密情報および非公開義務）</h4>
                            <p className="mb-3">
                              契約者は、本契約の有効期間中および本契約終了後を問わず、本サービスおよび会員サイトを通じて提供または閲覧可能となる一切の情報について、第三者に開示、漏洩、提供、共有、利用させてはならないものとします。
                            </p>
                            <p className="mb-3">
                              本条の義務は、本契約終了後も存続するものとします。
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第10条（免責）</h4>
                            <ol className="list-decimal list-inside ml-2 space-y-2">
                              <li>当社は、本サービスの正確性、完全性、有用性、成果等について一切保証しません。</li>
                              <li>本サービスの利用により契約者に生じた損害について、当社は故意または重過失がある場合を除き、一切の責任を負いません。</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第11条（反社会的勢力の排除）</h4>
                            <ol className="list-decimal list-inside ml-2 space-y-2">
                              <li>契約者は、現在および将来にわたり、自己または自己の役員、従業員、関係者が、反社会的勢力（暴力団、暴力団員、暴力団関係企業、総会屋、社会運動等標ぼうゴロ、その他これらに準ずる者を含みます）に該当しないことを表明し、保証するものとします。</li>
                              <li>契約者が前項に違反したことが判明した場合、当社は、何らの通知または催告を要することなく、直ちに本契約の全部または一部を解除することができるものとします。</li>
                              <li>前項による解除により契約者に損害が生じた場合であっても、当社は一切の責任を負わないものとします。</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第12条（契約期間および解約）</h4>
                            <p className="mb-3">
                              本契約の有効期間は、利用開始日から1年間とします。期間満了日の1か月前までに、当社所定の方法による解約の意思表示がない場合、本契約は同一条件にて1年間自動更新されるものとします。
                            </p>
                            <p>
                              契約期間中において、契約者の都合により本契約を解約する場合、理由のいかんを問わず、契約期間満了日までの残存期間に対応する利用料金の全額を支払うものとします。
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第13条（利用規約との関係）</h4>
                            <ol className="list-decimal list-inside ml-2 space-y-2">
                              <li>本契約は、当社が別途定める会員サイト利用規約およびツール利用規約と一体として適用されるものとします。</li>
                              <li>本契約、会員サイト利用規約およびツール利用規約の内容に相違がある場合は、本契約の定めが優先して適用されるものとします。</li>
                            </ol>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">第14条（準拠法および管轄）</h4>
                            <p>
                              本契約は日本法を準拠法とし、本契約に関して生じる一切の紛争については、福岡地方裁判所を第一審の専属的合意管轄裁判所とします。
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4">
                        <h3 className="font-semibold mb-3">契約情報</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">契約日:</span>
                            <span className="font-medium">{contractData.contractDate || "未設定"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">契約プラン:</span>
                            <span className="font-medium">{planName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">月額料金:</span>
                            <span className="font-medium">¥{userData?.billingInfo?.monthlyFee?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">支払方法:</span>
                            <span className="font-medium">
                              {contractData.paymentMethods?.join(", ") || "未設定"}
                            </span>
                          </div>
                          {contractData.confirmedDueDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">支払期日:</span>
                              <span className="font-medium">{contractData.confirmedDueDate}</span>
                            </div>
                          )}
                          {contractData.invoicePaymentDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">請求書発行日:</span>
                              <span className="font-medium">{contractData.invoicePaymentDate}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 同意項目の表示 */}
                      {agreementItems && (
                        <div className="bg-gray-50 p-4 mt-4">
                          <h3 className="font-semibold mb-3">同意項目</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-2">
                              <span className={agreementItems.fullContract ? "text-green-600 font-bold" : "text-gray-400"}>
                                {agreementItems.fullContract ? "✓" : "☐"}
                              </span>
                              <span className={agreementItems.fullContract ? "text-gray-900" : "text-gray-500"}>
                                {AGREEMENT_ITEMS.fullContract.label}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className={agreementItems.unpaidTermination ? "text-green-600 font-bold" : "text-gray-400"}>
                                {agreementItems.unpaidTermination ? "✓" : "☐"}
                              </span>
                              <span className={agreementItems.unpaidTermination ? "text-gray-900" : "text-gray-500"}>
                                {AGREEMENT_ITEMS.unpaidTermination.label}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className={agreementItems.analysisProhibition ? "text-green-600 font-bold" : "text-gray-400"}>
                                {agreementItems.analysisProhibition ? "✓" : "☐"}
                              </span>
                              <span className={agreementItems.analysisProhibition ? "text-gray-900" : "text-gray-500"}>
                                {AGREEMENT_ITEMS.analysisProhibition.label}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className={agreementItems.suspension ? "text-green-600 font-bold" : "text-gray-400"}>
                                {agreementItems.suspension ? "✓" : "☐"}
                              </span>
                              <span className={agreementItems.suspension ? "text-gray-900" : "text-gray-500"}>
                                {AGREEMENT_ITEMS.suspension.label}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className={agreementItems.confidentialInfo ? "text-green-600 font-bold" : "text-gray-400"}>
                                {agreementItems.confidentialInfo ? "✓" : "☐"}
                              </span>
                              <span className={agreementItems.confidentialInfo ? "text-gray-900" : "text-gray-500"}>
                                {AGREEMENT_ITEMS.confidentialInfo.label}
                              </span>
                            </div>
                          </div>
                          {consentHistory?.agreedAt && (
                            <div className="mt-4 pt-4 border-t border-gray-300">
                              <p className="text-xs text-gray-600">
                                同意日時: {(() => {
                                  const agreedAt = consentHistory.agreedAt;
                                  if (agreedAt?.toDate) {
                                    const date = agreedAt.toDate();
                                    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                                  } else if (typeof agreedAt === 'string') {
                                    const date = new Date(agreedAt);
                                    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                                  }
                                  return "日時不明";
                                })()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="bg-gray-50 border border-gray-200 p-4">
                        <h3 className="font-semibold mb-2">支払い確認状況</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>初期費用:</span>
                            <span className={userData?.initialPaymentConfirmed ? "text-red-800 font-bold" : "text-gray-600"}>
                              {userData?.initialPaymentConfirmed ? "✓ 確認済み" : "⏳ 確認待ち"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>初月分:</span>
                            <span className={userData?.firstMonthPaymentConfirmed ? "text-red-800 font-bold" : "text-gray-600"}>
                              {userData?.firstMonthPaymentConfirmed ? "✓ 確認済み" : "⏳ 確認待ち"}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span>アクセス許可:</span>
                            <span className={userData?.accessGranted ? "text-red-800 font-bold" : "text-gray-600"}>
                              {userData?.accessGranted ? "✓ 許可済み" : "⏳ 許可待ち"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">契約データが見つかりませんでした。</p>
                  )}
                </div>
              )}

              {/* 初回請求書 */}
              {activeTab === "invoice" && (
                <div className="space-y-6">
                  {agreementStatus.initialInvoice.agreed && (
                    <div className="bg-gray-100 border-2 border-black p-4 mb-4">
                      <p className="text-sm text-red-800 font-bold flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-red-800 bg-white">
                          <svg className="w-3 h-3 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        初回請求書を確認済みです。確認日: {agreementStatus.initialInvoice.date}
                      </p>
                    </div>
                  )}
                  
                  {invoiceData ? (
                    <div className="border-2 border-gray-300 p-6 mb-6 bg-gray-50">
                      <div className="bg-white shadow-sm border border-gray-200 p-12">
                      <div className="mb-12 flex justify-between items-start border-b border-gray-200 pb-8">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 font-light tracking-wide">請求書番号</p>
                          <p className="text-sm text-gray-900 font-medium">{invoiceData.invoiceNumber}</p>
                          {invoiceData.planId && plans[invoiceData.planId] && (
                            <div className="mt-4">
                              <p className="text-xs text-gray-500 font-light tracking-wide mb-2">プラン</p>
                              <p className="text-sm text-gray-900 font-medium mb-2">{plans[invoiceData.planId].name}プラン</p>
                              <p className="text-xs text-gray-600 leading-relaxed max-w-md">{plans[invoiceData.planId].description}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs text-gray-500 font-light tracking-wide">請求日</p>
                          <p className="text-sm text-gray-900 font-medium">{invoiceData.invoiceDate}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-16 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 font-light tracking-wide mb-4">請求先</p>
                          <p className="text-base font-medium text-gray-900 mb-3">
                            {invoiceData.companyName ? 
                              `${invoiceData.companyName} 御中` : 
                              "御中"}
                          </p>
                          {invoiceData.address && (
                            <p className="text-sm text-gray-600 leading-relaxed mb-2">
                              {invoiceData.address}
                            </p>
                          )}
                          {invoiceData.representativeName && (
                            <p className="text-sm text-gray-600 leading-relaxed mb-1">
                              担当者: {invoiceData.representativeName}
                            </p>
                          )}
                          {invoiceData.email && (
                            <p className="text-sm text-gray-600 leading-relaxed mb-1">
                              Email: {invoiceData.email}
                            </p>
                          )}
                          {invoiceData.phone && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              TEL: {invoiceData.phone}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-light tracking-wide mb-4">請求元</p>
                          <p className="text-base font-medium text-gray-900 mb-3">株式会社MOGCIA</p>
                          <div className="text-sm text-gray-600 leading-relaxed space-y-0.5">
                            <p>〒810-0001</p>
                            <p>福岡県福岡市中央区天神4丁目6-28</p>
                            <p>いちご天神ノースビル7階</p>
                            <p className="mt-3 text-xs">登録番号: T1290001103697</p>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <img 
                              src="/mogcia-invoice.png" 
                              alt="MOGCIA Invoice" 
                              className="h-auto max-w-[60px]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 font-light tracking-wide mb-4">明細</p>
                        <div className="border-t border-b border-gray-200">
                          {invoiceData.lineItems?.map((item: any, index: number) => (
                            <div key={index} className="py-4 border-b border-gray-100 last:border-b-0 flex justify-between items-center">
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 font-medium">{item.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  数量: {item.quantity} × ¥{(item.unitPrice || 0).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-sm text-gray-900 font-medium ml-8">¥{(item.amount || 0).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-12 space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <p className="text-sm text-gray-600">小計</p>
                          <p className="text-sm text-gray-900">¥{invoiceData.subtotal.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <p className="text-sm text-gray-600">消費税 (10%)</p>
                          <p className="text-sm text-gray-900">¥{invoiceData.tax.toLocaleString()}</p>
                        </div>
                        <div className="border-t border-gray-300 pt-4 mt-2">
                          <div className="flex justify-between items-center">
                            <p className="text-lg font-medium text-gray-900">請求金額</p>
                            <p className="text-2xl font-light text-gray-900 tracking-tight">¥{invoiceData.total.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {invoiceData.hasInvoice && (
                        <div className="mb-12 pt-8 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-12">
                            <div>
                              <p className="text-xs text-gray-500 font-light tracking-wide mb-2">入金期日</p>
                              <p className="text-sm text-gray-900 font-medium">
                                {invoiceData.confirmedDueDate || "未設定"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-light tracking-wide mb-2">振込先</p>
                              <p className="text-sm text-gray-900 font-medium">佐賀銀行福岡支店 (普通) 3078446</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-8 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-light tracking-wide mb-3">備考</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          本サービスの利用開始は、初期費用および当社が指定する初回利用料金の入金確認後とします。
                        </p>
                      </div>
                    </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">請求書データが見つかりませんでした。</p>
                  )}
                </div>
              )}

              {/* 会員サイト利用規約 */}
              {activeTab === "memberSiteTerms" && (
                <div className="space-y-6">
                  {agreementStatus.terms.agreed && (
                    <div className="bg-gray-100 border-2 border-black p-4 mb-4">
                      <p className="text-sm text-red-800 font-bold flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-red-800 bg-white">
                          <svg className="w-3 h-3 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        会員サイト利用規約に同意済みです。同意日: {agreementStatus.terms.date}
                      </p>
                    </div>
                  )}
                  
                  <div className="border-2 border-gray-300 p-6 mb-6 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      会員サイト利用規約
                    </h2>
                    <div className="text-sm text-gray-700 space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">第1条（適用）</h4>
                          <p className="leading-relaxed">
                            本規約は、<span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>（以下「当社」といいます。）が提供するサービス（以下「本サービス」といいます。）の利用条件を定めるものです。
                            登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第2条（利用登録）</h4>
                          <p className="leading-relaxed">
                            本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第3条（ユーザーIDおよびパスワードの管理）</h4>
                          <p className="leading-relaxed">
                            ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
                            ユーザーIDまたはパスワードが第三者に使用されたことによって生じた損害は、当社に故意または重大な過失がある場合を除き、当社は一切の責任を負わないものとします。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第4条（利用料金および支払方法）</h4>
                          <p className="leading-relaxed">
                            ユーザーは、本サービス利用の対価として、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。
                            ユーザーが利用料金の支払を遅滞した場合、ユーザーは年14.6％の割合による遅延損害金を当社に支払うものとします。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第5条（禁止事項）</h4>
                          <p className="leading-relaxed mb-2">
                            ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                          </p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>法令または公序良俗に違反する行為</li>
                            <li>犯罪行為に関連する行為</li>
                            <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                            <li>当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                            <li>本サービスによって得られた情報を商業的に利用する行為</li>
                            <li>当社のサービスの運営を妨害するおそれのある行為</li>
                            <li>不正アクセスをし、またはこれを試みる行為</li>
                            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                            <li>不正な目的を持って本サービスを利用する行為</li>
                            <li>本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為</li>
                            <li>その他、当社が不適切と判断する行為</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第6条（本サービスの提供の停止等）</h4>
                          <p className="leading-relaxed">
                            当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                            本サービスにかかるコンピュータシステムの保守点検または更新を行う場合、地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合、コンピュータまたは通信回線等が事故により停止した場合、その他、当社が本サービスの提供が困難と判断した場合。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第7条（保証の否認および免責）</h4>
                          <p className="leading-relaxed">
                            当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                            当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第8条（サービス内容の変更等）</h4>
                          <p className="leading-relaxed">
                            当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第9条（利用規約の変更）</h4>
                          <p className="leading-relaxed">
                            当社は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
                            本規約の変更がユーザーの一般の利益に適合するとき、本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第10条（個人情報の取扱い）</h4>
                          <p className="leading-relaxed">
                            当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第11条（通知または連絡）</h4>
                          <p className="leading-relaxed">
                            ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第12条（権利義務の譲渡の禁止）</h4>
                          <p className="leading-relaxed">
                            ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第13条（準拠法・裁判管轄）</h4>
                          <p className="leading-relaxed">
                            本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
                          </p>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-200">
                          <p className="text-xs text-gray-500">以上</p>
                          <p className="text-xs text-gray-500 mt-2">制定日：2026年1月1日</p>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Signal.ツール利用規約 */}
              {activeTab === "toolTerms" && (
                <div className="space-y-6">
                  {agreementStatus.toolTerms.agreed && (
                    <div className="bg-gray-100 border-2 border-black p-4 mb-4">
                      <p className="text-sm text-red-800 font-bold flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-red-800 bg-white">
                          <svg className="w-3 h-3 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>ツール利用規約に同意済みです。同意日: {agreementStatus.toolTerms.date}
                      </p>
                    </div>
                  )}
                  
                  <div className="border-2 border-gray-300 p-6 mb-6 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>ツール利用規約
                    </h2>
                    <div className="text-sm text-gray-700 space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">第1条（適用）</h4>
                          <ol className="list-decimal list-inside ml-2 space-y-2">
                            <li>本規約は、株式会社MOGCIA（以下「当社」といいます。）が提供する <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>ツール（以下「本ツール」といいます。）の利用条件を定めるものです。</li>
                            <li>本ツールの利用にあたっては、当社が別途定める「<span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>会員サイト利用規約」（以下「会員サイト規約」といいます。）も併せて適用されるものとします。</li>
                            <li>本規約と会員サイト規約の内容に相違がある場合は、本ツールの利用に関しては本規約が優先して適用されるものとします。</li>
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第2条（本ツールの内容）</h4>
                          <p className="mb-2">本ツールは、以下の機能を提供します。</p>
                          <ol className="list-decimal list-inside ml-2 space-y-1">
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
                          <h4 className="font-semibold mb-2">第3条（利用開始および同意）</h4>
                          <ol className="list-decimal list-inside ml-2 space-y-2">
                            <li>ユーザーは、会員サイトでの利用登録完了後、本ツールに初めてアクセスした時点で、本規約の内容に同意したものとみなされます。</li>
                            <li>ユーザーが本ツールを利用した場合、本規約に同意したものと推定されます。</li>
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第4条（生成コンテンツの取扱い）</h4>
                          <ol className="list-decimal list-inside ml-2 space-y-2">
                            <li>本ツールにより生成された投稿文、ハッシュタグ、分析結果、画像その他のアウトプット（以下「生成コンテンツ」といいます。）の利用権は、ユーザーに帰属します。</li>
                            <li>ユーザーは、生成コンテンツを自己の責任において確認・編集したうえで利用するものとします。</li>
                            <li>当社は、生成コンテンツが第三者の権利を侵害しないこと、正確性、有用性、適法性を有することについて一切保証しません。</li>
                            <li>生成コンテンツの利用によりユーザーまたは第三者に生じた損害について、当社は一切の責任を負いません。</li>
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第5条（ユーザーデータの取扱い）</h4>
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
                          <h4 className="font-semibold mb-2">第6条（禁止事項）</h4>
                          <p className="mb-2">ユーザーは、本ツールの利用にあたり、以下の行為を行ってはなりません。</p>
                          <ol className="list-decimal list-inside ml-2 space-y-1">
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
                          <h4 className="font-semibold mb-2">第7条（利用制限および登録抹消）</h4>
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
                            <li>前項に基づく措置によりユーザーに損害が生じた場合であっても、当社は一切の責任を負いません。</li>
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第8条（保証の否認および免責）</h4>
                          <ol className="list-decimal list-inside ml-2 space-y-2">
                            <li>当社は、本ツールについて、事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定目的への適合性、セキュリティ、エラー、バグ、権利侵害等）がないことを明示的にも黙示的にも保証しません。</li>
                            <li>本ツールが生成するコンテンツ、分析結果、提案内容について、その成果、効果、正確性、完全性、有用性を保証するものではありません。</li>
                            <li>ユーザーの端末、ネットワーク、ソフトウェア環境に起因するマルウェア感染、不正プログラムの混入、第三者による攻撃等により本ツールまたは当社システムに損害が生じた場合、当社は責任を負いません。</li>
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第9条（サービス内容の変更・終了）</h4>
                          <p>当社は、事前の通知なく、本ツールの内容を変更、追加、停止、または終了することができます。これによりユーザーに生じた損害について、当社は一切の責任を負いません。</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第10条（規約の変更）</h4>
                          <ol className="list-decimal list-inside ml-2 space-y-2">
                            <li>当社は、法令の変更、サービス内容の変更その他必要と判断した場合、ユーザーの個別の同意を得ることなく、本規約を変更することができます。</li>
                            <li>変更後の本規約は、本ツールまたは本ウェブサイト上に掲載した時点から効力を生じるものとします。</li>
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">第11条（準拠法および管轄）</h4>
                          <p>本規約は日本法を準拠法とし、本ツールに関して生じた紛争については、福岡地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-600 italic">
                            ※ 本規約は AI・SaaS・分析ツールに特化した内容として整理しています。
                          </p>
                        </div>
                      </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </main>

        <FloatingQnA />
      </div>
    </AuthGuard>
  );
}

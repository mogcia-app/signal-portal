"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

const plans: { [key: string]: { name: string; price: number; description: string } } = {
  light: { 
    name: "ライト", 
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

// 初期費用
const INITIAL_FEE = 200000;
// 消費税率
const TAX_RATE = 0.1;

// 請求書番号を生成（簡易版）
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}${random}`;
};

function InitialInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromUrl = searchParams.get("plan");
  const { userProfile } = useAuth();
  const [contractData, setContractData] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDueDate, setSelectedDueDate] = useState<string>("");
  const [confirmedDueDate, setConfirmedDueDate] = useState<string>("");
  const [datesSaved, setDatesSaved] = useState<boolean>(false);

  useEffect(() => {
    const loadContractData = async () => {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", userProfile.id);
        // キャッシュを無視して最新のデータを取得
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const savedContractData = data.contractData;

          // デバッグ用: Firestoreのデータをコンソールに出力
          console.log('=== Firestore データ確認 ===');
          console.log('selectedPlanId:', data.selectedPlanId);
          console.log('billingInfo.plan:', data.billingInfo?.plan);
          console.log('billingInfo.monthlyFee:', data.billingInfo?.monthlyFee);
          console.log('billingInfo全体:', data.billingInfo);
          console.log('===========================');

          if (savedContractData) {
            // 契約データを設定
            setContractData({
              ...savedContractData.contractData,
              contractDate: savedContractData.contractDate,
              paymentMethods: savedContractData.paymentMethods,
              invoicePaymentDate: savedContractData.invoicePaymentDate,
            });
            
            // 入金期日が保存されていれば設定
            const savedDueDate = savedContractData.confirmedDueDate || data.contractData?.confirmedDueDate;
            if (savedDueDate) {
              setConfirmedDueDate(savedDueDate);
              setSelectedDueDate(savedDueDate);
            }
          }

          // プランIDの取得優先順位: URLパラメータ > planTier + monthlyFee > billingInfo.monthlyFee > billingInfo.plan > selectedPlanId
          // Adminで変更されたプランを反映するため、planTierとmonthlyFeeの組み合わせを最優先
          let planId = planIdFromUrl;
          if (!planId) {
            // まず planTier と monthlyFee の組み合わせで判定（Admin側は松竹梅プランを使用）
            const planTier = data.planTier; // 'ume' | 'take' | 'matsu'
            const monthlyFee = data.billingInfo?.monthlyFee;
            
            console.log('planTier:', planTier);
            console.log('billingInfo.monthlyFee:', monthlyFee);
            
            if (planTier && monthlyFee) {
              // 松竹梅プラン + 料金の組み合わせで判定
              if (planTier === 'ume' && monthlyFee === 15000) {
                planId = 'light';
              } else if (planTier === 'take' && monthlyFee === 30000) {
                planId = 'standard';
              } else if (planTier === 'matsu' && monthlyFee === 60000) {
                planId = 'professional';
              } else {
                // 組み合わせが合わない場合は料金のみで判定
                if (monthlyFee === 15000) {
                  planId = 'light';
                } else if (monthlyFee === 30000) {
                  planId = 'standard';
                } else if (monthlyFee === 60000) {
                  planId = 'professional';
                }
              }
              console.log('planTier + monthlyFee から判定した planId:', planId);
            } else if (monthlyFee) {
              // monthlyFee のみから判定
              console.log('billingInfo.monthlyFee から判定:', monthlyFee);
              if (monthlyFee === 15000) {
                planId = 'light';
              } else if (monthlyFee === 30000) {
                planId = 'standard';
              } else if (monthlyFee === 60000) {
                planId = 'professional';
              }
            }
            
            // monthlyFee から判定できない場合、billingInfo.plan を確認
            if (!planId && data.billingInfo?.plan) {
              const billingPlan = data.billingInfo.plan;
              console.log('billingInfo.plan から判定:', billingPlan);
              // billingInfo.plan が 'light', 'standard', 'professional' などの場合はそのまま使用
              if (billingPlan === 'light' || billingPlan === 'standard' || billingPlan === 'professional') {
                planId = billingPlan;
              } else {
                // 古い形式のプラン名の場合はマッピング
                const planMapping: { [key: string]: string } = {
                  'trial': 'light',
                  'basic': 'light',
                  'professional': 'professional',
                  'enterprise': 'professional',
                };
                planId = planMapping[billingPlan] || null;
                console.log('マッピング後のplanId:', planId);
              }
            }
            
            // それでも見つからない場合は selectedPlanId を使用
            if (!planId) {
              planId = data.selectedPlanId || null;
              console.log('selectedPlanId を使用:', planId);
            }
            
            console.log('最終的な planId:', planId);
          }
          
          // プランIDが変更された場合に更新
          setSelectedPlanId(planId);

          // 請求書番号を取得または生成
          let savedInvoiceNumber = data.invoiceNumber;
          if (!savedInvoiceNumber) {
            // 新規生成
            savedInvoiceNumber = generateInvoiceNumber();
            // Firestoreに保存
            await updateDoc(userDocRef, {
              invoiceNumber: savedInvoiceNumber,
              updatedAt: serverTimestamp(),
            });
          }
          setInvoiceNumber(savedInvoiceNumber);

          // 請求日を取得（保存されていれば使用、なければ今日の日付）
          const savedInvoiceDate = data.invoiceDate || data.contractData?.invoiceDate;
          if (savedInvoiceDate) {
            setInvoiceDate(savedInvoiceDate);
          } else {
            // 保存されていない場合のみ今日の日付を設定
            const today = new Date();
            setInvoiceDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
          }

          // 入金期日を取得（トップレベルまたはcontractDataから）
          const savedDueDate = data.confirmedDueDate || savedContractData?.confirmedDueDate || data.contractData?.confirmedDueDate;
          if (savedDueDate) {
            setConfirmedDueDate(savedDueDate);
          }

          // 保存状態を確認（datesSavedフラグまたは請求日と入金期日の両方が保存されている場合）
          const savedDatesSavedFlag = data.datesSaved || data.contractData?.datesSaved;
          if (savedDatesSavedFlag || (savedInvoiceDate && savedDueDate)) {
            setDatesSaved(true);
          }
        } else {
          // ユーザードキュメントが存在しない場合、今日の日付を設定
          const today = new Date();
          setInvoiceDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
        }
      } catch (error) {
        console.error("Failed to load contract data from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContractData();
  }, [userProfile, planIdFromUrl]);

  // 今日の日付を取得（YYYY-MM-DD形式）
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // 入金期日の初期値を設定（請求書発行の場合のみ、かつ保存されていない場合のみ）
  useEffect(() => {
    if (contractData?.paymentMethods?.includes("請求書発行") && !confirmedDueDate && !datesSaved) {
      // 初期値として今日の日付を設定
      const today = getTodayDate();
      setSelectedDueDate(today);
    }
  }, [contractData, confirmedDueDate, datesSaved]);

  const handleNext = () => {
    router.push("/invoice-preview");
  };

  if (loading || !contractData) {
    return (
      <AuthGuard requireAuth>
        <div className="flex min-h-screen bg-gray-50 items-center justify-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </AuthGuard>
    );
  }

  // 支払方法の判定
  const hasStripe = contractData.paymentMethods?.includes("Stripe決済");
  const hasInvoice = contractData.paymentMethods?.includes("請求書発行");

  // プランIDの決定（URLパラメータ > selectedPlanId）
  const planId = planIdFromUrl || selectedPlanId;

  // 金額計算
  let subtotal = 0;
  let lineItems: { description: string; quantity: number; unitPrice: number; amount: number }[] = [];

  if (hasStripe) {
    // Stripe決済の場合: 初期費用20万円のみ
    subtotal = INITIAL_FEE;
    lineItems = [
      { description: "初期費用", quantity: 1, unitPrice: INITIAL_FEE, amount: INITIAL_FEE }
    ];
  } else if (hasInvoice) {
    // 請求書発行の場合: 初期費用 + 初月プラン費用
    subtotal = INITIAL_FEE;
    lineItems = [
      { description: "初期費用", quantity: 1, unitPrice: INITIAL_FEE, amount: INITIAL_FEE }
    ];

    // プランが選択されている場合、初月プラン費用を追加
    if (planId && plans[planId]) {
      const planPrice = plans[planId].price;
      subtotal += planPrice;
      lineItems.push({
        description: `${plans[planId].name}プラン 初月利用料`,
        quantity: 1,
        unitPrice: planPrice,
        amount: planPrice
      });
    }
  }

  const tax = Math.floor(subtotal * TAX_RATE);
  const total = subtotal + tax;

  // 日付を確定する関数（確定のみ、保存は別ボタンで）
  const handleConfirmDueDate = () => {
    if (selectedDueDate) {
      setConfirmedDueDate(selectedDueDate);
    }
  };

  // 請求日、入金期日、契約日を保存する関数
  const handleSaveDates = async () => {
    if (!userProfile?.id || datesSaved) return; // 既に保存済みの場合は何もしない

    // 請求日と入金期日の両方が設定されているか確認
    if (!invoiceDate) {
      alert("請求日を選択してください");
      return;
    }

    if (!confirmedDueDate) {
      alert("入金期日を確定してください");
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
          type: "initialInvoice",
          agreed: true, // 日付保存済みフラグ
          userId: userProfile.id,
          invoiceData: {
            invoiceDate: invoiceDate,
            confirmedDueDate: confirmedDueDate,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "日付の保存に失敗しました");
      }

      const result = await response.json();
      console.log("請求書の日付をサーバー側に保存しました:", result.data);
      
      // 保存状態を更新（これにより日付フィールドが無効化される）
      setDatesSaved(true);
      
      // 成功メッセージ
      alert("保存しました。これ以降、請求日と入金期日は変更できません。");
    } catch (error) {
      console.error("Failed to save dates:", error);
      alert("保存に失敗しました。再度お試しください。");
    }
  };

  // 表示用の入金期日（確定されていない場合は選択中の日付を表示）
  const displayDueDate = confirmedDueDate || selectedDueDate || "";


  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* 請求書タイトル */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-light text-gray-900 tracking-wide mb-2">請求書</h1>
            <div className="h-px w-24 bg-gray-300 mx-auto"></div>
          </div>

          <div className="bg-white shadow-sm border border-gray-200 p-12 mb-8">
            {/* 請求書ヘッダー */}
            <div className="mb-12 flex justify-between items-start border-b border-gray-200 pb-8">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-light tracking-wide">請求書番号</p>
                <p className="text-sm text-gray-900 font-medium">{invoiceNumber}</p>
                {planId && plans[planId] && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 font-light tracking-wide mb-2">プラン</p>
                    <p className="text-sm text-gray-900 font-medium mb-2">{plans[planId].name}プラン</p>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-md">{plans[planId].description}</p>
                  </div>
                )}
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-gray-500 font-light tracking-wide mb-2">請求日</p>
                {datesSaved ? (
                  <p className="text-sm text-gray-900 font-medium">{invoiceDate}</p>
                ) : (
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    disabled={datesSaved}
                    className="text-sm text-gray-900 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                )}
              </div>
            </div>

            {/* 請求先と請求元 */}
            <div className="grid grid-cols-2 gap-16 mb-4">
              {/* 請求先（左側） */}
              <div>
                <p className="text-xs text-gray-500 font-light tracking-wide mb-4">請求先</p>
                <p className="text-base font-medium text-gray-900 mb-3">
                  {contractData.companyName || "契約会社名を入力"} 御中
                </p>
                {contractData.address && (
                  <p className="text-sm text-gray-600 leading-relaxed">{contractData.address}</p>
                )}
              </div>

              {/* 請求元（右側） */}
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

            {/* 明細表 */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 font-light tracking-wide mb-4">明細</p>
              <div className="border-t border-b border-gray-200">
                {lineItems.map((item, index) => (
                  <div key={index} className="py-4 border-b border-gray-100 last:border-b-0 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">数量: {item.quantity} × ¥{item.unitPrice.toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-gray-900 font-medium ml-8">¥{item.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 合計金額 */}
            <div className="mb-12 space-y-3">
              <div className="flex justify-between items-center py-2">
                <p className="text-sm text-gray-600">小計</p>
                <p className="text-sm text-gray-900">¥{subtotal.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center py-2">
                <p className="text-sm text-gray-600">消費税 (10%)</p>
                <p className="text-sm text-gray-900">¥{tax.toLocaleString()}</p>
              </div>
              <div className="border-t border-gray-300 pt-4 mt-2">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-medium text-gray-900">請求金額</p>
                  <p className="text-2xl font-light text-gray-900 tracking-tight">¥{total.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* 入金期日・振込先（請求書発行の場合のみ） */}
            {hasInvoice && (
              <div className="mb-12 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <p className="text-xs text-gray-500 font-light tracking-wide mb-3">入金期日</p>
                    {datesSaved ? (
                      // 保存済みの場合は表示のみ
                      <p className="text-sm text-gray-900 font-medium">{displayDueDate}</p>
                    ) : confirmedDueDate ? (
                      // 確定済みだが未保存の場合は変更可能
                      <div>
                        <p className="text-sm text-gray-900 font-medium mb-2">{displayDueDate}</p>
                        <button
                          onClick={() => setConfirmedDueDate("")}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          変更する
                        </button>
                      </div>
                    ) : (
                      // 未確定の場合は選択可能
                      <div className="space-y-3">
                        <input
                          type="date"
                          value={selectedDueDate}
                          onChange={(e) => setSelectedDueDate(e.target.value)}
                          min={getTodayDate()}
                          disabled={datesSaved}
                          className="text-sm text-gray-900 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                        <button
                          onClick={handleConfirmDueDate}
                          disabled={!selectedDueDate || datesSaved}
                          className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
                            selectedDueDate && !datesSaved
                              ? "bg-gray-900 text-white hover:bg-gray-800"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          確定
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-light tracking-wide mb-2">振込先</p>
                    <p className="text-sm text-gray-900 font-medium">佐賀銀行福岡支店 (普通) 3078446</p>
                  </div>
                </div>
                {/* 保存ボタン（保存済みでない場合のみ表示） */}
                {!datesSaved && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSaveDates}
                      className="px-6 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                      保存
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 備考 */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-light tracking-wide mb-3">備考</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                本サービスの利用開始は、初期費用および当社が指定する初回利用料金の入金確認後とします。
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 border border-gray-300 rounded text-gray-700 hover:bg-white transition-colors text-sm font-medium"
            >
              戻る
            </button>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function InitialInvoicePage() {
  return (
    <Suspense fallback={
      <AuthGuard requireAuth>
        <div className="flex min-h-screen bg-gray-50 items-center justify-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </AuthGuard>
    }>
      <InitialInvoiceContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  "light-plus": { 
    name: "ライト＋", 
    price: 30000,
    description: "戦略設計から成果最大化までAIが伴走。運用計画、シミュレーション、月次レポート、KPI分析まで網羅。学習型AIが、あなた専用の改善提案を行います。"
  },
};

const INITIAL_FEE = 200000;
const TAX_RATE = 0.1;

export default function InvoicePreviewPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [contractData, setContractData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);

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
          const savedContractData = data.contractData;
          
          // プランIDの取得優先順位: planTier + monthlyFee > billingInfo.monthlyFee > billingInfo.plan > selectedPlanId
          // Adminで変更されたプランを反映するため、planTierとmonthlyFeeの組み合わせを最優先
          let planId = null;
          
          // まず planTier と monthlyFee の組み合わせで判定（Admin側は松竹梅プランを使用）
          const planTier = data.planTier; // 'ume' | 'take' | 'matsu'
          const monthlyFee = data.billingInfo?.monthlyFee;
          
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
          } else if (monthlyFee) {
            // monthlyFee のみから判定
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
            // billingInfo.plan が 'light', 'standard', 'professional', 'light-plus' などの場合はそのまま使用
            if (billingPlan === 'light' || billingPlan === 'standard' || billingPlan === 'professional' || billingPlan === 'light-plus') {
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
            }
          }
          
          // それでも見つからない場合は selectedPlanId を使用
          if (!planId) {
            planId = data.selectedPlanId || null;
          }

          if (savedContractData) {
            setContractData({
              ...savedContractData.contractData,
              contractDate: savedContractData.contractDate,
              paymentMethods: savedContractData.paymentMethods,
              invoicePaymentDate: savedContractData.invoicePaymentDate,
            });

            // 請求書データを生成
            const hasInvoice = savedContractData.paymentMethods?.includes("請求書発行");
            let subtotal = INITIAL_FEE;
            const lineItems: any[] = [
              { description: "初期費用", quantity: 1, unitPrice: INITIAL_FEE, amount: INITIAL_FEE }
            ];

            if (hasInvoice && planId && plans[planId]) {
              const planPrice = plans[planId].price;
              subtotal += planPrice;
              lineItems.push({
                description: `${plans[planId].name}プラン 初月利用料`,
                quantity: 1,
                unitPrice: planPrice,
                amount: planPrice
              });
            }

            const tax = Math.floor(subtotal * TAX_RATE);
            const total = subtotal + tax;

            // 請求日を取得（保存されていれば使用、なければ今日の日付）
            const savedInvoiceDate = data.invoiceDate || data.contractData?.invoiceDate;
            const invoiceDateToUse = savedInvoiceDate || new Date().toISOString().split('T')[0];

            setInvoiceData({
              invoiceNumber: data.invoiceNumber || "",
              invoiceDate: invoiceDateToUse,
              planId,
              lineItems,
              subtotal,
              tax,
              total,
              hasInvoice,
              confirmedDueDate: savedContractData?.confirmedDueDate || data.contractData?.confirmedDueDate || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile]);

  // PDF生成関数
  const handleDownloadPDF = async () => {
    if ((!invoiceRef.current && !contractRef.current) || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    try {
      // TailwindカラークラスからRGBへの完全なマッピング
      const fullColorMap: { [key: string]: string } = {
        'text-gray-900': '#111827',
        'text-gray-800': '#1f2937',
        'text-gray-700': '#374151',
        'text-gray-600': '#4b5563',
        'text-gray-500': '#6b7280',
        'text-gray-400': '#9ca3af',
        'text-gray-300': '#d1d5db',
        'text-gray-200': '#e5e7eb',
        'text-gray-100': '#f3f4f6',
        'bg-white': '#ffffff',
        'bg-gray-50': '#f9fafb',
        'bg-gray-100': '#f3f4f6',
        'bg-gray-200': '#e5e7eb',
        'bg-blue-50': '#eff6ff',
        'bg-blue-200': '#bfdbfe',
        'bg-blue-600': '#2563eb',
        'bg-blue-900': '#1e3a8a',
        'bg-gray-900': '#111827',
        'bg-gray-800': '#1f2937',
        'border-gray-200': '#e5e7eb',
        'border-gray-300': '#d1d5db',
        'border-gray-900': '#111827',
      };

      // PDF生成前にすべての要素のTailwindクラスをインラインスタイルに変換（lab関数を回避）
      // また、不要な空白や余白を削除
      const convertClassesToInlineStyles = (element: HTMLElement) => {
        const allElements = element.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          
          // 空の要素（空白文字のみを含む）を削除
          if (htmlEl.textContent?.trim() === '' && htmlEl.children.length === 0) {
            htmlEl.style.display = 'none';
          }
          
          // Tailwindクラスをチェックしてインラインスタイルに変換
          const classesToRemove: string[] = [];
          htmlEl.classList.forEach((className) => {
            // 色関連のクラスを処理
            if (className.startsWith('text-') && fullColorMap[className]) {
              htmlEl.style.setProperty('color', fullColorMap[className], 'important');
              classesToRemove.push(className);
            }
            if (className.startsWith('bg-') && fullColorMap[className]) {
              htmlEl.style.setProperty('background-color', fullColorMap[className], 'important');
              classesToRemove.push(className);
            }
            if (className.startsWith('border-') && fullColorMap[className]) {
              htmlEl.style.setProperty('border-color', fullColorMap[className], 'important');
              classesToRemove.push(className);
            }
            
            // 計算済みスタイルを取得してRGB値のみを設定
            try {
              const computed = window.getComputedStyle(htmlEl);
              const color = computed.color;
              const bgColor = computed.backgroundColor;
              const borderColor = computed.borderColor;
              
              // RGB値のみを設定（lab関数を回避）
              if (color && (color.startsWith('rgb') || color.startsWith('#'))) {
                htmlEl.style.setProperty('color', color, 'important');
              }
              if (bgColor && (bgColor.startsWith('rgb') || bgColor.startsWith('#') || bgColor === 'transparent')) {
                htmlEl.style.setProperty('background-color', bgColor, 'important');
              }
              if (borderColor && (borderColor.startsWith('rgb') || borderColor.startsWith('#'))) {
                htmlEl.style.setProperty('border-color', borderColor, 'important');
              }
            } catch (e) {
              // エラー時はスキップ
            }
          });
          
          // 色関連のクラスを削除（html2canvasがCSSを解析しないようにする）
          classesToRemove.forEach(cls => htmlEl.classList.remove(cls));
        });
      };

      if (invoiceRef.current) {
        convertClassesToInlineStyles(invoiceRef.current);
      }
      if (contractRef.current) {
        convertClassesToInlineStyles(contractRef.current);
      }

      // B5サイズ: 182mm × 257mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [182, 257],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 請求書を画像に変換
      if (invoiceRef.current) {
        // 要素の実際のサイズを取得
        const invoiceElement = invoiceRef.current;
        const scrollWidth = invoiceElement.scrollWidth;
        const scrollHeight = invoiceElement.scrollHeight;
        const offsetWidth = invoiceElement.offsetWidth;
        const offsetHeight = invoiceElement.offsetHeight;
        
        const invoiceCanvas = await html2canvas(invoiceElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: false,
          width: scrollWidth || offsetWidth,
          height: scrollHeight || offsetHeight,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc, element) => {
            // クローンされたドキュメント内のすべての要素を処理
            const allElements = clonedDoc.querySelectorAll('*');
            
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              
              // 空の要素（空白文字のみを含む）を非表示
              if (htmlEl.textContent?.trim() === '' && htmlEl.children.length === 0) {
                htmlEl.style.display = 'none';
              }
              
              // すべてのTailwindクラスからlab関数を含む可能性のあるクラスを削除
              const classesToKeep: string[] = [];
              htmlEl.classList.forEach((className) => {
                // 色関連のクラスは既にインラインスタイルに変換済みなので削除
                if (!className.startsWith('text-') && !className.startsWith('bg-') && !className.startsWith('border-')) {
                  classesToKeep.push(className);
                }
              });
              htmlEl.className = classesToKeep.join(' ');
              
              // lab関数を含むスタイルをクリーンアップ
              if (htmlEl.style.color && htmlEl.style.color.includes('lab')) {
                htmlEl.style.removeProperty('color');
              }
              if (htmlEl.style.backgroundColor && htmlEl.style.backgroundColor.includes('lab')) {
                htmlEl.style.removeProperty('background-color');
              }
              if (htmlEl.style.borderColor && htmlEl.style.borderColor.includes('lab')) {
                htmlEl.style.removeProperty('border-color');
              }
            });
          },
        });

        const invoiceImgData = invoiceCanvas.toDataURL('image/png');
        const imgWidth = pdfWidth;
        const imgHeight = (invoiceCanvas.height * pdfWidth) / invoiceCanvas.width;

        // 最初のページに請求書を追加
        pdf.addImage(invoiceImgData, 'PNG', 0, 0, imgWidth, imgHeight);

        // 請求書が1ページを超える場合のみ追加ページを作成
        let heightLeft = imgHeight - pdfHeight;
        if (heightLeft > 0) {
          let position = 0;
          while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(invoiceImgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
          }
        }
      }

      // 契約書を画像に変換
      if (contractRef.current) {
        // 要素の実際のサイズを取得
        const contractElement = contractRef.current;
        const scrollWidth = contractElement.scrollWidth;
        const scrollHeight = contractElement.scrollHeight;
        const offsetWidth = contractElement.offsetWidth;
        const offsetHeight = contractElement.offsetHeight;
        
        // 契約書要素を確実に表示状態にする（スクロール位置を調整）
        contractElement.scrollIntoView({ behavior: 'auto', block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 100)); // スクロール完了を待つ
        
        const contractCanvas = await html2canvas(contractElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: false,
          width: scrollWidth || offsetWidth,
          height: scrollHeight || offsetHeight,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc, element) => {
            // クローンされたドキュメント内のすべての要素を処理
            const allContractElements = clonedDoc.querySelectorAll('*');
            
            allContractElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              
              // 空の要素（空白文字のみを含む）を非表示
              if (htmlEl.textContent?.trim() === '' && htmlEl.children.length === 0) {
                htmlEl.style.display = 'none';
              }
              
              // すべてのTailwindクラスからlab関数を含む可能性のあるクラスを削除
              const classesToKeep: string[] = [];
              htmlEl.classList.forEach((className) => {
                // 色関連のクラスは既にインラインスタイルに変換済みなので削除
                if (!className.startsWith('text-') && !className.startsWith('bg-') && !className.startsWith('border-')) {
                  classesToKeep.push(className);
                }
              });
              htmlEl.className = classesToKeep.join(' ');
              
              // lab関数を含むスタイルをクリーンアップ
              if (htmlEl.style.color && htmlEl.style.color.includes('lab')) {
                htmlEl.style.removeProperty('color');
              }
              if (htmlEl.style.backgroundColor && htmlEl.style.backgroundColor.includes('lab')) {
                htmlEl.style.removeProperty('background-color');
              }
              if (htmlEl.style.borderColor && htmlEl.style.borderColor.includes('lab')) {
                htmlEl.style.removeProperty('border-color');
              }
            });
          },
        });

        const contractImgData = contractCanvas.toDataURL('image/png');
        const contractImgWidth = pdfWidth;
        const contractImgHeight = (contractCanvas.height * pdfWidth) / contractCanvas.width;

        // 契約書を新しいページに追加
        pdf.addPage();
        pdf.addImage(contractImgData, 'PNG', 0, 0, contractImgWidth, contractImgHeight);

        // 契約書が1ページを超える場合のみ追加ページを作成
        let contractHeightLeft = contractImgHeight - pdfHeight;
        if (contractHeightLeft > 0) {
          let contractPosition = 0;
          while (contractHeightLeft > 0) {
            contractPosition = contractHeightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(contractImgData, 'PNG', 0, contractPosition, contractImgWidth, contractImgHeight);
            contractHeightLeft -= pdfHeight;
          }
        }
      }

      const fileName = `契約書_請求書_${invoiceData?.invoiceNumber || 'invoice'}_${invoiceData?.invoiceDate || new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF生成エラー:", error);
      alert("PDFの生成に失敗しました。");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading || !contractData || !invoiceData) {
    return (
      <AuthGuard requireAuth>
        <div className="flex min-h-screen bg-gray-50 items-center justify-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </AuthGuard>
    );
  }

  const hasInvoice = invoiceData.hasInvoice;
  const planId = invoiceData.planId;

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-light text-gray-900 tracking-wide mb-4">
              契約書・請求書プレビュー
            </h1>
            
          </div>

          {/* 請求書プレビュー */}
          <div ref={invoiceRef} className="bg-white shadow-sm border border-gray-200 p-12 mb-8">
            <div className="mb-12 flex justify-between items-start border-b border-gray-200 pb-8">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-light tracking-wide">請求書番号</p>
                <p className="text-sm text-gray-900 font-medium">{invoiceData.invoiceNumber}</p>
                {planId && plans[planId] && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 font-light tracking-wide mb-2">プラン</p>
                    <p className="text-sm text-gray-900 font-medium mb-2">{plans[planId].name}プラン</p>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-md">{plans[planId].description}</p>
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
                  {contractData.companyName || ""} 御中
                </p>
                {contractData.address && (
                  <p className="text-sm text-gray-600 leading-relaxed">{contractData.address}</p>
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
                {invoiceData.lineItems.map((item: any, index: number) => (
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

            {hasInvoice && (
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

          {/* 契約書プレビュー */}
          <div className="mb-8">
            <div ref={contractRef} className="bg-white shadow-sm border border-gray-200 p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                <span className="font-bold text-gray-900">Signal</span><span style={{ color: '#ff8a15' }}>.</span> 利用契約書
              </h2>
            </div>

            <div className="text-sm text-gray-700 space-y-6">
              <div>
                <p className="mb-4">
                  本契約書（以下「本契約」といいます。）は、株式会社MOGCIA（以下「当社」といいます。）が提供するSNS運用支援ツール「Signal.」（以下「本サービス」といいます。）の利用条件について、当社と本サービスを利用する個人または法人（以下「契約者」といいます。）との間で締結されるものです。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第1条（契約の成立）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本契約は、契約者が本契約の内容を確認し、当社所定の方法により同意の意思表示を行った時点で成立するものとします。</li>
                  <li>契約者は、本契約が電子的手続（チェックボックスへの同意、日時・IPアドレス等の記録）により成立することを承諾するものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第2条（本サービスの内容）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本サービスは、SNS投稿文・ハッシュタグ生成、投稿計画作成、分析、KPI管理、レポート生成等の機能を提供するものです。</li>
                  <li>利用可能な機能は、契約者が選択したプラン内容に応じて異なります。</li>
                  <li>当社は、本サービスの内容を予告なく変更・追加・削除することがあります。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第3条（利用形態）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>契約者が法人である場合、本契約は当該法人を当事者とし、当該法人の役員・従業員その他本サービスを利用する者の行為は、すべて当該法人の行為とみなします。</li>
                  <li>契約者が個人である場合、当該個人が本契約上の一切の義務を負うものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第4条（利用料金および支払方法）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>契約者は、本サービスの利用対価として、当社が別途定める利用料金を支払うものとします。</li>
                  <li>本サービスの利用開始は、初期費用および当社が指定する初回利用料金の入金確認後とします。</li>
                  <li>契約者は、以下のいずれかの支払方法を選択するものとします。
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Stripe決済</li>
                      <li>請求書発行</li>
                    </ul>
                  </li>
                  <li>Stripe決済を選択した場合、支払日、課金周期、無料期間、次回更新日等は、Stripeが定める決済条件および当社が提示する内容に準ずるものとします。</li>
                  <li>請求書発行を選択した場合、契約者は、当社と別途合意した支払条件に従い支払うものとします。</li>
                  <li>請求書発行を選択した場合、契約者は、以下のいずれかの支払日を選択するものとします。
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>毎月15日支払</li>
                      <li>毎月30日支払</li>
                    </ul>
                  </li>
                  <li>請求書に定める支払日から2日を経過してもなお入金が確認できない場合、当社は、事前通知なく本サービスの利用を一時停止することができるものとします。</li>
                  <li>支払遅延が継続する場合、当社は、契約者に対し、年14.6％の割合による遅延損害金を請求できるものとし、あわせて契約の解除その他必要な措置を講じることができます。</li>
                  <li>支払期日を経過してもなお支払いが確認できない場合、当社は事前通知なく本サービスの利用を停止することができます。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第5条（知的財産権）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本サービスに関するプログラム、UI、構成、アルゴリズム、ノウハウその他一切の知的財産権は、すべて当社に帰属します。</li>
                  <li>本サービスにより生成されたコンテンツの著作権は、契約者に帰属します。ただし、当社は統計分析およびサービス改善目的に限り、無償で利用できるものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第6条（禁止事項）</h3>
                <p className="mb-2">
                  契約者は、以下の行為を行ってはなりません。
                </p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>本サービス、本ツール、会員サイトの解析、逆コンパイル、リバースエンジニアリングその他これに類する行為</li>
                  <li>本サービスのアルゴリズム、モデル、プロンプト、構成、UI、画面遷移、設計思想等を抽出・模倣・解析する行為</li>
                  <li>当社または第三者のサービスと競合する目的で本サービスを利用する行為</li>
                  <li>本サービス、会員サイトおよびツール内に掲載される情報（操作マニュアル、解説文章、動画、SNS運用ノウハウ、戦略資料、画面構成を含みますがこれらに限りません）を、第三者に対して開示、共有、提供、転載、販売、貸与する行為</li>
                  <li>画面録画、画面キャプチャ、資料の複製その他の方法により、前号の情報を第三者に共有する行為</li>
                  <li>第三者への再販売、貸与、アカウント共有、情報開示</li>
                  <li>法令または公序良俗に反する行為</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第7条（競合契約の制限）</h3>
                <p>
                  当社は、同業者または競合サービスの開発・調査・模倣等を目的とした契約であると判断した場合、契約の締結または継続を拒否できるものとします。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第8条（セキュリティおよび責任）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>契約者は、本サービスの利用にあたり、自己の責任において端末、ネットワークおよび利用環境の安全性を確保するものとします。</li>
                  <li>契約者の故意または過失により、ウイルス感染、不正アクセス、情報漏洩、第三者への情報流出等が発生し、当社に損害が生じた場合、契約者は当該損害（調査費用、対応費用、逸失利益を含みますがこれらに限りません）を賠償する責任を負うものとします。</li>
                  <li>当社は、不正利用の疑い、情報漏洩の可能性、支払遅延、システム障害その他緊急性を要すると判断した場合、事前通知なく本サービスへのアクセス制御または利用停止を行うことができます。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第9条（秘密情報および非公開義務）※解約後も有効</h3>
                <p className="mb-3">
                  契約者は、本契約の有効期間中および本契約終了後を問わず、本サービスおよび会員サイトを通じて提供または閲覧可能となる一切の情報（以下「本非公開情報」といいます）について、第三者に開示、漏洩、提供、共有、利用させてはならないものとします。
                </p>
                <p className="mb-2">本非公開情報には、以下を含みますが、これらに限定されません。</p>
                <ul className="list-disc list-inside ml-4 mb-3 space-y-1">
                  <li>本サービスおよび会員サイトの使い方説明</li>
                  <li>操作マニュアル、解説文章、動画コンテンツ</li>
                  <li>SNS運用ノウハウ、戦略設計、思考フレーム、運用手法</li>
                  <li>UI、画面構成、導線、機能構成、仕様、思想</li>
                  <li>その他、本サービスを通じて得られる一切の情報</li>
                </ul>
                <p className="mb-3">
                  契約者は、前項の情報について、スクリーンショット、画面録画、録音、転載、第三者への送信、口頭での説明、社内外の勉強会・研修・資料への転用等、方法のいかんを問わず、第三者に共有または開示してはならないものとします。
                </p>
                <p className="mb-3">
                  本条の義務は、本契約終了後も存続するものとします。
                </p>
                <p className="mb-2">
                  契約者は、本サービスおよび本非公開情報を利用して得た知見、ノウハウ、構成、思想、運用方法等を、以下の目的で利用してはなりません。
                </p>
                <ul className="list-disc list-inside ml-4 mb-3 space-y-1">
                  <li>当社と競合するサービス、ツール、講座、コンサルティング等の開発、運営</li>
                  <li>第三者への提供、販売、教育、指導、コンサルティング</li>
                  <li>自社または第三者のサービスにおける模倣、転用、再構成</li>
                  <li>その他、当社の利益を侵害する一切の行為</li>
                </ul>
                <p className="mb-2 font-semibold">利用状況の記録および監視</p>
                <p className="mb-3">
                  当社は、契約者の行為が前項に違反すると判断した場合、事前の通知なく、本契約の解除、サービス提供の停止、差止請求、損害賠償請求その他必要な法的措置を講じることができるものとします。
                </p>
                <p className="mb-3">
                  当社は、本サービスの安全な運営、不正利用の防止、契約違反行為の検知および証拠保全の目的のため、契約者による本サービスの利用状況について、以下の情報を取得・記録することがあります。
                </p>
                <ul className="list-disc list-inside ml-4 mb-3 space-y-1">
                  <li>ログイン日時</li>
                  <li>IPアドレス</li>
                  <li>端末情報（User Agent 等）</li>
                  <li>閲覧した画面、機能およびその利用時間</li>
                  <li>その他、本サービスの利用状況に関する情報</li>
                </ul>
                <p className="mb-3">
                  これらの情報は、上記目的の範囲内でのみ利用し、法令に基づく場合を除き、第三者に開示することはありません。当社は、前項に基づき取得した利用状況ログを、本契約違反の有無の判断、利用停止、損害賠償請求その他の法的措置の根拠として利用することができるものとします。
                </p>
                <p className="mb-3">
                  契約者は、前条に基づき取得された利用状況ログが、本契約違反の有無を判断するための合理的な証拠となり得ることを、あらかじめ承諾するものとします。
                </p>
                <p className="mb-3">
                  契約者は、自己の役員、従業員、業務委託先その他本サービスにアクセス可能な第三者の行為について、自己の行為と同一の責任を負うものとします。
                </p>
                <p>
                  本条に基づく情報の取扱いは、当社プライバシーポリシーに従うものとします。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第10条（免責）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>当社は、本サービスの正確性、完全性、有用性、成果等について一切保証しません。</li>
                  <li>本サービスの利用により契約者に生じた損害について、当社は故意または重過失がある場合を除き、一切の責任を負いません。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第11条（契約期間および解約）</h3>
                <p className="mb-3">
                  本契約の有効期間は、利用開始日から1年間とします。期間満了日の1か月前までに、当社所定の方法による解約の意思表示がない場合、本契約は同一条件にて1年間自動更新されるものとします。
                </p>
                <p className="mb-3">
                  契約期間中において、契約者の都合により本契約を解約する場合、理由のいかんを問わず、契約期間満了日までの残存期間に対応する利用料金の全額を支払うものとします。
                </p>
                <p>
                  前項の場合において、既に支払われた利用料金について、当社は返金義務を負わないものとします。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第12条（利用規約との関係）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本契約は、当社が別途定める会員サイト利用規約およびツール利用規約と一体として適用されるものとします。</li>
                  <li>本契約、会員サイト利用規約およびツール利用規約の内容に相違がある場合は、本契約の定めが優先して適用されるものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第13条（準拠法および管轄）</h3>
                <p>
                  本契約は日本法を準拠法とし、本契約に関して生じる一切の紛争については、福岡地方裁判所を第一審の専属的合意管轄裁判所とします。
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold mb-4">契約情報</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>契約日:</strong> {contractData.contractDate || ''}</p>
                  <p><strong>契約会社名:</strong> {contractData.companyName || ''}</p>
                  <p><strong>契約担当者名:</strong> {contractData.representativeName || ''}</p>
                  <p><strong>メールアドレス:</strong> {contractData.email || ''}</p>
                  <p><strong>住所:</strong> {contractData.address || ''}</p>
                  <p><strong>電話番号:</strong> {contractData.phone || ''}</p>
                  <p><strong>支払方法:</strong> {contractData.paymentMethods?.join('、') || ''}</p>
                  {contractData.invoicePaymentDate && (
                    <p><strong>支払日:</strong> {contractData.invoicePaymentDate}</p>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* 注意書き */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-sm text-gray-700">
                上記の契約書・請求書の内容を確認しましたか？確認後、「次へ」ボタンをクリックして進んでください。
              </p>
              <p className="text-xs text-gray-500 mt-2">
                後から確認する場合は、このページにいつでもアクセスできます。
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
              onClick={() => router.push("/terms-agreement")}
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


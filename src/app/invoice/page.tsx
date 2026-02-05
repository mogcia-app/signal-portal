"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import SidebarToc from "@/components/SidebarToc";
import FloatingQnA from "@/components/FloatingQnA";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfile } from "@/types/user";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const TAX_RATE = 0.1;

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  planId: string;
  monthlyFee: number;
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue';
  billingMonth?: string; // 重複防止用（例: "2026-02"）
  createdAt: any;
  paidAt?: any;
}

export default function InvoicePage() {
  const { userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [contractData, setContractData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [hasInvoicePayment, setHasInvoicePayment] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // 契約日から日にちを抽出する関数（次回請求日の表示用）
  const extractDayFromContractDate = (contractDate: string): number | null => {
    if (!contractDate) return null;
    
    // "2026年1月15日" 形式の場合
    const match1 = contractDate.match(/(\d+)年\d+月(\d+)日/);
    if (match1) {
      return parseInt(match1[2], 10);
    }
    
    // "2026-01-15" 形式の場合
    const match2 = contractDate.match(/^\d{4}-\d{2}-(\d{2})/);
    if (match2) {
      return parseInt(match2[1], 10);
    }
    
    // "2026/01/15" 形式の場合
    const match3 = contractDate.match(/^\d{4}\/\d{2}\/(\d{2})/);
    if (match3) {
      return parseInt(match3[1], 10);
    }
    
    return null;
  };

  // 次回請求日を計算する関数
  const getNextInvoiceDate = (contractDay: number | null): string | null => {
    if (!contractDay) return null;
    
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 今月の契約日がまだ来ていない場合
    if (currentDay < contractDay) {
      return `${currentYear}年${currentMonth + 1}月${contractDay}日`;
    }
    
    // 今月の契約日が過ぎている場合、来月
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return `${nextYear}年${nextMonth + 1}月${contractDay}日`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      try {
        // ユーザーデータを取得
        const userDocRef = doc(db, "users", userProfile.id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({ id: userDoc.id, ...data } as UserProfile);
          
          // contractDataの構造を確認（ネストされている可能性がある）
          const savedContractData = data.contractData;
          setContractData(savedContractData);

          // 請求書支払いユーザーかチェック
          const paymentMethods = savedContractData?.paymentMethods || [];
          const hasInvoice = paymentMethods.includes("請求書発行");
          setHasInvoicePayment(hasInvoice);

          // 請求書支払いユーザーでない場合はアクセス拒否
          if (!hasInvoice) {
            setLoading(false);
            return;
          }

          // 請求書一覧を取得
          const invoicesQuery = query(
            collection(db, "invoices"),
            where("userId", "==", userProfile.id),
            orderBy("invoiceDate", "desc")
          );
          const invoicesSnapshot = await getDocs(invoicesQuery);
          const invoicesList = invoicesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            invoiceDate: doc.data().invoiceDate,
            dueDate: doc.data().dueDate,
            createdAt: doc.data().createdAt,
            paidAt: doc.data().paidAt,
          })) as Invoice[];
          setInvoices(invoicesList);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile]);



  const handleExportPDF = async (invoice: Invoice) => {
    if (!invoiceRef.current) return;

    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`請求書_${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDFの生成に失敗しました。");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAuth>
        <div className="flex min-h-screen bg-gray-50">
          <SidebarToc />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">読み込み中...</div>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  // 請求書支払いユーザーでない場合はアクセス拒否
  if (!hasInvoicePayment) {
    return (
      <AuthGuard requireAuth>
        <div className="flex min-h-screen bg-gray-50">
          <SidebarToc />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 mb-4">このページにアクセスする権限がありません。</p>
                <p className="text-sm text-gray-500">請求書支払いを選択したユーザーのみがアクセスできます。</p>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth>
      <div className="flex min-h-screen bg-gray-50">
        <SidebarToc />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">請求書</h1>
                {contractData?.contractDate && (() => {
                  const contractDay = extractDayFromContractDate(contractData.contractDate) || extractDayFromContractDate(contractData.invoicePaymentDate || "");
                  const nextInvoiceDate = getNextInvoiceDate(contractDay);
                  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                  const hasCurrentMonthInvoice = invoices.some(inv => inv.invoiceDate.startsWith(currentMonth));
                  
                  return (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        契約日: {contractData.contractDate}（毎月{contractDay}日に請求書が自動発行されます）
                      </p>
                      {!hasCurrentMonthInvoice && nextInvoiceDate && (
                        <p className="text-sm text-blue-600 font-medium">
                          次回請求日: {nextInvoiceDate}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 請求書一覧 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">請求書一覧</h2>
              {invoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">請求書がありません</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">請求書番号</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">請求日</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">支払期限</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">金額</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ステータス</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm text-gray-900">{invoice.invoiceNumber}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{invoice.invoiceDate}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{invoice.dueDate}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">¥{invoice.total.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                invoice.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : invoice.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {invoice.status === "paid"
                                ? "支払い済み"
                                : invoice.status === "pending"
                                ? "支払い待ち"
                                : "支払い期限切れ"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedInvoice(invoice)}
                                className="text-sm text-orange-600 hover:text-orange-700"
                              >
                                表示
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleExportPDF(invoice)}
                                disabled={isGeneratingPDF}
                                className="text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50"
                              >
                                {isGeneratingPDF ? "生成中..." : "PDF"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 請求書詳細表示 */}
            {selectedInvoice && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">請求書詳細</h2>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div ref={invoiceRef} className="p-8 bg-white">
                  {/* 請求書の内容 */}
                  <div className="mb-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">請求書</h1>
                        <p className="text-sm text-gray-600">請求書番号: {selectedInvoice.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 font-light tracking-wide mb-1">発行日</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedInvoice.invoiceDate}</p>
                        <p className="text-sm text-gray-500 font-light tracking-wide mb-1 mt-4">支払期限</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedInvoice.dueDate}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-16 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-light tracking-wide mb-4">請求先</p>
                        {(() => {
                          // contractDataの構造を確認（ネストされている可能性がある）
                          const companyInfo = contractData?.contractData || contractData || {};
                          const companyName = companyInfo.companyName || userData?.companyName || "";
                          const address = companyInfo.address || "";
                          const representativeName = companyInfo.representativeName || "";
                          const phone = companyInfo.phone || "";
                          const email = companyInfo.email || "";
                          const invoicePaymentDate = contractData?.invoicePaymentDate || "";
                          
                          return (
                            <>
                              {companyName && (
                                <p className="text-base font-medium text-gray-900 mb-3">
                                  {companyName} 御中
                                </p>
                              )}
                              {address && (
                                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                                  {address}
                                </p>
                              )}
                              {representativeName && (
                                <p className="text-sm text-gray-700">
                                  代表者: {representativeName}
                                </p>
                              )}
                              {phone && (
                                <p className="text-sm text-gray-700 mt-1">
                                  TEL: {phone}
                                </p>
                              )}
                              {email && (
                                <p className="text-sm text-gray-700 mt-1">
                                  Email: {email}
                                </p>
                              )}
                              {invoicePaymentDate && (
                                <p className="text-sm text-gray-700 mt-2 font-medium">
                                  支払日: {invoicePaymentDate}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-light tracking-wide mb-4">発行元</p>
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
                  </div>

                  <div className="border-t border-b border-gray-200 py-4 mb-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 font-medium">
                          {plans[selectedInvoice.planId]?.name || "プラン"} 月額利用料
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          数量: 1 × ¥{selectedInvoice.monthlyFee.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-900 font-medium ml-8">¥{selectedInvoice.monthlyFee.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-end mb-6">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>小計</span>
                        <span>¥{selectedInvoice.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>消費税 (10%)</span>
                        <span>¥{selectedInvoice.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>合計</span>
                        <span>¥{selectedInvoice.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-xs text-gray-500 font-light tracking-wide mb-2">振込先</p>
                    <p className="text-sm text-gray-900 font-medium">佐賀銀行福岡支店 (普通) 3078446</p>
                    <p className="text-sm text-gray-900 font-medium mt-1">株式会社MOGCIA</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={() => handleExportPDF(selectedInvoice)}
                    disabled={isGeneratingPDF}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingPDF ? "生成中..." : "PDFとして保存"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
        <FloatingQnA />
      </div>
    </AuthGuard>
  );
}


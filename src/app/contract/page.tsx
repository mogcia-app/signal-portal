"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

export default function ContractPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [agreementItems, setAgreementItems] = useState({
    fullContract: false, // 利用契約書（全文）に同意
    unpaidTermination: false, // 未払い時の解除・残存期間分請求・違約金（10％）に同意
    analysisProhibition: false, // 本サービスの解析・模倣・競合目的での利用禁止に同意
    suspension: false, // 不正利用・支払遅延時の事前通知なしの利用停止に同意
    confidentialInfo: false, // 非公開情報の第三者共有・転用・競合利用の禁止に同意
  });
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [invoicePaymentDate, setInvoicePaymentDate] = useState<string>("");
  const [contractDate, setContractDate] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [contractData, setContractData] = useState({
    companyName: "",
    representativeName: "",
    email: "",
    address: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consentHistory, setConsentHistory] = useState<any>(null); // 最新の同意履歴

  // 契約日を自動入力（リアルタイムの日付）
  useEffect(() => {
    const now = new Date();
    const dateString = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    setContractDate(dateString);
  }, []);

  // Firestoreから保存されたデータを読み込む
  useEffect(() => {
    const loadContractData = async () => {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/contract-data?userId=${encodeURIComponent(userProfile.id)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch contract data: ${response.status}`);
        }
        const result = await response.json();
        const savedContractData = result?.data?.contractData;
        const latestConsent = result?.data?.latestConsent;

          if (savedContractData) {
            setContractData(savedContractData.contractData || {
              companyName: "",
              representativeName: "",
              email: "",
              address: "",
              phone: "",
            });
            const savedPaymentMethods = savedContractData.paymentMethods || [];
            setPaymentMethods(savedPaymentMethods);
            // 請求書発行が選択されている場合、支払日が未設定なら30日支払に設定
            const savedInvoicePaymentDate = savedContractData.invoicePaymentDate || "";
            if (savedPaymentMethods.includes("請求書発行") && !savedInvoicePaymentDate) {
              setInvoicePaymentDate("毎月30日支払");
            } else {
              setInvoicePaymentDate(savedInvoicePaymentDate);
            }
            // まずagreementItemsを読み込む
            if (savedContractData.agreementItems) {
              setAgreementItems({
                fullContract: savedContractData.agreementItems.fullContract || false,
                unpaidTermination: savedContractData.agreementItems.unpaidTermination || false,
                analysisProhibition: savedContractData.agreementItems.analysisProhibition || false,
                suspension: savedContractData.agreementItems.suspension || false,
                confidentialInfo: savedContractData.agreementItems.confidentialInfo || false,
              });
            }
            
            if (savedContractData.contractDate) {
              setContractDate(savedContractData.contractDate);
            }

            if (latestConsent) {
              setConsentHistory(latestConsent);
              if (latestConsent.items) {
                const restoredItems = {
                  fullContract: latestConsent.items.fullContract?.agreed || false,
                  unpaidTermination: latestConsent.items.unpaidTermination?.agreed || false,
                  analysisProhibition: latestConsent.items.analysisProhibition?.agreed || false,
                  suspension: latestConsent.items.suspension?.agreed || false,
                  confidentialInfo: latestConsent.items.confidentialInfo?.agreed || false,
                };
                setAgreementItems(restoredItems);
                const allAgreed = Object.values(restoredItems).every(val => val === true);
                setAgreed(allAgreed);
              }
            } else {
              const savedItems = savedContractData.agreementItems || {};
              const allItemsAgreed = Object.values(savedItems).length > 0 && 
                Object.values(savedItems).every((val: any) => val === true);
              setAgreed(allItemsAgreed);
            }
          } else {
            // Firestoreに保存データがなく、ユーザープロフィールがある場合のみ初期値を設定
            setContractData({
              companyName: userProfile.companyName || "",
              representativeName: userProfile.representativeName || "",
              email: userProfile.email || "",
              address: "",
              phone: userProfile.phone || "",
            });
          }
      } catch (error) {
        console.error("Failed to load contract data:", error);
        // エラー時はユーザープロフィールから初期値を設定
        if (userProfile) {
          setContractData({
            companyName: userProfile.companyName || "",
            representativeName: userProfile.representativeName || "",
            email: userProfile.email || "",
            address: "",
            phone: userProfile.phone || "",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadContractData();
  }, [userProfile]);

  // Firestoreに保存する関数（APIルート経由）
  // ドラフト保存のため、agreedは常にfalseを送る
  const saveToFirestore = useCallback(async () => {
    if (!userProfile?.id || saving) return;

    setSaving(true);
    try {
      const response = await fetch("/api/agreements/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "contract",
          agreed: false, // ドラフト保存のため常にfalse
          userId: userProfile.id,
          contractData: {
            contractData: contractData, // companyName等の契約データ
            paymentMethods: paymentMethods,
            invoicePaymentDate: invoicePaymentDate,
            agreementItems: agreementItems,
            contractDate: contractDate,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "契約データの保存に失敗しました");
      }
    } catch (error) {
      console.error("Failed to save contract data to Firestore:", error);
      // ドラフト保存のエラーはユーザーに表示しない（入力中の自動保存のため）
    } finally {
      setSaving(false);
    }
  }, [userProfile?.id, contractData, paymentMethods, invoicePaymentDate, agreementItems, contractDate, saving]);

  // データが変更されたらFirestoreに保存（デバウンス付き）
  useEffect(() => {
    if (!userProfile?.id || loading) return;

    const timeoutId = setTimeout(() => {
      saveToFirestore();
    }, 1000); // 1秒後に保存（デバウンス）

    return () => clearTimeout(timeoutId);
  }, [contractData, paymentMethods, invoicePaymentDate, agreed, contractDate, userProfile?.id, loading, saveToFirestore]);

  const handleInputChange = (field: string, value: string) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };


  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    if (checked) {
      setPaymentMethods(prev => [...prev, method]);
      // 請求書発行を選択した場合は自動的に30日支払に設定
      if (method === "請求書発行") {
        setInvoicePaymentDate("毎月30日支払");
      }
    } else {
      setPaymentMethods(prev => prev.filter(m => m !== method));
      if (method === "請求書発行") {
        setInvoicePaymentDate("");
      }
    }
    // エラーをクリア
    if (errors.paymentMethods) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.paymentMethods;
        return newErrors;
      });
    }
    if (errors.invoicePaymentDate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.invoicePaymentDate;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 支払方法のバリデーション
    if (paymentMethods.length === 0) {
      newErrors.paymentMethods = "支払方法を1つ以上選択してください";
    }

    // 請求書発行を選択した場合、支払日が設定されているか確認（自動設定されるが念のため）
    if (paymentMethods.includes("請求書発行") && !invoicePaymentDate) {
      newErrors.invoicePaymentDate = "支払日が設定されていません";
    }

    // 契約情報のバリデーション
    if (!contractData.companyName.trim()) {
      newErrors.companyName = "契約会社名を入力してください";
    }
    if (!contractData.representativeName.trim()) {
      newErrors.representativeName = "契約担当者名を入力してください";
    }
    if (!contractData.email.trim()) {
      newErrors.email = "契約者メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractData.email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }
    if (!contractData.address.trim()) {
      newErrors.address = "契約者住所を入力してください";
    }
    if (!contractData.phone.trim()) {
      newErrors.phone = "契約者電話番号を入力してください";
    }

    // 個別同意項目のバリデーション
    if (!agreementItems.fullContract) {
      newErrors.fullContract = "利用契約書（全文）に同意してください";
    }
    if (!agreementItems.unpaidTermination) {
      newErrors.unpaidTermination = "未払い時の解除・残存期間分請求・違約金（10％）に同意してください";
    }
    if (!agreementItems.analysisProhibition) {
      newErrors.analysisProhibition = "本サービスの解析・模倣・競合目的での利用禁止に同意してください";
    }
    if (!agreementItems.suspension) {
      newErrors.suspension = "不正利用・支払遅延時の事前通知なしの利用停止に同意してください";
    }
    if (!agreementItems.confidentialInfo) {
      newErrors.confidentialInfo = "非公開情報の第三者共有・転用・競合利用の禁止に同意してください";
    }
    
    // すべての項目に同意した場合、agreedをtrueにする
    const allAgreed = Object.values(agreementItems).every(item => item === true);
    if (!allAgreed) {
      newErrors.agreed = "すべての項目に同意してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      // バリデーションエラーがある場合はスクロールして最初のエラーまで移動
      const firstErrorElement = document.querySelector('[data-error]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // すべての項目に同意した場合のみagreedをtrueにする
    const allAgreed = Object.values(agreementItems).every(item => item === true);
    if (!allAgreed) {
      alert("すべての項目に同意してください");
      return;
    }

    // APIルーター経由でサーバー側に保存（IPアドレス、User-Agent、タイムスタンプも記録）
    if (userProfile?.id) {
      try {
        const response = await fetch("/api/agreements/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "contract",
            agreed: true, // すべての項目に同意した場合のみtrue
            userId: userProfile.id,
            contractData: {
              contractDate: contractDate || new Date().toISOString().split('T')[0],
              paymentMethods: paymentMethods,
              invoicePaymentDate: invoicePaymentDate,
              agreementItems: agreementItems, // 個別同意項目を保存
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "契約データの保存に失敗しました");
        }

        const result = await response.json();
        console.log("契約データをサーバー側に保存しました:", result.data);
        if (result.data?.savedToSubcollection) {
          console.log("✓ 同意ログをcontractConsentsサブコレクションに保存しました");
        }
      } catch (error) {
        console.error("Failed to save contract data:", error);
        alert("契約データの保存に失敗しました。再度お試しください。");
        return; // エラー時は次に進まない
      }
    }

    // 請求書ページへリダイレクト
    router.push("/initial-invoice");
  };

  if (loading) {
    return (
      <AuthGuard requireAuth>
        <div className="flex min-h-screen bg-gray-50 items-center justify-center">
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
          {/* 契約書内容 */}
          <div className="max-h-[600px] overflow-y-auto border-2 border-gray-300 p-6 bg-gray-50">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-light text-gray-900 tracking-wide mb-2">
                <span className="font-bold text-gray-900">Signal</span><span style={{ color: '#ff8a15' }}>.</span> 利用契約書
              </h1>
              <div className="h-px w-24 bg-gray-300 mx-auto"></div>
            </div>
            <div className="text-sm text-gray-700 space-y-4">
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
                <h3 className="font-semibold mb-2">第5条（知的財産権）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本サービスに関するプログラム、UI、構成、アルゴリズム、ノウハウその他一切の知的財産権は、すべて当社に帰属します。</li>
                  <li>本サービスにより生成されたコンテンツの著作権は、契約者に帰属します。ただし、当社は統計分析およびサービス改善目的に限り、無償で利用できるものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第6条（禁止事項）</h3>
                <p>
                  契約者は、以下の行為を行ってはなりません。
                </p>
                <ol className="list-decimal list-inside ml-2 mt-2 space-y-1">
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
                <h3 className="font-semibold mb-2">第11条（反社会的勢力の排除）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>契約者は、現在および将来にわたり、自己または自己の役員、従業員、関係者が、反社会的勢力（暴力団、暴力団員、暴力団関係企業、総会屋、社会運動等標ぼうゴロ、その他これらに準ずる者を含みます）に該当しないことを表明し、保証するものとします。</li>
                  <li>契約者が前項に違反したことが判明した場合、当社は、何らの通知または催告を要することなく、直ちに本契約の全部または一部を解除することができるものとします。</li>
                  <li>前項による解除により契約者に損害が生じた場合であっても、当社は一切の責任を負わないものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第12条（契約期間および解約）</h3>
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
                <h3 className="font-semibold mb-2">第13条（利用規約との関係）</h3>
                <ol className="list-decimal list-inside ml-2 space-y-2">
                  <li>本契約は、当社が別途定める会員サイト利用規約およびツール利用規約と一体として適用されるものとします。</li>
                  <li>本契約、会員サイト利用規約およびツール利用規約の内容に相違がある場合は、本契約の定めが優先して適用されるものとします。</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">第14条（準拠法および管轄）</h3>
                <p>
                  本契約は日本法を準拠法とし、本契約に関して生じる一切の紛争については、福岡地方裁判所を第一審の専属的合意管轄裁判所とします。
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 italic">
                  ※本契約に定めのない事項については、会員サイト利用規約およびツール利用規約が適用されます。
                </p>
              </div>
            </div>
          </div>

          {/* 支払方法選択 */}
          <div className="mb-6 p-4 bg-gray-50" data-error={errors.paymentMethods ? "true" : undefined}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              支払方法 <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-2">
              <label className={`flex items-center gap-2 ${agreed ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={paymentMethods.includes("Stripe決済")}
                  onChange={(e) => handlePaymentMethodChange("Stripe決済", e.target.checked)}
                  disabled={agreed}
                  className={`w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500 ${agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <span className={`text-sm text-gray-700 ${agreed ? 'opacity-50' : ''}`}>Stripe決済</span>
              </label>
              <label className={`flex items-center gap-2 ${agreed ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={paymentMethods.includes("請求書発行")}
                  onChange={(e) => handlePaymentMethodChange("請求書発行", e.target.checked)}
                  disabled={agreed}
                  className={`w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500 ${agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <span className={`text-sm text-gray-700 ${agreed ? 'opacity-50' : ''}`}>請求書発行</span>
              </label>
            </div>
            {errors.paymentMethods && (
              <p className="mt-2 text-sm text-red-600">{errors.paymentMethods}</p>
            )}

            {/* 請求書発行を選択した場合の支払日表示 */}
            {paymentMethods.includes("請求書発行") && (
              <div className="mt-4 ml-7">
                <p className="text-sm text-gray-600">
                  支払期日: <span className="font-medium text-gray-900">各月末日（30日）</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ※契約書第4条に基づき、各月末日（30日）を支払期日とします
                </p>
              </div>
            )}
          </div>

          {/* 契約情報入力 */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  契約日
                </label>
                <input
                  type="text"
                  value={contractDate}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-700"
                />
              </div>
              <div data-error={errors.companyName ? "true" : undefined}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  契約会社名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contractData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="契約会社名を入力"
                  disabled={agreed}
                  className={`w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.companyName ? "border-red-500" : "border-gray-300"
                  } ${agreed ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white'}`}
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div data-error={errors.representativeName ? "true" : undefined}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  契約担当者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contractData.representativeName}
                  onChange={(e) => handleInputChange("representativeName", e.target.value)}
                  placeholder="契約担当者名を入力"
                  disabled={agreed}
                  className={`w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.representativeName ? "border-red-500" : "border-gray-300"
                  } ${agreed ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white'}`}
                />
                {errors.representativeName && (
                  <p className="mt-1 text-sm text-red-600">{errors.representativeName}</p>
                )}
              </div>
              <div data-error={errors.email ? "true" : undefined}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  契約者メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contractData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="メールアドレスを入力"
                  disabled={agreed}
                  className={`w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } ${agreed ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white'}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
            <div data-error={errors.address ? "true" : undefined}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                契約者住所 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contractData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="住所を入力"
                disabled={agreed}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.address ? "border-red-500" : "border-gray-300"
                } ${agreed ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white'}`}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
            <div data-error={errors.phone ? "true" : undefined}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                契約者電話番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={contractData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="電話番号を入力"
                disabled={agreed}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                } ${agreed ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white'}`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* 当社情報 */}
          <div className="mb-6 p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">当社</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><span className="font-medium">当社名：</span>株式会社MOGCIA</p>
              <p><span className="font-medium">住所：</span>810-0001 福岡県福岡市中央区天神4-6-28 いちご天神ノースビル7階</p>
              <p><span className="font-medium">電話番号：</span>092-517-9804</p>
              <p><span className="font-medium">メールアドレス：</span>info@mogcia.jp</p>
            </div>
          </div>

          {/* 同意チェックボックス */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-900 mb-3">
              サービス利用契約書に同意します <span className="text-red-500">*</span>
            </p>
            
            {/* 1. 利用契約書（全文）に同意 */}
            <div className="flex items-start gap-3" data-error={errors.fullContract ? "true" : undefined}>
              <input
                type="checkbox"
                id="fullContract"
                checked={agreementItems.fullContract}
                onChange={(e) => {
                  setAgreementItems(prev => ({ ...prev, fullContract: e.target.checked }));
                  if (errors.fullContract) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.fullContract;
                      return newErrors;
                    });
                  }
                }}
                disabled={agreed}
                className={`mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 ${agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex-1">
                <label htmlFor="fullContract" className={`text-sm text-gray-700 ${agreed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  利用契約書（全文）に同意します
                </label>
                {agreementItems.fullContract && (
                  <p className="text-xs text-green-600 mt-1 ml-0">✓ 同意済み</p>
                )}
              </div>
            </div>
            {errors.fullContract && (
              <p className="ml-8 text-sm text-red-600">{errors.fullContract}</p>
            )}

            {/* 2. 未払い時の解除・残存期間分請求・違約金（10％）に同意 */}
            <div className="flex items-start gap-3" data-error={errors.unpaidTermination ? "true" : undefined}>
              <input
                type="checkbox"
                id="unpaidTermination"
                checked={agreementItems.unpaidTermination}
                onChange={(e) => {
                  setAgreementItems(prev => ({ ...prev, unpaidTermination: e.target.checked }));
                  if (errors.unpaidTermination) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.unpaidTermination;
                      return newErrors;
                    });
                  }
                }}
                disabled={agreed}
                className={`mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 ${agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex-1">
                <label htmlFor="unpaidTermination" className={`text-sm text-gray-700 ${agreed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  未払い時の解除・残存契約期間分請求・違約金（10％）に同意します
                </label>
                {agreementItems.unpaidTermination && (
                  <p className="text-xs text-green-600 mt-1 ml-0">✓ 同意済み</p>
                )}
              </div>
            </div>
            {errors.unpaidTermination && (
              <p className="ml-8 text-sm text-red-600">{errors.unpaidTermination}</p>
            )}

            {/* 3. 本サービスの解析・模倣・競合目的での利用禁止に同意 */}
            <div className="flex items-start gap-3" data-error={errors.analysisProhibition ? "true" : undefined}>
              <input
                type="checkbox"
                id="analysisProhibition"
                checked={agreementItems.analysisProhibition}
                onChange={(e) => {
                  setAgreementItems(prev => ({ ...prev, analysisProhibition: e.target.checked }));
                  if (errors.analysisProhibition) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.analysisProhibition;
                      return newErrors;
                    });
                  }
                }}
                disabled={agreed}
                className={`mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 ${agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex-1">
                <label htmlFor="analysisProhibition" className={`text-sm text-gray-700 ${agreed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  本サービスの解析・模倣・競合目的での利用禁止に同意します
                </label>
                {agreementItems.analysisProhibition && (
                  <p className="text-xs text-green-600 mt-1 ml-0">✓ 同意済み</p>
                )}
              </div>
            </div>
            {errors.analysisProhibition && (
              <p className="ml-8 text-sm text-red-600">{errors.analysisProhibition}</p>
            )}

            {/* 4. 不正利用・支払遅延時の事前通知なしの利用停止に同意 */}
            <div className="flex items-start gap-3" data-error={errors.suspension ? "true" : undefined}>
              <input
                type="checkbox"
                id="suspension"
                checked={agreementItems.suspension}
                onChange={(e) => {
                  setAgreementItems(prev => ({ ...prev, suspension: e.target.checked }));
                  if (errors.suspension) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.suspension;
                      return newErrors;
                    });
                  }
                }}
                disabled={agreed}
                className={`mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 ${agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex-1">
                <label htmlFor="suspension" className={`text-sm text-gray-700 ${agreed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  不正利用・支払遅延時の事前通知なしの利用停止に同意します
                </label>
                {agreementItems.suspension && (
                  <p className="text-xs text-green-600 mt-1 ml-0">✓ 同意済み</p>
                )}
              </div>
            </div>
            {errors.suspension && (
              <p className="ml-8 text-sm text-red-600">{errors.suspension}</p>
            )}

            {/* 5. 非公開情報の第三者共有・転用・競合利用の禁止に同意 */}
            <div className="flex items-start gap-3" data-error={errors.confidentialInfo ? "true" : undefined}>
              <input
                type="checkbox"
                id="confidentialInfo"
                checked={agreementItems.confidentialInfo}
                onChange={(e) => {
                  setAgreementItems(prev => ({ ...prev, confidentialInfo: e.target.checked }));
                  if (errors.confidentialInfo) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.confidentialInfo;
                      return newErrors;
                    });
                  }
                }}
                disabled={agreed}
                className={`mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 ${agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex-1">
                <label htmlFor="confidentialInfo" className={`text-sm text-gray-700 ${agreed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  非公開情報の第三者共有・転用・競合利用の禁止に同意します
                </label>
                {agreementItems.confidentialInfo && (
                  <p className="text-xs text-green-600 mt-1 ml-0">✓ 同意済み</p>
                )}
              </div>
            </div>
            {errors.confidentialInfo && (
              <p className="ml-8 text-sm text-red-600">{errors.confidentialInfo}</p>
            )}
          </div>
          
          {agreed && consentHistory && (
            <div className="mt-4 p-4 bg-gray-100 border-2 border-black">
              <p className="text-sm text-red-800 font-bold">
                同意済み {consentHistory.agreedAt && (() => {
                  const agreedAt = consentHistory.agreedAt;
                  if (agreedAt?.toDate) {
                    const date = agreedAt.toDate();
                    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                  } else if (typeof agreedAt === 'string') {
                    const date = new Date(agreedAt);
                    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                  }
                  return "日時不明";
                })()}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-300">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
            {!agreed ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={() => router.push("/initial-invoice")}
                className="px-6 py-2 font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700"
              >
                請求書ページへ
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}

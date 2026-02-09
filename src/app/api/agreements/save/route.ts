import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { CONTRACT_VERSION, AGREEMENT_ITEMS, PRIVACY_POLICY_VERSION, MEMBER_SITE_TERMS_VERSION, TOOL_TERMS_VERSION } from "@/lib/contractVersions";
import { createHash } from "crypto";

type AgreementType =
  | "privacyPolicy"
  | "memberSiteTerms"
  | "toolTerms"
  | "contract"
  | "initialInvoice";

interface AgreementData {
  type: AgreementType;
  agreed: boolean;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  // 契約書用の追加データ
  contractData?: {
    contractDate?: string;
    paymentMethods?: string[];
    invoicePaymentDate?: string;
    agreementItems?: {
      fullContract?: boolean;
      unpaidTermination?: boolean;
      analysisProhibition?: boolean;
      suspension?: boolean;
      confidentialInfo?: boolean;
    };
    // 契約データのドラフト保存用（companyName等）
    contractData?: {
      companyName?: string;
      representativeName?: string;
      email?: string;
      address?: string;
      phone?: string;
    };
  };
  // 請求書用の追加データ
  invoiceData?: {
    invoiceDate?: string;
    confirmedDueDate?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AgreementData = await request.json();
    const { type, agreed, userId, contractData, invoiceData } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: "userId and type are required" },
        { status: 400 }
      );
    }

    // 認証トークンを取得（クライアントから送信される場合）
    const authHeader = request.headers.get("authorization");
    let verifiedUserId = userId;

    // IPアドレスとUser-Agentを取得
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // ユーザードキュメントを取得
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingData = userDoc.data();
    const now = new Date();
    const dateString = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`;
    const timestamp = FieldValue.serverTimestamp();

    // 既に保存済みの場合、上書きを防ぐ（サーバー側での保護）
    // サブコレクションが存在する場合のみ保存を拒否（新しい構造で保存されている場合）
    switch (type) {
      case "privacyPolicy":
        // プライバシーポリシーは再同意を許可（同意履歴を完全に記録するため）
        // サブコレクションが存在しても、新しいログを追加できるようにする
        break;

      case "memberSiteTerms":
        // 会員サイト利用規約は再同意を許可（同意履歴を完全に記録するため）
        // サブコレクションが存在しても、新しいログを追加できるようにする
        break;

      case "toolTerms":
        // Signal.ツール利用規約は再同意を許可（同意履歴を完全に記録するため）
        // サブコレクションが存在しても、新しいログを追加できるようにする
        break;

      case "contract":
        // 既に同意済みの場合、再度の同意（agreed: true）は拒否
        // ただし、ドラフト保存（agreed: false）は許可
        if (agreed) {
          try {
            const contractConsentRef = adminDb.collection("users").doc(userId).collection("contractConsents");
            const contractConsentSnapshot = await contractConsentRef.orderBy("agreedAt", "desc").limit(1).get();
            if (!contractConsentSnapshot.empty) {
              // サブコレクションが存在し、かつagreementItemsがすべてtrueの場合、再度の同意を拒否
              const latestConsent = contractConsentSnapshot.docs[0].data();
              if (latestConsent.items) {
                const allItemsAgreed = Object.values(latestConsent.items).every((item: any) => item?.agreed === true);
                if (allItemsAgreed) {
                  return NextResponse.json(
                    { error: "契約書への同意は既に保存済みです。変更できません。" },
                    { status: 400 }
                  );
                }
              }
            }
          } catch (error) {
            // エラー時は続行（サブコレクションが存在しない可能性がある）
            console.error("Failed to check contract consent:", error);
          }
        }
        // agreed: false の場合はドラフト保存として許可
        break;

      case "initialInvoice":
        if (existingData?.datesSaved === true) {
          return NextResponse.json(
            { error: "請求書の日付は既に保存済みです。変更できません。" },
            { status: 400 }
          );
        }
        break;
    }

    // 同意履歴を記録（監査証跡）
    const agreementHistory = {
      type,
      agreed,
      date: dateString,
      timestamp: now.toISOString(),
      ipAddress,
      userAgent,
      userId,
    };

    // タイプに応じてFirestoreに保存
    let updateData: any = {
      updatedAt: timestamp,
    };

    switch (type) {
      case "privacyPolicy":
        // サブコレクションに同意ログを保存
        if (agreed) {
          const userEmail = userDoc.data()?.email || userId;
          const policyTextHash = createHash("sha256")
            .update(`${PRIVACY_POLICY_VERSION}-${dateString}`)
            .digest("hex");
          
          const consentRef = adminDb.collection("users").doc(userId).collection("privacyPolicyConsents");
          const privacyConsentDocRef = await consentRef.add({
            version: PRIVACY_POLICY_VERSION,
            agreed: true,
            agreedAt: timestamp,
            agreedBy: {
              uid: userId,
              email: userEmail,
              role: "owner",
            },
            environment: {
              ip: ipAddress,
              userAgent: userAgent,
              device: userAgent.includes("Mac") ? "Mac" : userAgent.includes("Windows") ? "Windows" : "Unknown",
            },
            checksum: `sha256:${policyTextHash}`,
          });
          console.log(`[Privacy Policy Consent] Saved to privacyPolicyConsents/${privacyConsentDocRef.id} for user ${userId}`);
        }
        
        updateData.privacyPolicyAgreed = agreed;
        updateData.privacyPolicyAgreedDate = agreed ? dateString : null;
        updateData.privacyPolicyAgreedAt = agreed ? timestamp : null;
        updateData.privacyPolicyAgreedIp = agreed ? ipAddress : null;
        updateData.privacyPolicyAgreedUserAgent = agreed ? userAgent : null;
        break;

      case "memberSiteTerms":
        // サブコレクションに同意ログを保存
        if (agreed) {
          const userEmail = userDoc.data()?.email || userId;
          const termsTextHash = createHash("sha256")
            .update(`${MEMBER_SITE_TERMS_VERSION}-${dateString}`)
            .digest("hex");
          
          const consentRef = adminDb.collection("users").doc(userId).collection("memberSiteTermsConsents");
          const memberSiteTermsConsentDocRef = await consentRef.add({
            version: MEMBER_SITE_TERMS_VERSION,
            agreed: true,
            agreedAt: timestamp,
            agreedBy: {
              uid: userId,
              email: userEmail,
              role: "owner",
            },
            environment: {
              ip: ipAddress,
              userAgent: userAgent,
              device: userAgent.includes("Mac") ? "Mac" : userAgent.includes("Windows") ? "Windows" : "Unknown",
            },
            checksum: `sha256:${termsTextHash}`,
          });
          console.log(`[Member Site Terms Consent] Saved to memberSiteTermsConsents/${memberSiteTermsConsentDocRef.id} for user ${userId}`);
        }
        
        updateData.memberSiteTermsAgreed = agreed;
        updateData.memberSiteTermsAgreedDate = agreed ? dateString : null;
        updateData.memberSiteTermsAgreedAt = agreed ? timestamp : null;
        updateData.memberSiteTermsAgreedIp = agreed ? ipAddress : null;
        updateData.memberSiteTermsAgreedUserAgent = agreed ? userAgent : null;
        break;

      case "toolTerms":
        // サブコレクションに同意ログを保存
        if (agreed) {
          const userEmail = userDoc.data()?.email || userId;
          const toolTermsTextHash = createHash("sha256")
            .update(`${TOOL_TERMS_VERSION}-${dateString}`)
            .digest("hex");
          
          const consentRef = adminDb.collection("users").doc(userId).collection("toolTermsConsents");
          const toolTermsConsentDocRef = await consentRef.add({
            version: TOOL_TERMS_VERSION,
            agreed: true,
            agreedAt: timestamp,
            agreedBy: {
              uid: userId,
              email: userEmail,
              role: "owner",
            },
            environment: {
              ip: ipAddress,
              userAgent: userAgent,
              device: userAgent.includes("Mac") ? "Mac" : userAgent.includes("Windows") ? "Windows" : "Unknown",
            },
            checksum: `sha256:${toolTermsTextHash}`,
          });
          console.log(`[Tool Terms Consent] Saved to toolTermsConsents/${toolTermsConsentDocRef.id} for user ${userId}`);
        }
        
        updateData.toolTermsAgreed = agreed;
        updateData.toolTermsAgreedDate = agreed ? dateString : null;
        updateData.toolTermsAgreedAt = agreed ? timestamp : null;
        updateData.toolTermsAgreedIp = agreed ? ipAddress : null;
        updateData.toolTermsAgreedUserAgent = agreed ? userAgent : null;
        break;

      case "contract":
        // contractDataはネストされたオブジェクトなので、既存データを取得してマージ
        const existingContractData = existingData?.contractData || {};
        
        // ユーザー情報を取得
        const userEmail = existingData?.email || userDoc.id;
        
        // 契約書本文のハッシュを計算（簡易版：契約バージョンと日付の組み合わせ）
        // 将来的には契約書全文のハッシュを計算する
        const contractTextHash = createHash("sha256")
          .update(`${CONTRACT_VERSION}-${dateString}`)
          .digest("hex");
        
        // サブコレクションに同意ログを保存（法的証拠として）
        // agreedがtrueで、agreementItemsが存在する場合（すべてtrueでなくても、少なくとも1つがtrueなら保存）
        const hasAnyAgreement = contractData?.agreementItems && 
          Object.values(contractData.agreementItems).some((val: any) => val === true);
        
        if (agreed && contractData?.agreementItems) {
          const consentRef = adminDb.collection("users").doc(userId).collection("contractConsents");
          const consentData: any = {
            contractVersion: CONTRACT_VERSION,
            agreedAt: timestamp,
            agreedBy: {
              uid: userId,
              email: userEmail,
              role: "owner", // 将来的にはロール管理を追加
            },
            environment: {
              ip: ipAddress,
              userAgent: userAgent,
              device: userAgent.includes("Mac") ? "Mac" : userAgent.includes("Windows") ? "Windows" : "Unknown",
            },
            items: {},
            checksum: `sha256:${contractTextHash}`,
          };
          
          // 各同意項目ごとにagreedAtを記録
          const itemTimestamp = timestamp;
          const agreementItems = contractData.agreementItems;
          if (agreementItems.fullContract) {
            consentData.items.fullContract = {
              label: AGREEMENT_ITEMS.fullContract.label,
              agreed: true,
              agreedAt: itemTimestamp,
            };
          }
          if (agreementItems.unpaidTermination) {
            consentData.items.unpaidTermination = {
              label: AGREEMENT_ITEMS.unpaidTermination.label,
              agreed: true,
              agreedAt: itemTimestamp,
            };
          }
          if (agreementItems.analysisProhibition) {
            consentData.items.analysisProhibition = {
              label: AGREEMENT_ITEMS.analysisProhibition.label,
              agreed: true,
              agreedAt: itemTimestamp,
            };
          }
          if (agreementItems.suspension) {
            consentData.items.suspension = {
              label: AGREEMENT_ITEMS.suspension.label,
              agreed: true,
              agreedAt: itemTimestamp,
            };
          }
          if (agreementItems.confidentialInfo) {
            consentData.items.confidentialInfo = {
              label: AGREEMENT_ITEMS.confidentialInfo.label,
              agreed: true,
              agreedAt: itemTimestamp,
            };
          }
          
          const consentDocRef = await consentRef.add(consentData);
          console.log(`[Contract Consent] Saved to contractConsents/${consentDocRef.id} for user ${userId}`);
        }
        
        // 既存のcontractDataも更新（後方互換性のため）
        // ドラフト保存（agreed: false）の場合も契約データを保存可能
        updateData.contractData = {
          ...existingContractData,
          // 契約データのドラフト（companyName等）を保存（agreedの状態に関わらず）
          contractData: contractData?.contractData || existingContractData.contractData,
          // その他の契約データも保存
          paymentMethods: contractData?.paymentMethods || existingContractData.paymentMethods,
          invoicePaymentDate: contractData?.invoicePaymentDate || existingContractData.invoicePaymentDate,
          contractDate: contractData?.contractDate || existingContractData.contractDate,
          // agreedがtrueの場合のみ同意関連のデータを更新
          agreed: agreed ? true : (existingContractData.agreed || false),
          agreedDate: agreed ? dateString : existingContractData.agreedDate,
          agreedAt: agreed ? timestamp : existingContractData.agreedAt,
          agreedIp: agreed ? ipAddress : existingContractData.agreedIp,
          agreedUserAgent: agreed ? userAgent : existingContractData.agreedUserAgent,
          contractVersion: agreed ? CONTRACT_VERSION : (existingContractData.contractVersion || CONTRACT_VERSION),
          // agreementItemsもトップレベルに保存（確認しやすくするため）
          agreementItems: contractData?.agreementItems || existingContractData.agreementItems,
        };
        break;

      case "initialInvoice":
        // 請求書の日付データを保存
        const existingInvoiceData = userDoc.data();
        const existingContractDataForInvoice = existingInvoiceData?.contractData || {};
        
        updateData.datesSaved = agreed;
        updateData.initialInvoiceAgreedDate = agreed ? dateString : null;
        updateData.initialInvoiceAgreedAt = agreed ? timestamp : null;
        updateData.initialInvoiceAgreedIp = agreed ? ipAddress : null;
        updateData.initialInvoiceAgreedUserAgent = agreed ? userAgent : null;
        
        // 請求日と入金期日を保存（トップレベルとcontractDataの両方に保存）
        if (invoiceData) {
          if (invoiceData.invoiceDate) {
            updateData.invoiceDate = invoiceData.invoiceDate;
          }
          if (invoiceData.confirmedDueDate) {
            // トップレベルにも保存
            updateData.confirmedDueDate = invoiceData.confirmedDueDate;
            // contractDataにも保存
            updateData.contractData = {
              ...existingContractDataForInvoice,
              confirmedDueDate: invoiceData.confirmedDueDate,
              invoiceDate: invoiceData.invoiceDate || existingContractDataForInvoice.invoiceDate,
              datesSaved: agreed, // contractData内にも保存済みフラグを設定
            };
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid agreement type" },
          { status: 400 }
        );
    }

    // Firestoreに保存
    await userRef.update(updateData);
    console.log(`[Agreement Save] Successfully saved ${type} agreement for user ${userId}`);

    // 同意履歴を別コレクションに保存（監査証跡）
    try {
      const historyRef = adminDb.collection("agreementHistory");
      await historyRef.add(agreementHistory);
    } catch (historyError) {
      console.error("Failed to save agreement history:", historyError);
      // 履歴の保存失敗はエラーにしない（メインの保存は成功しているため）
    }

    return NextResponse.json({
      success: true,
      message: "Agreement status saved successfully",
      data: {
        type,
        agreed,
        date: dateString,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error saving agreement:", error);
    
    // より詳細なエラーメッセージを返す
    let errorMessage = "同意状態の保存に失敗しました";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Firebaseエラーの場合、より詳細な情報を追加
      if (error.message.includes("Missing or insufficient permissions")) {
        errorMessage = "Firestore権限エラー: Admin SDKが正しく初期化されていない可能性があります。環境変数 FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY を確認してください。";
      }
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


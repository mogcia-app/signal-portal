import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc, Timestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingData = userDoc.data();
    const now = new Date();
    const dateString = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`;
    const timestamp = serverTimestamp();

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
        // サブコレクションが存在する場合のみ、保存を拒否
        try {
          const contractConsentRef = collection(db, "users", userId, "contractConsents");
          const contractConsentQuery = query(contractConsentRef, orderBy("agreedAt", "desc"), limit(1));
          const contractConsentSnapshot = await getDocs(contractConsentQuery);
          if (!contractConsentSnapshot.empty) {
            // サブコレクションが存在し、かつagreementItemsがすべてtrueの場合、保存を拒否
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
        break;

      case "initialInvoice":
        if (existingData.datesSaved === true) {
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
          const userEmail = userDoc.data().email || userId;
          const policyTextHash = createHash("sha256")
            .update(`${PRIVACY_POLICY_VERSION}-${dateString}`)
            .digest("hex");
          
          const consentRef = collection(db, "users", userId, "privacyPolicyConsents");
          const privacyConsentDocRef = await addDoc(consentRef, {
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
          const userEmail = userDoc.data().email || userId;
          const termsTextHash = createHash("sha256")
            .update(`${MEMBER_SITE_TERMS_VERSION}-${dateString}`)
            .digest("hex");
          
          const consentRef = collection(db, "users", userId, "memberSiteTermsConsents");
          const memberSiteTermsConsentDocRef = await addDoc(consentRef, {
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
          const userEmail = userDoc.data().email || userId;
          const toolTermsTextHash = createHash("sha256")
            .update(`${TOOL_TERMS_VERSION}-${dateString}`)
            .digest("hex");
          
          const consentRef = collection(db, "users", userId, "toolTermsConsents");
          const toolTermsConsentDocRef = await addDoc(consentRef, {
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
        const existingData = userDoc.data();
        const existingContractData = existingData.contractData || {};
        
        // ユーザー情報を取得
        const userEmail = existingData.email || userDoc.id;
        
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
          const consentRef = collection(db, "users", userId, "contractConsents");
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
          
          const consentDocRef = await addDoc(consentRef, consentData);
          console.log(`[Contract Consent] Saved to contractConsents/${consentDocRef.id} for user ${userId}`);
        }
        
        // 既存のcontractDataも更新（後方互換性のため）
        updateData.contractData = {
          ...existingContractData,
          ...(contractData || {}), // リクエストから送られてきた契約データをマージ
          agreed: agreed,
          agreedDate: agreed ? dateString : null,
          agreedAt: agreed ? timestamp : null,
          agreedIp: agreed ? ipAddress : null,
          agreedUserAgent: agreed ? userAgent : null,
          contractVersion: CONTRACT_VERSION, // バージョン情報を追加
          // agreementItemsもトップレベルに保存（確認しやすくするため）
          agreementItems: contractData?.agreementItems || existingContractData.agreementItems,
        };
        break;

      case "initialInvoice":
        // 請求書の日付データを保存
        const existingInvoiceData = userDoc.data();
        const existingContractDataForInvoice = existingInvoiceData.contractData || {};
        
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
    await updateDoc(userRef, updateData);
    console.log(`[Agreement Save] Successfully saved ${type} agreement for user ${userId}`);

    // 同意履歴を別コレクションに保存（監査証跡）
    try {
      const historyRef = collection(db, "agreementHistory");
      await addDoc(historyRef, agreementHistory);
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "同意状態の保存に失敗しました",
      },
      { status: 500 }
    );
  }
}


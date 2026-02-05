import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AgreementStatus {
  privacyPolicy: boolean;
  termsAgreement: boolean;
  toolTermsAgreement: boolean;
}

/**
 * すべての同意状態をチェックする
 */
export async function checkAllAgreements(userId: string): Promise<AgreementStatus> {
  const status: AgreementStatus = {
    privacyPolicy: false,
    termsAgreement: false,
    toolTermsAgreement: false,
  };

  try {
    // プライバシーポリシーの同意状態をチェック
    try {
      const privacyConsentRef = collection(db, "users", userId, "privacyPolicyConsents");
      const privacyQuery = query(privacyConsentRef, orderBy("agreedAt", "desc"), limit(1));
      const privacySnapshot = await getDocs(privacyQuery);
      if (!privacySnapshot.empty) {
        status.privacyPolicy = true;
      } else {
        // 古いデータを確認
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.privacyPolicyAgreed === true && data.privacyPolicyAgreedDate) {
            status.privacyPolicy = true;
          }
        }
      }
    } catch (error) {
      console.error("Failed to check privacy policy agreement:", error);
    }

    // 利用規約の同意状態をチェック
    try {
      const termsConsentRef = collection(db, "users", userId, "memberSiteTermsConsents");
      const termsQuery = query(termsConsentRef, orderBy("agreedAt", "desc"), limit(1));
      const termsSnapshot = await getDocs(termsQuery);
      if (!termsSnapshot.empty) {
        status.termsAgreement = true;
      } else {
        // 古いデータを確認
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.memberSiteTermsAgreed === true && data.memberSiteTermsAgreedDate) {
            status.termsAgreement = true;
          }
        }
      }
    } catch (error) {
      console.error("Failed to check terms agreement:", error);
    }

    // ツール利用規約の同意状態をチェック
    try {
      const toolTermsConsentRef = collection(db, "users", userId, "toolTermsConsents");
      const toolTermsQuery = query(toolTermsConsentRef, orderBy("agreedAt", "desc"), limit(1));
      const toolTermsSnapshot = await getDocs(toolTermsQuery);
      if (!toolTermsSnapshot.empty) {
        status.toolTermsAgreement = true;
      } else {
        // 古いデータを確認
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.toolTermsAgreed === true && data.toolTermsAgreedDate) {
            status.toolTermsAgreement = true;
          }
        }
      }
    } catch (error) {
      console.error("Failed to check tool terms agreement:", error);
    }
  } catch (error) {
    console.error("Failed to check agreements:", error);
  }

  return status;
}

/**
 * 次の同意が必要なページを取得する
 * すべて同意済みの場合は null を返す
 */
export function getNextAgreementPage(status: AgreementStatus): string | null {
  if (!status.privacyPolicy) {
    return "/privacy-policy";
  }
  if (!status.termsAgreement) {
    return "/terms-agreement";
  }
  if (!status.toolTermsAgreement) {
    return "/tool-terms-agreement";
  }
  return null; // すべて同意済み
}





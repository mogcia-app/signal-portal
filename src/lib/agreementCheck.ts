export interface AgreementStatus {
  privacyPolicy: boolean;
  termsAgreement: boolean;
  toolTermsAgreement: boolean;
}

/**
 * すべての同意状態をチェックする
 */
export async function checkAllAgreements(userId: string): Promise<AgreementStatus> {
  try {
    const response = await fetch(`/api/agreements/status?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agreement status: ${response.status}`);
    }
    const result = await response.json();
    return {
      privacyPolicy: result?.data?.privacyPolicy?.agreed === true,
      termsAgreement: result?.data?.termsAgreement?.agreed === true,
      toolTermsAgreement: result?.data?.toolTermsAgreement?.agreed === true,
    };
  } catch {
    return {
      privacyPolicy: false,
      termsAgreement: false,
      toolTermsAgreement: false,
    };
  }
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





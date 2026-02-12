import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = userDoc.data() || {};

    const [privacySnapshot, termsSnapshot, toolSnapshot] = await Promise.all([
      adminDb.collection("users").doc(userId).collection("privacyPolicyConsents").orderBy("agreedAt", "desc").limit(1).get(),
      adminDb.collection("users").doc(userId).collection("memberSiteTermsConsents").orderBy("agreedAt", "desc").limit(1).get(),
      adminDb.collection("users").doc(userId).collection("toolTermsConsents").orderBy("agreedAt", "desc").limit(1).get(),
    ]);

    const privacyConsent = privacySnapshot.empty ? null : privacySnapshot.docs[0].data();
    const termsConsent = termsSnapshot.empty ? null : termsSnapshot.docs[0].data();
    const toolConsent = toolSnapshot.empty ? null : toolSnapshot.docs[0].data();

    return NextResponse.json({
      success: true,
      data: {
        privacyPolicy: {
          agreed: !!privacyConsent || (data.privacyPolicyAgreed === true && !!data.privacyPolicyAgreedDate),
          agreedAt: privacyConsent?.agreedAt ?? data.privacyPolicyAgreedAt ?? null,
          agreedDate: data.privacyPolicyAgreedDate ?? "",
        },
        termsAgreement: {
          agreed: !!termsConsent || (data.memberSiteTermsAgreed === true && !!data.memberSiteTermsAgreedDate),
          agreedAt: termsConsent?.agreedAt ?? data.memberSiteTermsAgreedAt ?? null,
          agreedDate: data.memberSiteTermsAgreedDate ?? "",
        },
        toolTermsAgreement: {
          agreed: !!toolConsent || (data.toolTermsAgreed === true && !!data.toolTermsAgreedDate),
          agreedAt: toolConsent?.agreedAt ?? data.toolTermsAgreedAt ?? null,
          agreedDate: data.toolTermsAgreedDate ?? "",
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch agreement status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch agreement status" },
      { status: 500 }
    );
  }
}

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
    const savedContractData = data.contractData || {};

    const consentSnapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("contractConsents")
      .orderBy("agreedAt", "desc")
      .limit(1)
      .get();

    const latestConsent = consentSnapshot.empty ? null : consentSnapshot.docs[0].data();

    return NextResponse.json({
      success: true,
      data: {
        contractData: savedContractData,
        latestConsent,
      },
    });
  } catch (error) {
    console.error("Failed to fetch contract data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch contract data" },
      { status: 500 }
    );
  }
}

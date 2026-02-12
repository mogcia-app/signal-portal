import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe secret key is not configured" },
        { status: 500 }
      );
    }

    // ユーザー情報を取得
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data() || {};

    // Stripe Customerを作成（まだ存在しない場合）
    let customerId: string;

    if (userData?.billingInfo?.stripeCustomerId) {
      customerId = userData.billingInfo.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: userData.email || undefined,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;

      // FirestoreにCustomer IDを保存
      await userRef.update({
        "billingInfo.stripeCustomerId": customerId,
        updatedAt: new Date().toISOString(),
      });
    }

    // SetupIntentを作成
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating setup intent:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "SetupIntentの作成に失敗しました",
      },
      { status: 500 }
    );
  }
}

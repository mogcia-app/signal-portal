import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const plans: { [key: string]: { name: string; price: number } } = {
  light: { name: "ベーシック", price: 15000 },
  standard: { name: "スタンダード", price: 30000 },
  professional: { name: "プロ", price: 60000 },
};

const TAX_RATE = 0.1;

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（必要に応じて実装）
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 契約日から日にちを抽出する関数
    const extractDayFromContractDate = (contractDate: string): number | null => {
      if (!contractDate) return null;
      const match1 = contractDate.match(/(\d+)年\d+月(\d+)日/);
      if (match1) return parseInt(match1[2], 10);
      const match2 = contractDate.match(/^\d{4}-\d{2}-(\d{2})/);
      if (match2) return parseInt(match2[1], 10);
      const match3 = contractDate.match(/^\d{4}\/\d{2}\/(\d{2})/);
      if (match3) return parseInt(match3[1], 10);
      return null;
    };

    // 請求書支払いユーザーを取得
    const usersQuery = query(
      collection(db, "users"),
      where("contractData.paymentMethods", "array-contains", "請求書発行")
    );
    const usersSnapshot = await getDocs(usersQuery);

    const results = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // 契約日の日にちを取得
      const userContractDateStr = userData.contractData?.contractDate || "";
      const userContractDay = extractDayFromContractDate(userContractDateStr);
      
      if (!userContractDay) {
        results.push({ userId, status: 'skipped', reason: 'No contract day found' });
        continue;
      }

      // 今月の請求日を計算（契約日の日にち、ただし月末を超えないように）
      const year = now.getFullYear();
      const month = now.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const invoiceDay = Math.min(userContractDay, lastDayOfMonth); // 月末超え防止
      const invoiceDateThisMonth = new Date(year, month, invoiceDay);
      
      // 契約日を過ぎていて、まだ今月分が無いなら作る（Cron失敗や手動再実行にも対応）
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (today < invoiceDateThisMonth) {
        results.push({ userId, status: 'skipped', reason: 'Contract day not reached yet' });
        continue;
      }

      // プランIDの取得
      let planId = null;
      const monthlyFee = userData.billingInfo?.monthlyFee;

      if (monthlyFee) {
        if (monthlyFee === 15000) planId = 'light';
        else if (monthlyFee === 30000) planId = 'standard';
        else if (monthlyFee === 60000) planId = 'professional';
      }

      if (!planId && userData.billingInfo?.plan) {
        const billingPlan = userData.billingInfo.plan;
        if (billingPlan === 'light' || billingPlan === 'standard' || billingPlan === 'professional') {
          planId = billingPlan;
        }
      }

      if (!planId) {
        planId = userData.selectedPlanId || 'light';
      }

      const planPrice = plans[planId]?.price || 0;
      if (planPrice === 0) {
        results.push({ userId, status: 'skipped', reason: 'No plan found' });
        continue;
      }

      // 今月の請求書が既に存在するかチェック（billingMonthで重複防止）
      const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const invoicesQuery = query(
        collection(db, "invoices"),
        where("userId", "==", userId),
        where("billingMonth", "==", billingMonth)
      );
      const existingInvoices = await getDocs(invoicesQuery);

      if (!existingInvoices.empty) {
        results.push({ userId, status: 'skipped', reason: 'Invoice already exists' });
        continue;
      }

      // 請求書番号を生成（deterministic: 再生成しても番号がブレない）
      // 形式: INV-YYYYMM-{userIdの最初6文字}
      // 将来的には sequence ベースに変更可能: INV-{billingMonth}-{sequence}
      const userIdPrefix = userId.slice(0, 6).toUpperCase();
      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${userIdPrefix}`;

      const subtotal = planPrice;
      const tax = Math.floor(subtotal * TAX_RATE);
      const total = subtotal + tax;
      
      // 請求日を設定（既に計算済みのinvoiceDateThisMonthを使用、月末超え防止済み）
      const invoiceDate = invoiceDateThisMonth.toISOString().split('T')[0];
      
      // 契約書ページで設定した支払日から支払期限を計算（デフォルト: 各月末日）
      const invoicePaymentDate = userData.contractData?.invoicePaymentDate || "毎月30日支払";
      let dueDate = "";
      
      // 請求日の月の末日を支払期限とする（契約書第4条に基づき各月末日を支払期日とする）
      const invoiceDateObj = new Date(invoiceDate);
      const dueYear = invoiceDateObj.getFullYear();
      const dueMonth = invoiceDateObj.getMonth();
      // 次の月の0日目 = 今月の末日
      const lastDay = new Date(dueYear, dueMonth + 1, 0);
      dueDate = lastDay.toISOString().split('T')[0];

      // 請求書を作成
      const invoiceRef = collection(db, "invoices");
      await addDoc(invoiceRef, {
        userId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        planId,
        monthlyFee: planPrice,
        subtotal,
        tax,
        total,
        status: 'pending',
        billingMonth, // 重複防止用
        createdAt: serverTimestamp(),
      });

      // 通知を作成
      await addDoc(collection(db, "notifications"), {
        title: "請求書が発行されました",
        content: `請求書番号: ${invoiceNumber}\n請求金額: ¥${total.toLocaleString()}\n支払期限: ${dueDate}\n\n請求書ページから詳細を確認できます。`,
        type: "info",
        priority: "high",
        status: "published",
        targetAudience: "all",
        isSticky: true,
        tags: ["請求書"],
        createdBy: "system",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
        readCount: 0,
        clickCount: 0,
      });

      results.push({ userId, status: 'created', invoiceNumber });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} users`,
      results,
    });
  } catch (error) {
    console.error("Error generating monthly invoices:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "請求書の自動生成に失敗しました",
      },
      { status: 500 }
    );
  }
}


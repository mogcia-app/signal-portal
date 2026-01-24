import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const plans: { [key: string]: { name: string; price: number } } = {
  light: { name: "ライト", price: 15000 },
  standard: { name: "スタンダード", price: 30000 },
  professional: { name: "プロ", price: 60000 },
};

const TAX_RATE = 0.1;

export async function POST(request: NextRequest) {
  try {
    // TODO: Admin claim チェックを追加（実装時は Firebase Admin SDK を使用）
    // const authHeader = request.headers.get("authorization");
    // if (!authHeader) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const token = authHeader.replace("Bearer ", "");
    // const decodedToken = await getAuth().verifyIdToken(token);
    // if (!decodedToken.admin) {
    //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    // }

    const body = await request.json();
    const { userId, planId = "light" } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const planPrice = plans[planId]?.price || 15000;
    const subtotal = planPrice;
    const tax = Math.floor(subtotal * TAX_RATE);
    const total = subtotal + tax;

    const now = new Date();
    
    // 請求書番号を生成（deterministic: 再生成しても番号がブレない）
    // 形式: INV-YYYYMM-{userIdの最初6文字}
    const userIdPrefix = userId.slice(0, 6).toUpperCase();
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${userIdPrefix}`;
    
      // 請求日と支払期限を設定
      let invoiceDate = now.toISOString().split('T')[0];
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const contractDateStr = userData.contractData?.contractDate || "";
        
        // 契約日から日にちを抽出
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
        
        const contractDay = extractDayFromContractDate(contractDateStr);
        if (contractDay) {
          // 請求日を設定（月末超え防止）
          const year = now.getFullYear();
          const month = now.getMonth();
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          const invoiceDay = Math.min(contractDay, lastDayOfMonth); // 月末超え防止
          invoiceDate = new Date(year, month, invoiceDay).toISOString().split('T')[0];
        }
        
        // 契約書ページで設定した支払日から支払期限を計算（デフォルト: 各月末日）
        const invoicePaymentDate = userData.contractData?.invoicePaymentDate || "毎月30日支払";
        let dueDate = "";
        
        // 請求日の月の末日を支払期限とする（契約書第4条に基づき各月末日を支払期日とする）
        const invoiceDateObj = new Date(invoiceDate);
        const year = invoiceDateObj.getFullYear();
        const month = invoiceDateObj.getMonth();
        // 次の月の0日目 = 今月の末日
        const lastDay = new Date(year, month + 1, 0);
        dueDate = lastDay.toISOString().split('T')[0];
        
        // 以下は使用しないが、互換性のため残す
        if (false) {
          // デフォルト: 請求日から30日後
          dueDate = new Date(new Date(invoiceDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
        
        // billingMonthを生成（重複防止用）
        const billingMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        // 既に存在するかチェック
        const existingInvoicesQuery = query(
          collection(db, "invoices"),
          where("userId", "==", userId),
          where("billingMonth", "==", billingMonth)
        );
        const existingInvoices = await getDocs(existingInvoicesQuery);
        
        if (!existingInvoices.empty) {
          return NextResponse.json(
            { error: "この月の請求書は既に存在します" },
            { status: 400 }
          );
        }
        
        // Firestoreに請求書を保存
        const invoiceRef = collection(db, "invoices");
        const newInvoice = {
          userId,
          invoiceNumber,
          invoiceDate,
          dueDate,
          planId,
          monthlyFee: planPrice,
          subtotal,
          tax,
          total,
          status: 'pending' as const,
          billingMonth, // 重複防止用
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(invoiceRef, newInvoice);
        
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

        return NextResponse.json({
          success: true,
          message: "デモ請求書を作成しました",
          invoice: {
            id: docRef.id,
            ...newInvoice,
            invoiceDate,
            dueDate,
          },
        });
      }
      
      // ユーザーが存在しない場合のデフォルト処理
      const defaultInvoiceDateObj = new Date(invoiceDate);
      const defaultBillingMonth = `${defaultInvoiceDateObj.getFullYear()}-${String(defaultInvoiceDateObj.getMonth() + 1).padStart(2, '0')}`;
      const defaultDueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 既に存在するかチェック
      const defaultExistingInvoicesQuery = query(
        collection(db, "invoices"),
        where("userId", "==", userId),
        where("billingMonth", "==", defaultBillingMonth)
      );
      const defaultExistingInvoices = await getDocs(defaultExistingInvoicesQuery);
      
      if (!defaultExistingInvoices.empty) {
        return NextResponse.json(
          { error: "この月の請求書は既に存在します" },
          { status: 400 }
        );
      }
    
      // Firestoreに請求書を保存
      const invoiceRef = collection(db, "invoices");
      const newInvoice = {
        userId,
        invoiceNumber,
        invoiceDate,
        dueDate: defaultDueDate,
        planId,
        monthlyFee: planPrice,
        subtotal,
        tax,
        total,
        status: 'pending' as const,
        billingMonth: defaultBillingMonth, // 重複防止用
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(invoiceRef, newInvoice);
      
      // 通知を作成
      await addDoc(collection(db, "notifications"), {
        title: "請求書が発行されました",
        content: `請求書番号: ${invoiceNumber}\n請求金額: ¥${total.toLocaleString()}\n支払期限: ${defaultDueDate}\n\n請求書ページから詳細を確認できます。`,
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

      return NextResponse.json({
        success: true,
        message: "デモ請求書を作成しました",
        invoice: {
          id: docRef.id,
          ...newInvoice,
          invoiceDate,
          dueDate: defaultDueDate,
        },
      });
  } catch (error) {
    console.error("Error creating demo invoice:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "デモ請求書の作成に失敗しました",
      },
      { status: 500 }
    );
  }
}


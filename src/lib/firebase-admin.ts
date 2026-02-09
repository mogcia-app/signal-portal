import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

// Initialize Firebase Admin SDK (singleton pattern)
let adminApp: App;

if (!getApps().length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  // 方法1: GOOGLE_APPLICATION_CREDENTIALS 環境変数でファイルパスを指定（標準的な方法）
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // 方法2: FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY 環境変数にJSON文字列を設定
  const serviceAccountKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;
  
  if (credentialsPath) {
    // ファイルパスが指定されている場合
    try {
      const serviceAccount = JSON.parse(readFileSync(credentialsPath, "utf8"));
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId || serviceAccount.project_id,
      });
    } catch (error) {
      console.error("Failed to load service account from GOOGLE_APPLICATION_CREDENTIALS:", error);
      throw new Error("Invalid service account file");
    }
  } else if (serviceAccountKey) {
    // JSON文字列が環境変数に設定されている場合
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId || serviceAccount.project_id,
      });
      console.log("[Firebase Admin] Initialized with FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY");
    } catch (error) {
      console.error("Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY:", error);
      throw new Error("Invalid FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY format");
    }
  } else {
    // Application Default Credentials (ADC) を使用
    // 本番環境（Vercel等）では自動的に認証情報が設定される
    console.warn("[Firebase Admin] No credentials found. Using Application Default Credentials (ADC). This may fail in local development.");
    adminApp = initializeApp({
      projectId: projectId,
    });
  }
} else {
  adminApp = getApps()[0];
}

// Initialize Firestore Admin
export const adminDb: Firestore = getFirestore(adminApp);

export default adminApp;


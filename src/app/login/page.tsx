"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, signup, loading, sendPasswordReset } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ログイン済みでも/loginページにはアクセス可能（リダイレクトしない）

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // エラーをクリア
    setSuccessMessage(""); // 成功メッセージをクリア
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsResetting(true);

    try {
      if (!resetEmail) {
        setError("メールアドレスを入力してください");
        setIsResetting(false);
        return;
      }
      await sendPasswordReset(resetEmail);
      setSuccessMessage("パスワードリセット用のメールを送信しました。メールボックスを確認してください。");
      setResetEmail("");
      // 3秒後にモーダルを閉じる
      setTimeout(() => {
        setShowPasswordReset(false);
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      console.error("パスワードリセットエラー:", err);
      if (err.code === "auth/user-not-found") {
        setError("このメールアドレスは登録されていません");
      } else if (err.code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません");
      } else {
        setError(err.message || "パスワードリセットメールの送信に失敗しました");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        // 新規登録
        if (!formData.email || !formData.password) {
          setError("メールアドレスとパスワードを入力してください");
          setIsLoading(false);
          return;
        }
        await signup(formData.email, formData.password, {
          userType: "toC",
        });
        // 新規登録成功後、契約書ページへ
        router.push("/contract");
      } else {
        // ログイン
        if (!formData.email || !formData.password) {
          setError("メールアドレスとパスワードを入力してください");
          setIsLoading(false);
          return;
        }
        await login(formData.email, formData.password);
        // ログイン成功後、契約書ページへ
        router.push("/contract");
      }
    } catch (err: any) {
      console.error("認証エラー:", err);
      if (err.code === "auth/user-not-found") {
        setError("ユーザーが見つかりません");
      } else if (err.code === "auth/wrong-password") {
        setError("パスワードが正しくありません");
      } else if (err.code === "auth/email-already-in-use") {
        setError("このメールアドレスは既に使用されています");
      } else if (err.code === "auth/weak-password") {
        setError("パスワードは6文字以上で入力してください");
      } else if (err.code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません");
      } else {
        setError(err.message || "認証に失敗しました");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 認証状態の読み込みが完了するまで待つ（認証済みユーザーのリダイレクトを処理するため）
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証ユーザーまたは認証状態の読み込み完了後にページを表示
  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Signal<span style={{ color: '#FF8a15' }}>.</span>会員サイト
          </h1>
          <p className="text-gray-600">
            {isSignUp ? "新規登録" : "アカウントにログイン"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                !isSignUp
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isSignUp
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  パスワードを忘れた場合
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || loading}
              className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "処理中..." : isSignUp ? "新規登録" : "ログイン"}
            </button>
          </form>
        </div>
      </div>

      {/* パスワードリセットモーダル */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">パスワードリセット</h2>
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setResetEmail("");
                  setError("");
                  setSuccessMessage("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="登録済みのメールアドレスを入力"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setResetEmail("");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? "送信中..." : "送信"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


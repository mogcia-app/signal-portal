"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { checkAllAgreements, getNextAgreementPage } from "@/lib/agreementCheck";

export default function LoginPage() {
  const router = useRouter();
  const { user, userProfile, login, loading, sendPasswordReset } = useAuth();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
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
      // ログイン
      if (!formData.email || !formData.password) {
        setError("メールアドレスとパスワードを入力してください");
        setIsLoading(false);
        return;
      }
      await login(formData.email, formData.password);
      // ログイン成功フラグを設定（userProfileが更新されたらリダイレクト）
      setJustLoggedIn(true);
    } catch (err: any) {
      console.error("認証エラー:", err);
      // Firebaseエラーの詳細を確認
      const errorCode = err?.code || err?.error?.code;
      const errorMessage = err?.message || err?.error?.message;
      
      if (errorCode === "auth/user-not-found") {
        setError("ユーザーが見つかりません");
      } else if (errorCode === "auth/wrong-password" || errorCode === "auth/invalid-credential") {
        setError("パスワードが正しくありません");
      } else if (errorCode === "auth/weak-password") {
        setError("パスワードは6文字以上で入力してください");
      } else if (errorCode === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません");
      } else if (errorCode === "auth/network-request-failed") {
        setError("ネットワークエラーが発生しました。インターネット接続を確認してください。");
      } else if (errorCode === "auth/too-many-requests") {
        setError("リクエストが多すぎます。しばらく待ってから再度お試しください。");
      } else {
        setError(errorMessage || "認証に失敗しました。もう一度お試しください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ログイン成功後、userProfileが更新されたら同意状態をチェックしてリダイレクト
  useEffect(() => {
    const redirectAfterLogin = async () => {
      if (!justLoggedIn || !userProfile?.id) return;
      
      const status = await checkAllAgreements(userProfile.id);
      const nextPage = getNextAgreementPage(status);
      
      if (nextPage === null) {
        // すべて同意済みの場合は/homeにリダイレクト
        router.push("/home");
      } else {
        // 次の同意ページにリダイレクト
        router.push(nextPage);
      }
      
      setJustLoggedIn(false);
    };

    redirectAfterLogin();
  }, [justLoggedIn, userProfile, router]);

  // 認証状態の読み込みが完了するまで待つ（認証済みユーザーのリダイレクトを処理するため）
  if (loading) {
    return (
      <div className="flex min-h-screen bg-orange-50 items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証ユーザーまたは認証状態の読み込み完了後にページを表示
  return (
    <div className="flex min-h-screen bg-orange-50 items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ・タイトルセクション */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Signal<span className="text-orange-600">.</span>会員サイト
          </h1>
          <p className="text-gray-600 text-lg">
            アカウントにログイン
          </p>
        </div>

        {/* メインカード */}
        <div className="bg-white shadow-2xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 text-sm flex items-center gap-2 animate-shake">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* メールアドレス入力 */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* パスワード入力 */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                パスワード <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                8文字以上で入力してください
              </p>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
              >
                パスワードを忘れた場合
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || loading}
              className="w-full py-3.5 bg-linear-to-r from-orange-600 to-orange-500 text-white font-semibold hover:from-orange-700 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>処理中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>ログイン</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* パスワードリセットモーダル */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white shadow-2xl max-w-md w-full p-8 border border-gray-200 animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">パスワードリセット</h2>
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setResetEmail("");
                  setError("");
                  setSuccessMessage("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="登録済みのメールアドレスを入力"
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setResetEmail("");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-orange-600 to-orange-500 text-white font-semibold hover:from-orange-700 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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

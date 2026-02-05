"use client";

import { useState } from "react";
import SidebarToc from "@/components/SidebarToc";
import FloatingQnA from "@/components/FloatingQnA";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AccountPage() {
  const { user } = useAuth();
  
  // パスワード変更関連のstate
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // 基本情報
    name: "",
    email: "",
    password: "",
    company: "none", // "none" | "selected" | "company_id"
    selectedCompany: "",
    usageType: "solo", // "solo" | "team"
    contractType: "trial", // "trial" | "regular"
    snsCount: "1", // "1" | "2" | "3"
    status: "active", // "active" | "inactive"
    contractedSNS: [] as string[], // ["instagram", "twitter", "tiktok"]
    
    // 事業情報
    industry: "",
    companySize: "individual",
    businessType: "b2c",
    businessContent: "",
    snsGoal: "",
    brandMission: "",
    targetCustomer: "",
    uniqueValue: "",
    brandVoice: "",
    kpi: "",
    challenges: "",
    
    // 契約・課金情報
    contractStartDate: "2026/01/03",
    contractEndDate: "2026/02/03",
    monthlyFee: 60000,
    paymentMethod: "credit",
    paymentStatus: "paid",
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSNSChange = (sns: string) => {
    setFormData(prev => {
      const current = prev.contractedSNS;
      if (current.includes(sns)) {
        return { ...prev, contractedSNS: current.filter(s => s !== sns) };
      } else if (current.length < 3) {
        return { ...prev, contractedSNS: [...current, sns] };
      }
      return prev;
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError("");
    setPasswordChangeSuccess(false);

    // バリデーション
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError("すべてのフィールドを入力してください");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordChangeError("新しいパスワードは8文字以上である必要があります");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError("新しいパスワードと確認用パスワードが一致しません");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordChangeError("新しいパスワードは現在のパスワードと異なる必要があります");
      return;
    }

    setPasswordChangeLoading(true);

    try {
      if (!user || !user.email) {
        throw new Error("ユーザー情報を取得できませんでした");
      }

      // 再認証
      await signInWithEmailAndPassword(auth, user.email, currentPassword);

      // パスワード変更
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      setPasswordChangeSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setPasswordChangeError("現在のパスワードが正しくありません");
      } else if (error.code === "auth/weak-password") {
        setPasswordChangeError("パスワードが弱すぎます。より強力なパスワードを設定してください");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordChangeError("セキュリティのため、再度ログインしてからパスワードを変更してください");
      } else {
        setPasswordChangeError(error.message || "パスワードの変更に失敗しました");
      }
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth requireUserType="toC">
      <div className="flex min-h-screen bg-gray-50">
        <SidebarToc />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold text-gray-900">
            アカウント管理
          </h1>

          {/* プランの変更・確認 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              プランの変更・確認
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">現在のプラン</span>
                <span className="text-sm font-medium text-gray-900">Standard</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SNS契約数</span>
                <span className="text-sm font-medium text-gray-900">{formData.snsCount}SNS</span>
              </div>
              <button className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                プランを変更
              </button>
            </div>
          </div>

          {/* パスワード変更セクション */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">パスワード変更</h2>
            
            <form onSubmit={handlePasswordChange}>
              {/* 現在のパスワード */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在のパスワード
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="現在のパスワードを入力"
                    disabled={passwordChangeLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={passwordChangeLoading}
                  >
                    {showCurrentPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 新しいパスワード */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="8文字以上で入力してください"
                    disabled={passwordChangeLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={passwordChangeLoading}
                  >
                    {showNewPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">8文字以上で入力してください</p>
              </div>

              {/* 新しいパスワード（確認） */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード（確認）
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="新しいパスワードを再度入力"
                    disabled={passwordChangeLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={passwordChangeLoading}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* エラーメッセージ */}
              {passwordChangeError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {passwordChangeError}
                </div>
              )}

              {/* 成功メッセージ */}
              {passwordChangeSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                  パスワードの変更に成功しました
                </div>
              )}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={passwordChangeLoading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {passwordChangeLoading ? "変更中..." : "パスワードを変更"}
              </button>
            </form>
          </div>

          {/* 基本情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              基本情報
            </h2>
            
            <div className="space-y-6">
              {/* 名前 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="利用者名を入力"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* メールアドレス */}
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

              {/* 初期パスワード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  初期パスワード <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 font-normal ml-2">（利用者がログインで使用するパスワード）</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="8文字以上のパスワードを入力"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  このパスワードで利用者側アプリにログインできます。利用者は後で変更可能です。
                </p>
              </div>

              {/* 所属企業 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属企業 <span className="text-gray-500">（オプション）</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  企業向け販売の場合、ユーザーを企業に紐付けます
                </p>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="company"
                      value="none"
                      checked={formData.company === "none"}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">企業を選択しない（個人利用者）</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="company"
                      value="selected"
                      checked={formData.company === "selected"}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">企業を選択する</span>
                  </label>
                  {formData.company === "selected" && (
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>企業を選択してください</option>
                    </select>
                  )}
                </div>
              </div>

              {/* 利用形態 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  利用形態
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="usageType"
                      value="solo"
                      checked={formData.usageType === "solo"}
                      onChange={(e) => handleInputChange("usageType", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">ソロ利用</span>
                  </label>
                </div>
              </div>

              {/* 契約タイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  契約タイプ
                </label>
                <select
                  value={formData.contractType}
                  onChange={(e) => handleInputChange("contractType", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="trial">お試し1ヶ月契約</option>
                  <option value="regular">通常契約</option>
                </select>
              </div>

              {/* SNS契約数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SNS契約数
                </label>
                <select
                  value={formData.snsCount}
                  onChange={(e) => handleInputChange("snsCount", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="1">1SNS (60,000円)</option>
                  <option value="2">2SNS</option>
                  <option value="3">3SNS</option>
                </select>
              </div>

              {/* ステータス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="active">アクティブ</option>
                  <option value="inactive">非アクティブ</option>
                </select>
              </div>

              {/* 契約SNS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  契約SNS
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  利用するSNSプラットフォームを選択してください（最大3つまで）
                </p>
                <div className="space-y-2">
                  {["instagram", "twitter", "tiktok"].map((sns) => (
                    <label key={sns} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.contractedSNS.includes(sns)}
                        onChange={() => handleSNSChange(sns)}
                        disabled={!formData.contractedSNS.includes(sns) && formData.contractedSNS.length >= 3}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        {sns === "instagram" ? "Instagram" : sns === "twitter" ? "X (Twitter)" : "TikTok"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 事業情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              事業情報
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              SNSを使って何を達成したいのか？事業の核となる情報を入力してください
            </p>

            <div className="space-y-6">
              {/* 業界 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  業界
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>選択してください</option>
                </select>
              </div>

              {/* 会社規模 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会社規模
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => handleInputChange("companySize", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="individual">個人</option>
                  <option value="small">小規模</option>
                  <option value="medium">中規模</option>
                  <option value="large">大規模</option>
                </select>
              </div>

              {/* 事業タイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業タイプ
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleInputChange("businessType", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="b2c">B2C</option>
                  <option value="b2b">B2B</option>
                  <option value="b2b2c">B2B2C</option>
                </select>
              </div>

              {/* 事業内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  事業内容
                </label>
                <textarea
                  value={formData.businessContent}
                  onChange={(e) => handleInputChange("businessContent", e.target.value)}
                  placeholder="事業の詳細を入力してください"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* SNS活用の大目標 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💡 SNS活用の大目標（Why SNS?）
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  例: 「認知拡大で月間新規顧客100人獲得」「EC売上30%UP」「ブランド世界観の確立」
                </p>
                <textarea
                  value={formData.snsGoal}
                  onChange={(e) => handleInputChange("snsGoal", e.target.value)}
                  placeholder="SNS活用の大目標を入力"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* ブランドミッション */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ブランドミッション・理念
                </label>
                <p className="text-xs text-gray-500 mb-2">例: 毎日のコーヒーを特別な体験に</p>
                <textarea
                  value={formData.brandMission}
                  onChange={(e) => handleInputChange("brandMission", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* ターゲット顧客 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ターゲット顧客
                </label>
                <p className="text-xs text-gray-500 mb-2">例: 30-40代、コーヒーにこだわりたい層</p>
                <input
                  type="text"
                  value={formData.targetCustomer}
                  onChange={(e) => handleInputChange("targetCustomer", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 独自の価値 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  独自の価値・差別化ポイント
                </label>
                <p className="text-xs text-gray-500 mb-2">例: 産地直送の高品質豆、丁寧な焙煎</p>
                <textarea
                  value={formData.uniqueValue}
                  onChange={(e) => handleInputChange("uniqueValue", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* ブランドボイス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ブランドボイス・トーン
                </label>
                <p className="text-xs text-gray-500 mb-2">例: 温かみがあり、専門性を感じさせる</p>
                <textarea
                  value={formData.brandVoice}
                  onChange={(e) => handleInputChange("brandVoice", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* KPI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  測定したいKPI
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  例: 「月間新規顧客100人」「リピート率50%」「地域No.1の認知度」
                </p>
                <textarea
                  value={formData.kpi}
                  onChange={(e) => handleInputChange("kpi", e.target.value)}
                  placeholder="KPI目標を入力"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 課題 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  課題
                </label>
                <textarea
                  value={formData.challenges}
                  onChange={(e) => handleInputChange("challenges", e.target.value)}
                  placeholder="課題を入力"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* 契約・課金情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              契約・課金情報
            </h2>

            <div className="space-y-4">
              {/* 契約開始日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  契約開始日
                </label>
                <input
                  type="text"
                  value={formData.contractStartDate}
                  onChange={(e) => handleInputChange("contractStartDate", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 契約終了日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  契約終了日
                </label>
                <input
                  type="text"
                  value={formData.contractEndDate}
                  onChange={(e) => handleInputChange("contractEndDate", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* 月額料金 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月額料金
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`¥${formData.monthlyFee.toLocaleString()}`}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">自動計算</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  SNS契約数に応じて自動設定されます
                </p>
              </div>

              {/* 支払い方法 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支払い方法
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="credit">クレジットカード</option>
                  <option value="bank">銀行振込</option>
                </select>
              </div>

              {/* 支払いステータス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支払いステータス
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => handleInputChange("paymentStatus", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="paid">支払い済み</option>
                  <option value="pending">支払い待ち</option>
                  <option value="failed">支払い失敗</option>
                </select>
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end gap-4">
            <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              キャンセル
            </button>
            <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              保存
            </button>
          </div>
        </div>
      </main>

        <FloatingQnA />
      </div>
    </AuthGuard>
  );
}





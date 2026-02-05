"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SidebarToc from "@/components/SidebarToc";
import FloatingQnA from "@/components/FloatingQnA";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfile } from "@/types/user";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [checklist, setChecklist] = useState([
    { id: 1, text: "プロフィール設定をする", completed: false, link: "https://signaltool.app/login" },
    { id: 2, text: "最初の投稿を作ってみる", completed: false, link: "https://signaltool.app/login" },
    { id: 3, text: "分析画面を見てみる", completed: false, link: "https://signaltool.app/login" },
  ]);

  // Firestoreからユーザーデータをリアルタイム監視
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // /homeページにいる場合のみリアルタイム監視
    if (pathname !== '/home') {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as UserProfile;
          setUserProfile(data);
          setLoading(false);

          // accessGrantedがfalseの場合は契約書確認ページにリダイレクト
          if (!data.accessGranted) {
            router.push("/contract-confirmation");
          }
        } else {
          setLoading(false);
          router.push("/contract-confirmation");
        }
      },
      (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, router, pathname]);

  // Signal.ツールへのアクセスURLを取得（userProfileから取得、なければ動的に生成）
  const getSignalToolAccessUrl = () => {
    if (userProfile?.signalToolAccessUrl) {
      return userProfile.signalToolAccessUrl;
    }
    // signalToolAccessUrlが存在しない場合は動的に生成
    if (userProfile?.id || user?.uid) {
      const userId = userProfile?.id || user?.uid;
      const signalToolBaseUrl = process.env.NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL || 'https://signaltool.app';
      return `${signalToolBaseUrl}/auth/callback?userId=${userId}`;
    }
    return null;
  };

  const signalToolAccessUrl = getSignalToolAccessUrl();

  // プラン名を取得（/termsページと同じロジック）
  const getPlanName = (): string => {
    if (!userProfile) return '-';
    
    // プランIDの計算（monthlyFeeから判定）
    let calculatedPlanId: string | null = null;
    const monthlyFee = userProfile.billingInfo?.monthlyFee;
    
    if (monthlyFee) {
      if (monthlyFee === 15000) calculatedPlanId = 'light';
      else if (monthlyFee === 30000) calculatedPlanId = 'standard';
      else if (monthlyFee === 60000) calculatedPlanId = 'professional';
    }
    
    if (!calculatedPlanId && userProfile.billingInfo?.plan) {
      const billingPlan = userProfile.billingInfo.plan;
      if (billingPlan === 'light' || billingPlan === 'standard' || billingPlan === 'professional') {
        calculatedPlanId = billingPlan;
      } else if (billingPlan === 'basic' || billingPlan === 'trial') {
        calculatedPlanId = 'light';
      } else if (billingPlan === 'enterprise') {
        calculatedPlanId = 'professional';
      }
    }
    
    // プラン名を取得
    const plans: { [key: string]: string } = {
      'light': 'ベーシック',
      'standard': 'スタンダード',
      'professional': 'プロ'
    };
    
    return calculatedPlanId ? (plans[calculatedPlanId] || '-') : '-';
  };

  // 支払日を取得（月末日、土日の場合は前の金曜日）
  const getPaymentDate = (): string | null => {
    const contractData = (userProfile as any)?.contractData;
    
    // confirmedDueDateが設定されている場合はそれを使用（実際の日付）
    if (contractData?.confirmedDueDate) {
      return contractData.confirmedDueDate;
    }
    
    // 請求書発行が選択されている場合は、今月の月末日を計算（土日の場合は前の金曜日）
    if (contractData?.paymentMethods?.includes("請求書発行")) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      // 今月の月末日を取得
      const lastDay = new Date(year, month + 1, 0);
      const dayOfWeek = lastDay.getDay(); // 0=日曜日, 6=土曜日
      
      // 土日の場合、前の金曜日を計算
      let paymentDate: Date;
      if (dayOfWeek === 0) { // 日曜日
        paymentDate = new Date(year, month, lastDay.getDate() - 2); // 2日前（金曜日）
      } else if (dayOfWeek === 6) { // 土曜日
        paymentDate = new Date(year, month, lastDay.getDate() - 1); // 1日前（金曜日）
      } else {
        paymentDate = lastDay; // 平日はそのまま
      }
      
      // 日付をフォーマット
      const paymentYear = paymentDate.getFullYear();
      const paymentMonth = paymentDate.getMonth() + 1;
      const paymentDay = paymentDate.getDate();
      return `${paymentYear}年${paymentMonth}月${paymentDay}日`;
    }
    
    return null;
  };

  // ローディング中
  if (loading) {
    return (
      <AuthGuard requireAuth requireUserType="toC">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // accessGrantedがfalseの場合は何も表示しない（リダイレクト処理中）
  if (pathname === '/home' && userProfile && !userProfile.accessGranted) {
    return null;
  }

  const toggleChecklist = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedCount = checklist.filter(item => item.completed).length;

  return (
    <AuthGuard requireAuth requireUserType="toC">
      <div className="flex min-h-screen bg-white">
        {/* toC専用サイドバー */}
        <SidebarToc />

        {/* メインコンテンツエリア */}
        <main className="flex-1 pt-4 pb-2 px-4">
        <div className="max-w-full mx-auto px-8 space-y-8">

          {/* 通知バナー */}
          <NotificationBanner userProfile={userProfile} />

          {/* Signal.ツールへのアクセスボタン */}
          {signalToolAccessUrl && (
            <div className="mb-6 bg-white border border-gray-300 p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1 text-gray-900">
                    <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>ツールにアクセス
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    あなた専用SNS AI秘書 - <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>を利用して効率が良いSNS運用へ
                  </p>
                </div>
                <button
                  onClick={() => {
                    // URLにアクセス（Signal.ツール側で認証処理が行われる）
                    if (signalToolAccessUrl) {
                      console.log('Opening Signal Tool URL:', signalToolAccessUrl);
                      window.open(signalToolAccessUrl, '_blank');
                    } else {
                      console.error('signalToolAccessUrl is not set');
                      alert('Signal.ツールへのアクセスURLが設定されていません。管理者にお問い合わせください。');
                    }
                  }}
                  className="ml-8 flex items-center gap-2 px-8 py-3 bg-orange-600 text-white hover:bg-orange-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <span className="font-bold text-white">Signal. ツールを開く</span>
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* ① はじめに見る動画（メイン） */}
          <div className="bg-white p-6">
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span> 概要説明
              </h2>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-black">Signal</span><span style={{ color: '#ff8a15' }}>.</span>の概要説明動画です。ツールの主要機能、画面の見方などを1分14秒で解説します。初めてご利用になる方は、まずこの動画をご覧ください。
              </p>
            </div>
            <div className="w-full h-[600px] relative cursor-pointer group overflow-hidden bg-gray-100">
              {!isVideoPlaying && (
                <>
                  {/* サムネイル画像 */}
                  <div 
                    className="absolute inset-0 w-full h-full"
                    style={{ 
                      backgroundImage: 'url(/Signalsamune.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      zIndex: 0
                    }}
                  />
                  {/* 再生ボタンオーバーレイ */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center  hover:bg-opacity-20 transition-all"
                    style={{ zIndex: 10 }}
                    onClick={() => {
                      setIsVideoPlaying(true);
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.play();
                      }
                    }}
                  >
                    {/* 再生ボタン */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-white bg-opacity-90 hover:bg-opacity-100 flex items-center justify-center transition-all group-hover:scale-110 shadow-lg">
                        <svg
                          className="w-10 h-10 text-black ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <p className="text-white text-sm font-medium drop-shadow-lg">クリックして再生</p>
                    </div>
                  </div>
                </>
              )}
              <video
                ref={videoRef}
                src="/videos/MOGCIA inc.mp4"
                controls={isVideoPlaying}
                autoPlay={isVideoPlaying}
                className={`w-full h-full object-contain ${!isVideoPlaying ? 'hidden' : ''}`}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
                muted={!isVideoPlaying}
                playsInline
              >
                お使いのブラウザは動画タグをサポートしていません。
              </video>
            </div>
          </div>

          {/* 利用状況・契約情報・請求書サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 利用状況 */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">利用状況</h3>
              <div className="text-2xl text-gray-900">
                {userProfile?.createdAt ? (() => {
                  const startDate = new Date(userProfile.createdAt);
                  const now = new Date();
                  const monthsDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
                  return `${monthsDiff + 1}ヶ月目`;
                })() : '-'}
              </div>
            </div>

            {/* 契約情報 */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">契約プラン</h3>
              <div className="text-2xl text-gray-900">
                {getPlanName()}
              </div>
            </div>

            {/* 請求書 */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">請求書</h3>
              <div className="text-lg text-gray-900">
                {(() => {
                  const paymentDate = getPaymentDate();
                  return paymentDate ? `支払日: ${paymentDate}` : <span className="text-gray-400">（あれば）</span>;
                })()}
              </div>
            </div>
          </div>

          {/* ② 「次にやること」チェックリスト */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                次にやること
              </h2>
              <span className="text-sm text-gray-600">
                {completedCount} / {checklist.length} 完了
              </span>
            </div>
            <div className="space-y-3">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklist(item.id)}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.completed
                        ? "text-gray-500 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {item.text}
                  </span>
                  <a
                    href={item.link}
            target="_blank"
            rel="noopener noreferrer"
                    className="text-xs text-orange-600 hover:text-orange-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    開く →
                  </a>
                </label>
              ))}
            </div>
          </div>

          {/* ③ 今月の利用状況 */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              今月の利用状況
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">今月の利用回数</span>
                <span className="text-sm font-medium text-gray-900">5 / 30</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">次回更新日</span>
                <span className="text-sm font-medium text-gray-900">2月15日</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">現在のプラン</span>
                <span className="text-sm font-medium text-gray-900">Standard</span>
              </div>
            </div>
          </div>

          {/* ④ 困ったらここ（サポート導線） */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              困ったらここ
            </h2>
            <div className="space-y-2">
              <a
                href="#"
                className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
              >
                • よくある質問
              </a>
              <a
                href="/support"
                className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
              >
                • お問い合わせ
          </a>
          <a
                href="/usage-video"
                className="block text-sm text-gray-700 hover:text-orange-600 transition-colors"
          >
                • 使い方動画一覧
              </a>
            </div>
          </div>
        </div>
      </main>

        {/* 右下フローティングQ&A */}
        <FloatingQnA />
      </div>
    </AuthGuard>
  );
}


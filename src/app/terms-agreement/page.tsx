"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TermsAgreementPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const handleNext = () => {
    if (agreed) {
      router.push("/plan-selection");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            利用規約への同意
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              利用規約
            </h2>
            <div className="text-sm text-gray-700 space-y-4">
              <p>
                本規約は、Signal.（以下「当社」といいます。）が提供するサービス（以下「本サービス」といいます。）の利用条件を定めるものです。
                登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
              </p>
              <p>
                本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
              </p>
              <p>
                ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
              </p>
              <p>
                ユーザーは、本サービス利用の対価として、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。
              </p>
              <p>
                ユーザーは、本サービスの利用にあたり、法令または公序良俗に違反する行為、犯罪行為に関連する行為、本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為などを行ってはなりません。
              </p>
              <p>
                当社は、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
              <Link href="/terms" className="text-orange-600 hover:text-orange-700 underline">
                利用規約
              </Link>
              に同意します
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            disabled={!agreed}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              agreed
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}



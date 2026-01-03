import SidebarToc from "@/components/SidebarToc";
import FloatingQnA from "@/components/FloatingQnA";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarToc />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            利用規約
          </h1>

          <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-8">
            {/* 利用規約の内容 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第1条（適用）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                本規約は、Signal.（以下「当社」といいます。）が提供するサービス（以下「本サービス」といいます。）の利用条件を定めるものです。
                登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第2条（利用登録）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第3条（ユーザーIDおよびパスワードの管理）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
                ユーザーIDまたはパスワードが第三者に使用されたことによって生じた損害は、当社に故意または重大な過失がある場合を除き、当社は一切の責任を負わないものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第4条（利用料金および支払方法）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                ユーザーは、本サービス利用の対価として、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。
                ユーザーが利用料金の支払を遅滞した場合、ユーザーは年14.6％の割合による遅延損害金を当社に支払うものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第5条（禁止事項）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                <li>当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>本サービスによって得られた情報を商業的に利用する行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>不正な目的を持って本サービスを利用する行為</li>
                <li>本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第6条（本サービスの提供の停止等）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                本サービスにかかるコンピュータシステムの保守点検または更新を行う場合、地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合、コンピュータまたは通信回線等が事故により停止した場合、その他、当社が本サービスの提供が困難と判断した場合。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第7条（保証の否認および免責）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第8条（サービス内容の変更等）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第9条（利用規約の変更）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                当社は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
                本規約の変更がユーザーの一般の利益に適合するとき、本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第10条（個人情報の取扱い）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第11条（通知または連絡）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第12条（権利義務の譲渡の禁止）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                第13条（準拠法・裁判管轄）
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
              </p>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                以上
              </p>
              <p className="text-xs text-gray-500 mt-2">
                制定日：2026年1月1日
              </p>
            </div>
          </div>
        </div>
      </main>

      <FloatingQnA />
    </div>
  );
}


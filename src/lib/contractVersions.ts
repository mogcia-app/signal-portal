/**
 * 契約書バージョン管理
 * 契約書を変更した場合は、必ずバージョンを更新してください
 */
export const CONTRACT_VERSION = "v2026-01";
export const PRIVACY_POLICY_VERSION = "v2026-01";
export const MEMBER_SITE_TERMS_VERSION = "v2026-01";
export const TOOL_TERMS_VERSION = "v2026-01";

/**
 * 同意項目の定義
 * UIの文言を変更しても、keyは変更しないこと（法的証拠のため）
 */
export const AGREEMENT_ITEMS = {
  fullContract: {
    key: "fullContract",
    label: "利用契約書（全文）に同意します",
  },
  unpaidTermination: {
    key: "unpaidTermination",
    label: "未払い時の解除・残存期間分請求・違約金（10％）に同意します",
  },
  analysisProhibition: {
    key: "analysisProhibition",
    label: "本サービスの解析・模倣・競合目的での利用禁止に同意します",
  },
  suspension: {
    key: "suspension",
    label: "不正利用・支払遅延時の事前通知なしの利用停止に同意します",
  },
  confidentialInfo: {
    key: "confidentialInfo",
    label: "非公開情報の第三者共有・転用・競合利用の禁止に同意します",
  },
} as const;


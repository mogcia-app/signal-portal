# Admin側プラン表記変更ガイド

## 📋 概要

会員サイト側のプラン体系と整合性を取るため、Admin側のプラン表記を以下の通り変更してください。

---

## 🔄 変更内容

### プラン表記の統一

**変更前（松竹梅プラン）:**
- `ume` (梅プラン) - 15,000円
- `take` (竹プラン) - 30,000円
- `matsu` (松プラン) - 60,000円

**変更後（スタンダード・ベーシック・プロプラン）:**
- `light` (ライト/ベーシックプラン) - 15,000円
- `standard` (スタンダードプラン) - 30,000円
- `professional` (プロプラン) - 60,000円

---

## 📝 実装チェックリスト

### 1. Firestoreデータ構造の確認

**`users` コレクションのフィールド:**

#### `planTier` フィールド
- **現在**: `'ume' | 'take' | 'matsu'`
- **変更後**: 引き続き使用可能（後方互換性のため）
- **注意**: 新規ユーザーには `planTier` を設定する代わりに、`billingInfo.plan` を使用

#### `billingInfo.plan` フィールド
- **現在**: `'trial' | 'basic' | 'professional' | 'enterprise'`
- **変更後**: `'light' | 'standard' | 'professional'`
- **マッピング**:
  - `'basic'` → `'light'` (推奨)
  - `'trial'` → `'light'` (推奨)
  - 新規作成時は `'standard'` または `'professional'` を直接使用

#### `billingInfo.monthlyFee` フィールド
- **必須**: プランと一致する料金を設定
  - `light`: 15,000円
  - `standard`: 30,000円
  - `professional`: 60,000円

---

### 2. UI表示の変更

#### プラン選択画面
以下の表記に変更してください：

```
【変更前】
- 梅プラン (15,000円/月)
- 竹プラン (30,000円/月)
- 松プラン (60,000円/月)

【変更後】
- ライトプラン (15,000円/月) または ベーシックプラン (15,000円/月)
- スタンダードプラン (30,000円/月)
- プロプラン (60,000円/月)
```

#### ユーザー一覧画面
- プラン列の表示を新しい表記に変更
- フィルターや検索条件も新しいプラン名に対応

#### ユーザー詳細画面
- プラン情報の表示を更新
- プラン変更フォームのオプションを更新

---

### 3. プラン変更機能の修正

#### プラン変更フォーム
```typescript
// プランオプションの定義
const planOptions = [
  { 
    id: 'light', 
    name: 'ライトプラン', 
    price: 15000,
    description: '投稿作成をAIで効率化。まずは「続ける」ための基本プラン。'
  },
  { 
    id: 'standard', 
    name: 'スタンダードプラン', 
    price: 30000,
    description: '投稿の結果を見ながら、改善できる運用プラン。'
  },
  { 
    id: 'professional', 
    name: 'プロプラン', 
    price: 60000,
    description: '戦略設計から成果最大化までAIが伴走。全機能を含む。'
  },
];
```

#### Firestore更新処理
```typescript
// プラン変更時の更新処理
await updateDoc(userRef, {
  'billingInfo.plan': selectedPlanId, // 'light' | 'standard' | 'professional'
  'billingInfo.monthlyFee': selectedPlan.price,
  updatedAt: serverTimestamp(),
  
  // planTier も更新する場合（オプション）
  planTier: planIdToTier(selectedPlanId), // 'ume' | 'take' | 'matsu'
});

// planTierへの変換関数（必要に応じて）
function planIdToTier(planId: string): 'ume' | 'take' | 'matsu' {
  const mapping = {
    'light': 'ume',
    'standard': 'take',
    'professional': 'matsu',
  };
  return mapping[planId] || 'ume';
}
```

---

### 4. 既存データの移行（必要に応じて）

既存ユーザーの `billingInfo.plan` を新しい形式に移行する場合：

```typescript
// 移行スクリプト（必要に応じて実行）
const migrationMapping = {
  'basic': 'light',
  'trial': 'light',
  'professional': 'professional', // そのまま
  'enterprise': 'professional', // enterprise → professional
};

// Firestoreのバッチ更新
const usersSnapshot = await getDocs(collection(db, 'users'));
const batch = writeBatch(db);

usersSnapshot.forEach((doc) => {
  const data = doc.data();
  const oldPlan = data.billingInfo?.plan;
  
  if (oldPlan && migrationMapping[oldPlan]) {
    const newPlan = migrationMapping[oldPlan];
    batch.update(doc.ref, {
      'billingInfo.plan': newPlan,
    });
  }
});

await batch.commit();
```

---

### 5. バリデーションの追加

#### プランと料金の整合性チェック
```typescript
function validatePlanAndPrice(plan: string, price: number): boolean {
  const planPrices = {
    'light': 15000,
    'standard': 30000,
    'professional': 60000,
  };
  
  return planPrices[plan] === price;
}
```

---

### 6. 会員サイト側との連携確認

会員サイト側は以下の優先順位でプランを判定します：

1. `planTier` (ume/take/matsu) + `billingInfo.monthlyFee` の組み合わせ
2. `billingInfo.monthlyFee` のみ
3. `billingInfo.plan` (light/standard/professional)
4. `selectedPlanId`

**推奨事項:**
- Adminでプランを変更する際は、必ず `billingInfo.plan` と `billingInfo.monthlyFee` の両方を更新してください
- `planTier` は後方互換性のために保持することを推奨します

---

### 7. テスト項目

以下のテストを実施してください：

- [ ] プラン選択画面で新しいプラン名が表示される
- [ ] プラン変更時に `billingInfo.plan` と `billingInfo.monthlyFee` が正しく更新される
- [ ] 既存ユーザーのプラン情報が正しく表示される
- [ ] 会員サイト側でプラン変更が反映される（料金が正しく表示される）
- [ ] プランと料金の整合性チェックが機能する

---

### 8. 注意事項

1. **後方互換性**: `planTier` (ume/take/matsu) フィールドは既存システムとの互換性のため、削除せずに保持することを推奨します

2. **データ整合性**: プランを変更する際は、必ず以下のフィールドを同時に更新してください：
   - `billingInfo.plan`
   - `billingInfo.monthlyFee`
   - `planTier` (オプション)

3. **会員サイト側への影響**: 会員サイト側は既に対応済みのため、Admin側の変更後すぐに反映されます

---

## 📚 参考情報

### 会員サイト側のプラン定義
```typescript
const plans = {
  light: { 
    name: "ライト", 
    price: 15000,
    description: "投稿作成をAIで効率化。まずは「続ける」ための基本プラン。"
  },
  standard: { 
    name: "スタンダード", 
    price: 30000,
    description: "投稿の結果を見ながら、改善できる運用プラン。"
  },
  professional: {
    name: "プロ",
    price: 60000,
    description: "戦略設計から成果最大化までAIが伴走。全機能を含む。"
  },
};
```

### Firestoreデータ構造の例
```json
{
  "planTier": "matsu",  // 後方互換性のため保持
  "billingInfo": {
    "plan": "professional",  // 新しいプランID
    "monthlyFee": 60000,
    "currency": "JPY",
    "paymentMethod": "invoice",
    "paymentStatus": "paid"
  },
  "selectedPlanId": "professional"  // 会員サイト側で使用
}
```

---

## ✅ 完了確認

実装完了後、以下の点を確認してください：

1. Admin側でプランを変更した際、会員サイト側の `/initial-invoice` ページで正しいプランと料金が表示される
2. プラン変更後、ブラウザのコンソールログで以下が表示される：
   ```
   planTier: matsu
   billingInfo.monthlyFee: 60000
   planTier + monthlyFee から判定した planId: professional
   最終的な planId: professional
   ```

---

## 📞 問い合わせ

実装中に問題が発生した場合は、会員サイト側の実装を確認してください：
- `/src/app/initial-invoice/page.tsx` - プラン判定ロジック
- `/src/app/invoice-preview/page.tsx` - プラン判定ロジック


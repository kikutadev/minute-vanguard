# Public Reference Parity Workflow

`Minute Vanguard` は独自プロダクトだが、短周期テキストRPGとしての操作密度・報酬構造を検証するため、公開中の Hero60 ガイド / 更新履歴を behavioral reference として利用する。

## BuzzPro から持ち込んだ手法

毎回サイトを目視して記憶で実装するのではなく、次の4層で差分を固定する。

1. **Public reference contract** — `reference/hero60-reference-contract.ts`
   - 公開ガイド・更新履歴から確認できた数値・境界だけをtyped data化する。
   - 名称・文章・画像・ソースコードは取り込まない。
2. **Live public audit** — `pnpm reference:audit`
   - `guide` / `patchnotes` の重要マーカーをHTTPで確認する。
   - 参照側の仕様変更・削除を早期検知する。
3. **Product parity tests** — `tests/reference-parity.test.ts`
   - こちらのDomainが意図した参照契約からずれていないかをテストする。
   - RNG結果そのものより、境界・価格・保持/消費・不変条件を優先する。
4. **Browser state QA**
   - IndexedDBへ既知状態を注入し、実プレイ待ちをせずUI遷移だけを検証する。
   - QA入口はプロダクトコードへ追加しない。

公開ゲームの認証済みAPIや内部サーバーを直接叩くことはしない。公開ガイド、公開更新履歴、公開ページ、ブラウザ上で通常確認できる表示のみを観測対象とする。

## Current parity ledger

### Locked and tested

- 5秒初心者期間 / 10討伐 / 敗北時60秒
- 通常60秒、恒久短縮50秒、オーブ込み45秒下限
- 初心者5秒中はGem skipを使わない
- 最大20ターン
- HP / ATK / DEF / MAT / MDF / LUK
- Lv.30転職、9職
- 変異種1%、報酬倍率3倍
- 敗北Gold 50%、HP1 / 引き分けEXP 5%
- 敗北で実際に失ったGoldを100Gemで1回回収。次の戦闘で古い回収対象は失効
- 連勝倍率、Gold jackpot、勝利時1%恒久成長
- オーブ F〜SSS、単発100 / 10連1,000
- 10連 A以上1個 + 特殊効果1個以上
- オーブ10枠、1枠100Gemで拡張
- 満杯時の戦闘ドロップは一時保留し、新ドロップ破棄または未保護の手持ちオーブとの入れ替えを必須化
- 再抽選: 総%維持、最大3能力固定、50/100/200/400Gem
- 合成: 親1 + 同ランク素材4、成功確定、親ID維持
- 合成Gold価格 E〜SSS
- 装備中/ロック/お気に入りは素材不可、親には使用可
- 同特殊効果素材1個につき20%、最大80%で効果1段階強化
- 公開値を確認できた特殊効果段階:
  - Gold / EXP / 大成長 3/6/9/12/15%
  - Critical 5/10/15/20/25%
  - Evasion 3/6/9/12/15%
  - Cooldown 1/2/3/4/5秒
- 同一敵30討伐で捕獲解禁、勝利時1%、通常1体/テイマー2体
- 変異種の別捕獲で主人公レベルアップ成長+1%（通常ペット所持+1%とは別枠）
- ペットおやつ: 1時間1個の無料チャージ、無料チャージ上限100、100Gemで100個、総訓練Lv20ごとに成長+1%
- 捕獲支援装備: 各2,000Gem、武器/防具それぞれ×2、両方で最大×4、テイマー×1.5も重なる
- 戦闘勝利時のおやつ低確率ドロップ、変異種はドロップ重み×3（基礎確率は非公開のためMinute Vanguard独自）
- 変異種は累計討伐20体までは出現しない
- Daily 5個 / 5カテゴリ / 22候補 / JST 0時 / 達成順3・3・4・5・5Gem（合計20）
- ログインボーナス: 7日周期、欠席で1日目へ、1日目2,000G、7日目20,000G+15Gem。2〜6日目は公開表なしのためMinute Vanguard独自漸増値
- 下部5タブ、装備5タブ（武器 / 防具 / オーブ / ペット / 肩書き）
- Time Boost: 3分/30Gem、10分/100Gem、30分/300Gem
- Rush: CD10秒・効果中Gem skip不可 / EXP・Gold boost: ×2
- 肩書き: 52種 / 5枠 / Lv1〜5 / 累計1・3・6・10・15個
- 肩書き勝利ドロップ1%、日替わり3種、各300Gem・1日1回
- 肩書きコスト上限の公開アンカー: Lv1=4 / Lv30=10 / Lv120=16 / Lv5000=40
- 肩書きは転職で全解除、就職中の全解除は300Gem

- Monster roster density: Lv.1〜13、各50体、合計650体。前レベルを1体倒すと次レベルを解放し、解放済み狩場から1つ選択して戦う。Minute Vanguardの名称・設定は全て独自。
- クールダウン中のモンスター叩き: 6マス、勇者/空マスは-3、報酬なし、自己ベストは端末ローカルのみ。
- 戦闘ログ: 自分のログは端末ローカル、表示件数10/30/50を端末ごとに選択。Minute Vanguardは最大50件の軽量要約のみ保存。
- 戦闘背景: 参照側はモンスターレベル別＋朝/昼/夕/夜。公開確認できる更新時点はLv.1〜12。Minute Vanguardは独自13狩場へ拡張し、画像コピーなしのCSSシーンとして戦闘前/結果を統一。
- 簡易戦闘: 結果モーダルなし・HP/EXP/Gold常時表示・1行ログ。オーブ満杯時の新ドロップは自動破棄、敗北Gold回収は通常画面のみ。
- Mimic Bank: 手持ちGoldを預け、10/20/30 Gemで全額引き出し抽選。結果倍率は公開仕様どおり10% / 50% / 100% / 200%。投入Gem別の正確な確率は非公開のため、確率だけMinute Vanguard独自テーブルとして分離。
- 称号（実績）: 参照側は300種以上・1つ選択して名前上に表示。Minute Vanguardは現在104種を実条件付きで実装し、Kit Achievement stateへ永続化。
- Battle Boost: 10 Gem prepaid, next monster battle EXP/Gold ×2, compatible with Rare Guarantee.
- Inn: 10% of carried Gold, capped at Lv×100, free at 9G or less.
- Gold bags: 30/100/300 Gem, based only on rolling last-ten monster-victory levels, unavailable before two wins, unaffected by current Gold multipliers. Exact payout equation remains product-owned because the public guide does not expose it.
- Public profile / reference ranking boundary: recent profiles plus Lv / victories / codex sorts are backed by Minute Vanguard Cloudflare Worker + D1 and are explicit opt-in. These client-submitted values are discovery/reference only and are never treated as PvP or reward authority.

### Public behavior known, exact table not yet public-locked

- Gem drop / defeat Gold protection / turn regen / draw EXP の特殊効果段階値
- Mimic Bank のGem投入量別の正確な確率表
- オーブ提供割合の全ランク確率
- Gold袋の直近10戦からの具体的算式
- 肩書きコスト上限の完全な中間テーブル（公開guideは端点/一部アンカーのみ）

これらは推測値を reference contract に書かない。公開情報で確定するまで、既存の独自balanceとして明示的に分離する。

### Next implementation gaps

1. Server-authoritative PvP / Champion boundary
2. Server-authoritative shared Raid / wanted-event boundary

### Additional solo parity locked in current implementation

- Gold bags cost 30 / 100 / 300 Gem, require at least two monster victories, and derive contents from the last ten monster-victory levels without applying Gold multipliers. The exact payout curve is product-owned because the public guide does not expose its internal formula.
- Mutated monsters do not appear until 20 total victories. Capturing a mutated form grants a separate +1% level-up growth bonus while keeping the species as one owned pet for party-count purposes.

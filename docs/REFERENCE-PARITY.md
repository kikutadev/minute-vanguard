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
- 連勝倍率、Gold jackpot、勝利時1%恒久成長
- オーブ F〜SSS、単発100 / 10連1,000
- 10連 A以上1個 + 特殊効果1個以上
- オーブ10枠、1枠100Gemで拡張
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
- Daily 5個 / JST 0時 / 合計20Gem
- 下部5タブ、装備5タブ（武器 / 防具 / オーブ / ペット / 肩書き）
- Time Boost: 3分/30Gem、10分/100Gem、30分/300Gem
- Rush: CD10秒・効果中Gem skip不可 / EXP・Gold boost: ×2
- 肩書き: 52種 / 5枠 / Lv1〜5 / 累計1・3・6・10・15個
- 肩書き勝利ドロップ1%、日替わり3種、各300Gem・1日1回
- 肩書きコスト上限の公開アンカー: Lv1=4 / Lv30=10 / Lv120=16 / Lv5000=40
- 肩書きは転職で全解除、就職中の全解除は300Gem

### Public behavior known, exact table not yet public-locked

- Gem drop / defeat Gold protection / turn regen / draw EXP の特殊効果段階値
- Mimic Bank のGem投入量別の正確な確率表
- オーブ提供割合の全ランク確率
- Gold袋の直近10戦からの具体的算式
- 肩書きコスト上限の完全な中間テーブル（公開guideは端点/一部アンカーのみ）

これらは推測値を reference contract に書かない。公開情報で確定するまで、既存の独自balanceとして明示的に分離する。

### Next implementation gaps

1. Orb replacement flow when inventory is full
2. Mimic Bank: 10% / 50% / 100% / 200% outcome flow
3. Gold bags using last-ten-win history
4. Login bonus 7-day cycle
5. Server boundary for real ranking / PvP / raid

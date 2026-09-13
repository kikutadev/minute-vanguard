const pages = {
  guide: 'https://hero60rpg.com/guide',
  patchnotes: 'https://hero60rpg.com/patchnotes',
};

const checks = [
  ['guide', 'battle.beginner', ['最初の10体', '5秒', '60秒']],
  ['guide', 'battle.maxTurns', ['最大20ターン']],
  ['guide', 'battle.defeatRecovery', ['敗北ゴールド回収', '100']],
  ['guide', 'battle.mutation', ['変異種', '1', '3 倍']],
  ['patchnotes', 'mutation.beginnerGuard', ['累計討伐20体まで', '変異種が出ません']],
  ['guide', 'mutation.captureBonus', ['変異種を捕獲すると成長ボーナス', '+ 1 %', '合わせて+2%']],
  ['guide', 'progression.stats', ['HP / ATK / DEF / MAT / MDF / LUK']],
  ['guide', 'progression.jobChange', ['Lv.30', '転職']],
  ['guide', 'monsters.roster', ['Lv1〜13', '全650体']],
  ['guide', 'achievements.core', ['称号', '300種以上', '1つ選んでプレイヤー名の上に表示']],
  ['patchnotes', 'monsters.sequentialUnlock', ['Lv9モンスターを倒すとLv10', 'Lv10モンスターを倒すと挑戦', 'Lv11モンスターを倒すと挑戦', 'Lv12モンスターを倒すと挑戦']],
  ['patchnotes', 'battle.cooldownPastime', ['モンスター叩き', '6マス', '3点減', '報酬はなく', '自己ベストはこの端末にだけ']],
  ['patchnotes', 'battle.selfLog', ['戦闘ログの表示件数を10件・30件・50件', '「自分」のログは端末ごとに記録']],
  ['patchnotes', 'battle.visualScenes', ['バトル結果の背景が、モンスターのレベルと時間帯で変わる', '朝・昼・夕方・夜']],
  ['patchnotes', 'battle.simpleMode', ['「シンプル戦闘」を追加', '結果のモーダルは出ません', 'オーブの受け取り操作がありません', '保管枠が満杯のあいだに拾ったオーブは破棄', '敗北ゴールドの回収']],
  ['guide', 'mimic.core', ['ミミック銀行', '結果は4種', '10%だけ返却', '半分', '全額', '2倍', '10〜30']],
  ['guide', 'arena.currentCore', ['PvP ：ランダムマッチ', '毎週月曜0時', '負けても1点', '相手のレート ÷ 100', '下限2', '上限40', '防衛で勝つと1/3', '1日3回', '金・土・日は獲得が2倍', '初期1,000pt', '700以上離れた']],
  ['guide', 'arena.cooldownBarrier', ['2時間の防衛バリア', '全員60秒', 'ジェムでのスキップ', 'どれも効かない', 'シーズンスコア1位のプレイヤーがチャンプ']],
  ['patchnotes', 'arena.integration', ['対戦（PvP）とチャンプ戦を統合', 'PvPポイント（レート）が近い相手', 'クールダウン（60秒）がモンスター戦と別枠', 'PvP対戦の先手がランダム（50/50）']],
  ['patchnotes', 'arena.dedicatedLoadout', ['アリーナ専用の武器・防具・オーブ', '攻めるときも攻められたときもこの装備', '無料']],
  ['guide', 'arena.petParticipation', ['モンスター戦・アリーナの両方で毎ターン一緒に攻撃', 'テイマーなら2体', '2体目の攻撃力は6割', 'ペットの攻撃力+40%']],
  ['patchnotes', 'arena.petDodge', ['ペットの攻撃も相手の回避で外れる', '忍者30%・幽鬼70%']],
  ['guide', 'arena.namedChallenge', ['ランキングから指名して戦い', 'ランキングから指名した対戦ではゴールドは一切動かない']],
  ['patchnotes', 'arena.namedChallengeRules', ['ランキングから相手を指名して戦った場合', 'ゴールドは1Gも動きません', 'PvPポイント・戦績・防衛バリア・1日3勝の制限']],
  ['guide', 'arena.seasonRewards', ['アリーナのシーズン報酬（ティアに応じて', '受け取りはメニューの「プレゼント」から', 'マスターに到達すると、ジェムでは買えない装飾フレーム「頂の証」', 'シーズンスコア1位が王冠。優勝すると報酬の上乗せ', '週間王者', '殿堂入り']],
  ['patchnotes', 'arena.achievementTitles', ['ティアに到達すると手に入る称号を10種類追加しました', '優勝すると報酬の上乗せに加えて、称号「週間王者」']],
  ['patchnotes', 'arena.leaderboardProfiles', ['今シーズンの上位10人は、名前をタップすると装備やステータスを見られます', '防衛バリア中の相手は挑戦ボタンの代わりに「バリア」と表示']],
  ['patchnotes', 'arena.tierRewardUi', ['全10階級と、それぞれのシーズン報酬（ゴールド・ジェム）を画面で確認できるようになりました', '階級が上がると、バトル結果に「昇格！」']],
  ['patchnotes', 'arena.rewardCarryAndHall', ['シーズン終了時にティアに応じた報酬', '受け取り忘れても次のシーズンに持ち越されます', '歴代の優勝者を記録する「殿堂」']],
  ['guide', 'goldBags.core', ['小銭袋', '30', 'ずだ袋', '100', '大金庫', '300', '直近10戦', '2回以上']],
  ['guide', 'progression.jobCurrent', ['301回目 Lv.210', '1〜200回目 +5%', '201〜300回目 +4%', '301回目以降はずっと +3%', '全装備を外して戦う', '杖を持つと自分の攻撃も魔法になる']],
  ['patchnotes', 'progression.ninjaCurrent', ['最大15%', '通常戦闘（最大20ターン）で倒しきれるか']],
  ['guide', 'permanentUpgrades', ['カウントダウンスキップ', '1日3回まで無料', '500', 'クールダウン短縮', '3,000', '獲得経験値 1.2倍', '獲得ゴールド 1.2倍', 'オーブドロップ率 ×1.5', '引き分け時の経験値が2倍']],
  ['guide', 'orb.ranks', ['F 〜 SSS']],
  ['guide', 'orb.gacha', ['100', '1,000', 'ランクA以上']],
  ['guide', 'orb.fullReplacement', ['満杯のときは入れ替え']],
  ['guide', 'orb.combine', ['同ランクの素材オーブ4個', 'SSSまで到達可能']],
  ['guide', 'orb.reroll', ['3つまで固定', '50', '400']],
  ['guide', 'pet.capture', ['30体以上討伐', '1%', '所持ペット数 × 1%']],
  ['guide', 'pet.captureSupport', ['各 2000', '捕獲率が2倍', '最大4倍', 'テイマーの捕獲率1.5倍']],
  ['guide', 'pet.training', ['1時間に1個ずつ自動でたまり', '上限100個', '100 で100個買える', '総訓練レベル20ごとに+1%']],
  ['guide', 'pet.gacha', ['ペットガチャ', '単発 300', '10連 3000', '初めての単発だけ 100', '今日のピックアップ', '排出率が2倍', '10連に確定枠はない']],
  ['guide', 'pet.specialEffects', ['エピック以上には特殊効果', '毎ターン回復', '被ダメージ軽減', '追撃', '3倍の一撃']],
  ['guide', 'pet.nickname', ['名前をつけられる', '12 文字まで', '空のまま決定すると元の名前に戻る']],
  ['patchnotes', 'pet.gachaDuplicateSnacks', ['レア200', 'エピック225', '伝説250', 'ボス300個', 'コモン・アンコモンはこれまでどおり100個']],
  ['patchnotes', 'titles.core', ['全52種', '5枠', '1%', '15個', '毎日3種', '300ジェム']],
  ['guide', 'titles.current', ['1 / 3 / 6 / 10 / 15', '5,000', '40', '転職するとすべて外れる', '全部外したいときは', '300']],
  ['guide', 'daily.reset', ['毎日5個', '日本時間0時', '5つの枠から1個ずつ', '22種類', '1個目', '2個目', '3個目', '4個目', '5個目', '全部で 20']],
  ['guide', 'loginBonus.core', ['ログインボーナス', '7日周期', '1日目2,000G', '7日目は20,000G', '15', '途切れると1日目に戻る']],
  ['patchnotes', 'ui.bottomTabs', ['ショップ・装備・バトル・コレクション・ランキング']],
  ['patchnotes', 'ui.battleFloaters', ['デイリーミッション・転職・ミミック銀行']],
  ['patchnotes', 'beginner.noSkip', ['クールダウンが5秒のあいだ', 'ジェムでスキップ', 'ラッシュタイム']],
  ['patchnotes', 'timeBoosts.duration', ['3分版', 'ジェム30個', '10分', '100個', '30分版', '300ジェム']],
  ['patchnotes', 'timeBoosts.effects', ['ラッシュタイム', 'クールダウンが10秒', 'EXPブーストタイム', '経験値2倍', 'ゴールドブーストタイム', 'ゴールド2倍']],
];

const normalize = (value) => value
  .replace(/<[^>]*>/g, ' ')
  .replace(/\\u003c/g, '<')
  .replace(/\\"/g, '"')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');

const text = {};
for (const [name, url] of Object.entries(pages)) {
  const response = await fetch(url, { headers: { 'user-agent': 'MinuteVanguardReferenceAudit/1.0' } });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  text[name] = normalize(await response.text());
}

let failed = 0;
for (const [page, id, markers] of checks) {
  const missing = markers.filter((marker) => !text[page].includes(marker));
  const ok = missing.length === 0;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}${ok ? '' : ` missing=${JSON.stringify(missing)}`}`);
}
console.log(`\n${checks.length - failed}/${checks.length} public reference checks passed.`);
if (failed > 0) process.exitCode = 1;

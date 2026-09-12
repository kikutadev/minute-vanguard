const pages = {
  guide: 'https://hero60rpg.com/guide',
  patchnotes: 'https://hero60rpg.com/patchnotes',
};

const checks = [
  ['guide', 'battle.beginner', ['最初の10体', '5秒', '60秒']],
  ['guide', 'battle.maxTurns', ['最大20ターン']],
  ['guide', 'battle.mutation', ['変異種', '1', '3 倍']],
  ['guide', 'progression.stats', ['HP / ATK / DEF / MAT / MDF / LUK']],
  ['guide', 'progression.jobChange', ['Lv.30', '転職']],
  ['guide', 'orb.ranks', ['F 〜 SSS']],
  ['guide', 'orb.gacha', ['100', '1,000', 'ランクA以上']],
  ['guide', 'orb.combine', ['同ランクの素材オーブ4個', 'SSSまで到達可能']],
  ['guide', 'orb.reroll', ['3つまで固定', '50', '400']],
  ['guide', 'pet.capture', ['30体以上討伐', '1%']],
  ['guide', 'daily.reset', ['毎日5個', '日本時間0時']],
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

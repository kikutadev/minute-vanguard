import { useEffect, useRef, useState } from 'react';
import { GameSession } from '../application/game-session';
import {
  enemies,
  itemDefinitions,
  permanentUpgradeDefinitions,
  shopEquipmentOffers,
  type PermanentUpgradeId,
} from '../definitions/game-definitions';
import type { BattleResult, EquipmentData, MinuteVanguardState, StatKey } from '../definitions/types';
import {
  activateRareGuarantee,
  advanceFromWallClock,
  availableJobs,
  battleCooldown,
  buyEquipment,
  buyPermanentUpgrade,
  changeJob,
  claimDailyMission,
  cooldownSkipCost,
  currentJob,
  currentJobBonusRequirement,
  discardItem,
  drawOrb,
  effectiveBattleCooldownSec,
  equipOwnedItem,
  expRequiredForNextLevel,
  fight,
  gemBalance,
  goldBalance,
  healAtInn,
  jobChangeCost,
  playerCombatStats,
  setActivePet,
  skipBattleCooldown,
  upgradeItem,
} from '../plugin/engine';

const session = new GameSession();
type MainTab = 'shop' | 'equipment' | 'battle' | 'collection' | 'ranking';
type EquipmentTab = 'weapon' | 'armor' | 'orb' | 'pet';
type Modal = 'mission' | 'job' | 'menu' | null;
const STAT_LABELS: Readonly<Record<StatKey, string>> = { hp: 'HP', attack: 'ATK', defense: 'DEF', magicAttack: 'MAT', magicDefense: 'MDF', luck: 'LUK' };

export function MinuteVanguardApp() {
  const [state, setState] = useState<MinuteVanguardState | null>(null);
  const [tab, setTab] = useState<MainTab>('battle');
  const [equipmentTab, setEquipmentTab] = useState<EquipmentTab>('weapon');
  const [modal, setModal] = useState<Modal>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [battleStep, setBattleStep] = useState(0);
  const [notice, setNotice] = useState('');
  const stateRef = useRef<MinuteVanguardState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void session.load().then((loaded) => {
      if (cancelled) return;
      stateRef.current = loaded;
      setState(loaded);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((current) => current === null ? current : advanceFromWallClock(current, Date.now()).state);
    }, 500);
    const saver = window.setInterval(() => {
      if (stateRef.current !== null) void session.save(stateRef.current);
    }, 5_000);
    const save = () => { if (stateRef.current !== null) void session.save(stateRef.current); };
    window.addEventListener('pagehide', save);
    return () => { window.clearInterval(timer); window.clearInterval(saver); window.removeEventListener('pagehide', save); };
  }, []);

  useEffect(() => {
    if (battleResult === null || battleStep >= battleResult.turns.length) return;
    const id = window.setTimeout(() => setBattleStep((step) => step + 1), 520);
    return () => window.clearTimeout(id);
  }, [battleResult, battleStep]);

  const commit = (next: MinuteVanguardState, message?: string) => {
    stateRef.current = next;
    setState(next);
    if (message !== undefined) setNotice(message);
    void session.save(next);
  };

  if (state === null) return <main className="boot-screen"><span className="boot-spinner">◆</span><p>冒険を読み込んでいます</p></main>;

  const stats = playerCombatStats(state);
  const job = currentJob(state);
  const gold = Math.floor(goldBalance(state));
  const gems = Math.floor(gemBalance(state));
  const expNeeded = expRequiredForNextLevel(state.gameData.player.level);
  const selectedItem = selectedItemId === null ? undefined : state.gameData.inventory[selectedItemId];

  const onFight = () => {
    const result = fight(state);
    if (!result.accepted) {
      setNotice(`あと ${battleCooldown(state).remainingSec}秒 待つ必要があります`);
      return;
    }
    const latest = result.state.gameData.lastBattle;
    commit(result.state);
    if (latest !== null) {
      setBattleResult(latest);
      setBattleStep(0);
    }
  };

  return (
    <div className="game-viewport">
      <header className="global-header">
        <div className="profile-row">
          <div className="hero-portrait" aria-hidden="true">{job.id === 'job.mage' ? '🧙' : job.id === 'job.priest' ? '🪄' : '🧑‍🚀'}</div>
          <div className="profile-main">
            <div className="name-line"><strong>{state.gameData.player.name}</strong><span>{job.displayName}</span><b>Lv.{state.gameData.player.level}</b></div>
            <div className="meter hp-meter"><span style={{ width: `${Math.min(100, state.gameData.player.currentHp / stats.hp * 100)}%` }} /><em>HP {state.gameData.player.currentHp.toLocaleString()} / {stats.hp.toLocaleString()}</em></div>
            <div className="header-actions-row">
              <button className="heal-button" onClick={() => {
                const result = healAtInn(state);
                if (!result.accepted) setNotice(result.reason === 'already-full' ? 'HPは満タンです' : '回復するGoldが足りません');
                else commit(result.state, '宿屋でHPを全回復しました');
              }}>回復</button>
              <div className="meter exp-meter"><span style={{ width: `${Math.min(100, state.gameData.player.exp / expNeeded * 100)}%` }} /><em>EXP {state.gameData.player.exp.toLocaleString()} / {expNeeded.toLocaleString()}</em></div>
            </div>
          </div>
          <button className="menu-button" onClick={() => setModal('menu')} aria-label="メニュー">☰</button>
        </div>
        <div className="wallet-row"><strong>◉ {gold.toLocaleString()}</strong><button onClick={() => setTab('shop')}>💎 {gems.toLocaleString()} <span>＋購入</span></button></div>
      </header>

      <div className="content-scroll">
        {tab === 'battle' && <BattleTab state={state} notice={notice} onFight={onFight} onRare={() => {
          const result = activateRareGuarantee(state);
          if (!result.accepted) setNotice(result.reason === 'already-active' ? 'レア確定はすでに有効です' : 'ジェムが足りません');
          else commit(result.state, '次の戦闘はレア以上が確定しました');
        }} onSkip={() => {
          const result = skipBattleCooldown(state);
          if (!result.accepted) setNotice('クールダウンをスキップできません');
          else commit(result.state, '待ち時間をスキップしました');
        }} onMission={() => setModal('mission')} onJob={() => setModal('job')} />}
        {tab === 'equipment' && <EquipmentView state={state} active={equipmentTab} setActive={setEquipmentTab} onSelect={setSelectedItemId} onBuy={(definitionId) => {
          const result = buyEquipment(state, definitionId);
          if (!result.accepted) setNotice('購入に必要なGoldが足りません');
          else commit(result.state, '装備を購入しました');
        }} onOrbDraw={(count) => {
          const result = drawOrb(state, count);
          if (!result.accepted) setNotice('オーブガチャに必要なジェムが足りません');
          else commit(result.state, `${count}個のオーブを獲得しました`);
        }} onPetToggle={(enemyId, active) => {
          const result = setActivePet(state, enemyId, active);
          if (!result.accepted) setNotice(result.reason === 'party-full' ? '編成枠がいっぱいです' : 'そのペットは未所持です');
          else commit(result.state, active ? 'ペットを編成しました' : 'ペットを編成から外しました');
        }} />}
        {tab === 'shop' && <ShopView state={state} onBuy={(upgradeId) => {
          const result = buyPermanentUpgrade(state, upgradeId);
          if (!result.accepted) setNotice(result.reason === 'already-owned' ? '購入済みです' : 'ジェムが足りません');
          else commit(result.state, '恒久アップグレードを購入しました');
        }} />}
        {tab === 'collection' && <CollectionView state={state} />}
        {tab === 'ranking' && <RankingView state={state} />}
      </div>

      <nav className="bottom-nav" aria-label="メインナビゲーション">
        <NavButton icon="🛒" label="ショップ" active={tab === 'shop'} onClick={() => setTab('shop')} />
        <NavButton icon="⚔" label="装備" active={tab === 'equipment'} onClick={() => setTab('equipment')} />
        <NavButton icon="⚔️" label="バトル" active={tab === 'battle'} onClick={() => setTab('battle')} primary />
        <NavButton icon="📖" label="コレクション" active={tab === 'collection'} onClick={() => setTab('collection')} />
        <NavButton icon="♛" label="ランキング" active={tab === 'ranking'} onClick={() => setTab('ranking')} />
      </nav>

      {battleResult !== null && <BattleResultModal result={battleResult} step={battleStep} jobName={job.displayName} onClose={() => setBattleResult(null)} />}
      {selectedItem !== undefined && selectedItem.data !== undefined && <ItemModal state={state} itemId={selectedItem.instanceId} data={selectedItem.data} onClose={() => setSelectedItemId(null)} onEquip={() => {
        const result = equipOwnedItem(state, selectedItem.instanceId);
        if (result.accepted) commit(result.state, '装備を変更しました');
      }} onUpgrade={() => {
        const result = upgradeItem(state, selectedItem.instanceId);
        if (!result.accepted) setNotice(result.reason === 'max-rank' ? '強化上限です' : result.reason === 'orb-not-upgradeable' ? 'オーブは通常強化できません' : 'Goldが足りません');
        else commit(result.state, '装備を強化しました');
      }} onDiscard={() => {
        const result = discardItem(state, selectedItem.instanceId);
        if (result.accepted) { commit(result.state, '装備を破棄しました'); setSelectedItemId(null); }
      }} />}
      {modal === 'mission' && <MissionModal state={state} onClose={() => setModal(null)} onClaim={(missionId) => {
        const result = claimDailyMission(state, missionId);
        if (!result.accepted) setNotice(result.reason === 'already-claimed' ? '受取済みです' : 'まだ達成していません');
        else commit(result.state, 'デイリーミッション報酬を受け取りました');
      }} />}
      {modal === 'job' && <JobModal state={state} onClose={() => setModal(null)} onChange={(jobId) => {
        const result = changeJob(state, jobId);
        if (!result.accepted) setNotice(result.reason === 'level-too-low' ? '転職にはLv.30が必要です' : result.reason === 'insufficient-gold' ? '転職費用が足りません' : 'この職業はまだ解放されていません');
        else { commit(result.state, '転職しました'); setModal(null); }
      }} />}
      {modal === 'menu' && <MenuModal onClose={() => setModal(null)} onReset={async () => {
        if (!window.confirm('セーブデータを削除して最初から始めますか？')) return;
        const reset = await session.reset();
        commit(reset, '最初から始めました');
        setModal(null);
      }} />}
    </div>
  );
}

function BattleTab(props: Readonly<{ state: MinuteVanguardState; notice: string; onFight: () => void; onRare: () => void; onSkip: () => void; onMission: () => void; onJob: () => void }>) {
  const { state } = props;
  const cooldown = battleCooldown(state);
  const skipCost = cooldownSkipCost(state);
  const last = state.gameData.lastBattle;
  return <section className="battle-page page-section">
    <div className="section-tabs"><button className="active">⚔ モンスター戦</button><button disabled>🏆 チャンプ戦</button></div>
    <div className="battle-control-card">
      <div className="monster-level-row"><span>モンスターレベル</span><strong>{state.gameData.player.level >= 30 ? 2 : 1}</strong><span className="online-dot">● 1人プレイ</span></div>
      <div className="battle-illustration">
        <div className="battle-sigil">⚔</div>
        <p>{state.gameData.victories < 10 ? `初心者ボーナス：あと ${10 - state.gameData.victories}体は5秒待機` : `通常待機 ${effectiveBattleCooldownSec(state)}秒`}</p>
        {state.gameData.rareGuaranteeActive && <strong className="rare-active">次戦：RARE以上確定</strong>}
      </div>
      <button className="fight-button" onClick={props.onFight} disabled={!cooldown.ready}>
        {cooldown.ready ? <><b>⚔ 戦闘する</b><span>1戦だけ挑む</span></> : <><b>{cooldown.remainingSec}秒</b><span>次の戦闘まで</span></>}
      </button>
      {!cooldown.ready && <button className="skip-button" onClick={props.onSkip}>💎 {skipCost} で待ち時間をスキップ</button>}
      <button className={`rare-button ${state.gameData.rareGuaranteeActive ? 'active' : ''}`} onClick={props.onRare} disabled={state.gameData.rareGuaranteeActive}>💎10 レア確定</button>
    </div>

    {last !== null && <div className="last-result-card">
      <div><span className={`rarity-label rarity-${last.enemyRarity}`}>{last.enemyRarity.toUpperCase()}</span><strong>{last.enemyName}</strong></div>
      <div className={`result-badge ${last.outcome}`}>{last.outcome === 'victory' ? '勝利' : last.outcome === 'draw' ? '引き分け' : '敗北'}</div>
      <small>{last.goldDelta >= 0 ? `+${last.goldDelta.toLocaleString()}G` : `${last.goldDelta.toLocaleString()}G`} / +{last.expGained.toLocaleString()} EXP {last.gemGained > 0 ? `/ +${last.gemGained}💎` : ''}</small>
    </div>}

    <div className="quick-actions">
      <button onClick={props.onMission}><span>✓</span><small>ミッション</small><em>{Math.min(5, Number(state.gameData.missionProgress.battles >= 3) + Number(state.gameData.missionProgress.wins >= 2) + Number(state.gameData.missionProgress.upgrades >= 1) + Number(state.gameData.player.level >= 5) + Number(state.gameData.discoveredEnemyIds.length >= 3))}/5</em></button>
      <button onClick={props.onJob}><span>♻</span><small>転職</small>{state.gameData.player.level >= 30 && <em>!</em>}</button>
      <button disabled title="ミミック銀行は確率仕様を確認してから接続します"><span>🎭</span><small>ミミック銀行</small></button>
    </div>
    {props.notice && <p className="inline-notice" role="status">{props.notice}</p>}
  </section>;
}

function EquipmentView(props: Readonly<{ state: MinuteVanguardState; active: EquipmentTab; setActive: (tab: EquipmentTab) => void; onSelect: (id: string) => void; onBuy: (definitionId: string) => void; onOrbDraw: (count: 1 | 10) => void; onPetToggle: (enemyId: string, active: boolean) => void }>) {
  const { state } = props;
  const inventory = Object.values(state.gameData.inventory).filter((item) => item.data?.kind === props.active);
  return <section className="page-section equipment-page">
    <h1>装備</h1>
    <div className="equipment-slots">
      {(['weapon', 'armor', 'orb'] as const).map((slot) => <EquippedChip key={slot} state={state} slot={slot} onSelect={props.onSelect} />)}
    </div>
    <div className="subtabs">
      <button className={props.active === 'weapon' ? 'active' : ''} onClick={() => props.setActive('weapon')}>武器</button>
      <button className={props.active === 'armor' ? 'active' : ''} onClick={() => props.setActive('armor')}>防具</button>
      <button className={props.active === 'orb' ? 'active' : ''} onClick={() => props.setActive('orb')}>オーブ</button>
      <button className={props.active === 'pet' ? 'active' : ''} onClick={() => props.setActive('pet')}>ペット</button>
    </div>

    {props.active === 'weapon' || props.active === 'armor' ? <>
      <h2 className="list-heading">所持装備</h2>
      <div className="item-list">
        {inventory.length === 0 && <p className="empty-state">まだ所持していません。下の商品をGoldで購入できます。</p>}
        {inventory.map((item) => item.data && <OwnedItemRow key={item.instanceId} state={state} itemId={item.instanceId} data={item.data} onClick={() => props.onSelect(item.instanceId)} />)}
      </div>
      <h2 className="list-heading">購入できる装備</h2>
      <div className="item-list">
        {shopEquipmentOffers.filter((offer) => offer.data.kind === props.active).map((offer) => <button className="shop-equipment-row" key={offer.itemDefinitionId} onClick={() => props.onBuy(offer.itemDefinitionId)}>
          <span className="equipment-icon">{offer.data.kind === 'weapon' ? '⚔' : '🛡'}</span>
          <span><strong>{itemDefinitions[offer.itemDefinitionId]?.displayName}</strong><small>{formatFlatStats(offer.data.flatStats)}</small></span>
          <em>{offer.price.toLocaleString()} G</em>
        </button>)}
      </div>
    </> : props.active === 'orb' ? <OrbView state={state} inventory={inventory} onSelect={props.onSelect} onDraw={props.onOrbDraw} /> : <PetView state={state} onToggle={props.onPetToggle} />}
  </section>;
}

function ShopView(props: Readonly<{ state: MinuteVanguardState; onBuy: (id: PermanentUpgradeId) => void }>) {
  return <section className="page-section shop-page">
    <h1>ショップ</h1>
    <div className="subtabs"><button className="active">恒久強化</button><button>タイムブースト</button><button>ジェム</button></div>
    <p className="shop-lead">一度買えばずっと有効。装備の購入は「装備」タブで行います。</p>
    <div className="upgrade-list">
      {permanentUpgradeDefinitions.map((upgrade) => {
        const owned = props.state.gameData.permanentUpgrades[upgrade.id];
        return <button key={upgrade.id} className="upgrade-card" onClick={() => props.onBuy(upgrade.id)} disabled={owned}>
          <span className="upgrade-icon">◆</span><span><strong>{upgrade.label}</strong><small>{upgrade.description}</small></span><em>{owned ? '購入済' : `💎 ${upgrade.price.toLocaleString()}`}</em>
        </button>;
      })}
    </div>
    <div className="gold-bag-card"><strong>ゴールド袋</strong><p>直近の戦果に応じたGoldをジェムでまとめて受け取る機能。</p><button disabled>戦果データ準備中</button></div>
  </section>;
}

function CollectionView({ state }: Readonly<{ state: MinuteVanguardState }>) {
  return <section className="page-section collection-page">
    <h1>コレクション</h1>
    <div className="collection-summary"><div><strong>{state.gameData.discoveredEnemyIds.length}</strong><span>/ {enemies.length} 発見</span></div><div><strong>{Object.values(state.gameData.killCounts).reduce((sum, count) => sum + count, 0)}</strong><span>総討伐</span></div></div>
    <div className="encyclopedia-grid">
      {enemies.map((enemy) => {
        const seen = state.gameData.discoveredEnemyIds.includes(enemy.id);
        const kills = state.gameData.killCounts[enemy.id] ?? 0;
        return <article className={`monster-card ${seen ? '' : 'locked'}`} key={enemy.id}>
          <span className="monster-glyph">{seen ? enemy.glyph : '?'}</span>
          <strong>{seen ? enemy.displayName : '???'}</strong>
          <small>{seen ? `${enemy.rarity.toUpperCase()} · 討伐 ${kills}` : '未発見'}</small>
          {seen && <em>{kills >= 30 ? '捕獲解禁' : `捕獲まで ${30 - kills}`}</em>}
        </article>;
      })}
    </div>
  </section>;
}

function RankingView({ state }: Readonly<{ state: MinuteVanguardState }>) {
  const rows = [
    { name: '風見の勇者', level: Math.max(42, state.gameData.player.level + 18) },
    { name: '寝不足騎士', level: Math.max(31, state.gameData.player.level + 11) },
    { name: state.gameData.player.name, level: state.gameData.player.level, you: true },
    { name: 'スライム係', level: Math.max(1, state.gameData.player.level - 2) },
  ].sort((a, b) => b.level - a.level);
  return <section className="page-section ranking-page">
    <h1>ランキング</h1><div className="subtabs"><button className="active">レベル</button><button>討伐数</button><button>転職</button><button>図鑑</button></div>
    <p className="offline-label">LOCAL PROTOTYPE · サーバーランキングは未接続</p>
    <div className="ranking-list">{rows.map((row, index) => <div className={`rank-row ${row.you ? 'you' : ''}`} key={row.name}><b>{index + 1}</b><span>🧑‍🚀</span><strong>{row.name}{row.you ? '（あなた）' : ''}</strong><em>Lv.{row.level}</em></div>)}</div>
  </section>;
}

function BattleResultModal(props: Readonly<{ result: BattleResult; step: number; jobName: string; onClose: () => void }>) {
  const currentTurn = props.step === 0 ? undefined : props.result.turns[Math.min(props.step - 1, props.result.turns.length - 1)];
  const playerHp = currentTurn?.playerHpAfter ?? props.result.playerHpStart;
  const enemyHp = currentTurn?.enemyHpAfter ?? props.result.enemyHpMax;
  const complete = props.step >= props.result.turns.length;
  return <div className="modal-backdrop battle-modal-backdrop"><section className="battle-result-modal">
    <div className="battle-stage">
      <Combatant side="enemy" name={props.result.enemyName} glyph={props.result.enemyGlyph} hp={enemyHp} maxHp={props.result.enemyHpMax} attacking={currentTurn !== undefined && currentTurn.enemyDamage > 0} hit={currentTurn !== undefined && currentTurn.playerDamage + currentTurn.playerExtraDamage + currentTurn.petDamage > 0} defeated={enemyHp <= 0} />
      <span className="vs-mark">VS</span>
      <Combatant side="player" name={props.jobName} glyph="🧑‍🚀" hp={playerHp} maxHp={props.result.playerHpMax} attacking={currentTurn !== undefined && currentTurn.playerDamage > 0} hit={currentTurn !== undefined && currentTurn.enemyDamage > 0} defeated={playerHp <= 0} />
    </div>
    <div className="turn-log">
      <div className="turn-log-title">BATTLE LOG <span>{Math.min(props.step, props.result.turns.length)} / {props.result.turns.length}</span></div>
      {props.result.turns.slice(0, props.step).slice(-5).flatMap((turn) => turn.logs.map((line, index) => <p key={`${turn.turn}-${index}`}><b>T{turn.turn}</b>{line}</p>))}
    </div>
    {complete && <div className={`battle-reward-panel ${props.result.outcome}`}>
      <h2>{props.result.outcome === 'victory' ? 'VICTORY' : props.result.outcome === 'draw' ? 'DRAW' : 'DEFEAT'}</h2>
      <div className="reward-row"><span>{props.result.goldDelta >= 0 ? `+${props.result.goldDelta.toLocaleString()} G` : `${props.result.goldDelta.toLocaleString()} G`}</span><span>+{props.result.expGained.toLocaleString()} EXP</span>{props.result.gemGained > 0 && <span>+{props.result.gemGained} 💎</span>}</div>
      {props.result.streakMultiplier > 1 && <p>🔥 {props.result.streak}連続討伐 ×{props.result.streakMultiplier}</p>}
      {props.result.jackpotMultiplier > 1 && <p className="gold-highlight">JACKPOT ×{props.result.jackpotMultiplier}</p>}
      {props.result.permanentStatReward && <p className="purple-highlight">恒久 {STAT_LABELS[props.result.permanentStatReward.stat]} +{props.result.permanentStatReward.amount}</p>}
      {props.result.levelGrowths.map((growth) => <p key={growth.level} className={growth.greatGrowth ? 'great-growth' : ''}>Lv.{growth.level} UP {growth.greatGrowth ? '★ 大成長！' : ''}</p>)}
      {(props.result.droppedItemInstanceId || props.result.droppedOrbInstanceId) && <p>🎁 ドロップを獲得しました</p>}
      {props.result.capturedPetEnemyId && <p className="pet-capture-highlight">🐾 モンスターがなついて仲間になった！</p>}
      <button className="modal-primary" onClick={props.onClose}>閉じる</button>
    </div>}
  </section></div>;
}

function Combatant(props: Readonly<{ side: 'enemy' | 'player'; name: string; glyph: string; hp: number; maxHp: number; attacking: boolean; hit: boolean; defeated: boolean }>) {
  return <div className={`combatant ${props.side} ${props.attacking ? 'attacking' : ''} ${props.hit ? 'hit' : ''} ${props.defeated ? 'defeated' : ''}`}>
    <small>{props.side === 'enemy' ? 'MONSTER' : 'YOU'}</small><div className="combat-sprite">{props.glyph}</div><strong>{props.name}</strong>
    <div className="battle-hp"><span style={{ width: `${Math.max(0, props.hp / props.maxHp * 100)}%` }} /></div><em>{Math.max(0, props.hp)} / {props.maxHp}</em>
  </div>;
}

function EquippedChip(props: Readonly<{ state: MinuteVanguardState; slot: 'weapon' | 'armor' | 'orb'; onSelect: (id: string) => void }>) {
  const itemId = props.state.gameData.loadout.equipped[props.slot];
  const item = itemId ? props.state.gameData.inventory[itemId] : undefined;
  return <button className="equipped-chip" disabled={!itemId} onClick={() => itemId && props.onSelect(itemId)}><span>{props.slot === 'weapon' ? '⚔' : props.slot === 'armor' ? '🛡' : '🔮'}</span><small>{props.slot === 'weapon' ? '武器' : props.slot === 'armor' ? '防具' : 'オーブ'}</small><strong>{item ? itemDefinitions[item.definitionId]?.displayName : 'なし'}</strong>{item?.data?.orbRank && <em>{item.data.orbRank}</em>}</button>;
}

function OwnedItemRow(props: Readonly<{ state: MinuteVanguardState; itemId: string; data: EquipmentData; onClick: () => void }>) {
  const item = props.state.gameData.inventory[props.itemId]!;
  const equipped = Object.values(props.state.gameData.loadout.equipped).includes(props.itemId);
  return <button className={`owned-item-row rarity-${props.data.rarity}`} onClick={props.onClick}><span className="equipment-icon">{props.data.kind === 'weapon' ? '⚔' : props.data.kind === 'armor' ? '🛡' : '🔮'}</span><span><strong>{itemDefinitions[item.definitionId]?.displayName} {props.data.upgradeRank > 0 ? `+${props.data.upgradeRank}` : ''}</strong><small>{props.data.kind === 'orb' ? `${props.data.orbRank} · 合計 ${sumPercent(props.data)}%` : formatFlatStats(props.data.flatStats)}</small></span>{equipped && <em>装備中</em>}</button>;
}

function OrbView(props: Readonly<{ state: MinuteVanguardState; inventory: readonly { instanceId: string; definitionId: string; quantity: number; data?: EquipmentData }[]; onSelect: (id: string) => void; onDraw: (count: 1 | 10) => void }>) {
  return <div className="orb-view"><div className="orb-list">{props.inventory.length === 0 && <p className="empty-state">オーブはモンスターから低確率で落ちるほか、ジェムでも引けます。</p>}{props.inventory.map((item) => item.data && <OwnedItemRow key={item.instanceId} state={props.state} itemId={item.instanceId} data={item.data} onClick={() => props.onSelect(item.instanceId)} />)}</div><div className="orb-bottom-actions"><button onClick={() => props.onDraw(1)}>1回<br/><b>💎100</b></button><button onClick={() => props.onDraw(10)}>10連<br/><b>💎1,000</b></button><button disabled>合成する</button></div></div>;
}

function PetView(props: Readonly<{ state: MinuteVanguardState; onToggle: (enemyId: string, active: boolean) => void }>) {
  const owned = props.state.gameData.ownedPetEnemyIds.map((id) => enemies.find((enemy) => enemy.id === id)).filter((enemy): enemy is (typeof enemies)[number] => enemy !== undefined);
  const activeLimit = currentJob(props.state).id === 'job.tamer' ? 2 : 1;
  return <div className="pet-view">
    <div className="pet-party-summary"><span>参戦中</span><strong>{props.state.gameData.activePetEnemyIds.length} / {activeLimit}</strong><small>同じモンスターを30体倒すと捕獲が解禁。以後、勝利時1%で仲間になります。</small></div>
    {owned.length === 0 ? <p className="empty-state">まだペットはいません。図鑑で30体討伐したモンスターを狙ってください。</p> : <div className="pet-list">{owned.map((enemy) => {
      const active = props.state.gameData.activePetEnemyIds.includes(enemy.id);
      const kills = props.state.gameData.killCounts[enemy.id] ?? 0;
      return <button key={enemy.id} className={`pet-row ${active ? 'active' : ''}`} onClick={() => props.onToggle(enemy.id, !active)}>
        <span className="pet-glyph">{enemy.glyph}</span><span><strong>{enemy.displayName}</strong><small>{enemy.rarity.toUpperCase()} · 討伐 {kills}</small></span><em>{active ? '参戦中' : '編成する'}</em>
      </button>;
    })}</div>}
  </div>;
}

function ItemModal(props: Readonly<{ state: MinuteVanguardState; itemId: string; data: EquipmentData; onClose: () => void; onEquip: () => void; onUpgrade: () => void; onDiscard: () => void }>) {
  const item = props.state.gameData.inventory[props.itemId]!;
  const equipped = Object.values(props.state.gameData.loadout.equipped).includes(props.itemId);
  return <ModalFrame title={itemDefinitions[item.definitionId]?.displayName ?? '装備'} onClose={props.onClose}>
    <div className={`item-detail-hero rarity-${props.data.rarity}`}><span>{props.data.kind === 'weapon' ? '⚔' : props.data.kind === 'armor' ? '🛡' : '🔮'}</span><strong>{props.data.kind === 'orb' ? `${props.data.orbRank} オーブ` : props.data.rarity.toUpperCase()}</strong></div>
    {props.data.kind === 'orb' ? <><StatTable data={props.data.percentStats ?? {}} suffix="%" />{props.data.effectId && <p className="effect-line">特殊効果：{effectLabel(props.data.effectId)} +{props.data.effectValue}{props.data.effectId === 'cooldown' ? '秒短縮' : '%'}</p>}</> : <StatTable data={props.data.flatStats} prefix="+" />}
    <div className="modal-actions"><button className="modal-primary" onClick={props.onEquip}>{equipped ? '装備中' : '装備する'}</button>{props.data.kind !== 'orb' && <button onClick={props.onUpgrade} disabled={props.data.upgradeRank >= 5}>強化する +{props.data.upgradeRank} → +{Math.min(5, props.data.upgradeRank + 1)}</button>}<button className="danger-button" onClick={props.onDiscard}>破棄する</button></div>
  </ModalFrame>;
}

function MissionModal(props: Readonly<{ state: MinuteVanguardState; onClose: () => void; onClaim: (missionId: string) => void }>) {
  const entries = [
    ['battles', 'バトルを3回する', props.state.gameData.missionProgress.battles, 3, 3],
    ['wins', '2回勝利する', props.state.gameData.missionProgress.wins, 2, 3],
    ['upgrades', '装備を1回強化する', props.state.gameData.missionProgress.upgrades, 1, 4],
    ['level', 'Lv.5に到達する', props.state.gameData.player.level, 5, 5],
    ['discoveries', 'モンスターを3種発見する', props.state.gameData.discoveredEnemyIds.length, 3, 5],
  ] as const;
  return <ModalFrame title="デイリーミッション" onClose={props.onClose}><p className="modal-description">毎日0時(JST)に更新。5個達成・受取で合計20ジェム。</p><div className="mission-list">{entries.map(([id, label, value, target, reward]) => {
    const done = value >= target;
    const claimed = props.state.gameData.missionProgress.claimed.includes(id);
    return <div key={id} className={done ? 'done' : ''}><span>{claimed ? '✓' : done ? '!' : '○'}</span><strong>{label}</strong><small>{Math.min(value, target)} / {target}</small><button disabled={!done || claimed} onClick={() => props.onClaim(id)}>{claimed ? '受取済' : `💎${reward} 受取`}</button></div>;
  })}</div></ModalFrame>;
}

function JobModal(props: Readonly<{ state: MinuteVanguardState; onClose: () => void; onChange: (jobId: string) => void }>) {
  const cost = jobChangeCost(props.state);
  const requirement = currentJobBonusRequirement(props.state);
  return <ModalFrame title="転職" onClose={props.onClose}><div className="job-summary"><span>現在 Lv.{props.state.gameData.player.level}</span><strong>{currentJob(props.state).displayName}</strong><small>永続ボーナス条件 Lv.{requirement} / 費用 {cost.toLocaleString()}G</small></div><div className="job-list">{availableJobs(props.state).map((job) => <button key={job.id} onClick={() => props.onChange(job.id)} disabled={props.state.gameData.player.level < 30 || goldBalance(props.state) < cost}><span>♟</span><span><strong>{job.displayName}</strong><small>{job.skillName} — {job.skillDescription}</small></span><em>選ぶ</em></button>)}</div><p className="modal-description">転職するとLv.1へ戻ります。装備・ジェム・討伐数は保持されます。</p></ModalFrame>;
}

function MenuModal(props: Readonly<{ onClose: () => void; onReset: () => void }>) {
  return <ModalFrame title="メニュー" onClose={props.onClose}><div className="menu-list"><button>？ 遊び方</button><button>💡 アイデア・要望</button><button>📜 アップデート履歴</button><button>⚙ 設定</button><button className="danger-button" onClick={props.onReset}>↻ データをリセット</button></div></ModalFrame>;
}

function ModalFrame(props: Readonly<{ title: string; onClose: () => void; children: React.ReactNode }>) {
  return <div className="modal-backdrop"><section className="sheet-modal"><header><h2>{props.title}</h2><button onClick={props.onClose}>×</button></header><div className="sheet-content">{props.children}</div></section></div>;
}

function StatTable(props: Readonly<{ data: Partial<Record<StatKey, number>>; prefix?: string; suffix?: string }>) {
  return <div className="stat-table">{(Object.keys(STAT_LABELS) as StatKey[]).map((key) => <div key={key}><span>{STAT_LABELS[key]}</span><strong>{props.prefix}{props.data[key] ?? 0}{props.suffix}</strong></div>)}</div>;
}

function NavButton(props: Readonly<{ icon: string; label: string; active: boolean; onClick: () => void; primary?: boolean }>) {
  return <button className={`${props.active ? 'active' : ''} ${props.primary ? 'primary' : ''}`} onClick={props.onClick}><span>{props.icon}</span><small>{props.label}</small></button>;
}

function formatFlatStats(stats: Partial<Record<StatKey, number>>): string {
  return (Object.keys(stats) as StatKey[]).filter((key) => (stats[key] ?? 0) !== 0).map((key) => `${STAT_LABELS[key]} +${stats[key]}`).join(' / ');
}

function sumPercent(data: EquipmentData): number {
  return Object.values(data.percentStats ?? {}).reduce((sum, value) => sum + (value ?? 0), 0);
}

function effectLabel(effectId: string): string {
  return ({ gemDrop: 'ジェムドロップ率', goldProtection: '敗北Gold保護', gold: '獲得Gold', exp: '獲得EXP', drawExp: '引き分けEXP', regen: '毎ターンHP回復', greatGrowth: '大成長率', critical: 'クリティカル率', evasion: '回避率', cooldown: 'クールダウン' } as Record<string, string>)[effectId] ?? effectId;
}

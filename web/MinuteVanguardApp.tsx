import { useEffect, useRef, useState } from 'react';
import type { PublicPlayerSnapshot } from 'idle-game-kit';
import { GameSession } from '../application/game-session';
import {
  createMinuteVanguardPublicData,
  MINUTE_VANGUARD_GAME_ID,
  type MinuteVanguardPublicData,
} from '../application/public-player-profile';
import {
  enemies,
  itemDefinitions,
  jobs,
  orbRanks,
  permanentUpgradeDefinitions,
  shopEquipmentOffers,
  type PermanentUpgradeId,
} from '../definitions/game-definitions';
import { TITLE_RESET_COST, TITLE_SHOP_PRICE, titleDefinitions, type MinuteVanguardTitleDefinition } from '../definitions/title-definitions';
import type { BattleResult, EquipmentData, MinuteVanguardState, StatKey, TimeBoostKind } from '../definitions/types';
import {
  activateRareGuarantee,
  advanceFromWallClock,
  availableJobs,
  battleCooldown,
  buyEquipment,
  buyPermanentUpgrade,
  buyDailyTitle,
  changeJob,
  claimDailyMission,
  combineOrb,
  cooldownSkipCost,
  canSkipBattleCooldown,
  currentJob,
  currentJobBonusRequirement,
  discardItem,
  drawOrb,
  dailyTitleOffers,
  effectiveBattleCooldownSec,
  expandOrbCapacity,
  equipOwnedItem,
  equipOwnedTitle,
  expRequiredForNextLevel,
  fight,
  gemBalance,
  goldBalance,
  moveEquippedTitle,
  healAtInn,
  jobChangeCost,
  orbCombineCost,
  orbFreeSlots,
  orbInventoryCount,
  orbRerollCost,
  playerCombatStats,
  purchaseTimeBoost,
  rerollOrbStats,
  resetEquippedTitles,
  setEquippedTitleLevel,
  timeBoostRemainingSec,
  setActivePet,
  skipBattleCooldown,
  toggleOrbFavorite,
  toggleOrbLock,
  toggleTitleFavorite,
  titleCostLimitForLevel,
  titleEquipCost,
  titleLevel,
  unequipOwnedTitle,
  upgradeItem,
} from '../plugin/engine';
import { publicPlayerDirectory } from './public-player-directory';

const session = new GameSession();
type MainTab = 'shop' | 'equipment' | 'battle' | 'collection' | 'ranking';
type EquipmentTab = 'weapon' | 'armor' | 'orb' | 'pet' | 'title';
type Modal = 'mission' | 'job' | 'menu' | 'orb-combine' | null;
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
          if (!result.accepted) setNotice(result.reason === 'insufficient-orb-slots' ? `空き枠が足りません（残り ${orbFreeSlots(state)}）` : 'オーブガチャに必要なジェムが足りません');
          else commit(result.state, `${count}個のオーブを獲得しました`);
        }} onOrbExpand={() => {
          const result = expandOrbCapacity(state);
          if (!result.accepted) setNotice('枠拡張に必要な100ジェムが足りません');
          else commit(result.state, `オーブ所持枠を ${result.state.gameData.orbCapacity} に拡張しました`);
        }} onCombineOpen={() => setModal('orb-combine')} onPetToggle={(enemyId, active) => {
          const result = setActivePet(state, enemyId, active);
          if (!result.accepted) setNotice(result.reason === 'party-full' ? '編成枠がいっぱいです' : 'そのペットは未所持です');
          else commit(result.state, active ? 'ペットを編成しました' : 'ペットを編成から外しました');
        }} onTitleEquip={(titleId, level) => {
          const result = equipOwnedTitle(state, titleId, level);
          if (!result.accepted) setNotice(result.reason === 'cost-limit' ? '肩書きコストが上限を超えます' : result.reason === 'slot-limit' ? '肩書きは5枠までです' : '肩書きを装備できません');
          else commit(result.state, '肩書きを装着しました');
        }} onTitleLevel={(titleId, level) => {
          const result = setEquippedTitleLevel(state, titleId, level);
          if (!result.accepted) setNotice('そのLvには変更できません');
          else commit(result.state, `肩書きをLv.${level}に変更しました`);
        }} onTitleMove={(titleId, targetIndex) => {
          const next = moveEquippedTitle(state, titleId, targetIndex);
          commit(next, '肩書きの順番を変更しました');
        }} onTitleUnequip={(titleId) => {
          const result = unequipOwnedTitle(state, titleId);
          if (!result.accepted) setNotice(`転職まで外せません。全解除は${TITLE_RESET_COST}ジェムです`);
          else commit(result.state, '肩書きを外しました');
        }} onTitleReset={() => {
          const result = resetEquippedTitles(state);
          if (!result.accepted) setNotice(`${TITLE_RESET_COST}ジェムが必要です`);
          else commit(result.state, '肩書きをすべて外しました');
        }} onTitleFavorite={(titleId) => commit(toggleTitleFavorite(state, titleId))} />}
        {tab === 'shop' && <ShopView state={state} onBuy={(upgradeId) => {
          const result = buyPermanentUpgrade(state, upgradeId);
          if (!result.accepted) setNotice(result.reason === 'already-owned' ? '購入済みです' : 'ジェムが足りません');
          else commit(result.state, '恒久アップグレードを購入しました');
        }} onBuyTimeBoost={(kind, durationSec) => {
          const result = purchaseTimeBoost(state, kind, durationSec);
          if (!result.accepted) setNotice(result.reason === 'already-active' ? '同じブーストは効果中です' : result.reason === 'insufficient-gems' ? 'ジェムが足りません' : result.reason === 'beginner-fast-cooldown' ? '初心者5秒区間ではラッシュタイムは使えません' : 'このブーストは購入できません');
          else commit(result.state, 'タイムブーストを開始しました');
        }} onBuyTitle={(titleId) => {
          const result = buyDailyTitle(state, titleId);
          if (!result.accepted) setNotice(result.reason === 'insufficient-gems' ? `${TITLE_SHOP_PRICE}ジェムが必要です` : '今日はこの肩書きを購入できません');
          else commit(result.state, '肩書きを1個獲得しました');
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
      }} onFavorite={() => {
        const result = toggleOrbFavorite(state, selectedItem.instanceId);
        if (result.accepted) commit(result.state, selectedItem.data?.favorite ? 'お気に入りを解除しました' : 'お気に入りに追加しました');
      }} onLock={() => {
        const result = toggleOrbLock(state, selectedItem.instanceId);
        if (result.accepted) commit(result.state, selectedItem.data?.locked ? 'ロックを解除しました' : 'オーブをロックしました');
      }} onReroll={(lockedStats) => {
        const result = rerollOrbStats(state, selectedItem.instanceId, lockedStats);
        if (!result.accepted) setNotice(result.reason === 'insufficient-gems' ? '再抽選に必要なジェムが足りません' : '再抽選できません');
        else commit(result.state, 'オーブのステータス配分を再抽選しました');
      }} onDiscard={() => {
        const result = discardItem(state, selectedItem.instanceId);
        if (!result.accepted) setNotice(result.reason === 'protected-item' ? 'ロックまたはお気に入り中のオーブは破棄できません' : '破棄できません');
        else { commit(result.state, '装備を破棄しました'); setSelectedItemId(null); }
      }} />}
      {modal === 'mission' && <MissionModal state={state} onClose={() => setModal(null)} onClaim={(missionId) => {
        const result = claimDailyMission(state, missionId);
        if (!result.accepted) setNotice(result.reason === 'already-claimed' ? '受取済みです' : 'まだ達成していません');
        else commit(result.state, 'デイリーミッション報酬を受け取りました');
      }} />}
      {modal === 'orb-combine' && <OrbCombineModal state={state} onClose={() => setModal(null)} onCombine={(parentId, materialIds) => {
        const result = combineOrb(state, parentId, materialIds);
        if (!result.accepted) setNotice(result.reason === 'insufficient-gold' ? '合成に必要なGoldが足りません' : '合成条件を満たしていません');
        else { commit(result.state, 'オーブをランクアップしました'); setModal(null); }
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
        <div className="active-boosts">
          {(['rush', 'exp', 'gold'] as const).map((kind) => {
            const remaining = timeBoostRemainingSec(state, kind);
            if (remaining <= 0) return null;
            return <span key={kind}>{kind === 'rush' ? '⚡RUSH' : kind === 'exp' ? '✦ EXP×2' : '◉ GOLD×2'} <b>{formatRemainingTime(remaining)}</b></span>;
          })}
        </div>
        {state.gameData.rareGuaranteeActive && <strong className="rare-active">次戦：RARE以上確定</strong>}
      </div>
      <button className="fight-button" onClick={props.onFight} disabled={!cooldown.ready}>
        {cooldown.ready ? <><b>⚔ 戦闘する</b><span>1戦だけ挑む</span></> : <><b>{cooldown.remainingSec}秒</b><span>次の戦闘まで</span></>}
      </button>
      {!cooldown.ready && canSkipBattleCooldown(state) && <button className="skip-button" onClick={props.onSkip}>💎 {skipCost} で待ち時間をスキップ</button>}
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

function EquipmentView(props: Readonly<{ state: MinuteVanguardState; active: EquipmentTab; setActive: (tab: EquipmentTab) => void; onSelect: (id: string) => void; onBuy: (definitionId: string) => void; onOrbDraw: (count: 1 | 10) => void; onOrbExpand: () => void; onCombineOpen: () => void; onPetToggle: (enemyId: string, active: boolean) => void; onTitleEquip: (titleId: string, level: number) => void; onTitleLevel: (titleId: string, level: number) => void; onTitleMove: (titleId: string, targetIndex: number) => void; onTitleUnequip: (titleId: string) => void; onTitleReset: () => void; onTitleFavorite: (titleId: string) => void }>) {
  const { state } = props;
  const inventory = props.active === 'weapon' || props.active === 'armor' || props.active === 'orb'
    ? Object.values(state.gameData.inventory).filter((item) => item.data?.kind === props.active)
    : [];
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
      <button className={props.active === 'title' ? 'active' : ''} onClick={() => props.setActive('title')}>肩書き</button>
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
    </> : props.active === 'orb' ? <OrbView state={state} inventory={inventory} onSelect={props.onSelect} onDraw={props.onOrbDraw} onExpand={props.onOrbExpand} onCombine={props.onCombineOpen} /> : props.active === 'pet' ? <PetView state={state} onToggle={props.onPetToggle} /> : <TitleView state={state} onEquip={props.onTitleEquip} onLevel={props.onTitleLevel} onMove={props.onTitleMove} onUnequip={props.onTitleUnequip} onReset={props.onTitleReset} onFavorite={props.onTitleFavorite} />}
  </section>;
}

function ShopView(props: Readonly<{ state: MinuteVanguardState; onBuy: (id: PermanentUpgradeId) => void; onBuyTimeBoost: (kind: TimeBoostKind, durationSec: 180 | 600 | 1800) => void; onBuyTitle: (titleId: string) => void }>) {
  const [active, setActive] = useState<'permanent' | 'boost' | 'title' | 'gem'>('permanent');
  return <section className="page-section shop-page">
    <h1>ショップ</h1>
    <div className="subtabs"><button className={active === 'permanent' ? 'active' : ''} onClick={() => setActive('permanent')}>恒久強化</button><button className={active === 'boost' ? 'active' : ''} onClick={() => setActive('boost')}>ブースト</button><button className={active === 'title' ? 'active' : ''} onClick={() => setActive('title')}>肩書き</button><button className={active === 'gem' ? 'active' : ''} onClick={() => setActive('gem')}>ジェム</button></div>
    {active === 'permanent' && <>
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
    </>}
    {active === 'boost' && <TimeBoostShop state={props.state} onBuy={props.onBuyTimeBoost} />}
    {active === 'title' && <DailyTitleShop state={props.state} onBuy={props.onBuyTitle} />}
    {active === 'gem' && <div className="empty-state">ソロ版ではジェム購入ストアを接続していません。</div>}
  </section>;
}

function DailyTitleShop(props: Readonly<{ state: MinuteVanguardState; onBuy: (titleId: string) => void }>) {
  const offers = dailyTitleOffers(props.state);
  return <div className="daily-title-shop">
    <div className="daily-title-shop-head"><strong>本日の肩書き</strong><span>JST 0:00更新</span><small>各1回 · 💎{TITLE_SHOP_PRICE}</small></div>
    {offers.length === 0 ? <p className="empty-state">全肩書きを極めています。</p> : <div className="daily-title-offers">{offers.map((definition) => {
      const purchased = props.state.gameData.titleShop.purchasedTitleIds.includes(definition.id);
      const level = titleLevel(props.state, definition.id);
      const copies = props.state.gameData.titles.copies[definition.id] ?? 0;
      return <article key={definition.id} className="daily-title-card">
        <span className="title-shop-icon">◇</span><div><strong>{definition.displayName}</strong><small>{definition.description}</small><em>Lv.{level} · {copies}/15個 · COST {definition.cost}</em></div>
        <button disabled={purchased} onClick={() => props.onBuy(definition.id)}>{purchased ? '購入済' : `💎 ${TITLE_SHOP_PRICE}`}</button>
      </article>;
    })}</div>}
  </div>;
}

function TimeBoostShop(props: Readonly<{ state: MinuteVanguardState; onBuy: (kind: TimeBoostKind, durationSec: 180 | 600 | 1800) => void }>) {
  const definitions: readonly { kind: TimeBoostKind; icon: string; label: string; description: string }[] = [
    { kind: 'rush', icon: '⚡', label: 'ラッシュタイム', description: '戦闘クールダウンを10秒に短縮。効果中はGemスキップ不可。' },
    { kind: 'exp', icon: '✦', label: 'EXPブースト', description: '戦闘で獲得するEXPを2倍にします。' },
    { kind: 'gold', icon: '◉', label: 'Goldブースト', description: '戦闘で獲得するGoldを2倍にします。' },
  ];
  const durations = [
    { durationSec: 180 as const, label: '3分', gemCost: 30 },
    { durationSec: 600 as const, label: '10分', gemCost: 100 },
    { durationSec: 1800 as const, label: '30分', gemCost: 300 },
  ];
  return <div className="time-boost-shop">
    <p className="shop-lead">効果中は同じブーストを買い足せません。別種類は同時に使えます。</p>
    {definitions.filter((definition) => !(definition.kind === 'rush' && effectiveBattleCooldownSec(props.state) === 5)).map((definition) => {
      const remaining = timeBoostRemainingSec(props.state, definition.kind);
      const active = remaining > 0;
      return <article className={`time-boost-card ${active ? 'active' : ''}`} key={definition.kind}>
        <header><span>{definition.icon}</span><div><strong>{definition.label}</strong><small>{definition.description}</small></div>{active && <em>{formatRemainingTime(remaining)}</em>}</header>
        <div className="time-boost-options">{durations.map((duration) => <button key={duration.durationSec} disabled={active} onClick={() => props.onBuy(definition.kind, duration.durationSec)}><strong>{duration.label}</strong><small>💎 {duration.gemCost}</small></button>)}</div>
      </article>;
    })}
  </div>;
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
  const [remoteStatus, setRemoteStatus] = useState<'disabled' | 'loading' | 'ready' | 'error'>(
    publicPlayerDirectory === null ? 'disabled' : 'loading',
  );
  const [remotePlayers, setRemotePlayers] = useState<readonly PublicPlayerSnapshot<MinuteVanguardPublicData>[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const own = createMinuteVanguardPublicData(state);

  useEffect(() => {
    if (publicPlayerDirectory === null) return;
    let cancelled = false;
    void publicPlayerDirectory.listPublicPlayers({ gameId: MINUTE_VANGUARD_GAME_ID, limit: 20 })
      .then((page) => {
        if (cancelled) return;
        setRemotePlayers(page.players);
        setRemoteStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setRemotePlayers([]);
        setRemoteStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  const selected = remotePlayers.find((player) => player.playerId === selectedPlayerId);
  return <section className="page-section ranking-page">
    <h1>ランキング</h1>
    <div className="subtabs"><button className="active">公開冒険者</button><button disabled>レベル</button><button disabled>討伐数</button><button disabled>図鑑</button></div>

    <div className="self-public-card">
      <span>あなた</span><strong>{state.gameData.player.name}</strong><em>Lv.{own.level} · {jobDisplayName(own.jobId)}</em>
      <small>{own.victories.toLocaleString()}勝 / 図鑑 {own.discoveredEnemyCount}/{enemies.length} / ペット {own.ownedPetCount}</small>
    </div>

    {remoteStatus === 'disabled' && <p className="offline-label">SOLO MODE · 公開プレイヤーAPI未設定。ゲーム進行には影響しません。</p>}
    {remoteStatus === 'loading' && <p className="offline-label">公開冒険者を読み込んでいます…</p>}
    {remoteStatus === 'error' && <p className="offline-label error">公開冒険者を取得できません。ソロプレイはそのまま続けられます。</p>}
    {remoteStatus === 'ready' && remotePlayers.length === 0 && <p className="empty-state">公開中の冒険者はまだいません。</p>}

    <div className="ranking-list">{remotePlayers.map((player) => <button
      className={`rank-row public-player-row ${selectedPlayerId === player.playerId ? 'selected' : ''}`}
      key={player.playerId}
      onClick={() => setSelectedPlayerId((current) => current === player.playerId ? null : player.playerId)}
    >
      <b>•</b><span>🧑‍🚀</span><strong>{player.displayName}<small>{jobDisplayName(player.data.jobId)} · {player.data.victories.toLocaleString()}勝</small></strong><em>Lv.{player.data.level}</em>
    </button>)}</div>

    {selected !== undefined && <div className="public-player-detail">
      <header><span>公開プロフィール</span><strong>{selected.displayName}</strong><em>Lv.{selected.data.level}</em></header>
      <div className="public-player-stats">
        <div><span>職業</span><strong>{jobDisplayName(selected.data.jobId)}</strong></div>
        <div><span>転職</span><strong>{selected.data.totalJobChanges}回</strong></div>
        <div><span>勝利</span><strong>{selected.data.victories.toLocaleString()}</strong></div>
        <div><span>戦闘</span><strong>{selected.data.totalBattles.toLocaleString()}</strong></div>
        <div><span>図鑑</span><strong>{selected.data.discoveredEnemyCount}/{enemies.length}</strong></div>
        <div><span>ペット</span><strong>{selected.data.ownedPetCount}</strong></div>
      </div>
      <div className="public-loadout"><span>⚔ {selected.data.equippedWeaponName ?? '装備なし'}</span><span>🛡 {selected.data.equippedArmorName ?? '装備なし'}</span><span>🔮 {selected.data.equippedOrbRank === null ? 'オーブなし' : `${selected.data.equippedOrbRank}オーブ`}</span></div>
    </div>}
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
      {props.result.droppedTitleId && <p className="title-drop-highlight">◇ 肩書き「{titleDefinitions.find((definition) => definition.id === props.result.droppedTitleId)?.displayName ?? '???'}」{props.result.titleCopyAdded ? 'を獲得！' : 'はLv.5のため増えなかった'}</p>}
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
  return <button className={`owned-item-row rarity-${props.data.rarity}`} onClick={props.onClick}><span className="equipment-icon">{props.data.kind === 'weapon' ? '⚔' : props.data.kind === 'armor' ? '🛡' : '🔮'}</span><span><strong>{props.data.favorite ? '★ ' : ''}{props.data.locked ? '🔒 ' : ''}{itemDefinitions[item.definitionId]?.displayName} {props.data.upgradeRank > 0 ? `+${props.data.upgradeRank}` : ''}</strong><small>{props.data.kind === 'orb' ? `${props.data.orbRank} · 合計 ${sumPercent(props.data)}%` : formatFlatStats(props.data.flatStats)}</small></span>{equipped && <em>装備中</em>}</button>;
}

function OrbView(props: Readonly<{ state: MinuteVanguardState; inventory: readonly { instanceId: string; definitionId: string; quantity: number; data?: EquipmentData }[]; onSelect: (id: string) => void; onDraw: (count: 1 | 10) => void; onExpand: () => void; onCombine: () => void }>) {
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const sorted = [...props.inventory]
    .filter((item) => !favoriteOnly || item.data?.favorite === true)
    .sort((left, right) => Number(right.data?.favorite === true) - Number(left.data?.favorite === true));
  const used = orbInventoryCount(props.state);
  const free = orbFreeSlots(props.state);
  return <div className="orb-view">
    <div className="orb-toolbar">
      <div><strong>{used} / {props.state.gameData.orbCapacity}</strong><small>オーブ所持枠</small></div>
      <button className={favoriteOnly ? 'active' : ''} onClick={() => setFavoriteOnly((value) => !value)}>★ お気に入り</button>
      <button onClick={props.onExpand}>＋1枠 💎100</button>
    </div>
    <div className="orb-list">
      {sorted.length === 0 && <p className="empty-state">{favoriteOnly ? 'お気に入りのオーブはありません。' : 'オーブはモンスターから低確率で落ちるほか、ジェムでも引けます。'}</p>}
      {sorted.map((item) => item.data && <OwnedItemRow key={item.instanceId} state={props.state} itemId={item.instanceId} data={item.data} onClick={() => props.onSelect(item.instanceId)} />)}
    </div>
    <div className="orb-bottom-actions">
      <button onClick={() => props.onDraw(1)} disabled={free < 1}>1回<br/><b>💎100</b></button>
      <button onClick={() => props.onDraw(10)} disabled={free < 10}>10連<br/><b>💎1,000</b></button>
      <button onClick={props.onCombine}>合成する</button>
    </div>
  </div>;
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

function TitleView(props: Readonly<{ state: MinuteVanguardState; onEquip: (titleId: string, level: number) => void; onLevel: (titleId: string, level: number) => void; onMove: (titleId: string, targetIndex: number) => void; onUnequip: (titleId: string) => void; onReset: () => void; onFavorite: (titleId: string) => void }>) {
  const [query, setQuery] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [showUnowned, setShowUnowned] = useState(false);
  const cost = titleEquipCost(props.state);
  const costLimit = titleCostLimitForLevel(props.state.gameData.player.level);
  const equippedById = new Map(props.state.gameData.titles.equipped.map((entry, index) => [entry.titleId, { entry, index }] as const));
  const normalizedQuery = query.trim().toLowerCase();
  const visible = titleDefinitions
    .filter((definition) => {
      const owned = titleLevel(props.state, definition.id) > 0;
      if (!owned && !showUnowned && normalizedQuery.length === 0) return false;
      if (favoriteOnly && !props.state.gameData.favoriteTitleIds.includes(definition.id)) return false;
      if (normalizedQuery.length > 0 && !`${definition.displayName} ${definition.description}`.toLowerCase().includes(normalizedQuery)) return false;
      return true;
    })
    .sort((left, right) => {
      const favoriteDiff = Number(props.state.gameData.favoriteTitleIds.includes(right.id)) - Number(props.state.gameData.favoriteTitleIds.includes(left.id));
      if (favoriteDiff !== 0) return favoriteDiff;
      const ownedDiff = titleLevel(props.state, right.id) - titleLevel(props.state, left.id);
      return ownedDiff !== 0 ? ownedDiff : left.cost - right.cost;
    });

  return <div className="title-view">
    <div className="title-loadout-sticky">
      <div className="title-cost-line"><span>装着コスト</span><strong className={cost > costLimit ? 'over' : ''}>{cost} / {costLimit}</strong><small>5枠 · 変更は即保存</small></div>
      <div className="title-slots">{Array.from({ length: 5 }, (_, index) => {
        const equipped = props.state.gameData.titles.equipped[index];
        if (equipped === undefined) return <div className="title-slot empty" key={index}><b>{index + 1}</b><span>空き</span></div>;
        const definition = titleDefinitions.find((candidate) => candidate.id === equipped.titleId)!;
        const unlocked = titleLevel(props.state, equipped.titleId);
        return <article className="title-slot filled" key={equipped.titleId}>
          <b>{index + 1}</b><div><strong>{definition.displayName}</strong><small>Lv.{equipped.level} · COST {definition.cost}</small></div>
          <div className="title-slot-controls">
            <button disabled={equipped.level <= 1} onClick={() => props.onLevel(equipped.titleId, equipped.level - 1)}>−Lv</button>
            <button disabled={equipped.level >= unlocked} onClick={() => props.onLevel(equipped.titleId, equipped.level + 1)}>＋Lv</button>
            <button disabled={index === 0} onClick={() => props.onMove(equipped.titleId, index - 1)}>↑</button>
            <button disabled={index === props.state.gameData.titles.equipped.length - 1} onClick={() => props.onMove(equipped.titleId, index + 1)}>↓</button>
            <button className="remove" onClick={() => props.onUnequip(equipped.titleId)}>外す</button>
          </div>
        </article>;
      })}</div>
      {props.state.gameData.titles.equipped.length > 0 && <button className="title-reset" onClick={props.onReset}>{props.state.gameData.player.jobId === 'job.adventurer' ? 'すべて外す' : `💎${TITLE_RESET_COST} ですべて外す`}</button>}
    </div>

    <div className="title-filter-bar">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名前・効果で検索" aria-label="肩書きを検索" />
      <button className={favoriteOnly ? 'active' : ''} onClick={() => setFavoriteOnly((value) => !value)}>★</button>
      <button className={showUnowned ? 'active' : ''} onClick={() => setShowUnowned((value) => !value)}>未入手</button>
    </div>
    <div className="title-list">{visible.map((definition) => {
      const copies = props.state.gameData.titles.copies[definition.id] ?? 0;
      const unlocked = titleLevel(props.state, definition.id);
      const equipped = equippedById.get(definition.id);
      const favorite = props.state.gameData.favoriteTitleIds.includes(definition.id);
      return <article className={`title-card ${unlocked === 0 ? 'locked' : ''} ${equipped ? 'equipped' : ''}`} key={definition.id}>
        <button className={`title-favorite ${favorite ? 'active' : ''}`} onClick={() => props.onFavorite(definition.id)} disabled={unlocked === 0}>{favorite ? '★' : '☆'}</button>
        <div className="title-card-main"><strong>{unlocked > 0 ? definition.displayName : '???'}</strong><small>{unlocked > 0 ? formatTitleEffect(definition, equipped?.entry.level ?? unlocked) : '未入手'}</small><em>{unlocked > 0 ? `Lv.${unlocked} · ${copies}/15個 · COST ${definition.cost}` : `COST ${definition.cost}`}</em></div>
        {unlocked > 0 && (equipped ? <span className="title-equipped-label">装着 {equipped.index + 1}</span> : <button className="title-equip-button" onClick={() => props.onEquip(definition.id, unlocked)}>装着</button>)}
      </article>;
    })}</div>
    {visible.length === 0 && <p className="empty-state">条件に合う肩書きがありません。</p>}
  </div>;
}

function ItemModal(props: Readonly<{ state: MinuteVanguardState; itemId: string; data: EquipmentData; onClose: () => void; onEquip: () => void; onUpgrade: () => void; onFavorite: () => void; onLock: () => void; onReroll: (lockedStats: readonly StatKey[]) => void; onDiscard: () => void }>) {
  const [lockedStats, setLockedStats] = useState<StatKey[]>([]);
  const item = props.state.gameData.inventory[props.itemId]!;
  const equipped = Object.values(props.state.gameData.loadout.equipped).includes(props.itemId);
  const toggleRerollLock = (key: StatKey) => setLockedStats((current) => {
    if (current.includes(key)) return current.filter((candidate) => candidate !== key);
    if (current.length >= 3) return current;
    return [...current, key];
  });
  const protectedOrb = props.data.kind === 'orb' && (props.data.favorite === true || props.data.locked === true);
  return <ModalFrame title={itemDefinitions[item.definitionId]?.displayName ?? '装備'} onClose={props.onClose}>
    <div className={`item-detail-hero rarity-${props.data.rarity}`}><span>{props.data.kind === 'weapon' ? '⚔' : props.data.kind === 'armor' ? '🛡' : '🔮'}</span><strong>{props.data.kind === 'orb' ? `${props.data.orbRank} オーブ` : props.data.rarity.toUpperCase()}</strong></div>
    {props.data.kind === 'orb' ? <>
      <div className="orb-protection-actions"><button className={props.data.favorite ? 'active' : ''} onClick={props.onFavorite}>{props.data.favorite ? '★ お気に入り中' : '☆ お気に入り'}</button><button className={props.data.locked ? 'active' : ''} onClick={props.onLock}>{props.data.locked ? '🔒 ロック中' : '🔓 ロック'}</button></div>
      <StatTable data={props.data.percentStats ?? {}} suffix="%" />
      {props.data.effectId && <p className="effect-line">特殊効果：{effectLabel(props.data.effectId)} {formatEffectValue(props.data)}</p>}
      <div className="orb-reroll-panel"><div><strong>ステータス再抽選</strong><small>合計 {sumPercent(props.data)}% と特殊効果は維持。残す能力を3つまで固定できます。</small></div><div className="reroll-locks">{(Object.keys(STAT_LABELS) as StatKey[]).map((key) => <button key={key} className={lockedStats.includes(key) ? 'active' : ''} onClick={() => toggleRerollLock(key)}>{lockedStats.includes(key) ? '🔒' : '○'} {STAT_LABELS[key]} {props.data.percentStats?.[key] ?? 0}%</button>)}</div><button className="reroll-button" onClick={() => props.onReroll(lockedStats)}>💎{orbRerollCost(lockedStats)} で再抽選</button></div>
    </> : <StatTable data={props.data.flatStats} prefix="+" />}
    <div className="modal-actions"><button className="modal-primary" onClick={props.onEquip}>{equipped ? '装備中' : '装備する'}</button>{props.data.kind !== 'orb' && <button onClick={props.onUpgrade} disabled={props.data.upgradeRank >= 5}>強化する +{props.data.upgradeRank} → +{Math.min(5, props.data.upgradeRank + 1)}</button>}<button className="danger-button" onClick={props.onDiscard} disabled={protectedOrb}>{protectedOrb ? '保護中のため破棄不可' : '破棄する'}</button></div>
  </ModalFrame>;
}

function OrbCombineModal(props: Readonly<{ state: MinuteVanguardState; onClose: () => void; onCombine: (parentId: string, materialIds: readonly string[]) => void }>) {
  const [parentId, setParentId] = useState<string | null>(null);
  const [materialIds, setMaterialIds] = useState<string[]>([]);
  const orbs = Object.values(props.state.gameData.inventory).filter((item) => item.data?.kind === 'orb' && item.data.orbRank !== undefined);
  const parent = parentId === null ? undefined : props.state.gameData.inventory[parentId];
  const parentRank = parent?.data?.orbRank;
  const cost = parentRank === undefined ? null : orbCombineCost(parentRank);
  const equippedOrbId = props.state.gameData.loadout.equipped.orb;
  const materialCandidates = parentRank === undefined ? [] : orbs.filter((item) => item.instanceId !== parentId && item.data?.orbRank === parentRank);
  const matchingEffectCount = parent?.data?.effectId === undefined ? 0 : materialIds.filter((id) => props.state.gameData.inventory[id]?.data?.effectId === parent.data?.effectId).length;
  const chooseParent = (id: string) => { setParentId(id); setMaterialIds([]); };
  const toggleMaterial = (id: string) => setMaterialIds((current) => current.includes(id) ? current.filter((candidate) => candidate !== id) : current.length < 4 ? [...current, id] : current);
  return <ModalFrame title="オーブ合成" onClose={props.onClose}>
    <p className="modal-description">親1個＋同ランク素材4個。失敗なしで1ランク上昇し、親のID・特殊効果・装備状態は維持されます。ステータス配分は新ランクで引き直されます。</p>
    <h3 className="combine-heading">1. 合成先を選ぶ</h3>
    <div className="combine-orb-list">{orbs.map((item) => item.data && <button key={item.instanceId} className={parentId === item.instanceId ? 'active' : ''} disabled={item.data.orbRank === 'SSS'} onClick={() => chooseParent(item.instanceId)}><span>{item.data.favorite ? '★' : ''}{item.data.locked ? '🔒' : ''} 🔮</span><strong>{item.data.orbRank} · {sumPercent(item.data)}%</strong><small>{item.data.effectId ? `${effectLabel(item.data.effectId)} ${formatEffectValue(item.data)}` : '特殊効果なし'}{item.instanceId === equippedOrbId ? ' · 装備中' : ''}</small></button>)}</div>
    {parent !== undefined && parent.data !== undefined && <>
      <div className="combine-summary"><span>次ランク</span><strong>{nextOrbRank(parent.data.orbRank)}</strong><span>必要Gold</span><strong>{cost?.toLocaleString() ?? 'MAX'} G</strong><span>効果強化率</span><strong>{matchingEffectCount * 20}%</strong></div>
      <h3 className="combine-heading">2. 素材を4個選ぶ <small>{materialIds.length}/4</small></h3>
      <div className="combine-orb-list materials">{materialCandidates.map((item) => {
        const protectedMaterial = item.instanceId === equippedOrbId || item.data?.favorite === true || item.data?.locked === true;
        const selected = materialIds.includes(item.instanceId);
        return item.data && <button key={item.instanceId} className={selected ? 'active' : ''} disabled={protectedMaterial} onClick={() => toggleMaterial(item.instanceId)}><span>{selected ? `${materialIds.indexOf(item.instanceId) + 1}` : protectedMaterial ? '🔒' : '○'}</span><strong>{item.data.orbRank} · {sumPercent(item.data)}%</strong><small>{item.data.effectId ? `${effectLabel(item.data.effectId)} ${formatEffectValue(item.data)}` : '特殊効果なし'}{protectedMaterial ? ' · 素材不可' : ''}</small></button>;
      })}</div>
      {materialCandidates.length < 4 && <p className="empty-state">同ランクの素材オーブが4個必要です。</p>}
      <button className="modal-primary combine-confirm" disabled={materialIds.length !== 4 || cost === null || goldBalance(props.state) < (cost ?? Infinity)} onClick={() => parentId && props.onCombine(parentId, materialIds)}>合成する {cost !== null ? `${cost.toLocaleString()} G` : ''}</button>
    </>}
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

function formatEffectValue(data: EquipmentData): string {
  if (data.effectValue === undefined || data.effectId === undefined) return '';
  if (data.effectId === 'cooldown') return `-${data.effectValue}秒`;
  if (data.effectId === 'drawExp') return '2倍';
  return `+${data.effectValue}%`;
}

function nextOrbRank(rank: EquipmentData['orbRank']): string {
  if (rank === undefined) return '-';
  const index = orbRanks.indexOf(rank);
  return orbRanks[index + 1] ?? 'MAX';
}

function jobDisplayName(jobId: string): string {
  return jobs.find((job) => job.id === jobId)?.displayName ?? jobId;
}

function formatTitleEffect(definition: MinuteVanguardTitleDefinition, level: number): string {
  const value = definition.values[Math.max(0, Math.min(4, level - 1))] ?? definition.values[0];
  if (['openingDamage', 'battleDamage', 'physicalDamage', 'magicDamage', 'petDamage', 'criticalDamage'].includes(definition.effectFamily)) {
    return `${definition.description} ×${value.toFixed(2)}`;
  }
  return `${definition.description} ${(value * 100).toFixed(value * 100 < 10 ? 1 : 0)}%`;
}

function formatRemainingTime(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.max(0, totalSec % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function effectLabel(effectId: string): string {
  return ({ gemDrop: 'ジェムドロップ率', goldProtection: '敗北Gold保護', gold: '獲得Gold', exp: '獲得EXP', drawExp: '引き分けEXP', regen: '毎ターンHP回復', greatGrowth: '大成長率', critical: 'クリティカル率', evasion: '回避率', cooldown: 'クールダウン' } as Record<string, string>)[effectId] ?? effectId;
}

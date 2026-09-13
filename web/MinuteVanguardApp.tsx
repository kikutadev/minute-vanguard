import { useEffect, useRef, useState } from 'react';
import type { PresentationQueueItem, PublicPlayerSnapshot } from 'idle-game-kit';
import { BottomSheet, Motion, usePresentationQueue } from 'idle-game-kit/react';
import { GameSession } from '../application/game-session';
import type { ArenaBattleResult, ArenaHistoryEntry, ArenaLeaderboardEntry, ArenaPlayerView } from '../application/arena-contract';
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
  specialEquipmentOffers,
  type PermanentUpgradeId,
} from '../definitions/game-definitions';
import { soloAchievementCategoryLabels, soloAchievementDefinitions, type SoloAchievementCategory } from '../definitions/achievement-definitions';
import { battleSceneDefinition, type BattleSceneDaypart } from '../definitions/battle-scene-definitions';
import { mimicBankGemCosts, mimicBankOutcomes, mimicBankProductOwnedOdds, type MimicBankGemCost } from '../definitions/mimic-bank-definitions';
import { TITLE_RESET_COST, TITLE_SHOP_PRICE, titleDefinitions, type MinuteVanguardTitleDefinition } from '../definitions/title-definitions';
import type { BattleResult, EquipmentData, GoldBagId, MinuteVanguardState, RewardBreakdownEntry, StatKey, TimeBoostKind } from '../definitions/types';
import {
  LOGIN_BONUS_REWARDS,
  activateRareGuarantee,
  activateBattleBoost,
  advanceFromWallClock,
  availableJobs,
  battleCooldown,
  buyEquipment,
  buySpecialEquipment,
  buyGoldBag,
  buyPetSnacks,
  buyPermanentUpgrade,
  buyDailyTitle,
  changeJob,
  claimDailyMission,
  clearNewAchievementFlags,
  claimLoginBonus,
  combineOrb,
  cooldownSkipCost,
  canSkipBattleCooldown,
  currentJob,
  currentJobBonusRequirement,
  discardItem,
  drawOrb,
  drawPetGacha,
  dailyTitleOffers,
  dailyMissions,
  dailyMissionNextReward,
  dailyMissionValue,
  depositAllGoldToMimicBank,
  effectiveBattleCooldownSec,
  expandOrbCapacity,
  equipOwnedItem,
  equipOwnedTitle,
  expRequiredForNextLevel,
  fight,
  fightSimple,
  freeCooldownSkipsRemaining,
  gemBalance,
  goldBalance,
  goldBagOffers,
  moveEquippedTitle,
  healAtInn,
  jobChangeCost,
  loginBonusPreview,
  orbCombineCost,
  orbFreeSlots,
  orbInventoryCount,
  orbRerollCost,
  playerCombatStats,
  petCatalogEntry,
  petDisplayName,
  petCaptureEquipmentMultiplier,
  petGachaSingleCost,
  dailyPetPickupId,
  ownedPetIds,
  petSnackAutoRemainingSec,
  petTrainingCap,
  petTrainingGrowthBonusPct,
  petTrainingLevel,
  purchaseTimeBoost,
  rerollOrbStats,
  recoverDefeatGold,
  resolveOrbReplacement,
  resetEquippedTitles,
  setEquippedTitleLevel,
  timeBoostRemainingSec,
  setActivePet,
  selectAchievementTitle,
  setMonsterLevel,
  setPetNickname,
  skipBattleCooldown,
  soloAchievementProgress,
  toggleOrbFavorite,
  toggleOrbLock,
  toggleTitleFavorite,
  titleCostLimitForLevel,
  titleEquipCost,
  titleLevel,
  unlockedMonsterLevel,
  totalPetTrainingLevels,
  trainPet,
  unequipOwnedTitle,
  upgradeItem,
  withdrawMimicBank,
} from '../plugin/engine';
import { publicPlayerDirectory } from './public-player-directory';
import { getMinuteVanguardOnlineClient, type PublicLeaderboardMetric } from './public-player-online';

const session = new GameSession();
type MainTab = 'shop' | 'equipment' | 'battle' | 'collection' | 'ranking';
type EquipmentTab = 'weapon' | 'armor' | 'orb' | 'pet' | 'title';
type Modal = 'mission' | 'job' | 'menu' | 'orb-combine' | 'login' | 'tap-game' | 'mimic-bank' | null;
type NoticePresentation = PresentationQueueItem & Readonly<{ text: string }>;
const STAT_LABELS: Readonly<Record<StatKey, string>> = { hp: 'HP', attack: 'ATK', defense: 'DEF', magicAttack: 'MAT', magicDefense: 'MDF', luck: 'LUK' };

const DAYPART_LABELS: Readonly<Record<BattleSceneDaypart, string>> = { morning: '朝', day: '昼', evening: '夕', night: '夜' };

function battleSceneDaypart(date = new Date()): BattleSceneDaypart {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

function publicProfileFingerprint(state: MinuteVanguardState): string {
  return JSON.stringify({ displayName: state.gameData.player.name, data: createMinuteVanguardPublicData(state) });
}

function battleSceneProps(monsterLevel: number): Readonly<{ className: string; label: string }> {
  const definition = battleSceneDefinition(monsterLevel);
  const daypart = battleSceneDaypart();
  return {
    className: `battle-scene ${definition.cssClass} scene-${daypart}`,
    label: `Lv.${definition.monsterLevel} · ${definition.displayName} · ${DAYPART_LABELS[daypart]}`,
  };
}

export function MinuteVanguardApp() {
  const [state, setState] = useState<MinuteVanguardState | null>(null);
  const [tab, setTab] = useState<MainTab>('battle');
  const [equipmentTab, setEquipmentTab] = useState<EquipmentTab>('weapon');
  const [modal, setModal] = useState<Modal>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [battleStep, setBattleStep] = useState(0);
  const [simpleBattleOpen, setSimpleBattleOpen] = useState(false);
  const stateRef = useRef<MinuteVanguardState | null>(null);
  const publicProfileFingerprintRef = useRef('');
  const publicProfilePublishTimerRef = useRef<number | null>(null);
  const noticeSequenceRef = useRef(1);
  const { current: noticePresentation, enqueue: enqueueNotice } = usePresentationQueue<NoticePresentation>(() => 2_400);
  const setNotice = (message: string) => {
    if (message.length === 0) return;
    enqueueNotice([{
      id: `notice:${noticeSequenceRef.current++}`,
      text: message,
      presentationPriority: 100,
      presentationCoalescingKey: 'global-notice',
      presentationPreemption: 'discard-current',
    }]);
  };

  useEffect(() => {
    let cancelled = false;
    void session.load().then((loaded) => {
      if (cancelled) return;
      stateRef.current = loaded;
      setState(loaded);
      if (loaded.gameData.pendingOrbReplacementItemId === null && loginBonusPreview(loaded).available) setModal('login');
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (state === null) return;
    const online = getMinuteVanguardOnlineClient();
    if (!online.isPublishingEnabled()) return;
    const fingerprint = publicProfileFingerprint(state)
    if (fingerprint === publicProfileFingerprintRef.current) return;
    publicProfileFingerprintRef.current = fingerprint;
    if (publicProfilePublishTimerRef.current !== null) window.clearTimeout(publicProfilePublishTimerRef.current);
    publicProfilePublishTimerRef.current = window.setTimeout(() => {
      publicProfilePublishTimerRef.current = null;
      void online.publish(state).catch(() => {
        publicProfileFingerprintRef.current = '';
      });
    }, 1_500);
  }, [state]);

  useEffect(() => () => {
    if (publicProfilePublishTimerRef.current !== null) window.clearTimeout(publicProfilePublishTimerRef.current);
  }, []);

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
  const activeAchievement = soloAchievementDefinitions.find((definition) => definition.id === state.gameData.selectedAchievementId && state.achievements[definition.id] === true);
  const selectedItem = selectedItemId === null ? undefined : state.gameData.inventory[selectedItemId];

  const onFight = () => {
    const result = fight(state);
    if (!result.accepted) {
      setNotice(result.reason === 'orb-replacement-required' ? '先にドロップしたオーブの入れ替えを決めてください' : `あと ${battleCooldown(state).remainingSec}秒 待つ必要があります`);
      return;
    }
    const latest = result.state.gameData.lastBattle;
    commit(result.state);
    if (latest !== null) {
      setBattleResult(latest);
      setBattleStep(0);
    }
  };

  const onRecoverDefeatGold = () => {
    const amount = state.gameData.recoverableDefeatGold;
    const result = recoverDefeatGold(state);
    if (!result.accepted) {
      setNotice(result.reason === 'insufficient-gems' ? '敗北Gold回収には100ジェムが必要です' : '回収できるGoldはありません');
      return;
    }
    commit(result.state, `${amount.toLocaleString()}G を回収しました`);
  };

  const onSimpleFight = () => {
    const result = fightSimple(state);
    if (!result.accepted) return;
    commit(result.state);
  };

  return (
    <div className="game-viewport">
      <header className="global-header">
        <div className="profile-row">
          <div className="hero-portrait" aria-hidden="true">{job.id === 'job.mage' ? '🧙' : job.id === 'job.priest' ? '🪄' : '🧑‍🚀'}</div>
          <div className="profile-main">
            {activeAchievement && <div className="profile-achievement-title">◆ {activeAchievement.displayName}</div>}
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
        {tab === 'battle' && <BattleTab state={state} onFight={onFight} onRare={() => {
          const result = activateRareGuarantee(state);
          if (!result.accepted) setNotice(result.reason === 'already-active' ? 'レア確定はすでに有効です' : 'ジェムが足りません');
          else commit(result.state, '次の戦闘はレア以上が確定しました');
        }} onBoost={() => {
          const result = activateBattleBoost(state);
          if (!result.accepted) setNotice(result.reason === 'already-active' ? 'Battle Boostはすでに有効です' : 'ジェムが足りません');
          else commit(result.state, '次の戦闘はEXP・Goldが2倍になります');
        }} onSkip={() => {
          const result = skipBattleCooldown(state);
          if (!result.accepted) setNotice('クールダウンをスキップできません');
          else commit(result.state, '待ち時間をスキップしました');
        }} onMonsterLevel={(level) => { const result = setMonsterLevel(state, level); if (!result.accepted) setNotice('そのモンスターレベルはまだ解放されていません'); else commit(result.state, `モンスターレベル ${level} を選択しました`); }} onSimpleBattle={() => setSimpleBattleOpen(true)} onTapGame={() => setModal('tap-game')} onMimic={() => setModal('mimic-bank')} onMission={() => setModal('mission')} onJob={() => setModal('job')} onRecover={onRecoverDefeatGold} />}
        {tab === 'equipment' && <EquipmentView state={state} active={equipmentTab} setActive={setEquipmentTab} onSelect={setSelectedItemId} onBuy={(definitionId) => {
          const result = buyEquipment(state, definitionId);
          if (!result.accepted) setNotice('購入に必要なGoldが足りません');
          else commit(result.state, '装備を購入しました');
        }} onBuySpecial={(definitionId) => {
          const result = buySpecialEquipment(state, definitionId);
          if (!result.accepted) setNotice('特殊装備には2,000ジェムが必要です');
          else commit(result.state, '捕獲率アップ装備を購入しました');
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
        }} onPetGacha={(count) => {
          const beforeOwned = state.gameData.ownedGachaPetIds.length;
          const beforeSnacks = state.gameData.petSnacks;
          const result = drawPetGacha(state, count);
          if (!result.accepted) setNotice('ペットガチャに必要なジェムが足りません');
          else {
            const newPets = result.state.gameData.ownedGachaPetIds.length - beforeOwned;
            const snackGain = Math.max(0, result.state.gameData.petSnacks - beforeSnacks);
            commit(result.state, `ペットガチャ：新規 ${newPets}体${snackGain > 0 ? ` / 重複おやつ +${snackGain}` : ''}`);
          }
        }} onPetTrain={(enemyId) => {
          const result = trainPet(state, enemyId);
          if (!result.accepted) setNotice(result.reason === 'no-snacks' ? 'おやつがありません' : result.reason === 'max-training' ? 'このペットは訓練上限です' : 'ペットを育成できません');
          else commit(result.state, 'ペットにおやつを与えました');
        }} onPetRename={(enemyId, nickname) => {
          const result = setPetNickname(state, enemyId, nickname);
          if (!result.accepted) setNotice(result.reason === 'nickname-too-long' ? 'ペット名は12文字までです' : 'このペットの名前は変更できません');
          else commit(result.state, nickname.trim().length === 0 ? 'ペット名を元に戻しました' : 'ペット名を変更しました');
        }} onPetBuySnacks={() => {
          const result = buyPetSnacks(state);
          if (!result.accepted) setNotice('おやつ購入に必要な100ジェムが足りません');
          else commit(result.state, 'おやつを100個購入しました');
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
        }} onBuyGoldBag={(bagId) => {
          const result = buyGoldBag(state, bagId);
          if (!result.accepted) setNotice(result.reason === 'not-enough-wins' ? 'ゴールド袋は直近のモンスター勝利が2回以上必要です' : result.reason === 'insufficient-gems' ? 'ジェムが足りません' : '購入できません');
          else commit(result.state, 'ゴールド袋を開けました');
        }} />}
        {tab === 'collection' && <CollectionView state={state} onAchievementsViewed={() => commit(clearNewAchievementFlags(state))} onSelectAchievement={(achievementId) => { const result = selectAchievementTitle(state, achievementId); if (!result.accepted) setNotice('未獲得の称号は表示できません'); else commit(result.state, achievementId === null ? '称号表示を外しました' : '表示する称号を変更しました'); }} />}
        {tab === 'ranking' && <RankingView state={state} onPublishingChanged={(enabled) => {
          publicProfileFingerprintRef.current = enabled ? publicProfileFingerprint(state) : '';
          if (!enabled && publicProfilePublishTimerRef.current !== null) {
            window.clearTimeout(publicProfilePublishTimerRef.current);
            publicProfilePublishTimerRef.current = null;
          }
        }} />}
      </div>

      {noticePresentation !== null && (
        <div className="global-notice">
          <Motion as="span" preset="reveal" motionKey={noticePresentation.id}>
            <span role="status">{noticePresentation.text}</span>
          </Motion>
        </div>
      )}

      <nav className="bottom-nav" aria-label="メインナビゲーション">
        <NavButton icon="🛒" label="ショップ" active={tab === 'shop'} onClick={() => setTab('shop')} />
        <NavButton icon="⚔" label="装備" active={tab === 'equipment'} onClick={() => setTab('equipment')} />
        <NavButton icon="⚔️" label="バトル" active={tab === 'battle'} onClick={() => setTab('battle')} primary />
        <NavButton icon="📖" label="コレクション" active={tab === 'collection'} onClick={() => setTab('collection')} />
        <NavButton icon="♛" label="ランキング" active={tab === 'ranking'} onClick={() => setTab('ranking')} />
      </nav>

      {simpleBattleOpen && <SimpleBattleView state={state} onFight={onSimpleFight} onDeposit={() => { const result = depositAllGoldToMimicBank(state); if (result.accepted) commit(result.state); }} onClose={() => setSimpleBattleOpen(false)} />}
      {battleResult !== null && <BattleResultModal result={battleResult} step={battleStep} jobName={job.displayName} recoveryAmount={state.gameData.recoverableDefeatGold} onRecover={onRecoverDefeatGold} onClose={() => setBattleResult(null)} />}
      {battleResult === null && state.gameData.pendingOrbReplacementItemId !== null && <OrbReplacementModal state={state} onResolve={(discardItemId) => {
        const result = resolveOrbReplacement(state, discardItemId);
        if (!result.accepted) setNotice(result.reason === 'protected-item' ? '装備中・ロック・お気に入りのオーブは入れ替え対象にできません' : 'オーブの入れ替えを完了できません');
        else commit(result.state, discardItemId === state.gameData.pendingOrbReplacementItemId ? '新しいオーブを見送りました' : 'オーブを入れ替えました');
      }} />}
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
      {modal === 'login' && <LoginBonusModal state={state} onClose={() => setModal(null)} onClaim={() => {
        const preview = loginBonusPreview(state);
        const result = claimLoginBonus(state);
        if (!result.accepted) setNotice('本日のログインボーナスは受取済みです');
        else { commit(result.state, `ログイン${preview.day}日目の報酬を受け取りました`); setModal(null); }
      }} />}
      {modal === 'mimic-bank' && <MimicBankModal state={state} onClose={() => setModal(null)} onDeposit={() => {
        const result = depositAllGoldToMimicBank(state);
        if (!result.accepted) setNotice('預けられるGoldがありません');
        else commit(result.state, `${result.state.gameData.mimicBankGold.toLocaleString()}G をミミックへ預けました`);
      }} onWithdraw={(cost) => {
        const result = withdrawMimicBank(state, cost);
        if (!result.accepted) setNotice(result.reason === 'insufficient-gems' ? '引き出しに必要なジェムが足りません' : 'ミミック銀行は空です');
        else commit(result.state, `ミミック銀行：${result.state.gameData.lastMimicBankResult?.returnedGold.toLocaleString() ?? 0}G 戻りました`);
      }} />}
      {modal === 'tap-game' && <MonsterTapGame state={state} onClose={() => setModal(null)} />}
      {modal === 'menu' && <MenuModal loginAvailable={loginBonusPreview(state).available} onLogin={() => setModal('login')} onClose={() => setModal(null)} onReset={async () => {
        if (!window.confirm('セーブデータを削除して最初から始めますか？')) return;
        const reset = await session.reset();
        commit(reset, '最初から始めました');
        setModal(null);
      }} />}
    </div>
  );
}

function formatCompactGold(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.floor(value / 1_000)}K`;
  return String(Math.floor(value));
}

function BattleTab(props: Readonly<{ state: MinuteVanguardState; onFight: () => void; onRare: () => void; onBoost: () => void; onSkip: () => void; onMonsterLevel: (level: number) => void; onSimpleBattle: () => void; onTapGame: () => void; onMimic: () => void; onMission: () => void; onJob: () => void; onRecover: () => void }>) {
  const { state } = props;
  const [battleMode, setBattleMode] = useState<'monster' | 'arena'>('monster');
  const cooldown = battleCooldown(state);
  const skipCost = cooldownSkipCost(state);
  const freeSkips = freeCooldownSkipsRemaining(state);
  const last = state.gameData.lastBattle;
  const scene = battleSceneProps(state.gameData.selectedMonsterLevel);
  return <section className="battle-page page-section">
    <div className="section-tabs"><button className={battleMode === 'monster' ? 'active' : ''} onClick={() => setBattleMode('monster')}>⚔ モンスター戦</button><button className={battleMode === 'arena' ? 'active' : ''} onClick={() => setBattleMode('arena')}>🏆 アリーナ</button></div>
    {battleMode === 'arena' ? <ArenaView state={state} /> : <>
    <div className="battle-control-card">
      <div className="monster-level-row"><span>モンスターレベル</span><div className="monster-level-control"><button disabled={state.gameData.selectedMonsterLevel <= 1} onClick={() => props.onMonsterLevel(state.gameData.selectedMonsterLevel - 1)}>‹</button><strong>{state.gameData.selectedMonsterLevel}</strong><button disabled={state.gameData.selectedMonsterLevel >= unlockedMonsterLevel(state)} onClick={() => props.onMonsterLevel(state.gameData.selectedMonsterLevel + 1)}>›</button></div><small>解放 1–{unlockedMonsterLevel(state)}</small><button className="simple-battle-open" onClick={props.onSimpleBattle}>簡易</button><span className="online-dot">● 1人プレイ</span></div>
      <div className={`battle-illustration ${scene.className}`} data-scene={scene.label}>
        <div className="battle-sigil">⚔</div>
        <p>{state.gameData.victories < 10 ? `初心者ボーナス：あと ${10 - state.gameData.victories}体は5秒待機` : `通常待機 ${effectiveBattleCooldownSec(state)}秒`}</p>
        <div className="active-boosts">
          {(['rush', 'exp', 'gold'] as const).map((kind) => {
            const remaining = timeBoostRemainingSec(state, kind);
            if (remaining <= 0) return null;
            return <span key={kind}>{kind === 'rush' ? '⚡RUSH' : kind === 'exp' ? '✦ EXP×2' : '◉ GOLD×2'} <b>{formatRemainingTime(remaining)}</b></span>;
          })}
        </div>
        {(state.gameData.rareGuaranteeActive || state.gameData.battleBoostActive) && <div className="next-battle-flags">
          {state.gameData.rareGuaranteeActive && <strong className="rare-active">RARE以上</strong>}
          {state.gameData.battleBoostActive && <strong className="boost-active">EXP/GOLD ×2</strong>}
        </div>}
      </div>
      <button className="fight-button" onClick={props.onFight} disabled={!cooldown.ready}>
        {cooldown.ready ? <><b>⚔ 戦闘する</b><span>1戦だけ挑む</span></> : <><b>{cooldown.remainingSec}秒</b><span>次の戦闘まで</span></>}
      </button>
      {!cooldown.ready && canSkipBattleCooldown(state) && <button className="skip-button" onClick={props.onSkip}>{freeSkips > 0 ? `無料スキップ · 本日あと ${freeSkips}/3` : `💎 ${skipCost} で待ち時間をスキップ`}</button>}
      {!cooldown.ready && <button className="pastime-button" onClick={props.onTapGame}>👾 モンスター叩き <small>報酬なし · 暇つぶし</small></button>}
      <div className="battle-prep-actions">
        <button className={`rare-button ${state.gameData.rareGuaranteeActive ? 'active' : ''}`} onClick={props.onRare} disabled={state.gameData.rareGuaranteeActive}>💎10 レア確定</button>
        <button className={`boost-button ${state.gameData.battleBoostActive ? 'active' : ''}`} onClick={props.onBoost} disabled={state.gameData.battleBoostActive}>💎10 EXP/GOLD ×2</button>
      </div>
    </div>

    {last !== null && <div className="last-result-card">
      <div><span className={`rarity-label rarity-${last.enemyRarity}`}>{last.enemyRarity.toUpperCase()}</span><strong>{last.enemyName}</strong></div>
      <div className={`result-badge ${last.outcome}`}>{last.outcome === 'victory' ? '勝利' : last.outcome === 'draw' ? '引き分け' : '敗北'}</div>
      <small>{last.goldDelta >= 0 ? `+${last.goldDelta.toLocaleString()}G` : `${last.goldDelta.toLocaleString()}G`} / +{last.expGained.toLocaleString()} EXP {last.gemGained > 0 ? `/ +${last.gemGained}💎` : ''}</small>
      {state.gameData.recoverableDefeatGold > 0 && <button className="defeat-recovery-button" onClick={props.onRecover}>💎100 · {state.gameData.recoverableDefeatGold.toLocaleString()}G 回収</button>}
    </div>}

    <div className="quick-actions">
      <button onClick={props.onMission}><span>✓</span><small>ミッション</small><em>{dailyMissions(state).filter((mission) => dailyMissionValue(state, mission) >= mission.target).length}/5</em></button>
      <button onClick={props.onJob}><span>♻</span><small>転職</small>{state.gameData.player.level >= 30 && <em>!</em>}</button>
      <button onClick={props.onMimic}><span>🎭</span><small>ミミック銀行</small>{state.gameData.mimicBankGold > 0 && <em>{formatCompactGold(state.gameData.mimicBankGold)}</em>}</button>
    </div>
    <BattleHistory state={state} />
    </>}
  </section>;
}

function ArenaView({ state }: Readonly<{ state: MinuteVanguardState }>) {
  const [arena, setArena] = useState<ArenaPlayerView | null>(null);
  const [leaderboard, setLeaderboard] = useState<readonly ArenaLeaderboardEntry[]>([]);
  const [history, setHistory] = useState<readonly ArenaHistoryEntry[]>([]);
  const [battle, setBattle] = useState<ArenaBattleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const online = getMinuteVanguardOnlineClient();
    const [me, board] = await Promise.all([online.getArena(), online.listArenaLeaderboard(10)]);
    setArena(me);
    setLeaderboard(board);
    setHistory(me === null ? [] : await online.listArenaHistory());
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const online = getMinuteVanguardOnlineClient();
        const [me, board] = await Promise.all([online.getArena(), online.listArenaLeaderboard(10)]);
        if (cancelled) return;
        setArena(me);
        setLeaderboard(board);
        if (me !== null) setHistory(await online.listArenaHistory());
      } catch {
        if (!cancelled) setError('アリーナサーバーへ接続できません');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const join = async () => {
    setBusy(true); setError(null);
    try {
      const online = getMinuteVanguardOnlineClient();
      setArena(await online.joinArena(state));
      setLeaderboard(await online.listArenaLeaderboard(10));
      setHistory(await online.listArenaHistory());
    } catch { setError('アリーナ参加に失敗しました'); }
    finally { setBusy(false); setLoading(false); }
  };

  const fightArena = async () => {
    setBusy(true); setError(null);
    try {
      const result = await getMinuteVanguardOnlineClient().randomArenaBattle();
      setArena(result.arena);
      setBattle(result.battle);
      const online = getMinuteVanguardOnlineClient();
      const [board, nextHistory] = await Promise.all([online.listArenaLeaderboard(10), online.listArenaHistory()]);
      setLeaderboard(board); setHistory(nextHistory);
    } catch (caught) {
      const code = caught instanceof Error && 'code' in caught ? String((caught as { code?: unknown }).code) : '';
      setError(code === 'arena-cooldown' ? 'まだアリーナの待ち時間です' : '対戦を開始できませんでした');
      try { await reload(); } catch { /* keep the actionable error */ }
    } finally { setBusy(false); }
  };

  const toggleBarrier = async () => {
    if (arena === null) return;
    setBusy(true); setError(null);
    try { setArena(await getMinuteVanguardOnlineClient().setArenaBarrier(!arena.barrierEnabled)); }
    catch { setError('防衛バリア設定を変更できませんでした'); }
    finally { setBusy(false); }
  };

  const leave = async () => {
    if (!window.confirm('アリーナ戦績・レート・シーズンスコアを削除して退会しますか？')) return;
    setBusy(true); setError(null);
    try {
      await getMinuteVanguardOnlineClient().leaveArena();
      setArena(null); setHistory([]); setBattle(null);
      setLeaderboard(await getMinuteVanguardOnlineClient().listArenaLeaderboard(10));
    } catch { setError('アリーナ退会に失敗しました'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="arena-loading">アリーナ情報を読み込んでいます…</div>;
  if (arena === null) return <div className="arena-join-card">
    <span className="arena-crown">♛</span>
    <h2>WEEKLY ARENA</h2>
    <p>週ごとのシーズンスコアで王冠を争います。対戦・レート・待ち時間はサーバーが決定します。</p>
    <div className="arena-security-note"><strong>公平性</strong><span>ローカルのLv・Gold・装備数値は勝敗に使いません。現在職業だけを戦闘スタイルとして使い、全員をArena基準へ正規化します。</span></div>
    {error && <p className="arena-error">{error}</p>}
    <button className="arena-join-button" disabled={busy} onClick={() => void join()}>{busy ? '登録中…' : 'アリーナに参加する'}</button>
    <small>参加すると、名前・職業・Arena戦績・レートがArena内で公開されます。通常の公開プロフィール設定とは別です。</small>
  </div>;

  const cooldownSec = Math.min(60, Math.max(0, Math.ceil((arena.nextAttackAtMs - state.lastWallClockMs) / 1_000)));
  const barrierSec = Math.max(0, Math.ceil((arena.barrierUntilMs - state.lastWallClockMs) / 1_000));
  const champion = leaderboard.find((entry) => entry.isChampion);
  const nextTierRemaining = arena.nextTierScore === null ? null : Math.max(0, arena.nextTierScore - arena.seasonScore);
  return <div className="arena-view">
    <div className="arena-season-card">
      <div className="arena-season-head"><span>SEASON {arena.seasonKey}</span><b>#{arena.rank ?? '—'} {arena.tierName}</b></div>
      <div className="arena-score-grid">
        <div><small>SEASON SCORE</small><strong>{arena.seasonScore.toLocaleString()}</strong>{nextTierRemaining !== null && <em>次 {arena.nextTierName} まで {nextTierRemaining}</em>}</div>
        <div><small>RATE</small><strong>{arena.rating.toLocaleString()}</strong><em>BEST {arena.bestRating.toLocaleString()}</em></div>
        <div><small>RECORD</small><strong>{arena.wins}勝 {arena.losses}敗</strong><em>引分 {arena.draws}</em></div>
      </div>
      <div className="arena-score-split"><span>攻撃 {arena.seasonAttackScore}</span><span>防衛 {arena.seasonDefenseScore}</span><span>{jobDisplayName(arena.jobId)}型</span></div>
    </div>

    {champion && <div className="arena-champion"><span>♛ CHAMPION</span><strong>{champion.displayName}</strong><em>{champion.seasonScore.toLocaleString()} pt · Rate {champion.rating}</em></div>}

    <div className="arena-fight-card">
      <div className="arena-versus-art"><span>🧑‍🚀</span><b>VS</b><span>❔</span></div>
      <p>レート近傍からサーバーが相手を選出。人間の対戦相手がいない場合は、順位変動なしの訓練相手になります。</p>
      <button className="arena-fight-button" disabled={busy || cooldownSec > 0} onClick={() => void fightArena()}>
        {busy ? 'MATCHING…' : cooldownSec > 0 ? `${cooldownSec}秒` : '⚔ ランダムマッチ'}
      </button>
      <small>固定60秒 · モンスター戦とは別枠 · Gem/Rushで短縮不可</small>
    </div>

    <div className="arena-defense-card">
      <div><strong>防衛バリア</strong><small>{barrierSec > 0 ? `残り ${formatRemainingTime(barrierSec)}` : arena.barrierEnabled ? '防衛失敗時に2時間ON' : '使用しない'}</small></div>
      <button className={arena.barrierEnabled ? 'on' : ''} disabled={busy} onClick={() => void toggleBarrier()}>{arena.barrierEnabled ? 'ON' : 'OFF'}</button>
    </div>

    {error && <p className="arena-error">{error}</p>}

    <h3 className="arena-heading">今シーズン上位</h3>
    <div className="arena-board">{leaderboard.length === 0 ? <p>まだ順位はありません。</p> : leaderboard.map((entry) => <div key={entry.playerId} className={entry.playerId === arena.playerId ? 'you' : ''}>
      <b>{entry.isChampion ? '♛' : entry.rank}</b><span>{entry.displayName}<small>{jobDisplayName(entry.jobId)} · Rate {entry.rating}</small></span><strong>{entry.seasonScore.toLocaleString()}</strong>
    </div>)}</div>

    <h3 className="arena-heading">直近のArenaログ</h3>
    <div className="arena-history">{history.length === 0 ? <p>対戦するとここに履歴が残ります。</p> : history.map((entry) => <div key={entry.battleId} className={entry.outcome}>
      <span>{entry.role === 'attack' ? '攻' : '守'}</span><strong>{entry.opponentName}<small>{jobDisplayName(entry.opponentJobId)}</small></strong><b>{entry.outcome === 'win' ? '勝' : entry.outcome === 'loss' ? '敗' : '分'}</b><em>{entry.ratingDelta >= 0 ? '+' : ''}{entry.ratingDelta}R / +{entry.scoreGain}pt</em>
    </div>)}</div>

    <button className="arena-leave" disabled={busy} onClick={() => void leave()}>アリーナ登録を削除</button>
    {battle !== null && <ArenaBattleModal result={battle} onClose={() => setBattle(null)} />}
  </div>;
}

function ArenaBattleModal({ result, onClose }: Readonly<{ result: ArenaBattleResult; onClose: () => void }>) {
  const logs = result.turns.flatMap((turn) => turn.logs.map((line, index) => ({ key: `${turn.turn}:${index}`, turn: turn.turn, line })));
  return <div className="modal-backdrop battle-modal-backdrop"><section className="battle-result-modal arena-result-modal">
    <div className="arena-result-stage">
      <div><span>🧑‍🚀</span><strong>YOU</strong><em>{result.attackerHpAfter}/{result.attackerMaxHp} HP</em></div>
      <b>VS</b>
      <div><span>{result.opponent.isBot ? '🤖' : '🧑‍🚀'}</span><strong>{result.opponent.displayName}</strong><em>{result.defenderHpAfter}/{result.defenderMaxHp} HP</em></div>
    </div>
    <div className="turn-log arena-turn-log"><div className="turn-log-title">SERVER BATTLE LOG <span>v{result.combatVersion}</span></div>{logs.slice(-12).map((log) => <p key={log.key}><b>T{log.turn}</b>{log.line}</p>)}</div>
    <div className={`battle-reward-panel ${result.outcome === 'win' ? 'victory' : result.outcome === 'loss' ? 'defeat' : 'draw'}`}>
      <h2>{result.outcome === 'win' ? 'ARENA WIN' : result.outcome === 'loss' ? 'ARENA LOSS' : 'ARENA DRAW'}</h2>
      {result.opponent.isBot ? <p className="arena-training-note">訓練相手のためRate・Season Scoreは変動しません</p> : <div className="reward-row"><span>RATE {result.ratingDelta >= 0 ? '+' : ''}{result.ratingDelta}</span><span>SEASON +{result.seasonScoreGain}</span><span>{result.weekendMultiplier === 2 ? 'WEEKEND ×2' : 'WEEKDAY'}</span></div>}
      <p>{result.opponent.isBot ? 'TRAINING' : `Rate ${result.ratingBefore} → ${result.ratingAfter}`} · Score {result.seasonScoreAfter}</p>
      <button className="modal-primary" onClick={onClose}>閉じる</button>
    </div>
  </section></div>;
}

function SimpleBattleView(props: Readonly<{ state: MinuteVanguardState; onFight: () => void; onDeposit: () => void; onClose: () => void }>) {
  const [startedAtBattle] = useState(props.state.gameData.totalBattles);
  const cooldown = battleCooldown(props.state);
  const stats = playerCombatStats(props.state);
  const expNeeded = expRequiredForNextLevel(props.state.gameData.player.level);
  const entries = props.state.gameData.battleHistory.filter((entry) => entry.battleIndex > startedAtBattle).slice().reverse();
  return <div className="simple-battle-overlay">
    <header><div><strong>簡易戦闘</strong><small>無演出・モンスター戦のみ</small></div><button onClick={props.onClose}>終了</button></header>
    <div className="simple-status">
      <span>HP <b>{props.state.gameData.player.currentHp.toLocaleString()} / {stats.hp.toLocaleString()}</b></span>
      <span>EXP <b>{props.state.gameData.player.exp.toLocaleString()} / {expNeeded.toLocaleString()}</b></span>
      <span>GOLD <b>{Math.floor(goldBalance(props.state)).toLocaleString()}</b></span>
      <span>狩場 <b>Lv.{props.state.gameData.selectedMonsterLevel}</b></span>
    </div>
    <button className="simple-fight-button" onClick={props.onFight} disabled={!cooldown.ready}>{cooldown.ready ? '戦闘する' : `${cooldown.remainingSec}秒`}</button>
    <button className="simple-deposit-button" onClick={props.onDeposit} disabled={goldBalance(props.state) < 1}>ミミック銀行へ全額預ける · 銀行 {Math.floor(props.state.gameData.mimicBankGold).toLocaleString()}G</button>
    <p className="simple-warning">オーブ枠が満杯のとき、新しいオーブは破棄されます。敗北Gold回収は通常画面でのみ利用できます。</p>
    <div className="simple-log">
      {entries.length === 0 ? <p>この画面で戦うと、ここに1行ずつ記録されます。</p> : entries.map((entry) => <div key={entry.battleIndex}>
        <time>{new Date(entry.resolvedAtMs).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
        <span>Lv.{entry.monsterLevel} {entry.enemyName}</span>
        <b>{entry.outcome === 'victory' ? '勝' : entry.outcome === 'draw' ? '分' : '敗'}</b>
        <em>{entry.goldDelta >= 0 ? '+' : ''}{entry.goldDelta}G / +{entry.expGained}EXP</em>
      </div>)}
    </div>
  </div>;
}

function BattleHistory({ state }: Readonly<{ state: MinuteVanguardState }>) {
  const [limit, setLimit] = useState<10 | 30 | 50>(() => {
    const stored = Number(window.localStorage.getItem('minute-vanguard.battle-log-limit'));
    return stored === 30 || stored === 50 ? stored : 10;
  });
  const selectLimit = (next: 10 | 30 | 50) => {
    setLimit(next);
    window.localStorage.setItem('minute-vanguard.battle-log-limit', String(next));
  };
  const entries = state.gameData.battleHistory.slice(0, limit);
  return <section className="battle-history-card">
    <header><div><strong>自分のログ</strong><small>この端末の直近戦闘</small></div><div className="battle-log-limit">{([10, 30, 50] as const).map((count) => <button className={limit === count ? 'active' : ''} key={count} onClick={() => selectLimit(count)}>{count}</button>)}</div></header>
    {entries.length === 0 ? <p className="battle-log-empty">戦うとここに履歴が残ります。</p> : <div className="battle-log-list">{entries.map((entry) => <article className={`battle-log-row ${entry.outcome}`} key={entry.battleIndex}>
      <span className="battle-log-glyph">{entry.enemyGlyph}</span>
      <div className="battle-log-main"><div><small>#{entry.battleIndex} · Lv.{entry.monsterLevel}</small><strong>{entry.mutated ? '★ ' : ''}{entry.enemyName}</strong></div><p>{entry.outcome === 'victory' ? '勝利' : entry.outcome === 'draw' ? '引き分け' : '敗北'} · {entry.goldDelta >= 0 ? '+' : ''}{entry.goldDelta.toLocaleString()}G · +{entry.expGained.toLocaleString()}EXP</p></div>
      <div className="battle-log-icons">{entry.gemGained > 0 && <span title="ジェム">💎{entry.gemGained}</span>}{entry.petSnacksGained > 0 && <span title="おやつ">🍖</span>}{entry.capturedPetEnemyId !== null && <span title={entry.capturedPetMutated ? '変異種を捕獲' : 'ペットを捕獲'}>{entry.capturedPetMutated ? '★🐾' : '🐾'}</span>}{entry.droppedOrb && <span title="オーブ">🔮</span>}{entry.droppedItem && <span title="装備">🎁</span>}{entry.droppedTitle && <span title="肩書き">◇</span>}</div>
    </article>)}</div>}
  </section>;
}

function EquipmentView(props: Readonly<{ state: MinuteVanguardState; active: EquipmentTab; setActive: (tab: EquipmentTab) => void; onSelect: (id: string) => void; onBuy: (definitionId: string) => void; onBuySpecial: (definitionId: string) => void; onOrbDraw: (count: 1 | 10) => void; onOrbExpand: () => void; onCombineOpen: () => void; onPetToggle: (enemyId: string, active: boolean) => void; onPetGacha: (count: 1 | 10) => void; onPetTrain: (enemyId: string) => void; onPetRename: (enemyId: string, nickname: string) => void; onPetBuySnacks: () => void; onTitleEquip: (titleId: string, level: number) => void; onTitleLevel: (titleId: string, level: number) => void; onTitleMove: (titleId: string, targetIndex: number) => void; onTitleUnequip: (titleId: string) => void; onTitleReset: () => void; onTitleFavorite: (titleId: string) => void }>) {
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
      <h2 className="list-heading">捕獲支援装備</h2>
      <div className="item-list special-equipment-list">
        {specialEquipmentOffers.filter((offer) => offer.data.kind === props.active).map((offer) => <button className="shop-equipment-row special" key={offer.itemDefinitionId} onClick={() => props.onBuySpecial(offer.itemDefinitionId)}>
          <span className="equipment-icon">{offer.data.kind === 'weapon' ? '🪄' : '🥾'}</span>
          <span><strong>{itemDefinitions[offer.itemDefinitionId]?.displayName}</strong><small>{formatFlatStats(offer.data.flatStats)} · ペット捕獲率 ×{offer.data.captureMultiplier}</small></span>
          <em>💎 {offer.price.toLocaleString()}</em>
        </button>)}
      </div>
    </> : props.active === 'orb' ? <OrbView state={state} inventory={inventory} onSelect={props.onSelect} onDraw={props.onOrbDraw} onExpand={props.onOrbExpand} onCombine={props.onCombineOpen} /> : props.active === 'pet' ? <PetView state={state} onToggle={props.onPetToggle} onGacha={props.onPetGacha} onTrain={props.onPetTrain} onRename={props.onPetRename} onBuySnacks={props.onPetBuySnacks} /> : <TitleView state={state} onEquip={props.onTitleEquip} onLevel={props.onTitleLevel} onMove={props.onTitleMove} onUnequip={props.onTitleUnequip} onReset={props.onTitleReset} onFavorite={props.onTitleFavorite} />}
  </section>;
}

function ShopView(props: Readonly<{ state: MinuteVanguardState; onBuy: (id: PermanentUpgradeId) => void; onBuyTimeBoost: (kind: TimeBoostKind, durationSec: 180 | 600 | 1800) => void; onBuyTitle: (titleId: string) => void; onBuyGoldBag: (bagId: GoldBagId) => void }>) {
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
      <GoldBagShop state={props.state} onBuy={props.onBuyGoldBag} />
    </>}
    {active === 'boost' && <TimeBoostShop state={props.state} onBuy={props.onBuyTimeBoost} />}
    {active === 'title' && <DailyTitleShop state={props.state} onBuy={props.onBuyTitle} />}
    {active === 'gem' && <div className="empty-state">ソロ版ではジェム購入ストアを接続していません。</div>}
  </section>;
}

function GoldBagShop(props: Readonly<{ state: MinuteVanguardState; onBuy: (bagId: GoldBagId) => void }>) {
  const offers = goldBagOffers(props.state);
  const history = props.state.gameData.recentVictoryMonsterLevels;
  return <div className="gold-bag-shop">
    <div className="gold-bag-head"><div><strong>ゴールド袋</strong><small>直近10勝のモンスターレベルから中身が変化</small></div><em>{history.length}/10 戦記録</em></div>
    <div className="gold-bag-history">{Array.from({ length: 10 }, (_, index) => <span key={index} className={index < 10 - history.length ? 'empty' : ''}>{index < 10 - history.length ? '−' : `Lv.${history[index - (10 - history.length)]}`}</span>)}</div>
    {history.length < 2 && <p className="gold-bag-lock">モンスター戦で2勝すると購入できます。</p>}
    <div className="gold-bag-offers">{offers.map((offer) => <button key={offer.id} disabled={!offer.available} onClick={() => props.onBuy(offer.id)}><span>{offer.id === 'coinPouch' ? '👛' : offer.id === 'sack' ? '🎒' : '🏦'}</span><div><strong>{offer.label}</strong><small>{offer.goldAmount.toLocaleString()} G</small></div><em>💎{offer.gemCost}</em></button>)}</div>
    <p className="shop-lead">装備・オーブ・ブーストのGold倍率は袋の中身に入りません。高いモンスターレベルを安定して倒すほど増えます。</p>
  </div>;
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

function CollectionView(props: Readonly<{ state: MinuteVanguardState; onAchievementsViewed: () => void; onSelectAchievement: (achievementId: string | null) => void }>) {
  const { state } = props;
  const unlockedMaxLevel = unlockedMonsterLevel(state);
  const [view, setView] = useState<'monsters' | 'achievements'>('monsters');
  const [monsterLevel, setCollectionMonsterLevel] = useState<number>(state.gameData.selectedMonsterLevel);
  const [newAtOpen] = useState(() => new Set(state.gameData.newAchievementIds));
  const safeLevel = Math.min(monsterLevel, unlockedMaxLevel);
  const levelEnemies = enemies.filter((enemy) => enemy.monsterLevel === safeLevel);
  const discovered = levelEnemies.filter((enemy) => state.gameData.discoveredEnemyIds.includes(enemy.id)).length;
  const kills = levelEnemies.reduce((sum, enemy) => sum + (state.gameData.killCounts[enemy.id] ?? 0), 0);
  const encounters = levelEnemies.reduce((sum, enemy) => sum + (state.gameData.encounterCounts[enemy.id] ?? 0), 0);
  const completedAchievements = soloAchievementDefinitions.filter((definition) => state.achievements[definition.id] === true).length;

  const openAchievements = () => {
    setView('achievements');
    props.onAchievementsViewed();
  };

  return <section className="page-section collection-page">
    <h1>コレクション</h1>
    <div className="collection-mode-tabs"><button className={view === 'monsters' ? 'active' : ''} onClick={() => setView('monsters')}>図鑑</button><button className={view === 'achievements' ? 'active' : ''} onClick={openAchievements}>称号{state.gameData.newAchievementIds.length > 0 && <em>NEW {state.gameData.newAchievementIds.length}</em>}</button></div>
    {view === 'achievements' ? <div className="achievement-view">
      <div className="achievement-summary"><strong>{completedAchievements}</strong><span>/ {soloAchievementDefinitions.length} 獲得</span><div className="achievement-summary-meter"><i style={{ width: `${completedAchievements / soloAchievementDefinitions.length * 100}%` }} /></div></div>
      {(Object.keys(soloAchievementCategoryLabels) as SoloAchievementCategory[]).map((category) => {
        const definitions = soloAchievementDefinitions.filter((definition) => definition.category === category);
        const completed = definitions.filter((definition) => state.achievements[definition.id] === true).length;
        return <section className="achievement-group" key={category}><header><strong>{soloAchievementCategoryLabels[category]}</strong><span>{completed}/{definitions.length}</span></header><div className="achievement-list">{definitions.map((definition) => {
          const progress = soloAchievementProgress(state, definition);
          const isNew = newAtOpen.has(definition.id);
          return <article key={definition.id} className={`achievement-row ${progress.completed ? 'completed' : ''} ${state.gameData.selectedAchievementId === definition.id ? 'selected' : ''}`}><span className="achievement-medal">{progress.completed ? '◆' : '◇'}</span><div><strong>{definition.displayName}{isNew && <em>NEW</em>}</strong><small>{definition.description}</small><div className="achievement-progress"><i style={{ width: `${progress.ratio * 100}%` }} /></div><small>{Math.min(progress.current, definition.target).toLocaleString()} / {definition.target.toLocaleString()}</small></div>{progress.completed && <button className="achievement-select" onClick={() => props.onSelectAchievement(state.gameData.selectedAchievementId === definition.id ? null : definition.id)}>{state.gameData.selectedAchievementId === definition.id ? '表示中' : '表示'}</button>}</article>;
        })}</div></section>;
      })}
    </div> : <>
      <div className="monster-level-tabs" aria-label="モンスターレベル">{Array.from({ length: 13 }, (_, index) => index + 1).map((level) => {
        const unlocked = level <= unlockedMaxLevel;
        const count = enemies.filter((enemy) => enemy.monsterLevel === level && state.gameData.discoveredEnemyIds.includes(enemy.id)).length;
        return <button key={level} className={safeLevel === level ? 'active' : ''} disabled={!unlocked} onClick={() => setCollectionMonsterLevel(level)}>Lv.{level}<small>{unlocked ? `${count}/50` : '🔒'}</small></button>;
      })}</div>
      <div className="collection-summary"><div><strong>{discovered}</strong><span>/ 50 発見</span></div><div><strong>{encounters}</strong><span>遭遇</span></div><div><strong>{kills}</strong><span>討伐</span></div></div>
      <div className="encyclopedia-grid">
        {levelEnemies.map((enemy) => {
          const seen = state.gameData.discoveredEnemyIds.includes(enemy.id);
          const enemyKills = state.gameData.killCounts[enemy.id] ?? 0;
          const enemyEncounters = state.gameData.encounterCounts[enemy.id] ?? 0;
          const mutatedEncounters = state.gameData.mutatedEncounterCounts[enemy.id] ?? 0;
          const captured = state.gameData.ownedPetEnemyIds.includes(enemy.id);
          return <article className={`monster-card ${seen ? '' : 'locked'} ${captured ? 'captured' : ''}`} key={enemy.id}>
            <span className="monster-glyph">{seen ? enemy.glyph : '?'}</span>
            <strong>{seen ? enemy.displayName : '???'}</strong>
            <small>{seen ? enemy.rarity.toUpperCase() : '未発見'}</small>
            {seen && <div className="monster-record"><span>遭遇 {enemyEncounters}</span><span>討伐 {enemyKills}</span>{mutatedEncounters > 0 && <span>変異 {mutatedEncounters}</span>}</div>}
            {seen && <em>{captured ? '✓ 捕獲済' : enemyKills >= 30 ? '捕獲解禁 · 1%' : `捕獲まで ${30 - enemyKills}`}</em>}
          </article>;
        })}
      </div>
    </>}
  </section>;
}

function RankingView({ state, onPublishingChanged }: Readonly<{ state: MinuteVanguardState; onPublishingChanged: (enabled: boolean) => void }>) {
  type RankingTab = 'recent' | PublicLeaderboardMetric | 'arena';
  const [rankingTab, setRankingTab] = useState<RankingTab>('recent');
  const [remoteStatus, setRemoteStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [remotePlayers, setRemotePlayers] = useState<readonly PublicPlayerSnapshot<MinuteVanguardPublicData>[]>([]);
  const [arenaEntries, setArenaEntries] = useState<readonly ArenaLeaderboardEntry[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [publishingEnabled, setPublishingEnabled] = useState(() => getMinuteVanguardOnlineClient().isPublishingEnabled());
  const [publishBusy, setPublishBusy] = useState(false);
  const [refreshSequence, setRefreshSequence] = useState(0);
  const own = createMinuteVanguardPublicData(state);

  useEffect(() => {
    let cancelled = false;
    const online = getMinuteVanguardOnlineClient();
    if (rankingTab === 'arena') {
      void online.listArenaLeaderboard(20)
        .then((entries) => {
          if (cancelled) return;
          setArenaEntries(entries);
          setRemotePlayers([]);
          setRemoteStatus('ready');
        })
        .catch(() => {
          if (cancelled) return;
          setArenaEntries([]);
          setRemoteStatus('error');
        });
      return () => { cancelled = true; };
    }
    const request = rankingTab === 'recent'
      ? publicPlayerDirectory.listPublicPlayers({ gameId: MINUTE_VANGUARD_GAME_ID, limit: 20 }).then((page) => page.players)
      : online.listLeaderboard(rankingTab, 20);
    void request
      .then((players) => {
        if (cancelled) return;
        setRemotePlayers(players);
        setArenaEntries([]);
        setRemoteStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setRemotePlayers([]);
        setRemoteStatus('error');
      });
    return () => { cancelled = true; };
  }, [rankingTab, refreshSequence]);

  const selected = remotePlayers.find((player) => player.playerId === selectedPlayerId);
  const togglePublishing = async () => {
    if (publishBusy) return;
    const online = getMinuteVanguardOnlineClient();
    setPublishBusy(true);
    try {
      if (publishingEnabled) {
        onPublishingChanged(false);
        try {
          await online.disablePublishing();
        } catch (error) {
          onPublishingChanged(true);
          throw error;
        }
        setPublishingEnabled(false);
      } else {
        await online.enablePublishing(state);
        setPublishingEnabled(true);
        onPublishingChanged(true);
      }
      setRemoteStatus('loading');
      setRefreshSequence((value) => value + 1);
    } catch {
      setRemoteStatus('error');
    } finally {
      setPublishBusy(false);
    }
  };
  const rankLabel = (index: number) => rankingTab === 'recent' ? '•' : `${index + 1}`;
  const selectRankingTab = (next: RankingTab) => {
    if (next === rankingTab) return;
    setRemoteStatus('loading');
    setSelectedPlayerId(null);
    setRankingTab(next);
  };

  return <section className="page-section ranking-page">
    <h1>ランキング</h1>
    <div className="subtabs ranking-tabs">
      <button className={rankingTab === 'recent' ? 'active' : ''} onClick={() => selectRankingTab('recent')}>最近</button>
      <button className={rankingTab === 'level' ? 'active' : ''} onClick={() => selectRankingTab('level')}>Lv</button>
      <button className={rankingTab === 'victories' ? 'active' : ''} onClick={() => selectRankingTab('victories')}>討伐</button>
      <button className={rankingTab === 'codex' ? 'active' : ''} onClick={() => selectRankingTab('codex')}>図鑑</button>
      <button className={rankingTab === 'arena' ? 'active' : ''} onClick={() => selectRankingTab('arena')}>Arena</button>
    </div>

    {rankingTab === 'arena' ? <>
      <p className="ranking-authority-note arena-authority-note"><strong>SERVER AUTHORITY</strong> Arena順位はWorker/D1が保持するシーズンスコアで決まります。ローカルsaveのLv・装備・Goldは競技順位や勝敗に使いません。</p>
      {remoteStatus === 'loading' && <p className="offline-label">Arena順位を読み込んでいます…</p>}
      {remoteStatus === 'error' && <p className="offline-label error">Arena順位を取得できません。ソロプレイには影響しません。</p>}
      {remoteStatus === 'ready' && arenaEntries.length === 0 && <p className="empty-state">今シーズンのArena参加者はまだいません。</p>}
      <div className="ranking-list arena-ranking-list">{arenaEntries.map((entry) => <div className="rank-row arena-rank-row" key={entry.playerId}>
        <b>{entry.isChampion ? '♛' : entry.rank}</b><span>🧑‍🚀</span><strong>{entry.displayName}<small>{jobDisplayName(entry.jobId)} · Rate {entry.rating.toLocaleString()}</small></strong><em>{entry.seasonScore.toLocaleString()} pt</em>
      </div>)}</div>
    </> : <>
      <div className="self-public-card">
        <span>あなた</span><strong>{state.gameData.player.name}</strong><em>Lv.{own.level} · {jobDisplayName(own.jobId)}</em>
        <small>{own.victories.toLocaleString()}勝 / 図鑑 {own.discoveredEnemyCount}/{enemies.length} / ペット {own.ownedPetCount}</small>
        <button className={publishingEnabled ? 'publishing' : ''} disabled={publishBusy} onClick={() => void togglePublishing()}>
          {publishBusy ? '同期中…' : publishingEnabled ? '公開中 · 停止する' : '公開プロフィールを有効にする'}
        </button>
      </div>

      <p className="ranking-authority-note">公開は任意です。送信するのは表示名・Lv・戦績・図鑑数・装備要約だけで、セーブデータは送信しません。ここは公開プロフィール由来の参考順位で、Arenaの競技authorityではありません。</p>
      {remoteStatus === 'loading' && <p className="offline-label">公開冒険者を読み込んでいます…</p>}
      {remoteStatus === 'error' && <p className="offline-label error">オンライン一覧を取得できません。ソロプレイはそのまま続けられます。</p>}
      {remoteStatus === 'ready' && remotePlayers.length === 0 && <p className="empty-state">公開中の冒険者はまだいません。</p>}

      <div className="ranking-list">{remotePlayers.map((player, index) => <button
        className={`rank-row public-player-row ${selectedPlayerId === player.playerId ? 'selected' : ''}`}
        key={player.playerId}
        onClick={() => setSelectedPlayerId((current) => current === player.playerId ? null : player.playerId)}
      >
        <b>{rankLabel(index)}</b><span>🧑‍🚀</span><strong>{player.displayName}<small>{jobDisplayName(player.data.jobId)} · {player.data.victories.toLocaleString()}勝</small></strong><em>{rankingTab === 'codex' ? `${player.data.discoveredEnemyCount}/${enemies.length}` : rankingTab === 'victories' ? `${player.data.victories.toLocaleString()}勝` : `Lv.${player.data.level}`}</em>
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
    </>}
  </section>;
}

function BattleResultModal(props: Readonly<{ result: BattleResult; step: number; jobName: string; recoveryAmount: number; onRecover: () => void; onClose: () => void }>) {
  const currentTurn = props.step === 0 ? undefined : props.result.turns[Math.min(props.step - 1, props.result.turns.length - 1)];
  const playerHp = currentTurn?.playerHpAfter ?? props.result.playerHpStart;
  const enemyHp = currentTurn?.enemyHpAfter ?? props.result.enemyHpMax;
  const complete = props.step >= props.result.turns.length;
  const scene = battleSceneProps(props.result.monsterLevel);
  return <div className="modal-backdrop battle-modal-backdrop"><section className="battle-result-modal">
    <div className={`battle-stage ${scene.className}`} data-scene={scene.label}>
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
      {(props.result.goldBreakdown.length > 0 || props.result.expBreakdown.length > 0) && <div className="reward-breakdown-grid">
        <RewardBreakdown title="GOLD" total={props.result.goldDelta} entries={props.result.goldBreakdown} />
        <RewardBreakdown title="EXP" total={props.result.expGained} entries={props.result.expBreakdown} />
      </div>}
      {props.result.streakMultiplier > 1 && <p>🔥 {props.result.streak}連続討伐 ×{props.result.streakMultiplier}</p>}
      {props.result.jackpotMultiplier > 1 && <p className="gold-highlight">JACKPOT ×{props.result.jackpotMultiplier}</p>}
      {props.result.permanentStatReward && <p className="purple-highlight">恒久 {STAT_LABELS[props.result.permanentStatReward.stat]} +{props.result.permanentStatReward.amount}</p>}
      {props.result.levelGrowths.map((growth) => <p key={growth.level} className={growth.greatGrowth ? 'great-growth' : ''}>Lv.{growth.level} UP {growth.greatGrowth ? '★ 大成長！' : ''}</p>)}
      {(props.result.droppedItemInstanceId || props.result.droppedOrbInstanceId) && <p>🎁 ドロップを獲得しました</p>}
      {props.result.capturedPetEnemyId && <p className="pet-capture-highlight">{props.result.capturedPetMutated ? '★ 変異種がなついた！ 成長ボーナス+1%' : '🐾 モンスターがなついて仲間になった！'}</p>}
      {props.result.petSnacksGained > 0 && <p className="pet-snack-highlight">🍖 おやつ +{props.result.petSnacksGained}</p>}
      {props.result.droppedTitleId && <p className="title-drop-highlight">◇ 肩書き「{titleDefinitions.find((definition) => definition.id === props.result.droppedTitleId)?.displayName ?? '???'}」{props.result.titleCopyAdded ? 'を獲得！' : 'はLv.5のため増えなかった'}</p>}
      {props.result.outcome === 'defeat' && props.recoveryAmount > 0 && <button className="defeat-recovery-button modal-recovery" onClick={props.onRecover}>💎100で {props.recoveryAmount.toLocaleString()}G を回収</button>}
      <button className="modal-primary" onClick={props.onClose}>閉じる</button>
    </div>}
  </section></div>;
}

function RewardBreakdown(props: Readonly<{ title: string; total: number; entries: readonly RewardBreakdownEntry[] }>) {
  if (props.entries.length === 0) return <div className="reward-breakdown empty"><header><strong>{props.title}</strong><b>{props.total.toLocaleString()}</b></header><small>変化なし</small></div>;
  return <div className="reward-breakdown"><header><strong>{props.title}</strong><b>{props.total.toLocaleString()}</b></header>{props.entries.map((entry, index) => <div key={`${entry.label}-${index}`}><span>{entry.label}</span><em>{formatRewardBreakdownValue(entry)}</em></div>)}</div>;
}

function formatRewardBreakdownValue(entry: RewardBreakdownEntry): string {
  if (entry.mode === 'base') return entry.value.toLocaleString();
  if (entry.mode === 'additive') return `+${entry.value.toLocaleString()}`;
  if (entry.mode === 'rate') return `${Math.round(entry.value * 100)}%`;
  return `×${Number.isInteger(entry.value) ? entry.value : entry.value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}`;
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

function PetView(props: Readonly<{ state: MinuteVanguardState; onToggle: (petId: string, active: boolean) => void; onGacha: (count: 1 | 10) => void; onTrain: (petId: string) => void; onRename: (petId: string, nickname: string) => void; onBuySnacks: () => void }>) {
  const [renamingPetId, setRenamingPetId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const owned = ownedPetIds(props.state).map((id) => petCatalogEntry(id)).filter((pet): pet is NonNullable<ReturnType<typeof petCatalogEntry>> => pet !== null);
  const activeLimit = currentJob(props.state).id === 'job.tamer' ? 2 : 1;
  const totalTraining = totalPetTrainingLevels(props.state);
  const growthBonus = petTrainingGrowthBonusPct(props.state);
  const snackRemaining = petSnackAutoRemainingSec(props.state);
  const pickup = petCatalogEntry(dailyPetPickupId(props.state));
  const singleCost = petGachaSingleCost(props.state);
  const captureGearMultiplier = petCaptureEquipmentMultiplier(props.state);
  const tamerMultiplier = currentJob(props.state).id === 'job.tamer' ? 1.5 : 1;
  const baseCapturePct = captureGearMultiplier * tamerMultiplier;
  return <div className="pet-view">
    <div className="pet-party-summary">
      <div><span>参戦中</span><strong>{props.state.gameData.activePetEnemyIds.length} / {activeLimit}</strong></div>
      <div><span>総訓練Lv</span><strong>{totalTraining}</strong><small>成長 +{growthBonus}%</small></div>
      <small>捕獲・ガチャ限定をまとめて編成。訓練したペットほど追撃が強くなります。</small>
      <small className="pet-capture-rate">捕獲基礎 {baseCapturePct.toFixed(baseCapturePct % 1 === 0 ? 0 : 1)}% · 装備 ×{captureGearMultiplier}{tamerMultiplier > 1 ? ' · テイマー ×1.5' : ''}</small>
    </div>
    <div className="pet-pickup-card">
      <span className="pet-glyph">{pickup?.glyph ?? '🐾'}</span><div><small>今日のピックアップ · 排出率×2</small><strong>{pickup?.displayName ?? '???'}</strong><em>{pickup?.rarity.toUpperCase() ?? ''}</em></div>
    </div>
    <div className="pet-gacha-actions"><button onClick={() => props.onGacha(1)}><strong>1回</strong><small>💎{singleCost}{singleCost === 100 ? ' · 初回' : ''}</small></button><button onClick={() => props.onGacha(10)}><strong>10連</strong><small>💎3,000</small></button></div>
    <div className="pet-snack-bar">
      <div><span>🍖 おやつ</span><strong>{props.state.gameData.petSnacks.toLocaleString()}</strong><small>{props.state.gameData.petSnacks >= 100 ? '無料チャージ停止中' : `次まで ${formatRemainingTime(snackRemaining)}`}</small></div>
      <button onClick={props.onBuySnacks}>💎100<br/><b>+100個</b></button>
    </div>
    {owned.length === 0 ? <p className="empty-state">まだペットはいません。30体討伐して捕獲を狙うか、ペットガチャで仲間を増やしてください。</p> : <div className="pet-list">{owned.map((pet) => {
      const active = props.state.gameData.activePetEnemyIds.includes(pet.id);
      const kills = pet.source === 'capture' ? props.state.gameData.killCounts[pet.id] ?? 0 : null;
      const mutatedCaptured = pet.source === 'capture' && props.state.gameData.mutatedPetEnemyIds.includes(pet.id);
      const level = petTrainingLevel(props.state, pet.id);
      const cap = petTrainingCap(pet.id) ?? level;
      const nickname = props.state.gameData.petTraining[pet.id]?.nickname ?? null;
      const displayName = petDisplayName(props.state, pet.id);
      const renaming = renamingPetId === pet.id;
      const draftLength = Array.from(nicknameDraft.trim()).length;
      return <article key={pet.id} className={`pet-row ${active ? 'active' : ''} ${renaming ? 'renaming' : ''}`}>
        <span className="pet-glyph">{pet.glyph}</span>
        <div className="pet-row-main"><div className="pet-name-line"><strong>{displayName}</strong><button aria-label={`${displayName}の名前を変更`} onClick={() => { setRenamingPetId(pet.id); setNicknameDraft(nickname ?? ''); }}>✎</button></div>{nickname && <small className="pet-original-name">元の名前：{pet.displayName}</small>}<small>{pet.rarity.toUpperCase()} · {pet.source === 'gacha' ? 'ガチャ限定' : `討伐 ${kills}${mutatedCaptured ? ' · ★変異捕獲' : ''}`}{pet.specialEffect ? ` · ${petSpecialEffectLabel(pet.specialEffect)}` : ''}</small><div className="pet-training-meter"><span style={{ width: `${cap <= 0 ? 0 : Math.min(100, level / cap * 100)}%` }} /><em>訓練 Lv.{level} / {cap}</em></div>{renaming && <div className="pet-rename-editor"><input autoFocus value={nicknameDraft} onChange={(event) => setNicknameDraft(event.target.value)} placeholder={pet.displayName} aria-label="ペットの新しい名前" /><span className={draftLength > 12 ? 'over' : ''}>{draftLength}/12</span><button disabled={draftLength > 12} onClick={() => { props.onRename(pet.id, nicknameDraft); setRenamingPetId(null); }}>保存</button><button onClick={() => setRenamingPetId(null)}>取消</button></div>}</div>
        <div className="pet-row-actions"><button className={active ? 'active' : ''} onClick={() => props.onToggle(pet.id, !active)}>{active ? '参戦中' : '編成'}</button><button disabled={props.state.gameData.petSnacks <= 0 || level >= cap} onClick={() => props.onTrain(pet.id)}>{level >= cap ? 'MAX' : '🍖 育成'}</button></div>
      </article>;
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

function OrbReplacementModal(props: Readonly<{ state: MinuteVanguardState; onResolve: (discardItemId: string) => void }>) {
  const pendingId = props.state.gameData.pendingOrbReplacementItemId;
  if (pendingId === null) return null;
  const pending = props.state.gameData.inventory[pendingId];
  if (pending?.data?.kind !== 'orb') return null;
  const currentOrbId = props.state.gameData.loadout.equipped.orb;
  const candidates = Object.values(props.state.gameData.inventory).filter((item) => item.data?.kind === 'orb' && item.instanceId !== pendingId);
  return <div className="modal-backdrop"><section className="sheet-modal orb-replacement-modal">
    <header><h2>オーブがいっぱいです</h2></header>
    <div className="sheet-content">
      <p className="modal-description">新しいドロップを受け取るには、手持ちのオーブを1個入れ替えてください。保護中・装備中は選べません。</p>
      <div className="replacement-new-orb"><span>NEW</span><strong>{pending.data.orbRank} オーブ · 合計 {sumPercent(pending.data)}%</strong><small>{pending.data.effectId ? `${effectLabel(pending.data.effectId)} ${formatEffectValue(pending.data)}` : '特殊効果なし'}</small></div>
      <button className="replacement-discard-new" onClick={() => props.onResolve(pendingId)}>新しいオーブを捨てる</button>
      <h3 className="list-heading">入れ替える手持ち</h3>
      <div className="replacement-orb-list">{candidates.map((item) => {
        if (item.data?.kind !== 'orb') return null;
        const protectedItem = item.instanceId === currentOrbId || item.data.favorite === true || item.data.locked === true;
        return <button key={item.instanceId} disabled={protectedItem} onClick={() => props.onResolve(item.instanceId)}><span>{protectedItem ? '🔒' : '↔'}</span><div><strong>{item.data.orbRank} オーブ · 合計 {sumPercent(item.data)}%</strong><small>{item.data.effectId ? `${effectLabel(item.data.effectId)} ${formatEffectValue(item.data)}` : '特殊効果なし'}{protectedItem ? ' · 保護中' : ''}</small></div></button>;
      })}</div>
    </div>
  </section></div>;
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
  const missions = dailyMissions(props.state);
  const claimedCount = props.state.gameData.missionProgress.claimed.length;
  const nextReward = dailyMissionNextReward(props.state);
  return <ModalFrame title="デイリーミッション" onClose={props.onClose}>
    <p className="modal-description">毎日0時(JST)に5カテゴリから1個ずつ更新。達成した個数に応じて 💎3 / 3 / 4 / 5 / 5、合計20ジェム。</p>
    <div className="daily-reward-track">{[3, 3, 4, 5, 5].map((reward, index) => <span key={index} className={index < claimedCount ? 'claimed' : index === claimedCount ? 'next' : ''}>{index < claimedCount ? '✓' : index + 1}<small>💎{reward}</small></span>)}</div>
    <div className="mission-list">{missions.map((mission) => {
      const value = dailyMissionValue(props.state, mission);
      const done = value >= mission.target;
      const claimed = props.state.gameData.missionProgress.claimed.includes(mission.id);
      return <div key={mission.id} className={done ? 'done' : ''}><span>{claimed ? '✓' : done ? '!' : '○'}</span><strong>{mission.label}</strong><small>{Math.min(value, mission.target)} / {mission.target}</small><button disabled={!done || claimed} onClick={() => props.onClaim(mission.id)}>{claimed ? '受取済' : `💎${nextReward} 受取`}</button></div>;
    })}</div>
    <p className="modal-description">本日 {claimedCount}/5 受取済。ソロ版ではオンライン対戦ミッションの代わりに装備・図鑑系のカテゴリが出ます。</p>
  </ModalFrame>;
}

function JobModal(props: Readonly<{ state: MinuteVanguardState; onClose: () => void; onChange: (jobId: string) => void }>) {
  const cost = jobChangeCost(props.state);
  const requirement = currentJobBonusRequirement(props.state);
  return <ModalFrame title="転職" onClose={props.onClose}><div className="job-summary"><span>現在 Lv.{props.state.gameData.player.level}</span><strong>{currentJob(props.state).displayName}</strong><small>永続ボーナス条件 Lv.{requirement} / 費用 {cost.toLocaleString()}G</small></div><div className="job-list">{availableJobs(props.state).map((job) => <button key={job.id} onClick={() => props.onChange(job.id)} disabled={props.state.gameData.player.level < 30 || goldBalance(props.state) < cost}><span>♟</span><span><strong>{job.displayName}</strong><small>{job.skillName} — {job.skillDescription}</small></span><em>選ぶ</em></button>)}</div><p className="modal-description">転職するとLv.1へ戻ります。装備・ジェム・討伐数は保持されます。</p></ModalFrame>;
}

function MimicBankModal(props: Readonly<{ state: MinuteVanguardState; onClose: () => void; onDeposit: () => void; onWithdraw: (cost: MimicBankGemCost) => void }>) {
  const carried = Math.floor(goldBalance(props.state));
  const bank = Math.floor(props.state.gameData.mimicBankGold);
  const last = props.state.gameData.lastMimicBankResult;
  return <ModalFrame title="ミミック銀行" onClose={props.onClose}>
    <div className="mimic-bank-balance"><span>手持ち<strong>{carried.toLocaleString()} G</strong></span><span>預け入れ<strong>{bank.toLocaleString()} G</strong></span></div>
    <button className="mimic-deposit" onClick={props.onDeposit} disabled={carried <= 0}>手持ちGoldを全額預ける</button>
    <p className="modal-description">引き出すと、預けたGoldが10%・50%・100%・200%のどれかになって戻ります。多くのGemを使うほど好結果が増えます。</p>
    <div className="mimic-withdraw-options">{mimicBankGemCosts.map((cost) => <button key={cost} onClick={() => props.onWithdraw(cost)} disabled={bank <= 0 || gemBalance(props.state) < cost}>
      <strong>💎 {cost} で引き出す</strong>
      <span>{mimicBankOutcomes.map((outcome) => `${outcome.displayName} ${Math.round(mimicBankProductOwnedOdds[cost][outcome.id] * 100)}%`).join(' · ')}</span>
    </button>)}</div>
    <p className="mimic-owned-odds-note">※ 結果4種と10〜30Gemは公開仕様。各確率はMinute Vanguard独自バランスです。</p>
    {last !== null && <div className={`mimic-last-result ${last.multiplier >= 1 ? 'good' : 'bad'}`}><small>前回</small><strong>{last.multiplier === .1 ? '10%返却' : last.multiplier === .5 ? '半分' : last.multiplier === 1 ? '全額' : '2倍'}</strong><span>{last.depositedGold.toLocaleString()}G → {last.returnedGold.toLocaleString()}G</span></div>}
    <p className="mimic-loss-total">累計がぼられ：{Math.floor(props.state.gameData.mimicBankTotalLostGold).toLocaleString()} G</p>
  </ModalFrame>;
}

function LoginBonusModal(props: Readonly<{ state: MinuteVanguardState; onClose: () => void; onClaim: () => void }>) {
  const preview = loginBonusPreview(props.state);
  return <ModalFrame title="ログインボーナス" onClose={props.onClose}>
    <p className="modal-description">7日周期。1日空くと1日目へ戻ります。2〜6日目のGold額はMinute Vanguard独自バランスです。</p>
    <div className="login-bonus-grid">{LOGIN_BONUS_REWARDS.map((reward) => {
      const current = reward.day === preview.day;
      const completed = preview.available ? preview.day > 1 && reward.day < preview.day : reward.day <= props.state.gameData.loginBonus.streakDay;
      return <div key={reward.day} className={`${current ? 'current' : ''} ${completed ? 'completed' : ''}`}><b>{reward.day}日目</b><strong>{reward.gold.toLocaleString()} G</strong>{reward.gems > 0 && <em>＋💎 {reward.gems}</em>}</div>;
    })}</div>
    <button className="modal-primary login-claim-button" disabled={!preview.available} onClick={props.onClaim}>{preview.available ? `${preview.day}日目を受け取る · ${preview.gold.toLocaleString()}G${preview.gems > 0 ? ` + 💎${preview.gems}` : ''}` : '本日は受取済み'}</button>
  </ModalFrame>;
}

function MonsterTapGame(props: Readonly<{ state: MinuteVanguardState; onClose: () => void }>) {
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(window.localStorage.getItem('minute-vanguard.tap-best') ?? '0') || 0);
  const [target, setTarget] = useState<Readonly<{ cell: number; hero: boolean; glyph: string }> | null>(null);
  const unlocked = unlockedMonsterLevel(props.state);

  useEffect(() => {
    const pool = enemies.filter((enemy) => enemy.monsterLevel <= unlocked);
    const spawn = () => {
      const hero = Math.random() < 0.14;
      const enemy = pool[Math.floor(Math.random() * Math.max(1, pool.length))];
      setTarget({ cell: Math.floor(Math.random() * 6), hero, glyph: hero ? '🧙' : enemy?.glyph ?? '👾' });
    };
    spawn();
    const timer = window.setInterval(spawn, 720);
    return () => window.clearInterval(timer);
  }, [unlocked]);

  const applyScore = (delta: number) => {
    setScore((current) => {
      const next = current + delta;
      if (next > best) {
        setBest(next);
        window.localStorage.setItem('minute-vanguard.tap-best', String(next));
      }
      return next;
    });
  };

  const hit = (cell: number) => {
    if (target === null || target.cell !== cell || target.hero) applyScore(-3);
    else applyScore(1);
    setTarget(null);
  };

  return <ModalFrame title="モンスター叩き" onClose={props.onClose}>
    <div className="tap-game-head"><div><span>SCORE</span><strong>{score}</strong></div><div><span>BEST</span><strong>{best}</strong></div><small>{battleCooldown(props.state).ready ? '戦闘できます' : `本戦まで ${battleCooldown(props.state).remainingSec}秒`}</small></div>
    <p className="tap-game-rule">モンスターを叩くと +1。勇者や空マスは −3。報酬はありません。</p>
    <div className="tap-grid">{Array.from({ length: 6 }, (_, cell) => <button key={cell} aria-label={`マス ${cell + 1}`} onClick={() => hit(cell)}>{target?.cell === cell ? <span className={target.hero ? 'hero-decoy' : 'monster-target'}>{target.glyph}</span> : null}</button>)}</div>
    <p className="tap-game-foot">解放済み Lv.1〜{unlocked} の怪異が出現 · 自己ベストはこの端末だけに保存</p>
  </ModalFrame>;
}

function MenuModal(props: Readonly<{ loginAvailable: boolean; onLogin: () => void; onClose: () => void; onReset: () => void }>) {
  return <ModalFrame title="メニュー" onClose={props.onClose}><div className="menu-list"><button className={props.loginAvailable ? 'attention' : ''} onClick={props.onLogin}>🎁 ログインボーナス {props.loginAvailable ? '· 受取可能' : ''}</button><button>？ 遊び方</button><button>💡 アイデア・要望</button><button>📜 アップデート履歴</button><button>⚙ 設定</button><button className="danger-button" onClick={props.onReset}>↻ データをリセット</button></div></ModalFrame>;
}

function ModalFrame(props: Readonly<{ title: string; onClose: () => void; children: React.ReactNode }>) {
  return (
    <BottomSheet
      title={props.title}
      onClose={props.onClose}
      closeLabel="閉じる"
      backdropClassName="modal-backdrop"
      sheetClassName="sheet-modal"
    >
      <div className="sheet-content">{props.children}</div>
    </BottomSheet>
  );
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

function petSpecialEffectLabel(effect: 'regen' | 'guard' | 'followup' | 'tripleStrike'): string {
  if (effect === 'regen') return '毎ターン回復';
  if (effect === 'guard') return '被ダメ軽減';
  if (effect === 'followup') return '追加追撃';
  return '3倍の一撃';
}

function formatRemainingTime(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.max(0, totalSec % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function effectLabel(effectId: string): string {
  return ({ gemDrop: 'ジェムドロップ率', goldProtection: '敗北Gold保護', gold: '獲得Gold', exp: '獲得EXP', drawExp: '引き分けEXP', regen: '毎ターンHP回復', greatGrowth: '大成長率', critical: 'クリティカル率', evasion: '回避率', cooldown: 'クールダウン' } as Record<string, string>)[effectId] ?? effectId;
}

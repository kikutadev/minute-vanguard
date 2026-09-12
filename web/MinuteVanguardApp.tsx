import { useEffect, useRef, useState } from 'react';
import { GameSession } from '../application/game-session';
import { itemDefinitions, shopOffers } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import {
  advanceFromWallClock,
  battleCooldown,
  buyShopItem,
  changeJob,
  currentVocation,
  effectiveBattleCooldownSec,
  equipOwnedItem,
  expRequiredForNextLevel,
  fight,
  goldBalance,
  playerCombatStats,
  upgradeEquippedItem,
} from '../plugin/engine';

const session = new GameSession();

export function MinuteVanguardApp() {
  const [state, setState] = useState<MinuteVanguardState | null>(null);
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

  useEffect(() => {
    if (state === null) return;
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((current) => {
        if (current === null) return current;
        const advanced = advanceFromWallClock(current, Date.now()).state;
        stateRef.current = advanced;
        return advanced;
      });
    }, 500);
    const saver = window.setInterval(() => {
      const current = stateRef.current;
      if (current !== null) void session.save(current);
    }, 5_000);
    const onPageHide = () => {
      const current = stateRef.current;
      if (current !== null) void session.save(current);
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(saver);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  const commit = (next: MinuteVanguardState, message?: string) => {
    stateRef.current = next;
    setState(next);
    if (message !== undefined) setNotice(message);
    void session.save(next);
  };

  if (state === null) {
    return <main className="shell loading-shell"><div className="loading-mark">◷</div><p>鐘楼を開いています…</p></main>;
  }

  const cooldown = battleCooldown(state);
  const stats = playerCombatStats(state);
  const vocation = currentVocation(state);
  const gold = Math.floor(goldBalance(state));
  const expRequired = expRequiredForNextLevel(state.gameData.player.level);
  const expRatio = Math.min(100, (state.gameData.player.exp / expRequired) * 100);
  const inventory = Object.values(state.gameData.inventory).slice().reverse();
  const equippedIds = new Set(Object.values(state.gameData.loadout.equipped).filter((id): id is string => id !== null));
  const battle = state.gameData.lastBattle;

  const onFight = () => {
    const result = fight(state);
    if (!result.accepted) {
      setNotice(`次の鐘まで ${battleCooldown(state).remainingSec}秒`);
      return;
    }
    const latest = result.state.gameData.lastBattle;
    const extra = latest?.droppedItemInstanceId !== null ? ' 装備を発見。' : '';
    commit(result.state, latest?.victory === true ? `勝利。${extra}` : '敗北。装備とレベルを見直しましょう。');
  };

  const onBuy = (itemDefinitionId: string) => {
    const result = buyShopItem(state, itemDefinitionId);
    if (!result.accepted) {
      setNotice(result.reason === 'insufficient-gold' ? 'Goldが足りません。' : 'この商品は購入できません。');
      return;
    }
    commit(result.state, '装備を購入し、自動で比較しました。');
  };

  const onEquip = (itemInstanceId: string) => {
    const result = equipOwnedItem(state, itemInstanceId);
    if (!result.accepted) {
      setNotice('この装備は装着できません。');
      return;
    }
    commit(result.state, '装備を変更しました。');
  };

  const onUpgrade = (slotId: 'weapon' | 'armor') => {
    const result = upgradeEquippedItem(state, slotId);
    if (!result.accepted) {
      setNotice(result.reason === 'insufficient-gold' ? '強化用Goldが足りません。' : '先に装備してください。');
      return;
    }
    commit(result.state, `${slotId === 'weapon' ? '武器' : '防具'}を強化しました。`);
  };

  const onJobChange = () => {
    const result = changeJob(state);
    if (!result.accepted) {
      setNotice('転職にはLv.10が必要です。');
      return;
    }
    commit(result.state, `転職完了。Job Rank ${result.state.gameData.player.jobRank}。`);
  };

  const onReset = async () => {
    if (!window.confirm('セーブを消して最初から始めますか？')) return;
    const reset = await session.reset();
    commit(reset, '新しい見張りを開始しました。');
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">THE LAST BELL</p>
          <h1>MINUTE VANGUARD</h1>
        </div>
        <button className="icon-button" onClick={onReset} aria-label="セーブをリセット">↻</button>
      </header>

      <section className="resource-strip" aria-label="プレイヤー資源">
        <div><span>LV</span><strong>{state.gameData.player.level}</strong></div>
        <div><span>GOLD</span><strong>{gold.toLocaleString()}</strong></div>
        <div><span>SHARD</span><strong>{Math.floor(Number(state.currencies['currency.shard']?.mantissa ?? 0))}</strong></div>
        <div><span>JOB</span><strong>{state.gameData.player.jobRank}</strong></div>
      </section>

      <section className="exp-track" aria-label="経験値">
        <div className="exp-fill" style={{ width: `${expRatio}%` }} />
        <span>{state.gameData.player.exp} / {expRequired} EXP</span>
      </section>

      <section className="battle-card">
        <div className="battle-meta">
          <div><span className="status-dot" /> {vocation.displayName}</div>
          <div>{state.gameData.victories} WIN / {state.gameData.defeats} LOST</div>
        </div>

        <div className="arena">
          <Fighter badge="YOU" glyph="♙" name={vocation.displayName} sub={`HP ${stats.hp} · ATK ${stats.attack} · DEF ${stats.defense}`} />
          <div className="versus"><span>VS</span><small>#{state.gameData.totalBattles + 1}</small></div>
          <Fighter
            badge="BREACH"
            glyph={battle?.enemyGlyph ?? '◌'}
            name={battle?.enemyName ?? 'Unknown signal'}
            sub={battle === null ? '鐘が鳴れば敵が現れる' : battle.victory ? '前回 撃破' : '前回 生存'}
            enemy
          />
        </div>

        {battle !== null && (
          <div className={`result-line ${battle.victory ? 'win' : 'loss'}`}>
            <strong>{battle.victory ? 'VICTORY' : 'DEFEAT'}</strong>
            <span>{battle.turns.length} turns</span>
            {battle.goldGained > 0 && <span>+{battle.goldGained}G</span>}
            {battle.jackpotGold > 0 && <span className="rare">JACKPOT +{battle.jackpotGold}</span>}
            {battle.permanentPowerGain > 0 && <span className="rare">永久ATK +{battle.permanentPowerGain}</span>}
            {battle.discoveredEnemy && <span className="rare">NEW CODEX</span>}
          </div>
        )}

        <button
          className={`battle-button ${cooldown.ready ? 'ready' : ''}`}
          onClick={onFight}
          disabled={!cooldown.ready}
        >
          {cooldown.ready ? (
            <><span className="battle-button-main">BATTLE</span><span>鐘が鳴った。突破する</span></>
          ) : (
            <><span className="countdown">{cooldown.remainingSec}</span><span>次の鐘まで · 通常 {effectiveBattleCooldownSec(state)}秒</span></>
          )}
        </button>
        {notice.length > 0 && <p className="notice" role="status">{notice}</p>}
      </section>

      <section className="stats-grid">
        <Stat label="ATK" value={stats.attack} />
        <Stat label="DEF" value={stats.defense} />
        <Stat label="HP" value={stats.hp} />
        <Stat label="永久補正" value={`+${state.gameData.player.permanentPower}`} />
      </section>

      <section className="panel">
        <div className="panel-title">
          <div><span className="section-index">01</span><h2>装備</h2></div>
          <small>DROP / SHOP / UPGRADE</small>
        </div>
        <div className="equipped-row">
          <EquippedSlot state={state} slotId="weapon" label="WEAPON" onUpgrade={() => onUpgrade('weapon')} />
          <EquippedSlot state={state} slotId="armor" label="ARMOR" onUpgrade={() => onUpgrade('armor')} />
        </div>
        <div className="inventory-list">
          {inventory.length === 0 ? (
            <p className="empty-copy">まだ装備がありません。勝利時のDrop、または補給所で入手できます。</p>
          ) : inventory.map((item) => {
            const definition = itemDefinitions[item.definitionId];
            const data = item.data;
            return (
              <button key={item.instanceId} className={`inventory-item rarity-${data?.rarity ?? 'common'}`} onClick={() => onEquip(item.instanceId)}>
                <span className="item-mark">{data?.kind === 'weapon' ? '╱' : '▣'}</span>
                <span className="item-copy">
                  <strong>{definition?.displayName ?? item.definitionId} {data?.upgradeRank ? `+${data.upgradeRank}` : ''}</strong>
                  <small>{data?.rarity?.toUpperCase()} · {data?.attack ? `ATK +${data.attack}` : `DEF +${data?.defense ?? 0}`}</small>
                </span>
                <span className="item-action">{equippedIds.has(item.instanceId) ? 'EQUIPPED' : 'EQUIP'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div><span className="section-index">02</span><h2>補給所</h2></div>
          <small>確定入手</small>
        </div>
        <div className="shop-grid">
          {shopOffers.map((offer) => (
            <button key={offer.itemDefinitionId} className="shop-card" onClick={() => onBuy(offer.itemDefinitionId)}>
              <span>{offer.data.kind === 'weapon' ? '╱' : '▣'}</span>
              <strong>{itemDefinitions[offer.itemDefinitionId]?.displayName}</strong>
              <small>{offer.data.kind === 'weapon' ? `ATK +${offer.data.attack}` : `DEF +${offer.data.defense}`}</small>
              <em>{offer.price} G</em>
            </button>
          ))}
        </div>
      </section>

      <section className="panel job-panel">
        <div className="panel-title">
          <div><span className="section-index">03</span><h2>転職</h2></div>
          <small>永続進行</small>
        </div>
        <p>Lv.10で役目を継承。レベルは1へ戻りますが、装備・資源・図鑑は保持し、恒久ATKと戦闘間隔を強化します。</p>
        <button className="job-button" onClick={onJobChange} disabled={state.gameData.player.level < 10}>
          {state.gameData.player.level >= 10 ? 'JOB CHANGE' : `あと ${10 - state.gameData.player.level} Lv.`}
        </button>
      </section>

      <footer>
        <span>CODEX {state.gameData.discoveredEnemyIds.length} / 4</span>
        <span>seeded combat · local save</span>
      </footer>
    </main>
  );
}

function Fighter(props: Readonly<{ badge: string; glyph: string; name: string; sub: string; enemy?: boolean }>) {
  return (
    <div className={`fighter ${props.enemy === true ? 'enemy' : ''}`}>
      <span className="fighter-badge">{props.badge}</span>
      <div className="fighter-glyph">{props.glyph}</div>
      <strong>{props.name}</strong>
      <small>{props.sub}</small>
    </div>
  );
}

function Stat(props: Readonly<{ label: string; value: string | number }>) {
  return <div className="stat"><span>{props.label}</span><strong>{props.value}</strong></div>;
}

function EquippedSlot(props: Readonly<{
  state: MinuteVanguardState;
  slotId: 'weapon' | 'armor';
  label: string;
  onUpgrade: () => void;
}>) {
  const itemId = props.state.gameData.loadout.equipped[props.slotId];
  const item = itemId === null || itemId === undefined ? undefined : props.state.gameData.inventory[itemId];
  const data = item?.data;
  const definition = item === undefined ? undefined : itemDefinitions[item.definitionId];
  const upgradeCost = data === undefined ? 0 : 25 * (data.upgradeRank + 1);
  return (
    <div className="equipped-slot">
      <span>{props.label}</span>
      <strong>{definition?.displayName ?? 'EMPTY'} {data?.upgradeRank ? `+${data.upgradeRank}` : ''}</strong>
      <small>{data === undefined ? 'Drop or buy equipment' : data.kind === 'weapon' ? `ATK +${data.attack}` : `DEF +${data.defense}`}</small>
      <button onClick={props.onUpgrade} disabled={data === undefined}>強化 {data === undefined ? '' : `${upgradeCost}G`}</button>
    </div>
  );
}

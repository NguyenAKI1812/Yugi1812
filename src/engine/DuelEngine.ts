import {
  AtomicAction,
  Attribute,
  CardDefinition,
  CardEffect,
  ChainLinkNode,
  ChainResponseOption,
  DuelPhase,
  DuelState,
  EffectTrigger,
  FieldCardInstance,
  GameAction,
  HandCardInstance,
  MonsterRace,
  PendingChainPrompt,
  PendingSelectionPrompt,
  PlayerId,
  PlayerState,
  ResolvedChainRecord,
} from '../types/game';
import { getCardById, getShortCardTitle } from '../data/cards.catalog';

let uidCounter = 1;
function nextUid(prefix = 'inst'): string {
  uidCounter += 1;
  return `${prefix}_${Date.now()}_${uidCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

export function getOpponentId(playerId: PlayerId): PlayerId {
  return playerId === 'host' ? 'guest' : 'host';
}

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Tạo trạng thái trận đấu mới từ 2 bộ bài
 */
export function createInitialDuelState(
  hostName: string,
  hostAvatar: string,
  hostMainDeckIds: string[],
  hostExtraDeckIds: string[],
  guestName: string,
  guestAvatar: string,
  guestMainDeckIds: string[],
  guestExtraDeckIds: string[]
): DuelState {
  const buildPlayer = (
    id: PlayerId,
    name: string,
    avatar: string,
    mainIds: string[],
    extraIds: string[]
  ): PlayerState => {
    const shuffledMain = shuffleArray(mainIds).map((cardId) => ({
      instanceId: nextUid(`${id}_card`),
      cardId,
      owner: id,
    }));
    const extraDeck = extraIds.map((cardId) => ({
      instanceId: nextUid(`${id}_extra`),
      cardId,
      owner: id,
    }));
    const hand = shuffledMain.splice(0, 5);

    return {
      id,
      name,
      avatar,
      lp: 8000,
      deck: shuffledMain,
      hand,
      extraDeck,
      graveyard: [],
      monsterZones: [null, null, null, null, null],
      spellTrapZones: [null, null, null, null, null],
      fieldZone: null,
      normalSummonUsedThisTurn: false,
      attackLockedTurns: 0,
    };
  };

  const hostPlayer = buildPlayer('host', hostName, hostAvatar, hostMainDeckIds, hostExtraDeckIds);
  const guestPlayer = buildPlayer('guest', guestName, guestAvatar, guestMainDeckIds, guestExtraDeckIds);

  return {
    duelId: nextUid('duel'),
    turnNumber: 1,
    currentTurnPlayer: 'host',
    phase: 'MAIN1',
    players: {
      host: hostPlayer,
      guest: guestPlayer,
    },
    pendingChain: null,
    pendingSelection: null,
    winner: null,
    winReasonVi: null,
    logs: [
      `⚔️ Trận đấu bắt đầu! ${hostName} (8000 LP) vs ${guestName} (8000 LP).`,
      `🎲 Lượt 1: ${hostName} đi trước (Vào thẳng Main Phase 1).`,
    ],
    lastEvent: {
      id: nextUid('ev'),
      type: 'SUMMON',
      messageVi: `Bắt đầu trận đấu! Lượt của ${hostName}`,
      timestamp: Date.now(),
    },
    recentEvents: [],
    lastResolvedChain: null,
    recentResolvedChains: [],
  };
}

/**
 * Số quái cần hiến tế theo Level chuẩn Yu-Gi-Oh!
 */
export function getRequiredTributes(card: CardDefinition): number {
  const level = card.level ?? 4;
  if (level <= 4) return 0;
  if (level <= 6) return 1;
  return 2;
}

/**
 * Quy đổi danh tính lá bài hiệu lực trên sân / dưới Mộ
 * (VD: Blue-Eyes Alternative & Dragon Spirit of White được tính là Blue-Eyes White Dragon;
 *  Magician of Dark Illusion, DM the Dragon Knight, Magician of Chaos được tính là Dark Magician)
 */
export function getEffectiveCardIdentities(
  cardId: string,
  location: 'FIELD' | 'GY' | 'HAND'
): string[] {
  const ids = [cardId];
  if (location === 'FIELD' || location === 'GY') {
    if (
      cardId === 'blue_eyes_alternative_white_dragon' ||
      cardId === 'dragon_spirit_of_white'
    ) {
      ids.push('blue_eyes_white_dragon');
    }
    if (
      cardId === 'magician_of_dark_illusion' ||
      cardId === 'dark_magician_the_dragon_knight' ||
      cardId === 'magician_of_chaos'
    ) {
      ids.push('dark_magician');
    }
  }
  return ids;
}

/**
 * Tính chỉ số ATK / DEF thực tế trên sân (sau khi cộng Field Spell, Continuous S/T, Equip Spell, Continuous Monster Effect)
 */
export function getEffectiveStats(
  state: DuelState,
  fieldCard: FieldCardInstance
): { atk: number; def: number; baseAtk: number; baseDef: number } {
  const def = getCardById(fieldCard.cardId);
  if (!def || def.category !== 'MONSTER') {
    return { atk: 0, def: 0, baseAtk: 0, baseDef: 0 };
  }

  const baseAtk = def.atk ?? 0;
  const baseDef = def.def ?? 0;

  // Quái đang úp không nhận hiệu ứng hiển thị công khai cho tới khi lật ngửa
  if (fieldCard.position === 'SET_DEFENSE') {
    return { atk: baseAtk, def: baseDef, baseAtk, baseDef };
  }

  let atk = baseAtk;
  let defense = baseDef;

  // 1. Hiệu ứng từ Field Spell & Continuous Spell/Trap ngửa (VD: Yami, Mountain, Dark Magical Circle, Piercing the Darkness)
  for (const pid of ['host', 'guest'] as PlayerId[]) {
    const fz = state.players[pid].fieldZone;
    if (fz && fz.position === 'FACE_UP') {
      const fCard = getCardById(fz.cardId);
      fCard?.effects?.forEach((eff) => {
        if (eff.trigger === 'CONTINUOUS_FIELD' && eff.continuous) {
          if (
            !eff.continuous.affectedRaces ||
            (def.race && eff.continuous.affectedRaces.includes(def.race))
          ) {
            atk += eff.continuous.atkDelta;
            defense += eff.continuous.defDelta;
          }
        }
      });
    }

    for (const st of state.players[pid].spellTrapZones) {
      if (st && st.position === 'FACE_UP') {
        const stCard = getCardById(st.cardId);
        stCard?.effects?.forEach((eff) => {
          if (eff.trigger === 'CONTINUOUS_FIELD' && eff.continuous && fieldCard.controller === pid) {
            if (
              !eff.continuous.affectedRaces ||
              (def.race && eff.continuous.affectedRaces.includes(def.race))
            ) {
              atk += eff.continuous.atkDelta;
              defense += eff.continuous.defDelta;
            }
          }
        });
      }
    }
  }

  // 2. Hiệu ứng từ Equip Spell đang gắn vào quái này
  for (const pid of ['host', 'guest'] as PlayerId[]) {
    for (const st of state.players[pid].spellTrapZones) {
      if (st && st.position === 'FACE_UP' && st.equippedToInstanceId === fieldCard.instanceId) {
        const stCard = getCardById(st.cardId);
        stCard?.effects?.forEach((eff) => {
          if (eff.trigger === 'CONTINUOUS_EQUIP' && eff.continuous) {
            atk += eff.continuous.atkDelta;
            defense += eff.continuous.defDelta;
          }
        });
      }
    }
  }

  // 3. Hiệu ứng tự thân của quái thú (VD: Dark Magician Girl, Buster Blader, Dark Paladin, Blue-Eyes Shining, Dark Cavalry)
  const controllerId = fieldCard.controller;
  const oppOfController = getOpponentId(controllerId);

  def.effects?.forEach((eff) => {
    if (eff.trigger === 'CONTINUOUS_MONSTER' && eff.continuous) {
      const c = eff.continuous;
      if (c.perCardInGY && c.perCardInGY.length > 0) {
        const targetIds = new Set(c.perCardInGY);
        const countInGys =
          state.players.host.graveyard.filter((g) =>
            getEffectiveCardIdentities(g.cardId, 'GY').some((id) => targetIds.has(id))
          ).length +
          state.players.guest.graveyard.filter((g) =>
            getEffectiveCardIdentities(g.cardId, 'GY').some((id) => targetIds.has(id))
          ).length;
        atk += c.atkDelta * countInGys;
        defense += c.defDelta * countInGys;
      } else if (c.perRaceOnFieldAndGY && c.perRaceOnFieldAndGY.length > 0) {
        const raceSet = new Set(c.perRaceOnFieldAndGY);
        const pids: PlayerId[] = c.countOpponentOnly ? [oppOfController] : ['host', 'guest'];
        let count = 0;
        for (const pid of pids) {
          const p = state.players[pid];
          count += p.monsterZones.filter((m) => {
            if (!m || m.position === 'SET_DEFENSE') return false;
            const d = getCardById(m.cardId);
            return Boolean(d?.race && raceSet.has(d.race));
          }).length;
          count += p.graveyard.filter((g) => {
            const d = getCardById(g.cardId);
            return Boolean(d?.race && raceSet.has(d.race));
          }).length;
        }
        atk += c.atkDelta * count;
        defense += c.defDelta * count;
      } else if (c.perRaceInOwnGY && c.perRaceInOwnGY.length > 0) {
        const raceSet = new Set(c.perRaceInOwnGY);
        const ownCount = state.players[controllerId].graveyard.filter((g) => {
          const d = getCardById(g.cardId);
          return Boolean(d?.race && raceSet.has(d.race));
        }).length;
        atk += c.atkDelta * ownCount;
        defense += c.defDelta * ownCount;
      } else if (c.perCategoryOnFieldAndGY && c.perCategoryOnFieldAndGY.length > 0) {
        const catSet = new Set<string>(c.perCategoryOnFieldAndGY);
        let count = 0;
        for (const pid of ['host', 'guest'] as PlayerId[]) {
          const p = state.players[pid];
          count += p.graveyard.filter((g) => {
            const d = getCardById(g.cardId);
            return Boolean(d && catSet.has(d.category));
          }).length;
          count += p.spellTrapZones.filter((st) => {
            if (!st || st.position === 'SET') return false;
            const d = getCardById(st.cardId);
            return Boolean(d && catSet.has(d.category));
          }).length;
          if (p.fieldZone && p.fieldZone.position === 'FACE_UP') {
            const fd = getCardById(p.fieldZone.cardId);
            if (fd && catSet.has(fd.category)) count += 1;
          }
        }
        atk += c.atkDelta * count;
        defense += c.defDelta * count;
      } else {
        atk += c.atkDelta;
        defense += c.defDelta;
      }
    }
  });

  return {
    atk: Math.max(0, atk),
    def: Math.max(0, defense),
    baseAtk,
    baseDef,
  };
}

/**
 * Kiểm tra xem 1 quái thú trên sân có được bảo vệ khỏi việc bị đối phương chọn làm mục tiêu không (VD: Lord of D.)
 */
export function isProtectedFromOpponentTargeting(
  state: DuelState,
  targetCard: FieldCardInstance,
  actorPlayerId: PlayerId
): boolean {
  if (targetCard.controller === actorPlayerId) return false;
  if (targetCard.position === 'SET_DEFENSE') return false;
  const targetDef = getCardById(targetCard.cardId);
  if (!targetDef || !targetDef.race) return false;

  const controllerState = state.players[targetCard.controller];
  for (const mz of controllerState.monsterZones) {
    if (mz && mz.position !== 'SET_DEFENSE') {
      const mDef = getCardById(mz.cardId);
      const protects = mDef?.effects?.some(
        (eff) =>
          eff.trigger === 'CONTINUOUS_MONSTER' &&
          eff.continuous?.protectsRaceFromTargeting?.includes(targetDef.race!)
      );
      if (protects) return true;
    }
  }
  return false;
}

interface FusionMaterialCandidate {
  source: 'HAND' | 'FIELD' | 'GY';
  instanceId: string;
  cardId: string;
  identities: string[];
  race?: MonsterRace;
  attribute?: Attribute;
}

function doesCandidateMatchFusionReq(cand: FusionMaterialCandidate, req: string): boolean {
  if (req.startsWith('RACE:')) {
    return cand.race === req.slice(5);
  }
  if (req.startsWith('ATTR:')) {
    return cand.attribute === req.slice(5);
  }
  return cand.identities.includes(req);
}

function buildFusionMaterialPool(
  player: PlayerState,
  includeGy: boolean
): FusionMaterialCandidate[] {
  const pool: FusionMaterialCandidate[] = [];
  for (const h of player.hand) {
    const d = getCardById(h.cardId);
    if (!d || d.category !== 'MONSTER') continue;
    pool.push({
      source: 'HAND',
      instanceId: h.instanceId,
      cardId: h.cardId,
      identities: getEffectiveCardIdentities(h.cardId, 'HAND'),
      race: d.race,
      attribute: d.attribute,
    });
  }
  for (const m of player.monsterZones) {
    if (!m) continue;
    const d = getCardById(m.cardId);
    if (!d || d.category !== 'MONSTER') continue;
    pool.push({
      source: 'FIELD',
      instanceId: m.instanceId,
      cardId: m.cardId,
      identities: getEffectiveCardIdentities(m.cardId, 'FIELD'),
      race: d.race,
      attribute: d.attribute,
    });
  }
  if (includeGy) {
    for (const g of player.graveyard) {
      const d = getCardById(g.cardId);
      if (!d || d.category !== 'MONSTER') continue;
      pool.push({
        source: 'GY',
        instanceId: g.instanceId,
        cardId: g.cardId,
        identities: getEffectiveCardIdentities(g.cardId, 'GY'),
        race: d.race,
        attribute: d.attribute,
      });
    }
  }
  return pool;
}

/**
 * Kiểm tra những quái Dung Hợp nào trong Extra Deck đang đủ nguyên liệu trên Tay + Sân (hoặc cả dưới Mộ / qua Nhãn Thần Timaeus)
 */
export function getAvailableFusionSummons(
  state: DuelState,
  playerId: PlayerId,
  options?: { allowGy?: boolean; onlyMaterialInstanceId?: string }
): { extraCard: HandCardInstance; def: CardDefinition }[] {
  const player = state.players[playerId];

  // Chế độ Nhãn Thần Timaeus: chỉ cần 1 "Phù Thủy Áo Đen" / "Nữ Phù Thủy Áo Đen" trên sân làm nguyên liệu duy nhất
  if (options?.onlyMaterialInstanceId) {
    const fieldM = player.monsterZones.find(
      (m) => m !== null && m.instanceId === options.onlyMaterialInstanceId && m.position !== 'SET_DEFENSE'
    );
    if (!fieldM) return [];
    const ids = getEffectiveCardIdentities(fieldM.cardId, 'FIELD');
    const isDM = ids.includes('dark_magician');
    const isDMG = ids.includes('dark_magician_girl');
    if (!isDM && !isDMG) return [];

    const results: { extraCard: HandCardInstance; def: CardDefinition }[] = [];
    for (const extraInst of player.extraDeck) {
      const def = getCardById(extraInst.cardId);
      if (!def || def.subType !== 'FUSION' || !def.fusionMaterials) continue;
      if (
        (isDM && def.fusionMaterials.includes('dark_magician')) ||
        (isDMG && def.fusionMaterials.includes('dark_magician_girl'))
      ) {
        results.push({ extraCard: extraInst, def });
      }
    }
    return results;
  }

  const hasFreeZone = player.monsterZones.some((z) => z === null);
  const rawPool = buildFusionMaterialPool(player, Boolean(options?.allowGy));
  // Nếu cả 5 ô đều kín, ưu tiên tiêu thụ nguyên liệu trên sân để mở ô trống; ngược lại ưu tiên Tay -> Mộ -> Sân
  const sortedPool = [...rawPool].sort((a, b) => {
    const priority = (s: FusionMaterialCandidate['source']) =>
      !hasFreeZone
        ? s === 'FIELD'
          ? 0
          : s === 'HAND'
          ? 1
          : 2
        : s === 'HAND'
        ? 0
        : s === 'GY'
        ? 1
        : 2;
    return priority(a.source) - priority(b.source);
  });

  const results: { extraCard: HandCardInstance; def: CardDefinition }[] = [];

  for (const extraInst of player.extraDeck) {
    const def = getCardById(extraInst.cardId);
    if (!def || !def.fusionMaterials || def.fusionMaterials.length === 0) continue;

    // Ưu tiên khớp tên cụ thể trước khi khớp theo RACE: / ATTR: để không tiêu nhầm quái tên bắt buộc vào wildcard
    const reqs = [...def.fusionMaterials].sort((a, b) => {
      const aWild = a.startsWith('RACE:') || a.startsWith('ATTR:') ? 1 : 0;
      const bWild = b.startsWith('RACE:') || b.startsWith('ATTR:') ? 1 : 0;
      return aWild - bWild;
    });

    const poolCopy = [...sortedPool];
    let usedField = false;
    let canMake = true;
    for (const req of reqs) {
      const idx = poolCopy.findIndex((cand) => doesCandidateMatchFusionReq(cand, req));
      if (idx === -1) {
        canMake = false;
        break;
      }
      if (poolCopy[idx].source === 'FIELD') usedField = true;
      poolCopy.splice(idx, 1);
    }

    if (canMake && (hasFreeZone || usedField)) {
      results.push({ extraCard: extraInst, def });
    }
  }

  return results;
}

/**
 * Lấy danh sách mục tiêu hợp lệ cho 1 lá bài có `target` rule
 */
export function getValidTargetInstances(
  state: DuelState,
  actorId: PlayerId,
  cardDef: CardDefinition,
  excludeInstanceId?: string
): { instanceId: string; cardId: string; labelVi: string; location: string }[] {
  const effect = cardDef.effects?.find((e) => e.trigger === 'ON_ACTIVATE' || e.trigger === 'ON_FLIP');
  if (!effect || !effect.target || effect.target.location === 'NONE') return [];

  const rule = effect.target;
  const self = state.players[actorId];
  const oppId = getOpponentId(actorId);
  const opp = state.players[oppId];
  const isTimaeusFusion = Boolean(effect.actions?.some((a) => a.useTargetAsOnlyFusionMaterial));
  const list: { instanceId: string; cardId: string; labelVi: string; location: string }[] = [];

  const matchesMonsterConstraints = (
    cardId: string,
    loc: 'FIELD' | 'GY' | 'HAND',
    effAtk?: number
  ): boolean => {
    const d = getCardById(cardId);
    if (!d || d.category !== 'MONSTER') return false;
    if (rule.allowedRaces && (!d.race || !rule.allowedRaces.includes(d.race))) return false;
    if (rule.allowedAttributes && (!d.attribute || !rule.allowedAttributes.includes(d.attribute))) {
      return false;
    }
    if (rule.allowedCardIds && rule.allowedCardIds.length > 0) {
      const ids = getEffectiveCardIdentities(cardId, loc);
      if (!ids.some((id) => rule.allowedCardIds!.includes(id))) return false;
    }
    if (rule.minLevel !== undefined && (d.level ?? 0) < rule.minLevel) return false;
    if (rule.maxLevel !== undefined && (d.level ?? 99) > rule.maxLevel) return false;
    const atkVal = effAtk ?? d.atk ?? 0;
    if (rule.minAtk !== undefined && atkVal < rule.minAtk) return false;
    if (rule.maxAtk !== undefined && atkVal > rule.maxAtk) return false;
    return true;
  };

  const pushMonster = (m: FieldCardInstance, sideLabel: string) => {
    if (m.instanceId === excludeInstanceId) return;
    if (rule.faceUpOnly && m.position === 'SET_DEFENSE') return;
    if (isProtectedFromOpponentTargeting(state, m, actorId)) return;
    const d = getCardById(m.cardId);
    if (!d) return;
    const stats = getEffectiveStats(state, m);
    if (!matchesMonsterConstraints(m.cardId, 'FIELD', stats.atk)) return;
    if (
      isTimaeusFusion &&
      getAvailableFusionSummons(state, actorId, { onlyMaterialInstanceId: m.instanceId }).length === 0
    ) {
      return;
    }

    const nameDisplay =
      m.position === 'SET_DEFENSE' && m.controller !== actorId
        ? 'Quái thú đang Úp'
        : `${d.nameVi} (${stats.atk}/${stats.def})`;
    list.push({
      instanceId: m.instanceId,
      cardId: m.cardId,
      labelVi: `${nameDisplay} [${sideLabel}]`,
      location: 'FIELD_MONSTER',
    });
  };

  const pushST = (st: FieldCardInstance, sideLabel: string) => {
    if (st.instanceId === excludeInstanceId) return;
    const d = getCardById(st.cardId);
    const nameDisplay =
      st.position === 'SET' && st.controller !== actorId ? 'Bài Phép/Bẫy Úp' : d?.nameVi ?? st.cardId;
    list.push({
      instanceId: st.instanceId,
      cardId: st.cardId,
      labelVi: `${nameDisplay} [${sideLabel}]`,
      location: 'FIELD_SPELL_TRAP',
    });
  };

  if (rule.location === 'FIELD_MONSTER') {
    opp.monsterZones.forEach((m) => m && pushMonster(m, 'Sân Đối Phương'));
    self.monsterZones.forEach((m) => m && pushMonster(m, 'Sân Bạn'));
  } else if (rule.location === 'OPPONENT_MONSTER') {
    opp.monsterZones.forEach((m) => m && pushMonster(m, 'Sân Đối Phương'));
  } else if (rule.location === 'OWN_MONSTER') {
    self.monsterZones.forEach((m) => m && pushMonster(m, 'Sân Bạn'));
  } else if (rule.location === 'FIELD_SPELL_TRAP') {
    opp.spellTrapZones.forEach((st) => st && pushST(st, 'Sân Đối Phương'));
    if (opp.fieldZone) pushST(opp.fieldZone, 'Sân Môi Trường Đối Phương');
    self.spellTrapZones.forEach((st) => st && pushST(st, 'Sân Bạn'));
    if (self.fieldZone) pushST(self.fieldZone, 'Sân Môi Trường Bạn');
  } else if (rule.location === 'OPPONENT_SPELL_TRAP') {
    opp.spellTrapZones.forEach((st) => st && pushST(st, 'Sân Đối Phương'));
    if (opp.fieldZone) pushST(opp.fieldZone, 'Sân Môi Trường Đối Phương');
  } else if (rule.location === 'OPPONENT_ANY_CARD') {
    opp.monsterZones.forEach((m) => m && pushMonster(m, 'Sân Đối Phương'));
    opp.spellTrapZones.forEach((st) => st && pushST(st, 'Sân Đối Phương'));
    if (opp.fieldZone) pushST(opp.fieldZone, 'Sân Môi Trường Đối Phương');
  } else if (rule.location === 'EITHER_GRAVEYARD_MONSTER') {
    if (self.monsterZones.every((z) => z !== null)) return [];
    opp.graveyard.forEach((g) => {
      const d = getCardById(g.cardId);
      if (d && matchesMonsterConstraints(g.cardId, 'GY')) {
        list.push({
          instanceId: g.instanceId,
          cardId: g.cardId,
          labelVi: `${d.nameVi} (${d.atk}/${d.def}) [Mộ Đối Phương]`,
          location: 'GRAVEYARD',
        });
      }
    });
    self.graveyard.forEach((g) => {
      const d = getCardById(g.cardId);
      if (d && matchesMonsterConstraints(g.cardId, 'GY')) {
        list.push({
          instanceId: g.instanceId,
          cardId: g.cardId,
          labelVi: `${d.nameVi} (${d.atk}/${d.def}) [Mộ Của Bạn]`,
          location: 'GRAVEYARD',
        });
      }
    });
  } else if (rule.location === 'OWN_GRAVEYARD_MONSTER') {
    if (self.monsterZones.every((z) => z !== null)) return [];
    self.graveyard.forEach((g) => {
      const d = getCardById(g.cardId);
      if (d && matchesMonsterConstraints(g.cardId, 'GY')) {
        list.push({
          instanceId: g.instanceId,
          cardId: g.cardId,
          labelVi: `${d.nameVi} (${d.atk}/${d.def}) [Mộ Của Bạn]`,
          location: 'GRAVEYARD',
        });
      }
    });
  } else if (rule.location === 'OPPONENT_GRAVEYARD_MONSTER') {
    opp.graveyard.forEach((g) => {
      const d = getCardById(g.cardId);
      if (d && matchesMonsterConstraints(g.cardId, 'GY')) {
        list.push({
          instanceId: g.instanceId,
          cardId: g.cardId,
          labelVi: `${d.nameVi} (${d.atk}/${d.def}) [Mộ Đối Phương]`,
          location: 'GRAVEYARD',
        });
      }
    });
  } else if (rule.location === 'OWN_HAND_CARD') {
    self.hand.forEach((h) => {
      if (h.instanceId === excludeInstanceId) return;
      const d = getCardById(h.cardId);
      if (!d) return;
      list.push({
        instanceId: h.instanceId,
        cardId: h.cardId,
        labelVi:
          d.category === 'MONSTER'
            ? `${d.nameVi} (${d.atk}/${d.def}) [Trên Tay]`
            : `${d.nameVi} [Trên Tay]`,
        location: 'HAND',
      });
    });
  } else if (rule.location === 'OWN_HAND_MONSTER') {
    self.hand.forEach((h) => {
      if (h.instanceId === excludeInstanceId) return;
      const d = getCardById(h.cardId);
      if (d && matchesMonsterConstraints(h.cardId, 'HAND')) {
        list.push({
          instanceId: h.instanceId,
          cardId: h.cardId,
          labelVi: `${d.nameVi} (${d.atk}/${d.def}) [Trên Tay]`,
          location: 'HAND',
        });
      }
    });
  }

  return list;
}

/**
 * Kiểm tra xem 1 lá bài Phép/Bẫy có đủ điều kiện kích hoạt chủ động trong Main Phase không
 */
export function canActivateSpellOrTrapNow(
  state: DuelState,
  playerId: PlayerId,
  cardId: string,
  fromLocation: 'HAND' | 'FIELD',
  fieldInstance?: FieldCardInstance,
  handInstanceId?: string
): boolean {
  if (state.winner || state.pendingChain || state.pendingSelection) return false;
  if (state.currentTurnPlayer !== playerId) return false;
  if (state.phase !== 'MAIN1' && state.phase !== 'MAIN2') return false;

  const cardDef = getCardById(cardId);
  if (!cardDef) return false;

  const player = state.players[playerId];
  const opp = state.players[getOpponentId(playerId)];

  if (cardDef.category === 'TRAP') {
    if (fromLocation !== 'FIELD' || !fieldInstance) return false;
    // Bẫy không được kích hoạt ngay trong lượt vừa Úp
    if (fieldInstance.setTurn === state.turnNumber) return false;
  }

  if (cardDef.category === 'SPELL') {
    if (fromLocation === 'HAND' && cardDef.subType !== 'FIELD') {
      const hasFreeSTZone = player.spellTrapZones.some((z) => z === null);
      if (!hasFreeSTZone) return false;
    }
    if (cardDef.subType === 'FIELD') {
      return true;
    }
  }

  const activateEffect = cardDef.effects?.find((e) => e.trigger === 'ON_ACTIVATE');
  if (!activateEffect) return false;
  if (!canPayEffectCost(player, activateEffect)) return false;

  const hasFaceUpIdentity = (p: PlayerState, code: string) =>
    p.monsterZones.some(
      (m) =>
        m !== null &&
        m.position !== 'SET_DEFENSE' &&
        getEffectiveCardIdentities(m.cardId, 'FIELD').includes(code)
    );

  const cond = activateEffect.condition;
  if (cond) {
    if (cond.requireOpponentFaceUpMonster) {
      const hasFaceUp = opp.monsterZones.some((m) => m !== null && m.position !== 'SET_DEFENSE');
      if (!hasFaceUp) return false;
    }
    if (cond.requireOpponentSpellTrap) {
      const hasOppST = opp.spellTrapZones.some((s) => s !== null) || Boolean(opp.fieldZone);
      if (!hasOppST) return false;
    }
    if (cond.requireOpponentAnyCard) {
      const hasAny =
        opp.monsterZones.some((m) => m !== null) ||
        opp.spellTrapZones.some((s) => s !== null) ||
        Boolean(opp.fieldZone);
      if (!hasAny) return false;
    }
    if (cond.requireAnyMonsterOnField) {
      const anyM =
        player.monsterZones.some((m) => m !== null) || opp.monsterZones.some((m) => m !== null);
      if (!anyM) return false;
    }
    if (cond.requireSpellTrapOnField) {
      const countOtherST =
        player.spellTrapZones.filter((s) => s !== null && s.instanceId !== fieldInstance?.instanceId).length +
        opp.spellTrapZones.filter((s) => s !== null).length +
        (player.fieldZone ? 1 : 0) +
        (opp.fieldZone ? 1 : 0);
      if (countOtherST === 0) return false;
    }
    if (cond.requireMonsterInAnyGY) {
      const hasFreeMZone = player.monsterZones.some((z) => z === null);
      const anyInGy =
        player.graveyard.some((g) => getCardById(g.cardId)?.category === 'MONSTER') ||
        opp.graveyard.some((g) => getCardById(g.cardId)?.category === 'MONSTER');
      if (!hasFreeMZone || !anyInGy) return false;
    }
    if (cond.requireFaceUpCardCode) {
      const hasRequired =
        hasFaceUpIdentity(player, cond.requireFaceUpCardCode) ||
        hasFaceUpIdentity(opp, cond.requireFaceUpCardCode);
      if (!hasRequired) return false;
    }
    if (cond.requireFaceUpCardCodes && cond.requireFaceUpCardCodes.length > 0) {
      const hasAnyCode = cond.requireFaceUpCardCodes.some((code) => hasFaceUpIdentity(player, code));
      if (!hasAnyCode) return false;
    }
    if (cond.requireFaceUpAllCardCodes && cond.requireFaceUpAllCardCodes.length > 0) {
      const hasAllCodes = cond.requireFaceUpAllCardCodes.every((code) =>
        hasFaceUpIdentity(player, code)
      );
      if (!hasAllCodes) return false;
    }
    if (cond.requireFaceUpRace && cond.requireFaceUpRace.length > 0) {
      const hasRace = player.monsterZones.some((m) => {
        if (!m || m.position === 'SET_DEFENSE') return false;
        const d = getCardById(m.cardId);
        return Boolean(d?.race && cond.requireFaceUpRace!.includes(d.race));
      });
      if (!hasRace) return false;
    }
    if (cond.requireDragonInHand) {
      const hasDragon = player.hand.some((h) => getCardById(h.cardId)?.race === 'Dragon');
      const hasFreeZone = player.monsterZones.some((z) => z === null);
      if (!hasDragon || !hasFreeZone) return false;
    }
  }

  // Nếu là bài Dung Hợp
  const fusionAct = activateEffect.actions?.find((a) => a.type === 'FUSION_SUMMON');
  if (fusionAct) {
    if (fusionAct.useTargetAsOnlyFusionMaterial) {
      const validTargets = getValidTargetInstances(
        state,
        playerId,
        cardDef,
        fieldInstance?.instanceId ?? handInstanceId
      );
      return validTargets.length > 0;
    }
    return (
      getAvailableFusionSummons(state, playerId, {
        allowGy: Boolean(fusionAct.allowGyFusionMaterials),
      }).length > 0
    );
  }

  // Nếu triệu hồi Đặc biệt mà không hiến tế giải phóng ô quái -> cần ít nhất 1 ô trống
  const summonsWithoutTribute =
    activateEffect.actions?.some(
      (a) =>
        (a.type === 'SPECIAL_SUMMON_FROM_DECK_OR_GY' || a.type === 'REVIVE_TARGET_FROM_GY') &&
        !activateEffect.actions?.some((other) => other.type === 'TRIBUTE_TARGET_MONSTER')
    ) ?? false;
  if (summonsWithoutTribute && player.monsterZones.every((z) => z !== null)) {
    return false;
  }

  // Nếu là Change of Heart, cần bên mình còn ít nhất 1 ô trống
  if (activateEffect.actions?.some((a) => a.type === 'TAKE_CONTROL_UNTIL_END_PHASE')) {
    if (player.monsterZones.every((z) => z !== null)) return false;
  }

  // Nếu có target bắt buộc, phải có ít nhất 1 mục tiêu hợp lệ (loại trừ chính lá bài trên tay nếu chọn lá bỏ từ tay)
  if (activateEffect.target && activateEffect.target.location !== 'NONE' && !activateEffect.target.optional) {
    const excludeId =
      fromLocation === 'HAND' ? handInstanceId : fieldInstance?.instanceId;
    const validTargets = getValidTargetInstances(state, playerId, cardDef, excludeId);
    if (validTargets.length === 0) return false;
  }

  return true;
}

/**
 * Kiểm tra xem 1 quái thú trên tay có thể Triệu hồi Đặc biệt bằng nội tại của nó không
 * (VD: Blue-Eyes Alternative, Blue-Eyes Jet, Magician's Souls, Apprentice Illusion Magician, Mahad...)
 */
export function canSpecialSummonFromHand(
  state: DuelState,
  playerId: PlayerId,
  handInstanceId: string
): boolean {
  if (state.winner || state.pendingChain || state.pendingSelection) return false;
  if (state.currentTurnPlayer !== playerId) return false;
  if (state.phase !== 'MAIN1' && state.phase !== 'MAIN2') return false;

  const player = state.players[playerId];
  if (player.monsterZones.every((z) => z !== null)) return false;

  const handCard = player.hand.find((h) => h.instanceId === handInstanceId);
  if (!handCard) return false;
  const def = getCardById(handCard.cardId);
  if (!def || def.category !== 'MONSTER' || !def.specialSummonHand) return false;

  const rule = def.specialSummonHand;
  const discardCount = rule.discardHandCount ?? 0;
  if (player.hand.length - 1 < discardCount) return false;

  if (rule.requireHandOrFieldCardIds && rule.requireHandOrFieldCardIds.length > 0) {
    const reqSet = new Set(rule.requireHandOrFieldCardIds);
    const hasInOtherHand = player.hand.some(
      (h) => h.instanceId !== handInstanceId && reqSet.has(h.cardId)
    );
    const hasOnField =
      player.monsterZones.some(
        (m) =>
          m !== null &&
          m.position !== 'SET_DEFENSE' &&
          getEffectiveCardIdentities(m.cardId, 'FIELD').some((id) => reqSet.has(id))
      ) ||
      player.spellTrapZones.some(
        (st) => st !== null && st.position !== 'SET' && reqSet.has(st.cardId)
      );
    if (!hasInOtherHand && !hasOnField) return false;
  }

  if (rule.requireFieldCardIds && rule.requireFieldCardIds.length > 0) {
    const reqSet = new Set(rule.requireFieldCardIds);
    const hasField = player.monsterZones.some(
      (m) =>
        m !== null &&
        m.position !== 'SET_DEFENSE' &&
        getEffectiveCardIdentities(m.cardId, 'FIELD').some((id) => reqSet.has(id))
    );
    if (!hasField) return false;
  }

  if (rule.requireFaceUpRace && rule.requireFaceUpRace.length > 0) {
    const hasRace = player.monsterZones.some((m) => {
      if (!m || m.position === 'SET_DEFENSE') return false;
      const d = getCardById(m.cardId);
      return Boolean(d?.race && rule.requireFaceUpRace!.includes(d.race));
    });
    if (!hasRace) return false;
  }

  return true;
}

function pushDuelEvent(
  state: DuelState,
  ev: Omit<DuelState['lastEvent'] & object, 'id' | 'timestamp'>
): void {
  const fullEvent = {
    ...ev,
    id: nextUid('ev'),
    timestamp: Date.now(),
  };
  state.lastEvent = fullEvent;
  if (!state.recentEvents) state.recentEvents = [];
  state.recentEvents.push(fullEvent);
  if (state.recentEvents.length > 24) {
    state.recentEvents.shift();
  }
}

function pushResolvedChain(
  state: DuelState,
  record: Omit<ResolvedChainRecord, 'id' | 'timestamp'>
): void {
  const full: ResolvedChainRecord = {
    ...record,
    id: nextUid('chain'),
    timestamp: Date.now(),
  };
  state.lastResolvedChain = full;
  if (!state.recentResolvedChains) state.recentResolvedChains = [];
  state.recentResolvedChains.push(full);
  if (state.recentResolvedChains.length > 8) {
    state.recentResolvedChains.shift();
  }
}

function findCardIdForInstance(state: DuelState, instanceId?: string): string | undefined {
  if (!instanceId || instanceId === 'DIRECT') return undefined;
  for (const pid of ['host', 'guest'] as PlayerId[]) {
    const p = state.players[pid];
    const m = p.monsterZones.find((z) => z?.instanceId === instanceId);
    if (m) return m.cardId;
    const st = p.spellTrapZones.find((z) => z?.instanceId === instanceId);
    if (st) return st.cardId;
    if (p.fieldZone?.instanceId === instanceId) return p.fieldZone.cardId;
    const gy = p.graveyard.find((g) => g.instanceId === instanceId);
    if (gy) return gy.cardId;
    const hd = p.hand.find((h) => h.instanceId === instanceId);
    if (hd) return hd.cardId;
  }
  return undefined;
}

function getEffectiveLpCost(player: PlayerState, eff?: CardEffect): number {
  if (!eff?.condition) return 0;
  if (eff.condition.lpCost && eff.condition.lpCost > 0) {
    return eff.condition.lpCost;
  }
  if (eff.condition.halfLpCost) {
    return Math.floor(player.lp / 2);
  }
  return 0;
}

function canPayEffectCost(player: PlayerState, eff?: CardEffect): boolean {
  if (!eff?.condition) return true;
  if (eff.condition.lpCost && player.lp <= eff.condition.lpCost) return false;
  if (eff.condition.halfLpCost && player.lp < 2) return false;
  return true;
}

function describeEffectActionVi(
  cardDef: CardDefinition,
  triggerType?: EffectTrigger | 'SUMMON' | 'ATTACK'
): string {
  switch (cardDef.id) {
    case 'trap_hole':
      return 'Tiêu diệt quái triệu hồi ≥ 1000 ATK';
    case 'mirror_force':
      return 'Vô hiệu & Diệt toàn bộ quái thế Công';
    case 'magic_cylinder':
      return 'Chặn đòn & Phản sát thương bằng ATK';
    case 'sakuretsu_armor':
      return 'Chặn đòn & Tiêu diệt quái tấn công';
    case 'negate_attack':
      return 'Vô hiệu đòn đánh & Hết Battle Phase';
    case 'call_of_the_haunted':
      return 'Hồi sinh quái từ Mộ lên sân';
    case 'herald_of_purple_light':
    case 'red_reboot':
    case 'seven_tools_of_the_bandit':
    case 'ash_blossom_joyous_spring':
      return 'Vô hiệu & Phá hủy Bài Bẫy';
    case 'kuriboh':
    case 'effect_veiler':
      return 'Bỏ từ tay để Chặn đòn tấn công';
    case 'man_eater_bug':
      return 'Hiệu ứng LẬT: Tiêu diệt 1 quái';
    case 'wall_of_illusion':
      return 'Đẩy quái vừa tấn công về tay';
    case 'sangan':
    case 'witch_of_the_black_forest':
      return 'Vào Mộ: Tìm quái từ Deck lên tay';
    case 'pot_of_greed':
      return 'Rút 2 lá bài';
    case 'graceful_charity':
      return 'Rút 3 lá, chọn bỏ 2 lá';
    case 'monster_reborn':
      return 'Hồi sinh quái từ Mộ';
    case 'raigeki':
      return 'Tiêu diệt toàn bộ quái đối phương';
    case 'dark_hole':
      return 'Tiêu diệt toàn bộ quái trên sân';
    case 'fissure':
      return 'Diệt quái ngửa ATK thấp nhất';
    case 'mystical_space_typhoon':
      return 'Phá hủy 1 Phép/Bẫy trên sân';
    case 'heavy_storm':
      return 'Phá hủy toàn bộ Phép/Bẫy';
    case 'swords_of_revealing_light':
      return 'Lật ngửa & Khóa tấn công 3 lượt';
    case 'change_of_heart':
      return 'Chiếm quyền điều khiển 1 lượt';
    case 'polymerization':
    case 'secrets_of_dark_magic':
      return 'Dung hợp triệu hồi Extra Deck';
    case 'ultimate_fusion':
      return 'Dung hợp nguyên liệu Tay/Sân/Mộ';
    case 'the_eye_of_timaeus':
      return 'Dung hợp đơn thể Phù Thủy Áo Đen';
    case 'flute_of_summoning_dragon':
      return 'Triệu hồi Rồng từ trên tay';
    case 'axe_of_despair':
      return 'Trang bị +1000 ATK';
    case 'horn_of_the_unicorn':
      return 'Trang bị +700 ATK/DEF';
    case 'yami':
    case 'mountain':
    case 'sogen':
      return 'Kích hoạt Môi trường tăng sức mạnh';
    case 'dian_keto':
      return 'Hồi +1000 Điểm Gốc (LP)';
    case 'ookazi':
      return 'Gây 800 sát thương trực tiếp';
    case 'stop_defense':
      return 'Ép quái địch sang thế Công';
    default: {
      const matchedEff =
        (triggerType ? cardDef.effects?.find((e) => e.trigger === triggerType) : undefined) ??
        cardDef.effects?.[0];
      const act = matchedEff?.actions?.[0]?.type;
      if (act === 'NEGATE_AND_DESTROY_TRAP') return 'Vô hiệu & Phá hủy Bài Bẫy';
      if (act === 'DESTROY_TRIGGER_MONSTER') return 'Tiêu diệt quái vừa triệu hồi';
      if (act === 'DESTROY_ATTACKING_MONSTER') return 'Tiêu diệt quái tấn công';
      if (act === 'END_BATTLE_PHASE') return 'Chặn đòn & Kết thúc Battle Phase';
      if (act === 'NEGATE_ATTACK') return 'Vô hiệu hóa đòn tấn công';
      if (act === 'DAMAGE_LP_BY_ATTACKER_ATK') return 'Phản sát thương bằng ATK';
      if (act === 'RETURN_TARGET_TO_HAND' || act === 'RETURN_ATTACKER_TO_HAND')
        return 'Đẩy mục tiêu về tay chủ nhân';
      if (act === 'DESTROY_ALL_MONSTERS') return 'Quét sạch toàn bộ quái trên sân';
      if (act === 'DESTROY_OPPONENT_MONSTERS')
        return matchedEff?.actions?.[0]?.value
          ? `Tiêu diệt ${matchedEff.actions[0].value} quái đối phương`
          : 'Diệt toàn bộ quái đối phương';
      if (act === 'DESTROY_OPPONENT_SPELLS_TRAPS')
        return matchedEff?.actions?.[0]?.value
          ? `Phá hủy ${matchedEff.actions[0].value} Phép/Bẫy đối phương`
          : 'Phá hủy toàn bộ Phép/Bẫy đối phương';
      if (act === 'DESTROY_OPPONENT_ALL_CARDS') return 'Quét sạch toàn bộ sân đối phương';
      if (act === 'DESTROY_OPPONENT_ATTACK_POS_MONSTERS') return 'Diệt toàn bộ quái thế Công';
      if (act === 'DESTROY_LOWEST_ATK_OPPONENT_MONSTER') return 'Diệt quái ATK thấp nhất';
      if (act === 'DESTROY_ALL_SPELLS_TRAPS') return 'Phá hủy toàn bộ Phép/Bẫy';
      if (act === 'DESTROY_TARGET') return 'Tiêu diệt mục tiêu trên sân';
      if (act === 'CHANGE_TARGET_FACE_DOWN') return 'Úp quái thú xuống thế Thủ';
      if (act === 'BANISH_FROM_GY') return 'Trục xuất quái khỏi Mộ đối phương';
      if (act === 'MILL_TO_GY') return 'Gửi quái từ Bộ bài xuống Mộ';
      if (act === 'REVIVE_TARGET_FROM_GY') return 'Hồi sinh quái từ Mộ';
      if (act === 'TAKE_CONTROL_UNTIL_END_PHASE') return 'Chiếm quyền điều khiển 1 lượt';
      if (act === 'CHANGE_TARGET_POSITION') return 'Đổi thế chiến đấu mục tiêu';
      if (act === 'EQUIP_TO_TARGET') return 'Trang bị tăng sức mạnh';
      if (act === 'DRAW_CARDS') return 'Rút thêm bài lên tay';
      if (act === 'HEAL_LP') return 'Hồi phục Điểm Gốc (LP)';
      if (act === 'DAMAGE_LP') return 'Gây sát thương LP';
      if (act === 'SEARCH_DECK_MONSTER_TO_HAND' || act === 'SEARCH_DECK_TO_HAND')
        return 'Tìm bài từ Bộ bài lên tay';
      if (act === 'SPECIAL_SUMMON_FROM_DECK_OR_GY' || act === 'SPECIAL_SUMMON_HAND_MONSTERS')
        return 'Triệu hồi Đặc biệt đồng minh lên sân';
      if (act === 'TRIBUTE_TARGET_MONSTER') return 'Hiến tế kích hoạt hiệu ứng đặc biệt';
      if (act === 'DISCARD_TARGET_HAND_CARD') return 'Bỏ bài kích hoạt hiệu ứng';
      if (act === 'FUSION_SUMMON') return 'Dung hợp triệu hồi Extra Deck';
      if (matchedEff?.trigger === 'CONTINUOUS_FIELD') return 'Kích hoạt Môi trường tăng sức mạnh';
      if (matchedEff?.trigger === 'ON_FLIP') return 'Hiệu ứng LẬT (FLIP)';
      return 'Kích hoạt hiệu ứng';
    }
  }
}

function getAvailableChainResponses(
  state: DuelState,
  responderId: PlayerId,
  triggerType: 'ON_OPPONENT_SUMMON' | 'ON_OPPONENT_ATTACK' | 'ON_OPPONENT_TRAP',
  options?: {
    summonedMonsterAtk?: number;
    existingLinks?: ChainLinkNode[];
  }
): ChainResponseOption[] {
  const responder = state.players[responderId];
  const existingLinks = options?.existingLinks ?? [];
  const usedIds = new Set(existingLinks.map((l) => l.sourceInstanceId).filter(Boolean));
  const lastLink = existingLinks[existingLinks.length - 1];
  const lastLinkDef = lastLink ? getCardById(lastLink.cardId) : undefined;
  const results: ChainResponseOption[] = [];

  const checkCardValid = (
    instId: string,
    cardDef: CardDefinition | undefined,
    fromLocation: 'HAND' | 'FIELD'
  ): ChainResponseOption | null => {
    if (!cardDef || usedIds.has(instId)) return null;
    const eff = cardDef.effects?.find(
      (e) =>
        e.trigger === triggerType &&
        (fromLocation === 'FIELD' || e.activateFromHand === true)
    );
    if (!eff) return null;
    if (!canPayEffectCost(responder, eff)) return null;

    if (
      triggerType === 'ON_OPPONENT_SUMMON' &&
      eff.condition?.minTriggerMonsterAtk !== undefined &&
      (options?.summonedMonsterAtk ?? 0) < eff.condition.minTriggerMonsterAtk
    ) {
      return null;
    }

    // Chuẩn luật Spell Speed 3: Bẫy Phản Đòn (Counter Trap) chỉ có thể bị phản ứng bởi một Counter Trap khác
    if (
      triggerType === 'ON_OPPONENT_TRAP' &&
      lastLinkDef?.category === 'TRAP' &&
      lastLinkDef.subType === 'COUNTER' &&
      !(cardDef.category === 'TRAP' && cardDef.subType === 'COUNTER')
    ) {
      return null;
    }

    const lpCost = getEffectiveLpCost(responder, eff);
    return {
      instanceId: instId,
      cardId: cardDef.id,
      fromLocation,
      ...(lpCost > 0 ? { lpCost } : {}),
    };
  };

  // 1. Kiểm tra Handtrap trên TAY (ưu tiên phát hiện các lá Handtrap như Hộ Vệ Ánh Tím, Kuriboh, Red Reboot)
  for (const h of responder.hand) {
    const res = checkCardValid(h.instanceId, getCardById(h.cardId), 'HAND');
    if (res) results.push(res);
  }

  // 2. Kiểm tra Bài Bẫy đang Úp trên SÂN (đã úp ít nhất từ lượt trước)
  for (const st of responder.spellTrapZones) {
    if (!st || st.position !== 'SET' || st.setTurn === state.turnNumber) continue;
    const res = checkCardValid(st.instanceId, getCardById(st.cardId), 'FIELD');
    if (res) results.push(res);
  }

  return results;
}

function queueOrOpenSelection(state: DuelState, prompt: PendingSelectionPrompt): void {
  if (!state.pendingSelection) {
    state.pendingSelection = prompt;
  } else {
    if (!state.pendingSelectionQueue) state.pendingSelectionQueue = [];
    state.pendingSelectionQueue.push(prompt);
  }
}

function matchesActionCardFilter(
  d: CardDefinition,
  action: AtomicAction,
  location: 'DECK' | 'GY' | 'HAND'
): boolean {
  if (action.categoryFilter && action.categoryFilter !== 'ANY') {
    if (action.categoryFilter === 'SPELL_OR_TRAP') {
      if (d.category !== 'SPELL' && d.category !== 'TRAP') return false;
    } else if (d.category !== action.categoryFilter) {
      return false;
    }
  }
  if (action.subTypeFilter && action.subTypeFilter.length > 0) {
    if (!action.subTypeFilter.includes(d.subType)) return false;
  }
  if (action.raceFilter && action.raceFilter.length > 0) {
    if (!d.race || !action.raceFilter.includes(d.race)) return false;
  }
  if (action.attributeFilter && action.attributeFilter.length > 0) {
    if (!d.attribute || !action.attributeFilter.includes(d.attribute)) return false;
  }
  if (action.cardIdFilter && action.cardIdFilter.length > 0) {
    const ids = location === 'GY' ? getEffectiveCardIdentities(d.id, 'GY') : [d.id];
    if (!ids.some((id) => action.cardIdFilter!.includes(id))) return false;
  }
  if (action.nameContainsFilter && action.nameContainsFilter.length > 0) {
    const nameLower = d.name.toLowerCase();
    const viLower = d.nameVi.toLowerCase();
    const matched = action.nameContainsFilter.some((tok) => {
      const t = tok.toLowerCase();
      return nameLower.includes(t) || viLower.includes(t);
    });
    if (!matched) return false;
  }
  if (action.minLevelFilter !== undefined && (d.level ?? 0) < action.minLevelFilter) return false;
  if (action.maxLevelFilter !== undefined && (d.level ?? 99) > action.maxLevelFilter) return false;
  if (action.minAtkFilter !== undefined && (d.atk ?? 0) < action.minAtkFilter) return false;
  if (action.maxAtkFilter !== undefined && (d.atk ?? 99999) > action.maxAtkFilter) return false;
  if (action.maxDefFilter !== undefined && (d.def ?? 99999) > action.maxDefFilter) return false;
  return true;
}

function triggerOnSentToGyEffectsIfAny(
  state: DuelState,
  ownerId: PlayerId,
  cardId: string,
  fromField: boolean
): void {
  const cardDef = getCardById(cardId);
  if (!cardDef?.effects) return;
  const matchingEffects = cardDef.effects.filter(
    (eff) => eff.trigger === 'ON_SENT_TO_GY' && (fromField || eff.triggerOnAnyGY === true) && eff.actions?.length
  );
  if (matchingEffects.length === 0) return;

  for (const eff of matchingEffects) {
    const report = createEmptyReport();
    eff.actions?.forEach((act) => {
      executeAtomicAction(state, ownerId, cardDef, act, { report });
    });
    if (
      report.affectedCardIds.length > 0 ||
      (report.searchedCount ?? 0) > 0 ||
      (report.summonedCount ?? 0) > 0 ||
      (report.milledCount ?? 0) > 0 ||
      report.drawnCount > 0 ||
      report.lpDeltas.length > 0
    ) {
      const resolvedText = summarizeReportResultVi(cardDef, report);
      pushResolvedChain(state, {
        titleVi: `HIỆU ỨNG KHI VÀO MỘ: ${getShortCardTitle(cardDef)}`,
        summaryVi: `[${getShortCardTitle(cardDef)}]: ${resolvedText}`,
        links: [
          {
            chainNumber: 1,
            kind: 'MONSTER_EFFECT',
            actor: ownerId,
            cardId: cardDef.id,
            fromLocation: 'GRAVEYARD',
            triggerType: 'ON_SENT_TO_GY',
            targetCardId: report.affectedCardIds[0],
            extraTargetCardIds: report.affectedCardIds,
            effectActionVi: describeEffectActionVi(cardDef, 'ON_SENT_TO_GY'),
            detailVi: `${state.players[ownerId].name} kích hoạt dưới Mộ`,
            status: 'RESOLVED',
            resultVi: resolvedText,
          },
        ],
      });
    }
  }
}

function triggerOnSummonEffectIfAny(
  state: DuelState,
  controllerId: PlayerId,
  summonedMonster: FieldCardInstance
): void {
  const def = getCardById(summonedMonster.cardId);
  if (!def) return;
  const summonEff = def.effects?.find((e) => e.trigger === 'ON_SUMMON');
  if (!summonEff || !summonEff.actions || summonEff.actions.length === 0) return;

  const report = createEmptyReport();
  const ctx: ActionExecutionContext = {
    sourceInstanceId: summonedMonster.instanceId,
    report,
  };
  for (const act of summonEff.actions) {
    executeAtomicAction(state, controllerId, def, act, ctx);
  }

  if (
    report.affectedCardIds.length > 0 ||
    report.drawnCount > 0 ||
    (report.searchedCount ?? 0) > 0 ||
    (report.summonedCount ?? 0) > 0 ||
    (report.milledCount ?? 0) > 0 ||
    report.lpDeltas.length > 0
  ) {
    const resolvedText = summarizeReportResultVi(def, report);
    pushResolvedChain(state, {
      titleVi: `HIỆU ỨNG TRIỆU HỒI: ${getShortCardTitle(def)}`,
      summaryVi: `[${getShortCardTitle(def)}]: ${resolvedText}`,
      links: [
        {
          chainNumber: 1,
          kind: 'MONSTER_EFFECT',
          actor: controllerId,
          cardId: def.id,
          sourceInstanceId: summonedMonster.instanceId,
          fromLocation: 'FIELD',
          triggerType: 'ON_SUMMON',
          targetCardId: report.affectedCardIds[0],
          targetPlayer: report.lpDeltas[0]?.playerId,
          lpDelta: report.lpDeltas.reduce((s, d) => s + d.amount, 0) || undefined,
          extraTargetCardIds: report.affectedCardIds,
          effectActionVi: describeEffectActionVi(def, 'ON_SUMMON'),
          detailVi: `${state.players[controllerId].name} kích hoạt khi Triệu hồi`,
          status: 'RESOLVED',
          resultVi: resolvedText,
        },
      ],
    });
  }
}

/**
 * Helper đưa 1 lá bài từ trên sân xuống Mộ của chủ sở hữu gốc (và kích hoạt ON_SENT_TO_GY nếu có)
 */
function sendFieldCardToGraveyard(
  state: DuelState,
  targetInstanceId: string,
  triggerGraveyardEffects = true
): void {
  for (const pid of ['host', 'guest'] as PlayerId[]) {
    const p = state.players[pid];

    // Kiểm tra Monster Zones
    const mIdx = p.monsterZones.findIndex((m) => m?.instanceId === targetInstanceId);
    if (mIdx !== -1 && p.monsterZones[mIdx]) {
      const removed = p.monsterZones[mIdx]!;
      p.monsterZones[mIdx] = null;

      const rDef = getCardById(removed.cardId);
      pushDuelEvent(state, {
        type: 'DESTROY',
        actor: removed.controller,
        cardId: removed.cardId,
        targetInstanceId: removed.instanceId,
        messageVi: `💥 [${rDef?.nameVi ?? 'Quái thú'}] bị phá hủy!`,
      });

      // Đưa về Mộ của owner gốc
      state.players[removed.owner].graveyard.push({
        instanceId: removed.instanceId,
        cardId: removed.cardId,
        owner: removed.owner,
      });

      // Phá hủy các Equip Spell đang gắn vào quái này
      for (const stPid of ['host', 'guest'] as PlayerId[]) {
        state.players[stPid].spellTrapZones.forEach((st) => {
          if (st && st.equippedToInstanceId === removed.instanceId) {
            sendFieldCardToGraveyard(state, st.instanceId, false);
          }
        });
      }

      // Kích hoạt hiệu ứng ON_SENT_TO_GY (VD: Sangan, Witch of the Black Forest, White Stone)
      if (triggerGraveyardEffects) {
        triggerOnSentToGyEffectsIfAny(state, removed.owner, removed.cardId, true);
      }
      return;
    }

    // Kiểm tra Spell/Trap Zones
    const stIdx = p.spellTrapZones.findIndex((s) => s?.instanceId === targetInstanceId);
    if (stIdx !== -1 && p.spellTrapZones[stIdx]) {
      const removed = p.spellTrapZones[stIdx]!;
      p.spellTrapZones[stIdx] = null;
      state.players[removed.owner].graveyard.push({
        instanceId: removed.instanceId,
        cardId: removed.cardId,
        owner: removed.owner,
      });
      return;
    }

    // Kiểm tra Field Zone
    if (p.fieldZone?.instanceId === targetInstanceId) {
      const removed = p.fieldZone;
      p.fieldZone = null;
      state.players[removed.owner].graveyard.push({
        instanceId: removed.instanceId,
        cardId: removed.cardId,
        owner: removed.owner,
      });
      return;
    }
  }
}

function checkWinnerState(state: DuelState): void {
  if (state.winner) return;
  const hostLp = state.players.host.lp;
  const guestLp = state.players.guest.lp;

  if (hostLp <= 0 && guestLp <= 0) {
    state.players.host.lp = 0;
    state.players.guest.lp = 0;
    state.winner = 'DRAW';
    state.winReasonVi = 'Điểm gốc (LP) của cả hai người chơi cùng về 0!';
    state.logs.push(`🏁 Hòa trận! Cả hai người chơi cùng hết LP.`);
  } else if (hostLp <= 0) {
    state.players.host.lp = 0;
    state.winner = 'guest';
    state.winReasonVi = `${state.players.guest.name} chiến thắng khi đưa LP của ${state.players.host.name} về 0!`;
    state.logs.push(`🏆 ${state.players.guest.name} CHIẾN THẮNG TRẬN ĐẤU!`);
  } else if (guestLp <= 0) {
    state.players.guest.lp = 0;
    state.winner = 'host';
    state.winReasonVi = `${state.players.host.name} chiến thắng khi đưa LP của ${state.players.guest.name} về 0!`;
    state.logs.push(`🏆 ${state.players.host.name} CHIẾN THẮNG TRẬN ĐẤU!`);
  }
}

function drawCardsForPlayer(state: DuelState, playerId: PlayerId, count: number): void {
  const player = state.players[playerId];
  for (let i = 0; i < count; i++) {
    if (player.deck.length === 0) {
      const oppId = getOpponentId(playerId);
      state.winner = oppId;
      state.winReasonVi = `${player.name} đã hết bài để rút (Deck Out)! ${state.players[oppId].name} chiến thắng!`;
      state.logs.push(`🏆 ${player.name} hết bài trong Deck! ${state.players[oppId].name} chiến thắng!`);
      return;
    }
    const drawn = player.deck.shift()!;
    player.hand.push(drawn);
  }
  pushDuelEvent(state, {
    type: 'DRAW',
    actor: playerId,
    messageVi: `🃏 ${player.name} rút ${count} lá bài!`,
  });
}

interface ActionReport {
  affectedCardIds: string[];
  affectedInstanceIds: string[];
  lpDeltas: { playerId: PlayerId; amount: number }[];
  drawnCount: number;
  searchedCount?: number;
  summonedCount?: number;
  milledCount?: number;
  banishedCount?: number;
  attackNegated?: boolean;
  endedBattlePhase?: boolean;
}

interface ActionExecutionContext {
  sourceInstanceId?: string;
  targetInstanceId?: string;
  triggerMonsterInstanceId?: string;
  attackerInstanceId?: string;
  fusionExtraInstanceId?: string;
  attackNegated?: boolean;
  report?: ActionReport;
}

function createEmptyReport(): ActionReport {
  return {
    affectedCardIds: [],
    affectedInstanceIds: [],
    lpDeltas: [],
    drawnCount: 0,
  };
}

function recordAffectedByInstance(state: DuelState, ctx: ActionExecutionContext, instId?: string): void {
  if (!instId || !ctx.report) return;
  const cId = findCardIdForInstance(state, instId);
  ctx.report.affectedInstanceIds.push(instId);
  if (cId) ctx.report.affectedCardIds.push(cId);
}

/**
 * TRÌNH THỰC THI HÀNH ĐỘNG NGUYÊN TỬ (DATA-DRIVEN ATOMIC ACTION EXECUTOR)
 */
function executeAtomicAction(
  state: DuelState,
  actorId: PlayerId,
  sourceCard: CardDefinition,
  action: AtomicAction,
  ctx: ActionExecutionContext
): void {
  const self = state.players[actorId];
  const oppId = getOpponentId(actorId);
  const opp = state.players[oppId];

  switch (action.type) {
    case 'DRAW_CARDS': {
      const n = action.value ?? 1;
      drawCardsForPlayer(state, actorId, n);
      if (ctx.report) ctx.report.drawnCount += n;
      state.logs.push(`🃏 ${self.name} rút ${n} lá bài nhờ [${sourceCard.nameVi}].`);
      break;
    }

    case 'DISCARD_FROM_HAND': {
      const count = action.value ?? 1;
      if (self.hand.length <= count) {
        const dumped = [...self.hand];
        self.hand = [];
        self.graveyard.push(...dumped);
        state.logs.push(`🗑️ ${self.name} bỏ ${dumped.length} lá trên tay xuống Mộ.`);
        dumped.forEach((dCard) => triggerOnSentToGyEffectsIfAny(state, dCard.owner, dCard.cardId, false));
      } else {
        queueOrOpenSelection(state, {
          player: actorId,
          sourceCardId: sourceCard.id,
          sourceCardNameVi: sourceCard.nameVi,
          selectionType: 'DISCARD_HAND',
          candidateInstanceIds: self.hand.map((h) => h.instanceId),
          requiredCount: count,
          descriptionVi: `Chọn ${count} lá bài trên tay để bỏ xuống Mộ (${sourceCard.nameVi}):`,
        });
      }
      break;
    }

    case 'DISCARD_TARGET_HAND_CARD': {
      if (!ctx.targetInstanceId) break;
      const idx = self.hand.findIndex((h) => h.instanceId === ctx.targetInstanceId);
      if (idx !== -1) {
        const removed = self.hand.splice(idx, 1)[0];
        self.graveyard.push(removed);
        const d = getCardById(removed.cardId);
        state.logs.push(`🗑️ ${self.name} bỏ [${d?.nameVi ?? removed.cardId}] từ tay để kích hoạt [${sourceCard.nameVi}].`);
        triggerOnSentToGyEffectsIfAny(state, removed.owner, removed.cardId, false);
      }
      break;
    }

    case 'TRIBUTE_TARGET_MONSTER': {
      if (!ctx.targetInstanceId) break;
      const m = self.monsterZones.find((z) => z?.instanceId === ctx.targetInstanceId);
      if (m) {
        const d = getCardById(m.cardId);
        state.logs.push(`🔥 ${self.name} hiến tế [${d?.nameVi ?? m.cardId}] để kích hoạt [${sourceCard.nameVi}].`);
        sendFieldCardToGraveyard(state, m.instanceId, true);
      }
      break;
    }

    case 'MILL_TO_GY': {
      const matching = self.deck.filter((c) => {
        const d = getCardById(c.cardId);
        return Boolean(d && matchesActionCardFilter(d, action, 'DECK'));
      });
      if (matching.length === 0) {
        state.logs.push(`⚰️ [${sourceCard.nameVi}]: Không còn lá bài phù hợp trong Bộ bài để gửi xuống Mộ.`);
        break;
      }
      const count = action.selectCount ?? 1;
      const distinctIds = Array.from(new Set(matching.map((m) => m.cardId)));
      if (distinctIds.length <= 1 || matching.length <= count) {
        const toMill = matching.slice(0, count);
        for (const item of toMill) {
          const dIdx = self.deck.findIndex((c) => c.instanceId === item.instanceId);
          if (dIdx !== -1) {
            const milled = self.deck.splice(dIdx, 1)[0];
            self.graveyard.push(milled);
            if (ctx.report) {
              ctx.report.affectedCardIds.push(milled.cardId);
              ctx.report.milledCount = (ctx.report.milledCount ?? 0) + 1;
            }
            const md = getCardById(milled.cardId);
            state.logs.push(`⚰️ [${sourceCard.nameVi}] gửi [${md?.nameVi ?? milled.cardId}] từ Bộ bài xuống Mộ!`);
            triggerOnSentToGyEffectsIfAny(state, milled.owner, milled.cardId, false);
          }
        }
        self.deck = shuffleArray(self.deck);
      } else {
        queueOrOpenSelection(state, {
          player: actorId,
          sourceCardId: sourceCard.id,
          sourceCardNameVi: sourceCard.nameVi,
          selectionType: 'MILL_DECK',
          candidateInstanceIds: matching.map((m) => m.instanceId),
          requiredCount: Math.min(count, matching.length),
          upToCount: count > 1,
          descriptionVi: `[${sourceCard.nameVi}]: Chọn ${count} lá từ Bộ bài để gửi xuống Mộ:`,
        });
      }
      break;
    }

    case 'DESTROY_TARGET': {
      if (!ctx.targetInstanceId) break;
      recordAffectedByInstance(state, ctx, ctx.targetInstanceId);
      sendFieldCardToGraveyard(state, ctx.targetInstanceId, true);
      state.logs.push(`💥 [${sourceCard.nameVi}] đã phá hủy mục tiêu!`);
      break;
    }

    case 'DESTROY_TRIGGER_MONSTER': {
      if (!ctx.triggerMonsterInstanceId) break;
      recordAffectedByInstance(state, ctx, ctx.triggerMonsterInstanceId);
      sendFieldCardToGraveyard(state, ctx.triggerMonsterInstanceId, true);
      state.logs.push(`🕳️ [${sourceCard.nameVi}] kích hoạt! Quái thú vừa triệu hồi rơi thẳng xuống Hố Bẫy!`);
      break;
    }

    case 'DESTROY_ATTACKING_MONSTER': {
      if (!ctx.attackerInstanceId) break;
      recordAffectedByInstance(state, ctx, ctx.attackerInstanceId);
      sendFieldCardToGraveyard(state, ctx.attackerInstanceId, true);
      state.logs.push(`💥 [${sourceCard.nameVi}] tiêu diệt quái thú đang tấn công!`);
      break;
    }

    case 'DESTROY_OPPONENT_MONSTERS': {
      const oppMonsters = opp.monsterZones.filter((m): m is FieldCardInstance => m !== null);
      if (oppMonsters.length === 0) break;
      const targetList =
        action.value && action.value > 0
          ? [...oppMonsters]
              .sort((a, b) => getEffectiveStats(state, b).atk - getEffectiveStats(state, a).atk)
              .slice(0, action.value)
          : oppMonsters;
      const ids = targetList.map((m) => m.instanceId);
      ids.forEach((id) => recordAffectedByInstance(state, ctx, id));
      ids.forEach((id) => sendFieldCardToGraveyard(state, id, true));
      state.logs.push(`⚡ [${sourceCard.nameVi}] tiêu diệt ${ids.length} quái thú của ${opp.name}!`);
      break;
    }

    case 'DESTROY_OPPONENT_SPELLS_TRAPS': {
      const ids: string[] = [];
      opp.spellTrapZones.forEach((st) => {
        if (st) ids.push(st.instanceId);
      });
      if (opp.fieldZone) ids.push(opp.fieldZone.instanceId);
      const limitedIds = action.value && action.value > 0 ? ids.slice(0, action.value) : ids;
      if (limitedIds.length === 0) break;
      limitedIds.forEach((id) => recordAffectedByInstance(state, ctx, id));
      limitedIds.forEach((id) => sendFieldCardToGraveyard(state, id, false));
      state.logs.push(`🌪️ [${sourceCard.nameVi}] phá hủy ${limitedIds.length} Phép/Bẫy của ${opp.name}!`);
      break;
    }

    case 'DESTROY_OPPONENT_ALL_CARDS': {
      const ids: string[] = [
        ...opp.monsterZones.filter((m): m is FieldCardInstance => m !== null).map((m) => m.instanceId),
        ...opp.spellTrapZones.filter((s): s is FieldCardInstance => s !== null).map((s) => s.instanceId),
        ...(opp.fieldZone ? [opp.fieldZone.instanceId] : []),
      ];
      if (ids.length === 0) break;
      ids.forEach((id) => recordAffectedByInstance(state, ctx, id));
      ids.forEach((id) => sendFieldCardToGraveyard(state, id, true));
      state.logs.push(`💥 [${sourceCard.nameVi}] quét sạch TOÀN BỘ ${ids.length} lá bài trên sân của ${opp.name}!`);
      break;
    }

    case 'DESTROY_ALL_MONSTERS': {
      const ids = [
        ...self.monsterZones.filter((m): m is FieldCardInstance => m !== null).map((m) => m.instanceId),
        ...opp.monsterZones.filter((m): m is FieldCardInstance => m !== null).map((m) => m.instanceId),
      ];
      ids.forEach((id) => recordAffectedByInstance(state, ctx, id));
      ids.forEach((id) => sendFieldCardToGraveyard(state, id, true));
      state.logs.push(`🌌 [${sourceCard.nameVi}] cuốn toàn bộ ${ids.length} quái thú trên sân vào hố đen!`);
      break;
    }

    case 'DESTROY_OPPONENT_ATTACK_POS_MONSTERS': {
      const ids = opp.monsterZones
        .filter((m): m is FieldCardInstance => m !== null && m.position === 'ATTACK')
        .map((m) => m.instanceId);
      ids.forEach((id) => recordAffectedByInstance(state, ctx, id));
      ids.forEach((id) => sendFieldCardToGraveyard(state, id, true));
      state.logs.push(`🛡️ [${sourceCard.nameVi}] phản chấn tiêu diệt ${ids.length} quái thú thế Công của ${opp.name}!`);
      break;
    }

    case 'DESTROY_LOWEST_ATK_OPPONENT_MONSTER': {
      const faceUpMonsters = opp.monsterZones.filter(
        (m): m is FieldCardInstance => m !== null && m.position !== 'SET_DEFENSE'
      );
      if (faceUpMonsters.length === 0) break;
      let lowest = faceUpMonsters[0];
      let lowestAtk = getEffectiveStats(state, lowest).atk;
      for (const m of faceUpMonsters) {
        const atk = getEffectiveStats(state, m).atk;
        if (atk < lowestAtk) {
          lowest = m;
          lowestAtk = atk;
        }
      }
      const d = getCardById(lowest.cardId);
      recordAffectedByInstance(state, ctx, lowest.instanceId);
      sendFieldCardToGraveyard(state, lowest.instanceId, true);
      state.logs.push(`🌋 [${sourceCard.nameVi}] tiêu diệt [${d?.nameVi ?? lowest.cardId}] (${lowestAtk} ATK)!`);
      break;
    }

    case 'DESTROY_ALL_SPELLS_TRAPS': {
      const ids: string[] = [];
      for (const pid of ['host', 'guest'] as PlayerId[]) {
        state.players[pid].spellTrapZones.forEach((st) => {
          if (st && st.instanceId !== ctx.sourceInstanceId) ids.push(st.instanceId);
        });
        const fz = state.players[pid].fieldZone;
        if (fz && fz.instanceId !== ctx.sourceInstanceId) ids.push(fz.instanceId);
      }
      ids.forEach((id) => recordAffectedByInstance(state, ctx, id));
      ids.forEach((id) => sendFieldCardToGraveyard(state, id, false));
      state.logs.push(`🌪️ [${sourceCard.nameVi}] thổi bay toàn bộ ${ids.length} lá Phép/Bẫy trên sân!`);
      break;
    }

    case 'CHANGE_TARGET_FACE_DOWN': {
      if (!ctx.targetInstanceId) break;
      for (const pid of ['host', 'guest'] as PlayerId[]) {
        const m = state.players[pid].monsterZones.find((z) => z?.instanceId === ctx.targetInstanceId);
        if (m) {
          recordAffectedByInstance(state, ctx, m.instanceId);
          m.position = 'SET_DEFENSE';
          const d = getCardById(m.cardId);
          state.logs.push(`🌙 [${sourceCard.nameVi}] lật úp [${d?.nameVi ?? m.cardId}] xuống thế Phòng Thủ!`);
          break;
        }
      }
      break;
    }

    case 'BANISH_FROM_GY': {
      if (!ctx.targetInstanceId) break;
      for (const pid of ['host', 'guest'] as PlayerId[]) {
        const gy = state.players[pid].graveyard;
        const gIdx = gy.findIndex((g) => g.instanceId === ctx.targetInstanceId);
        if (gIdx !== -1) {
          recordAffectedByInstance(state, ctx, ctx.targetInstanceId);
          const banished = gy.splice(gIdx, 1)[0];
          const bd = getCardById(banished.cardId);
          if (ctx.report) ctx.report.banishedCount = (ctx.report.banishedCount ?? 0) + 1;
          state.logs.push(`🕳️ [${sourceCard.nameVi}] trục xuất [${bd?.nameVi ?? banished.cardId}] khỏi Mộ!`);
          break;
        }
      }
      break;
    }

    case 'RETURN_ATTACKER_TO_HAND': {
      if (!ctx.attackerInstanceId) break;
      for (const pid of ['host', 'guest'] as PlayerId[]) {
        const p = state.players[pid];
        const idx = p.monsterZones.findIndex((m) => m?.instanceId === ctx.attackerInstanceId);
        if (idx !== -1 && p.monsterZones[idx]) {
          const m = p.monsterZones[idx]!;
          const d = getCardById(m.cardId);
          recordAffectedByInstance(state, ctx, m.instanceId);
          // Phá trang bị gắn kèm trước khi trả về tay
          for (const stPid of ['host', 'guest'] as PlayerId[]) {
            state.players[stPid].spellTrapZones.forEach((st) => {
              if (st && st.equippedToInstanceId === m.instanceId) {
                sendFieldCardToGraveyard(state, st.instanceId, false);
              }
            });
          }
          p.monsterZones[idx] = null;
          if (d?.subType === 'FUSION') {
            state.players[m.owner].extraDeck.push({
              instanceId: m.instanceId,
              cardId: m.cardId,
              owner: m.owner,
            });
          } else {
            state.players[m.owner].hand.push({
              instanceId: m.instanceId,
              cardId: m.cardId,
              owner: m.owner,
            });
          }
          state.logs.push(`🌀 Hiệu ứng của [${sourceCard.nameVi}] đẩy [${d?.nameVi}] bay ngược về tay chủ nhân!`);
        }
      }
      break;
    }

    case 'RETURN_TARGET_TO_HAND': {
      if (!ctx.targetInstanceId) break;
      let bounced = false;
      for (const pid of ['host', 'guest'] as PlayerId[]) {
        const p = state.players[pid];
        const mIdx = p.monsterZones.findIndex((m) => m?.instanceId === ctx.targetInstanceId);
        if (mIdx !== -1 && p.monsterZones[mIdx]) {
          const m = p.monsterZones[mIdx]!;
          const d = getCardById(m.cardId);
          recordAffectedByInstance(state, ctx, m.instanceId);
          for (const stPid of ['host', 'guest'] as PlayerId[]) {
            state.players[stPid].spellTrapZones.forEach((st) => {
              if (st && st.equippedToInstanceId === m.instanceId) {
                sendFieldCardToGraveyard(state, st.instanceId, false);
              }
            });
          }
          p.monsterZones[mIdx] = null;
          if (d?.subType === 'FUSION') {
            state.players[m.owner].extraDeck.push({
              instanceId: m.instanceId,
              cardId: m.cardId,
              owner: m.owner,
            });
          } else {
            state.players[m.owner].hand.push({
              instanceId: m.instanceId,
              cardId: m.cardId,
              owner: m.owner,
            });
          }
          state.logs.push(
            `🌀 [${sourceCard.nameVi}] đẩy [${d?.nameVi ?? m.cardId}] quay về tay chủ nhân!`
          );
          bounced = true;
          break;
        }

        const stIdx = p.spellTrapZones.findIndex((s) => s?.instanceId === ctx.targetInstanceId);
        if (stIdx !== -1 && p.spellTrapZones[stIdx]) {
          const st = p.spellTrapZones[stIdx]!;
          const d = getCardById(st.cardId);
          recordAffectedByInstance(state, ctx, st.instanceId);
          p.spellTrapZones[stIdx] = null;
          state.players[st.owner].hand.push({
            instanceId: st.instanceId,
            cardId: st.cardId,
            owner: st.owner,
          });
          state.logs.push(
            `🌀 [${sourceCard.nameVi}] đẩy [${d?.nameVi ?? st.cardId}] quay về tay chủ nhân!`
          );
          bounced = true;
          break;
        }

        if (p.fieldZone?.instanceId === ctx.targetInstanceId) {
          const fz = p.fieldZone;
          const d = getCardById(fz.cardId);
          recordAffectedByInstance(state, ctx, fz.instanceId);
          p.fieldZone = null;
          state.players[fz.owner].hand.push({
            instanceId: fz.instanceId,
            cardId: fz.cardId,
            owner: fz.owner,
          });
          state.logs.push(
            `🌀 [${sourceCard.nameVi}] đẩy [${d?.nameVi ?? fz.cardId}] quay về tay chủ nhân!`
          );
          bounced = true;
          break;
        }
      }
      if (!bounced) {
        state.logs.push(`🌀 [${sourceCard.nameVi}] kích hoạt nhưng mục tiêu đã rời sân.`);
      }
      break;
    }

    case 'HEAL_LP': {
      const amount = action.value ?? 0;
      const targetP = action.targetSide === 'OPPONENT' ? opp : self;
      targetP.lp += amount;
      if (ctx.report) ctx.report.lpDeltas.push({ playerId: targetP.id, amount });
      state.logs.push(`💚 [${sourceCard.nameVi}] hồi phục +${amount} LP cho ${targetP.name} (LP: ${targetP.lp}).`);
      pushDuelEvent(state, {
        type: 'HEAL',
        actor: actorId,
        cardId: sourceCard.id,
        targetPlayer: targetP.id,
        lpDelta: amount,
        messageVi: `💚 ${targetP.name} +${amount} LP!`,
      });
      break;
    }

    case 'DAMAGE_LP': {
      const amount = action.value ?? 0;
      const targetP = action.targetSide === 'SELF' ? self : opp;
      targetP.lp -= amount;
      if (ctx.report) ctx.report.lpDeltas.push({ playerId: targetP.id, amount: -amount });
      state.logs.push(`🔥 [${sourceCard.nameVi}] gây ${amount} sát thương vào ${targetP.name} (LP còn: ${Math.max(0, targetP.lp)}).`);
      pushDuelEvent(state, {
        type: 'DAMAGE',
        actor: actorId,
        cardId: sourceCard.id,
        targetPlayer: targetP.id,
        lpDelta: -amount,
        messageVi: `🔥 ${targetP.name} -${amount} LP!`,
      });
      checkWinnerState(state);
      break;
    }

    case 'DAMAGE_LP_BY_ATTACKER_ATK': {
      if (!ctx.attackerInstanceId) break;
      const attacker = opp.monsterZones.find((m) => m?.instanceId === ctx.attackerInstanceId);
      if (attacker) {
        const atk = getEffectiveStats(state, attacker).atk;
        opp.lp -= atk;
        recordAffectedByInstance(state, ctx, attacker.instanceId);
        if (ctx.report) ctx.report.lpDeltas.push({ playerId: opp.id, amount: -atk });
        state.logs.push(
          `🔮 [${sourceCard.nameVi}] phản lại toàn bộ ${atk} sát thương vào thẳng LP của ${opp.name}!`
        );
        pushDuelEvent(state, {
          type: 'DAMAGE',
          actor: actorId,
          cardId: sourceCard.id,
          targetPlayer: opp.id,
          lpDelta: -atk,
          messageVi: `🔮 Phản đòn! ${opp.name} -${atk} LP!`,
        });
        checkWinnerState(state);
      }
      break;
    }

    case 'REVIVE_TARGET_FROM_GY': {
      if (!ctx.targetInstanceId) break;
      const freeSlot = self.monsterZones.findIndex((z) => z === null);
      if (freeSlot === -1) break;

      let foundCard: HandCardInstance | null = null;
      for (const pid of ['host', 'guest'] as PlayerId[]) {
        const gy = state.players[pid].graveyard;
        const gIdx = gy.findIndex((g) => g.instanceId === ctx.targetInstanceId);
        if (gIdx !== -1) {
          foundCard = gy.splice(gIdx, 1)[0];
          break;
        }
      }

      if (foundCard) {
        const revived: FieldCardInstance = {
          instanceId: foundCard.instanceId,
          cardId: foundCard.cardId,
          owner: foundCard.owner,
          controller: actorId,
          position: 'ATTACK',
          summonedTurn: state.turnNumber,
          setTurn: state.turnNumber,
          changedPositionThisTurn: false,
          attacksDeclaredThisTurn: 0,
        };
        self.monsterZones[freeSlot] = revived;
        recordAffectedByInstance(state, ctx, revived.instanceId);
        if (ctx.report) ctx.report.summonedCount = (ctx.report.summonedCount ?? 0) + 1;

        // Nếu là Call of the Haunted, liên kết lá bẫy với quái vừa hồi sinh
        if (ctx.sourceInstanceId) {
          const st = self.spellTrapZones.find((s) => s?.instanceId === ctx.sourceInstanceId);
          if (st && sourceCard.subType === 'CONTINUOUS') {
            st.equippedToInstanceId = revived.instanceId;
          }
        }

        const d = getCardById(foundCard.cardId);
        state.logs.push(`✨ [${sourceCard.nameVi}] Triệu hồi Đặc biệt [${d?.nameVi}] từ dưới Mộ lên sân của ${self.name}!`);
        pushDuelEvent(state, {
          type: 'SUMMON',
          actor: actorId,
          cardId: foundCard.cardId,
          sourceInstanceId: revived.instanceId,
          messageVi: `✨ Hồi sinh Đặc biệt [${d?.nameVi}]!`,
        });
        triggerOnSummonEffectIfAny(state, actorId, revived);
      }
      break;
    }

    case 'EQUIP_TO_TARGET': {
      if (!ctx.sourceInstanceId || !ctx.targetInstanceId) break;
      const st = self.spellTrapZones.find((s) => s?.instanceId === ctx.sourceInstanceId);
      if (st) {
        st.equippedToInstanceId = ctx.targetInstanceId;
        recordAffectedByInstance(state, ctx, ctx.targetInstanceId);
        state.logs.push(`⚔️ Trang bị [${sourceCard.nameVi}] thành công!`);
      }
      break;
    }

    case 'NEGATE_ATTACK': {
      ctx.attackNegated = true;
      if (ctx.report) ctx.report.attackNegated = true;
      state.logs.push(`🛡️ [${sourceCard.nameVi}] đã vô hiệu hóa đòn tấn công!`);
      break;
    }

    case 'END_BATTLE_PHASE': {
      ctx.attackNegated = true;
      if (ctx.report) {
        ctx.report.attackNegated = true;
        ctx.report.endedBattlePhase = true;
      }
      state.phase = 'MAIN2';
      state.logs.push(`🛑 [${sourceCard.nameVi}] kết thúc luôn Battle Phase! Chuyển sang Main Phase 2.`);
      break;
    }

    case 'FLIP_ALL_OPPONENT_MONSTERS_FACE_UP': {
      opp.monsterZones.forEach((m) => {
        if (m && m.position === 'SET_DEFENSE') {
          m.position = 'DEFENSE';
          recordAffectedByInstance(state, ctx, m.instanceId);
          const d = getCardById(m.cardId);
          state.logs.push(`💡 [${sourceCard.nameVi}] lật ngửa [${d?.nameVi}] của ${opp.name}!`);
          // Kích hoạt hiệu ứng Flip nếu có
          triggerFlipEffectIfAny(state, oppId, m);
        }
      });
      break;
    }

    case 'LOCK_OPPONENT_ATTACKS_TURNS': {
      const turns = action.value ?? 3;
      opp.attackLockedTurns = Math.max(opp.attackLockedTurns, turns);
      if (ctx.sourceInstanceId) {
        const st = self.spellTrapZones.find((s) => s?.instanceId === ctx.sourceInstanceId);
        if (st) st.remainingTurnsOnField = turns;
      }
      state.logs.push(`⚔️ [${sourceCard.nameVi}] phong ấn không cho ${opp.name} tấn công trong ${turns} lượt!`);
      break;
    }

    case 'CHANGE_TARGET_POSITION': {
      if (!ctx.targetInstanceId) break;
      for (const pid of ['host', 'guest'] as PlayerId[]) {
        const m = state.players[pid].monsterZones.find((z) => z?.instanceId === ctx.targetInstanceId);
        if (m) {
          recordAffectedByInstance(state, ctx, m.instanceId);
          const wasSet = m.position === 'SET_DEFENSE';
          m.position = 'ATTACK';
          const d = getCardById(m.cardId);
          state.logs.push(`🔄 [${sourceCard.nameVi}] ép [${d?.nameVi}] chuyển sang thế Tấn Công!`);
          if (wasSet) {
            triggerFlipEffectIfAny(state, pid, m);
          }
        }
      }
      break;
    }

    case 'TAKE_CONTROL_UNTIL_END_PHASE': {
      if (!ctx.targetInstanceId) break;
      const freeIdx = self.monsterZones.findIndex((z) => z === null);
      if (freeIdx === -1) break;
      const oppIdx = opp.monsterZones.findIndex((z) => z?.instanceId === ctx.targetInstanceId);
      if (oppIdx !== -1 && opp.monsterZones[oppIdx]) {
        const stolen = opp.monsterZones[oppIdx]!;
        recordAffectedByInstance(state, ctx, stolen.instanceId);
        opp.monsterZones[oppIdx] = null;
        stolen.controller = actorId;
        stolen.returnControlAtEndPhase = true;
        self.monsterZones[freeIdx] = stolen;
        const d = getCardById(stolen.cardId);
        state.logs.push(
          `💘 [${sourceCard.nameVi}] giúp ${self.name} giành quyền điều khiển [${d?.nameVi ?? 'Quái thú'}] đến hết lượt!`
        );
      }
      break;
    }

    case 'SEARCH_DECK_MONSTER_TO_HAND': {
      const matching = self.deck.filter((c) => {
        const d = getCardById(c.cardId);
        if (!d || d.category !== 'MONSTER') return false;
        if (action.maxAtkFilter !== undefined && (d.atk ?? 0) > action.maxAtkFilter) return false;
        if (action.maxDefFilter !== undefined && (d.def ?? 0) > action.maxDefFilter) return false;
        return true;
      });
      if (matching.length === 0) {
        state.logs.push(`🔍 [${sourceCard.nameVi}] kích hoạt nhưng không còn quái thú phù hợp trong Bộ bài.`);
        break;
      }
      const uniqueIds = Array.from(new Set(matching.map((m) => m.cardId)));
      if (uniqueIds.length <= 1) {
        const item = matching[0];
        const idx = self.deck.findIndex((c) => c.instanceId === item.instanceId);
        if (idx !== -1) {
          const picked = self.deck.splice(idx, 1)[0];
          self.hand.push(picked);
          self.deck = shuffleArray(self.deck);
          const pd = getCardById(picked.cardId);
          if (ctx.report) {
            ctx.report.affectedCardIds.push(picked.cardId);
            ctx.report.searchedCount = (ctx.report.searchedCount ?? 0) + 1;
          }
          state.logs.push(`🔍 [${sourceCard.nameVi}] lấy [${pd?.nameVi}] từ Bộ bài lên tay!`);
        }
      } else {
        queueOrOpenSelection(state, {
          player: actorId,
          sourceCardId: sourceCard.id,
          sourceCardNameVi: sourceCard.nameVi,
          selectionType: 'SEARCH_DECK',
          candidateInstanceIds: matching.map((m) => m.instanceId),
          requiredCount: 1,
          descriptionVi: `[${sourceCard.nameVi}]: Chọn 1 quái thú từ Bộ bài để đưa lên tay:`,
        });
      }
      break;
    }

    case 'SEARCH_DECK_TO_HAND': {
      const pool: { inst: HandCardInstance; from: 'DECK' | 'GY' }[] = [];
      if (!action.graveyardOnly) {
        for (const c of self.deck) {
          const d = getCardById(c.cardId);
          if (d && matchesActionCardFilter(d, action, 'DECK')) pool.push({ inst: c, from: 'DECK' });
        }
      }
      if (action.includeGraveyard || action.graveyardOnly) {
        for (const c of self.graveyard) {
          const d = getCardById(c.cardId);
          if (d && matchesActionCardFilter(d, action, 'GY')) pool.push({ inst: c, from: 'GY' });
        }
      }

      if (pool.length === 0) {
        state.logs.push(`🔍 [${sourceCard.nameVi}] kích hoạt nhưng không còn lá bài phù hợp.`);
        break;
      }

      const wantCount = action.selectCount ?? 1;
      const distinctIds = Array.from(new Set(pool.map((p) => p.inst.cardId)));
      if (distinctIds.length <= 1 || pool.length <= wantCount) {
        const chosen = pool.slice(0, wantCount);
        let tookFromDeck = false;
        for (const entry of chosen) {
          if (entry.from === 'DECK') {
            const idx = self.deck.findIndex((c) => c.instanceId === entry.inst.instanceId);
            if (idx !== -1) {
              const picked = self.deck.splice(idx, 1)[0];
              self.hand.push(picked);
              tookFromDeck = true;
            }
          } else {
            const idx = self.graveyard.findIndex((c) => c.instanceId === entry.inst.instanceId);
            if (idx !== -1) {
              const picked = self.graveyard.splice(idx, 1)[0];
              self.hand.push(picked);
            }
          }
          const pd = getCardById(entry.inst.cardId);
          if (ctx.report) {
            ctx.report.affectedCardIds.push(entry.inst.cardId);
            ctx.report.searchedCount = (ctx.report.searchedCount ?? 0) + 1;
          }
          state.logs.push(
            `🔍 [${sourceCard.nameVi}] đưa [${pd?.nameVi ?? entry.inst.cardId}] từ ${
              entry.from === 'GY' ? 'Mộ' : 'Bộ bài'
            } lên tay!`
          );
        }
        if (tookFromDeck) self.deck = shuffleArray(self.deck);
      } else {
        queueOrOpenSelection(state, {
          player: actorId,
          sourceCardId: sourceCard.id,
          sourceCardNameVi: sourceCard.nameVi,
          selectionType: 'SEARCH_DECK',
          candidateInstanceIds: pool.map((p) => p.inst.instanceId),
          requiredCount: Math.min(wantCount, pool.length),
          upToCount: wantCount > 1,
          descriptionVi: `[${sourceCard.nameVi}]: Chọn tối đa ${wantCount} lá từ ${
            action.graveyardOnly ? 'Mộ' : action.includeGraveyard ? 'Bộ bài / Mộ' : 'Bộ bài'
          } để đưa lên tay:`,
        });
      }
      break;
    }

    case 'SPECIAL_SUMMON_HAND_MONSTERS': {
      const maxCount = action.maxSummonCount ?? 2;
      const candidates = self.hand.filter((h) => {
        const d = getCardById(h.cardId);
        return Boolean(d && d.category === 'MONSTER' && matchesActionCardFilter(d, action, 'HAND'));
      });

      let summoned = 0;
      for (const cand of candidates) {
        if (summoned >= maxCount) break;
        const slot = self.monsterZones.findIndex((z) => z === null);
        if (slot === -1) break;
        const hIdx = self.hand.findIndex((h) => h.instanceId === cand.instanceId);
        if (hIdx !== -1) {
          self.hand.splice(hIdx, 1);
          const summonedInst: FieldCardInstance = {
            instanceId: cand.instanceId,
            cardId: cand.cardId,
            owner: actorId,
            controller: actorId,
            position: 'ATTACK',
            summonedTurn: state.turnNumber,
            setTurn: state.turnNumber,
            changedPositionThisTurn: false,
            attacksDeclaredThisTurn: 0,
          };
          self.monsterZones[slot] = summonedInst;
          recordAffectedByInstance(state, ctx, cand.instanceId);
          if (ctx.report) ctx.report.summonedCount = (ctx.report.summonedCount ?? 0) + 1;
          const d = getCardById(cand.cardId);
          state.logs.push(`🐉 [${sourceCard.nameVi}] Triệu hồi Đặc biệt [${d?.nameVi}] từ trên tay!`);
          summoned += 1;
          triggerOnSummonEffectIfAny(state, actorId, summonedInst);
        }
      }
      break;
    }

    case 'SPECIAL_SUMMON_FROM_DECK_OR_GY': {
      const freeSlotCount = self.monsterZones.filter((z) => z === null).length;
      if (freeSlotCount === 0) {
        state.logs.push(`✨ [${sourceCard.nameVi}]: Sân quái đã đầy nên không thể Triệu hồi Đặc biệt!`);
        break;
      }

      const pool: { inst: HandCardInstance; from: 'DECK' | 'GY' }[] = [];
      if (action.includeGraveyard || action.graveyardOnly) {
        for (const c of self.graveyard) {
          const d = getCardById(c.cardId);
          if (d && d.category === 'MONSTER' && matchesActionCardFilter(d, action, 'GY')) {
            pool.push({ inst: c, from: 'GY' });
          }
        }
      }
      if (!action.graveyardOnly) {
        for (const c of self.deck) {
          const d = getCardById(c.cardId);
          if (d && d.category === 'MONSTER' && matchesActionCardFilter(d, action, 'DECK')) {
            pool.push({ inst: c, from: 'DECK' });
          }
        }
      }

      if (pool.length === 0) {
        state.logs.push(`🔍 [${sourceCard.nameVi}]: Không còn quái thú phù hợp để Triệu hồi Đặc biệt.`);
        break;
      }

      const maxCount = Math.min(action.maxSummonCount ?? 1, freeSlotCount);
      const distinctIds = Array.from(new Set(pool.map((p) => p.inst.cardId)));
      if (distinctIds.length <= 1 || maxCount > 1 || pool.length <= maxCount) {
        const toSummon = pool.slice(0, maxCount);
        let tookFromDeck = false;
        for (const entry of toSummon) {
          const slot = self.monsterZones.findIndex((z) => z === null);
          if (slot === -1) break;
          if (entry.from === 'GY') {
            const idx = self.graveyard.findIndex((g) => g.instanceId === entry.inst.instanceId);
            if (idx !== -1) self.graveyard.splice(idx, 1);
          } else {
            const idx = self.deck.findIndex((c) => c.instanceId === entry.inst.instanceId);
            if (idx !== -1) {
              self.deck.splice(idx, 1);
              tookFromDeck = true;
            }
          }
          const summonedInst: FieldCardInstance = {
            instanceId: entry.inst.instanceId,
            cardId: entry.inst.cardId,
            owner: entry.inst.owner,
            controller: actorId,
            position: 'ATTACK',
            summonedTurn: state.turnNumber,
            setTurn: state.turnNumber,
            changedPositionThisTurn: false,
            attacksDeclaredThisTurn: 0,
          };
          self.monsterZones[slot] = summonedInst;
          recordAffectedByInstance(state, ctx, summonedInst.instanceId);
          if (ctx.report) ctx.report.summonedCount = (ctx.report.summonedCount ?? 0) + 1;
          const d = getCardById(entry.inst.cardId);
          state.logs.push(
            `🌟 [${sourceCard.nameVi}] Triệu hồi Đặc biệt [${d?.nameVi}] từ ${
              entry.from === 'GY' ? 'Mộ' : 'Bộ bài'
            }!`
          );
          pushDuelEvent(state, {
            type: 'SUMMON',
            actor: actorId,
            cardId: entry.inst.cardId,
            sourceInstanceId: summonedInst.instanceId,
            messageVi: `🌟 Triệu hồi Đặc biệt [${d?.nameVi}]!`,
          });
          triggerOnSummonEffectIfAny(state, actorId, summonedInst);
        }
        if (tookFromDeck) self.deck = shuffleArray(self.deck);
      } else {
        queueOrOpenSelection(state, {
          player: actorId,
          sourceCardId: sourceCard.id,
          sourceCardNameVi: sourceCard.nameVi,
          selectionType: 'SPECIAL_SUMMON_CANDIDATE',
          candidateInstanceIds: pool.map((p) => p.inst.instanceId),
          requiredCount: 1,
          descriptionVi: `[${sourceCard.nameVi}]: Chọn 1 quái thú để Triệu hồi Đặc biệt lên sân:`,
        });
      }
      break;
    }

    case 'FUSION_SUMMON': {
      const onlyMatId = action.useTargetAsOnlyFusionMaterial ? ctx.targetInstanceId : undefined;
      const avail = getAvailableFusionSummons(state, actorId, {
        allowGy: Boolean(action.allowGyFusionMaterials),
        onlyMaterialInstanceId: onlyMatId,
      });
      if (avail.length === 0) break;
      const chosen =
        avail.find((a) => a.extraCard.instanceId === ctx.fusionExtraInstanceId) ?? avail[0];

      if (action.useTargetAsOnlyFusionMaterial && onlyMatId) {
        sendFieldCardToGraveyard(state, onlyMatId, true);
      } else {
        const hasFreeZone = self.monsterZones.some((z) => z === null);
        const pool = buildFusionMaterialPool(self, Boolean(action.allowGyFusionMaterials)).sort((a, b) => {
          const priority = (s: FusionMaterialCandidate['source']) =>
            !hasFreeZone
              ? s === 'FIELD'
                ? 0
                : s === 'HAND'
                ? 1
                : 2
              : s === 'HAND'
              ? 0
              : s === 'GY'
              ? 1
              : 2;
          return priority(a.source) - priority(b.source);
        });

        const reqs = [...(chosen.def.fusionMaterials ?? [])].sort((a, b) => {
          const aWild = a.startsWith('RACE:') || a.startsWith('ATTR:') ? 1 : 0;
          const bWild = b.startsWith('RACE:') || b.startsWith('ATTR:') ? 1 : 0;
          return aWild - bWild;
        });

        let recycledFromGy = false;
        for (const req of reqs) {
          const pIdx = pool.findIndex((cand) => doesCandidateMatchFusionReq(cand, req));
          if (pIdx === -1) continue;
          const cand = pool.splice(pIdx, 1)[0];

          if (cand.source === 'HAND') {
            const hIdx = self.hand.findIndex((h) => h.instanceId === cand.instanceId);
            if (hIdx !== -1) {
              const mat = self.hand.splice(hIdx, 1)[0];
              self.graveyard.push(mat);
              triggerOnSentToGyEffectsIfAny(state, mat.owner, mat.cardId, false);
            }
          } else if (cand.source === 'FIELD') {
            sendFieldCardToGraveyard(state, cand.instanceId, true);
          } else {
            const gIdx = self.graveyard.findIndex((g) => g.instanceId === cand.instanceId);
            if (gIdx !== -1) {
              const mat = self.graveyard.splice(gIdx, 1)[0];
              self.deck.push(mat);
              recycledFromGy = true;
              const md = getCardById(mat.cardId);
              state.logs.push(
                `♻️ [${sourceCard.nameVi}] đưa [${md?.nameVi ?? mat.cardId}] từ Mộ về Bộ bài làm nguyên liệu Dung Hợp.`
              );
            }
          }
        }
        if (recycledFromGy) {
          self.deck = shuffleArray(self.deck);
        }
      }

      // Đưa quái Fusion từ Extra Deck lên sân
      const exIdx = self.extraDeck.findIndex((e) => e.instanceId === chosen.extraCard.instanceId);
      if (exIdx !== -1) {
        self.extraDeck.splice(exIdx, 1);
      }
      const freeSlot = self.monsterZones.findIndex((z) => z === null);
      if (freeSlot !== -1) {
        const fusedInstance: FieldCardInstance = {
          instanceId: chosen.extraCard.instanceId,
          cardId: chosen.def.id,
          owner: actorId,
          controller: actorId,
          position: 'ATTACK',
          summonedTurn: state.turnNumber,
          setTurn: state.turnNumber,
          changedPositionThisTurn: false,
          attacksDeclaredThisTurn: 0,
        };
        self.monsterZones[freeSlot] = fusedInstance;
        recordAffectedByInstance(state, ctx, chosen.extraCard.instanceId);
        if (ctx.report) ctx.report.summonedCount = (ctx.report.summonedCount ?? 0) + 1;
        state.logs.push(
          `🌀 DUNG HỢP THÀNH CÔNG! ${self.name} triệu hồi [${chosen.def.nameVi}] (${chosen.def.atk}/${chosen.def.def})!`
        );
        pushDuelEvent(state, {
          type: 'SUMMON',
          actor: actorId,
          cardId: chosen.def.id,
          sourceInstanceId: chosen.extraCard.instanceId,
          messageVi: `🌀 DUNG HỢP: [${chosen.def.nameVi}] (${chosen.def.atk} ATK)!`,
        });
        triggerOnSummonEffectIfAny(state, actorId, fusedInstance);
      }
      break;
    }

    default:
      break;
  }
}

function summarizeReportResultVi(cardDef: CardDefinition, report: ActionReport): string {
  const names = report.affectedCardIds
    .map((id) => getCardById(id))
    .filter((d): d is CardDefinition => Boolean(d))
    .map((d) => `[${getShortCardTitle(d)}]`);
  const uniqueNames = Array.from(new Set(names)).slice(0, 3).join(', ');
  const lpDeltaTotal = report.lpDeltas.reduce((acc, x) => acc + x.amount, 0);

  if (report.attackNegated && report.affectedCardIds.length > 0) {
    return `Chặn đòn & Tiêu diệt ${uniqueNames}!`;
  }
  if (report.attackNegated && lpDeltaTotal < 0) {
    return `Vô hiệu đòn & Phản ${Math.abs(lpDeltaTotal)} sát thương LP!`;
  }
  if (report.attackNegated && report.endedBattlePhase) {
    return `Vô hiệu đòn & Kết thúc Battle Phase!`;
  }
  if (report.attackNegated) {
    return `Đã vô hiệu hóa đòn tấn công!`;
  }
  if ((report.banishedCount ?? 0) > 0 && uniqueNames) {
    return `Trục xuất ${uniqueNames} khỏi Mộ!`;
  }
  if ((report.searchedCount ?? 0) > 0 && uniqueNames) {
    return `Đưa ${uniqueNames} lên tay!`;
  }
  if ((report.summonedCount ?? 0) > 0 && uniqueNames) {
    return `Triệu hồi Đặc biệt ${uniqueNames}!`;
  }
  if ((report.milledCount ?? 0) > 0 && uniqueNames) {
    return `Gửi ${uniqueNames} xuống Mộ!`;
  }
  if (report.drawnCount > 0) {
    const healed = report.lpDeltas.find((d) => d.amount > 0);
    if (healed) {
      return `Rút ${report.drawnCount} lá & đối thủ +${healed.amount} LP!`;
    }
    return `Đã rút ${report.drawnCount} lá bài lên tay!`;
  }
  if (report.lpDeltas.length > 0 && lpDeltaTotal > 0) {
    return `Hồi phục +${lpDeltaTotal} LP!`;
  }
  if (report.lpDeltas.length > 0 && lpDeltaTotal < 0) {
    return `Gây ${Math.abs(lpDeltaTotal)} sát thương LP!`;
  }
  if (cardDef.subType === 'EQUIP' && uniqueNames) {
    return `Trang bị tăng sức mạnh cho ${uniqueNames}!`;
  }
  if (
    uniqueNames &&
    cardDef.effects?.some((e) => e.actions?.some((a) => a.type === 'REVIVE_TARGET_FROM_GY'))
  ) {
    return `Đã hồi sinh ${uniqueNames} lên sân!`;
  }
  if (
    uniqueNames &&
    cardDef.effects?.some((e) => e.actions?.some((a) => a.type === 'TAKE_CONTROL_UNTIL_END_PHASE'))
  ) {
    return `Đã chiếm quyền điều khiển ${uniqueNames}!`;
  }
  if (
    uniqueNames &&
    cardDef.effects?.some((e) => e.actions?.some((a) => a.type === 'CHANGE_TARGET_POSITION'))
  ) {
    return `Đổi thế chiến đấu ${uniqueNames}!`;
  }
  if (
    uniqueNames &&
    cardDef.effects?.some((e) => e.actions?.some((a) => a.type === 'CHANGE_TARGET_FACE_DOWN'))
  ) {
    return `Lật úp ${uniqueNames} xuống thế Thủ!`;
  }
  if (cardDef.id === 'swords_of_revealing_light') {
    return 'Phong ấn không cho đối phương tấn công 3 lượt!';
  }
  if (cardDef.subType === 'FIELD') {
    return cardDef.descriptionVi;
  }
  if (uniqueNames) {
    const suffix = report.affectedCardIds.length > 3 ? ` (+${report.affectedCardIds.length - 3} lá)` : '';
    const isBounceCard = cardDef.effects?.some((e) =>
      e.actions?.some(
        (a) => a.type === 'RETURN_TARGET_TO_HAND' || a.type === 'RETURN_ATTACKER_TO_HAND'
      )
    );
    if (isBounceCard) {
      return `Đẩy ${uniqueNames}${suffix} về tay!`;
    }
    const isDestroyCard = cardDef.effects?.some((e) =>
      e.actions?.some(
        (a) =>
          a.type === 'DESTROY_TARGET' ||
          a.type === 'DESTROY_TRIGGER_MONSTER' ||
          a.type === 'DESTROY_ATTACKING_MONSTER' ||
          a.type === 'DESTROY_OPPONENT_MONSTERS' ||
          a.type === 'DESTROY_OPPONENT_SPELLS_TRAPS' ||
          a.type === 'DESTROY_OPPONENT_ALL_CARDS' ||
          a.type === 'DESTROY_ALL_MONSTERS' ||
          a.type === 'DESTROY_OPPONENT_ATTACK_POS_MONSTERS' ||
          a.type === 'DESTROY_LOWEST_ATK_OPPONENT_MONSTER' ||
          a.type === 'DESTROY_ALL_SPELLS_TRAPS'
      )
    );
    return isDestroyCard
      ? `Tiêu diệt ${uniqueNames}${suffix}!`
      : `Tác động lên ${uniqueNames}${suffix}!`;
  }
  return 'Kích hoạt thành công!';
}

/**
 * Kích hoạt hiệu ứng ON_FLIP (VD: Man-Eater Bug, Hane-Hane) khi quái thú lật ngửa
 */
function triggerFlipEffectIfAny(
  state: DuelState,
  controllerId: PlayerId,
  flippedMonster: FieldCardInstance
): void {
  const def = getCardById(flippedMonster.cardId);
  if (!def) return;
  const flipEff = def.effects?.find((e) => e.trigger === 'ON_FLIP');
  if (!flipEff || !flipEff.actions) return;

  const oppId = getOpponentId(controllerId);
  const opp = state.players[oppId];
  const self = state.players[controllerId];

  // Nếu hiệu ứng FLIP không cần target trên sân (VD: Crystal Seer rút bài / Gravekeeper's Spy gọi quái)
  if (!flipEff.target || flipEff.target.location === 'NONE') {
    const report = createEmptyReport();
    state.logs.push(`🐞 Hiệu ứng LẬT (FLIP) của [${def.nameVi}] được kích hoạt!`);
    flipEff.actions.forEach((act) => {
      executeAtomicAction(state, controllerId, def, act, {
        sourceInstanceId: flippedMonster.instanceId,
        report,
      });
    });
    const resolvedText = summarizeReportResultVi(def, report);
    pushResolvedChain(state, {
      titleVi: `HIỆU ỨNG LẬT (FLIP): ${getShortCardTitle(def)}`,
      summaryVi: `[${getShortCardTitle(def)}] lật ngửa: ${resolvedText}`,
      links: [
        {
          chainNumber: 1,
          kind: 'MONSTER_EFFECT',
          actor: controllerId,
          cardId: def.id,
          sourceInstanceId: flippedMonster.instanceId,
          fromLocation: 'FIELD',
          triggerType: 'ON_FLIP',
          targetCardId: report.affectedCardIds[0],
          extraTargetCardIds: report.affectedCardIds,
          effectActionVi: describeEffectActionVi(def, 'ON_FLIP'),
          detailVi: `${state.players[controllerId].name} lật [${getShortCardTitle(def)}]`,
          status: 'RESOLVED',
          resultVi: resolvedText,
        },
      ],
    });
    return;
  }

  // Chọn mục tiêu tốt nhất trên sân đối phương (hoặc sân mình nếu bắt buộc mà đối phương không có quái)
  let targetId: string | undefined;
  const oppMonsters = opp.monsterZones.filter(
    (m): m is FieldCardInstance =>
      m !== null && !isProtectedFromOpponentTargeting(state, m, controllerId)
  );
  if (oppMonsters.length > 0) {
    oppMonsters.sort((a, b) => getEffectiveStats(state, b).atk - getEffectiveStats(state, a).atk);
    targetId = oppMonsters[0].instanceId;
  } else {
    const ownMonsters = self.monsterZones.filter((m): m is FieldCardInstance => m !== null);
    if (ownMonsters.length > 0) {
      targetId = ownMonsters[0].instanceId;
    }
  }

  if (targetId) {
    const targetCardId = findCardIdForInstance(state, targetId);
    const targetDef = targetCardId ? getCardById(targetCardId) : undefined;
    const report = createEmptyReport();
    state.logs.push(`🐞 Hiệu ứng LẬT (FLIP) của [${def.nameVi}] được kích hoạt!`);
    flipEff.actions.forEach((act) => {
      executeAtomicAction(state, controllerId, def, act, { targetInstanceId: targetId, report });
    });

    const resolvedText = summarizeReportResultVi(def, report);
    pushResolvedChain(state, {
      titleVi: `HIỆU ỨNG LẬT (FLIP): ${getShortCardTitle(def)}`,
      summaryVi: targetDef
        ? `[${getShortCardTitle(def)}] lật ngửa: ${resolvedText}`
        : `[${getShortCardTitle(def)}] kích hoạt hiệu ứng LẬT!`,
      links: [
        {
          chainNumber: 1,
          kind: 'MONSTER_EFFECT',
          actor: controllerId,
          cardId: def.id,
          sourceInstanceId: flippedMonster.instanceId,
          fromLocation: 'FIELD',
          triggerType: 'ON_FLIP',
          targetCardId: report.affectedCardIds[0] ?? targetCardId,
          targetInstanceId: targetId,
          extraTargetCardIds: report.affectedCardIds,
          effectActionVi: describeEffectActionVi(def, 'ON_FLIP'),
          detailVi: `${state.players[controllerId].name} lật [${getShortCardTitle(def)}]`,
          status: 'RESOLVED',
          resultVi: resolvedText,
        },
      ],
    });
  }
}

/**
 * Thực thi tính toán chiến đấu giữa 2 quái thú hoặc tấn công trực diện
 */
function resolveBattleCombat(
  state: DuelState,
  attackerPlayerId: PlayerId,
  attackerInstanceId: string,
  targetInstanceId: string | 'DIRECT'
): void {
  const atkPlayer = state.players[attackerPlayerId];
  const defPlayerId = getOpponentId(attackerPlayerId);
  const defPlayer = state.players[defPlayerId];

  const attacker = atkPlayer.monsterZones.find((m) => m?.instanceId === attackerInstanceId);
  if (!attacker || attacker.position !== 'ATTACK') return;

  const attackerDef = getCardById(attacker.cardId);
  const attackerStats = getEffectiveStats(state, attacker);

  if (targetInstanceId === 'DIRECT') {
    // Kiểm tra lại xem đối phương có thực sự trống sân quái không
    if (defPlayer.monsterZones.some((m) => m !== null)) return;
    defPlayer.lp -= attackerStats.atk;
    state.logs.push(
      `⚔️ [${attackerDef?.nameVi}] tấn công trực diện vào ${defPlayer.name}! Gây ${attackerStats.atk} sát thương!`
    );
    pushDuelEvent(state, {
      type: 'DIRECT_ATTACK',
      actor: attackerPlayerId,
      cardId: attacker.cardId,
      sourceInstanceId: attacker.instanceId,
      targetInstanceId: 'DIRECT',
      targetPlayer: defPlayerId,
      lpDelta: -attackerStats.atk,
      messageVi: `⚔️ [${attackerDef?.nameVi}] tấn công trực diện vào ${defPlayer.name} (-${attackerStats.atk} LP)!`,
    });
    checkWinnerState(state);
    return;
  }

  const defender = defPlayer.monsterZones.find((m) => m?.instanceId === targetInstanceId);
  if (!defender) return;

  const defenderDef = getCardById(defender.cardId);

  // Thiếu Nữ Mắt Xanh (Maiden with Eyes of Blue): khi đang ngửa bị tấn công -> chặn đòn & triệu hồi Rồng Trắng Mắt Xanh bảo vệ
  if (defenderDef?.id === 'maiden_with_eyes_of_blue' && defender.position !== 'SET_DEFENSE') {
    const battleEndEff = defenderDef.effects?.find((e) => e.trigger === 'ON_BATTLE_END_SURVIVE');
    if (battleEndEff?.actions) {
      defender.position = 'DEFENSE';
      const report = createEmptyReport();
      battleEndEff.actions.forEach((act) => {
        executeAtomicAction(state, defPlayerId, defenderDef, act, {
          sourceInstanceId: defender.instanceId,
          attackerInstanceId: attacker.instanceId,
          report,
        });
      });
      state.logs.push(
        `🛡️ [${defenderDef.nameVi}] đổi sang thế Thủ, chặn đứng đòn tấn công và triệu hồi Rồng Trắng Mắt Xanh bảo vệ!`
      );
      pushDuelEvent(state, {
        type: 'ATTACK',
        actor: attackerPlayerId,
        cardId: attacker.cardId,
        targetCardId: defender.cardId,
        sourceInstanceId: attacker.instanceId,
        targetInstanceId: defender.instanceId,
        messageVi: `🛡️ [${defenderDef.nameVi}] kích hoạt hiệu ứng bảo vệ!`,
      });
      pushResolvedChain(state, {
        titleVi: `HIỆU ỨNG PHÒNG VỆ: ${getShortCardTitle(defenderDef)}`,
        summaryVi: `[${getShortCardTitle(defenderDef)}] chặn đòn đánh & ${summarizeReportResultVi(defenderDef, report)}`,
        links: [
          {
            chainNumber: 1,
            kind: 'MONSTER_EFFECT',
            actor: defPlayerId,
            cardId: defenderDef.id,
            sourceInstanceId: defender.instanceId,
            fromLocation: 'FIELD',
            triggerType: 'ON_BATTLE_END_SURVIVE',
            targetCardId: report.affectedCardIds[0] ?? 'blue_eyes_white_dragon',
            extraTargetCardIds: report.affectedCardIds,
            effectActionVi: 'Chặn đòn & gọi Rồng Trắng Mắt Xanh',
            detailVi: `${defPlayer.name} kích hoạt [${getShortCardTitle(defenderDef)}]`,
            status: 'RESOLVED',
            resultVi: summarizeReportResultVi(defenderDef, report),
          },
        ],
      });
      return;
    }
  }

  let wasFlippedInBattle = false;

  if (defender.position === 'SET_DEFENSE') {
    defender.position = 'DEFENSE';
    wasFlippedInBattle = true;
    state.logs.push(`🔍 Đòn tấn công lật ngửa [${defenderDef?.nameVi}]!`);
  }

  const defenderStats = getEffectiveStats(state, defender);
  let defenderDestroyed = false;
  let attackerDestroyed = false;
  let lpDelta = 0;
  let damagedPlayer: PlayerId | undefined;

  if (defender.position === 'ATTACK') {
    if (attackerStats.atk > defenderStats.atk) {
      const diff = attackerStats.atk - defenderStats.atk;
      defPlayer.lp -= diff;
      lpDelta = -diff;
      damagedPlayer = defPlayerId;
      defenderDestroyed = true;
      state.logs.push(
        `⚔️ [${attackerDef?.nameVi}] (${attackerStats.atk}) hạ gục [${defenderDef?.nameVi}] (${defenderStats.atk})! ${defPlayer.name} mất ${diff} LP.`
      );
    } else if (attackerStats.atk === defenderStats.atk) {
      if (attackerStats.atk > 0) {
        attackerDestroyed = true;
        defenderDestroyed = true;
        state.logs.push(
          `💥 [${attackerDef?.nameVi}] và [${defenderDef?.nameVi}] đồng quy vu tận (${attackerStats.atk} ATK)!`
        );
      }
    } else {
      const diff = defenderStats.atk - attackerStats.atk;
      atkPlayer.lp -= diff;
      lpDelta = -diff;
      damagedPlayer = attackerPlayerId;
      attackerDestroyed = true;
      state.logs.push(
        `🛡️ [${attackerDef?.nameVi}] (${attackerStats.atk}) húc phải [${defenderDef?.nameVi}] (${defenderStats.atk})! ${atkPlayer.name} mất ${diff} LP.`
      );
    }
  } else {
    // Thế Thủ
    if (attackerStats.atk > defenderStats.def) {
      defenderDestroyed = true;
      state.logs.push(
        `⚔️ [${attackerDef?.nameVi}] (${attackerStats.atk} ATK) xuyên thủng phòng tuyến của [${defenderDef?.nameVi}] (${defenderStats.def} DEF)!`
      );
    } else if (attackerStats.atk === defenderStats.def) {
      state.logs.push(
        `🛡️ [${defenderDef?.nameVi}] (${defenderStats.def} DEF) đỡ gọn đòn đánh của [${attackerDef?.nameVi}]!`
      );
    } else {
      const diff = defenderStats.def - attackerStats.atk;
      atkPlayer.lp -= diff;
      lpDelta = -diff;
      damagedPlayer = attackerPlayerId;
      state.logs.push(
        `🧱 [${defenderDef?.nameVi}] (${defenderStats.def} DEF) phản chấn làm ${atkPlayer.name} mất ${diff} LP!`
      );
    }
  }

  pushDuelEvent(state, {
    type: 'ATTACK',
    actor: attackerPlayerId,
    cardId: attacker.cardId,
    targetCardId: defender.cardId,
    sourceInstanceId: attacker.instanceId,
    targetInstanceId: defender.instanceId,
    targetPlayer: damagedPlayer,
    lpDelta,
    messageVi: `⚔️ [${attackerDef?.nameVi}] (${attackerStats.atk}) tấn công [${defenderDef?.nameVi}] (${
      defender.position === 'ATTACK' ? `${defenderStats.atk} ATK` : `${defenderStats.def} DEF`
    })!`,
  });

  // Kích hoạt hiệu ứng FLIP nếu quái bị đánh lật ngửa
  if (wasFlippedInBattle) {
    triggerFlipEffectIfAny(state, defPlayerId, defender);
  }

  // Kích hoạt hiệu ứng ON_BATTLE_END_SURVIVE (VD: Wall of Illusion đẩy quái tấn công về tay)
  const battleEndEff = defenderDef?.effects?.find((e) => e.trigger === 'ON_BATTLE_END_SURVIVE');
  if (battleEndEff && battleEndEff.actions && !attackerDestroyed) {
    const report = createEmptyReport();
    battleEndEff.actions.forEach((act) => {
      executeAtomicAction(state, defPlayerId, defenderDef!, act, {
        sourceInstanceId: defender.instanceId,
        attackerInstanceId: attacker.instanceId,
        report,
      });
    });
    if (report.affectedCardIds.length > 0) {
      pushResolvedChain(state, {
        titleVi: `HIỆU ỨNG SAU GIAO TRANH: ${getShortCardTitle(defenderDef!)}`,
        summaryVi: `[${getShortCardTitle(defenderDef!)}]: ${summarizeReportResultVi(defenderDef!, report)}`,
        links: [
          {
            chainNumber: 1,
            kind: 'MONSTER_EFFECT',
            actor: defPlayerId,
            cardId: defenderDef!.id,
            sourceInstanceId: defender.instanceId,
            fromLocation: 'FIELD',
            triggerType: 'ON_BATTLE_END_SURVIVE',
            targetCardId: report.affectedCardIds[0] ?? attacker.cardId,
            targetInstanceId: attacker.instanceId,
            extraTargetCardIds: report.affectedCardIds,
            effectActionVi: describeEffectActionVi(defenderDef!),
            detailVi: `${defPlayer.name} kích hoạt [${getShortCardTitle(defenderDef!)}]`,
            status: 'RESOLVED',
            resultVi: summarizeReportResultVi(defenderDef!, report),
          },
        ],
      });
    }
  }

  if (defenderDestroyed) {
    sendFieldCardToGraveyard(state, defender.instanceId, true);
  }
  if (attackerDestroyed) {
    sendFieldCardToGraveyard(state, attacker.instanceId, true);
  }

  checkWinnerState(state);
}

function finalizeNonContinuousFieldCard(
  state: DuelState,
  cardDef: CardDefinition,
  instanceId?: string
): void {
  if (!instanceId) return;
  if (
    cardDef.subType !== 'EQUIP' &&
    cardDef.subType !== 'FIELD' &&
    cardDef.subType !== 'CONTINUOUS'
  ) {
    sendFieldCardToGraveyard(state, instanceId, false);
  }
}

/**
 * GIẢI QUYẾT CHUỖI CHAIN THEO ĐÚNG LUẬT LIFO (CL N -> ... -> CL 2 -> CL 1)
 */
function resolveActiveChainStack(
  state: DuelState,
  links: ChainLinkNode[],
  chainContext: PendingChainPrompt
): void {
  if (links.length === 0) return;

  // Trường hợp chỉ có CL1 vì đối thủ đã BỎ QUA không nối Bẫy/Handtrap:
  if (links.length === 1) {
    const cl1 = links[0];
    if (cl1.kind === 'SUMMON') {
      if (cl1.sourceInstanceId) {
        const summonedM = state.players[cl1.actor].monsterZones.find(
          (m) => m?.instanceId === cl1.sourceInstanceId
        );
        if (summonedM) {
          triggerOnSummonEffectIfAny(state, cl1.actor, summonedM);
        }
      }
      return;
    }
    if (cl1.kind === 'ATTACK' && cl1.sourceInstanceId) {
      resolveBattleCombat(
        state,
        cl1.actor,
        cl1.sourceInstanceId,
        chainContext.attackTargetInstanceId ?? 'DIRECT'
      );
      return;
    }
    if (cl1.kind === 'TRAP') {
      const def = getCardById(cl1.cardId);
      if (def) {
        const report = createEmptyReport();
        const eff = def.effects?.find((e) => e.trigger === 'ON_ACTIVATE');
        const ctx: ActionExecutionContext = {
          sourceInstanceId: cl1.sourceInstanceId,
          targetInstanceId: cl1.targetInstanceId,
          report,
        };
        eff?.actions?.forEach((act) => executeAtomicAction(state, cl1.actor, def, act, ctx));
        finalizeNonContinuousFieldCard(state, def, cl1.sourceInstanceId);

        cl1.status = 'RESOLVED';
        cl1.extraTargetCardIds = report.affectedCardIds;
        if (!cl1.targetCardId && report.affectedCardIds[0]) {
          cl1.targetCardId = report.affectedCardIds[0];
        }
        cl1.resultVi = summarizeReportResultVi(def, report);
        const tDef = cl1.targetCardId ? getCardById(cl1.targetCardId) : undefined;
        pushResolvedChain(state, {
          titleVi: `KÍCH HOẠT BẪY: ${getShortCardTitle(def)}`,
          summaryVi: tDef
            ? `[${getShortCardTitle(def)}] — ${cl1.resultVi}`
            : `[${getShortCardTitle(def)}]: ${cl1.resultVi}`,
          links: [cl1],
        });
      }
      return;
    }
  }

  // Từ 2 Chain Link trở lên -> Giải quyết ngược LIFO từ Link cao nhất xuống Link 1
  const negatedLinkNumbers = new Set<number>();
  let attackNegated = false;
  let destroyedSummonedMonster = false;
  let shouldRunAttackCombat = false;
  let shouldTriggerOnSummon = false;
  const cl1 = links[0];

  for (let i = links.length - 1; i >= 0; i--) {
    const link = links[i];
    const linkDef = getCardById(link.cardId);
    const linkShort = linkDef ? getShortCardTitle(linkDef) : link.cardId;

    if (link.chainNumber === 1) {
      if (link.kind === 'SUMMON') {
        const stillOnField = Boolean(
          link.sourceInstanceId &&
            state.players[link.actor].monsterZones.some(
              (m) => m?.instanceId === link.sourceInstanceId
            )
        );
        if (destroyedSummonedMonster || !stillOnField) {
          link.status = 'NEGATED';
          link.resultVi = `Bị Bẫy tiêu diệt ngay khi vừa triệu hồi!`;
        } else {
          link.status = 'RESOLVED';
          const anyNegatedTrap = links.some((l) => l.chainNumber > 1 && l.status === 'NEGATED');
          link.resultVi = anyNegatedTrap
            ? `Bẫy đối phương đã bị vô hiệu hóa — Quái thú được bảo vệ an toàn trên sân!`
            : `Triệu hồi thành công lên sân!`;
          shouldTriggerOnSummon = true;
        }
      } else if (link.kind === 'ATTACK') {
        const attackerOnField = Boolean(
          link.sourceInstanceId &&
            state.players[link.actor].monsterZones.some(
              (m) => m !== null && m.instanceId === link.sourceInstanceId && m.position === 'ATTACK'
            )
        );
        if (negatedLinkNumbers.has(1) || attackNegated || !attackerOnField) {
          link.status = 'NEGATED';
          link.resultVi = !attackerOnField
            ? `Quái tấn công đã rời sân — Đòn đánh chấm dứt!`
            : `Đòn tấn công đã bị vô hiệu hóa!`;
        } else {
          link.status = 'RESOLVED';
          link.resultVi = `Bẫy cản trở bị vô hiệu hóa — Đòn tấn công lao tới mục tiêu!`;
          shouldRunAttackCombat = true;
        }
      } else if (link.kind === 'TRAP') {
        if (negatedLinkNumbers.has(1)) {
          link.status = 'NEGATED';
          const negater = links.find(
            (l) => l.targetChainNumber === 1 && l.status === 'RESOLVED'
          );
          const negDef = negater ? getCardById(negater.cardId) : undefined;
          link.resultVi = negDef
            ? `Bị [${getShortCardTitle(negDef)}] vô hiệu hóa & phá hủy!`
            : `Bị vô hiệu hóa!`;
          if (link.fromLocation === 'FIELD' && link.sourceInstanceId) {
            sendFieldCardToGraveyard(state, link.sourceInstanceId, false);
          }
        } else if (linkDef) {
          const report = createEmptyReport();
          const eff = linkDef.effects?.find((e) => e.trigger === 'ON_ACTIVATE');
          const ctx: ActionExecutionContext = {
            sourceInstanceId: link.sourceInstanceId,
            targetInstanceId: link.targetInstanceId,
            report,
          };
          eff?.actions?.forEach((act) => executeAtomicAction(state, link.actor, linkDef, act, ctx));
          finalizeNonContinuousFieldCard(state, linkDef, link.sourceInstanceId);
          link.status = 'RESOLVED';
          link.extraTargetCardIds = report.affectedCardIds;
          if (!link.targetCardId && report.affectedCardIds[0]) {
            link.targetCardId = report.affectedCardIds[0];
          }
          link.resultVi = summarizeReportResultVi(linkDef, report);
        }
      }
      continue;
    }

    // Chain Link 2, 3, 4...
    if (negatedLinkNumbers.has(link.chainNumber)) {
      link.status = 'NEGATED';
      const negater = links.find(
        (l) => l.targetChainNumber === link.chainNumber && l.status === 'RESOLVED'
      );
      const negDef = negater ? getCardById(negater.cardId) : undefined;
      link.resultVi = negDef
        ? `Bị [${getShortCardTitle(negDef)}] vô hiệu hóa & phá hủy!`
        : `Bị vô hiệu hóa!`;
      if (link.fromLocation === 'FIELD' && link.sourceInstanceId) {
        sendFieldCardToGraveyard(state, link.sourceInstanceId, false);
      }
      continue;
    }

    if (link.triggerType === 'ON_OPPONENT_TRAP') {
      const targetLink =
        links.find((l) => l.chainNumber === link.targetChainNumber) ?? links[i - 1];
      if (targetLink) {
        negatedLinkNumbers.add(targetLink.chainNumber);
        if (targetLink.fromLocation === 'FIELD' && targetLink.sourceInstanceId) {
          sendFieldCardToGraveyard(state, targetLink.sourceInstanceId, false);
        }
        const targetDef = getCardById(targetLink.cardId);
        const targetShort = targetDef ? getShortCardTitle(targetDef) : 'Bài Bẫy';
        link.targetCardId = targetLink.cardId;
        link.targetInstanceId = targetLink.sourceInstanceId;
        link.resultVi = `Vô hiệu hóa & phá hủy [${targetShort}]!`;
        state.logs.push(
          `🛡️ [Chain ${link.chainNumber}] [${linkShort}] vô hiệu hóa & phá hủy [${targetShort}]!`
        );
      } else {
        link.resultVi = `Vô hiệu hóa & phá hủy Bẫy đối phương!`;
      }
      link.status = 'RESOLVED';
      if (link.fromLocation === 'FIELD' && linkDef && link.sourceInstanceId) {
        finalizeNonContinuousFieldCard(state, linkDef, link.sourceInstanceId);
      }
      continue;
    }

    // ON_OPPONENT_SUMMON hoặc ON_OPPONENT_ATTACK
    if (linkDef) {
      const eff = linkDef.effects?.find((e) => e.trigger === link.triggerType);
      const report = createEmptyReport();
      const ctx: ActionExecutionContext = {
        sourceInstanceId: link.sourceInstanceId,
        attackerInstanceId: chainContext.attackerInstanceId,
        triggerMonsterInstanceId: chainContext.summonedMonsterInstanceId,
        attackNegated: false,
        report,
      };
      eff?.actions?.forEach((act) => executeAtomicAction(state, link.actor, linkDef, act, ctx));
      if (ctx.attackNegated || report.attackNegated) {
        attackNegated = true;
      }
      if (
        chainContext.summonedMonsterInstanceId &&
        report.affectedInstanceIds.includes(chainContext.summonedMonsterInstanceId)
      ) {
        destroyedSummonedMonster = true;
      }
      link.status = 'RESOLVED';
      link.extraTargetCardIds = report.affectedCardIds;
      if (!link.targetCardId && report.affectedCardIds[0]) {
        link.targetCardId = report.affectedCardIds[0];
      }
      const lpTotal = report.lpDeltas.reduce((acc, x) => acc + x.amount, 0);
      if (lpTotal !== 0) link.lpDelta = lpTotal;
      link.resultVi = summarizeReportResultVi(linkDef, report);

      if (link.fromLocation === 'FIELD' && link.sourceInstanceId) {
        finalizeNonContinuousFieldCard(state, linkDef, link.sourceInstanceId);
      }
    }
  }

  // Tạo tóm tắt nhân quả dễ hiểu cho chuỗi Chain vừa giải quyết
  const cl1Def = getCardById(cl1.cardId);
  const cl1Name = cl1Def ? getShortCardTitle(cl1Def) : cl1.cardId;
  const highestResolved = [...links].reverse().find((l) => l.status === 'RESOLVED');
  const highestDef = highestResolved ? getCardById(highestResolved.cardId) : undefined;
  const highestName = highestDef ? getShortCardTitle(highestDef) : '';

  let summaryVi = '';
  if (links.length >= 3 && cl1.status === 'RESOLVED') {
    summaryVi = `[${highestName}] (CL${highestResolved!.chainNumber}) phá bẫy thành công — [${cl1Name}] an toàn trên sân!`;
  } else if (cl1.kind === 'SUMMON' && cl1.status === 'NEGATED' && links[1]) {
    const l2Def = getCardById(links[1].cardId);
    summaryVi = `[${cl1Name}] vừa triệu hồi đã bị [${l2Def ? getShortCardTitle(l2Def) : 'Bẫy'}] tiêu diệt!`;
  } else if (cl1.kind === 'ATTACK' && cl1.status === 'NEGATED' && links[1]) {
    const l2Def = getCardById(links[1].cardId);
    summaryVi = `[${l2Def ? getShortCardTitle(l2Def) : 'Bẫy'}] chặn đứng đòn tấn công của [${cl1Name}]!`;
  } else if (highestResolved) {
    summaryVi = `[${highestName}] (CL${highestResolved.chainNumber}): ${highestResolved.resultVi ?? 'Đã giải quyết!'}`;
  }

  const lifoOrderStr = [...links]
    .reverse()
    .map((l) => `CL${l.chainNumber}`)
    .join(' ➔ ');

  pushResolvedChain(state, {
    titleVi: `CHUỖI CHAIN (${links.length} LÁ) • GIẢI QUYẾT: ${lifoOrderStr}`,
    summaryVi,
    links,
  });

  if (shouldTriggerOnSummon && cl1.sourceInstanceId) {
    const survivedMonster = state.players[cl1.actor].monsterZones.find(
      (m) => m?.instanceId === cl1.sourceInstanceId
    );
    if (survivedMonster) {
      triggerOnSummonEffectIfAny(state, cl1.actor, survivedMonster);
    }
  }

  if (shouldRunAttackCombat && cl1.sourceInstanceId) {
    resolveBattleCombat(
      state,
      cl1.actor,
      cl1.sourceInstanceId,
      chainContext.attackTargetInstanceId ?? 'DIRECT'
    );
  }
}

/**
 * XỬ LÝ MỌI HÀNH ĐỘNG CỦA NGƯỜI CHƠI HOẶC BOT (STATE MACHINE REDUCER)
 */
export function applyGameAction(prevState: DuelState, action: GameAction): DuelState {
  const state: DuelState = JSON.parse(JSON.stringify(prevState));
  if (state.winner) return state;

  const player = state.players[action.playerId];
  const oppId = getOpponentId(action.playerId);
  const opp = state.players[oppId];

  switch (action.type) {
    case 'SURRENDER': {
      state.winner = oppId;
      state.winReasonVi = `${player.name} đã đầu hàng! ${opp.name} giành chiến thắng!`;
      state.logs.push(`🏳️ ${player.name} đầu hàng.`);
      return state;
    }

    case 'SUBMIT_SELECTION': {
      if (!state.pendingSelection || state.pendingSelection.player !== action.playerId) return state;
      const sel = state.pendingSelection;
      state.pendingSelection = null;

      if (sel.selectionType === 'DISCARD_HAND') {
        const discarded: HandCardInstance[] = [];
        for (const instId of action.selectedInstanceIds.slice(0, sel.requiredCount)) {
          const idx = player.hand.findIndex((h) => h.instanceId === instId);
          if (idx !== -1) {
            const removed = player.hand.splice(idx, 1)[0];
            player.graveyard.push(removed);
            discarded.push(removed);
            const d = getCardById(removed.cardId);
            state.logs.push(`🗑️ ${player.name} bỏ [${d?.nameVi ?? removed.cardId}] xuống Mộ.`);
          }
        }
        for (const dc of discarded) {
          triggerOnSentToGyEffectsIfAny(state, dc.owner, dc.cardId, false);
        }
      } else if (sel.selectionType === 'SEARCH_DECK') {
        const pickedDefs: CardDefinition[] = [];
        let tookFromDeck = false;
        for (const pickedId of action.selectedInstanceIds.slice(0, sel.requiredCount)) {
          let picked: HandCardInstance | undefined;
          const dIdx = player.deck.findIndex((c) => c.instanceId === pickedId);
          if (dIdx !== -1) {
            picked = player.deck.splice(dIdx, 1)[0];
            tookFromDeck = true;
          } else {
            const gIdx = player.graveyard.findIndex((c) => c.instanceId === pickedId);
            if (gIdx !== -1) {
              picked = player.graveyard.splice(gIdx, 1)[0];
            }
          }
          if (picked) {
            player.hand.push(picked);
            const d = getCardById(picked.cardId);
            if (d) pickedDefs.push(d);
            state.logs.push(`🔍 ${player.name} lấy [${d?.nameVi ?? picked.cardId}] lên tay!`);
          }
        }
        if (tookFromDeck) {
          player.deck = shuffleArray(player.deck);
        }
        if (sel.sourceCardId && pickedDefs.length > 0) {
          const srcDef = getCardById(sel.sourceCardId);
          const pickedNames = pickedDefs.map((d) => `[${getShortCardTitle(d)}]`).join(', ');
          pushResolvedChain(state, {
            titleVi: `TÌM BÀI TỪ HIỆU ỨNG: ${srcDef ? getShortCardTitle(srcDef) : sel.sourceCardNameVi}`,
            summaryVi: `[${srcDef ? getShortCardTitle(srcDef) : sel.sourceCardNameVi}] đưa ${pickedNames} lên tay ${player.name}!`,
            links: [
              {
                chainNumber: 1,
                kind: srcDef?.category === 'SPELL' ? 'SPELL' : srcDef?.category === 'TRAP' ? 'TRAP' : 'MONSTER_EFFECT',
                actor: action.playerId,
                cardId: sel.sourceCardId,
                fromLocation: 'GRAVEYARD',
                triggerType: 'ON_SENT_TO_GY',
                targetCardId: pickedDefs[0].id,
                extraTargetCardIds: pickedDefs.map((d) => d.id),
                effectActionVi: 'Tìm bài lên tay',
                detailVi: `${player.name} nhận ${pickedNames}`,
                status: 'RESOLVED',
                resultVi: `Đưa ${pickedNames} lên tay!`,
              },
            ],
          });
        }
      } else if (sel.selectionType === 'MILL_DECK') {
        const milledCards: HandCardInstance[] = [];
        for (const pickedId of action.selectedInstanceIds.slice(0, sel.requiredCount)) {
          const dIdx = player.deck.findIndex((c) => c.instanceId === pickedId);
          if (dIdx !== -1) {
            const milled = player.deck.splice(dIdx, 1)[0];
            player.graveyard.push(milled);
            milledCards.push(milled);
            const d = getCardById(milled.cardId);
            state.logs.push(`⚰️ ${player.name} gửi [${d?.nameVi ?? milled.cardId}] từ Bộ bài xuống Mộ!`);
          }
        }
        if (milledCards.length > 0) {
          player.deck = shuffleArray(player.deck);
          const milledDefs = milledCards
            .map((m) => getCardById(m.cardId))
            .filter((d): d is CardDefinition => Boolean(d));
          const namesStr = milledDefs.map((d) => `[${getShortCardTitle(d)}]`).join(', ');
          if (sel.sourceCardId && milledDefs.length > 0) {
            const srcDef = getCardById(sel.sourceCardId);
            pushResolvedChain(state, {
              titleVi: `GỬI BÀI XUỐNG MỘ: ${srcDef ? getShortCardTitle(srcDef) : sel.sourceCardNameVi}`,
              summaryVi: `[${srcDef ? getShortCardTitle(srcDef) : sel.sourceCardNameVi}] gửi ${namesStr} xuống Mộ!`,
              links: [
                {
                  chainNumber: 1,
                  kind: srcDef?.category === 'SPELL' ? 'SPELL' : srcDef?.category === 'TRAP' ? 'TRAP' : 'MONSTER_EFFECT',
                  actor: action.playerId,
                  cardId: sel.sourceCardId,
                  fromLocation: 'FIELD',
                  triggerType: 'ON_ACTIVATE',
                  targetCardId: milledDefs[0].id,
                  extraTargetCardIds: milledDefs.map((d) => d.id),
                  effectActionVi: 'Gửi bài từ Bộ bài xuống Mộ',
                  detailVi: `${player.name} gửi ${namesStr}`,
                  status: 'RESOLVED',
                  resultVi: `Gửi ${namesStr} xuống Mộ!`,
                },
              ],
            });
          }
          for (const mc of milledCards) {
            triggerOnSentToGyEffectsIfAny(state, mc.owner, mc.cardId, false);
          }
        }
      } else if (sel.selectionType === 'SPECIAL_SUMMON_CANDIDATE') {
        const summonedList: FieldCardInstance[] = [];
        let tookFromDeck = false;
        for (const pickedId of action.selectedInstanceIds.slice(0, sel.requiredCount)) {
          const freeSlot = player.monsterZones.findIndex((z) => z === null);
          if (freeSlot === -1) break;
          let picked: HandCardInstance | undefined;
          let fromLabel = 'Bộ bài';
          const gIdx = player.graveyard.findIndex((g) => g.instanceId === pickedId);
          if (gIdx !== -1) {
            picked = player.graveyard.splice(gIdx, 1)[0];
            fromLabel = 'Mộ';
          } else {
            const dIdx = player.deck.findIndex((c) => c.instanceId === pickedId);
            if (dIdx !== -1) {
              picked = player.deck.splice(dIdx, 1)[0];
              tookFromDeck = true;
            }
          }
          if (picked) {
            const summonedInst: FieldCardInstance = {
              instanceId: picked.instanceId,
              cardId: picked.cardId,
              owner: picked.owner,
              controller: action.playerId,
              position: 'ATTACK',
              summonedTurn: state.turnNumber,
              setTurn: state.turnNumber,
              changedPositionThisTurn: false,
              attacksDeclaredThisTurn: 0,
            };
            player.monsterZones[freeSlot] = summonedInst;
            summonedList.push(summonedInst);
            const d = getCardById(picked.cardId);
            state.logs.push(`🌟 ${player.name} Triệu hồi Đặc biệt [${d?.nameVi ?? picked.cardId}] từ ${fromLabel}!`);
            pushDuelEvent(state, {
              type: 'SUMMON',
              actor: action.playerId,
              cardId: picked.cardId,
              sourceInstanceId: summonedInst.instanceId,
              messageVi: `🌟 Triệu hồi Đặc biệt [${d?.nameVi ?? picked.cardId}]!`,
            });
          }
        }
        if (tookFromDeck) {
          player.deck = shuffleArray(player.deck);
        }
        if (sel.sourceCardId && summonedList.length > 0) {
          const srcDef = getCardById(sel.sourceCardId);
          const namesStr = summonedList
            .map((s) => getCardById(s.cardId))
            .filter((d): d is CardDefinition => Boolean(d))
            .map((d) => `[${getShortCardTitle(d)}]`)
            .join(', ');
          pushResolvedChain(state, {
            titleVi: `TRIỆU HỒI ĐẶC BIỆT: ${srcDef ? getShortCardTitle(srcDef) : sel.sourceCardNameVi}`,
            summaryVi: `[${srcDef ? getShortCardTitle(srcDef) : sel.sourceCardNameVi}] triệu hồi ${namesStr}!`,
            links: [
              {
                chainNumber: 1,
                kind: srcDef?.category === 'SPELL' ? 'SPELL' : srcDef?.category === 'TRAP' ? 'TRAP' : 'MONSTER_EFFECT',
                actor: action.playerId,
                cardId: sel.sourceCardId,
                fromLocation: 'FIELD',
                triggerType: 'ON_ACTIVATE',
                targetCardId: summonedList[0].cardId,
                extraTargetCardIds: summonedList.map((s) => s.cardId),
                effectActionVi: 'Triệu hồi Đặc biệt',
                detailVi: `${player.name} triệu hồi ${namesStr}`,
                status: 'RESOLVED',
                resultVi: `Triệu hồi ${namesStr}!`,
              },
            ],
          });
        }
        for (const sInst of summonedList) {
          triggerOnSummonEffectIfAny(state, action.playerId, sInst);
        }
      }

      if (!state.pendingSelection && state.pendingSelectionQueue && state.pendingSelectionQueue.length > 0) {
        state.pendingSelection = state.pendingSelectionQueue.shift() ?? null;
      }
      return state;
    }

    case 'RESPOND_CHAIN': {
      if (!state.pendingChain || state.pendingChain.responder !== action.playerId) return state;
      const chain = state.pendingChain;
      const links: ChainLinkNode[] = [...(chain.chainLinks ?? [])];
      const selectedResp = action.activateTrapInstanceId
        ? chain.availableResponses?.find((r) => r.instanceId === action.activateTrapInstanceId) ??
          (chain.availableTrapInstanceIds.includes(action.activateTrapInstanceId)
            ? {
                instanceId: action.activateTrapInstanceId,
                cardId: findCardIdForInstance(state, action.activateTrapInstanceId) ?? '',
                fromLocation: 'FIELD' as const,
              }
            : undefined)
        : undefined;

      // Nếu người chơi BỎ QUA -> đóng prompt & giải quyết LIFO ngay toàn bộ các Link đã tạo
      if (!selectedResp) {
        state.pendingChain = null;
        resolveActiveChainStack(state, links, chain);
        return state;
      }

      // Đã chọn kích hoạt thêm 1 lá (Từ SÂN hoặc HANDTRAP từ TAY!)
      let cardDef: CardDefinition | undefined;
      let eff: CardEffect | undefined;
      let lpCostPaid = 0;

      if (selectedResp.fromLocation === 'HAND') {
        const hIdx = player.hand.findIndex((h) => h.instanceId === selectedResp.instanceId);
        if (hIdx === -1) return state;
        const hCard = player.hand[hIdx];
        cardDef = getCardById(hCard.cardId);
        if (!cardDef) return state;
        eff = cardDef.effects?.find(
          (e) => e.trigger === chain.triggerType && e.activateFromHand === true
        );
        if (!eff || !canPayEffectCost(player, eff)) return state;

        lpCostPaid = getEffectiveLpCost(player, eff);
        if (lpCostPaid > 0) {
          player.lp -= lpCostPaid;
          state.logs.push(`🩸 ${player.name} trả ${lpCostPaid} LP để kích hoạt [${cardDef.nameVi}] từ trên tay!`);
        }

        // Handtrap / Bẫy từ tay rời tay xuống Mộ ngay khi kích hoạt chuỗi
        player.hand.splice(hIdx, 1);
        player.graveyard.push(hCard);
        state.logs.push(
          `🖐️ HANDTRAP [Chain ${links.length + 1}]! ${player.name} bỏ [${cardDef.nameVi}] từ trên tay để nối Chain!`
        );
      } else {
        const trapField = player.spellTrapZones.find(
          (s) => s?.instanceId === selectedResp.instanceId
        );
        if (!trapField) return state;
        cardDef = getCardById(trapField.cardId);
        if (!cardDef) return state;
        eff = cardDef.effects?.find((e) => e.trigger === chain.triggerType);
        if (!eff || !canPayEffectCost(player, eff)) return state;

        lpCostPaid = getEffectiveLpCost(player, eff);
        if (lpCostPaid > 0) {
          player.lp -= lpCostPaid;
          state.logs.push(`🩸 ${player.name} trả ${lpCostPaid} LP để kích hoạt [${cardDef.nameVi}]!`);
        }

        trapField.position = 'FACE_UP';
        state.logs.push(
          `⚡ [Chain ${links.length + 1}] ${player.name} lật [${cardDef.nameVi}] nối Chain!`
        );
      }

      const prevLink = links[links.length - 1];
      const nextChainNum = links.length + 1;
      const newLink: ChainLinkNode = {
        chainNumber: nextChainNum,
        kind: selectedResp.fromLocation === 'HAND' ? 'HANDTRAP' : 'TRAP',
        actor: action.playerId,
        cardId: cardDef.id,
        sourceInstanceId: selectedResp.instanceId,
        fromLocation: selectedResp.fromLocation,
        triggerType: chain.triggerType,
        targetChainNumber: prevLink?.chainNumber,
        targetCardId: prevLink?.cardId,
        targetInstanceId: prevLink?.sourceInstanceId,
        targetPlayer: prevLink?.actor,
        lpDelta: lpCostPaid > 0 ? -lpCostPaid : undefined,
        effectActionVi: describeEffectActionVi(cardDef, chain.triggerType),
        detailVi:
          selectedResp.fromLocation === 'HAND'
            ? `${player.name} kích hoạt Handtrap từ trên tay`
            : `${player.name} lật Bẫy trên sân`,
        status: 'PENDING',
      };
      links.push(newLink);

      pushDuelEvent(state, {
        type: 'TRAP_ACTIVATE',
        actor: action.playerId,
        cardId: cardDef.id,
        sourceInstanceId: selectedResp.instanceId,
        targetInstanceId: prevLink?.sourceInstanceId,
        isDeclarationOnly: true,
        messageVi:
          selectedResp.fromLocation === 'HAND'
            ? `🖐️ Handtrap [CL${nextChainNum}]: [${cardDef.nameVi}]!`
            : `⚡ Bẫy [CL${nextChainNum}]: [${cardDef.nameVi}]!`,
      });

      // Nếu lá vừa kích hoạt là BÀI BẪY -> kiểm tra xem đối phương có Handtrap / Bẫy Phản Đòn (ON_OPPONENT_TRAP) để nối Chain Link tiếp theo (VD: Chain 3 lá!) không!
      const nextResponderId = getOpponentId(action.playerId);
      const oppCounterResponses =
        cardDef.category === 'TRAP'
          ? getAvailableChainResponses(state, nextResponderId, 'ON_OPPONENT_TRAP', {
              existingLinks: links,
            })
          : [];

      if (oppCounterResponses.length > 0 && links.length < 6) {
        const nextPlayer = state.players[nextResponderId];
        state.pendingChain = {
          responder: nextResponderId,
          triggerType: 'ON_OPPONENT_TRAP',
          availableTrapInstanceIds: oppCounterResponses.map((r) => r.instanceId),
          availableResponses: oppCounterResponses,
          chainLinks: links,
          attackerInstanceId: chain.attackerInstanceId,
          attackTargetInstanceId: chain.attackTargetInstanceId,
          summonedMonsterInstanceId: chain.summonedMonsterInstanceId,
          activatedTrapInstanceId: selectedResp.instanceId,
          descriptionVi: `${player.name} vừa kích hoạt [${getShortCardTitle(cardDef)}] (CL${nextChainNum})! ${nextPlayer.name} có Handtrap hoặc Bẫy Phản Đòn — bạn có muốn nối Chain Link ${nextChainNum + 1} để phá Bẫy không?`,
        };
        return state;
      }

      // Không còn ai có thể nối Chain nữa -> Giải quyết ngay chuỗi Chain LIFO!
      state.pendingChain = null;
      resolveActiveChainStack(state, links, chain);
      return state;
    }

    case 'NORMAL_SUMMON': {
      if (state.currentTurnPlayer !== action.playerId) return state;
      if (state.phase !== 'MAIN1' && state.phase !== 'MAIN2') return state;
      if (player.normalSummonUsedThisTurn) return state;

      const handIdx = player.hand.findIndex((h) => h.instanceId === action.handInstanceId);
      if (handIdx === -1) return state;

      const handCard = player.hand[handIdx];
      const cardDef = getCardById(handCard.cardId);
      if (!cardDef || cardDef.category !== 'MONSTER') return state;

      const requiredTributes = getRequiredTributes(cardDef);
      const tributes = action.tributeInstanceIds ?? [];
      if (tributes.length !== requiredTributes) return state;

      // Thực hiện Hiến tế (Tribute)
      for (const tribId of tributes) {
        const m = player.monsterZones.find((z) => z?.instanceId === tribId);
        if (!m) return state;
        const d = getCardById(m.cardId);
        state.logs.push(`🔥 ${player.name} hiến tế [${d?.nameVi ?? 'Quái thú'}].`);
        sendFieldCardToGraveyard(state, tribId, true);
      }

      const freeSlot = player.monsterZones.findIndex((z) => z === null);
      if (freeSlot === -1) return state;

      player.hand.splice(handIdx, 1);
      const summonedInstance: FieldCardInstance = {
        instanceId: handCard.instanceId,
        cardId: handCard.cardId,
        owner: action.playerId,
        controller: action.playerId,
        position: action.position,
        summonedTurn: state.turnNumber,
        setTurn: state.turnNumber,
        changedPositionThisTurn: false,
        attacksDeclaredThisTurn: 0,
      };
      player.monsterZones[freeSlot] = summonedInstance;
      player.normalSummonUsedThisTurn = true;

      if (action.position === 'ATTACK') {
        const effStats = getEffectiveStats(state, summonedInstance);
        state.logs.push(
          `🌟 ${player.name} Triệu hồi [${cardDef.nameVi}] (${effStats.atk} ATK) ở thế Tấn Công!`
        );
        pushDuelEvent(state, {
          type: 'SUMMON',
          actor: action.playerId,
          cardId: cardDef.id,
          sourceInstanceId: summonedInstance.instanceId,
          messageVi: `🌟 ${player.name} triệu hồi [${cardDef.nameVi}] (${effStats.atk} ATK)!`,
        });

        // Kiểm tra xem đối phương có Bẫy / Handtrap kích hoạt khi triệu hồi không (VD: Trap Hole)
        const responses = !isProtectedFromOpponentTargeting(state, summonedInstance, oppId)
          ? getAvailableChainResponses(state, oppId, 'ON_OPPONENT_SUMMON', {
              summonedMonsterAtk: effStats.atk,
            })
          : [];

        if (responses.length > 0) {
          const cl1: ChainLinkNode = {
            chainNumber: 1,
            kind: 'SUMMON',
            actor: action.playerId,
            cardId: cardDef.id,
            sourceInstanceId: summonedInstance.instanceId,
            fromLocation: 'FIELD',
            triggerType: 'SUMMON',
            effectActionVi: `Triệu hồi (${effStats.atk} ATK)`,
            detailVi: `${player.name} triệu hồi [${getShortCardTitle(cardDef)}]`,
            status: 'PENDING',
          };
          state.pendingChain = {
            responder: oppId,
            triggerType: 'ON_OPPONENT_SUMMON',
            availableTrapInstanceIds: responses.map((r) => r.instanceId),
            availableResponses: responses,
            chainLinks: [cl1],
            summonedMonsterInstanceId: summonedInstance.instanceId,
            descriptionVi: `${player.name} vừa Triệu hồi [${cardDef.nameVi}] (${effStats.atk} ATK)! Bạn có muốn kích hoạt Bẫy phản ứng không?`,
          };
        } else {
          triggerOnSummonEffectIfAny(state, action.playerId, summonedInstance);
        }
      } else {
        state.logs.push(`🛡️ ${player.name} Úp 1 quái thú ở thế Phòng Thủ.`);
        pushDuelEvent(state, {
          type: 'SET_CARD',
          actor: action.playerId,
          sourceInstanceId: summonedInstance.instanceId,
          messageVi: `🛡️ ${player.name} Úp 1 quái thú ở thế Phòng Thủ.`,
        });
      }

      return state;
    }

    case 'SPECIAL_SUMMON_FROM_HAND': {
      if (!canSpecialSummonFromHand(state, action.playerId, action.handInstanceId)) {
        return state;
      }

      const handCard = player.hand.find((h) => h.instanceId === action.handInstanceId);
      if (!handCard) return state;
      const cardDef = getCardById(handCard.cardId);
      if (!cardDef || cardDef.category !== 'MONSTER' || !cardDef.specialSummonHand) {
        return state;
      }

      const freeSlot = player.monsterZones.findIndex((z) => z === null);
      if (freeSlot === -1) return state;

      const discardCount = cardDef.specialSummonHand.discardHandCount ?? 0;
      const discardedCards: HandCardInstance[] = [];
      if (discardCount > 0) {
        const validDiscards = Array.from(new Set(action.discardInstanceIds ?? [])).filter(
          (id) =>
            id !== action.handInstanceId &&
            player.hand.some((h) => h.instanceId === id)
        );
        if (validDiscards.length < discardCount) return state;

        for (const dId of validDiscards.slice(0, discardCount)) {
          const dIdx = player.hand.findIndex((h) => h.instanceId === dId);
          if (dIdx !== -1) {
            const removed = player.hand.splice(dIdx, 1)[0];
            player.graveyard.push(removed);
            discardedCards.push(removed);
            const rDef = getCardById(removed.cardId);
            state.logs.push(
              `🗑️ ${player.name} bỏ [${rDef?.nameVi ?? removed.cardId}] xuống Mộ để Triệu hồi Đặc biệt [${cardDef.nameVi}].`
            );
          }
        }
      }

      const handIdx = player.hand.findIndex((h) => h.instanceId === action.handInstanceId);
      if (handIdx === -1) return state;
      player.hand.splice(handIdx, 1);

      const summonedInstance: FieldCardInstance = {
        instanceId: handCard.instanceId,
        cardId: handCard.cardId,
        owner: action.playerId,
        controller: action.playerId,
        position: 'ATTACK',
        summonedTurn: state.turnNumber,
        setTurn: state.turnNumber,
        changedPositionThisTurn: false,
        attacksDeclaredThisTurn: 0,
      };
      player.monsterZones[freeSlot] = summonedInstance;

      const effStats = getEffectiveStats(state, summonedInstance);
      state.logs.push(
        `⚡ ${player.name} Triệu hồi Đặc biệt [${cardDef.nameVi}] (${effStats.atk} ATK) từ trên tay!`
      );
      pushDuelEvent(state, {
        type: 'SUMMON',
        actor: action.playerId,
        cardId: cardDef.id,
        sourceInstanceId: summonedInstance.instanceId,
        messageVi: `⚡ ${player.name} Triệu hồi Đặc biệt [${cardDef.nameVi}] (${effStats.atk} ATK)!`,
      });

      for (const dc of discardedCards) {
        triggerOnSentToGyEffectsIfAny(state, dc.owner, dc.cardId, false);
      }

      const responses = !isProtectedFromOpponentTargeting(state, summonedInstance, oppId)
        ? getAvailableChainResponses(state, oppId, 'ON_OPPONENT_SUMMON', {
            summonedMonsterAtk: effStats.atk,
          })
        : [];

      if (responses.length > 0) {
        const cl1: ChainLinkNode = {
          chainNumber: 1,
          kind: 'SUMMON',
          actor: action.playerId,
          cardId: cardDef.id,
          sourceInstanceId: summonedInstance.instanceId,
          fromLocation: 'FIELD',
          triggerType: 'SUMMON',
          effectActionVi: `Triệu hồi Đặc biệt (${effStats.atk} ATK)`,
          detailVi: `${player.name} triệu hồi ĐB [${getShortCardTitle(cardDef)}]`,
          status: 'PENDING',
        };
        state.pendingChain = {
          responder: oppId,
          triggerType: 'ON_OPPONENT_SUMMON',
          availableTrapInstanceIds: responses.map((r) => r.instanceId),
          availableResponses: responses,
          chainLinks: [cl1],
          summonedMonsterInstanceId: summonedInstance.instanceId,
          descriptionVi: `${player.name} vừa Triệu hồi Đặc biệt [${cardDef.nameVi}] (${effStats.atk} ATK)! Bạn có muốn kích hoạt Bẫy phản ứng không?`,
        };
      } else {
        triggerOnSummonEffectIfAny(state, action.playerId, summonedInstance);
      }

      return state;
    }

    case 'CHANGE_POSITION': {
      if (state.currentTurnPlayer !== action.playerId) return state;
      if (state.phase !== 'MAIN1' && state.phase !== 'MAIN2') return state;

      const m = player.monsterZones.find((z) => z?.instanceId === action.fieldInstanceId);
      if (!m) return state;
      if (m.summonedTurn === state.turnNumber || m.changedPositionThisTurn || m.attacksDeclaredThisTurn > 0) {
        return state;
      }

      const d = getCardById(m.cardId);
      const wasSet = m.position === 'SET_DEFENSE';
      m.position = m.position === 'ATTACK' ? 'DEFENSE' : 'ATTACK';
      m.changedPositionThisTurn = true;

      if (wasSet) {
        state.logs.push(`✨ ${player.name} Triệu hồi Lật (Flip Summon) [${d?.nameVi}]!`);
        pushDuelEvent(state, {
          type: 'SUMMON',
          actor: action.playerId,
          cardId: m.cardId,
          sourceInstanceId: m.instanceId,
          messageVi: `✨ ${player.name} Lật ngửa [${d?.nameVi}]!`,
        });
        triggerFlipEffectIfAny(state, action.playerId, m);

        // Kiểm tra Trap Hole khi Flip Summon
        const effStats = getEffectiveStats(state, m);
        const responses = !isProtectedFromOpponentTargeting(state, m, oppId)
          ? getAvailableChainResponses(state, oppId, 'ON_OPPONENT_SUMMON', {
              summonedMonsterAtk: effStats.atk,
            })
          : [];

        if (responses.length > 0 && d) {
          const cl1: ChainLinkNode = {
            chainNumber: 1,
            kind: 'SUMMON',
            actor: action.playerId,
            cardId: m.cardId,
            sourceInstanceId: m.instanceId,
            fromLocation: 'FIELD',
            triggerType: 'SUMMON',
            effectActionVi: `Lật ngửa (${effStats.atk} ATK)`,
            detailVi: `${player.name} Flip Summon [${getShortCardTitle(d)}]`,
            status: 'PENDING',
          };
          state.pendingChain = {
            responder: oppId,
            triggerType: 'ON_OPPONENT_SUMMON',
            availableTrapInstanceIds: responses.map((r) => r.instanceId),
            availableResponses: responses,
            chainLinks: [cl1],
            summonedMonsterInstanceId: m.instanceId,
            descriptionVi: `${player.name} vừa Lật ngửa [${d.nameVi}] (${effStats.atk} ATK)! Bạn có muốn kích hoạt Bẫy không?`,
          };
        }
      } else {
        state.logs.push(
          `🔄 ${player.name} chuyển [${d?.nameVi}] sang thế ${m.position === 'ATTACK' ? 'Tấn Công' : 'Phòng Thủ'}.`
        );
      }
      return state;
    }

    case 'SET_SPELL_TRAP': {
      if (state.currentTurnPlayer !== action.playerId) return state;
      if (state.phase !== 'MAIN1' && state.phase !== 'MAIN2') return state;

      const hIdx = player.hand.findIndex((h) => h.instanceId === action.handInstanceId);
      if (hIdx === -1) return state;
      const handCard = player.hand[hIdx];
      const def = getCardById(handCard.cardId);
      if (!def || (def.category !== 'SPELL' && def.category !== 'TRAP')) return state;

      if (def.subType === 'FIELD') {
        if (player.fieldZone) {
          sendFieldCardToGraveyard(state, player.fieldZone.instanceId, false);
        }
        player.hand.splice(hIdx, 1);
        player.fieldZone = {
          instanceId: handCard.instanceId,
          cardId: handCard.cardId,
          owner: action.playerId,
          controller: action.playerId,
          position: 'SET',
          summonedTurn: state.turnNumber,
          setTurn: state.turnNumber,
          changedPositionThisTurn: false,
          attacksDeclaredThisTurn: 0,
        };
        state.logs.push(`🂠 ${player.name} Úp 1 lá bài Môi Trường.`);
        pushDuelEvent(state, {
          type: 'SET_CARD',
          actor: action.playerId,
          sourceInstanceId: handCard.instanceId,
          messageVi: `🂠 ${player.name} Úp 1 lá bài Môi Trường.`,
        });
        return state;
      }

      const freeST = player.spellTrapZones.findIndex((z) => z === null);
      if (freeST === -1) return state;

      player.hand.splice(hIdx, 1);
      player.spellTrapZones[freeST] = {
        instanceId: handCard.instanceId,
        cardId: handCard.cardId,
        owner: action.playerId,
        controller: action.playerId,
        position: 'SET',
        summonedTurn: state.turnNumber,
        setTurn: state.turnNumber,
        changedPositionThisTurn: false,
        attacksDeclaredThisTurn: 0,
      };
      state.logs.push(`🂠 ${player.name} Úp 1 lá bài vào ô Phép/Bẫy.`);
      pushDuelEvent(state, {
        type: 'SET_CARD',
        actor: action.playerId,
        sourceInstanceId: handCard.instanceId,
        messageVi: `🂠 ${player.name} Úp 1 lá Phép/Bẫy xuống sân.`,
      });
      return state;
    }

    case 'ACTIVATE_SPELL_OR_TRAP': {
      let fieldCard: FieldCardInstance | undefined;
      let cardDef: CardDefinition | undefined;

      if (action.fromLocation === 'HAND') {
        const hIdx = player.hand.findIndex((h) => h.instanceId === action.instanceId);
        if (hIdx === -1) return state;
        const hCard = player.hand[hIdx];
        cardDef = getCardById(hCard.cardId);
        if (
          !cardDef ||
          !canActivateSpellOrTrapNow(state, action.playerId, cardDef.id, 'HAND', undefined, hCard.instanceId)
        ) {
          return state;
        }

        player.hand.splice(hIdx, 1);
        if (cardDef.subType === 'FIELD') {
          if (player.fieldZone) {
            sendFieldCardToGraveyard(state, player.fieldZone.instanceId, false);
          }
          fieldCard = {
            instanceId: hCard.instanceId,
            cardId: hCard.cardId,
            owner: action.playerId,
            controller: action.playerId,
            position: 'FACE_UP',
            summonedTurn: state.turnNumber,
            setTurn: state.turnNumber,
            changedPositionThisTurn: false,
            attacksDeclaredThisTurn: 0,
          };
          player.fieldZone = fieldCard;
        } else {
          const freeST = player.spellTrapZones.findIndex((z) => z === null);
          if (freeST === -1) return state;
          fieldCard = {
            instanceId: hCard.instanceId,
            cardId: hCard.cardId,
            owner: action.playerId,
            controller: action.playerId,
            position: 'FACE_UP',
            summonedTurn: state.turnNumber,
            setTurn: state.turnNumber,
            changedPositionThisTurn: false,
            attacksDeclaredThisTurn: 0,
          };
          player.spellTrapZones[freeST] = fieldCard;
        }
      } else {
        fieldCard =
          player.spellTrapZones.find((s) => s?.instanceId === action.instanceId) ??
          (player.fieldZone?.instanceId === action.instanceId ? player.fieldZone : undefined);
        if (!fieldCard) return state;
        cardDef = getCardById(fieldCard.cardId);
        if (!cardDef || !canActivateSpellOrTrapNow(state, action.playerId, cardDef.id, 'FIELD', fieldCard)) {
          return state;
        }
        fieldCard.position = 'FACE_UP';
      }

      const activateEff = cardDef.effects?.find((e) => e.trigger === 'ON_ACTIVATE');
      const lpCostPaid = getEffectiveLpCost(player, activateEff);
      if (lpCostPaid > 0) {
        player.lp = Math.max(0, player.lp - lpCostPaid);
        state.logs.push(`💔 ${player.name} trả ${lpCostPaid} LP để kích hoạt [${cardDef.nameVi}].`);
      }

      const preTargetCardId = findCardIdForInstance(state, action.targetInstanceId);
      state.logs.push(`✨ ${player.name} kích hoạt [${cardDef.nameVi}]!`);
      pushDuelEvent(state, {
        type: cardDef.category === 'TRAP' ? 'TRAP_ACTIVATE' : 'SPELL_ACTIVATE',
        actor: action.playerId,
        cardId: cardDef.id,
        sourceInstanceId: fieldCard.instanceId,
        targetCardId: preTargetCardId,
        targetInstanceId: action.targetInstanceId,
        ...(lpCostPaid > 0 ? { targetPlayer: action.playerId, lpDelta: -lpCostPaid } : {}),
        messageVi: `✨ ${player.name} kích hoạt [${cardDef.nameVi}]!`,
      });

      // Nếu là BÀI BẪY kích hoạt trên sân (VD: Call of the Haunted) -> kiểm tra đối phương có Handtrap / Bẫy Phản Đòn không!
      if (cardDef.category === 'TRAP') {
        const cl1: ChainLinkNode = {
          chainNumber: 1,
          kind: 'TRAP',
          actor: action.playerId,
          cardId: cardDef.id,
          sourceInstanceId: fieldCard.instanceId,
          fromLocation: 'FIELD',
          triggerType: 'ON_ACTIVATE',
          targetCardId: preTargetCardId,
          targetInstanceId: action.targetInstanceId,
          effectActionVi: describeEffectActionVi(cardDef, 'ON_ACTIVATE'),
          detailVi: `${player.name} kích hoạt [${getShortCardTitle(cardDef)}]`,
          status: 'PENDING',
        };
        const oppTrapResponses = getAvailableChainResponses(state, oppId, 'ON_OPPONENT_TRAP', {
          existingLinks: [cl1],
        });
        if (oppTrapResponses.length > 0) {
          state.pendingChain = {
            responder: oppId,
            triggerType: 'ON_OPPONENT_TRAP',
            availableTrapInstanceIds: oppTrapResponses.map((r) => r.instanceId),
            availableResponses: oppTrapResponses,
            chainLinks: [cl1],
            activatedTrapInstanceId: fieldCard.instanceId,
            descriptionVi: `${player.name} kích hoạt Bẫy [${cardDef.nameVi}]! Bạn có muốn dùng Handtrap / Bẫy Phản Đòn để phá Bẫy không?`,
          };
          return state;
        }
      }

      const report = createEmptyReport();
      if (activateEff?.actions) {
        const ctx: ActionExecutionContext = {
          sourceInstanceId: fieldCard.instanceId,
          targetInstanceId: action.targetInstanceId,
          fusionExtraInstanceId: action.fusionExtraInstanceId,
          report,
        };
        for (const act of activateEff.actions) {
          executeAtomicAction(state, action.playerId, cardDef, act, ctx);
        }
      }

      finalizeNonContinuousFieldCard(state, cardDef, fieldCard.instanceId);

      // Ghi lại Chain Showcase cho mọi Phép / Bẫy vừa kích hoạt để hiện rõ lá này tác động lên lá nào
      const resolvedTargetCardId =
        report.affectedCardIds[0] ??
        preTargetCardId ??
        undefined;
      const resultVi = summarizeReportResultVi(cardDef, report);
      const targetDef = resolvedTargetCardId ? getCardById(resolvedTargetCardId) : undefined;
      const lpTotal =
        report.lpDeltas.length > 0
          ? report.lpDeltas.reduce((acc, x) => acc + x.amount, 0)
          : lpCostPaid > 0
          ? -lpCostPaid
          : 0;
      const targetPlayer =
        report.lpDeltas[0]?.playerId ?? (lpCostPaid > 0 ? action.playerId : undefined);

      pushResolvedChain(state, {
        titleVi:
          cardDef.category === 'TRAP'
            ? `KÍCH HOẠT BẪY: ${getShortCardTitle(cardDef)}`
            : `KÍCH HOẠT BÀI PHÉP: ${getShortCardTitle(cardDef)}`,
        summaryVi: targetDef
          ? `[${getShortCardTitle(cardDef)}] — ${resultVi}`
          : `[${getShortCardTitle(cardDef)}]: ${resultVi}`,
        links: [
          {
            chainNumber: 1,
            kind: cardDef.category === 'TRAP' ? 'TRAP' : 'SPELL',
            actor: action.playerId,
            cardId: cardDef.id,
            sourceInstanceId: fieldCard.instanceId,
            fromLocation: action.fromLocation,
            triggerType: 'ON_ACTIVATE',
            targetCardId: resolvedTargetCardId,
            targetInstanceId: action.targetInstanceId,
            targetPlayer,
            extraTargetCardIds: report.affectedCardIds,
            lpDelta: lpTotal !== 0 ? lpTotal : undefined,
            effectActionVi: describeEffectActionVi(cardDef, 'ON_ACTIVATE'),
            detailVi: `${player.name} kích hoạt [${getShortCardTitle(cardDef)}]`,
            status: 'RESOLVED',
            resultVi,
          },
        ],
      });

      return state;
    }

    case 'DECLARE_ATTACK': {
      if (state.currentTurnPlayer !== action.playerId) return state;
      if (state.phase !== 'BATTLE') return state;
      if (state.turnNumber === 1) return state;
      if (player.attackLockedTurns > 0) return state;

      const attacker = player.monsterZones.find((m) => m?.instanceId === action.attackerInstanceId);
      if (!attacker || attacker.position !== 'ATTACK' || attacker.attacksDeclaredThisTurn >= 1) {
        return state;
      }

      const oppHasMonsters = opp.monsterZones.some((m) => m !== null);
      if (action.targetInstanceId === 'DIRECT' && oppHasMonsters) return state;

      attacker.attacksDeclaredThisTurn += 1;
      const attackerDef = getCardById(attacker.cardId);
      const attackerStats = getEffectiveStats(state, attacker);

      // Kiểm tra xem đối phương có Bẫy úp HOẶC Handtrap (Kuriboh) kích hoạt khi bị tấn công không
      const attackResponses = getAvailableChainResponses(state, oppId, 'ON_OPPONENT_ATTACK');

      if (attackResponses.length > 0) {
        const targetM =
          action.targetInstanceId === 'DIRECT'
            ? undefined
            : opp.monsterZones.find((m) => m?.instanceId === action.targetInstanceId);
        state.logs.push(
          `⚔️ ${player.name} cho [${attackerDef?.nameVi}] (${attackerStats.atk} ATK) tuyên bố tấn công!`
        );
        pushDuelEvent(state, {
          type: action.targetInstanceId === 'DIRECT' ? 'DIRECT_ATTACK' : 'ATTACK',
          actor: action.playerId,
          cardId: attacker.cardId,
          targetCardId: targetM?.cardId,
          sourceInstanceId: attacker.instanceId,
          targetInstanceId: action.targetInstanceId,
          targetPlayer: oppId,
          isDeclarationOnly: true,
          messageVi: `⚔️ [${attackerDef?.nameVi}] (${attackerStats.atk} ATK) đang lao tới tấn công!`,
        });
        const cl1: ChainLinkNode = {
          chainNumber: 1,
          kind: 'ATTACK',
          actor: action.playerId,
          cardId: attacker.cardId,
          sourceInstanceId: attacker.instanceId,
          fromLocation: 'FIELD',
          triggerType: 'ATTACK',
          targetCardId:
            targetM && targetM.position !== 'SET_DEFENSE' ? targetM.cardId : undefined,
          targetInstanceId: action.targetInstanceId,
          targetPlayer: oppId,
          effectActionVi:
            action.targetInstanceId === 'DIRECT'
              ? `Tấn công trực diện (${attackerStats.atk} ATK)`
              : `Tấn công (${attackerStats.atk} ATK)`,
          detailVi: `${player.name} cho [${attackerDef ? getShortCardTitle(attackerDef) : ''}] tấn công`,
          status: 'PENDING',
        };
        state.pendingChain = {
          responder: oppId,
          triggerType: 'ON_OPPONENT_ATTACK',
          availableTrapInstanceIds: attackResponses.map((r) => r.instanceId),
          availableResponses: attackResponses,
          chainLinks: [cl1],
          attackerInstanceId: attacker.instanceId,
          attackTargetInstanceId: action.targetInstanceId,
          descriptionVi: `[${attackerDef?.nameVi}] (${attackerStats.atk} ATK) đang lao tới tấn công! Bạn có muốn kích hoạt Bẫy hoặc Handtrap phản đòn không?`,
        };
        return state;
      }

      resolveBattleCombat(state, action.playerId, action.attackerInstanceId, action.targetInstanceId);
      return state;
    }

    case 'CHANGE_PHASE': {
      if (state.currentTurnPlayer !== action.playerId) return state;
      if (state.pendingChain || state.pendingSelection) return state;

      if (action.nextPhase === 'BATTLE' && state.turnNumber === 1) {
        return state;
      }

      if (action.nextPhase === 'END') {
        // Dọn dẹp cuối lượt: Trả lại quái mượn bằng Change of Heart
        const stolenMonsters = player.monsterZones.filter(
          (m): m is FieldCardInstance => m !== null && Boolean(m.returnControlAtEndPhase)
        );
        for (const stolen of stolenMonsters) {
          const idx = player.monsterZones.findIndex((z) => z?.instanceId === stolen.instanceId);
          if (idx !== -1) player.monsterZones[idx] = null;
          stolen.returnControlAtEndPhase = false;
          stolen.controller = stolen.owner;
          const ownerSlot = state.players[stolen.owner].monsterZones.findIndex((z) => z === null);
          if (ownerSlot !== -1) {
            state.players[stolen.owner].monsterZones[ownerSlot] = stolen;
          } else {
            sendFieldCardToGraveyard(state, stolen.instanceId, false);
          }
        }

        // Giảm đếm lượt của Kiếm Ánh Sáng Phong Ấn (Swords of Revealing Light)
        if (player.attackLockedTurns > 0) {
          player.attackLockedTurns -= 1;
          opp.spellTrapZones.forEach((st) => {
            if (st && st.remainingTurnsOnField !== undefined) {
              st.remainingTurnsOnField -= 1;
              if (st.remainingTurnsOnField <= 0) {
                sendFieldCardToGraveyard(state, st.instanceId, false);
                state.logs.push(`⏳ Hết 3 lượt, [Kiếm Ánh Sáng Phong Ấn] tự động biến mất!`);
              }
            }
          });
        }

        // Chuyển sang lượt của người chơi tiếp theo + Tự động Rút bài (Draw Phase -> Main Phase 1)
        state.turnNumber += 1;
        state.currentTurnPlayer = oppId;
        state.phase = 'MAIN1';

        opp.normalSummonUsedThisTurn = false;
        opp.monsterZones.forEach((m) => {
          if (m) {
            m.changedPositionThisTurn = false;
            m.attacksDeclaredThisTurn = 0;
          }
        });

        drawCardsForPlayer(state, oppId, 1);
        if (!state.winner) {
          state.logs.push(`🔄 Lượt ${state.turnNumber}: Tới lượt của ${opp.name} (Đã rút 1 lá bài).`);
        }
        return state;
      }

      state.phase = action.nextPhase;
      const phaseNames: Record<DuelPhase, string> = {
        DRAW: 'Draw Phase',
        STANDBY: 'Standby Phase',
        MAIN1: 'Main Phase 1',
        BATTLE: 'Battle Phase (Chiến Đấu)',
        MAIN2: 'Main Phase 2',
        END: 'End Phase',
      };
      state.logs.push(`⏩ ${player.name} chuyển sang ${phaseNames[action.nextPhase]}.`);
      return state;
    }

    default:
      return state;
  }
}

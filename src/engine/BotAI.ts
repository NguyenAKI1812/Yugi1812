import {
  canActivateSpellOrTrapNow,
  canSpecialSummonFromHand,
  getAvailableFusionSummons,
  getEffectiveStats,
  getOpponentId,
  getRequiredTributes,
  getValidTargetInstances,
} from './DuelEngine';
import { getCardById } from '../data/cards.catalog';
import { DuelState, FieldCardInstance, GameAction, HandCardInstance, PlayerId } from '../types/game';

const GY_BENEFIT_CARD_IDS = new Set([
  'white_stone_of_ancients',
  'white_stone_of_legend',
  'maiden_of_white',
  'magicians_robe',
  'blue_eyes_white_dragon',
  'dark_magician',
]);

const HIGH_VALUE_SEARCH_IDS = new Set([
  'blue_eyes_white_dragon',
  'blue_eyes_alternative_white_dragon',
  'blue_eyes_jet_dragon',
  'blue_eyes_abyss_dragon',
  'sage_with_eyes_of_blue',
  'dark_magician',
  'dark_magician_girl',
  'magicians_souls',
  'apprentice_illusion_magician',
  'magicians_rod',
  'eternal_soul',
  'dark_magical_circle',
  'ultimate_fusion',
  'the_eye_of_timaeus',
  'secrets_of_dark_magic',
  'polymerization',
]);

function scoreDiscardCandidateAsc(cardId: string): number {
  if (
    cardId === 'white_stone_of_ancients' ||
    cardId === 'white_stone_of_legend' ||
    cardId === 'maiden_of_white' ||
    cardId === 'magicians_robe'
  ) {
    return -2000;
  }
  const d = getCardById(cardId);
  if (!d) return 0;
  if (d.id === 'blue_eyes_white_dragon' || d.id === 'dark_magician') return 400;
  if (d.category === 'MONSTER') return 600 + (d.atk ?? 0) * 0.2;
  if (d.category === 'TRAP') return 900;
  return 1100;
}

function scoreMillCandidateDesc(cardId: string): number {
  if (cardId === 'white_stone_of_ancients') return 10000;
  if (cardId === 'white_stone_of_legend') return 9500;
  if (cardId === 'maiden_of_white') return 9000;
  if (cardId === 'magicians_robe') return 8500;
  if (cardId === 'blue_eyes_white_dragon' || cardId === 'dark_magician') return 7500;
  const d = getCardById(cardId);
  return (d?.atk ?? 0) + (GY_BENEFIT_CARD_IDS.has(cardId) ? 2000 : 0);
}

function scoreSearchOrSummonDesc(cardId: string): number {
  const d = getCardById(cardId);
  if (!d) return 0;
  let score = d.category === 'MONSTER' ? d.atk ?? 1000 : 2200;
  if (HIGH_VALUE_SEARCH_IDS.has(cardId)) score += 1600;
  return score;
}

/**
 * TRÍ TUỆ NHÂN TẠO HƯỚNG DỮ LIỆU (DATA-DRIVEN BOT AI)
 * Tự động đọc `effects` và chỉ số của bất kỳ lá bài nào (kể cả bài mới thêm) để ra quyết định.
 */
export function computeNextBotAction(state: DuelState, botId: PlayerId): GameAction | null {
  if (state.winner) return null;

  const oppId = getOpponentId(botId);

  // 1. Nếu đang được hỏi kích hoạt Bẫy / Handtrap (Chain Prompt)
  if (state.pendingChain && state.pendingChain.responder === botId) {
    const responses = state.pendingChain.availableResponses ?? [];
    const trigger = state.pendingChain.triggerType;

    // Khi có cơ hội nối Chain phá Bẫy đối thủ (CL3 Handtrap / Counter Trap) -> ưu tiên kích hoạt để bảo vệ bài!
    if (trigger === 'ON_OPPONENT_TRAP') {
      const preferred =
        responses.find((r) => r.fromLocation === 'HAND' && !(r.lpCost && r.lpCost > 2000)) ??
        responses.find((r) => r.fromLocation === 'FIELD') ??
        responses.find((r) => r.fromLocation === 'HAND') ??
        responses[0];
      return {
        type: 'RESPOND_CHAIN',
        playerId: botId,
        activateTrapInstanceId:
          preferred?.instanceId ?? state.pendingChain.availableTrapInstanceIds[0] ?? null,
      };
    }

    // Khi đối phương tấn công -> ưu tiên Bẫy phản công / tiêu diệt trước, chỉ dùng Kuriboh / Negate Attack khi thực sự nguy hiểm
    if (trigger === 'ON_OPPONENT_ATTACK') {
      const offensiveTrap = responses.find(
        (r) =>
          r.fromLocation === 'FIELD' &&
          (r.cardId === 'mirror_force' ||
            r.cardId === 'magic_cylinder' ||
            r.cardId === 'sakuretsu_armor')
      );
      if (offensiveTrap) {
        return {
          type: 'RESPOND_CHAIN',
          playerId: botId,
          activateTrapInstanceId: offensiveTrap.instanceId,
        };
      }

      const attackerId = state.pendingChain.attackerInstanceId;
      const targetId = state.pendingChain.attackTargetInstanceId;
      const oppPlayer = state.players[oppId];
      const botPlayer = state.players[botId];
      const attacker = oppPlayer.monsterZones.find((m) => m?.instanceId === attackerId);
      const attackerAtk = attacker ? getEffectiveStats(state, attacker).atk : 0;

      let threatensBot = targetId === 'DIRECT';
      if (!threatensBot && targetId && targetId !== 'DIRECT') {
        const defM = botPlayer.monsterZones.find((m) => m?.instanceId === targetId);
        if (defM) {
          const defStats = getEffectiveStats(state, defM);
          if (defM.position === 'SET_DEFENSE') {
            threatensBot = true;
          } else if (defM.position === 'ATTACK') {
            threatensBot = attackerAtk >= defStats.atk;
          } else {
            threatensBot = attackerAtk > defStats.def;
          }
        }
      }

      if (threatensBot) {
        const defensiveResp = responses.find((r) => r.fromLocation === 'HAND') ?? responses[0];
        return {
          type: 'RESPOND_CHAIN',
          playerId: botId,
          activateTrapInstanceId:
            defensiveResp?.instanceId ?? state.pendingChain.availableTrapInstanceIds[0] ?? null,
        };
      }

      return {
        type: 'RESPOND_CHAIN',
        playerId: botId,
        activateTrapInstanceId: null,
      };
    }

    // Khi có cơ hội kích hoạt Bẫy khi đối thủ triệu hồi (Trap Hole / Bottomless / Torrential / Solemn Judgment)
    if (trigger === 'ON_OPPONENT_SUMMON') {
      const noHeavyCost = responses.find((r) => !(r.lpCost && r.lpCost > 2000));
      let chosen = noHeavyCost;
      if (!chosen && responses.length > 0) {
        const opp = state.players[oppId];
        const summonedM = opp.monsterZones.find(
          (m) => m?.instanceId === state.pendingChain?.summonedMonsterInstanceId
        );
        const summonedAtk = summonedM ? getEffectiveStats(state, summonedM).atk : 0;
        const botBestAtk = Math.max(
          0,
          ...state.players[botId].monsterZones
            .filter((m): m is FieldCardInstance => m !== null)
            .map((m) => getEffectiveStats(state, m).atk)
        );
        if (summonedAtk >= 1800 || summonedAtk > botBestAtk) {
          chosen = responses[0];
        }
      }
      return {
        type: 'RESPOND_CHAIN',
        playerId: botId,
        activateTrapInstanceId: chosen?.instanceId ?? null,
      };
    }

    const trapToUse =
      responses[0]?.instanceId ?? state.pendingChain.availableTrapInstanceIds[0] ?? null;
    return {
      type: 'RESPOND_CHAIN',
      playerId: botId,
      activateTrapInstanceId: trapToUse,
    };
  }

  // 2. Nếu đang được yêu cầu chọn bài (Discard / Search Deck / Mill / Special Summon)
  if (state.pendingSelection && state.pendingSelection.player === botId) {
    const sel = state.pendingSelection;
    const bot = state.players[botId];
    const findCandCard = (instId: string): HandCardInstance | undefined =>
      bot.hand.find((h) => h.instanceId === instId) ??
      bot.deck.find((d) => d.instanceId === instId) ??
      bot.graveyard.find((g) => g.instanceId === instId);

    const sortedCandidates = [...sel.candidateInstanceIds].sort((a, b) => {
      const ca = findCandCard(a);
      const cb = findCandCard(b);
      if (!ca || !cb) return 0;
      if (sel.selectionType === 'DISCARD_HAND') {
        return scoreDiscardCandidateAsc(ca.cardId) - scoreDiscardCandidateAsc(cb.cardId);
      }
      if (sel.selectionType === 'MILL_DECK') {
        return scoreMillCandidateDesc(cb.cardId) - scoreMillCandidateDesc(ca.cardId);
      }
      return scoreSearchOrSummonDesc(cb.cardId) - scoreSearchOrSummonDesc(ca.cardId);
    });

    const chosen = sortedCandidates.slice(0, sel.requiredCount);
    return {
      type: 'SUBMIT_SELECTION',
      playerId: botId,
      selectedInstanceIds: chosen,
    };
  }

  // Chỉ hành động khi tới lượt của Bot và không bị chặn bởi Chain hoặc Selection
  if (state.currentTurnPlayer !== botId || state.pendingChain || state.pendingSelection) {
    return null;
  }

  const bot = state.players[botId];
  const opp = state.players[oppId];

  // ==========================================
  // XỬ LÝ TRONG MAIN PHASE 1 & MAIN PHASE 2
  // ==========================================
  if (state.phase === 'MAIN1' || state.phase === 'MAIN2') {
    // A. Kiểm tra lật quái (Flip Summon) nếu đang có quái úp có hiệu ứng FLIP
    for (const m of bot.monsterZones) {
      if (
        m &&
        m.position === 'SET_DEFENSE' &&
        m.summonedTurn < state.turnNumber &&
        !m.changedPositionThisTurn
      ) {
        const d = getCardById(m.cardId);
        const hasFlip = d?.effects?.some((e) => e.trigger === 'ON_FLIP');
        if (hasFlip && opp.monsterZones.some((om) => om !== null)) {
          return {
            type: 'CHANGE_POSITION',
            playerId: botId,
            fieldInstanceId: m.instanceId,
          };
        }
      }
    }

    // B. Kích hoạt bài Phép trên tay (nếu có lợi)
    for (const h of bot.hand) {
      const def = getCardById(h.cardId);
      if (!def || def.category !== 'SPELL') continue;
      if (!canActivateSpellOrTrapNow(state, botId, def.id, 'HAND', undefined, h.instanceId)) continue;

      const eff = def.effects?.find((e) => e.trigger === 'ON_ACTIVATE');
      if (!eff) continue;

      // Không dùng Dark Hole nếu bên mình đang có quái mạnh hơn đối thủ
      if (eff.actions?.some((a) => a.type === 'DESTROY_ALL_MONSTERS')) {
        const oppCount = opp.monsterZones.filter((m) => m !== null).length;
        const botCount = bot.monsterZones.filter((m) => m !== null).length;
        if (oppCount === 0 || botCount > oppCount) continue;
      }

      // Không dùng Raigeki nếu đối phương không có quái
      if (eff.actions?.some((a) => a.type === 'DESTROY_OPPONENT_MONSTERS')) {
        if (opp.monsterZones.every((m) => m === null)) continue;
      }

      // Không dùng Heavy Storm / Feather Duster nếu đối phương không có Phép/Bẫy
      if (
        eff.actions?.some(
          (a) => a.type === 'DESTROY_ALL_SPELLS_TRAPS' || a.type === 'DESTROY_OPPONENT_SPELLS_TRAPS'
        )
      ) {
        const oppST = opp.spellTrapZones.filter((s) => s !== null).length + (opp.fieldZone ? 1 : 0);
        if (oppST === 0) continue;
      }

      // Nếu là bài Dung Hợp (Polymerization / Ultimate Fusion / Nhãn Thần Timaeus / Secrets of Dark Magic)
      const fusionAct = eff.actions?.find((a) => a.type === 'FUSION_SUMMON');
      if (fusionAct) {
        if (fusionAct.useTargetAsOnlyFusionMaterial) {
          const validTargets = getValidTargetInstances(state, botId, def, h.instanceId);
          for (const vt of validTargets) {
            const fusions = getAvailableFusionSummons(state, botId, {
              onlyMaterialInstanceId: vt.instanceId,
            }).sort((a, b) => (b.def.atk ?? 0) - (a.def.atk ?? 0));
            if (fusions.length > 0) {
              return {
                type: 'ACTIVATE_SPELL_OR_TRAP',
                playerId: botId,
                instanceId: h.instanceId,
                fromLocation: 'HAND',
                targetInstanceId: vt.instanceId,
                fusionExtraInstanceId: fusions[0].extraCard.instanceId,
              };
            }
          }
          continue;
        }

        const fusions = getAvailableFusionSummons(state, botId, {
          allowGy: Boolean(fusionAct.allowGyFusionMaterials),
        }).sort((a, b) => (b.def.atk ?? 0) - (a.def.atk ?? 0));
        if (fusions.length > 0) {
          return {
            type: 'ACTIVATE_SPELL_OR_TRAP',
            playerId: botId,
            instanceId: h.instanceId,
            fromLocation: 'HAND',
            fusionExtraInstanceId: fusions[0].extraCard.instanceId,
          };
        }
        continue;
      }

      // Nếu cần chọn mục tiêu (target)
      if (eff.target && eff.target.location !== 'NONE') {
        const targets = getValidTargetInstances(state, botId, def, h.instanceId);
        if (targets.length === 0) continue;

        const hasDiscardCost = eff.actions?.some((a) => a.type === 'DISCARD_TARGET_HAND_CARD');
        const hasTributeCost = eff.actions?.some((a) => a.type === 'TRIBUTE_TARGET_MONSTER');
        const isBanishGy = eff.actions?.some((a) => a.type === 'BANISH_FROM_GY');
        const isBeneficial = eff.actions?.some(
          (a) => a.type === 'EQUIP_TO_TARGET' || a.type === 'REVIVE_TARGET_FROM_GY'
        );

        let pickedTarget = targets[0];

        if (hasDiscardCost) {
          targets.sort((a, b) => scoreDiscardCandidateAsc(a.cardId) - scoreDiscardCandidateAsc(b.cardId));
          pickedTarget = targets[0];
        } else if (hasTributeCost) {
          targets.sort(
            (a, b) => (getCardById(a.cardId)?.atk ?? 0) - (getCardById(b.cardId)?.atk ?? 0)
          );
          const candidate = targets[0];
          const cAtk = getCardById(candidate.cardId)?.atk ?? 0;
          const allowsDM = eff.target.allowedCardIds?.includes('dark_magician');
          if (!allowsDM && cAtk > 2100) continue;
          pickedTarget = candidate;
        } else if (isBanishGy) {
          const oppGyTargets = targets.filter((t) => t.labelVi.includes('Mộ Đối Phương'));
          if (oppGyTargets.length === 0) continue;
          oppGyTargets.sort(
            (a, b) => (getCardById(b.cardId)?.atk ?? 0) - (getCardById(a.cardId)?.atk ?? 0)
          );
          pickedTarget = oppGyTargets[0];
        } else if (isBeneficial) {
          const ownTargets = targets.filter((t) => t.labelVi.includes('Sân Bạn'));
          if (ownTargets.length > 0) {
            ownTargets.sort(
              (a, b) => (getCardById(b.cardId)?.atk ?? 0) - (getCardById(a.cardId)?.atk ?? 0)
            );
            pickedTarget = ownTargets[0];
          } else if (eff.target.location.includes('GRAVEYARD')) {
            targets.sort((a, b) => {
              const da = getCardById(a.cardId)?.atk ?? 0;
              const db = getCardById(b.cardId)?.atk ?? 0;
              return db - da;
            });
            pickedTarget = targets[0];
          } else {
            continue;
          }
        } else {
          const oppTargets = targets.filter((t) => t.labelVi.includes('Đối Phương'));
          if (oppTargets.length === 0) continue;
          pickedTarget = oppTargets[0];
        }

        return {
          type: 'ACTIVATE_SPELL_OR_TRAP',
          playerId: botId,
          instanceId: h.instanceId,
          fromLocation: 'HAND',
          targetInstanceId: pickedTarget.instanceId,
        };
      }

      return {
        type: 'ACTIVATE_SPELL_OR_TRAP',
        playerId: botId,
        instanceId: h.instanceId,
        fromLocation: 'HAND',
      };
    }

    // C. Kích hoạt Bẫy / Phép Nhanh trên sân chủ động trong Main Phase
    // (VD: Call of the Haunted, Eternal Soul, True Light, Magician Navigation, Book of Moon, Dust Tornado)
    for (const st of bot.spellTrapZones) {
      if (!st || st.position !== 'SET') continue;
      const def = getCardById(st.cardId);
      if (!def || !canActivateSpellOrTrapNow(state, botId, def.id, 'FIELD', st)) continue;
      const eff = def.effects?.find((e) => e.trigger === 'ON_ACTIVATE');
      if (!eff) continue;

      if (eff.target && eff.target.location !== 'NONE') {
        const targets = getValidTargetInstances(state, botId, def, st.instanceId);
        if (targets.length === 0) continue;

        const isBanishGy = eff.actions?.some((a) => a.type === 'BANISH_FROM_GY');
        const isBeneficial = eff.actions?.some(
          (a) => a.type === 'EQUIP_TO_TARGET' || a.type === 'REVIVE_TARGET_FROM_GY'
        );

        if (isBanishGy) {
          const oppGyTargets = targets.filter((t) => t.labelVi.includes('Mộ Đối Phương'));
          if (oppGyTargets.length === 0) continue;
          oppGyTargets.sort(
            (a, b) => (getCardById(b.cardId)?.atk ?? 0) - (getCardById(a.cardId)?.atk ?? 0)
          );
          return {
            type: 'ACTIVATE_SPELL_OR_TRAP',
            playerId: botId,
            instanceId: st.instanceId,
            fromLocation: 'FIELD',
            targetInstanceId: oppGyTargets[0].instanceId,
          };
        }

        if (isBeneficial) {
          targets.sort((a, b) => (getCardById(b.cardId)?.atk ?? 0) - (getCardById(a.cardId)?.atk ?? 0));
          return {
            type: 'ACTIVATE_SPELL_OR_TRAP',
            playerId: botId,
            instanceId: st.instanceId,
            fromLocation: 'FIELD',
            targetInstanceId: targets[0].instanceId,
          };
        }

        const oppTargets = targets.filter((t) => t.labelVi.includes('Đối Phương'));
        if (oppTargets.length === 0) continue;
        return {
          type: 'ACTIVATE_SPELL_OR_TRAP',
          playerId: botId,
          instanceId: st.instanceId,
          fromLocation: 'FIELD',
          targetInstanceId: oppTargets[0].instanceId,
        };
      }

      // Bẫy không có target như Eternal Soul, True Light, Magician Navigation
      const hasProactiveEffect = eff.actions?.some(
        (a) =>
          a.type === 'SPECIAL_SUMMON_FROM_DECK_OR_GY' ||
          a.type === 'SPECIAL_SUMMON_HAND_MONSTERS' ||
          a.type === 'SEARCH_DECK_TO_HAND' ||
          a.type === 'DRAW_CARDS'
      );
      if (hasProactiveEffect) {
        const needsMonsterSlot = eff.actions?.some(
          (a) =>
            a.type === 'SPECIAL_SUMMON_FROM_DECK_OR_GY' ||
            a.type === 'SPECIAL_SUMMON_HAND_MONSTERS'
        );
        if (needsMonsterSlot && bot.monsterZones.every((z) => z !== null)) continue;
        return {
          type: 'ACTIVATE_SPELL_OR_TRAP',
          playerId: botId,
          instanceId: st.instanceId,
          fromLocation: 'FIELD',
        };
      }
    }

    // C2. Triệu hồi Đặc biệt từ trên tay (Blue-Eyes Alternative, Jet Dragon, Magician's Souls, Apprentice, Mahad, Timaeus...)
    const specialHandCandidates = bot.hand
      .map((h) => ({ inst: h, def: getCardById(h.cardId) }))
      .filter(
        (x): x is { inst: HandCardInstance; def: NonNullable<ReturnType<typeof getCardById>> } =>
          Boolean(x.def && x.def.category === 'MONSTER' && canSpecialSummonFromHand(state, botId, x.inst.instanceId))
      )
      .sort((a, b) => (b.def.atk ?? 0) - (a.def.atk ?? 0));

    if (specialHandCandidates.length > 0) {
      const picked = specialHandCandidates[0];
      const discardCount = picked.def.specialSummonHand?.discardHandCount ?? 0;
      let discardIds: string[] | undefined;
      if (discardCount > 0) {
        discardIds = bot.hand
          .filter((c) => c.instanceId !== picked.inst.instanceId)
          .sort((a, b) => scoreDiscardCandidateAsc(a.cardId) - scoreDiscardCandidateAsc(b.cardId))
          .slice(0, discardCount)
          .map((c) => c.instanceId);
      }
      return {
        type: 'SPECIAL_SUMMON_FROM_HAND',
        playerId: botId,
        handInstanceId: picked.inst.instanceId,
        ...(discardIds ? { discardInstanceIds: discardIds } : {}),
      };
    }

    const isHandtrapCard = (def?: ReturnType<typeof getCardById>) =>
      Boolean(def?.effects?.some((e) => e.activateFromHand));

    // D. Triệu hồi Quái thú (Normal Summon / Tribute Summon / Set)
    if (!bot.normalSummonUsedThisTurn) {
      const ownMonsters = bot.monsterZones.filter((m): m is FieldCardInstance => m !== null);
      const handMonsters = bot.hand
        .map((h) => ({ inst: h, def: getCardById(h.cardId)! }))
        .filter((x) => x.def && x.def.category === 'MONSTER');

      // 1. Kiểm tra xem có thể Triệu hồi Hiến tế (Level 5+) không
      const tributeCandidates = handMonsters
        .filter((x) => {
          const req = getRequiredTributes(x.def);
          return req > 0 && ownMonsters.length >= req;
        })
        .sort((a, b) => (b.def.atk ?? 0) - (a.def.atk ?? 0));

      if (tributeCandidates.length > 0) {
        const bestHigh = tributeCandidates[0];
        const req = getRequiredTributes(bestHigh.def);
        const sortedOwn = [...ownMonsters].sort(
          (a, b) => getEffectiveStats(state, a).atk - getEffectiveStats(state, b).atk
        );
        const toTribute = sortedOwn.slice(0, req);
        const maxTributeAtk = Math.max(...toTribute.map((m) => getEffectiveStats(state, m).atk));

        // Chỉ hiến tế nếu quái mới mạnh hơn quái đem hiến tế
        if ((bestHigh.def.atk ?? 0) > maxTributeAtk) {
          return {
            type: 'NORMAL_SUMMON',
            playerId: botId,
            handInstanceId: bestHigh.inst.instanceId,
            position: 'ATTACK',
            tributeInstanceIds: toTribute.map((m) => m.instanceId),
          };
        }
      }

      // 2. Triệu hồi quái Cấp 1-4 nếu còn ô trống (giữ lại Handtrap trên tay để cản Bẫy/đòn đánh)
      if (bot.monsterZones.some((z) => z === null)) {
        const lowMonsters = handMonsters
          .filter((x) => getRequiredTributes(x.def) === 0 && !isHandtrapCard(x.def))
          .sort((a, b) => (b.def.atk ?? 0) - (a.def.atk ?? 0));

        if (lowMonsters.length > 0) {
          const oppStrongestAtk = Math.max(
            0,
            ...opp.monsterZones
              .filter((m): m is FieldCardInstance => m !== null && m.position === 'ATTACK')
              .map((m) => getEffectiveStats(state, m).atk)
          );

          // Ưu tiên Triệu hồi ngửa quái có hiệu ứng ON_SUMMON (Sage, Magician's Rod, Kaibaman, Breaker...) khi an toàn
          const onSummonMonster = lowMonsters.find((x) =>
            x.def.effects?.some((e) => e.trigger === 'ON_SUMMON')
          );
          if (
            onSummonMonster &&
            (oppStrongestAtk === 0 || (onSummonMonster.def.atk ?? 0) >= oppStrongestAtk)
          ) {
            return {
              type: 'NORMAL_SUMMON',
              playerId: botId,
              handInstanceId: onSummonMonster.inst.instanceId,
              position: 'ATTACK',
            };
          }

          const bestAtkM = lowMonsters[0];
          if ((bestAtkM.def.atk ?? 0) >= oppStrongestAtk && (bestAtkM.def.atk ?? 0) >= 1300) {
            return {
              type: 'NORMAL_SUMMON',
              playerId: botId,
              handInstanceId: bestAtkM.inst.instanceId,
              position: 'ATTACK',
            };
          } else {
            // Úp quái có hiệu ứng FLIP hoặc ON_SENT_TO_GY (Bạch Ngọc) hoặc DEF cao nhất
            const byDef = [...lowMonsters].sort((a, b) => {
              const aFlip = a.def.effects?.some((e) => e.trigger === 'ON_FLIP') ? 1000 : 0;
              const bFlip = b.def.effects?.some((e) => e.trigger === 'ON_FLIP') ? 1000 : 0;
              const aGy = a.def.effects?.some((e) => e.trigger === 'ON_SENT_TO_GY') ? 600 : 0;
              const bGy = b.def.effects?.some((e) => e.trigger === 'ON_SENT_TO_GY') ? 600 : 0;
              return (b.def.def ?? 0) + bFlip + bGy - ((a.def.def ?? 0) + aFlip + aGy);
            });
            return {
              type: 'NORMAL_SUMMON',
              playerId: botId,
              handInstanceId: byDef[0].inst.instanceId,
              position: 'SET_DEFENSE',
            };
          }
        }
      }
    }

    // E. Úp các lá bài Bẫy (hoặc Phép Nhanh) xuống sân — giữ Handtrap (VD: Red Reboot) trên tay để phản đòn tức thì
    if (bot.spellTrapZones.some((z) => z === null)) {
      const trapInHand = bot.hand.find((h) => {
        const d = getCardById(h.cardId);
        if (!d || isHandtrapCard(d)) return false;
        return d.category === 'TRAP' || (d.category === 'SPELL' && d.subType === 'QUICK_PLAY');
      });
      if (trapInHand) {
        return {
          type: 'SET_SPELL_TRAP',
          playerId: botId,
          handInstanceId: trapInHand.instanceId,
        };
      }
    }

    // F. Chuyển sang Battle Phase (nếu được phép tấn công) hoặc Kết thúc lượt
    if (
      state.phase === 'MAIN1' &&
      state.turnNumber > 1 &&
      bot.attackLockedTurns === 0 &&
      bot.monsterZones.some((m) => m !== null && m.position === 'ATTACK')
    ) {
      return {
        type: 'CHANGE_PHASE',
        playerId: botId,
        nextPhase: 'BATTLE',
      };
    }

    return {
      type: 'CHANGE_PHASE',
      playerId: botId,
      nextPhase: 'END',
    };
  }

  // ==========================================
  // XỬ LÝ TRONG BATTLE PHASE
  // ==========================================
  if (state.phase === 'BATTLE') {
    const attackers = bot.monsterZones
      .filter(
        (m): m is FieldCardInstance =>
          m !== null && m.position === 'ATTACK' && m.attacksDeclaredThisTurn === 0
      )
      .sort((a, b) => getEffectiveStats(state, a).atk - getEffectiveStats(state, b).atk);

    const oppMonsters = opp.monsterZones.filter((m): m is FieldCardInstance => m !== null);

    for (const atkM of attackers) {
      const myAtk = getEffectiveStats(state, atkM).atk;

      // Nếu sân địch trống -> Tấn công trực diện!
      if (oppMonsters.length === 0) {
        return {
          type: 'DECLARE_ATTACK',
          playerId: botId,
          attackerInstanceId: atkM.instanceId,
          targetInstanceId: 'DIRECT',
        };
      }

      // Tìm quái địch ngửa mà mình đánh thắng được
      const beatableFaceUp = oppMonsters
        .filter((om) => {
          if (om.position === 'SET_DEFENSE') return false;
          const omStats = getEffectiveStats(state, om);
          return om.position === 'ATTACK' ? myAtk > omStats.atk : myAtk > omStats.def;
        })
        .sort((a, b) => getEffectiveStats(state, b).atk - getEffectiveStats(state, a).atk);

      if (beatableFaceUp.length > 0) {
        return {
          type: 'DECLARE_ATTACK',
          playerId: botId,
          attackerInstanceId: atkM.instanceId,
          targetInstanceId: beatableFaceUp[0].instanceId,
        };
      }

      // Nếu địch có quái đang Úp và quái mình >= 1300 ATK -> Tấn công thăm dò
      const setOpp = oppMonsters.find((om) => om.position === 'SET_DEFENSE');
      if (setOpp && myAtk >= 1300) {
        return {
          type: 'DECLARE_ATTACK',
          playerId: botId,
          attackerInstanceId: atkM.instanceId,
          targetInstanceId: setOpp.instanceId,
        };
      }
    }

    // Đã đánh xong mọi đòn có lợi -> Sang Main Phase 2 hoặc End Phase
    return {
      type: 'CHANGE_PHASE',
      playerId: botId,
      nextPhase: 'END',
    };
  }

  return {
    type: 'CHANGE_PHASE',
    playerId: botId,
    nextPhase: 'END',
  };
}

import {
  getAllCards,
  getCardByExactName,
  getCardById,
  getCardByPasscode,
  normalizePasscode,
} from '../data/cards.catalog';
import {
  ArchetypeTag,
  Attribute,
  CardCategory,
  CardDefinition,
  CardEffect,
  MonsterRace,
} from '../types/game';

export type EffectTemplateKey =
  | 'NONE'
  | 'FLIP_DESTROY_MONSTER'
  | 'FLIP_RETURN_TO_HAND'
  | 'SENT_GY_SEARCH_1500'
  | 'ON_BATTLE_RETURN_ATTACKER'
  | 'HANDTRAP_NEGATE_TRAP'
  | 'HANDTRAP_NEGATE_ATTACK'
  | 'HANDTRAP_END_BATTLE'
  | 'SPELL_DRAW'
  | 'SPELL_DESTROY_SINGLE_MONSTER'
  | 'SPELL_DESTROY_LOWEST_ATK'
  | 'SPELL_DESTROY_OPPONENT_MONSTERS'
  | 'SPELL_DESTROY_ALL_MONSTERS'
  | 'SPELL_DESTROY_SPELL_TRAP'
  | 'SPELL_DESTROY_ALL_ST'
  | 'SPELL_RETURN_MONSTER_HAND'
  | 'SPELL_EQUIP_BOOST'
  | 'SPELL_REVIVE_GY'
  | 'SPELL_TAKE_CONTROL'
  | 'SPELL_CHANGE_POSITION'
  | 'SPELL_LOCK_ATTACKS'
  | 'SPELL_HEAL_LP'
  | 'SPELL_DAMAGE_LP'
  | 'TRAP_ATTACK_DESTROY_ATTACKER'
  | 'TRAP_ATTACK_DESTROY_ALL_ATK_POS'
  | 'TRAP_ATTACK_REFLECT_DAMAGE'
  | 'TRAP_END_BATTLE_PHASE'
  | 'TRAP_SUMMON_DESTROY'
  | 'TRAP_SUMMON_DESTROY_ALL'
  | 'TRAP_ACTIVATE_DESTROY_ST'
  | 'TRAP_ACTIVATE_RETURN_MONSTER'
  | 'TRAP_REVIVE_CONTINUOUS'
  | 'TRAP_NEGATE_TRAP'
  | 'TRAP_SOLEMN_NEGATE'
  | 'TRAP_HANDTRAP_NEGATE_TRAP';

export interface EffectTemplateMeta {
  key: EffectTemplateKey;
  category: CardCategory;
  labelVi: string;
  paramLabelVi?: string;
  defaultParam?: number;
}

export const EFFECT_TEMPLATE_OPTIONS: EffectTemplateMeta[] = [
  // MONSTER
  {
    key: 'NONE',
    category: 'MONSTER',
    labelVi: 'Quái Thường (Không hiệu ứng - tự tính Hiến tế theo Sao)',
  },
  {
    key: 'FLIP_DESTROY_MONSTER',
    category: 'MONSTER',
    labelVi: 'FLIP (Lật): Tiêu diệt 1 quái thú trên sân',
  },
  {
    key: 'FLIP_RETURN_TO_HAND',
    category: 'MONSTER',
    labelVi: 'FLIP (Lật): Đẩy 1 quái thú trên sân về tay chủ nhân',
  },
  {
    key: 'SENT_GY_SEARCH_1500',
    category: 'MONSTER',
    labelVi: 'Vào Mộ: Tìm 1 quái từ Bộ bài lên tay (ATK ≤ ngưỡng)',
    paramLabelVi: 'ATK tối đa',
    defaultParam: 1500,
  },
  {
    key: 'ON_BATTLE_RETURN_ATTACKER',
    category: 'MONSTER',
    labelVi: 'Giao chiến: Đẩy quái vừa tấn công về tay (kiểu Wall of Illusion)',
  },
  {
    key: 'HANDTRAP_NEGATE_TRAP',
    category: 'MONSTER',
    labelVi: 'Handtrap: Bỏ từ tay để Vô hiệu & Phá hủy Bẫy đối phương',
  },
  {
    key: 'HANDTRAP_NEGATE_ATTACK',
    category: 'MONSTER',
    labelVi: 'Handtrap: Bỏ từ tay để Chặn 1 đòn tấn công (kiểu Kuriboh)',
  },
  {
    key: 'HANDTRAP_END_BATTLE',
    category: 'MONSTER',
    labelVi: 'Handtrap: Bỏ từ tay để Chặn đòn & Hết Battle Phase (kiểu Swift Scarecrow)',
  },

  // SPELL
  {
    key: 'SPELL_DRAW',
    category: 'SPELL',
    labelVi: 'Phép Rút Bài (Rút N lá lên tay)',
    paramLabelVi: 'Số lá rút',
    defaultParam: 2,
  },
  {
    key: 'SPELL_DESTROY_SINGLE_MONSTER',
    category: 'SPELL',
    labelVi: 'Phép Chọn Diệt 1 Quái Đối Phương',
  },
  {
    key: 'SPELL_DESTROY_LOWEST_ATK',
    category: 'SPELL',
    labelVi: 'Phép Diệt Quái ATK Thấp Nhất Đối Phương (kiểu Fissure)',
  },
  {
    key: 'SPELL_DESTROY_OPPONENT_MONSTERS',
    category: 'SPELL',
    labelVi: 'Phép Quét Sạch Toàn Bộ Quái Đối Phương (kiểu Raigeki)',
  },
  {
    key: 'SPELL_DESTROY_ALL_MONSTERS',
    category: 'SPELL',
    labelVi: 'Phép Hố Đen: Tiêu Diệt Toàn Bộ Quái 2 Bên (kiểu Dark Hole)',
  },
  {
    key: 'SPELL_DESTROY_SPELL_TRAP',
    category: 'SPELL',
    labelVi: 'Phép Phá 1 Bài Phép / Bẫy Trên Sân (kiểu Cuồng Phong / MST)',
  },
  {
    key: 'SPELL_DESTROY_ALL_ST',
    category: 'SPELL',
    labelVi: 'Phép Bão Lớn: Phá Toàn Bộ Phép / Bẫy 2 Bên (kiểu Heavy Storm)',
  },
  {
    key: 'SPELL_RETURN_MONSTER_HAND',
    category: 'SPELL',
    labelVi: 'Phép Đẩy 1 Quái Trên Sân Về Tay',
  },
  {
    key: 'SPELL_EQUIP_BOOST',
    category: 'SPELL',
    labelVi: 'Phép Trang Bị (+ATK cho 1 quái ngửa)',
    paramLabelVi: '+ATK',
    defaultParam: 700,
  },
  {
    key: 'SPELL_REVIVE_GY',
    category: 'SPELL',
    labelVi: 'Phép Hồi Sinh Quái Từ Mộ Lên Sân',
  },
  {
    key: 'SPELL_TAKE_CONTROL',
    category: 'SPELL',
    labelVi: 'Phép Chiếm Quyền Điều Khiển Quái Địch 1 Lượt',
    paramLabelVi: 'LP trả phí (0 = miễn phí)',
    defaultParam: 0,
  },
  {
    key: 'SPELL_CHANGE_POSITION',
    category: 'SPELL',
    labelVi: 'Phép Đổi Thế Chiến Đấu 1 Quái Địch Sang Công',
  },
  {
    key: 'SPELL_LOCK_ATTACKS',
    category: 'SPELL',
    labelVi: 'Phép Phong Ấn Tấn Công N Lượt & Lật Quái Địch',
    paramLabelVi: 'Số lượt khóa',
    defaultParam: 3,
  },
  {
    key: 'SPELL_HEAL_LP',
    category: 'SPELL',
    labelVi: 'Phép Hồi Điểm Gốc (+LP)',
    paramLabelVi: 'Lượng +LP',
    defaultParam: 1000,
  },
  {
    key: 'SPELL_DAMAGE_LP',
    category: 'SPELL',
    labelVi: 'Phép Đốt Điểm Gốc Đối Phương (-LP)',
    paramLabelVi: 'Sát thương LP',
    defaultParam: 800,
  },

  // TRAP
  {
    key: 'TRAP_ATTACK_DESTROY_ATTACKER',
    category: 'TRAP',
    labelVi: 'Bẫy Khi Bị Đánh: Chặn đòn & Diệt quái tấn công (kiểu Sakuretsu)',
  },
  {
    key: 'TRAP_ATTACK_DESTROY_ALL_ATK_POS',
    category: 'TRAP',
    labelVi: 'Bẫy Khi Bị Đánh: Chặn đòn & Diệt hết quái thế Công (kiểu Mirror Force)',
  },
  {
    key: 'TRAP_ATTACK_REFLECT_DAMAGE',
    category: 'TRAP',
    labelVi: 'Bẫy Khi Bị Đánh: Chặn đòn & Phản sát thương bằng ATK (kiểu Magic Cylinder)',
  },
  {
    key: 'TRAP_END_BATTLE_PHASE',
    category: 'TRAP',
    labelVi: 'Bẫy Khi Bị Đánh: Chặn đòn & Kết thúc luôn Battle Phase',
  },
  {
    key: 'TRAP_SUMMON_DESTROY',
    category: 'TRAP',
    labelVi: 'Bẫy Khi Đối Thủ Triệu Hồi: Diệt quái có ATK ≥ ngưỡng',
    paramLabelVi: 'ATK tối thiểu',
    defaultParam: 1000,
  },
  {
    key: 'TRAP_SUMMON_DESTROY_ALL',
    category: 'TRAP',
    labelVi: 'Bẫy Khi Đối Thủ Triệu Hồi: Quét sạch toàn bộ quái (kiểu Torrential Tribute)',
  },
  {
    key: 'TRAP_ACTIVATE_DESTROY_ST',
    category: 'TRAP',
    labelVi: 'Bẫy Chủ Động: Chọn Phá 1 Bài Phép / Bẫy Trên Sân (kiểu Dust Tornado)',
  },
  {
    key: 'TRAP_ACTIVATE_RETURN_MONSTER',
    category: 'TRAP',
    labelVi: 'Bẫy Chủ Động: Đẩy 1 Quái Trên Sân Về Tay (kiểu Compulsory)',
  },
  {
    key: 'TRAP_REVIVE_CONTINUOUS',
    category: 'TRAP',
    labelVi: 'Bẫy Vĩnh Cửu: Hồi Sinh 1 Quái Từ Mộ Của Bạn (kiểu Call of the Haunted)',
  },
  {
    key: 'TRAP_NEGATE_TRAP',
    category: 'TRAP',
    labelVi: 'Bẫy Phản Đòn (Counter): Trả LP Vô hiệu & Phá Bẫy địch',
    paramLabelVi: 'LP trả phí',
    defaultParam: 1000,
  },
  {
    key: 'TRAP_SOLEMN_NEGATE',
    category: 'TRAP',
    labelVi: 'Bẫy Phản Đòn Tối Thượng (½ LP): Phá Triệu hồi HOẶC Phá Bẫy địch',
  },
  {
    key: 'TRAP_HANDTRAP_NEGATE_TRAP',
    category: 'TRAP',
    labelVi: 'Bẫy Counter Cầm Tay (½ LP): Phá Bẫy địch ngay từ tay (kiểu Red Reboot)',
  },
];

export function buildEffectsFromTemplate(
  category: CardCategory,
  template: EffectTemplateKey,
  param: number
): { subType: CardDefinition['subType']; effects?: CardEffect[] } {
  let subType: CardDefinition['subType'] = 'NORMAL';
  let effects: CardEffect[] | undefined;

  if (category === 'MONSTER') {
    subType = template === 'NONE' ? 'NORMAL' : 'EFFECT';
  } else if (category === 'SPELL') {
    if (template === 'SPELL_EQUIP_BOOST') subType = 'EQUIP';
    else if (template === 'SPELL_DESTROY_SPELL_TRAP') subType = 'QUICK_PLAY';
    else subType = 'NORMAL';
  } else {
    if (
      template === 'TRAP_NEGATE_TRAP' ||
      template === 'TRAP_SOLEMN_NEGATE' ||
      template === 'TRAP_HANDTRAP_NEGATE_TRAP'
    ) {
      subType = 'COUNTER';
    } else if (template === 'TRAP_REVIVE_CONTINUOUS') {
      subType = 'CONTINUOUS';
    } else {
      subType = 'NORMAL';
    }
  }

  switch (template) {
    case 'FLIP_DESTROY_MONSTER':
      effects = [
        {
          trigger: 'ON_FLIP',
          target: {
            location: 'FIELD_MONSTER',
            promptVi: 'Chọn 1 quái thú trên sân để tiêu diệt:',
          },
          actions: [{ type: 'DESTROY_TARGET' }],
        },
      ];
      break;

    case 'FLIP_RETURN_TO_HAND':
      effects = [
        {
          trigger: 'ON_FLIP',
          target: {
            location: 'FIELD_MONSTER',
            promptVi: 'Chọn 1 quái thú trên sân để đẩy về tay:',
          },
          actions: [{ type: 'RETURN_TARGET_TO_HAND' }],
        },
      ];
      break;

    case 'SENT_GY_SEARCH_1500':
      effects = [
        {
          trigger: 'ON_SENT_TO_GY',
          actions: [{ type: 'SEARCH_DECK_MONSTER_TO_HAND', maxAtkFilter: Math.max(0, param || 1500) }],
        },
      ];
      break;

    case 'ON_BATTLE_RETURN_ATTACKER':
      effects = [
        {
          trigger: 'ON_BATTLE_END_SURVIVE',
          actions: [{ type: 'RETURN_ATTACKER_TO_HAND' }],
        },
      ];
      break;

    case 'HANDTRAP_NEGATE_TRAP':
      effects = [
        {
          trigger: 'ON_OPPONENT_TRAP',
          activateFromHand: true,
          actions: [{ type: 'NEGATE_AND_DESTROY_TRAP' }],
        },
      ];
      break;

    case 'HANDTRAP_NEGATE_ATTACK':
      effects = [
        {
          trigger: 'ON_OPPONENT_ATTACK',
          activateFromHand: true,
          actions: [{ type: 'NEGATE_ATTACK' }],
        },
      ];
      break;

    case 'HANDTRAP_END_BATTLE':
      effects = [
        {
          trigger: 'ON_OPPONENT_ATTACK',
          activateFromHand: true,
          actions: [{ type: 'END_BATTLE_PHASE' }],
        },
      ];
      break;

    case 'SPELL_DRAW':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          actions: [{ type: 'DRAW_CARDS', value: Math.max(1, Math.min(5, param || 2)) }],
        },
      ];
      break;

    case 'SPELL_DESTROY_SINGLE_MONSTER':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireOpponentFaceUpMonster: true },
          target: {
            location: 'OPPONENT_MONSTER',
            promptVi: 'Chọn 1 quái thú của đối phương để tiêu diệt:',
          },
          actions: [{ type: 'DESTROY_TARGET' }],
        },
      ];
      break;

    case 'SPELL_DESTROY_LOWEST_ATK':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireOpponentFaceUpMonster: true },
          actions: [{ type: 'DESTROY_LOWEST_ATK_OPPONENT_MONSTER' }],
        },
      ];
      break;

    case 'SPELL_DESTROY_OPPONENT_MONSTERS':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          actions: [{ type: 'DESTROY_OPPONENT_MONSTERS' }],
        },
      ];
      break;

    case 'SPELL_DESTROY_ALL_MONSTERS':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireAnyMonsterOnField: true },
          actions: [{ type: 'DESTROY_ALL_MONSTERS' }],
        },
      ];
      break;

    case 'SPELL_DESTROY_SPELL_TRAP':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireSpellTrapOnField: true },
          target: {
            location: 'FIELD_SPELL_TRAP',
            promptVi: 'Chọn 1 lá Bài Phép hoặc Bài Bẫy trên sân để phá hủy:',
          },
          actions: [{ type: 'DESTROY_TARGET' }],
        },
      ];
      break;

    case 'SPELL_DESTROY_ALL_ST':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireSpellTrapOnField: true },
          actions: [{ type: 'DESTROY_ALL_SPELLS_TRAPS' }],
        },
      ];
      break;

    case 'SPELL_RETURN_MONSTER_HAND':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireAnyMonsterOnField: true },
          target: {
            location: 'FIELD_MONSTER',
            promptVi: 'Chọn 1 quái thú trên sân để đẩy về tay:',
          },
          actions: [{ type: 'RETURN_TARGET_TO_HAND' }],
        },
      ];
      break;

    case 'SPELL_EQUIP_BOOST': {
      const boost = param || 700;
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          target: {
            location: 'FIELD_MONSTER',
            faceUpOnly: true,
            promptVi: `Chọn 1 quái thú ngửa để tăng +${boost} ATK:`,
          },
          actions: [{ type: 'EQUIP_TO_TARGET' }],
        },
        {
          trigger: 'CONTINUOUS_EQUIP',
          continuous: { atkDelta: boost, defDelta: 0 },
        },
      ];
      break;
    }

    case 'SPELL_REVIVE_GY':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireMonsterInAnyGY: true },
          target: {
            location: 'EITHER_GRAVEYARD_MONSTER',
            promptVi: 'Chọn 1 quái thú dưới Mộ để Hồi Sinh:',
          },
          actions: [{ type: 'REVIVE_TARGET_FROM_GY' }],
        },
      ];
      break;

    case 'SPELL_TAKE_CONTROL':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: {
            requireOpponentFaceUpMonster: true,
            ...(param > 0 ? { lpCost: param } : {}),
          },
          target: {
            location: 'OPPONENT_MONSTER',
            promptVi: 'Chọn 1 quái thú đối phương để chiếm quyền điều khiển hết lượt này:',
          },
          actions: [{ type: 'TAKE_CONTROL_UNTIL_END_PHASE' }],
        },
      ];
      break;

    case 'SPELL_CHANGE_POSITION':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          target: {
            location: 'OPPONENT_MONSTER',
            promptVi: 'Chọn 1 quái thú đối phương để chuyển sang thế Tấn Công:',
          },
          actions: [{ type: 'CHANGE_TARGET_POSITION' }],
        },
      ];
      break;

    case 'SPELL_LOCK_ATTACKS':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          actions: [
            { type: 'FLIP_ALL_OPPONENT_MONSTERS_FACE_UP' },
            { type: 'LOCK_OPPONENT_ATTACKS_TURNS', value: Math.max(1, param || 3) },
          ],
        },
      ];
      break;

    case 'SPELL_HEAL_LP':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          actions: [{ type: 'HEAL_LP', value: Math.max(100, param || 1000), targetSide: 'SELF' }],
        },
      ];
      break;

    case 'SPELL_DAMAGE_LP':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          actions: [{ type: 'DAMAGE_LP', value: Math.max(100, param || 800), targetSide: 'OPPONENT' }],
        },
      ];
      break;

    case 'TRAP_ATTACK_DESTROY_ATTACKER':
      effects = [
        {
          trigger: 'ON_OPPONENT_ATTACK',
          actions: [{ type: 'NEGATE_ATTACK' }, { type: 'DESTROY_ATTACKING_MONSTER' }],
        },
      ];
      break;

    case 'TRAP_ATTACK_DESTROY_ALL_ATK_POS':
      effects = [
        {
          trigger: 'ON_OPPONENT_ATTACK',
          actions: [{ type: 'NEGATE_ATTACK' }, { type: 'DESTROY_OPPONENT_ATTACK_POS_MONSTERS' }],
        },
      ];
      break;

    case 'TRAP_ATTACK_REFLECT_DAMAGE':
      effects = [
        {
          trigger: 'ON_OPPONENT_ATTACK',
          actions: [{ type: 'NEGATE_ATTACK' }, { type: 'DAMAGE_LP_BY_ATTACKER_ATK' }],
        },
      ];
      break;

    case 'TRAP_END_BATTLE_PHASE':
      effects = [
        {
          trigger: 'ON_OPPONENT_ATTACK',
          actions: [{ type: 'END_BATTLE_PHASE' }],
        },
      ];
      break;

    case 'TRAP_SUMMON_DESTROY':
      effects = [
        {
          trigger: 'ON_OPPONENT_SUMMON',
          condition: { minTriggerMonsterAtk: Math.max(0, param ?? 1000) },
          actions: [{ type: 'DESTROY_TRIGGER_MONSTER' }],
        },
      ];
      break;

    case 'TRAP_SUMMON_DESTROY_ALL':
      effects = [
        {
          trigger: 'ON_OPPONENT_SUMMON',
          actions: [{ type: 'DESTROY_ALL_MONSTERS' }],
        },
      ];
      break;

    case 'TRAP_ACTIVATE_DESTROY_ST':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireSpellTrapOnField: true },
          target: {
            location: 'FIELD_SPELL_TRAP',
            promptVi: 'Chọn 1 lá Bài Phép / Bài Bẫy trên sân để phá hủy:',
          },
          actions: [{ type: 'DESTROY_TARGET' }],
        },
      ];
      break;

    case 'TRAP_ACTIVATE_RETURN_MONSTER':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireAnyMonsterOnField: true },
          target: {
            location: 'FIELD_MONSTER',
            promptVi: 'Chọn 1 quái thú trên sân để đẩy về tay:',
          },
          actions: [{ type: 'RETURN_TARGET_TO_HAND' }],
        },
      ];
      break;

    case 'TRAP_REVIVE_CONTINUOUS':
      effects = [
        {
          trigger: 'ON_ACTIVATE',
          condition: { requireMonsterInAnyGY: true },
          target: {
            location: 'OWN_GRAVEYARD_MONSTER',
            promptVi: 'Chọn 1 quái thú từ Mộ của bạn để Hồi Sinh:',
          },
          actions: [{ type: 'REVIVE_TARGET_FROM_GY' }],
        },
      ];
      break;

    case 'TRAP_NEGATE_TRAP':
      effects = [
        {
          trigger: 'ON_OPPONENT_TRAP',
          condition: { lpCost: Math.max(0, param || 1000) },
          actions: [{ type: 'NEGATE_AND_DESTROY_TRAP' }],
        },
      ];
      break;

    case 'TRAP_SOLEMN_NEGATE':
      effects = [
        {
          trigger: 'ON_OPPONENT_SUMMON',
          condition: { halfLpCost: true },
          actions: [{ type: 'DESTROY_TRIGGER_MONSTER' }],
        },
        {
          trigger: 'ON_OPPONENT_TRAP',
          condition: { halfLpCost: true },
          actions: [{ type: 'NEGATE_AND_DESTROY_TRAP' }],
        },
      ];
      break;

    case 'TRAP_HANDTRAP_NEGATE_TRAP':
      effects = [
        {
          trigger: 'ON_OPPONENT_TRAP',
          activateFromHand: true,
          condition: { halfLpCost: true },
          actions: [{ type: 'NEGATE_AND_DESTROY_TRAP' }],
        },
      ];
      break;

    default:
      break;
  }

  return { subType, effects };
}

export function inferTemplateFromCardDefinition(card: CardDefinition): {
  template: EffectTemplateKey;
  param: number;
} {
  const effs = card.effects ?? [];
  if (effs.length === 0) return { template: 'NONE', param: 1000 };

  const first = effs[0];
  const act = first.actions?.[0];

  if (card.category === 'MONSTER') {
    if (first.trigger === 'ON_FLIP' && act?.type === 'RETURN_TARGET_TO_HAND') {
      return { template: 'FLIP_RETURN_TO_HAND', param: 1000 };
    }
    if (first.trigger === 'ON_FLIP' && act?.type === 'DESTROY_TARGET') {
      return { template: 'FLIP_DESTROY_MONSTER', param: 1000 };
    }
    if (first.trigger === 'ON_SENT_TO_GY' && act?.type === 'SEARCH_DECK_MONSTER_TO_HAND') {
      return { template: 'SENT_GY_SEARCH_1500', param: act.maxAtkFilter ?? 1500 };
    }
    if (first.trigger === 'ON_BATTLE_END_SURVIVE' && act?.type === 'RETURN_ATTACKER_TO_HAND') {
      return { template: 'ON_BATTLE_RETURN_ATTACKER', param: 1000 };
    }
    if (first.trigger === 'ON_OPPONENT_TRAP' && first.activateFromHand) {
      return { template: 'HANDTRAP_NEGATE_TRAP', param: 1000 };
    }
    if (first.trigger === 'ON_OPPONENT_ATTACK' && first.activateFromHand) {
      return {
        template: act?.type === 'END_BATTLE_PHASE' ? 'HANDTRAP_END_BATTLE' : 'HANDTRAP_NEGATE_ATTACK',
        param: 1000,
      };
    }
  }

  if (card.category === 'SPELL') {
    if (act?.type === 'DRAW_CARDS') return { template: 'SPELL_DRAW', param: act.value ?? 2 };
    if (act?.type === 'DESTROY_OPPONENT_MONSTERS')
      return { template: 'SPELL_DESTROY_OPPONENT_MONSTERS', param: 1000 };
    if (act?.type === 'DESTROY_ALL_MONSTERS')
      return { template: 'SPELL_DESTROY_ALL_MONSTERS', param: 1000 };
    if (act?.type === 'DESTROY_LOWEST_ATK_OPPONENT_MONSTER')
      return { template: 'SPELL_DESTROY_LOWEST_ATK', param: 1000 };
    if (act?.type === 'DESTROY_ALL_SPELLS_TRAPS')
      return { template: 'SPELL_DESTROY_ALL_ST', param: 1000 };
    if (act?.type === 'DESTROY_TARGET') {
      return {
        template:
          first.target?.location === 'FIELD_SPELL_TRAP'
            ? 'SPELL_DESTROY_SPELL_TRAP'
            : 'SPELL_DESTROY_SINGLE_MONSTER',
        param: 1000,
      };
    }
    if (act?.type === 'RETURN_TARGET_TO_HAND')
      return { template: 'SPELL_RETURN_MONSTER_HAND', param: 1000 };
    if (act?.type === 'EQUIP_TO_TARGET') {
      const equipEff = effs.find((e) => e.trigger === 'CONTINUOUS_EQUIP');
      return { template: 'SPELL_EQUIP_BOOST', param: equipEff?.continuous?.atkDelta ?? 700 };
    }
    if (act?.type === 'REVIVE_TARGET_FROM_GY')
      return { template: 'SPELL_REVIVE_GY', param: 1000 };
    if (act?.type === 'TAKE_CONTROL_UNTIL_END_PHASE')
      return { template: 'SPELL_TAKE_CONTROL', param: first.condition?.lpCost ?? 0 };
    if (act?.type === 'CHANGE_TARGET_POSITION')
      return { template: 'SPELL_CHANGE_POSITION', param: 1000 };
    if (
      first.actions?.some((a) => a.type === 'LOCK_OPPONENT_ATTACKS_TURNS')
    ) {
      const lockAct = first.actions.find((a) => a.type === 'LOCK_OPPONENT_ATTACKS_TURNS');
      return { template: 'SPELL_LOCK_ATTACKS', param: lockAct?.value ?? 3 };
    }
    if (act?.type === 'HEAL_LP') return { template: 'SPELL_HEAL_LP', param: act.value ?? 1000 };
    if (act?.type === 'DAMAGE_LP') return { template: 'SPELL_DAMAGE_LP', param: act.value ?? 800 };
  }

  if (card.category === 'TRAP') {
    if (effs.some((e) => e.trigger === 'ON_OPPONENT_SUMMON') && effs.some((e) => e.trigger === 'ON_OPPONENT_TRAP')) {
      return { template: 'TRAP_SOLEMN_NEGATE', param: 1000 };
    }
    if (first.trigger === 'ON_OPPONENT_TRAP' && first.activateFromHand) {
      return { template: 'TRAP_HANDTRAP_NEGATE_TRAP', param: 1000 };
    }
    if (first.trigger === 'ON_OPPONENT_TRAP') {
      return { template: 'TRAP_NEGATE_TRAP', param: first.condition?.lpCost ?? 1000 };
    }
    if (first.trigger === 'ON_OPPONENT_SUMMON') {
      if (act?.type === 'DESTROY_ALL_MONSTERS')
        return { template: 'TRAP_SUMMON_DESTROY_ALL', param: 1000 };
      return { template: 'TRAP_SUMMON_DESTROY', param: first.condition?.minTriggerMonsterAtk ?? 1000 };
    }
    if (first.trigger === 'ON_OPPONENT_ATTACK') {
      if (first.actions?.some((a) => a.type === 'DESTROY_OPPONENT_ATTACK_POS_MONSTERS'))
        return { template: 'TRAP_ATTACK_DESTROY_ALL_ATK_POS', param: 1000 };
      if (first.actions?.some((a) => a.type === 'DAMAGE_LP_BY_ATTACKER_ATK'))
        return { template: 'TRAP_ATTACK_REFLECT_DAMAGE', param: 1000 };
      if (act?.type === 'END_BATTLE_PHASE')
        return { template: 'TRAP_END_BATTLE_PHASE', param: 1000 };
      return { template: 'TRAP_ATTACK_DESTROY_ATTACKER', param: 1000 };
    }
    if (first.trigger === 'ON_ACTIVATE') {
      if (act?.type === 'REVIVE_TARGET_FROM_GY')
        return { template: 'TRAP_REVIVE_CONTINUOUS', param: 1000 };
      if (act?.type === 'RETURN_TARGET_TO_HAND')
        return { template: 'TRAP_ACTIVATE_RETURN_MONSTER', param: 1000 };
      return { template: 'TRAP_ACTIVATE_DESTROY_ST', param: 1000 };
    }
  }

  return { template: 'NONE', param: 1000 };
}

export interface YgoProApiCard {
  id: number;
  name: string;
  type: string;
  frameType?: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
}

const VALID_ATTRIBUTES = new Set<Attribute>([
  'LIGHT',
  'DARK',
  'EARTH',
  'WATER',
  'FIRE',
  'WIND',
  'DIVINE',
]);

const VALID_RACES = new Set<MonsterRace>([
  'Dragon',
  'Spellcaster',
  'Warrior',
  'Fiend',
  'Fairy',
  'Zombie',
  'Machine',
  'Aqua',
  'Pyro',
  'Rock',
  'Winged Beast',
  'Beast',
  'Beast-Warrior',
  'Insect',
  'Dinosaur',
  'Fish',
  'Sea Serpent',
  'Reptile',
  'Plant',
  'Thunder',
]);

function normalizeRace(rawRace?: string): MonsterRace {
  if (rawRace && VALID_RACES.has(rawRace as MonsterRace)) {
    return rawRace as MonsterRace;
  }
  const lower = (rawRace || '').toLowerCase();
  if (lower.includes('wyrm')) return 'Dragon';
  if (lower.includes('cyberse') || lower.includes('psychic')) return 'Spellcaster';
  if (lower.includes('illusion')) return 'Fiend';
  return 'Warrior';
}

function normalizeAttribute(rawAttr?: string): Attribute {
  const upper = (rawAttr || '').toUpperCase();
  if (VALID_ATTRIBUTES.has(upper as Attribute)) {
    return upper as Attribute;
  }
  return 'DARK';
}

export interface InferredCardMapping {
  card: CardDefinition;
  detectedTemplate: EffectTemplateKey;
  detectedParam: number;
  confidenceVi: string;
}

const VI_RACE_LABELS: Record<string, string> = {
  Dragon: 'Rồng',
  Spellcaster: 'Phù Thủy',
  Warrior: 'Chiến Binh',
  Fiend: 'Ác Ma',
  Fairy: 'Thiên Thần',
  Zombie: 'Xác Sống',
  Machine: 'Máy Móc',
  Aqua: 'Thủy Quái',
  Pyro: 'Hỏa Tinh',
  Rock: 'Nham Thạch',
  'Winged Beast': 'Điểu Thú',
  Beast: 'Quái Thú',
  'Beast-Warrior': 'Thú Nhân',
  Insect: 'Côn Trùng',
  Dinosaur: 'Khủng Long',
  Fish: 'Ngư Quái',
  'Sea Serpent': 'Thủy Long',
  Reptile: 'Bò Sát',
  Plant: 'Thực Vật',
  Thunder: 'Lôi Thần',
};

const VI_ATTR_LABELS: Record<string, string> = {
  LIGHT: 'ÁNH SÁNG',
  DARK: 'BÓNG TỐI',
  EARTH: 'ĐẤT',
  WATER: 'NƯỚC',
  FIRE: 'LỬA',
  WIND: 'GIÓ',
  DIVINE: 'THẦN',
};

const EN_VI_NAME_WORDS: [RegExp, string][] = [
  [/Blue-Eyes/gi, 'Mắt Xanh'],
  [/Red-Eyes/gi, 'Mắt Đỏ'],
  [/Dark Magician Girl/gi, 'Nữ Phù Thủy Áo Đen'],
  [/Dark Magician/gi, 'Phù Thủy Áo Đen'],
  [/Magician/gi, 'Phù Thủy'],
  [/Spellcaster/gi, 'Pháp Sư'],
  [/Sorcerer/gi, 'Thuật Sư'],
  [/Wizard/gi, 'Pháp Sư'],
  [/Witch/gi, 'Phù Thủy'],
  [/Sage/gi, 'Hiền Triết'],
  [/Maiden/gi, 'Thiếu Nữ'],
  [/Priestess/gi, 'Nữ Tư Tế'],
  [/Knight/gi, 'Kỵ Sĩ'],
  [/Paladin/gi, 'Hiệp Sĩ'],
  [/Dragon/gi, 'Rồng'],
  [/Alternative/gi, 'Biến Thể'],
  [/Ultimate/gi, 'Tối Thượng'],
  [/Chaos/gi, 'Hỗn Mang'],
  [/White/gi, 'Trắng'],
  [/Black/gi, 'Đen'],
  [/Dark/gi, 'Bóng Đêm'],
  [/Light/gi, 'Ánh Sáng'],
  [/Eternal/gi, 'Vĩnh Cửu'],
  [/Ancient/gi, 'Cổ Đại'],
  [/Legend/gi, 'Huyền Thoại'],
  [/Spirit/gi, 'Linh Hồn'],
  [/Soul/gi, 'Linh Hồn'],
  [/Magic/gi, 'Ma Pháp'],
  [/Spell/gi, 'Phép Thuật'],
  [/Fusion/gi, 'Dung Hợp'],
  [/Sword/gi, 'Kiếm'],
  [/Warrior/gi, 'Chiến Binh'],
  [/Angel/gi, 'Thiên Sứ'],
  [/Lord/gi, 'Chúa Tể'],
  [/King/gi, 'Vua'],
  [/Queen/gi, 'Nữ Hoàng'],
  [/Eye/gi, 'Con Mắt'],
  [/Stone/gi, 'Đá'],
  [/Circle/gi, 'Vòng Tròn'],
  [/Curtain/gi, 'Bức Màn'],
  [/Attack/gi, 'Công Kích'],
  [/Destruction/gi, 'Hủy Diệt'],
  [/Judgment/gi, 'Phán Quyết'],
  [/Mirror/gi, 'Tấm Gương'],
  [/Pot of/gi, 'Chiếc Bình'],
];

export function translateYgoProNameToVi(name: string): string {
  let vi = name.trim();
  if (!vi) return 'Lá Bài Chưa Định Tên';

  let matchedCount = 0;
  for (const [pattern, replacement] of EN_VI_NAME_WORDS) {
    const next = vi.replace(pattern, replacement);
    if (next !== vi) {
      vi = next;
      matchedCount += 1;
    }
  }
  vi = vi.replace(/\s+/g, ' ').trim();
  if (matchedCount === 0) {
    return `${name} (Bản Nhập YDK)`;
  }
  if (vi.toLowerCase() === name.toLowerCase()) {
    return name;
  }
  return `${vi} (${name})`;
}

export function translateYgoProDescToVi(
  rawDesc: string,
  category: CardCategory,
  confidenceVi: string,
  isExtraMonster = false
): string {
  const clean = rawDesc.trim();
  if (!clean) {
    return `[${confidenceVi}] Lá bài nhập tự động từ YGOProDeck.`;
  }

  let translated = clean
    .replace(/You can only use (?:this|each) effect of "([^"]+)" once per turn\.?/gi, 'Mỗi lượt chỉ dùng hiệu ứng này của [$1] 1 lần.')
    .replace(/Once per turn[:,]?/gi, 'Mỗi lượt 1 lần:')
    .replace(/When this card is Normal Summoned[:,]?/gi, 'Khi lá bài này được Triệu hồi thường:')
    .replace(/When this card is Special Summoned[:,]?/gi, 'Khi lá bài này được Triệu hồi Đặc biệt:')
    .replace(/If this card is Normal or Special Summoned[:,]?/gi, 'Nếu lá bài này được Triệu hồi Thường hoặc Đặc biệt:')
    .replace(/If this card is sent to the GY[:,]?|If this card is sent to the Graveyard[:,]?/gi, 'Nếu lá này bị gửi xuống Mộ:')
    .replace(/You can Special Summon/gi, 'Bạn có thể Triệu hồi Đặc biệt')
    .replace(/Special Summon/gi, 'Triệu hồi Đặc biệt')
    .replace(/Normal Summon/gi, 'Triệu hồi Thường')
    .replace(/Add (\d+) ([^.;]+) from your Deck to your hand/gi, 'Lấy $1 $2 từ Bộ bài lên tay')
    .replace(/Add (\d+) ([^.;]+) from your (?:GY|Graveyard) to your hand/gi, 'Lấy $1 $2 từ Mộ lên tay')
    .replace(/from your hand or GY/gi, 'từ tay hoặc Mộ')
    .replace(/from your Deck/gi, 'từ Bộ bài')
    .replace(/from your GY|from your Graveyard/gi, 'từ Mộ')
    .replace(/to your hand/gi, 'lên tay')
    .replace(/to the GY|to the Graveyard/gi, 'xuống Mộ')
    .replace(/Destroy all monsters your opponent controls/gi, 'Tiêu diệt toàn bộ quái thú đối phương')
    .replace(/Destroy (\d+|all|1) ([^.;]+) on the field/gi, 'Phá hủy $1 $2 trên sân')
    .replace(/Destroy/gi, 'Tiêu diệt')
    .replace(/Negate the activation/gi, 'Vô hiệu hóa kích hoạt')
    .replace(/negate/gi, 'vô hiệu hóa')
    .replace(/Draw (\d+) card(s?)/gi, 'Rút $1 lá bài')
    .replace(/discard (\d+) card(s?)/gi, 'bỏ $1 lá bài')
    .replace(/your opponent controls/gi, 'đối phương điều khiển')
    .replace(/you control/gi, 'bạn điều khiển')
    .replace(/Cannot be destroyed by battle/gi, 'Không thể bị tiêu diệt trong chiến đấu')
    .replace(/Cannot be targeted by card effects/gi, 'Không thể bị chọn làm mục tiêu hiệu ứng')
    .replace(/Spell\/Trap card(s?)/gi, 'lá Phép/Bẫy')
    .replace(/\bSpellcaster\s+monsters?\b/gi, 'quái thú Phù Thủy')
    .replace(/\bDragon\s+monsters?\b/gi, 'quái thú hệ Rồng')
    .replace(/\bSpellcaster\b/gi, 'Phù Thủy')
    .replace(/\bDragon\b/gi, 'Rồng')
    .replace(/\bmonsters?\b/gi, 'quái thú')
    .replace(/\bcards?\b/gi, 'lá bài')
    .replace(/ATK\/DEF/gi, 'ATK/DEF')
    .replace(/LP/gi, 'Điểm Gốc (LP)');

  const prefix =
    category === 'MONSTER'
      ? isExtraMonster
        ? '[Quái Extra / Dung Hợp]'
        : '[Quái Thú]'
      : category === 'SPELL'
      ? '[Bài Phép]'
      : '[Bài Bẫy]';

  return `${prefix} ${confidenceVi} — ${translated}`;
}

export function inferCardFromYgoPro(apiCard: YgoProApiCard): InferredCardMapping {
  const typeUpper = String(apiCard.type || '').toUpperCase();
  const frameUpper = String(apiCard.frameType || '').toUpperCase();
  const raceUpper = String(apiCard.race || '').toUpperCase();
  const nameLower = String(apiCard.name || '').toLowerCase();
  const desc = String(apiCard.desc || '');
  const dLower = desc.toLowerCase();

  let category: CardCategory = 'MONSTER';
  if (typeUpper.includes('SPELL') || frameUpper === 'SPELL') category = 'SPELL';
  else if (typeUpper.includes('TRAP') || frameUpper === 'TRAP') category = 'TRAP';

  const isExtraDeckMonster =
    category === 'MONSTER' &&
    (typeUpper.includes('FUSION') ||
      typeUpper.includes('SYNCHRO') ||
      typeUpper.includes('XYZ') ||
      typeUpper.includes('LINK') ||
      frameUpper === 'FUSION' ||
      frameUpper === 'SYNCHRO' ||
      frameUpper === 'XYZ' ||
      frameUpper === 'LINK');

  let detectedTemplate: EffectTemplateKey = 'NONE';
  let detectedParam = 1000;
  let confidenceVi = 'Quái thường / Tự tính Hiến tế theo Cấp sao';

  if (category === 'MONSTER') {
    if (isExtraDeckMonster) {
      confidenceVi = `Quái Extra (${apiCard.type})`;
    } else if (dLower.includes('flip:')) {
      if (dLower.includes('return') && dLower.includes('hand')) {
        detectedTemplate = 'FLIP_RETURN_TO_HAND';
        confidenceVi = 'Tự nhận diện: FLIP đẩy quái về tay';
      } else {
        detectedTemplate = 'FLIP_DESTROY_MONSTER';
        confidenceVi = 'Tự nhận diện: FLIP tiêu diệt quái';
      }
    } else if (
      (dLower.includes('from the field to the graveyard') || dLower.includes('to the gy')) &&
      dLower.includes('add 1 monster')
    ) {
      const atkMatch = dLower.match(/(\d{3,4})\s*or less\s*(atk|def)/);
      detectedTemplate = 'SENT_GY_SEARCH_1500';
      detectedParam = atkMatch ? Number(atkMatch[1]) : 1500;
      confidenceVi = `Tự nhận diện: Vào Mộ tìm quái ≤ ${detectedParam}`;
    } else if (
      (dLower.includes('discard') || dLower.includes('send this card from your hand')) &&
      dLower.includes('negate') &&
      dLower.includes('trap')
    ) {
      detectedTemplate = 'HANDTRAP_NEGATE_TRAP';
      confidenceVi = 'Tự nhận diện: Handtrap vô hiệu Bài Bẫy';
    } else if (
      (dLower.includes('discard') || dLower.includes('send this card from your hand')) &&
      dLower.includes('attack')
    ) {
      if (dLower.includes('end the battle phase')) {
        detectedTemplate = 'HANDTRAP_END_BATTLE';
        confidenceVi = 'Tự nhận diện: Handtrap kết thúc Battle Phase';
      } else {
        detectedTemplate = 'HANDTRAP_NEGATE_ATTACK';
        confidenceVi = 'Tự nhận diện: Handtrap chặn đòn tấn công';
      }
    } else if (typeUpper.includes('EFFECT')) {
      const atk = Math.max(0, Number(apiCard.atk ?? 0));
      const def = Math.max(0, Number(apiCard.def ?? 0));
      const raceVi = VI_RACE_LABELS[normalizeRace(apiCard.race)] ?? 'Chiến Binh';
      const attrVi = VI_ATTR_LABELS[normalizeAttribute(apiCard.attribute)] ?? 'BÓNG TỐI';
      confidenceVi = `Quái hiệu ứng (${raceVi} / ${attrVi} - ${atk}/${def})`;
    }
  } else if (category === 'SPELL') {
    if (typeUpper.includes('EQUIP') || raceUpper === 'EQUIP') {
      const gainMatch = dLower.match(/gains?\s*(\d{3,4})\s*atk/);
      detectedTemplate = 'SPELL_EQUIP_BOOST';
      detectedParam = gainMatch ? Number(gainMatch[1]) : 700;
      confidenceVi = `Tự nhận diện: Trang bị +${detectedParam} ATK`;
    } else if (dLower.includes('destroy all monsters your opponent controls')) {
      detectedTemplate = 'SPELL_DESTROY_OPPONENT_MONSTERS';
      confidenceVi = 'Tự nhận diện: Quét sạch quái đối phương';
    } else if (dLower.includes('destroy all monsters on the field')) {
      detectedTemplate = 'SPELL_DESTROY_ALL_MONSTERS';
      confidenceVi = 'Tự nhận diện: Quét sạch toàn bộ quái';
    } else if (dLower.includes('destroy all spell and trap') || dLower.includes('destroy all spells and traps')) {
      detectedTemplate = 'SPELL_DESTROY_ALL_ST';
      confidenceVi = 'Tự nhận diện: Phá hủy toàn bộ Phép/Bẫy';
    } else if (
      dLower.includes('destroy') &&
      (dLower.includes('spell/trap') || dLower.includes('spell or trap'))
    ) {
      detectedTemplate = 'SPELL_DESTROY_SPELL_TRAP';
      confidenceVi = 'Tự nhận diện: Phá 1 Phép/Bẫy trên sân';
    } else if (dLower.includes('lowest atk') && dLower.includes('destroy')) {
      detectedTemplate = 'SPELL_DESTROY_LOWEST_ATK';
      confidenceVi = 'Tự nhận diện: Diệt quái ATK thấp nhất';
    } else if (dLower.includes('draw')) {
      const drawMatch = dLower.match(/draw\s*(\d+)/);
      detectedTemplate = 'SPELL_DRAW';
      detectedParam = drawMatch ? Math.min(5, Math.max(1, Number(drawMatch[1]))) : 2;
      confidenceVi = `Tự nhận diện: Rút ${detectedParam} lá bài`;
    } else if (
      (dLower.includes('graveyard') || dLower.includes(' gy')) &&
      dLower.includes('special summon')
    ) {
      detectedTemplate = 'SPELL_REVIVE_GY';
      confidenceVi = 'Tự nhận diện: Hồi sinh từ Mộ';
    } else if (dLower.includes('take control')) {
      const lpMatch = dLower.match(/pay\s*(\d{3,4})\s*lp/);
      detectedTemplate = 'SPELL_TAKE_CONTROL';
      detectedParam = lpMatch ? Number(lpMatch[1]) : 0;
      confidenceVi = 'Tự nhận diện: Chiếm quyền điều khiển quái';
    } else if ((dLower.includes('gain') || dLower.includes('increase')) && (dLower.includes('lp') || dLower.includes('life points'))) {
      const lpMatch = dLower.match(/(?:gain|by)\s*(\d{3,5})\s*(?:lp|life points)/);
      detectedTemplate = 'SPELL_HEAL_LP';
      detectedParam = lpMatch ? Number(lpMatch[1]) : 1000;
      confidenceVi = `Tự nhận diện: Hồi +${detectedParam} LP`;
    } else if (dLower.includes('inflict') && dLower.includes('damage')) {
      const dmgMatch = dLower.match(/(\d{3,5})\s*damage/);
      detectedTemplate = 'SPELL_DAMAGE_LP';
      detectedParam = dmgMatch ? Number(dmgMatch[1]) : 800;
      confidenceVi = `Tự nhận diện: Gây ${detectedParam} sát thương LP`;
    } else if (dLower.includes('destroy') && dLower.includes('monster')) {
      detectedTemplate = 'SPELL_DESTROY_SINGLE_MONSTER';
      confidenceVi = 'Tự nhận diện: Tiêu diệt 1 quái đối phương';
    } else if (dLower.includes('return') && dLower.includes('hand')) {
      detectedTemplate = 'SPELL_RETURN_MONSTER_HAND';
      confidenceVi = 'Tự nhận diện: Đẩy quái về tay';
    } else if (raceUpper === 'FIELD') {
      detectedTemplate = 'SPELL_DRAW';
      detectedParam = 1;
      confidenceVi = 'Phép Môi Trường (Rút 1 lá khi kích hoạt)';
    } else {
      detectedTemplate = 'SPELL_DESTROY_SINGLE_MONSTER';
      confidenceVi = 'Phép hỗ trợ chiến đấu';
    }
  } else {
    // TRAP
    if (dLower.includes('pay half your lp') && dLower.includes('negate')) {
      if (dLower.includes('from your hand')) {
        detectedTemplate = 'TRAP_HANDTRAP_NEGATE_TRAP';
        confidenceVi = 'Tự nhận diện: Bẫy Counter kích hoạt từ tay (½ LP)';
      } else if (dLower.includes('summoned')) {
        detectedTemplate = 'TRAP_SOLEMN_NEGATE';
        confidenceVi = 'Tự nhận diện: Bẫy Phản Đòn tối thượng (½ LP)';
      } else {
        detectedTemplate = 'TRAP_HANDTRAP_NEGATE_TRAP';
        confidenceVi = 'Tự nhận diện: Bẫy Counter trả ½ LP';
      }
    } else if (
      (raceUpper === 'COUNTER' || typeUpper.includes('COUNTER') || dLower.includes('trap card is activated')) &&
      dLower.includes('negate')
    ) {
      const lpMatch = dLower.match(/pay\s*(\d{3,5})\s*(?:lp|life points)/);
      detectedTemplate = 'TRAP_NEGATE_TRAP';
      detectedParam = lpMatch ? Number(lpMatch[1]) : 1000;
      confidenceVi = `Tự nhận diện: Bẫy Counter phá Bẫy (${detectedParam} LP)`;
    } else if (dLower.includes('declares an attack') || dLower.includes('attacks')) {
      if (dLower.includes('attack position')) {
        detectedTemplate = 'TRAP_ATTACK_DESTROY_ALL_ATK_POS';
        confidenceVi = 'Tự nhận diện: Khi bị đánh, diệt toàn bộ quái thế Công';
      } else if (dLower.includes('damage equal to')) {
        detectedTemplate = 'TRAP_ATTACK_REFLECT_DAMAGE';
        confidenceVi = 'Tự nhận diện: Khi bị đánh, phản sát thương ATK';
      } else if (dLower.includes('end the battle phase')) {
        detectedTemplate = 'TRAP_END_BATTLE_PHASE';
        confidenceVi = 'Tự nhận diện: Chặn đòn & Kết thúc Battle Phase';
      } else {
        detectedTemplate = 'TRAP_ATTACK_DESTROY_ATTACKER';
        confidenceVi = 'Tự nhận diện: Khi bị đánh, diệt quái tấn công';
      }
    } else if (dLower.includes('summoned')) {
      if (dLower.includes('destroy all monsters')) {
        detectedTemplate = 'TRAP_SUMMON_DESTROY_ALL';
        confidenceVi = 'Tự nhận diện: Khi triệu hồi, quét sạch quái';
      } else {
        const atkMatch = dLower.match(/(\d{3,4})\s*or more atk/);
        detectedTemplate = 'TRAP_SUMMON_DESTROY';
        detectedParam = atkMatch ? Number(atkMatch[1]) : 1000;
        confidenceVi = `Tự nhận diện: Khi triệu hồi ATK ≥ ${detectedParam}`;
      }
    } else if (dLower.includes('return') && dLower.includes('hand')) {
      detectedTemplate = 'TRAP_ACTIVATE_RETURN_MONSTER';
      confidenceVi = 'Tự nhận diện: Bẫy đẩy quái về tay';
    } else if (
      dLower.includes('special summon') &&
      (dLower.includes('graveyard') || dLower.includes(' gy'))
    ) {
      detectedTemplate = 'TRAP_REVIVE_CONTINUOUS';
      confidenceVi = 'Tự nhận diện: Bẫy Vĩnh cửu hồi sinh từ Mộ';
    } else if (dLower.includes('spell/trap') || dLower.includes('spell or trap')) {
      detectedTemplate = 'TRAP_ACTIVATE_DESTROY_ST';
      confidenceVi = 'Tự nhận diện: Bẫy phá 1 Phép/Bẫy';
    } else {
      detectedTemplate = 'TRAP_ATTACK_DESTROY_ATTACKER';
      confidenceVi = 'Bẫy phòng thủ phản đòn';
    }
  }

  let { subType, effects } = buildEffectsFromTemplate(category, detectedTemplate, detectedParam);

  if (category === 'MONSTER' && isExtraDeckMonster) {
    subType = 'FUSION';
  } else if (category === 'SPELL') {
    if (raceUpper === 'FIELD') subType = 'FIELD';
    else if (raceUpper === 'QUICK-PLAY' || raceUpper === 'QUICK PLAY') subType = 'QUICK_PLAY';
    else if (raceUpper === 'CONTINUOUS') subType = 'CONTINUOUS';
    else if (raceUpper === 'EQUIP') subType = 'EQUIP';
  } else if (category === 'TRAP') {
    if (raceUpper === 'COUNTER') subType = 'COUNTER';
    else if (raceUpper === 'CONTINUOUS') subType = 'CONTINUOUS';
  }

  const tags: ArchetypeTag[] = [];
  if (nameLower.includes('blue-eyes') || dLower.includes('blue-eyes')) tags.push('BLUE_EYES');
  if (nameLower.includes('dark magician') || dLower.includes('dark magician')) tags.push('DARK_MAGICIAN');
  if (category === 'MONSTER') {
    const normRace = normalizeRace(apiCard.race);
    if (normRace === 'Spellcaster') tags.push('SPELLCASTER');
    if (normRace === 'Dragon') tags.push('DRAGON');
  }

  const cleanId =
    String(apiCard.name || `card_${apiCard.id}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || `card_${apiCard.id}`;

  const normRace = normalizeRace(apiCard.race);
  const normAttr = normalizeAttribute(apiCard.attribute);

  const card: CardDefinition = {
    id: cleanId,
    passcode: String(apiCard.id),
    name: apiCard.name,
    nameVi: translateYgoProNameToVi(apiCard.name),
    category,
    subType,
    ...(tags.length > 0 ? { archetypeTags: tags } : {}),
    ...(category === 'MONSTER'
      ? {
          attribute: normAttr,
          race: normRace,
          level: Math.max(1, Math.min(12, Number(apiCard.level ?? 4))),
          atk: Math.max(0, Number(apiCard.atk ?? 0)),
          def: Math.max(0, Number(apiCard.def ?? 0)),
        }
      : {}),
    ...(subType === 'FUSION'
      ? {
          fusionMaterials: [
            `RACE:${normRace}`,
            normRace === 'Spellcaster' ? 'dark_magician' : normRace === 'Dragon' ? 'RACE:Dragon' : `ATTR:${normAttr}`,
          ],
        }
      : {}),
    descriptionVi: translateYgoProDescToVi(desc, category, confidenceVi, isExtraDeckMonster),
    ...(effects ? { effects } : {}),
  };

  return {
    card,
    detectedTemplate,
    detectedParam,
    confidenceVi,
  };
}

export async function fetchYgoProCardsByQuery(
  query: string,
  limit = 12
): Promise<YgoProApiCard[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const resp = await fetch(
    `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(trimmed)}`
  );
  if (resp.status === 400) {
    return [];
  }
  if (!resp.ok) {
    throw new Error('Không thể kết nối YGOProDeck API.');
  }
  const data = await resp.json();
  const rows = Array.isArray(data?.data) ? (data.data as YgoProApiCard[]) : [];
  return rows.slice(0, limit);
}

export async function fetchYgoProCardsByPasscodes(
  passcodes: string[]
): Promise<Map<string, YgoProApiCard>> {
  const result = new Map<string, YgoProApiCard>();
  const uniqueNorms = Array.from(
    new Set(passcodes.map((p) => normalizePasscode(p)).filter((p) => p && p !== '0'))
  );
  if (uniqueNorms.length === 0) return result;

  const CHUNK_SIZE = 30;
  for (let i = 0; i < uniqueNorms.length; i += CHUNK_SIZE) {
    const chunk = uniqueNorms.slice(i, i + CHUNK_SIZE);
    const resp = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${chunk.join(',')}`
    );
    if (resp.status === 400) {
      continue;
    }
    if (!resp.ok) {
      throw new Error('Lỗi kết nối YGOProDeck API khi tải danh sách mã bài.');
    }
    const data = await resp.json();
    const rows = Array.isArray(data?.data) ? (data.data as YgoProApiCard[]) : [];
    for (const row of rows) {
      result.set(normalizePasscode(String(row.id)), row);
    }
  }
  return result;
}

export interface ParsedDeckTokens {
  deckName?: string;
  mainTokens: string[];
  extraTokens: string[];
  ignoredSideCount: number;
  format: 'JSON' | 'YDK' | 'LIST';
}

export function parseDeckImportInput(rawText: string): ParsedDeckTokens {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { mainTokens: [], extraTokens: [], ignoredSideCount: 0, format: 'LIST' };
  }

  // 1. Thử parse dạng JSON trước
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return {
          mainTokens: parsed.map((x) => String(x).trim()).filter(Boolean),
          extraTokens: [],
          ignoredSideCount: 0,
          format: 'JSON',
        };
      }
      if (parsed && typeof parsed === 'object') {
        const mainArr = Array.isArray(parsed.mainDeck)
          ? parsed.mainDeck
          : Array.isArray(parsed.main)
          ? parsed.main
          : [];
        const extraArr = Array.isArray(parsed.extraDeck)
          ? parsed.extraDeck
          : Array.isArray(parsed.extra)
          ? parsed.extra
          : [];
        return {
          deckName: typeof parsed.name === 'string' ? parsed.name : undefined,
          mainTokens: mainArr.map((x: unknown) => String(x).trim()).filter(Boolean),
          extraTokens: extraArr.map((x: unknown) => String(x).trim()).filter(Boolean),
          ignoredSideCount: 0,
          format: 'JSON',
        };
      }
    } catch {
      // Nếu lỗi JSON, fallback xuống parser dòng bên dưới
    }
  }

  // 2. Parse định dạng .ydk / danh sách mã bài từng dòng
  const lines = trimmed.split(/\r?\n/);
  let section: 'main' | 'extra' | 'side' = 'main';
  let isYdk = false;
  const mainTokens: string[] = [];
  const extraTokens: string[] = [];
  let ignoredSideCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const lower = line.toLowerCase();

    if (lower === '#main') {
      section = 'main';
      isYdk = true;
      continue;
    }
    if (lower === '#extra') {
      section = 'extra';
      isYdk = true;
      continue;
    }
    if (lower === '!side' || lower === '#side') {
      section = 'side';
      isYdk = true;
      continue;
    }
    if (line.startsWith('#') || line.startsWith('//')) {
      isYdk = true;
      continue;
    }

    if (section === 'side') {
      ignoredSideCount += 1;
      continue;
    }
    if (section === 'extra') {
      extraTokens.push(line);
    } else {
      mainTokens.push(line);
    }
  }

  return {
    mainTokens,
    extraTokens,
    ignoredSideCount,
    format: isYdk ? 'YDK' : 'LIST',
  };
}

export function resolveTokenToExistingCard(token: string): CardDefinition | undefined {
  const trimmed = token.trim();
  if (!trimmed) return undefined;
  const byId = getCardById(trimmed);
  if (byId) return byId;
  if (/^\d+$/.test(trimmed)) {
    const byCode = getCardByPasscode(trimmed);
    if (byCode) return byCode;
  }
  return getCardByExactName(trimmed);
}

export function exportDeckToYdk(mainIds: string[], extraIds: string[]): string {
  const mapIds = (ids: string[]) =>
    ids
      .map((id) => getCardById(id)?.passcode)
      .filter((code): code is string => Boolean(code && /^\d+$/.test(code.trim())));

  return [
    '#created by Yu-Gi-Oh H5 Classic Duel',
    '#main',
    ...mapIds(mainIds),
    '#extra',
    ...mapIds(extraIds),
    '!side',
  ].join('\n');
}

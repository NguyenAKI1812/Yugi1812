export type CardCategory = 'MONSTER' | 'SPELL' | 'TRAP';

export type MonsterSubType = 'NORMAL' | 'EFFECT' | 'FUSION';
export type SpellSubType = 'NORMAL' | 'EQUIP' | 'FIELD' | 'CONTINUOUS' | 'QUICK_PLAY';
export type TrapSubType = 'NORMAL' | 'CONTINUOUS' | 'COUNTER';

export type Attribute = 'LIGHT' | 'DARK' | 'EARTH' | 'WATER' | 'FIRE' | 'WIND' | 'DIVINE';

export type MonsterRace =
  | 'Dragon'
  | 'Spellcaster'
  | 'Warrior'
  | 'Fiend'
  | 'Fairy'
  | 'Zombie'
  | 'Machine'
  | 'Aqua'
  | 'Pyro'
  | 'Rock'
  | 'Winged Beast'
  | 'Beast'
  | 'Beast-Warrior'
  | 'Insect'
  | 'Dinosaur'
  | 'Fish'
  | 'Sea Serpent'
  | 'Reptile'
  | 'Plant'
  | 'Thunder';

export type EffectTrigger =
  | 'ON_ACTIVATE'           // Khi kích hoạt bài Phép / Bẫy chủ động
  | 'ON_SUMMON'             // Khi quái thú được Triệu hồi ngửa lên sân
  | 'ON_OPPONENT_SUMMON'    // Khi đối thủ Triệu hồi quái (VD: Trap Hole)
  | 'ON_OPPONENT_ATTACK'    // Khi đối thủ Tuyên bố tấn công (VD: Mirror Force, Magic Cylinder, Sakuretsu Armor)
  | 'ON_OPPONENT_TRAP'      // Khi đối thủ kích hoạt Bẫy (VD: Seven Tools of the Bandit)
  | 'ON_FLIP'               // Khi quái thú Lật ngửa (VD: Man-Eater Bug)
  | 'ON_BATTLE_END_SURVIVE' // Sau khi giao tranh với quái tấn công (VD: Wall of Illusion)
  | 'ON_SENT_TO_GY'         // Khi từ sân (hoặc gửi) xuống Mộ (VD: Sangan, White Stone)
  | 'CONTINUOUS_FIELD'      // Hiệu ứng sân liên tục (VD: Yami, Mountain)
  | 'CONTINUOUS_EQUIP'      // Hiệu ứng trang bị liên tục (VD: Axe of Despair)
  | 'CONTINUOUS_MONSTER';   // Hiệu ứng quái liên tục trên sân (VD: Dark Magician Girl, Dark Paladin)

export type TargetLocation =
  | 'NONE'
  | 'FIELD_MONSTER'
  | 'OPPONENT_MONSTER'
  | 'OWN_MONSTER'
  | 'FIELD_SPELL_TRAP'
  | 'OPPONENT_SPELL_TRAP'
  | 'OPPONENT_ANY_CARD'
  | 'EITHER_GRAVEYARD_MONSTER'
  | 'OWN_GRAVEYARD_MONSTER'
  | 'OPPONENT_GRAVEYARD_MONSTER'
  | 'OWN_HAND_CARD'
  | 'OWN_HAND_MONSTER'
  | 'HAND_MONSTER_SPECIAL';

export interface TargetRule {
  location: TargetLocation;
  faceUpOnly?: boolean;
  allowedRaces?: MonsterRace[];
  allowedCardIds?: string[];
  allowedAttributes?: Attribute[];
  minLevel?: number;
  maxLevel?: number;
  maxAtk?: number;
  minAtk?: number;
  count?: number;
  optional?: boolean;
  promptVi?: string;
}

export interface EffectCondition {
  minTriggerMonsterAtk?: number;     // VD: Trap Hole cần quái vừa triệu hồi >= 1000 ATK
  requireFaceUpCardCode?: string;    // VD: Flute of Summoning Dragon cần "lord_of_d" ngửa trên sân
  requireFaceUpCardCodes?: string[]; // VD: Cần có 1 trong các lá này ngửa trên sân bạn
  requireFaceUpAllCardCodes?: string[]; // VD: Cần có đủ tất cả các lá này ngửa trên sân bạn
  requireFaceUpRace?: MonsterRace[]; // VD: Cần điều khiển ít nhất 1 quái hệ Phù Thủy
  lpCost?: number;                   // VD: Seven Tools of the Bandit trả 1000 LP
  halfLpCost?: boolean;              // VD: Red Reboot trả một nửa LP hiện tại
  requireOpponentFaceUpMonster?: boolean;
  requireOpponentSpellTrap?: boolean;
  requireOpponentAnyCard?: boolean;
  requireAnyMonsterOnField?: boolean;
  requireSpellTrapOnField?: boolean;
  requireMonsterInAnyGY?: boolean;
  requireDragonInHand?: boolean;
}

export type AtomicActionType =
  | 'DRAW_CARDS'
  | 'DISCARD_FROM_HAND'
  | 'DISCARD_TARGET_HAND_CARD'
  | 'TRIBUTE_TARGET_MONSTER'
  | 'MILL_TO_GY'
  | 'DESTROY_TARGET'
  | 'DESTROY_TRIGGER_MONSTER'
  | 'DESTROY_ATTACKING_MONSTER'
  | 'DESTROY_ALL_MONSTERS'
  | 'DESTROY_OPPONENT_MONSTERS'
  | 'DESTROY_OPPONENT_ATTACK_POS_MONSTERS'
  | 'DESTROY_OPPONENT_SPELLS_TRAPS'
  | 'DESTROY_OPPONENT_ALL_CARDS'
  | 'DESTROY_LOWEST_ATK_OPPONENT_MONSTER'
  | 'DESTROY_ALL_SPELLS_TRAPS'
  | 'RETURN_ATTACKER_TO_HAND'
  | 'RETURN_TARGET_TO_HAND'
  | 'HEAL_LP'
  | 'DAMAGE_LP'
  | 'DAMAGE_LP_BY_ATTACKER_ATK'
  | 'REVIVE_TARGET_FROM_GY'
  | 'EQUIP_TO_TARGET'
  | 'NEGATE_ATTACK'
  | 'END_BATTLE_PHASE'
  | 'NEGATE_AND_DESTROY_TRAP'
  | 'LOCK_OPPONENT_ATTACKS_TURNS'
  | 'FLIP_ALL_OPPONENT_MONSTERS_FACE_UP'
  | 'SEARCH_DECK_MONSTER_TO_HAND'
  | 'SEARCH_DECK_TO_HAND'
  | 'SPECIAL_SUMMON_HAND_MONSTERS'
  | 'SPECIAL_SUMMON_FROM_DECK_OR_GY'
  | 'CHANGE_TARGET_POSITION'
  | 'CHANGE_TARGET_FACE_DOWN'
  | 'TAKE_CONTROL_UNTIL_END_PHASE'
  | 'BANISH_FROM_GY'
  | 'FUSION_SUMMON';

export interface AtomicAction {
  type: AtomicActionType;
  value?: number;
  targetSide?: 'SELF' | 'OPPONENT' | 'BOTH';
  atkBoost?: number;
  defBoost?: number;
  raceFilter?: MonsterRace[];
  attributeFilter?: Attribute[];
  categoryFilter?: CardCategory | 'SPELL_OR_TRAP' | 'ANY';
  subTypeFilter?: string[];
  cardIdFilter?: string[];
  nameContainsFilter?: string[];
  minLevelFilter?: number;
  maxLevelFilter?: number;
  minAtkFilter?: number;
  maxAtkFilter?: number;
  maxDefFilter?: number;
  maxSummonCount?: number;
  selectCount?: number;
  includeGraveyard?: boolean;
  graveyardOnly?: boolean;
  allowGyFusionMaterials?: boolean;
  useTargetAsOnlyFusionMaterial?: boolean;
}

export interface ContinuousModifier {
  affectedRaces?: MonsterRace[];
  affectedCardIds?: string[];
  atkDelta: number;
  defDelta: number;
  perCardInGY?: string[]; // VD: Dark Magician Girl +300 ATK cho mỗi Dark Magician dưới mộ
  perRaceOnFieldAndGY?: MonsterRace[]; // VD: Buster Blader / Dark Paladin +500 ATK cho mỗi Rồng
  countOpponentOnly?: boolean; // Nếu true chỉ đếm bên đối phương (Buster Blader)
  perRaceInOwnGY?: MonsterRace[]; // VD: Blue-Eyes Shining Dragon +300 ATK cho mỗi Rồng dưới mộ bạn
  perCategoryOnFieldAndGY?: ('SPELL' | 'TRAP')[]; // VD: Dark Cavalry / Amulet Dragon
  protectsRaceFromTargeting?: MonsterRace[]; // VD: Lord of D. bảo vệ Dragon
}

export interface SpecialSummonHandRule {
  requireHandOrFieldCardIds?: string[]; // VD: Cần có Rồng Trắng Mắt Xanh trên tay hoặc sân
  requireFieldCardIds?: string[];       // VD: Cần có quái này ngửa trên sân
  requireFaceUpRace?: MonsterRace[];    // VD: Cần điều khiển quái hệ Phù Thủy
  discardHandCount?: number;            // VD: Bỏ 1 lá trên tay để Đặc biệt Triệu hồi
  labelVi?: string;
}

export interface CardEffect {
  trigger: EffectTrigger;
  activateFromHand?: boolean; // Có thể kích hoạt trực tiếp từ trên tay như Handtrap (VD: Hộ Vệ Ánh Tím, Kuriboh, Red Reboot)
  triggerOnAnyGY?: boolean;   // Kích hoạt ON_SENT_TO_GY cả khi bị bỏ từ tay hoặc gửi từ Bộ bài
  condition?: EffectCondition;
  target?: TargetRule;
  actions?: AtomicAction[];
  continuous?: ContinuousModifier;
}

export type ArchetypeTag = 'BLUE_EYES' | 'DARK_MAGICIAN' | 'SPELLCASTER' | 'DRAGON' | 'STAPLE';

export interface CardDefinition {
  id: string;
  passcode: string; // Mã thẻ bài Konami 8 số -> tự động lấy ảnh từ YGOProDeck CDN
  altPasscodes?: string[]; // Danh sách mã artwork thay thế cùng tên bài khi nhập từ file .ydk
  archetypeTags?: ArchetypeTag[];
  name: string;
  nameVi: string;
  category: CardCategory;
  subType: MonsterSubType | SpellSubType | TrapSubType;
  attribute?: Attribute;
  race?: MonsterRace;
  level?: number;
  atk?: number;
  def?: number;
  fusionMaterials?: string[]; // Danh sách ID nguyên liệu hoặc 'RACE:Dragon', 'RACE:Spellcaster', 'RACE:Warrior'
  specialSummonHand?: SpecialSummonHandRule;
  descriptionVi: string;
  effects?: CardEffect[];
  customImageUrl?: string;    // Cho phép ghi đè link ảnh tùy chọn
}

export type CardPosition = 'ATTACK' | 'DEFENSE' | 'SET_DEFENSE' | 'FACE_UP' | 'SET';

export interface FieldCardInstance {
  instanceId: string;
  cardId: string;
  owner: PlayerId;
  controller: PlayerId;
  position: CardPosition;
  summonedTurn: number;
  setTurn: number;
  changedPositionThisTurn: boolean;
  attacksDeclaredThisTurn: number;
  equippedToInstanceId?: string; // Dùng cho Equip Spell hoặc Call of the Haunted
  remainingTurnsOnField?: number; // Dùng cho Swords of Revealing Light (3 lượt)
  returnControlAtEndPhase?: boolean; // Dùng cho Change of Heart
}

export interface HandCardInstance {
  instanceId: string;
  cardId: string;
  owner: PlayerId;
}

export type PlayerId = 'host' | 'guest';

export type DuelPhase = 'DRAW' | 'STANDBY' | 'MAIN1' | 'BATTLE' | 'MAIN2' | 'END';

export interface PlayerState {
  id: PlayerId;
  name: string;
  avatar: string;
  lp: number;
  deck: HandCardInstance[];
  hand: HandCardInstance[];
  extraDeck: HandCardInstance[];
  graveyard: HandCardInstance[];
  monsterZones: (FieldCardInstance | null)[]; // 5 ô
  spellTrapZones: (FieldCardInstance | null)[]; // 5 ô
  fieldZone: FieldCardInstance | null; // 1 ô Field Spell
  normalSummonUsedThisTurn: boolean;
  attackLockedTurns: number; // Số lượt bị khóa tấn công bởi Swords of Revealing Light
}

export interface ChainResponseOption {
  instanceId: string;
  cardId: string;
  fromLocation: 'HAND' | 'FIELD';
  lpCost?: number;
}

export interface ChainLinkNode {
  chainNumber: number;
  kind: 'SUMMON' | 'ATTACK' | 'SPELL' | 'TRAP' | 'MONSTER_EFFECT' | 'HANDTRAP';
  actor: PlayerId;
  cardId: string;
  sourceInstanceId?: string;
  fromLocation: 'HAND' | 'FIELD' | 'GRAVEYARD';
  triggerType: EffectTrigger | 'SUMMON' | 'ATTACK';
  targetChainNumber?: number;
  targetCardId?: string;
  targetInstanceId?: string;
  targetPlayer?: PlayerId;
  extraTargetCardIds?: string[];
  lpDelta?: number;
  effectActionVi: string;
  detailVi: string;
  status: 'PENDING' | 'RESOLVED' | 'NEGATED';
  resultVi?: string;
}

export interface ResolvedChainRecord {
  id: string;
  titleVi: string;
  summaryVi: string;
  links: ChainLinkNode[];
  timestamp: number;
}

export interface PendingChainPrompt {
  responder: PlayerId;
  triggerType: 'ON_OPPONENT_SUMMON' | 'ON_OPPONENT_ATTACK' | 'ON_OPPONENT_TRAP';
  availableTrapInstanceIds: string[];
  availableResponses?: ChainResponseOption[];
  chainLinks?: ChainLinkNode[];
  attackerInstanceId?: string;
  attackTargetInstanceId?: string | 'DIRECT';
  summonedMonsterInstanceId?: string;
  activatedTrapInstanceId?: string;
  descriptionVi: string;
}

export interface PendingSelectionPrompt {
  player: PlayerId;
  sourceCardId?: string;
  sourceCardNameVi: string;
  selectionType:
    | 'DISCARD_HAND'
    | 'SPECIAL_SUMMON_HAND'
    | 'SEARCH_DECK'
    | 'SPECIAL_SUMMON_CANDIDATE'
    | 'MILL_DECK';
  candidateInstanceIds: string[];
  requiredCount: number;
  upToCount?: boolean;
  descriptionVi: string;
}

export interface DuelAnimationEvent {
  id: string;
  type:
    | 'DRAW'
    | 'SUMMON'
    | 'SET_CARD'
    | 'SPELL_ACTIVATE'
    | 'TRAP_ACTIVATE'
    | 'ATTACK'
    | 'DIRECT_ATTACK'
    | 'DESTROY'
    | 'HEAL'
    | 'DAMAGE';
  actor?: PlayerId;
  cardId?: string;
  targetCardId?: string;
  sourceInstanceId?: string;
  targetInstanceId?: string;
  targetPlayer?: PlayerId;
  lpDelta?: number;
  isDeclarationOnly?: boolean;
  messageVi: string;
  timestamp: number;
}

export interface DuelState {
  duelId: string;
  turnNumber: number;
  currentTurnPlayer: PlayerId;
  phase: DuelPhase;
  players: Record<PlayerId, PlayerState>;
  pendingChain: PendingChainPrompt | null;
  pendingSelection: PendingSelectionPrompt | null;
  pendingSelectionQueue?: PendingSelectionPrompt[];
  winner: PlayerId | 'DRAW' | null;
  winReasonVi: string | null;
  logs: string[];
  lastEvent: DuelAnimationEvent | null;
  recentEvents?: DuelAnimationEvent[];
  lastResolvedChain?: ResolvedChainRecord | null;
  recentResolvedChains?: ResolvedChainRecord[];
}

export type GameAction =
  | { type: 'NORMAL_SUMMON'; playerId: PlayerId; handInstanceId: string; position: 'ATTACK' | 'SET_DEFENSE'; tributeInstanceIds?: string[] }
  | { type: 'SPECIAL_SUMMON_FROM_HAND'; playerId: PlayerId; handInstanceId: string; discardInstanceIds?: string[] }
  | { type: 'CHANGE_POSITION'; playerId: PlayerId; fieldInstanceId: string }
  | { type: 'ACTIVATE_SPELL_OR_TRAP'; playerId: PlayerId; instanceId: string; fromLocation: 'HAND' | 'FIELD'; targetInstanceId?: string; fusionExtraInstanceId?: string }
  | { type: 'SET_SPELL_TRAP'; playerId: PlayerId; handInstanceId: string }
  | { type: 'DECLARE_ATTACK'; playerId: PlayerId; attackerInstanceId: string; targetInstanceId: string | 'DIRECT' }
  | { type: 'RESPOND_CHAIN'; playerId: PlayerId; activateTrapInstanceId: string | null }
  | { type: 'SUBMIT_SELECTION'; playerId: PlayerId; selectedInstanceIds: string[] }
  | { type: 'CHANGE_PHASE'; playerId: PlayerId; nextPhase: DuelPhase }
  | { type: 'SURRENDER'; playerId: PlayerId };

export interface SavedCustomDeck {
  id: string;
  name: string;
  avatarUrl: string;
  description?: string;
  mainDeck: string[];
  extraDeck: string[];
  updatedAt: number;
}

export interface ActiveDeckConfig {
  selectedDeckId: string;
  mainDeck: string[];
  extraDeck: string[];
  playerName?: string;
}

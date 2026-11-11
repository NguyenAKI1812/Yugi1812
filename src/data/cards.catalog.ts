import { ActiveDeckConfig, CardDefinition, SavedCustomDeck } from '../types/game';
import {
  BLUE_EYES_ARCHETYPE_CARDS,
  DARK_MAGICIAN_SPELLCASTER_CARDS,
  STAPLE_YDK_CARDS,
} from './archetypeCards';

/**
 * HỆ THỐNG DỮ LIỆU BÀI (DATA-DRIVEN CARD CATALOG)
 * ------------------------------------------------
 * Khi muốn thêm lá bài mới vào game, bạn CHỈ CẦN thêm 1 object vào mảng `BASE_CARDS` bên dưới
 * (hoặc dùng tính năng "Thêm Bài Mới" ngay trên giao diện game).
 * Không cần sửa bất kỳ dòng code nào trong DuelEngine, Bot AI hay Giao diện!
 */
export const BASE_CARDS: CardDefinition[] = [
  // ==========================================
  // 1. QUÁI THÚ CHỦ LỰC CẤP 7-8 (2 HIẾN TẾ)
  // ==========================================
  {
    id: 'blue_eyes_white_dragon',
    passcode: '89631139',
    altPasscodes: ['89631140', '89631141', '89631142', '89631143', '89631144', '89631145', '89631146'],
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes White Dragon',
    nameVi: 'Rồng Trắng Mắt Xanh',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 8,
    atk: 3000,
    def: 2500,
    descriptionVi: 'Huyền thoại rồng mang sức mạnh hủy diệt tối thượng. Cần hiến tế 2 quái thú để triệu hồi.',
  },
  {
    id: 'dark_magician',
    passcode: '46986414',
    altPasscodes: ['46986415', '46986416', '46986417', '46986418', '46986419', '36996508', '46986420', '46986421'],
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Magician',
    nameVi: 'Phù Thủy Áo Đen',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 7,
    atk: 2500,
    def: 2100,
    descriptionVi: 'Pháp sư tối thượng về cả tấn công lẫn phòng thủ. Cần hiến tế 2 quái thú để triệu hồi.',
  },
  {
    id: 'red_eyes_b_dragon',
    passcode: '74677422',
    altPasscodes: ['74677423', '74677424', '74677425', '74677426', '74677427'],
    archetypeTags: ['DRAGON'],
    name: 'Red-Eyes Black Dragon',
    nameVi: 'Rồng Đen Mắt Đỏ',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'DARK',
    race: 'Dragon',
    level: 7,
    atk: 2400,
    def: 2000,
    descriptionVi: 'Con rồng hung bạo với ngọn lửa đen giận dữ. Cần hiến tế 2 quái thú để triệu hồi.',
  },
  {
    id: 'gaia_the_fierce_knight',
    passcode: '06368038',
    name: 'Gaia The Fierce Knight',
    nameVi: 'Kỵ Sĩ Gaia',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'EARTH',
    race: 'Warrior',
    level: 7,
    atk: 2300,
    def: 2100,
    descriptionVi: 'Kỵ sĩ cưỡi chiến mã phi nhanh hơn gió. Cần hiến tế 2 quái thú để triệu hồi.',
  },

  // ==========================================
  // 2. QUÁI THÚ CẤP 5-6 (1 HIẾN TẾ)
  // ==========================================
  {
    id: 'summoned_skull',
    passcode: '70781052',
    altPasscodes: ['70781053', '70781054', '70781055'],
    name: 'Summoned Skull',
    nameVi: 'Triệu Hồi Tử Thần (Summoned Skull)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'DARK',
    race: 'Fiend',
    level: 6,
    atk: 2500,
    def: 1200,
    descriptionVi: 'Ác ma dùng sức mạnh bóng tối áp đảo kẻ thù. Chỉ cần hiến tế 1 quái thú mà có tới 2500 ATK.',
  },
  {
    id: 'dark_magician_girl',
    passcode: '38033121',
    altPasscodes: ['38033122', '38033123', '38033124', '38033125', '38033126'],
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Magician Girl',
    nameVi: 'Nữ Phù Thủy Áo Đen',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 6,
    atk: 2000,
    def: 1700,
    descriptionVi: 'Tăng thêm 300 ATK cho mỗi lá "Phù Thủy Áo Đen" (Dark Magician) đang ở dưới Mộ của cả 2 bên.',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: {
          atkDelta: 300,
          defDelta: 0,
          perCardInGY: ['dark_magician'],
        },
      },
    ],
  },
  {
    id: 'curse_of_dragon',
    passcode: '28279543',
    name: 'Curse of Dragon',
    nameVi: 'Rồng Xương (Curse of Dragon)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'DARK',
    race: 'Dragon',
    level: 5,
    atk: 2000,
    def: 1500,
    descriptionVi: 'Con rồng tà ác sử dụng sức mạnh bóng tối. Kết hợp với Kỵ Sĩ Gaia để dung hợp thành Kỵ Sĩ Rồng Gaia.',
  },
  {
    id: 'judge_man',
    passcode: '30113682',
    name: 'Judge Man',
    nameVi: 'Thẩm Phán Chiến Binh (Judge Man)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'EARTH',
    race: 'Warrior',
    level: 6,
    atk: 2200,
    def: 1500,
    descriptionVi: 'Chiến binh cầm chùy phán quyết không bao giờ tha thứ cho kẻ bại trận. Cần 1 hiến tế.',
  },

  // ==========================================
  // 3. QUÁI THÚ CẤP 1-4 (KHÔNG CẦN HIẾN TẾ)
  // ==========================================
  {
    id: 'alexandrite_dragon',
    passcode: '43096270',
    name: 'Alexandrite Dragon',
    nameVi: 'Rồng Ngọc Alexandrite',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 4,
    atk: 2000,
    def: 100,
    descriptionVi: 'Con rồng mang lớp vảy ngọc quý hiếm với sức tấn công lên tới 2000 điểm ở Cấp 4.',
  },
  {
    id: 'vorse_raider',
    passcode: '14898066',
    name: 'Vorse Raider',
    nameVi: 'Quái Thú Rìu Chiến (Vorse Raider)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'DARK',
    race: 'Beast-Warrior',
    level: 4,
    atk: 1900,
    def: 1200,
    descriptionVi: 'Ác thú khát máu cực kỳ thiện chiến của Kaiba với 1900 ATK.',
  },
  {
    id: 'gemini_elf',
    passcode: '69140098',
    archetypeTags: ['SPELLCASTER'],
    name: 'Gemini Elf',
    nameVi: 'Song Tử Tinh Linh (Gemini Elf)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'EARTH',
    race: 'Spellcaster',
    level: 4,
    atk: 1900,
    def: 900,
    descriptionVi: 'Cặp chị em tinh linh thay phiên nhau tung đòn tấn công ma thuật 1900 ATK.',
  },
  {
    id: 'la_jinn',
    passcode: '97590747',
    name: 'La Jinn the Mystical Genie of the Lamp',
    nameVi: 'Thần Đèn La Jinn',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'DARK',
    race: 'Fiend',
    level: 4,
    atk: 1800,
    def: 1000,
    descriptionVi: 'Thần đèn sở hữu sức mạnh cơ bắp tuyệt대 và tuyệt đối trung thành với chủ nhân.',
  },
  {
    id: '7_colored_fish',
    passcode: '23771716',
    name: '7 Colored Fish',
    nameVi: 'Cá Bảy Màu',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'WATER',
    race: 'Fish',
    level: 4,
    atk: 1800,
    def: 800,
    descriptionVi: 'Loài cá cầu vồng cực hiếm dưới đáy biển sâu với sức công 1800.',
  },
  {
    id: 'battle_ox',
    passcode: '05053103',
    name: 'Battle Ox',
    nameVi: 'Ngưu Ma Vương (Battle Ox)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'EARTH',
    race: 'Beast-Warrior',
    level: 4,
    atk: 1700,
    def: 1000,
    descriptionVi: 'Quái vật đầu trâu với sức mạnh khủng khiếp có thể bổ đôi kẻ địch bằng chiếc rìu khổng lồ.',
  },
  {
    id: 'neo_magic_swordsman',
    passcode: '50930991',
    archetypeTags: ['SPELLCASTER'],
    name: 'Neo the Magic Swordsman',
    nameVi: 'Kiếm Sĩ Phép Thuật Neo',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 4,
    atk: 1700,
    def: 1000,
    descriptionVi: 'Lãng khách du hành qua các chiều không gian, tinh thông cả kiếm thuật lẫn ma pháp.',
  },
  {
    id: 'rogue_doll',
    passcode: '91939608',
    archetypeTags: ['SPELLCASTER'],
    name: 'Rogue Doll',
    nameVi: 'Búp Bê Thánh Nữ (Rogue Doll)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 4,
    atk: 1600,
    def: 1000,
    descriptionVi: 'Búp bê mang sức mạnh thần thánh chuyên chiến đấu chống lại thế lực bóng tối.',
  },
  {
    id: 'celtic_guardian',
    passcode: '91152256',
    name: 'Celtic Guardian',
    nameVi: 'Kiếm Sĩ Tinh Linh (Celtic Guardian)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'EARTH',
    race: 'Warrior',
    level: 4,
    atk: 1400,
    def: 1200,
    descriptionVi: 'Chiến binh Elf với tốc độ vung kiếm chớp nhoáng làm kẻ địch bối rối.',
  },
  {
    id: 'mystical_elf',
    passcode: '15025844',
    archetypeTags: ['SPELLCASTER'],
    name: 'Mystical Elf',
    nameVi: 'Tinh Linh Ánh Sáng (Mystical Elf)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 4,
    atk: 800,
    def: 2000,
    descriptionVi: 'Tinh linh có vẻ ngoài dịu dàng nhưng sở hữu bức tường phòng thủ ma thuật lên tới 2000 DEF.',
  },
  {
    id: 'giant_soldier_of_stone',
    passcode: '13039848',
    name: 'Giant Soldier of Stone',
    nameVi: 'Chiến Binh Đá Khổng Lồ',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'EARTH',
    race: 'Rock',
    level: 3,
    atk: 1300,
    def: 2000,
    descriptionVi: 'Người khổng lồ bằng đá tảng với sức phòng thủ kiên cố 2000 DEF.',
  },
  {
    id: 'aqua_madoor',
    passcode: '85639257',
    archetypeTags: ['SPELLCASTER'],
    name: 'Aqua Madoor',
    nameVi: 'Pháp Sư Nước (Aqua Madoor)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'WATER',
    race: 'Spellcaster',
    level: 4,
    atk: 1200,
    def: 2000,
    descriptionVi: 'Pháp sư điều khiển dòng nước tạo ra bức tường băng dày không thể xuyên thủng (2000 DEF).',
  },

  // ==========================================
  // 4. QUÁI THÚ HIỆU ỨNG CỔ ĐIỂN (EFFECT / FLIP)
  // ==========================================
  {
    id: 'man_eater_bug',
    passcode: '54652250',
    name: 'Man-Eater Bug',
    nameVi: 'Bọ Ăn Thịt Người (Man-Eater Bug)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'EARTH',
    race: 'Insect',
    level: 2,
    atk: 450,
    def: 600,
    descriptionVi: 'LẬT (FLIP): Chọn 1 quái thú trên sân và tiêu diệt nó ngay lập tức.',
    effects: [
      {
        trigger: 'ON_FLIP',
        target: {
          location: 'FIELD_MONSTER',
          promptVi: 'Chọn 1 quái thú trên sân để Bọ Ăn Thịt Người tiêu diệt:',
        },
        actions: [{ type: 'DESTROY_TARGET' }],
      },
    ],
  },
  {
    id: 'wall_of_illusion',
    passcode: '13945283',
    name: 'Wall of Illusion',
    nameVi: 'Bức Tường Ảo Ảnh (Wall of Illusion)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Fiend',
    level: 4,
    atk: 1000,
    def: 1850,
    descriptionVi: 'Nếu quái thú này bị tấn công, sau khi tính sát thương, quái thú đã tấn công nó sẽ bị đẩy trả về tay chủ nhân.',
    effects: [
      {
        trigger: 'ON_BATTLE_END_SURVIVE',
        actions: [{ type: 'RETURN_ATTACKER_TO_HAND' }],
      },
    ],
  },
  {
    id: 'sangan',
    passcode: '26202165',
    archetypeTags: ['STAPLE'],
    name: 'Sangan',
    nameVi: 'Quái Vật Ba Mắt (Sangan)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Fiend',
    level: 3,
    atk: 1000,
    def: 600,
    descriptionVi: 'Khi lá bài này từ trên sân xuống Mộ: Lấy 1 quái thú có ATK ≤ 1500 từ Bộ bài của bạn lên tay.',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SEARCH_DECK_MONSTER_TO_HAND',
            maxAtkFilter: 1500,
          },
        ],
      },
    ],
  },
  {
    id: 'witch_of_the_black_forest',
    passcode: '78010363',
    archetypeTags: ['SPELLCASTER', 'STAPLE'],
    name: 'Witch of the Black Forest',
    nameVi: 'Phù Thủy Rừng Đen',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 4,
    atk: 1100,
    def: 1200,
    descriptionVi: 'Khi lá bài này từ trên sân xuống Mộ: Lấy 1 quái thú có DEF ≤ 1500 từ Bộ bài của bạn lên tay.',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SEARCH_DECK_MONSTER_TO_HAND',
            maxDefFilter: 1500,
          },
        ],
      },
    ],
  },
  {
    id: 'lord_of_d',
    passcode: '17985575',
    archetypeTags: ['BLUE_EYES', 'SPELLCASTER', 'DRAGON'],
    name: 'Lord of D.',
    nameVi: 'Chúa Tể Loài Rồng (Lord of D.)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 4,
    atk: 1200,
    def: 1100,
    descriptionVi: 'Chừng nào lá này còn ngửa trên sân, các quái thú hệ Rồng (Dragon) được bảo vệ và bạn có thể dùng Tiếng Sáo Gọi Rồng.',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: {
          atkDelta: 0,
          defDelta: 0,
          protectsRaceFromTargeting: ['Dragon'],
        },
      },
    ],
  },
  {
    id: 'herald_of_purple_light',
    passcode: '94689635',
    name: 'Herald of Purple Light',
    nameVi: 'Hộ Vệ Ánh Tím (Handtrap)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Fairy',
    level: 2,
    atk: 300,
    def: 500,
    descriptionVi:
      'HANDTRAP PHÁ BẪY: Khi đối phương kích hoạt 1 lá Bài Bẫy, có thể bỏ lá này từ trên tay xuống Mộ để vô hiệu hóa và phá hủy lá Bẫy đó ngay lập tức!',
    effects: [
      {
        trigger: 'ON_OPPONENT_TRAP',
        activateFromHand: true,
        actions: [{ type: 'NEGATE_AND_DESTROY_TRAP' }],
      },
    ],
  },
  {
    id: 'kuriboh',
    passcode: '40640057',
    altPasscodes: ['40640058', '40640059'],
    archetypeTags: ['STAPLE'],
    name: 'Kuriboh',
    nameVi: 'Kuriboh (Handtrap)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Fiend',
    level: 1,
    atk: 300,
    def: 200,
    descriptionVi:
      'HANDTRAP CHẶN ĐÒN: Khi quái thú đối phương tuyên bố tấn công, có thể bỏ lá này từ trên tay xuống Mộ để vô hiệu hóa đòn tấn công đó!',
    effects: [
      {
        trigger: 'ON_OPPONENT_ATTACK',
        activateFromHand: true,
        actions: [{ type: 'NEGATE_ATTACK' }],
      },
    ],
  },

  // ==========================================
  // 5. QUÁI THÚ DUNG HỢP (EXTRA DECK FUSION)
  // ==========================================
  {
    id: 'blue_eyes_ultimate_dragon',
    passcode: '23995346',
    altPasscodes: ['23995347', '23995348'],
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Ultimate Dragon',
    nameVi: 'Rồng Trắng Mắt Xanh Ba Đầu',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 12,
    atk: 4500,
    def: 3800,
    fusionMaterials: ['blue_eyes_white_dragon', 'blue_eyes_white_dragon', 'blue_eyes_white_dragon'],
    descriptionVi: '"Rồng Trắng Mắt Xanh" + "Rồng Trắng Mắt Xanh" + "Rồng Trắng Mắt Xanh". Sức tấn công tối thượng 4500!',
  },
  {
    id: 'b_skull_dragon',
    passcode: '11901678',
    name: 'B. Skull Dragon',
    nameVi: 'Rồng Đen Đầu Lâu Ác Ma',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Dragon',
    level: 9,
    atk: 3200,
    def: 2500,
    fusionMaterials: ['summoned_skull', 'red_eyes_b_dragon'],
    descriptionVi: '"Triệu Hồi Tử Thần" + "Rồng Đen Mắt Đỏ". Quái thú dung hợp mang sức mạnh 3200 ATK.',
  },
  {
    id: 'gaia_the_dragon_champion',
    passcode: '66889139',
    name: 'Gaia the Dragon Champion',
    nameVi: 'Kỵ Sĩ Rồng Gaia',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'WIND',
    race: 'Dragon',
    level: 7,
    atk: 2600,
    def: 2100,
    fusionMaterials: ['gaia_the_fierce_knight', 'curse_of_dragon'],
    descriptionVi: '"Kỵ Sĩ Gaia" + "Rồng Xương". Kỵ sĩ cưỡi rồng bay lượn trên bầu trời với 2600 ATK.',
  },

  // ==========================================
  // 6. BÀI PHÉP (SPELLS)
  // ==========================================
  {
    id: 'pot_of_greed',
    passcode: '55144522',
    archetypeTags: ['STAPLE'],
    name: 'Pot of Greed',
    nameVi: 'Chiếc Bình Tham Lam (Pot of Greed)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Rút 2 lá bài từ Bộ bài của bạn.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'DRAW_CARDS', value: 2 }],
      },
    ],
  },
  {
    id: 'graceful_charity',
    passcode: '79571449',
    archetypeTags: ['STAPLE'],
    name: 'Graceful Charity',
    nameVi: 'Sự Bố Thí Của Thiên Thần',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Rút 3 lá bài, sau đó chọn bỏ 2 lá bài trên tay xuống Mộ.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          { type: 'DRAW_CARDS', value: 3 },
          { type: 'DISCARD_FROM_HAND', value: 2 },
        ],
      },
    ],
  },
  {
    id: 'monster_reborn',
    passcode: '83764718',
    altPasscodes: ['83764719'],
    archetypeTags: ['BLUE_EYES', 'DARK_MAGICIAN', 'STAPLE'],
    name: 'Monster Reborn',
    nameVi: 'Hồi Sinh Quái Thú (Monster Reborn)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Chọn 1 quái thú ở dưới Mộ của bạn hoặc đối phương; Triệu hồi Đặc biệt nó lên sân của bạn.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireMonsterInAnyGY: true },
        target: {
          location: 'EITHER_GRAVEYARD_MONSTER',
          promptVi: 'Chọn 1 quái thú dưới Mộ (của bạn hoặc đối phương) để Hồi Sinh:',
        },
        actions: [{ type: 'REVIVE_TARGET_FROM_GY' }],
      },
    ],
  },
  {
    id: 'raigeki',
    passcode: '12580477',
    archetypeTags: ['STAPLE'],
    name: 'Raigeki',
    nameVi: 'Sấm Sét Hủy Diệt (Raigeki)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Tiêu diệt toàn bộ quái thú trên sân của đối phương.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS' }],
      },
    ],
  },
  {
    id: 'dark_hole',
    passcode: '53129443',
    archetypeTags: ['STAPLE'],
    name: 'Dark Hole',
    nameVi: 'Hố Đen Vũ Trụ (Dark Hole)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Tiêu diệt toàn bộ quái thú trên cả hai sân.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireAnyMonsterOnField: true },
        actions: [{ type: 'DESTROY_ALL_MONSTERS' }],
      },
    ],
  },
  {
    id: 'fissure',
    passcode: '66788016',
    name: 'Fissure',
    nameVi: 'Khe Nứt Địa Ngục (Fissure)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Tiêu diệt 1 quái thú ngửa có ATK thấp nhất trên sân đối phương.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireOpponentFaceUpMonster: true },
        actions: [{ type: 'DESTROY_LOWEST_ATK_OPPONENT_MONSTER' }],
      },
    ],
  },
  {
    id: 'mystical_space_typhoon',
    passcode: '05318639',
    archetypeTags: ['STAPLE'],
    name: 'Mystical Space Typhoon',
    nameVi: 'Bão Không Gian (MST)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi: 'Chọn 1 lá bài Phép hoặc Bẫy trên sân; tiêu diệt lá bài đó.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireSpellTrapOnField: true },
        target: {
          location: 'FIELD_SPELL_TRAP',
          promptVi: 'Chọn 1 lá Phép hoặc Bẫy trên sân để phá hủy:',
        },
        actions: [{ type: 'DESTROY_TARGET' }],
      },
    ],
  },
  {
    id: 'heavy_storm',
    passcode: '19613556',
    name: 'Heavy Storm',
    nameVi: 'Bão Lớn Quét Sạch (Heavy Storm)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Phá hủy toàn bộ các lá bài Phép và Bẫy đang có trên sân của cả 2 người chơi.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireSpellTrapOnField: true },
        actions: [{ type: 'DESTROY_ALL_SPELLS_TRAPS' }],
      },
    ],
  },
  {
    id: 'swords_of_revealing_light',
    passcode: '72302403',
    name: 'Swords of Revealing Light',
    nameVi: 'Kiếm Ánh Sáng Phong Ấn',
    category: 'SPELL',
    subType: 'CONTINUOUS',
    descriptionVi: 'Lật ngửa toàn bộ quái thú đối phương. Lưu lại trên sân 3 lượt của đối phương và khóa không cho quái thú đối phương tuyên bố tấn công.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          { type: 'FLIP_ALL_OPPONENT_MONSTERS_FACE_UP' },
          { type: 'LOCK_OPPONENT_ATTACKS_TURNS', value: 3 },
        ],
      },
    ],
  },
  {
    id: 'change_of_heart',
    passcode: '04031928',
    name: 'Change of Heart',
    nameVi: 'Thay Lòng Đổi Dạ (Change of Heart)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Chọn 1 quái thú của đối phương; giành quyền điều khiển nó cho đến hết lượt này (có thể dùng để tấn công hoặc hiến tế!).',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OPPONENT_MONSTER',
          promptVi: 'Chọn 1 quái thú của đối phương để điều khiển trong lượt này:',
        },
        actions: [{ type: 'TAKE_CONTROL_UNTIL_END_PHASE' }],
      },
    ],
  },
  {
    id: 'polymerization',
    passcode: '24094653',
    altPasscodes: ['27847700'],
    archetypeTags: ['BLUE_EYES', 'DARK_MAGICIAN', 'STAPLE'],
    name: 'Polymerization',
    nameVi: 'Dung Hợp (Polymerization)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Dung hợp các quái thú nguyên liệu trên tay hoặc trên sân của bạn để Triệu hồi Dung hợp 1 quái thú từ Extra Deck.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'FUSION_SUMMON' }],
      },
    ],
  },
  {
    id: 'flute_of_summoning_dragon',
    passcode: '43973174',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'The Flute of Summoning Dragon',
    nameVi: 'Tiếng Sáo Gọi Rồng',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Kích hoạt khi có "Chúa Tể Loài Rồng" (Lord of D.) ngửa trên sân: Triệu hồi Đặc biệt tối đa 2 quái thú hệ Rồng từ trên tay của bạn.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          requireFaceUpCardCode: 'lord_of_d',
          requireDragonInHand: true,
        },
        actions: [
          {
            type: 'SPECIAL_SUMMON_HAND_MONSTERS',
            raceFilter: ['Dragon'],
            maxSummonCount: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'axe_of_despair',
    passcode: '40619825',
    name: 'Axe of Despair',
    nameVi: 'Rìu Tuyệt Vọng (+1000 ATK)',
    category: 'SPELL',
    subType: 'EQUIP',
    descriptionVi: 'Trang bị cho 1 quái thú ngửa trên sân. Quái thú đó được tăng thêm 1000 ATK.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'FIELD_MONSTER',
          faceUpOnly: true,
          promptVi: 'Chọn 1 quái thú ngửa để trang bị Rìu Tuyệt Vọng (+1000 ATK):',
        },
        actions: [{ type: 'EQUIP_TO_TARGET' }],
      },
      {
        trigger: 'CONTINUOUS_EQUIP',
        continuous: {
          atkDelta: 1000,
          defDelta: 0,
        },
      },
    ],
  },
  {
    id: 'horn_of_the_unicorn',
    passcode: '64047146',
    name: 'Horn of the Unicorn',
    nameVi: 'Sừng Kỳ Lân (+700 ATK/DEF)',
    category: 'SPELL',
    subType: 'EQUIP',
    descriptionVi: 'Trang bị cho 1 quái thú ngửa trên sân. Quái thú đó được tăng thêm 700 ATK và 700 DEF.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'FIELD_MONSTER',
          faceUpOnly: true,
          promptVi: 'Chọn 1 quái thú ngửa để trang bị Sừng Kỳ Lân (+700 ATK/DEF):',
        },
        actions: [{ type: 'EQUIP_TO_TARGET' }],
      },
      {
        trigger: 'CONTINUOUS_EQUIP',
        continuous: {
          atkDelta: 700,
          defDelta: 700,
        },
      },
    ],
  },
  {
    id: 'yami',
    passcode: '59197169',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Yami',
    nameVi: 'Môi Trường Bóng Tối (Yami)',
    category: 'SPELL',
    subType: 'FIELD',
    descriptionVi: 'Tất cả quái thú hệ Phù Thủy (Spellcaster) và Ác Quỷ (Fiend) trên sân được tăng 200 ATK/DEF.',
    effects: [
      {
        trigger: 'CONTINUOUS_FIELD',
        continuous: {
          affectedRaces: ['Spellcaster', 'Fiend'],
          atkDelta: 200,
          defDelta: 200,
        },
      },
    ],
  },
  {
    id: 'mountain',
    passcode: '50913601',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Mountain',
    nameVi: 'Môi Trường Đỉnh Núi (Mountain)',
    category: 'SPELL',
    subType: 'FIELD',
    descriptionVi: 'Tất cả quái thú hệ Rồng (Dragon) và Điểu Thú (Winged Beast) trên sân được tăng 200 ATK/DEF.',
    effects: [
      {
        trigger: 'CONTINUOUS_FIELD',
        continuous: {
          affectedRaces: ['Dragon', 'Winged Beast'],
          atkDelta: 200,
          defDelta: 200,
        },
      },
    ],
  },
  {
    id: 'sogen',
    passcode: '86318356',
    name: 'Sogen',
    nameVi: 'Môi Trường Thảo Nguyên (Sogen)',
    category: 'SPELL',
    subType: 'FIELD',
    descriptionVi: 'Tất cả quái thú hệ Chiến Binh (Warrior) và Thú Chiến Binh (Beast-Warrior) trên sân được tăng 200 ATK/DEF.',
    effects: [
      {
        trigger: 'CONTINUOUS_FIELD',
        continuous: {
          affectedRaces: ['Warrior', 'Beast-Warrior'],
          atkDelta: 200,
          defDelta: 200,
        },
      },
    ],
  },
  {
    id: 'dian_keto',
    passcode: '84257639',
    name: 'Dian Keto the Cure Master',
    nameVi: 'Thần Dược Dian Keto (+1000 LP)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Hồi phục 1000 Điểm Gốc (LP) cho bạn.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'HEAL_LP', value: 1000, targetSide: 'SELF' }],
      },
    ],
  },
  {
    id: 'ookazi',
    passcode: '19523799',
    name: 'Ookazi',
    nameVi: 'Cầu Lửa Ookazi (-800 LP)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Gây 800 sát thương trực tiếp vào Điểm Gốc (LP) của đối phương.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'DAMAGE_LP', value: 800, targetSide: 'OPPONENT' }],
      },
    ],
  },
  {
    id: 'stop_defense',
    passcode: '63102017',
    name: 'Stop Defense',
    nameVi: 'Phá Vỡ Phòng Thủ (Stop Defense)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Chọn 1 quái thú ở thế Thủ của đối phương; chuyển nó sang thế Tấn công ngửa.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OPPONENT_MONSTER',
          promptVi: 'Chọn 1 quái thú của đối phương để ép chuyển sang thế Tấn Công:',
        },
        actions: [{ type: 'CHANGE_TARGET_POSITION' }],
      },
    ],
  },

  // ==========================================
  // 7. BÀI BẪY (TRAPS)
  // ==========================================
  {
    id: 'mirror_force',
    passcode: '44095762',
    archetypeTags: ['STAPLE'],
    name: 'Mirror Force',
    nameVi: 'Giáp Phản Công (Mirror Force)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi: 'Khi quái thú đối phương tuyên bố tấn công: Tiêu diệt toàn bộ quái thú ở thế Tấn công của đối phương.',
    effects: [
      {
        trigger: 'ON_OPPONENT_ATTACK',
        actions: [
          { type: 'NEGATE_ATTACK' },
          { type: 'DESTROY_OPPONENT_ATTACK_POS_MONSTERS' },
        ],
      },
    ],
  },
  {
    id: 'magic_cylinder',
    passcode: '62279055',
    name: 'Magic Cylinder',
    nameVi: 'Ống Trụ Ma Thuật (Magic Cylinder)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi: 'Khi quái thú đối phương tuyên bố tấn công: Vô hiệu hóa đòn tấn công đó, và gây sát thương vào LP đối phương bằng đúng ATK của quái thú tấn công.',
    effects: [
      {
        trigger: 'ON_OPPONENT_ATTACK',
        actions: [
          { type: 'NEGATE_ATTACK' },
          { type: 'DAMAGE_LP_BY_ATTACKER_ATK' },
        ],
      },
    ],
  },
  {
    id: 'sakuretsu_armor',
    passcode: '56120475',
    name: 'Sakuretsu Armor',
    nameVi: 'Áo Giáp Phá Hủy (Sakuretsu Armor)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi: 'Khi quái thú đối phương tuyên bố tấn công: Tiêu diệt chính quái thú đang tấn công đó.',
    effects: [
      {
        trigger: 'ON_OPPONENT_ATTACK',
        actions: [
          { type: 'NEGATE_ATTACK' },
          { type: 'DESTROY_ATTACKING_MONSTER' },
        ],
      },
    ],
  },
  {
    id: 'negate_attack',
    passcode: '14315573',
    name: 'Negate Attack',
    nameVi: 'Vô Hiệu Đòn Tấn Công (Negate Attack)',
    category: 'TRAP',
    subType: 'COUNTER',
    descriptionVi: 'Khi quái thú đối phương tuyên bố tấn công: Vô hiệu hóa đòn tấn công và kết thúc luôn Battle Phase.',
    effects: [
      {
        trigger: 'ON_OPPONENT_ATTACK',
        actions: [
          { type: 'NEGATE_ATTACK' },
          { type: 'END_BATTLE_PHASE' },
        ],
      },
    ],
  },
  {
    id: 'trap_hole',
    passcode: '04206964',
    name: 'Trap Hole',
    nameVi: 'Hố Bẫy Tử Thần (Trap Hole)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi: 'Khi đối phương vừa Triệu hồi Thường/Lật 1 quái thú có ATK ≥ 1000: Tiêu diệt quái thú đó.',
    effects: [
      {
        trigger: 'ON_OPPONENT_SUMMON',
        condition: {
          minTriggerMonsterAtk: 1000,
        },
        actions: [{ type: 'DESTROY_TRIGGER_MONSTER' }],
      },
    ],
  },
  {
    id: 'call_of_the_haunted',
    passcode: '97077563',
    name: 'Call of the Haunted',
    nameVi: 'Tiếng Gọi Linh Hồn (Call of the Haunted)',
    category: 'TRAP',
    subType: 'CONTINUOUS',
    descriptionVi: 'Kích hoạt bằng cách chọn 1 quái thú trong Mộ của bạn; Triệu hồi Đặc biệt nó ở thế Tấn công.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_GRAVEYARD_MONSTER',
          promptVi: 'Chọn 1 quái thú trong Mộ của bạn để hồi sinh bằng Tiếng Gọi Linh Hồn:',
        },
        actions: [{ type: 'REVIVE_TARGET_FROM_GY' }],
      },
    ],
  },
  {
    id: 'red_reboot',
    passcode: '23002292',
    name: 'Red Reboot',
    nameVi: 'Tái Khởi Động Đỏ (Red Reboot)',
    category: 'TRAP',
    subType: 'COUNTER',
    descriptionVi:
      'HANDTRAP PHÁ BẪY: Khi đối phương kích hoạt Bài Bẫy, có thể kích hoạt trực tiếp từ trên tay (trả một nửa LP) hoặc đang Úp trên sân để vô hiệu hóa & phá hủy lá Bẫy đó!',
    effects: [
      {
        trigger: 'ON_OPPONENT_TRAP',
        activateFromHand: true,
        condition: {
          halfLpCost: true,
        },
        actions: [{ type: 'NEGATE_AND_DESTROY_TRAP' }],
      },
    ],
  },
  {
    id: 'seven_tools_of_the_bandit',
    passcode: '03819470',
    name: 'Seven Tools of the Bandit',
    nameVi: 'Bảy Bảo Bối Đạo Tặc (Seven Tools)',
    category: 'TRAP',
    subType: 'COUNTER',
    descriptionVi:
      'Bẫy Phản Đòn kinh điển: Khi đối phương kích hoạt 1 lá Bài Bẫy, trả 1000 LP để vô hiệu hóa và phá hủy lá Bẫy đó.',
    effects: [
      {
        trigger: 'ON_OPPONENT_TRAP',
        condition: {
          lpCost: 1000,
        },
        actions: [{ type: 'NEGATE_AND_DESTROY_TRAP' }],
      },
    ],
  },
  ...BLUE_EYES_ARCHETYPE_CARDS,
  ...DARK_MAGICIAN_SPELLCASTER_CARDS,
  ...STAPLE_YDK_CARDS,
];

const CUSTOM_CARDS_STORAGE_KEY = 'yugioh_h5_custom_cards_v1';
const CUSTOM_DECKS_STORAGE_KEY = 'yugioh_h5_custom_decks_v1';
const ACTIVE_DECK_STORAGE_KEY = 'yugioh_h5_active_deck_v1';

let cachedCustomRaw: string | null = null;
let cachedCustomList: CardDefinition[] | null = null;

function safeGetStorageItem(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // ignore storage quota errors
  }
}

export function normalizePasscode(passcode: string): string {
  const digits = String(passcode || '').trim().replace(/^0+/, '');
  return digits || '0';
}

export function getCustomCards(): CardDefinition[] {
  try {
    const raw = safeGetStorageItem(CUSTOM_CARDS_STORAGE_KEY);
    if (!raw) {
      cachedCustomRaw = null;
      cachedCustomList = [];
      return [];
    }
    if (raw === cachedCustomRaw && cachedCustomList) {
      return cachedCustomList;
    }
    const parsed = JSON.parse(raw) as CardDefinition[];
    cachedCustomRaw = raw;
    cachedCustomList = Array.isArray(parsed) ? parsed : [];
    return cachedCustomList;
  } catch {
    return [];
  }
}

export function saveCustomCard(card: CardDefinition): CardDefinition[] {
  return saveCustomCardsBulk([card]);
}

export function saveCustomCardsBulk(cards: CardDefinition[]): CardDefinition[] {
  if (cards.length === 0) return getCustomCards();
  const map = new Map<string, CardDefinition>();
  for (const existing of getCustomCards()) {
    map.set(existing.id, existing);
  }
  for (const incoming of cards) {
    if (incoming?.id) {
      map.set(incoming.id, incoming);
    }
  }
  const updated = Array.from(map.values());
  const raw = JSON.stringify(updated);
  safeSetStorageItem(CUSTOM_CARDS_STORAGE_KEY, raw);
  cachedCustomRaw = raw;
  cachedCustomList = updated;
  return updated;
}

export function deleteCustomCard(cardId: string): CardDefinition[] {
  const updated = getCustomCards().filter((c) => c.id !== cardId);
  const raw = JSON.stringify(updated);
  safeSetStorageItem(CUSTOM_CARDS_STORAGE_KEY, raw);
  cachedCustomRaw = raw;
  cachedCustomList = updated;
  return updated;
}

export function getAllCards(): CardDefinition[] {
  const custom = getCustomCards();
  const baseIds = new Set(BASE_CARDS.map((c) => c.id));
  return [...BASE_CARDS, ...custom.filter((c) => !baseIds.has(c.id))];
}

export function getCardById(cardId: string): CardDefinition | undefined {
  return getAllCards().find((c) => c.id === cardId);
}

export function getCardByPasscode(passcode: string): CardDefinition | undefined {
  const norm = normalizePasscode(passcode);
  if (!norm || norm === '0') return undefined;
  const all = getAllCards();
  return (
    all.find((c) => normalizePasscode(c.passcode) === norm) ||
    all.find((c) => c.altPasscodes?.some((ap) => normalizePasscode(ap) === norm))
  );
}

const KONAMI_ERRATA_ALIASES: Record<string, string> = {
  'black skull dragon': 'b_skull_dragon',
};

export function getCardByExactName(name: string): CardDefinition | undefined {
  const clean = name.trim().toLowerCase();
  if (!clean) return undefined;
  const all = getAllCards();
  const aliasId = KONAMI_ERRATA_ALIASES[clean];
  if (aliasId) {
    const aliased = all.find((c) => c.id === aliasId);
    if (aliased) return aliased;
  }
  return all.find(
    (c) =>
      c.name.toLowerCase() === clean ||
      c.nameVi.toLowerCase() === clean ||
      getShortCardTitle(c).toLowerCase() === clean
  );
}

export function getSavedCustomDecks(): SavedCustomDeck[] {
  try {
    const raw = safeGetStorageItem(CUSTOM_DECKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedCustomDeck[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomDeck(deck: SavedCustomDeck): SavedCustomDeck[] {
  const existing = getSavedCustomDecks().filter((d) => d.id !== deck.id);
  const updated = [{ ...deck, updatedAt: deck.updatedAt || Date.now() }, ...existing];
  safeSetStorageItem(CUSTOM_DECKS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteCustomDeck(deckId: string): SavedCustomDeck[] {
  const updated = getSavedCustomDecks().filter((d) => d.id !== deckId);
  safeSetStorageItem(CUSTOM_DECKS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getActiveDeckConfig(): ActiveDeckConfig | null {
  try {
    const raw = safeGetStorageItem(ACTIVE_DECK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveDeckConfig;
    if (!parsed || !Array.isArray(parsed.mainDeck) || !Array.isArray(parsed.extraDeck)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveDeckConfig(config: ActiveDeckConfig): void {
  safeSetStorageItem(ACTIVE_DECK_STORAGE_KEY, JSON.stringify(config));
}

/**
 * GÓI BÀI MỞ RỘNG CỔ ĐIỂN (CLASSIC EXPANSION PACK - 16 LÁ KINH ĐIỂN)
 * Cho phép người chơi mở khóa thêm 16 lá bài kinh điển chỉ bằng 1 click trong Card Studio.
 */
export const CLASSIC_EXPANSION_PACK: CardDefinition[] = [
  {
    id: 'luster_dragon',
    passcode: '11091375',
    name: 'Luster Dragon',
    nameVi: 'Rồng Ngọc Bích (Luster Dragon)',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'WIND',
    race: 'Dragon',
    level: 4,
    atk: 1900,
    def: 1600,
    descriptionVi: 'Con rồng toàn thân phủ ngọc bích xanh lấp lánh. Cấp 4 với 1900 ATK cực mạnh, không cần hiến tế.',
  },
  {
    id: 'archfiend_soldier',
    passcode: '49881766',
    name: 'Archfiend Soldier',
    nameVi: 'Chiến Binh Ác Ma',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'DARK',
    race: 'Fiend',
    level: 4,
    atk: 1900,
    def: 1500,
    descriptionVi: 'Tinh binh tinh nhuệ của đội quân Ác Ma với sức công 1900 ở Cấp 4.',
  },
  {
    id: 'cyber_tech_alligator',
    passcode: '48766543',
    name: 'Cyber-Tech Alligator',
    nameVi: 'Cá Sấu Cơ Khí Cyber-Tech',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'WIND',
    race: 'Machine',
    level: 5,
    atk: 2500,
    def: 1600,
    descriptionVi: 'Quái thú máy móc Cấp 5 chỉ cần 1 hiến tế nhưng sở hữu tới 2500 ATK.',
  },
  {
    id: 'frostosaurus',
    passcode: '06631034',
    name: 'Frostosaurus',
    nameVi: 'Khủng Long Băng Giá',
    category: 'MONSTER',
    subType: 'NORMAL',
    attribute: 'WATER',
    race: 'Dinosaur',
    level: 6,
    atk: 2600,
    def: 1700,
    descriptionVi: 'Quái thú Cấp 6 sở hữu 2600 ATK vượt trội với chỉ 1 lần hiến tế.',
  },
  {
    id: 'night_assailant',
    passcode: '16226786',
    name: 'Night Assailant',
    nameVi: 'Sát Thủ Màn Đêm',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Fiend',
    level: 3,
    atk: 200,
    def: 500,
    descriptionVi: 'FLIP: Khi lá bài này lật ngửa, tiêu diệt 1 quái thú trên sân đối phương.',
    effects: [
      {
        trigger: 'ON_FLIP',
        target: {
          location: 'OPPONENT_MONSTER',
          promptVi: 'Chọn 1 quái thú đối phương để tiêu diệt:',
        },
        actions: [{ type: 'DESTROY_TARGET' }],
      },
    ],
  },
  {
    id: 'hane_hane',
    passcode: '07089711',
    name: 'Hane-Hane',
    nameVi: 'Chuột Lông Vũ (Hane-Hane)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'EARTH',
    race: 'Beast',
    level: 2,
    atk: 450,
    def: 500,
    descriptionVi: 'FLIP: Đẩy 1 quái thú trên sân quay trở về tay chủ sở hữu của nó.',
    effects: [
      {
        trigger: 'ON_FLIP',
        target: {
          location: 'FIELD_MONSTER',
          promptVi: 'Chọn 1 quái thú trên sân để đẩy về tay:',
        },
        actions: [{ type: 'RETURN_TARGET_TO_HAND' }],
      },
    ],
  },
  {
    id: 'swift_scarecrow',
    passcode: '18964575',
    name: 'Swift Scarecrow',
    nameVi: 'Bù Nhìn Tốc Độ (Handtrap)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'EARTH',
    race: 'Machine',
    level: 1,
    atk: 0,
    def: 0,
    descriptionVi:
      'HANDTRAP: Khi quái thú đối phương tuyên bố tấn công, bỏ lá này từ trên tay xuống Mộ để vô hiệu đòn đánh và kết thúc ngay Battle Phase!',
    effects: [
      {
        trigger: 'ON_OPPONENT_ATTACK',
        activateFromHand: true,
        actions: [{ type: 'END_BATTLE_PHASE' }],
      },
    ],
  },
  {
    id: 'upstart_goblin',
    passcode: '70368879',
    name: 'Upstart Goblin',
    nameVi: 'Yêu Tinh Hào Phóng (Upstart Goblin)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Rút 1 lá bài lên tay, sau đó đối phương được hồi +1000 LP. Rất tốt để nén bộ bài 40 lá.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          { type: 'DRAW_CARDS', value: 1 },
          { type: 'HEAL_LP', value: 1000, targetSide: 'OPPONENT' },
        ],
      },
    ],
  },
  {
    id: 'tremendous_fire',
    passcode: '46918794',
    name: 'Tremendous Fire',
    nameVi: 'Hỏa Ngục Bùng Cháy (Tremendous Fire)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Gây 1000 sát thương vào LP đối phương và bạn nhận 500 sát thương.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          { type: 'DAMAGE_LP', value: 1000, targetSide: 'OPPONENT' },
          { type: 'DAMAGE_LP', value: 500, targetSide: 'SELF' },
        ],
      },
    ],
  },
  {
    id: 'brain_control',
    passcode: '87910978',
    name: 'Brain Control',
    nameVi: 'Kiểm Soát Tâm Trí (Brain Control)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Trả 800 LP để chọn và chiếm quyền điều khiển 1 quái thú đang ngửa của đối phương cho đến hết lượt.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          lpCost: 800,
          requireOpponentFaceUpMonster: true,
        },
        target: {
          location: 'OPPONENT_MONSTER',
          faceUpOnly: true,
          promptVi: 'Chọn 1 quái thú đang ngửa của đối phương để chiếm quyền điều khiển (tốn 800 LP):',
        },
        actions: [{ type: 'TAKE_CONTROL_UNTIL_END_PHASE' }],
      },
    ],
  },
  {
    id: 'malevolent_nuzzler',
    passcode: '99597615',
    name: 'Malevolent Nuzzler',
    nameVi: 'Dây Chuyền Ác Mộng',
    category: 'SPELL',
    subType: 'EQUIP',
    descriptionVi: 'Quái thú được trang bị lá bài này nhận thêm +700 ATK.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'FIELD_MONSTER',
          faceUpOnly: true,
          promptVi: 'Chọn 1 quái thú ngửa để trang bị (+700 ATK):',
        },
        actions: [{ type: 'EQUIP_TO_TARGET' }],
      },
      {
        trigger: 'CONTINUOUS_EQUIP',
        continuous: { atkDelta: 700, defDelta: 0 },
      },
    ],
  },
  {
    id: 'dust_tornado',
    passcode: '60082869',
    name: 'Dust Tornado',
    nameVi: 'Cơn Lốc Bụi (Dust Tornado)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi: 'Chọn và phá hủy 1 lá Bài Phép hoặc Bài Bẫy đang có trên sân.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireSpellTrapOnField: true },
        target: {
          location: 'FIELD_SPELL_TRAP',
          promptVi: 'Chọn 1 lá Bài Phép / Bài Bẫy trên sân để phá hủy:',
        },
        actions: [{ type: 'DESTROY_TARGET' }],
      },
    ],
  },
  {
    id: 'bottomless_trap_hole',
    passcode: '29401950',
    name: 'Bottomless Trap Hole',
    nameVi: 'Hố Bẫy Không Đáy',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi: 'Khi đối phương triệu hồi quái thú có từ 1500 ATK trở lên: Phá hủy ngay quái thú đó!',
    effects: [
      {
        trigger: 'ON_OPPONENT_SUMMON',
        condition: { minTriggerMonsterAtk: 1500 },
        actions: [{ type: 'DESTROY_TRIGGER_MONSTER' }],
      },
    ],
  },
  {
    id: 'torrential_tribute',
    passcode: '53582587',
    name: 'Torrential Tribute',
    nameVi: 'Lũ Lụt Hủy Diệt (Torrential Tribute)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi: 'Khi đối phương triệu hồi quái thú: Quét sạch toàn bộ quái thú đang có trên cả 2 sân!',
    effects: [
      {
        trigger: 'ON_OPPONENT_SUMMON',
        actions: [{ type: 'DESTROY_ALL_MONSTERS' }],
      },
    ],
  },
  {
    id: 'compulsory_evacuation_device',
    passcode: '94192409',
    name: 'Compulsory Evacuation Device',
    nameVi: 'Thiết Bị Trục Xuất Khẩn Cấp',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi: 'Chọn 1 quái thú trên sân và đẩy ngay nó quay trở về tay chủ nhân (quái Dung Hợp về Extra Deck).',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireAnyMonsterOnField: true },
        target: {
          location: 'FIELD_MONSTER',
          promptVi: 'Chọn 1 quái thú trên sân để đẩy về tay:',
        },
        actions: [{ type: 'RETURN_TARGET_TO_HAND' }],
      },
    ],
  },
  {
    id: 'solemn_judgment',
    passcode: '41420027',
    archetypeTags: ['STAPLE'],
    name: 'Solemn Judgment',
    nameVi: 'Lời Phán Quyết Thần Thánh (Solemn)',
    category: 'TRAP',
    subType: 'COUNTER',
    descriptionVi:
      'Bẫy Phản Đòn tối thượng: Trả 1 nửa LP hiện tại để vô hiệu & phá hủy Triệu hồi quái thú HOẶC Bài Bẫy của đối phương!',
    effects: [
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
    ],
  },
];

/**
 * Rút gọn tên hiển thị trên mặt lá bài:
 * Bỏ phần giải thích trong ngoặc (...) vốn gây tràn chữ & xuất hiện '...'
 * (Tên tiếng Anh đầy đủ & hiệu ứng chi tiết vẫn hiện khi di chuột soi bài)
 */
export function getShortCardTitle(card: Pick<CardDefinition, 'name' | 'nameVi'>): string {
  const cleanedVi = card.nameVi.replace(/\s*\([^)]*\)/g, '').trim();
  return cleanedVi || card.name || card.nameVi;
}

/**
 * Tự động lấy link ảnh Artwork cắt sẵn (phù hợp hiển thị trên bàn đấu kiểu YugiH5)
 */
export function getCardArtUrl(card: CardDefinition): string {
  if (card.customImageUrl) return card.customImageUrl;
  const cleanCode = card.passcode.replace(/^0+/, '');
  return `https://images.ygoprodeck.com/images/cards_cropped/${cleanCode}.jpg`;
}

/**
 * Tự động lấy link ảnh Nguyên Thẻ Bài Konami HD
 */
export function getCardFullImageUrl(card: CardDefinition): string {
  if (card.customImageUrl) return card.customImageUrl;
  const cleanCode = card.passcode.replace(/^0+/, '');
  return `https://images.ygoprodeck.com/images/cards/${cleanCode}.jpg`;
}

export interface PresetDeck {
  id: string;
  name: string;
  shortLabel?: string;
  character: string;
  avatarUrl: string;
  description: string;
  mainDeck: string[];
  extraDeck: string[];
}

export const PRESET_DECKS: PresetDeck[] = [
  {
    id: 'yugi_starter',
    name: 'Bộ Bài Yugi Muto (Phù Thủy & Ác Quỷ)',
    shortLabel: 'Yugi Cổ Điển',
    character: 'Yugi Muto',
    avatarUrl: 'https://images.ygoprodeck.com/images/cards_cropped/46986414.jpg',
    description: 'Sự kết hợp giữa Phù Thủy Áo Đen, Summoned Skull, Kỵ Sĩ Rồng Gaia và những lá Bẫy lật kèo kinh điển.',
    mainDeck: [
      // Quái cấp cao (6)
      'dark_magician',
      'dark_magician',
      'dark_magician_girl',
      'summoned_skull',
      'summoned_skull',
      'gaia_the_fierce_knight',
      'curse_of_dragon',
      // Quái cấp 1-4 (14)
      'gemini_elf',
      'gemini_elf',
      'neo_magic_swordsman',
      'neo_magic_swordsman',
      'celtic_guardian',
      'celtic_guardian',
      'mystical_elf',
      'giant_soldier_of_stone',
      'man_eater_bug',
      'man_eater_bug',
      'wall_of_illusion',
      'sangan',
      'witch_of_the_black_forest',
      'herald_of_purple_light',
      'kuriboh',
      // Phép (13)
      'pot_of_greed',
      'graceful_charity',
      'monster_reborn',
      'dark_hole',
      'raigeki',
      'fissure',
      'mystical_space_typhoon',
      'swords_of_revealing_light',
      'change_of_heart',
      'polymerization',
      'yami',
      'horn_of_the_unicorn',
      'dian_keto',
      // Bẫy & Phá Bẫy (9)
      'mirror_force',
      'magic_cylinder',
      'sakuretsu_armor',
      'trap_hole',
      'trap_hole',
      'negate_attack',
      'call_of_the_haunted',
      'red_reboot',
      'seven_tools_of_the_bandit',
    ],
    extraDeck: ['gaia_the_dragon_champion', 'b_skull_dragon'],
  },
  {
    id: 'kaiba_starter',
    name: 'Bộ Bài Seto Kaiba (Rồng Trắng Sức Mạnh)',
    shortLabel: 'Kaiba Cổ Điển',
    character: 'Seto Kaiba',
    avatarUrl: 'https://images.ygoprodeck.com/images/cards_cropped/89631139.jpg',
    description: 'Áp đảo tuyệt đối bằng 3 Rồng Trắng Mắt Xanh, Chúa Tể Loài Rồng + Tiếng Sáo Gọi Rồng và Dung Hợp Rồng 3 Đầu 4500 ATK!',
    mainDeck: [
      // Quái cấp cao (5)
      'blue_eyes_white_dragon',
      'blue_eyes_white_dragon',
      'blue_eyes_white_dragon',
      'judge_man',
      'summoned_skull',
      // Quái cấp 4 (15)
      'alexandrite_dragon',
      'alexandrite_dragon',
      'vorse_raider',
      'vorse_raider',
      'la_jinn',
      'la_jinn',
      'battle_ox',
      'battle_ox',
      'lord_of_d',
      'lord_of_d',
      'aqua_madoor',
      'man_eater_bug',
      'wall_of_illusion',
      'sangan',
      'witch_of_the_black_forest',
      'herald_of_purple_light',
      // Phép (14)
      'pot_of_greed',
      'graceful_charity',
      'monster_reborn',
      'raigeki',
      'dark_hole',
      'fissure',
      'mystical_space_typhoon',
      'heavy_storm',
      'polymerization',
      'flute_of_summoning_dragon',
      'flute_of_summoning_dragon',
      'axe_of_despair',
      'mountain',
      'stop_defense',
      // Bẫy & Phá Bẫy (8)
      'mirror_force',
      'magic_cylinder',
      'trap_hole',
      'trap_hole',
      'sakuretsu_armor',
      'call_of_the_haunted',
      'red_reboot',
      'seven_tools_of_the_bandit',
    ],
    extraDeck: ['blue_eyes_ultimate_dragon'],
  },
  {
    id: 'joey_starter',
    name: 'Bộ Bài Joey Wheeler (Chiến Binh & Rồng Đen)',
    shortLabel: 'Joey Cổ Điển',
    character: 'Joey Wheeler',
    avatarUrl: 'https://images.ygoprodeck.com/images/cards_cropped/74677422.jpg',
    description: 'Chiến thuật Chiến binh tốc chiến kết hợp Dung hợp Rồng Đen Đầu Lâu Ác Ma (3200 ATK) và Rìu Tuyệt Vọng.',
    mainDeck: [
      // Quái cấp cao (5)
      'red_eyes_b_dragon',
      'red_eyes_b_dragon',
      'summoned_skull',
      'summoned_skull',
      'gaia_the_fierce_knight',
      // Quái cấp 4 (15)
      'alexandrite_dragon',
      'vorse_raider',
      'vorse_raider',
      'battle_ox',
      'battle_ox',
      '7_colored_fish',
      '7_colored_fish',
      'celtic_guardian',
      'celtic_guardian',
      'rogue_doll',
      'giant_soldier_of_stone',
      'man_eater_bug',
      'man_eater_bug',
      'sangan',
      'wall_of_illusion',
      'herald_of_purple_light',
      'kuriboh',
      // Phép (14)
      'pot_of_greed',
      'graceful_charity',
      'monster_reborn',
      'raigeki',
      'fissure',
      'fissure',
      'mystical_space_typhoon',
      'swords_of_revealing_light',
      'change_of_heart',
      'polymerization',
      'polymerization',
      'axe_of_despair',
      'axe_of_despair',
      'sogen',
      // Bẫy & Phá Bẫy (9)
      'mirror_force',
      'magic_cylinder',
      'sakuretsu_armor',
      'sakuretsu_armor',
      'trap_hole',
      'trap_hole',
      'call_of_the_haunted',
      'red_reboot',
      'seven_tools_of_the_bandit',
    ],
    extraDeck: ['b_skull_dragon', 'gaia_the_dragon_champion'],
  },
  {
    id: 'blue_eyes_archetype',
    name: 'Bộ Bài Blue-Eyes (Rồng Trắng Mắt Xanh)',
    shortLabel: 'Blue-Eyes',
    character: 'Kaiba (Blue-Eyes)',
    avatarUrl: 'https://images.ygoprodeck.com/images/cards_cropped/38517737.jpg',
    description:
      'Bộ bài chủ đề Rồng Trắng Mắt Xanh chuẩn Việt hóa: Alternative Dragon, Sage & Maiden, Đá Trắng Cổ Đại/Huyền Thoại, Dung Hợp Tối Thượng & Bạo Long.',
    mainDeck: [
      'blue_eyes_white_dragon',
      'blue_eyes_white_dragon',
      'blue_eyes_white_dragon',
      'blue_eyes_alternative_white_dragon',
      'blue_eyes_alternative_white_dragon',
      'dragon_spirit_of_white',
      'blue_eyes_jet_dragon',
      'blue_eyes_chaos_max_dragon',
      'sage_with_eyes_of_blue',
      'sage_with_eyes_of_blue',
      'sage_with_eyes_of_blue',
      'maiden_with_eyes_of_blue',
      'maiden_with_eyes_of_blue',
      'maiden_of_white',
      'the_white_stone_of_ancients',
      'the_white_stone_of_ancients',
      'the_white_stone_of_legend',
      'the_white_stone_of_legend',
      'dictator_of_d',
      'kaibaman',
      'the_melody_of_awakening_dragon',
      'the_melody_of_awakening_dragon',
      'trade_in',
      'trade_in',
      'return_of_the_dragon_lords',
      'return_of_the_dragon_lords',
      'silvers_cry',
      'dragon_shrine',
      'bingo_machine_go',
      'wishes_for_eyes_of_blue',
      'mausoleum_of_white',
      'ultimate_fusion',
      'polymerization',
      'burst_stream_of_destruction',
      'monster_reborn',
      'chaos_form',
      'true_light',
      'true_light',
      'the_ultimate_creature_of_destruction',
      'destined_rivals',
    ],
    extraDeck: [
      'blue_eyes_ultimate_dragon',
      'neo_blue_eyes_ultimate_dragon',
      'blue_eyes_alternative_ultimate_dragon',
      'blue_eyes_twin_burst_dragon',
      'blue_eyes_tyrant_dragon',
      'blue_eyes_tyrant_dragon',
      'blue_eyes_spirit_dragon',
      'azure_eyes_silver_dragon',
      'blue_eyes_ultimate_spirit_dragon',
      'spirit_with_eyes_of_blue',
    ],
  },
  {
    id: 'dark_magician_archetype',
    name: 'Bộ Bài Phù Thủy (Phù Thủy Áo Đen)',
    shortLabel: 'Phù Thủy',
    character: 'Yugi (Phù Thủy)',
    avatarUrl: 'https://images.ygoprodeck.com/images/cards_cropped/46986414.jpg',
    description:
      'Bộ bài hệ Phù Thủy & Phù Thủy Áo Đen: Vòng Tròn Ma Thuật, Linh Hồn Vĩnh Cửu, Quyền Trượng Phù Thủy, Con Mắt Timaeus & Kỵ Sĩ Rồng Dragoon.',
    mainDeck: [
      'dark_magician',
      'dark_magician',
      'dark_magician',
      'dark_magician_girl',
      'dark_magician_girl',
      'apprentice_illusion_magician',
      'apprentice_illusion_magician',
      'magicians_rod',
      'magicians_rod',
      'magicians_rod',
      'magicians_souls',
      'magicians_souls',
      'magician_of_dark_illusion',
      'illusion_of_chaos',
      'illusion_of_chaos',
      'palladium_oracle_mahad',
      'timaeus_the_united_dragon',
      'buster_blader',
      'effect_veiler',
      'dark_magical_circle',
      'dark_magical_circle',
      'soul_servant',
      'soul_servant',
      'the_eye_of_timaeus',
      'the_eye_of_timaeus',
      'secrets_of_dark_magic',
      'polymerization',
      'thousand_knives',
      'dark_magic_attack',
      'dark_burning_magic',
      'bond_between_teacher_and_student',
      'illusion_magic',
      'magical_dimension',
      'magicians_salvation',
      'monster_reborn',
      'eternal_soul',
      'eternal_soul',
      'magician_navigation',
      'magician_navigation',
      'magicians_combination',
    ],
    extraDeck: [
      'dark_paladin',
      'the_dark_magicians',
      'the_dark_magicians',
      'dark_magician_the_dragon_knight',
      'dark_magician_girl_the_dragon_knight',
      'amulet_dragon',
      'dark_cavalry',
      'red_eyes_dark_dragoon',
      'quintet_magician',
      'ebon_illusion_magician',
    ],
  },
];

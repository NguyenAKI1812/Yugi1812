import { CardDefinition } from '../types/game';

/**
 * BỘ BÀI TÍCH HỢP SẴN CHỦ ĐỀ:
 * 1. RỒNG TRẮNG MẮT XANH (BLUE-EYES)
 * 2. PHÙ THỦY ÁO ĐEN & HỆ PHÙ THỦY (DARK MAGICIAN / SPELLCASTER)
 * 3. LÁ BÀI PHỔ BIẾN TRONG .YDK (STAPLES)
 *
 * Tất cả mã passcode & altPasscodes đều được đối chiếu chuẩn từ Konami / YGOProDeck.
 */

export const BLUE_EYES_ARCHETYPE_CARDS: CardDefinition[] = [
  // ------------------------------------------
  // MONSTERS - BLUE-EYES & EYES OF BLUE
  // ------------------------------------------
  {
    id: 'blue_eyes_alternative_white_dragon',
    passcode: '38517737',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Alternative White Dragon',
    nameVi: 'Rồng Trắng Biến Thể (Blue-Eyes Alternative)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 8,
    atk: 3000,
    def: 2500,
    specialSummonHand: {
      requireHandOrFieldCardIds: ['blue_eyes_white_dragon'],
      labelVi: 'Phô bày Rồng Trắng -> Triệu hồi Đặc biệt',
    },
    descriptionVi:
      'Nếu trên tay hoặc sân có "Rồng Trắng Mắt Xanh": Có thể Đặc biệt Triệu hồi từ tay. Tên lá này được xem là "Rồng Trắng Mắt Xanh" trên sân/Mộ. Khi triệu hồi: Tiêu diệt 1 quái thú mạnh nhất của đối phương!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS', value: 1 }],
      },
    ],
  },
  {
    id: 'dragon_spirit_of_white',
    passcode: '45467446',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Dragon Spirit of White',
    nameVi: 'Bạch Long Linh Hồn (Dragon Spirit of White)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 8,
    atk: 2500,
    def: 2000,
    descriptionVi:
      'Luôn được tính là quái thú "Blue-Eyes". Khi Triệu hồi lên sân: Phá hủy 1 lá Bài Phép hoặc Bài Bẫy trên sân của đối phương.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_SPELLS_TRAPS', value: 1 }],
      },
    ],
  },
  {
    id: 'blue_eyes_jet_dragon',
    passcode: '30576089',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Jet Dragon',
    nameVi: 'Chiến Cơ Bạch Long (Blue-Eyes Jet)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 8,
    atk: 3000,
    def: 0,
    specialSummonHand: {
      requireHandOrFieldCardIds: ['blue_eyes_white_dragon'],
      labelVi: 'Có Rồng Trắng -> Triệu hồi Chiến Cơ',
    },
    descriptionVi:
      'Khi bạn có "Rồng Trắng Mắt Xanh" trên tay hoặc sân: Có thể Đặc biệt Triệu hồi từ tay. Khi triệu hồi: Phá 1 Bài Phép/Bẫy trên sân đối phương.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_SPELLS_TRAPS', value: 1 }],
      },
    ],
  },
  {
    id: 'blue_eyes_abyss_dragon',
    passcode: '64202399',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Abyss Dragon',
    nameVi: 'Hải Vực Bạch Long (Blue-Eyes Abyss)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 8,
    atk: 2500,
    def: 2500,
    descriptionVi:
      'Khi Triệu hồi lên sân: Lấy 1 lá "Dung Hợp", "Dung Hợp Tối Thượng" hoặc "Nghi Lễ Hỗn Mang" từ Bộ bài lên tay.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            cardIdFilter: ['polymerization', 'ultimate_fusion', 'chaos_form'],
            selectCount: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'blue_eyes_solid_dragon',
    passcode: '57043986',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Solid Dragon',
    nameVi: 'Thạch Long Mắt Xanh (Blue-Eyes Solid)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 8,
    atk: 2500,
    def: 2000,
    descriptionVi:
      'Khi Triệu hồi lên sân: Triệt hạ 1 quái thú ATK thấp nhất đang ngửa trên sân đối phương.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_LOWEST_ATK_OPPONENT_MONSTER' }],
      },
    ],
  },
  {
    id: 'blue_eyes_shining_dragon',
    passcode: '53347303',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Shining Dragon',
    nameVi: 'Quang Long Mắt Xanh (Blue-Eyes Shining)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 10,
    atk: 3000,
    def: 2500,
    specialSummonHand: {
      requireFieldCardIds: ['blue_eyes_ultimate_dragon'],
      labelVi: 'Có Rồng 3 Đầu -> Triệu hồi Quang Long',
    },
    descriptionVi:
      'Khi bạn điều khiển "Rồng Trắng Mắt Xanh Ba Đầu", có thể Đặc biệt Triệu hồi từ tay. Tăng thêm +300 ATK cho mỗi quái thú hệ Rồng đang ở dưới Mộ của bạn.',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: {
          atkDelta: 300,
          defDelta: 0,
          perRaceInOwnGY: ['Dragon'],
        },
      },
    ],
  },
  {
    id: 'blue_eyes_chaos_max_dragon',
    passcode: '55410871',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Chaos MAX Dragon',
    nameVi: 'Bạch Long Hỗn Mang MAX (Chaos MAX)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Dragon',
    level: 8,
    atk: 4000,
    def: 0,
    specialSummonHand: {
      discardHandCount: 1,
      requireHandOrFieldCardIds: ['chaos_form', 'blue_eyes_white_dragon'],
      labelVi: 'Bỏ 1 lá -> Triệu hồi Chaos MAX (4000 ATK)',
    },
    descriptionVi:
      'Quái thú Nghi Lễ tối thượng 4000 ATK! Có thể Đặc biệt Triệu hồi bằng cách bỏ 1 lá trên tay khi cầm "Nghi Lễ Hỗn Mang" hoặc "Rồng Trắng Mắt Xanh", hoặc dùng Phép "Nghi Lễ Hỗn Mang".',
  },
  {
    id: 'blue_eyes_chaos_dragon',
    passcode: '20654247',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Chaos Dragon',
    nameVi: 'Hỗn Mang Bạch Long (Blue-Eyes Chaos)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Dragon',
    level: 8,
    atk: 3000,
    def: 0,
    specialSummonHand: {
      discardHandCount: 1,
      requireHandOrFieldCardIds: ['chaos_form', 'blue_eyes_white_dragon'],
      labelVi: 'Bỏ 1 lá -> Triệu hồi Chaos Dragon',
    },
    descriptionVi:
      'Khi Triệu hồi lên sân: Lật ngửa toàn bộ quái thú đối phương đang Úp.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'FLIP_ALL_OPPONENT_MONSTERS_FACE_UP' }],
      },
    ],
  },
  {
    id: 'deep_eyes_white_dragon',
    passcode: '22804410',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Deep-Eyes White Dragon',
    nameVi: 'Thâm Nhãn Bạch Long (Deep-Eyes)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 10,
    atk: 0,
    def: 0,
    specialSummonHand: {
      requireHandOrFieldCardIds: ['blue_eyes_white_dragon', 'blue_eyes_alternative_white_dragon'],
      labelVi: 'Có Rồng Trắng -> Triệu hồi Deep-Eyes',
    },
    descriptionVi:
      'Khi có "Rồng Trắng Mắt Xanh" trên tay hoặc sân: Có thể Đặc biệt Triệu hồi từ tay và gây 600 sát thương LP đối phương. Nhận +600 ATK cho mỗi Rồng dưới Mộ của bạn!',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: {
          atkDelta: 600,
          defDelta: 0,
          perRaceInOwnGY: ['Dragon'],
        },
      },
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DAMAGE_LP', value: 600, targetSide: 'OPPONENT' }],
      },
    ],
  },
  {
    id: 'maiden_with_eyes_of_blue',
    passcode: '88241506',
    archetypeTags: ['BLUE_EYES', 'SPELLCASTER'],
    name: 'Maiden with Eyes of Blue',
    nameVi: 'Thiếu Nữ Mắt Xanh (Maiden Eyes of Blue)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 1,
    atk: 0,
    def: 0,
    descriptionVi:
      'Khi Thiếu Nữ bị tấn công: Chặn đòn tấn công và Triệu hồi Đặc biệt ngay 1 "Rồng Trắng Mắt Xanh" từ Bộ bài hoặc Mộ lên sân bảo vệ!',
    effects: [
      {
        trigger: 'ON_BATTLE_END_SURVIVE',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['blue_eyes_white_dragon'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'maiden_of_white',
    passcode: '17947697',
    archetypeTags: ['BLUE_EYES', 'SPELLCASTER'],
    name: 'Maiden of White',
    nameVi: 'Thánh Nữ Áo Trắng (Maiden of White)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 1,
    atk: 0,
    def: 0,
    descriptionVi:
      'Khi Triệu hồi lên sân: Tìm 1 "Ánh Sáng Chân Lý" hoặc Phép/Bẫy "Mắt Xanh" từ Bộ bài lên tay. Khi vào Mộ: Hồi sinh 1 "Rồng Trắng Mắt Xanh" từ Mộ!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            cardIdFilter: [
              'true_light',
              'wishes_for_eyes_of_blue',
              'roar_of_the_blue_eyed_dragons',
              'mausoleum_of_white',
            ],
          },
        ],
      },
      {
        trigger: 'ON_SENT_TO_GY',
        triggerOnAnyGY: true,
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['blue_eyes_white_dragon'],
            includeGraveyard: true,
            graveyardOnly: true,
          },
        ],
      },
    ],
  },
  {
    id: 'sage_with_eyes_of_blue',
    passcode: '8240199',
    archetypeTags: ['BLUE_EYES', 'SPELLCASTER'],
    name: 'Sage with Eyes of Blue',
    nameVi: 'Hiền Giả Mắt Xanh (Sage Eyes of Blue)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 1,
    atk: 0,
    def: 1500,
    descriptionVi:
      'Khi Triệu hồi: Lấy 1 quái thú ÁNH SÁNG Cấp 1 (Maiden, Bạch Ngọc, Priestess...) từ Bộ bài lên tay.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            attributeFilter: ['LIGHT'],
            maxLevelFilter: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'master_with_eyes_of_blue',
    passcode: '45644898',
    archetypeTags: ['BLUE_EYES', 'SPELLCASTER'],
    name: 'Master with Eyes of Blue',
    nameVi: 'Tông Sư Mắt Xanh (Master Eyes of Blue)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 1,
    atk: 300,
    def: 1200,
    descriptionVi:
      'Khi Triệu hồi: Thu hồi 1 quái thú ÁNH SÁNG Cấp 1 từ Mộ của bạn về tay. Khi xuống Mộ: Hồi sinh 1 Rồng Mắt Xanh từ Mộ!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            attributeFilter: ['LIGHT'],
            maxLevelFilter: 1,
            includeGraveyard: true,
            graveyardOnly: true,
          },
        ],
      },
    ],
  },
  {
    id: 'protector_with_eyes_of_blue',
    passcode: '72855441',
    archetypeTags: ['BLUE_EYES', 'SPELLCASTER'],
    name: 'Protector with Eyes of Blue',
    nameVi: 'Hộ Vệ Mắt Xanh (Protector Eyes of Blue)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 1,
    atk: 800,
    def: 1300,
    descriptionVi:
      'Khi Triệu hồi: Triệu hồi Đặc biệt thêm 1 quái thú ÁNH SÁNG Cấp 1 đang cầm trên tay lên sân.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SPECIAL_SUMMON_HAND_MONSTERS',
            attributeFilter: ['LIGHT'],
            maxLevelFilter: 1,
            maxSummonCount: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'priestess_with_eyes_of_blue',
    passcode: '36734924',
    archetypeTags: ['BLUE_EYES', 'SPELLCASTER'],
    name: 'Priestess with Eyes of Blue',
    nameVi: 'Nữ Tư Tế Mắt Xanh (Priestess Eyes of Blue)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 1,
    atk: 0,
    def: 0,
    descriptionVi:
      'Khi từ sân xuống Mộ: Tìm tối đa 2 quái thú "Blue-Eyes" / "Bạch Long" từ Bộ bài lên tay.',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            nameContainsFilter: ['Blue-Eyes', 'Bạch Long', 'Rồng Trắng'],
            selectCount: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'the_white_stone_of_legend',
    passcode: '79814787',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'The White Stone of Legend',
    nameVi: 'Bạch Ngọc Truyền Thuyết (White Stone Legend)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 1,
    atk: 300,
    def: 250,
    descriptionVi:
      'Nếu lá bài này bị gửi xuống Mộ (từ tay, Bộ bài hay trên sân): Lấy 1 "Rồng Trắng Mắt Xanh" từ Bộ bài lên tay ngay!',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        triggerOnAnyGY: true,
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            cardIdFilter: ['blue_eyes_white_dragon'],
            selectCount: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'the_white_stone_of_ancients',
    passcode: '71039903',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'The White Stone of Ancients',
    nameVi: 'Bạch Ngọc Cổ Đại (White Stone Ancients)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 1,
    atk: 600,
    def: 500,
    descriptionVi:
      'Khi lá bài này bị gửi xuống Mộ (từ tay, Bộ bài hay trên sân): Triệu hồi Đặc biệt 1 quái thú "Blue-Eyes" trực tiếp từ Bộ bài!',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        triggerOnAnyGY: true,
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            nameContainsFilter: ['Blue-Eyes', 'Bạch Long', 'Rồng Trắng'],
          },
        ],
      },
    ],
  },
  {
    id: 'kaibaman',
    passcode: '34627841',
    archetypeTags: ['BLUE_EYES'],
    name: 'Kaibaman',
    nameVi: 'Kỵ Sĩ Kaibaman',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Warrior',
    level: 3,
    atk: 200,
    def: 700,
    descriptionVi:
      'Khi Triệu hồi: Gọi Đặc biệt ngay 1 "Rồng Trắng Mắt Xanh" đang có trên tay lên sân!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SPECIAL_SUMMON_HAND_MONSTERS',
            cardIdFilter: ['blue_eyes_white_dragon', 'blue_eyes_alternative_white_dragon'],
            maxSummonCount: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'dictator_of_d',
    passcode: '66961194',
    archetypeTags: ['BLUE_EYES', 'SPELLCASTER'],
    name: 'Dictator of D.',
    nameVi: 'Độc Tài Loài Rồng (Dictator of D.)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 4,
    atk: 1200,
    def: 1100,
    specialSummonHand: {
      discardHandCount: 1,
      labelVi: 'Bỏ 1 lá trên tay -> Triệu hồi Dictator of D.',
    },
    descriptionVi:
      'Có thể bỏ 1 lá trên tay để Đặc biệt Triệu hồi từ tay. Khi triệu hồi: Gọi Hồi Sinh 1 quái thú "Blue-Eyes" từ Mộ của bạn!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            nameContainsFilter: ['Blue-Eyes', 'Bạch Long', 'Rồng Trắng'],
            includeGraveyard: true,
            graveyardOnly: true,
          },
        ],
      },
    ],
  },
  {
    id: 'kaiser_sea_horse',
    passcode: '17444133',
    archetypeTags: ['BLUE_EYES'],
    name: 'Kaiser Sea Horse',
    nameVi: 'Hải Mã Hoàng Đế (Kaiser Sea Horse)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Sea Serpent',
    level: 4,
    atk: 1700,
    def: 1650,
    descriptionVi:
      'Chiến binh Ánh Sáng 1700 ATK. Khi từ sân xuống Mộ: Tìm 1 Rồng ÁNH SÁNG Cấp 5+ từ Bộ bài lên tay.',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            raceFilter: ['Dragon'],
            attributeFilter: ['LIGHT'],
            minLevelFilter: 5,
          },
        ],
      },
    ],
  },
  {
    id: 'neo_kaiser_sea_horse',
    passcode: '54332792',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Neo Kaiser Sea Horse',
    nameVi: 'Tân Hải Mã Hoàng Đế (Neo Kaiser)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 4,
    atk: 1700,
    def: 1650,
    specialSummonHand: {
      requireFieldCardIds: ['blue_eyes_white_dragon'],
      labelVi: 'Có Rồng Trắng trên sân -> Triệu hồi Tân Hải Mã',
    },
    descriptionVi:
      'Nếu bạn điều khiển "Rồng Trắng Mắt Xanh": Có thể Đặc biệt Triệu hồi từ tay. Khi gửi từ sân xuống Mộ: Đẩy 1 quái "Blue-Eyes" hoặc "Bạch Ngọc" từ Bộ bài xuống Mộ.',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'MILL_TO_GY',
            nameContainsFilter: ['Blue-Eyes', 'White Stone', 'Bạch Ngọc', 'Bạch Long'],
          },
        ],
      },
    ],
  },

  // ------------------------------------------
  // EXTRA DECK - BLUE-EYES (DUNG HỢP H5)
  // ------------------------------------------
  {
    id: 'neo_blue_eyes_ultimate_dragon',
    passcode: '56532353',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Neo Blue-Eyes Ultimate Dragon',
    nameVi: 'Bạch Long Ba Đầu Tối Hậu (Neo Ultimate)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 12,
    atk: 4500,
    def: 3800,
    fusionMaterials: ['blue_eyes_white_dragon', 'blue_eyes_white_dragon', 'blue_eyes_white_dragon'],
    descriptionVi:
      '"Rồng Trắng Mắt Xanh" x3. Phiên bản tiến hóa 4500 ATK! Khi Dung Hợp lên sân: Phá hủy 1 Phép/Bẫy của đối phương.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_SPELLS_TRAPS', value: 1 }],
      },
    ],
  },
  {
    id: 'blue_eyes_twin_burst_dragon',
    passcode: '2129638',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Twin Burst Dragon',
    nameVi: 'Bạch Long Song Đầu (Blue-Eyes Twin Burst)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 10,
    atk: 3000,
    def: 2500,
    fusionMaterials: ['blue_eyes_white_dragon', 'blue_eyes_white_dragon'],
    descriptionVi:
      '"Rồng Trắng Mắt Xanh" + "Rồng Trắng Mắt Xanh". Khi triệu hồi lên sân: Gây 800 sát thương LP đối phương.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DAMAGE_LP', value: 800, targetSide: 'OPPONENT' }],
      },
    ],
  },
  {
    id: 'blue_eyes_tyrant_dragon',
    passcode: '11443677',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Tyrant Dragon',
    nameVi: 'Bạo Long Mắt Xanh (Blue-Eyes Tyrant)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 8,
    atk: 3400,
    def: 2900,
    fusionMaterials: ['blue_eyes_white_dragon', 'RACE:Dragon'],
    descriptionVi:
      '"Rồng Trắng Mắt Xanh" + 1 quái hệ Rồng. Sức công 3400 ATK! Khi triệu hồi lên sân: Phá 1 Bài Bẫy/Phép đối phương.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_SPELLS_TRAPS', value: 1 }],
      },
    ],
  },
  {
    id: 'blue_eyes_alternative_ultimate_dragon',
    passcode: '43228023',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Alternative Ultimate Dragon',
    nameVi: 'Bạch Long Ba Đầu Biến Thể (Alt. Ultimate)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 12,
    atk: 4500,
    def: 3800,
    fusionMaterials: ['blue_eyes_white_dragon', 'blue_eyes_white_dragon', 'blue_eyes_white_dragon'],
    descriptionVi:
      '"Rồng Trắng Mắt Xanh" x3. Khi Dung Hợp thành công: Quét sạch toàn bộ quái thú trên sân đối phương!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS' }],
      },
    ],
  },
  {
    id: 'blue_eyes_spirit_dragon',
    passcode: '59822133',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Spirit Dragon',
    nameVi: 'Thần Long Mắt Xanh (Blue-Eyes Spirit Dragon)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 9,
    atk: 2500,
    def: 3000,
    fusionMaterials: ['RACE:Dragon', 'ATTR:LIGHT'],
    descriptionVi:
      'Extra Deck: 1 quái hệ Rồng + 1 quái ÁNH SÁNG. Khi triệu hồi: Gọi Hồi Sinh 1 quái "Blue-Eyes" từ Mộ của bạn!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            nameContainsFilter: ['Blue-Eyes', 'Bạch Long', 'Rồng Trắng'],
            includeGraveyard: true,
            graveyardOnly: true,
          },
        ],
      },
    ],
  },
  {
    id: 'azure_eyes_silver_dragon',
    passcode: '40908371',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Azure-Eyes Silver Dragon',
    nameVi: 'Ngân Long Bích Nhãn (Azure-Eyes Silver)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 9,
    atk: 2500,
    def: 3000,
    fusionMaterials: ['RACE:Dragon', 'RACE:Spellcaster'],
    descriptionVi:
      'Extra Deck: 1 quái Rồng + 1 quái Phù Thủy. Khi triệu hồi lên sân: Hồi sinh 1 "Rồng Trắng Mắt Xanh" (hoặc Rồng bất kỳ) từ Mộ!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            raceFilter: ['Dragon'],
            includeGraveyard: true,
            graveyardOnly: true,
          },
        ],
      },
    ],
  },
  {
    id: 'blue_eyes_ultimate_spirit_dragon',
    passcode: '89604813',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Blue-Eyes Ultimate Spirit Dragon',
    nameVi: 'Thần Long Tối Thượng (Ultimate Spirit Dragon)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 12,
    atk: 3500,
    def: 4000,
    fusionMaterials: ['blue_eyes_white_dragon', 'ATTR:LIGHT', 'RACE:Dragon'],
    descriptionVi:
      'Extra Deck: "Rồng Trắng Mắt Xanh" + 1 quái ÁNH SÁNG + 1 quái Rồng. Sở hữu 4000 DEF / 3500 ATK và phá 1 quái địch khi ra sân!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS', value: 1 }],
      },
    ],
  },
  {
    id: 'spirit_with_eyes_of_blue',
    passcode: '42097666',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Spirit with Eyes of Blue',
    nameVi: 'Linh Hồn Mắt Xanh (Spirit Eyes of Blue)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 1,
    atk: 300,
    def: 0,
    fusionMaterials: ['RACE:Spellcaster'],
    descriptionVi:
      'Extra Deck: 1 quái Phù Thủy (như Sage/Maiden). Khi triệu hồi: Lấy ngay "Lăng Mộ Trắng" (Mausoleum) từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            cardIdFilter: ['mausoleum_of_white'],
          },
        ],
      },
    ],
  },
  {
    id: 'dragon_master_knight',
    passcode: '62873545',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Dragon Master Knight',
    nameVi: 'Kỵ Sĩ Tối Thượng Rồng (Dragon Master Knight)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 12,
    atk: 5000,
    def: 5000,
    fusionMaterials: ['blue_eyes_ultimate_dragon', 'RACE:Warrior'],
    descriptionVi:
      '"Rồng Trắng Mắt Xanh Ba Đầu" + 1 quái Chiến Binh. Sức mạnh nguyên bản 5000/5000, tăng thêm +500 ATK cho mỗi quái Rồng trên sân & Mộ!',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: {
          atkDelta: 500,
          defDelta: 0,
          perRaceInOwnGY: ['Dragon'],
        },
      },
    ],
  },
  {
    id: 'dragon_master_magia',
    passcode: '12381100',
    archetypeTags: ['BLUE_EYES', 'DARK_MAGICIAN', 'DRAGON'],
    name: 'Dragon Master Magia',
    nameVi: 'Đại Pháp Sư Rồng Ma (Dragon Master Magia)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 12,
    atk: 5000,
    def: 4000,
    fusionMaterials: ['blue_eyes_ultimate_dragon', 'RACE:Spellcaster'],
    descriptionVi:
      '"Rồng Trắng Mắt Xanh Ba Đầu" + 1 quái Phù Thủy (hoặc quái Chaos). 5000 ATK tối thượng! Khi ra sân: Quét sạch toàn bộ sân đối phương!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_ALL_CARDS' }],
      },
    ],
  },

  // ------------------------------------------
  // SPELLS & TRAPS - BLUE-EYES
  // ------------------------------------------
  {
    id: 'burst_stream_of_destruction',
    passcode: '17655904',
    archetypeTags: ['BLUE_EYES'],
    name: 'Burst Stream of Destruction',
    nameVi: 'Hơi Thở Hủy Diệt (Burst Stream)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Kích hoạt khi bạn đang điều khiển "Rồng Trắng Mắt Xanh" ngửa trên sân: Tiêu diệt toàn bộ quái thú trên sân đối phương!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          requireFaceUpCardCodes: [
            'blue_eyes_white_dragon',
            'blue_eyes_alternative_white_dragon',
            'dragon_spirit_of_white',
          ],
          requireOpponentFaceUpMonster: false,
        },
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS' }],
      },
    ],
  },
  {
    id: 'the_melody_of_awakening_dragon',
    passcode: '48800175',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'The Melody of Awakening Dragon',
    nameVi: 'Giai Điệu Thức Tỉnh Rồng (Melody of Dragon)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Bỏ 1 lá trên tay xuống Mộ; lấy tối đa 2 quái thú hệ Rồng có từ 3000 ATK trở lên (như Rồng Trắng Mắt Xanh / Alternative) từ Bộ bài lên tay.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_HAND_CARD',
          promptVi: 'Chọn 1 lá bài trên tay để bỏ xuống Mộ:',
        },
        actions: [
          { type: 'DISCARD_TARGET_HAND_CARD' },
          {
            type: 'SEARCH_DECK_TO_HAND',
            raceFilter: ['Dragon'],
            minAtkFilter: 3000,
            selectCount: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'return_of_the_dragon_lords',
    passcode: '6853254',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Return of the Dragon Lords',
    nameVi: 'Chúa Rồng Tái Thế (Return of Dragon Lords)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Chọn 1 quái thú hệ Rồng Cấp 7 hoặc 8 trong Mộ của bạn; Triệu hồi Đặc biệt nó lên sân!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_GRAVEYARD_MONSTER',
          allowedRaces: ['Dragon'],
          minLevel: 7,
          maxLevel: 8,
          promptVi: 'Chọn 1 quái hệ Rồng Cấp 7-8 trong Mộ để Hồi Sinh:',
        },
        actions: [{ type: 'REVIVE_TARGET_FROM_GY' }],
      },
    ],
  },
  {
    id: 'silvers_cry',
    passcode: '87025064',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: "Silver's Cry",
    nameVi: "Tiếng Gầm Ngân Long (Silver's Cry)",
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Chọn 1 quái thú hệ Rồng trong Mộ của bạn (ưu tiên Rồng Thường); Triệu hồi Đặc biệt nó lên sân!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_GRAVEYARD_MONSTER',
          allowedRaces: ['Dragon'],
          promptVi: 'Chọn 1 quái hệ Rồng trong Mộ để Hồi Sinh:',
        },
        actions: [{ type: 'REVIVE_TARGET_FROM_GY' }],
      },
    ],
  },
  {
    id: 'dragon_shrine',
    passcode: '41620959',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Dragon Shrine',
    nameVi: 'Thánh Điện Loài Rồng (Dragon Shrine)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Chọn và gửi 1 quái thú hệ Rồng (như Rồng Trắng Mắt Xanh hoặc Bạch Ngọc) từ Bộ bài thẳng xuống Mộ để kích hoạt combo Hồi sinh / Tìm bài!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'MILL_TO_GY', raceFilter: ['Dragon'], selectCount: 1 }],
      },
    ],
  },
  {
    id: 'trade_in',
    passcode: '38120068',
    archetypeTags: ['BLUE_EYES', 'STAPLE'],
    name: 'Trade-In',
    nameVi: 'Trao Đổi Cấp 8 (Trade-In)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Chọn bỏ 1 quái thú Cấp 8 từ trên tay xuống Mộ, sau đó rút 2 lá bài mới lên tay!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_HAND_MONSTER',
          minLevel: 8,
          maxLevel: 8,
          promptVi: 'Chọn 1 quái thú Cấp 8 trên tay để bỏ xuống Mộ & rút 2 lá:',
        },
        actions: [{ type: 'DISCARD_TARGET_HAND_CARD' }, { type: 'DRAW_CARDS', value: 2 }],
      },
    ],
  },
  {
    id: 'cards_of_consonance',
    passcode: '39701395',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Cards of Consonance',
    nameVi: 'Bài Hòa Âm (Cards of Consonance)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Bỏ 1 quái thú hệ Rồng có ≤ 1000 ATK (như Bạch Ngọc) từ tay xuống Mộ, sau đó rút 2 lá bài!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_HAND_MONSTER',
          allowedRaces: ['Dragon'],
          maxAtk: 1000,
          promptVi: 'Chọn 1 Rồng ≤ 1000 ATK trên tay để bỏ xuống Mộ & rút 2 lá:',
        },
        actions: [{ type: 'DISCARD_TARGET_HAND_CARD' }, { type: 'DRAW_CARDS', value: 2 }],
      },
    ],
  },
  {
    id: 'bingo_machine_go',
    passcode: '93437091',
    archetypeTags: ['BLUE_EYES'],
    name: 'Bingo Machine, Go!!!',
    nameVi: 'Máy Quay Bingo (Bingo Machine Go)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Tìm và lấy 1 quái thú hoặc Phép/Bẫy thuộc chủ đề "Blue-Eyes" / "Rồng Trắng Mắt Xanh" từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            nameContainsFilter: ['Blue-Eyes', 'Bạch Long', 'Rồng Trắng', 'Mắt Xanh'],
          },
        ],
      },
    ],
  },
  {
    id: 'mausoleum_of_white',
    passcode: '24382602',
    archetypeTags: ['BLUE_EYES'],
    name: 'Mausoleum of White',
    nameVi: 'Lăng Mộ Trắng (Mausoleum of White)',
    category: 'SPELL',
    subType: 'FIELD',
    descriptionVi:
      'SÂN MÔI TRƯỜNG: Khi kích hoạt, có thể gửi 1 quái Rồng ÁNH SÁNG từ Bộ bài xuống Mộ; đồng thời tất cả quái Rồng & Phù Thủy nhận +300 ATK/DEF.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'MILL_TO_GY', raceFilter: ['Dragon'], attributeFilter: ['LIGHT'] }],
      },
      {
        trigger: 'CONTINUOUS_FIELD',
        continuous: {
          affectedRaces: ['Dragon', 'Spellcaster'],
          atkDelta: 300,
          defDelta: 300,
        },
      },
    ],
  },
  {
    id: 'ultimate_fusion',
    passcode: '71143015',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Ultimate Fusion',
    nameVi: 'Dung Hợp Tối Thượng (Ultimate Fusion)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Triệu hồi Dung Hợp 1 quái thú từ Extra Deck bằng nguyên liệu từ trên tay, trên sân VÀ cả ở dưới MỘ của bạn!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'FUSION_SUMMON', allowGyFusionMaterials: true }],
      },
    ],
  },
  {
    id: 'wishes_for_eyes_of_blue',
    passcode: '80326401',
    archetypeTags: ['BLUE_EYES'],
    name: 'Wishes for Eyes of Blue',
    nameVi: 'Ước Nguyện Mắt Xanh (Wishes Eyes of Blue)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Bỏ 1 lá trên tay xuống Mộ; lấy 2 lá bài chủ đề "Mắt Xanh" / "Blue-Eyes" / "Bạch Ngọc" từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_HAND_CARD',
          promptVi: 'Chọn 1 lá bài trên tay để bỏ xuống Mộ:',
        },
        actions: [
          { type: 'DISCARD_TARGET_HAND_CARD' },
          {
            type: 'SEARCH_DECK_TO_HAND',
            nameContainsFilter: ['Eyes of Blue', 'Mắt Xanh', 'Blue-Eyes', 'White Stone', 'Bạch Ngọc', 'Bạch Long', 'True Light', 'Mausoleum'],
            selectCount: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'roar_of_the_blue_eyed_dragons',
    passcode: '17725109',
    archetypeTags: ['BLUE_EYES', 'DRAGON'],
    name: 'Roar of the Blue-Eyed Dragons',
    nameVi: 'Tiếng Gầm Bạch Long (Roar of Blue-Eyed)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Triệu hồi Đặc biệt 1 quái thú "Blue-Eyes" (như Rồng Trắng Mắt Xanh) thẳng từ Bộ bài hoặc Mộ lên sân!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            nameContainsFilter: ['Blue-Eyes', 'Bạch Long', 'Rồng Trắng'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'majesty_with_eyes_of_blue',
    passcode: '2783661',
    archetypeTags: ['BLUE_EYES'],
    name: 'Majesty with Eyes of Blue',
    nameVi: 'Uy Nghi Mắt Xanh (Majesty Eyes of Blue)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Gửi 1 quái thú "Blue-Eyes" từ Bộ bài xuống Mộ để chuẩn bị combo Hồi Sinh, hoặc khóa 1 quái địch.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'MILL_TO_GY',
            nameContainsFilter: ['Blue-Eyes', 'Bạch Long', 'Rồng Trắng'],
          },
        ],
      },
    ],
  },
  {
    id: 'rage_with_eyes_of_blue',
    passcode: '29432790',
    archetypeTags: ['BLUE_EYES'],
    name: 'Rage with Eyes of Blue',
    nameVi: 'Cơn Thịnh Nộ Mắt Xanh (Rage Eyes of Blue)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Triệu hồi Đặc biệt tối đa 2 "Rồng Trắng Mắt Xanh" trực tiếp từ Bộ bài của bạn lên sân!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['blue_eyes_white_dragon'],
            maxSummonCount: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'beacon_of_white',
    passcode: '50371210',
    archetypeTags: ['BLUE_EYES'],
    name: 'Beacon of White',
    nameVi: 'Ngọn Hải Đăng Trắng (Beacon of White)',
    category: 'SPELL',
    subType: 'EQUIP',
    descriptionVi:
      'Chọn 1 Rồng "Blue-Eyes" trong Mộ của bạn: Triệu hồi Đặc biệt nó lên sân và Trang bị lá này (+400 ATK)!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_GRAVEYARD_MONSTER',
          allowedCardIds: [
            'blue_eyes_white_dragon',
            'blue_eyes_alternative_white_dragon',
            'dragon_spirit_of_white',
            'blue_eyes_jet_dragon',
            'blue_eyes_abyss_dragon',
            'blue_eyes_solid_dragon',
          ],
          promptVi: 'Chọn 1 quái "Blue-Eyes" trong Mộ để Hồi Sinh & Trang bị (+400 ATK):',
        },
        actions: [{ type: 'REVIVE_TARGET_FROM_GY' }, { type: 'EQUIP_TO_TARGET' }],
      },
      {
        trigger: 'CONTINUOUS_EQUIP',
        continuous: { atkDelta: 400, defDelta: 0 },
      },
    ],
  },
  {
    id: 'piercing_the_darkness',
    passcode: '21862633',
    archetypeTags: ['BLUE_EYES', 'DARK_MAGICIAN'],
    name: 'Piercing the Darkness',
    nameVi: 'Xuyên Thấu Bóng Đêm (Piercing the Darkness)',
    category: 'SPELL',
    subType: 'CONTINUOUS',
    descriptionVi:
      'Khi kích hoạt: Rút ngay 1 lá bài, và cộng thêm +500 ATK cho quái thú Rồng và Phù Thủy trên sân của bạn!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'DRAW_CARDS', value: 1 }],
      },
      {
        trigger: 'CONTINUOUS_FIELD',
        continuous: {
          affectedRaces: ['Dragon', 'Spellcaster'],
          atkDelta: 500,
          defDelta: 0,
        },
      },
    ],
  },
  {
    id: 'chaos_form',
    passcode: '21082832',
    archetypeTags: ['BLUE_EYES', 'DARK_MAGICIAN'],
    name: 'Chaos Form',
    nameVi: 'Nghi Lễ Hỗn Mang (Chaos Form)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Nghi Lễ triệu hồi tối thượng: Triệu hồi Đặc biệt 1 quái thú "Chaos" (như Chaos MAX Dragon 4000 ATK hoặc Magician of Chaos) từ Bộ bài hoặc Mộ!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            nameContainsFilter: ['Chaos', 'Hỗn Mang'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'true_light',
    passcode: '62089826',
    archetypeTags: ['BLUE_EYES'],
    name: 'True Light',
    nameVi: 'Ánh Sáng Chân Lý (True Light)',
    category: 'TRAP',
    subType: 'CONTINUOUS',
    descriptionVi:
      'Bẫy Vĩnh cửu bảo hộ "Rồng Trắng Mắt Xanh": Khi kích hoạt, Triệu hồi Đặc biệt 1 "Rồng Trắng Mắt Xanh" từ Bộ bài hoặc Mộ!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['blue_eyes_white_dragon', 'blue_eyes_alternative_white_dragon'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'the_ultimate_creature_of_destruction',
    passcode: '56920308',
    archetypeTags: ['BLUE_EYES'],
    name: 'The Ultimate Creature of Destruction',
    nameVi: 'Sinh Vật Hủy Diệt (Ultimate Creature)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi:
      'Khi quái thú đối phương tuyên bố tấn công: Chặn đứng đòn đánh và tiêu diệt ngay quái thú đang tấn công đó!',
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
];

export const DARK_MAGICIAN_SPELLCASTER_CARDS: CardDefinition[] = [
  // ------------------------------------------
  // MONSTERS - DARK MAGICIAN & SPELLCASTERS
  // ------------------------------------------
  {
    id: 'magicians_rod',
    passcode: '7084129',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: "Magician's Rod",
    nameVi: "Quyền Trượng Pháp Sư (Magician's Rod)",
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 3,
    atk: 1600,
    def: 100,
    descriptionVi:
      'Khi Triệu hồi: Lấy 1 lá Phép hoặc Bẫy hỗ trợ "Phù Thủy Áo Đen" (Ma Pháp Trận, Linh Hồn Vĩnh Cửu, Vạn Đao...) từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            categoryFilter: 'SPELL_OR_TRAP',
            nameContainsFilter: [
              'Dark Magic',
              'Dark Magical',
              'Hắc Ma',
              'Eternal Soul',
              'Linh Hồn',
              'Thousand Knives',
              'Vạn Đao',
              'Illusion',
              'Timaeus',
              'Navigation',
              'Salvation',
              'Soul Servant',
              'Teacher',
              'Bond',
              'Curtain',
              'Dark Burning',
              'Sage',
              "Magicians'",
              'Destined',
              'Dedication',
              'Magic Formula',
              'Knight',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'magicians_robe',
    passcode: '71696014',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: "Magician's Robe",
    nameVi: "Áo Choàng Pháp Sư (Magician's Robe)",
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 2,
    atk: 700,
    def: 2000,
    descriptionVi:
      'Tường thủ 2000 DEF. Khi xuống Mộ: Triệu hồi Đặc biệt ngay 1 "Phù Thủy Áo Đen" từ Bộ bài lên sân!',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician'],
          },
        ],
      },
    ],
  },
  {
    id: 'magicians_souls',
    passcode: '97631303',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: "Magicians' Souls",
    nameVi: "Linh Hồn Pháp Sư (Magicians' Souls)",
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 1,
    atk: 0,
    def: 0,
    specialSummonHand: {
      labelVi: 'Triệu hồi Đặc biệt Linh Hồn Pháp Sư',
    },
    descriptionVi:
      'Có thể Đặc biệt Triệu hồi thẳng từ trên tay! Khi triệu hồi lên sân: Rút 1 lá bài và gửi 1 quái Phù Thủy Cấp 6+ xuống Mộ để chuẩn bị Hồi Sinh!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          { type: 'DRAW_CARDS', value: 1 },
          { type: 'MILL_TO_GY', raceFilter: ['Spellcaster'], minLevelFilter: 6 },
        ],
      },
    ],
  },
  {
    id: 'apprentice_illusion_magician',
    passcode: '30603688',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Apprentice Illusion Magician',
    nameVi: 'Nữ Đồ Đệ Ảo Ảnh (Apprentice Illusion)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 6,
    atk: 2000,
    def: 1700,
    specialSummonHand: {
      discardHandCount: 1,
      labelVi: 'Bỏ 1 lá trên tay -> Triệu hồi Nữ Đồ Đệ',
    },
    descriptionVi:
      'Có thể bỏ 1 lá trên tay để Đặc biệt Triệu hồi từ tay! Khi Triệu hồi lên sân: Lấy ngay 1 "Phù Thủy Áo Đen" từ Bộ bài lên tay.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'SEARCH_DECK_TO_HAND', cardIdFilter: ['dark_magician'] }],
      },
    ],
  },
  {
    id: 'magician_of_dark_illusion',
    passcode: '35191415',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Magician of Dark Illusion',
    nameVi: 'Pháp Sư Ảo Ảnh Tối (Dark Illusion)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 7,
    atk: 2100,
    def: 2500,
    specialSummonHand: {
      requireFaceUpRace: ['Spellcaster'],
      labelVi: 'Có Phù Thủy trên sân -> Triệu hồi Ảo Ảnh Tối',
    },
    descriptionVi:
      'Khi bạn điều khiển quái Phù Thủy ngửa: Có thể Đặc biệt Triệu hồi từ tay. Trên sân được tính tên là "Phù Thủy Áo Đen" và hồi sinh 1 "Phù Thủy Áo Đen" từ Mộ khi ra sân!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician'],
            includeGraveyard: true,
            graveyardOnly: true,
          },
        ],
      },
    ],
  },
  {
    id: 'palladium_oracle_mahad',
    passcode: '71703785',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Palladium Oracle Mahad',
    nameVi: 'Thánh Sư Mahad (Palladium Oracle Mahad)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 7,
    atk: 2500,
    def: 2100,
    specialSummonHand: {
      labelVi: 'Phô bày trên tay -> Triệu hồi Mahad 2500 ATK',
    },
    descriptionVi:
      'Có thể phô bày trên tay để Đặc biệt Triệu hồi thẳng lên sân! Khi bị tiêu diệt xuống Mộ: Gọi ngay "Phù Thủy Áo Đen" từ Bộ bài hoặc Mộ lên sân!',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'palladium_oracle_mana',
    passcode: '42006475',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Palladium Oracle Mana',
    nameVi: 'Thánh Nữ Mana (Palladium Oracle Mana)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 6,
    atk: 2000,
    def: 1700,
    specialSummonHand: {
      requireFaceUpRace: ['Spellcaster'],
      labelVi: 'Có Phù Thủy trên sân -> Triệu hồi Mana',
    },
    descriptionVi:
      'Khi bạn có Phù Thủy ngửa trên sân: Có thể Đặc biệt Triệu hồi từ tay. Khi xuống Mộ: Gọi "Nữ Phù Thủy Áo Đen" từ Bộ bài hoặc Mộ lên sân!',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician_girl'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dark_magician_of_chaos',
    passcode: '40737112',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Magician of Chaos',
    nameVi: 'Phù Thủy Hỗn Mang (Dark Magician Chaos)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 8,
    atk: 2800,
    def: 2600,
    descriptionVi:
      'Huyền thoại 2800 ATK! Khi Triệu hồi lên sân: Thu hồi ngay 1 lá Bài Phép từ Mộ của bạn lên tay!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            categoryFilter: 'SPELL',
            includeGraveyard: true,
            graveyardOnly: true,
          },
        ],
      },
    ],
  },
  {
    id: 'magician_of_chaos',
    passcode: '47963370',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Magician of Chaos',
    nameVi: 'Pháp Sư Hỗn Mang (Magician of Chaos)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 7,
    atk: 2500,
    def: 2100,
    specialSummonHand: {
      discardHandCount: 1,
      requireHandOrFieldCardIds: ['chaos_form', 'dark_magician'],
      labelVi: 'Bỏ 1 lá -> Triệu hồi Magician of Chaos',
    },
    descriptionVi:
      'Trên sân & Mộ được tính là "Phù Thủy Áo Đen". Có thể Nghi lễ Triệu hồi bằng "Chaos Form" hoặc bỏ 1 lá trên tay. Khi ra sân: Phá 1 lá trên sân địch!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS', value: 1 }],
      },
    ],
  },
  {
    id: 'magician_of_black_chaos',
    passcode: '30208479',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Magician of Black Chaos',
    nameVi: 'Hắc Ma Đạo Hỗn Mang (Black Chaos)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 8,
    atk: 2800,
    def: 2600,
    specialSummonHand: {
      discardHandCount: 1,
      requireHandOrFieldCardIds: ['chaos_form', 'dark_magician'],
      labelVi: 'Bỏ 1 lá -> Triệu hồi Hắc Ma Đạo',
    },
    descriptionVi:
      'Quái thú Nghi Lễ cổ điển của Yugi với 2800 ATK! Có thể gọi bằng "Chaos Form" hoặc bỏ 1 lá trên tay khi có Phù Thủy Áo Đen.',
  },
  {
    id: 'illusion_of_chaos',
    passcode: '12266229',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Illusion of Chaos',
    nameVi: 'Ảo Ảnh Hỗn Mang (Illusion of Chaos)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 7,
    atk: 2100,
    def: 2500,
    specialSummonHand: {
      labelVi: 'Đặc biệt Triệu hồi Illusion of Chaos',
    },
    descriptionVi:
      'Có thể Đặc biệt Triệu hồi từ tay. Khi triệu hồi: Tìm 1 "Phù Thủy Áo Đen" hoặc quái hỗ trợ Phù Thủy (Rod, Souls, Apprentice...) từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            categoryFilter: 'MONSTER',
            raceFilter: ['Spellcaster', 'Dragon'],
            nameContainsFilter: [
              'Dark Magician',
              'Phù Thủy Áo Đen',
              'Magician',
              'Timaeus',
              'Palladium',
              'Illusion',
              'Apprentice',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'timaeus_the_united_dragon',
    passcode: '3078380',
    archetypeTags: ['DARK_MAGICIAN', 'DRAGON'],
    name: 'Timaeus the United Dragon',
    nameVi: 'Hợp Long Timaeus (Timaeus United Dragon)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 8,
    atk: 2800,
    def: 1800,
    specialSummonHand: {
      discardHandCount: 1,
      labelVi: 'Gửi 1 lá -> Triệu hồi Hợp Long Timaeus',
    },
    descriptionVi:
      'Bỏ 1 lá trên tay để Đặc biệt Triệu hồi Timaeus! Khi ra sân: Tìm 1 "Nhãn Thần Timaeus" hoặc "Dung Hợp" từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            cardIdFilter: ['the_eye_of_timaeus', 'polymerization', 'secrets_of_dark_magic'],
          },
        ],
      },
    ],
  },
  {
    id: 'skilled_dark_magician',
    passcode: '73752131',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Skilled Dark Magician',
    nameVi: 'Hắc Pháp Sư Tinh Nhuệ (Skilled Dark)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 4,
    atk: 1900,
    def: 1700,
    descriptionVi:
      'Quái thú Cấp 4 công cao 1900 ATK. Khi vào Mộ: Hồi sinh 1 "Phù Thủy Áo Đen" từ Bộ bài hoặc Mộ lên sân!',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'skilled_white_magician',
    passcode: '46363422',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Skilled White Magician',
    nameVi: 'Bạch Pháp Sư Tinh Nhuệ (Skilled White)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 4,
    atk: 1700,
    def: 1900,
    descriptionVi:
      'Tường thủ Cấp 4 với 1900 DEF. Khi xuống Mộ: Hồi sinh 1 "Kiếm Sĩ Diệt Rồng" (Buster Blader) từ Bộ bài hoặc Mộ!',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['buster_blader'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'buster_blader',
    passcode: '78193831',
    altPasscodes: ['78193832'],
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Buster Blader',
    nameVi: 'Kiếm Sĩ Diệt Rồng (Buster Blader)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'EARTH',
    race: 'Warrior',
    level: 7,
    atk: 2600,
    def: 2300,
    descriptionVi:
      'Tăng +500 ATK cho mỗi quái thú hệ Rồng trên sân hoặc trong Mộ của đối phương! Là nguyên liệu dung hợp Hiệp Sĩ Ma Pháp Đen (Dark Paladin).',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: {
          atkDelta: 500,
          defDelta: 0,
          perRaceOnFieldAndGY: ['Dragon'],
          countOpponentOnly: true,
        },
      },
    ],
  },
  {
    id: 'breaker_the_magical_warrior',
    passcode: '71413901',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER', 'STAPLE'],
    name: 'Breaker the Magical Warrior',
    nameVi: 'Chiến Binh Ma Pháp (Breaker)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 4,
    atk: 1600,
    def: 1000,
    descriptionVi:
      'Khi Triệu hồi: Tích 1 Spell Counter (+300 ATK) và phá hủy 1 lá Bài Phép/Bẫy trên sân của đối phương!',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: { atkDelta: 300, defDelta: 0 },
      },
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_SPELLS_TRAPS', value: 1 }],
      },
    ],
  },
  {
    id: 'effect_veiler',
    passcode: '97268402',
    archetypeTags: ['BLUE_EYES', 'SPELLCASTER', 'STAPLE'],
    name: 'Effect Veiler',
    nameVi: 'Tinh Linh Màn Che (Effect Veiler)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'LIGHT',
    race: 'Spellcaster',
    level: 1,
    atk: 0,
    def: 0,
    descriptionVi:
      'HANDTRAP CẤP 1 ÁNH SÁNG: Khi quái thú đối phương tuyên bố tấn công, bỏ lá này từ trên tay xuống Mộ để phong ấn và vô hiệu hóa đòn tấn công đó!',
    effects: [
      {
        trigger: 'ON_OPPONENT_ATTACK',
        activateFromHand: true,
        actions: [{ type: 'NEGATE_ATTACK' }],
      },
    ],
  },
  {
    id: 'summoner_monk',
    passcode: '423585',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Summoner Monk',
    nameVi: 'Tu Sĩ Triệu Hồi (Summoner Monk)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 4,
    atk: 800,
    def: 1600,
    descriptionVi:
      'Khi Triệu hồi lên sân: Gọi Đặc biệt ngay 1 quái thú Phù Thủy Cấp 4 từ Bộ bài của bạn lên sân!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            raceFilter: ['Spellcaster'],
            maxLevelFilter: 4,
          },
        ],
      },
    ],
  },
  {
    id: 'legion_the_fiend_jester',
    passcode: '25280974',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Legion the Fiend Jester',
    nameVi: 'Ác Quỷ Hề Quân Đoàn (Legion Jester)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 4,
    atk: 1300,
    def: 1500,
    descriptionVi:
      'Khi từ sân xuống Mộ: Lấy 1 Phù Thủy Thường (như Phù Thủy Áo Đen, Song Tử Tinh Linh) từ Bộ bài hoặc Mộ lên tay.',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            cardIdFilter: [
              'dark_magician',
              'gemini_elf',
              'neo_magic_swordsman',
              'rogue_doll',
              'mystical_elf',
              'aqua_madoor',
            ],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'apprentice_magician',
    passcode: '9156135',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Apprentice Magician',
    nameVi: 'Pháp Sư Tập Sự (Apprentice Magician)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 2,
    atk: 400,
    def: 800,
    descriptionVi:
      'Khi xuống Mộ: Gọi Đặc biệt 1 Phù Thủy Cấp ≤ 2 từ Bộ bài của bạn lên sân.',
    effects: [
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            raceFilter: ['Spellcaster'],
            maxLevelFilter: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'crystal_seer',
    passcode: '82099401',
    archetypeTags: ['SPELLCASTER'],
    name: 'Crystal Seer',
    nameVi: 'Nhà Tiên Tri Pha Lê (Crystal Seer)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'WATER',
    race: 'Spellcaster',
    level: 1,
    atk: 100,
    def: 100,
    descriptionVi: 'LẬT (FLIP): Rút thêm 1 lá bài mới lên tay.',
    effects: [
      {
        trigger: 'ON_FLIP',
        actions: [{ type: 'DRAW_CARDS', value: 1 }],
      },
    ],
  },
  {
    id: 'gravekeepers_spy',
    passcode: '24317029',
    archetypeTags: ['SPELLCASTER'],
    name: "Gravekeeper's Spy",
    nameVi: "Điệp Viên Thủ Mộ (Gravekeeper's Spy)",
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 4,
    atk: 1200,
    def: 2000,
    descriptionVi:
      'LẬT (FLIP): Gọi Đặc biệt 1 Phù Thủy có ≤ 1500 ATK từ Bộ bài của bạn lên sân.',
    effects: [
      {
        trigger: 'ON_FLIP',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            raceFilter: ['Spellcaster'],
            maxAtkFilter: 1500,
          },
        ],
      },
    ],
  },
  {
    id: 'sorcerer_of_dark_magic',
    passcode: '88619463',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Sorcerer of Dark Magic',
    nameVi: 'Ma Đạo Sư Bóng Tối (Sorcerer Dark Magic)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 9,
    atk: 3200,
    def: 2800,
    specialSummonHand: {
      requireFaceUpRace: ['Spellcaster'],
      labelVi: 'Có Phù Thủy trên sân -> Triệu hồi 3200 ATK',
    },
    descriptionVi:
      'Trùm 3200 ATK! Nếu bạn đang điều khiển quái Phù Thủy trên sân, có thể Đặc biệt Triệu hồi thẳng từ tay. Khi ra sân: Phá 1 Bài Bẫy/Phép địch.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_SPELLS_TRAPS', value: 1 }],
      },
    ],
  },
  {
    id: 'dark_sage',
    passcode: '92377303',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Sage',
    nameVi: 'Hắc Hiền Giả (Dark Sage)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 9,
    atk: 2800,
    def: 3200,
    descriptionVi:
      'Bậc thầy cổ đại 2800 ATK / 3200 DEF. Khi Triệu hồi lên sân: Lấy ngay 1 lá Bài Phép bất kỳ từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'SEARCH_DECK_TO_HAND', categoryFilter: 'SPELL' }],
      },
    ],
  },
  {
    id: 'dark_eradicator_warlock',
    passcode: '29436665',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Eradicator Warlock',
    nameVi: 'Pháp Sư Hủy Diệt (Dark Eradicator)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 7,
    atk: 2500,
    def: 2100,
    descriptionVi:
      'Khi Triệu hồi lên sân: Bắn ngay 1000 sát thương trực tiếp vào Điểm Gốc (LP) của đối phương!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DAMAGE_LP', value: 1000, targetSide: 'OPPONENT' }],
      },
    ],
  },
  {
    id: 'dark_magician_knight',
    passcode: '50725996',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Dark Magician Knight',
    nameVi: 'Kỵ Sĩ Phù Thủy Đen (Dark Magician Knight)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'DARK',
    race: 'Warrior',
    level: 7,
    atk: 2500,
    def: 2100,
    descriptionVi:
      'Triệu hồi bằng "Danh Hiệu Kỵ Sĩ" (Knight\'s Title). Khi ra sân: Tiêu diệt 1 quái thú của đối phương!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS', value: 1 }],
      },
    ],
  },
  {
    id: 'spellbook_magician_of_prophecy',
    passcode: '14824019',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Spellbook Magician of Prophecy',
    nameVi: 'Pháp Sư Ma Đạo Thư (Spellbook Magician)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'WATER',
    race: 'Spellcaster',
    level: 2,
    atk: 500,
    def: 400,
    descriptionVi:
      'Khi Triệu hồi hoặc Lật: Lấy 1 lá Bài Phép "Ma Đạo Thư" (Spellbook) từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            categoryFilter: 'SPELL',
            nameContainsFilter: ['Spellbook', 'Ma Đạo Thư'],
          },
        ],
      },
      {
        trigger: 'ON_FLIP',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            categoryFilter: 'SPELL',
            nameContainsFilter: ['Spellbook', 'Ma Đạo Thư'],
          },
        ],
      },
    ],
  },

  // ------------------------------------------
  // EXTRA DECK - DARK MAGICIAN & SPELLCASTER
  // ------------------------------------------
  {
    id: 'dark_paladin',
    passcode: '98502115',
    altPasscodes: ['98502113', '98502114'],
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Paladin',
    nameVi: 'Hiệp Sĩ Ma Pháp Đen (Dark Paladin)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 8,
    atk: 2900,
    def: 2400,
    fusionMaterials: ['dark_magician', 'buster_blader'],
    descriptionVi:
      '"Phù Thủy Áo Đen" + "Kiếm Sĩ Diệt Rồng" (hoặc qua Nhãn Thần Timaeus). Tăng thêm +500 ATK cho MỖI quái thú hệ Rồng trên sân và dưới Mộ của cả 2 bên!',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: {
          atkDelta: 500,
          defDelta: 0,
          perRaceOnFieldAndGY: ['Dragon'],
        },
      },
    ],
  },
  {
    id: 'the_dark_magicians',
    passcode: '50237654',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'The Dark Magicians',
    nameVi: 'Cặp Đôi Hắc Pháp Sư (The Dark Magicians)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 8,
    atk: 2800,
    def: 2300,
    fusionMaterials: ['dark_magician', 'RACE:Spellcaster'],
    descriptionVi:
      '"Phù Thủy Áo Đen" + 1 quái Phù Thủy. Khi Dung Hợp lên sân: Rút 1 lá bài mới! Khi bị phá hủy: Gọi Hồi Sinh 1 Phù Thủy Áo Đen.',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DRAW_CARDS', value: 1 }],
      },
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician', 'dark_magician_girl'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dark_magician_the_dragon_knight',
    passcode: '41721210',
    archetypeTags: ['DARK_MAGICIAN', 'DRAGON'],
    name: 'Dark Magician the Dragon Knight',
    nameVi: 'Kỵ Sĩ Rồng Áo Đen (DM Dragon Knight)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Dragon',
    level: 8,
    atk: 3000,
    def: 2500,
    fusionMaterials: ['dark_magician', 'RACE:Dragon'],
    descriptionVi:
      '"Phù Thủy Áo Đen" + 1 quái Rồng (3000 ATK). Tên trên sân và Mộ được tính là "Phù Thủy Áo Đen" để kích hoạt combo Vạn Đao / Hắc Ma Đạo!',
  },
  {
    id: 'dark_magician_girl_the_dragon_knight',
    passcode: '43892408',
    altPasscodes: ['43892409'],
    archetypeTags: ['DARK_MAGICIAN', 'DRAGON'],
    name: 'Dark Magician Girl the Dragon Knight',
    nameVi: 'Nữ Hiệp Sĩ Rồng Đen (DMG Dragon Knight)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Dragon',
    level: 7,
    atk: 2600,
    def: 1700,
    fusionMaterials: ['dark_magician_girl', 'RACE:Dragon'],
    descriptionVi:
      '"Nữ Phù Thủy Áo Đen" + 1 quái Rồng. Khi Dung Hợp ra sân: Tiêu diệt 1 quái thú của đối phương!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS', value: 1 }],
      },
    ],
  },
  {
    id: 'amulet_dragon',
    passcode: '75380687',
    archetypeTags: ['DARK_MAGICIAN', 'DRAGON'],
    name: 'Amulet Dragon',
    nameVi: 'Hộ Thần Long Bùa Chú (Amulet Dragon)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Dragon',
    level: 8,
    atk: 2900,
    def: 2500,
    fusionMaterials: ['dark_magician', 'RACE:Dragon'],
    descriptionVi:
      '"Phù Thủy Áo Đen" + 1 quái Rồng. Nhận +100 ATK cho mỗi lá Bài Phép dưới Mộ/sân. Khi bị phá hủy: Hồi sinh 1 Phù Thủy từ Mộ!',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: {
          atkDelta: 100,
          defDelta: 0,
          perCategoryOnFieldAndGY: ['SPELL'],
        },
      },
      {
        trigger: 'ON_SENT_TO_GY',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            raceFilter: ['Spellcaster'],
            includeGraveyard: true,
            graveyardOnly: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dark_cavalry',
    passcode: '73452089',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Cavalry',
    nameVi: 'Kỵ Binh Bóng Đêm (Dark Cavalry)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 8,
    atk: 2800,
    def: 2300,
    fusionMaterials: ['dark_magician', 'RACE:Warrior'],
    descriptionVi:
      '"Phù Thủy Áo Đen" + 1 quái Chiến Binh. Nhận +100 ATK cho mỗi lá Phép và Bẫy đang có trên sân và dưới Mộ!',
    effects: [
      {
        trigger: 'CONTINUOUS_MONSTER',
        continuous: {
          atkDelta: 100,
          defDelta: 0,
          perCategoryOnFieldAndGY: ['SPELL', 'TRAP'],
        },
      },
    ],
  },
  {
    id: 'red_eyes_dark_dragoon',
    passcode: '37818794',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Red-Eyes Dark Dragoon',
    nameVi: 'Ma Long Kỵ Sĩ Mắt Đỏ (Dragoon)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 8,
    atk: 3000,
    def: 2500,
    fusionMaterials: ['dark_magician', 'RACE:Dragon'],
    descriptionVi:
      '"Phù Thủy Áo Đen" + 1 quái Rồng. Boss 3000 ATK cực mạnh! Khi ra sân: Phá hủy 1 quái thú đối phương và đốt 1000 LP!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          { type: 'DESTROY_OPPONENT_MONSTERS', value: 1 },
          { type: 'DAMAGE_LP', value: 1000, targetSide: 'OPPONENT' },
        ],
      },
    ],
  },
  {
    id: 'quintet_magician',
    passcode: '84433295',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Quintet Magician',
    nameVi: 'Ngũ Ma Đạo Sư (Quintet Magician)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 12,
    atk: 4500,
    def: 4500,
    fusionMaterials: ['RACE:Spellcaster', 'RACE:Spellcaster', 'RACE:Spellcaster'],
    descriptionVi:
      'Extra Deck: 3 quái hệ Phù Thủy. Trùm tối thượng 4500/4500! Khi Dung Hợp lên sân: Quét sạch TOÀN BỘ bài trên sân của đối phương!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [{ type: 'DESTROY_OPPONENT_ALL_CARDS' }],
      },
    ],
  },
  {
    id: 'master_of_chaos',
    passcode: '85059922',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Master of Chaos',
    nameVi: 'Bậc Thầy Hỗn Mang (Master of Chaos)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 8,
    atk: 3000,
    def: 2500,
    fusionMaterials: ['dark_magician', 'ATTR:DARK'],
    descriptionVi:
      '"Phù Thủy Áo Đen" + 1 quái hệ BÓNG TỐI. Khi Dung Hợp ra sân: Gọi Hồi Sinh 1 quái ÁNH SÁNG hoặc BÓNG TỐI từ Mộ lên sân!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            attributeFilter: ['LIGHT', 'DARK'],
            includeGraveyard: true,
            graveyardOnly: true,
          },
        ],
      },
    ],
  },
  {
    id: 'ebon_illusion_magician',
    passcode: '96471335',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Ebon Illusion Magician',
    nameVi: 'Ảo Thuật Gia Hắc Ám (Ebon Illusion)',
    category: 'MONSTER',
    subType: 'FUSION',
    attribute: 'DARK',
    race: 'Spellcaster',
    level: 7,
    atk: 2500,
    def: 2100,
    fusionMaterials: ['dark_magician', 'RACE:Spellcaster'],
    descriptionVi:
      'Extra Deck: "Phù Thủy Áo Đen" + 1 Phù Thủy. Khi ra sân: Gọi ngay 1 "Phù Thủy Áo Đen" từ Bộ bài lên sân!',
    effects: [
      {
        trigger: 'ON_SUMMON',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician'],
          },
        ],
      },
    ],
  },

  // ------------------------------------------
  // SPELLS & TRAPS - DARK MAGICIAN & SPELLCASTER
  // ------------------------------------------
  {
    id: 'dark_magical_circle',
    passcode: '47222536',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Magical Circle',
    nameVi: 'Ma Pháp Trận Áo Đen (Dark Magical Circle)',
    category: 'SPELL',
    subType: 'CONTINUOUS',
    descriptionVi:
      'Khi kích hoạt: Tìm 1 "Phù Thủy Áo Đen" hoặc Phép/Bẫy hỗ trợ Phù Thủy từ Bộ bài lên tay! Đồng thời tăng +200 ATK cho hệ Phù Thủy.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            nameContainsFilter: [
              'Dark Magician',
              'Phù Thủy Áo Đen',
              'Dark Magic',
              'Hắc Ma',
              'Eternal Soul',
              'Thousand Knives',
              'Illusion',
              'Timaeus',
              'Navigation',
              'Salvation',
              'Soul Servant',
            ],
          },
        ],
      },
      {
        trigger: 'CONTINUOUS_FIELD',
        continuous: {
          affectedRaces: ['Spellcaster'],
          atkDelta: 200,
          defDelta: 200,
        },
      },
    ],
  },
  {
    id: 'thousand_knives',
    passcode: '63391643',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Thousand Knives',
    nameVi: 'Vạn Đao Đoạt Mệnh (Thousand Knives)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Nếu bạn điều khiển "Phù Thủy Áo Đen": Chọn 1 quái thú trên sân đối phương và tiêu diệt nó!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          requireFaceUpCardCodes: ['dark_magician'],
          requireOpponentAnyCard: true,
        },
        target: {
          location: 'OPPONENT_MONSTER',
          promptVi: 'Chọn 1 quái thú đối phương để Vạn Đao tiêu diệt:',
        },
        actions: [{ type: 'DESTROY_TARGET' }],
      },
    ],
  },
  {
    id: 'dark_magic_attack',
    passcode: '2314238',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Dark Magic Attack',
    nameVi: 'Hắc Ma Đạo Oanh Kích (Dark Magic Attack)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Nếu bạn điều khiển "Phù Thủy Áo Đen": Quét sạch toàn bộ Bài Phép và Bài Bẫy trên sân đối phương!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          requireFaceUpCardCodes: ['dark_magician'],
          requireOpponentSpellTrap: true,
        },
        actions: [{ type: 'DESTROY_OPPONENT_SPELLS_TRAPS' }],
      },
    ],
  },
  {
    id: 'dark_burning_attack',
    passcode: '49702428',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Dark Burning Attack',
    nameVi: 'Hắc Viêm Đạo (Dark Burning Attack)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Nếu bạn điều khiển "Nữ Phù Thủy Áo Đen": Tiêu diệt toàn bộ quái thú trên sân đối phương!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          requireFaceUpCardCodes: ['dark_magician_girl', 'dark_magician_girl_the_dragon_knight'],
        },
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS' }],
      },
    ],
  },
  {
    id: 'dark_burning_magic',
    passcode: '75190122',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Dark Burning Magic',
    nameVi: 'Song Pháp Hợp Kích (Dark Burning Magic)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Nếu bạn điều khiển CẢ "Phù Thủy Áo Đen" VÀ "Nữ Phù Thủy Áo Đen": Tiêu diệt toàn bộ mọi lá bài trên sân đối phương!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          requireFaceUpAllCardCodes: ['dark_magician', 'dark_magician_girl'],
          requireOpponentAnyCard: true,
        },
        actions: [{ type: 'DESTROY_OPPONENT_ALL_CARDS' }],
      },
    ],
  },
  {
    id: 'bond_between_teacher_and_student',
    passcode: '60709218',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Bond Between Teacher and Student',
    nameVi: 'Tình Thầy Trò Ma Pháp (Bond Teacher)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Nếu bạn điều khiển "Phù Thủy Áo Đen": Gọi Đặc biệt ngay "Nữ Phù Thủy Áo Đen" từ Bộ bài/Mộ lên sân, sau đó lấy 1 Phép hợp kích (Dark Burning Magic / Dark Magic Attack)!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          requireFaceUpCardCodes: ['dark_magician'],
        },
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician_girl'],
            includeGraveyard: true,
          },
          {
            type: 'SEARCH_DECK_TO_HAND',
            cardIdFilter: [
              'dark_burning_magic',
              'dark_burning_attack',
              'dark_magic_attack',
              'dark_magic_twin_burst',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'illusion_magic',
    passcode: '73616671',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Illusion Magic',
    nameVi: 'Ảo Thuật Triệu Hồi (Illusion Magic)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Hiến tế 1 quái Phù Thủy trên sân của bạn; lấy tối đa 2 "Phù Thủy Áo Đen" từ Bộ bài hoặc Mộ lên tay!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_MONSTER',
          faceUpOnly: true,
          allowedRaces: ['Spellcaster'],
          promptVi: 'Chọn 1 quái Phù Thủy trên sân để hiến tế & lấy 2 Phù Thủy Áo Đen:',
        },
        actions: [
          { type: 'TRIBUTE_TARGET_MONSTER' },
          {
            type: 'SEARCH_DECK_TO_HAND',
            cardIdFilter: ['dark_magician'],
            selectCount: 2,
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dark_magic_curtain',
    passcode: '99789342',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Magic Curtain',
    nameVi: 'Bức Màn Hắc Ma Đạo (Dark Magic Curtain)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Trả một nửa LP hiện tại của bạn: Triệu hồi Đặc biệt 1 "Phù Thủy Áo Đen" thẳng từ Bộ bài lên sân!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { halfLpCost: true },
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician'],
          },
        ],
      },
    ],
  },
  {
    id: 'secrets_of_dark_magic',
    passcode: '59514116',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Secrets of Dark Magic',
    nameVi: 'Bí Mật Hắc Ma Đạo (Secrets Dark Magic)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Triệu hồi Dung Hợp 1 quái thú từ Extra Deck bằng nguyên liệu từ tay hoặc sân của bạn!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'FUSION_SUMMON' }],
      },
    ],
  },
  {
    id: 'the_eye_of_timaeus',
    passcode: '1784686',
    archetypeTags: ['DARK_MAGICIAN', 'DRAGON'],
    name: 'The Eye of Timaeus',
    nameVi: 'Nhãn Thần Timaeus (The Eye of Timaeus)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Chọn 1 "Phù Thủy Áo Đen" hoặc "Nữ Phù Thủy Áo Đen" trên sân của bạn; Dung Hợp biến nó thành quái Dung Hợp (Dark Paladin, DM Dragon Knight, Amulet Dragon...) chỉ cần CHÍNH LÁ ĐÓ làm nguyên liệu!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_MONSTER',
          faceUpOnly: true,
          allowedCardIds: [
            'dark_magician',
            'dark_magician_girl',
            'magician_of_dark_illusion',
            'dark_magician_the_dragon_knight',
          ],
          promptVi: 'Chọn Phù Thủy Áo Đen / Nữ Phù Thủy trên sân để Dung Hợp bằng Nhãn Thần:',
        },
        actions: [{ type: 'FUSION_SUMMON', useTargetAsOnlyFusionMaterial: true }],
      },
    ],
  },
  {
    id: 'soul_servant',
    passcode: '23020408',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Soul Servant',
    nameVi: 'Linh Hồn Hầu Cận (Soul Servant)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Tìm 1 lá "Phù Thủy Áo Đen" hoặc lá hỗ trợ Phù Thủy (Mahad, Mana, Timaeus, Eternal Soul...) từ Bộ bài hoặc Mộ lên tay!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            nameContainsFilter: [
              'Dark Magician',
              'Phù Thủy Áo Đen',
              'Dark Magic',
              'Mahad',
              'Mana',
              'Eternal Soul',
              'Timaeus',
              'Illusion',
              'Knives',
            ],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dark_magic_inheritance',
    passcode: '41735184',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Dark Magic Inheritance',
    nameVi: 'Kế Thừa Hắc Ma Đạo (Inheritance)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Tìm và lấy 1 lá Bài Phép hoặc Bài Bẫy liên quan đến "Phù Thủy Áo Đen" từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            categoryFilter: 'SPELL_OR_TRAP',
            nameContainsFilter: [
              'Dark Magic',
              'Dark Magical',
              'Hắc Ma',
              'Thousand Knives',
              'Eternal Soul',
              'Illusion',
              'Timaeus',
              'Sage',
              'Curtain',
              'Dark Burning',
              'Soul Servant',
              'Navigation',
              'Teacher',
              'Bond',
              "Magicians'",
              'Destined',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'dark_magic_expanded',
    passcode: '111280',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Magic Expanded',
    nameVi: 'Giải Phóng Hắc Ma Đạo (+1000 ATK)',
    category: 'SPELL',
    subType: 'EQUIP',
    descriptionVi:
      'Chọn 1 quái thú Phù Thủy ngửa trên sân; gia tăng thêm +1000 ATK cho nó!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'FIELD_MONSTER',
          faceUpOnly: true,
          allowedRaces: ['Spellcaster'],
          promptVi: 'Chọn 1 quái Phù Thủy ngửa để tăng +1000 ATK:',
        },
        actions: [{ type: 'EQUIP_TO_TARGET' }],
      },
      {
        trigger: 'CONTINUOUS_EQUIP',
        continuous: { atkDelta: 1000, defDelta: 0 },
      },
    ],
  },
  {
    id: 'dark_magic_twin_burst',
    passcode: '70168345',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Dark Magic Twin Burst',
    nameVi: 'Song Kích Hắc Ma Đạo (+2000 ATK)',
    category: 'SPELL',
    subType: 'EQUIP',
    descriptionVi:
      'Trang bị sức mạnh cộng hưởng thầy trò cho "Phù Thủy Áo Đen": Tăng ngay +2000 ATK!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'FIELD_MONSTER',
          faceUpOnly: true,
          allowedCardIds: [
            'dark_magician',
            'magician_of_dark_illusion',
            'dark_magician_the_dragon_knight',
          ],
          promptVi: 'Chọn Phù Thủy Áo Đen để cường hóa +2000 ATK:',
        },
        actions: [{ type: 'EQUIP_TO_TARGET' }],
      },
      {
        trigger: 'CONTINUOUS_EQUIP',
        continuous: { atkDelta: 2000, defDelta: 0 },
      },
    ],
  },
  {
    id: 'sages_stone',
    passcode: '13604200',
    archetypeTags: ['DARK_MAGICIAN'],
    name: "Sage's Stone",
    nameVi: "Đá Hiền Triết (Sage's Stone)",
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Nếu bạn đang điều khiển "Nữ Phù Thủy Áo Đen" ngửa trên sân: Triệu hồi Đặc biệt 1 "Phù Thủy Áo Đen" từ trên tay hoặc Bộ bài!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          requireFaceUpCardCodes: ['dark_magician_girl', 'dark_magician_girl_the_dragon_knight'],
        },
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician'],
          },
        ],
      },
    ],
  },
  {
    id: 'magic_formula',
    passcode: '67227834',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Magic Formula',
    nameVi: 'Công Thức Ma Pháp (+700 ATK)',
    category: 'SPELL',
    subType: 'EQUIP',
    descriptionVi:
      'Chỉ trang bị cho "Phù Thủy Áo Đen" hoặc "Nữ Phù Thủy Áo Đen". Tăng +700 ATK!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'FIELD_MONSTER',
          faceUpOnly: true,
          allowedCardIds: [
            'dark_magician',
            'dark_magician_girl',
            'magician_of_dark_illusion',
            'dark_magician_the_dragon_knight',
          ],
          promptVi: 'Chọn Phù Thủy Áo Đen / Nữ Phù Thủy để trang bị (+700 ATK):',
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
    id: 'knights_title',
    passcode: '87210505',
    archetypeTags: ['DARK_MAGICIAN'],
    name: "Knight's Title",
    nameVi: "Danh Hiệu Kỵ Sĩ (Knight's Title)",
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Hiến tế 1 "Phù Thủy Áo Đen" ngửa trên sân để gọi ngay "Kỵ Sĩ Phù Thủy Đen" (Dark Magician Knight) từ Bộ bài/Mộ!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_MONSTER',
          faceUpOnly: true,
          allowedCardIds: ['dark_magician', 'magician_of_dark_illusion', 'dark_magician_the_dragon_knight'],
          promptVi: 'Chọn 1 Phù Thủy Áo Đen để hiến tế & triệu hồi Kỵ Sĩ Phù Thủy Đen:',
        },
        actions: [
          { type: 'TRIBUTE_TARGET_MONSTER' },
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician_knight'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dedication_through_light_and_darkness',
    passcode: '69542930',
    archetypeTags: ['DARK_MAGICIAN'],
    name: 'Dedication through Light and Darkness',
    nameVi: 'Hiến Dâng Ánh Sáng Tối (Dedication)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Hiến tế 1 "Phù Thủy Áo Đen" ngửa trên sân để gọi ngay "Phù Thủy Hỗn Mang" (Dark Magician of Chaos 2800 ATK) từ Bộ bài/Mộ!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_MONSTER',
          faceUpOnly: true,
          allowedCardIds: ['dark_magician', 'magician_of_dark_illusion'],
          promptVi: 'Chọn Phù Thủy Áo Đen để hiến tế & triệu hồi Dark Magician of Chaos:',
        },
        actions: [
          { type: 'TRIBUTE_TARGET_MONSTER' },
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician_of_chaos'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'diffusion_wave_motion',
    passcode: '87880531',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Diffusion Wave-Motion',
    nameVi: 'Sóng Ma Pháp Khuếch Tán (Diffusion Wave)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Khi bạn điều khiển Phù Thủy ngửa Cấp 7+: Trả 1000 LP để quét sạch quái thú đối phương!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: {
          lpCost: 1000,
          requireFaceUpRace: ['Spellcaster'],
          requireOpponentFaceUpMonster: false,
        },
        actions: [{ type: 'DESTROY_OPPONENT_MONSTERS' }],
      },
    ],
  },
  {
    id: 'magical_dimension',
    passcode: '28553439',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Magical Dimension',
    nameVi: 'Không Gian Ma Pháp (Magical Dimension)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Hiến tế 1 quái thú của bạn để Triệu hồi Đặc biệt 1 Phù Thủy từ trên tay (như Phù Thủy Áo Đen) và phá 1 quái thú đối phương!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireFaceUpRace: ['Spellcaster'] },
        target: {
          location: 'OWN_MONSTER',
          promptVi: 'Chọn 1 quái thú trên sân để hiến tế & gọi Phù Thủy từ tay:',
        },
        actions: [
          { type: 'TRIBUTE_TARGET_MONSTER' },
          {
            type: 'SPECIAL_SUMMON_HAND_MONSTERS',
            raceFilter: ['Spellcaster'],
            maxSummonCount: 1,
          },
          { type: 'DESTROY_OPPONENT_MONSTERS', value: 1 },
        ],
      },
    ],
  },
  {
    id: 'secret_village_of_the_spellcasters',
    passcode: '68462976',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Secret Village of the Spellcasters',
    nameVi: 'Bí Ẩn Làng Phù Thủy (Secret Village)',
    category: 'SPELL',
    subType: 'FIELD',
    descriptionVi:
      'SÂN MÔI TRƯỜNG: Toàn bộ quái thú hệ Phù Thủy (Spellcaster) được tăng +300 ATK và +300 DEF.',
    effects: [
      {
        trigger: 'CONTINUOUS_FIELD',
        continuous: {
          affectedRaces: ['Spellcaster'],
          atkDelta: 300,
          defDelta: 300,
        },
      },
    ],
  },
  {
    id: 'magicians_salvation',
    passcode: '95477924',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: "Magician's Salvation",
    nameVi: "Thánh Địa Cứu Rỗi (Magician's Salvation)",
    category: 'SPELL',
    subType: 'FIELD',
    descriptionVi:
      'SÂN MÔI TRƯỜNG: Khi kích hoạt, tìm 1 "Linh Hồn Vĩnh Cửu" (Eternal Soul) từ Bộ bài lên tay! Cộng thêm +200 ATK/DEF cho hệ Phù Thủy.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'SEARCH_DECK_TO_HAND', cardIdFilter: ['eternal_soul'] }],
      },
      {
        trigger: 'CONTINUOUS_FIELD',
        continuous: {
          affectedRaces: ['Spellcaster'],
          atkDelta: 200,
          defDelta: 200,
        },
      },
    ],
  },
  {
    id: 'spellbook_of_secrets',
    passcode: '89739383',
    archetypeTags: ['SPELLCASTER'],
    name: 'Spellbook of Secrets',
    nameVi: 'Ma Đạo Thư Bí Mật (Spellbook Secrets)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Tìm và lấy 1 lá bài thuộc bộ "Ma Đạo Thư" (Spellbook) từ Bộ bài lên tay.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            nameContainsFilter: ['Spellbook', 'Ma Đạo Thư'],
          },
        ],
      },
    ],
  },
  {
    id: 'spellbook_of_knowledge',
    passcode: '23314220',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Spellbook of Knowledge',
    nameVi: 'Ma Đạo Thư Tri Thức (Spellbook Knowledge)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Gửi 1 quái Phù Thủy bạn điều khiển xuống Mộ, sau đó rút 2 lá bài mới!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_MONSTER',
          faceUpOnly: true,
          allowedRaces: ['Spellcaster'],
          promptVi: 'Chọn 1 quái Phù Thủy trên sân để gửi xuống Mộ & rút 2 lá:',
        },
        actions: [{ type: 'TRIBUTE_TARGET_MONSTER' }, { type: 'DRAW_CARDS', value: 2 }],
      },
    ],
  },
  {
    id: 'eternal_soul',
    passcode: '48680970',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Eternal Soul',
    nameVi: 'Linh Hồn Vĩnh Cửu (Eternal Soul)',
    category: 'TRAP',
    subType: 'CONTINUOUS',
    descriptionVi:
      'Bẫy Vĩnh cửu hồi sinh của Yugi: Triệu hồi Đặc biệt ngay 1 "Phù Thủy Áo Đen" từ Mộ hoặc Bộ bài lên sân!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            cardIdFilter: ['dark_magician', 'magician_of_dark_illusion'],
            includeGraveyard: true,
          },
        ],
      },
    ],
  },
  {
    id: 'magician_navigation',
    passcode: '7922915',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Magician Navigation',
    nameVi: 'Dẫn Lối Pháp Sư (Magician Navigation)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi:
      'Triệu hồi Đặc biệt 1 "Phù Thủy Áo Đen" từ tay (nếu có) và gọi thêm 1 Phù Thủy BÓNG TỐI Cấp ≤ 7 từ Bộ bài lên sân!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SPECIAL_SUMMON_HAND_MONSTERS',
            cardIdFilter: ['dark_magician'],
            maxSummonCount: 1,
          },
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            raceFilter: ['Spellcaster'],
            attributeFilter: ['DARK'],
            maxLevelFilter: 7,
          },
        ],
      },
    ],
  },
  {
    id: 'magicians_combination',
    passcode: '86509711',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: "Magicians' Combination",
    nameVi: "Hợp Kích Pháp Sư (Magicians' Combination)",
    category: 'TRAP',
    subType: 'CONTINUOUS',
    descriptionVi:
      'Bẫy phản kích kép: Khi địch kích hoạt Bẫy hoặc Tấn công -> Chặn đứng & vô hiệu hóa hoàn toàn!',
    effects: [
      {
        trigger: 'ON_OPPONENT_TRAP',
        actions: [{ type: 'NEGATE_AND_DESTROY_TRAP' }],
      },
      {
        trigger: 'ON_OPPONENT_ATTACK',
        actions: [{ type: 'NEGATE_ATTACK' }],
      },
    ],
  },
  {
    id: 'magicians_circle',
    passcode: '50755',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: "Magician's Circle",
    nameVi: "Vòng Tròn Pháp Sư (Magician's Circle)",
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi:
      'Khi đối phương tuyên bố tấn công: Gọi ngay 1 Phù Thủy ≤ 2000 ATK (như Nữ Phù Thủy Áo Đen) từ Bộ bài ra đỡ đòn!',
    effects: [
      {
        trigger: 'ON_OPPONENT_ATTACK',
        actions: [
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            raceFilter: ['Spellcaster'],
            maxAtkFilter: 2000,
          },
        ],
      },
    ],
  },
  {
    id: 'dark_horizon',
    passcode: '16964437',
    archetypeTags: ['DARK_MAGICIAN', 'SPELLCASTER'],
    name: 'Dark Horizon',
    nameVi: 'Chân Trời Bóng Đêm (Dark Horizon)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi:
      'Khi quái địch tấn công: Vô hiệu đòn đánh và gọi ngay 1 Phù Thủy BÓNG TỐI (như Phù Thủy Áo Đen) từ Bộ bài lên sân!',
    effects: [
      {
        trigger: 'ON_OPPONENT_ATTACK',
        actions: [
          { type: 'NEGATE_ATTACK' },
          {
            type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY',
            raceFilter: ['Spellcaster'],
            attributeFilter: ['DARK'],
          },
        ],
      },
    ],
  },
  {
    id: 'destined_rivals',
    passcode: '22634473',
    archetypeTags: ['BLUE_EYES', 'DARK_MAGICIAN'],
    name: 'Destined Rivals',
    nameVi: 'Kỳ Phùng Địch Thủ (Destined Rivals)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi:
      'Lá bài biểu tượng của Yugi & Kaiba! Khi đối phương triệu hồi hoặc tấn công: Vô hiệu đòn đánh và tiêu diệt quái đó!',
    effects: [
      {
        trigger: 'ON_OPPONENT_SUMMON',
        actions: [{ type: 'DESTROY_TRIGGER_MONSTER' }],
      },
      {
        trigger: 'ON_OPPONENT_ATTACK',
        actions: [
          { type: 'NEGATE_ATTACK' },
          { type: 'DESTROY_ATTACKING_MONSTER' },
        ],
      },
    ],
  },
];

export const STAPLE_YDK_CARDS: CardDefinition[] = [
  {
    id: 'allure_of_darkness',
    passcode: '1475311',
    archetypeTags: ['DARK_MAGICIAN', 'STAPLE'],
    name: 'Allure of Darkness',
    nameVi: 'Mê Hoặc Bóng Tối (Allure of Darkness)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Rút 2 lá bài từ Bộ bài, sau đó chọn bỏ 1 lá trên tay xuống Mộ.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          { type: 'DRAW_CARDS', value: 2 },
          { type: 'DISCARD_FROM_HAND', value: 1 },
        ],
      },
    ],
  },
  {
    id: 'harpies_feather_duster',
    passcode: '18144506',
    altPasscodes: ['18144507'],
    archetypeTags: ['STAPLE'],
    name: "Harpie's Feather Duster",
    nameVi: 'Chổi Lông Vũ Harpie (Feather Duster)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Thổi bay và phá hủy toàn bộ Bài Phép & Bài Bẫy trên sân đối phương!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireOpponentSpellTrap: true },
        actions: [{ type: 'DESTROY_OPPONENT_SPELLS_TRAPS' }],
      },
    ],
  },
  {
    id: 'foolish_burial',
    passcode: '81439173',
    altPasscodes: ['81439174'],
    archetypeTags: ['BLUE_EYES', 'DARK_MAGICIAN', 'STAPLE'],
    name: 'Foolish Burial',
    nameVi: 'Mai Táng Ngu Xuẩn (Foolish Burial)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Chọn và gửi thẳng 1 quái thú từ Bộ bài của bạn xuống Mộ (rất mạnh để nạp Bạch Ngọc / Rồng Trắng / Phù Thủy Áo Đen xuống Mộ!).',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'MILL_TO_GY', selectCount: 1 }],
      },
    ],
  },
  {
    id: 'book_of_moon',
    passcode: '14087893',
    archetypeTags: ['STAPLE'],
    name: 'Book of Moon',
    nameVi: 'Cuốn Sách Mặt Trăng (Book of Moon)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi: 'Chọn 1 quái thú đang ngửa trên sân và lật úp nó xuống thế Phòng Thủ.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'FIELD_MONSTER',
          faceUpOnly: true,
          promptVi: 'Chọn 1 quái thú đang ngửa để úp mặt xuống thế Thủ:',
        },
        actions: [{ type: 'CHANGE_TARGET_FACE_DOWN' }],
      },
    ],
  },
  {
    id: 'pot_of_duality',
    passcode: '98645731',
    archetypeTags: ['STAPLE'],
    name: 'Pot of Duality',
    nameVi: 'Bình Lưỡng Tính (Pot of Duality)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Rút thêm 1 lá bài từ Bộ bài lên tay để xoay tua bộ bài nhanh chóng.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [{ type: 'DRAW_CARDS', value: 1 }],
      },
    ],
  },
  {
    id: 'terraforming',
    passcode: '73628505',
    archetypeTags: ['BLUE_EYES', 'DARK_MAGICIAN', 'STAPLE'],
    name: 'Terraforming',
    nameVi: 'Khai Phá Lục Địa (Terraforming)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Tìm và lấy 1 lá Bài Phép Môi Trường (Lăng Mộ Trắng, Làng Phù Thủy, Yami, Đỉnh Núi...) từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            categoryFilter: 'SPELL',
            subTypeFilter: ['FIELD'],
          },
        ],
      },
    ],
  },
  {
    id: 'one_for_one',
    passcode: '2295440',
    archetypeTags: ['BLUE_EYES', 'DARK_MAGICIAN', 'STAPLE'],
    name: 'One for One',
    nameVi: 'Một Đổi Một (One for One)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Bỏ 1 quái thú trên tay xuống Mộ; Triệu hồi Đặc biệt 1 quái thú Cấp 1 (Maiden, Sage, Bạch Ngọc, Linh Hồn Pháp Sư) thẳng từ Bộ bài lên sân!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OWN_HAND_MONSTER',
          promptVi: 'Chọn 1 quái thú trên tay để gửi xuống Mộ:',
        },
        actions: [
          { type: 'DISCARD_TARGET_HAND_CARD' },
          { type: 'SPECIAL_SUMMON_FROM_DECK_OR_GY', maxLevelFilter: 1 },
        ],
      },
    ],
  },
  {
    id: 'reinforcement_of_the_army',
    passcode: '32807846',
    archetypeTags: ['STAPLE'],
    name: 'Reinforcement of the Army',
    nameVi: 'Viện Binh Lục Quân (ROTA)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi: 'Lấy 1 quái thú hệ Chiến Binh (Warrior) Cấp ≤ 4 từ Bộ bài lên tay.',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            categoryFilter: 'MONSTER',
            raceFilter: ['Warrior'],
            maxLevelFilter: 4,
          },
        ],
      },
    ],
  },
  {
    id: 'called_by_the_grave',
    passcode: '24224830',
    archetypeTags: ['STAPLE'],
    name: 'Called by the Grave',
    nameVi: 'Tiếng Gọi Nơi Mộ Địa (Called by Grave)',
    category: 'SPELL',
    subType: 'QUICK_PLAY',
    descriptionVi:
      'Chọn 1 quái thú trong Mộ của đối phương; Trục xuất (Banish) nó khỏi Mộ ngay lập tức để ngăn hồi sinh!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        target: {
          location: 'OPPONENT_GRAVEYARD_MONSTER',
          promptVi: 'Chọn 1 quái thú trong Mộ đối phương để trục xuất:',
        },
        actions: [{ type: 'BANISH_FROM_GY' }],
      },
    ],
  },
  {
    id: 'preparation_of_rites',
    passcode: '96729612',
    archetypeTags: ['DARK_MAGICIAN', 'STAPLE'],
    name: 'Preparation of Rites',
    nameVi: 'Chuẩn Bị Nghi Lễ (Preparation of Rites)',
    category: 'SPELL',
    subType: 'NORMAL',
    descriptionVi:
      'Tìm 1 quái Nghi Lễ Cấp ≤ 7 (như Ảo Ảnh Hỗn Mang, Pháp Sư Hỗn Mang) hoặc "Chaos Form" từ Bộ bài lên tay!',
    effects: [
      {
        trigger: 'ON_ACTIVATE',
        actions: [
          {
            type: 'SEARCH_DECK_TO_HAND',
            nameContainsFilter: ['Chaos', 'Hỗn Mang'],
          },
        ],
      },
    ],
  },
  {
    id: 'ash_blossom_joyous_spring',
    passcode: '14558127',
    altPasscodes: ['14558128'],
    archetypeTags: ['STAPLE'],
    name: 'Ash Blossom & Joyous Spring',
    nameVi: 'Hoa Anh Đào Xuân (Ash Blossom)',
    category: 'MONSTER',
    subType: 'EFFECT',
    attribute: 'FIRE',
    race: 'Zombie',
    level: 3,
    atk: 0,
    def: 1800,
    descriptionVi:
      'HANDTRAP QUỐC DÂN: Khi đối phương kích hoạt Bài Bẫy hoặc Tuyên bố tấn công, có thể bỏ lá này từ trên tay để Vô hiệu & Phá hủy Bẫy hoặc Chặn đứng đòn đánh!',
    effects: [
      {
        trigger: 'ON_OPPONENT_TRAP',
        activateFromHand: true,
        actions: [{ type: 'NEGATE_AND_DESTROY_TRAP' }],
      },
      {
        trigger: 'ON_OPPONENT_ATTACK',
        activateFromHand: true,
        actions: [{ type: 'NEGATE_ATTACK' }],
      },
    ],
  },
  {
    id: 'infinite_impermanence',
    passcode: '10045474',
    archetypeTags: ['STAPLE'],
    name: 'Infinite Impermanence',
    nameVi: 'Ảo Ảnh Vô Cực (Infinite Impermanence)',
    category: 'TRAP',
    subType: 'NORMAL',
    descriptionVi:
      'HANDTRAP BẪY: Khi đối phương Triệu hồi quái thú, có thể kích hoạt ngay từ trên tay hoặc trên sân để vô hiệu và tiêu diệt quái thú đó!',
    effects: [
      {
        trigger: 'ON_OPPONENT_SUMMON',
        activateFromHand: true,
        actions: [{ type: 'DESTROY_TRIGGER_MONSTER' }],
      },
      {
        trigger: 'ON_ACTIVATE',
        condition: { requireOpponentFaceUpMonster: true },
        target: {
          location: 'OPPONENT_MONSTER',
          faceUpOnly: true,
          promptVi: 'Chọn 1 quái thú ngửa đối phương để phá hủy:',
        },
        actions: [{ type: 'DESTROY_TARGET' }],
      },
    ],
  },
];

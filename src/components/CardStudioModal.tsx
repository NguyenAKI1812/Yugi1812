import React, { useMemo, useState } from 'react';
import {
  Attribute,
  CardCategory,
  CardDefinition,
  MonsterRace,
} from '../types/game';
import {
  BASE_CARDS,
  CLASSIC_EXPANSION_PACK,
  deleteCustomCard,
  getAllCards,
  getCardArtUrl,
  getCardByExactName,
  getCardByPasscode,
  getCustomCards,
  saveCustomCard,
  saveCustomCardsBulk,
} from '../data/cards.catalog';
import {
  buildEffectsFromTemplate,
  EFFECT_TEMPLATE_OPTIONS,
  EffectTemplateKey,
  fetchYgoProCardsByQuery,
  inferCardFromYgoPro,
  inferTemplateFromCardDefinition,
  YgoProApiCard,
} from '../utils/cardImport';
import { YugiH5HandCard } from './YugiH5Card';
import {
  Search,
  Plus,
  Trash2,
  Code,
  Sparkles,
  X,
  Zap,
  PackagePlus,
  FileJson,
  CheckCircle2,
  Edit3,
  Copy,
  RotateCcw,
} from 'lucide-react';

interface CardStudioModalProps {
  onClose: () => void;
  onCardsUpdated: () => void;
}

const ALL_RACES: { value: MonsterRace; label: string }[] = [
  { value: 'Dragon', label: 'Dragon (Rồng)' },
  { value: 'Spellcaster', label: 'Spellcaster (Phù Thủy)' },
  { value: 'Warrior', label: 'Warrior (Chiến Binh)' },
  { value: 'Fiend', label: 'Fiend (Ác Quỷ)' },
  { value: 'Fairy', label: 'Fairy (Tiên)' },
  { value: 'Zombie', label: 'Zombie (Xác Sống)' },
  { value: 'Machine', label: 'Machine (Máy Móc)' },
  { value: 'Aqua', label: 'Aqua (Nước)' },
  { value: 'Pyro', label: 'Pyro (Lửa)' },
  { value: 'Rock', label: 'Rock (Đá)' },
  { value: 'Winged Beast', label: 'Winged Beast (Điểu Thú)' },
  { value: 'Beast', label: 'Beast (Thú)' },
  { value: 'Beast-Warrior', label: 'Beast-Warrior (Thú Chiến)' },
  { value: 'Insect', label: 'Insect (Côn Trùng)' },
  { value: 'Dinosaur', label: 'Dinosaur (Khủng Long)' },
  { value: 'Fish', label: 'Fish (Cá)' },
  { value: 'Sea Serpent', label: 'Sea Serpent (Hải Xà)' },
  { value: 'Reptile', label: 'Reptile (Bò Sát)' },
  { value: 'Plant', label: 'Plant (Thực Vật)' },
  { value: 'Thunder', label: 'Thunder (Sấm Sét)' },
];

export const CardStudioModal: React.FC<CardStudioModalProps> = ({
  onClose,
  onCardsUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<YgoProApiCard[]>([]);
  const [autoDetectHint, setAutoDetectHint] = useState<string>('');
  const [statusBanner, setStatusBanner] = useState<string>('');

  // Form editor state
  const [id, setId] = useState('');
  const [passcode, setPasscode] = useState('89631139');
  const [name, setName] = useState('');
  const [nameVi, setNameVi] = useState('');
  const [category, setCategory] = useState<CardCategory>('MONSTER');
  const [attribute, setAttribute] = useState<Attribute>('DARK');
  const [race, setRace] = useState<MonsterRace>('Warrior');
  const [level, setLevel] = useState(4);
  const [atk, setAtk] = useState(1800);
  const [def, setDef] = useState(1200);
  const [descriptionVi, setDescriptionVi] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [effectTemplate, setEffectTemplate] = useState<EffectTemplateKey>('NONE');
  const [effectNumberParam, setEffectNumberParam] = useState(1000);

  const [customCards, setCustomCards] = useState<CardDefinition[]>(() => getCustomCards());
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Batch JSON drawer & Expansion drawer
  const [showExpansionDrawer, setShowExpansionDrawer] = useState(false);
  const [showBatchImportDrawer, setShowBatchImportDrawer] = useState(false);
  const [batchJsonText, setBatchJsonText] = useState('');
  const [batchError, setBatchError] = useState('');

  const customIdsSet = useMemo(() => new Set(customCards.map((c) => c.id)), [customCards]);
  const baseIdsSet = useMemo(() => new Set(BASE_CARDS.map((c) => c.id)), []);
  const unlockedExpansionCount = useMemo(
    () => CLASSIC_EXPANSION_PACK.filter((c) => customIdsSet.has(c.id)).length,
    [customIdsSet]
  );

  const showNotice = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((curr) => (curr === msg ? '' : curr));
    }, 4500);
  };

  const resetForm = () => {
    setId('');
    setPasscode('89631139');
    setName('');
    setNameVi('');
    setCategory('MONSTER');
    setAttribute('DARK');
    setRace('Warrior');
    setLevel(4);
    setAtk(1800);
    setDef(1200);
    setDescriptionVi('');
    setCustomImageUrl('');
    setEffectTemplate('NONE');
    setEffectNumberParam(1000);
    setAutoDetectHint('');
  };

  const loadCardIntoForm = (card: CardDefinition, hint?: string, detectedTpl?: EffectTemplateKey, detectedParam?: number) => {
    setId(card.id);
    setPasscode(card.passcode);
    setName(card.name);
    setNameVi(card.nameVi);
    setCategory(card.category);
    if (card.attribute) setAttribute(card.attribute);
    if (card.race) setRace(card.race);
    if (card.level !== undefined) setLevel(card.level);
    if (card.atk !== undefined) setAtk(card.atk);
    if (card.def !== undefined) setDef(card.def);
    setDescriptionVi(card.descriptionVi);
    setCustomImageUrl(card.customImageUrl ?? '');

    if (detectedTpl) {
      setEffectTemplate(detectedTpl);
      setEffectNumberParam(detectedParam ?? 1000);
    } else {
      const inferred = inferTemplateFromCardDefinition(card);
      setEffectTemplate(inferred.template);
      setEffectNumberParam(inferred.param);
    }
    setAutoDetectHint(hint ?? '');
  };

  const handleFetchFromYGOProDeck = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const rows = await fetchYgoProCardsByQuery(searchQuery.trim(), 12);
      setSearchResults(rows);
      if (rows.length === 0) {
        setSearchError('Không tìm thấy lá bài này trên YGOProDeck. Hãy thử gõ từ khóa tiếng Anh ngắn hơn.');
      } else {
        const builtIn = getCardByExactName(rows[0].name);
        if (builtIn) {
          loadCardIntoForm(builtIn, `Lá [${builtIn.nameVi}] đã có sẵn Việt hóa chuẩn trong game!`);
        } else {
          // Tự nạp lá đầu tiên (đã Việt hóa tên + mô tả) vào trình xem trước
          const firstMapped = inferCardFromYgoPro(rows[0]);
          loadCardIntoForm(
            firstMapped.card,
            firstMapped.confidenceVi,
            firstMapped.detectedTemplate,
            firstMapped.detectedParam
          );
        }
      }
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Lỗi kết nối API YGOProDeck');
    } finally {
      setSearching(false);
    }
  };

  const handleQuickSaveSearchResult = (apiCard: YgoProApiCard) => {
    const builtIn = getCardByExactName(apiCard.name);
    if (builtIn && baseIdsSet.has(builtIn.id)) {
      loadCardIntoForm(builtIn, `Lá [${builtIn.nameVi}] đã có sẵn trong Kho bài Việt hóa!`);
      showNotice(`ℹ️ [${builtIn.nameVi}] đã có sẵn Việt hóa trong bộ bài gốc — không cần thêm trùng!`);
      return;
    }
    const mapped = inferCardFromYgoPro(apiCard);
    const updated = saveCustomCard(mapped.card);
    setCustomCards(updated);
    onCardsUpdated();
    loadCardIntoForm(
      mapped.card,
      mapped.confidenceVi,
      mapped.detectedTemplate,
      mapped.detectedParam
    );
    showNotice(`⚡ Đã lưu nhanh [${mapped.card.nameVi}] (${mapped.confidenceVi}) vào kho bài!`);
  };

  const buildCardObject = (): CardDefinition => {
    const { subType, effects } = buildEffectsFromTemplate(
      category,
      effectTemplate,
      effectNumberParam
    );

    const cleanId =
      id.trim() ||
      (name || nameVi || 'custom_card')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

    return {
      id: cleanId,
      passcode: passcode.trim() || '89631139',
      name: name.trim() || nameVi.trim() || 'Custom Card',
      nameVi: nameVi.trim() || name.trim() || 'Bài Mới',
      category,
      subType,
      ...(category === 'MONSTER'
        ? {
            attribute,
            race,
            level,
            atk,
            def,
          }
        : {}),
      descriptionVi: descriptionVi.trim() || 'Lá bài được tạo từ Card Studio.',
      ...(customImageUrl.trim() ? { customImageUrl: customImageUrl.trim() } : {}),
      ...(effects ? { effects } : {}),
    };
  };

  const handleSaveCard = () => {
    const newCard = buildCardObject();
    const updated = saveCustomCard(newCard);
    setCustomCards(updated);
    setId(newCard.id);
    onCardsUpdated();
    showNotice(`✅ Đã lưu [${newCard.nameVi}] vào kho bài! Bạn có thể đưa vào Bộ bài ngay.`);
  };

  const handleDelete = (cardId: string) => {
    const updated = deleteCustomCard(cardId);
    setCustomCards(updated);
    if (id === cardId) resetForm();
    onCardsUpdated();
    showNotice('🗑️ Đã xóa lá bài khỏi kho bài tự tạo.');
  };

  const handleUnlockExpansionPack = () => {
    const updated = saveCustomCardsBulk(CLASSIC_EXPANSION_PACK);
    setCustomCards(updated);
    onCardsUpdated();
    showNotice(
      `📦 Đã mở khóa đầy đủ ${CLASSIC_EXPANSION_PACK.length} lá bài Cổ Điển Mở Rộng (Solemn Judgment, Swift Scarecrow, Torrential Tribute, Upstart Goblin...)!`
    );
  };

  const handleImportBatchJson = () => {
    setBatchError('');
    try {
      const raw = JSON.parse(batchJsonText.trim());
      const arr = Array.isArray(raw) ? raw : [raw];
      const existingAll = new Set(getAllCards().map((c) => c.id));
      const validCards: CardDefinition[] = [];
      for (const item of arr) {
        if (!item || typeof item !== 'object' || !item.category) continue;
        const cleanId =
          String(item.id || item.name || item.nameVi || `imported_${Date.now()}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '') || `imported_${validCards.length}`;
        if (baseIdsSet.has(cleanId)) continue;
        validCards.push({
          ...item,
          id: cleanId,
          passcode: String(item.passcode || '89631139'),
          name: String(item.name || item.nameVi || cleanId),
          nameVi: String(item.nameVi || item.name || cleanId),
          subType: item.subType || 'NORMAL',
          descriptionVi: String(item.descriptionVi || 'Nhập từ JSON.'),
        } as CardDefinition);
      }
      if (validCards.length === 0) {
        setBatchError('Không tìm thấy object CardDefinition hợp lệ trong JSON.');
        return;
      }
      const updated = saveCustomCardsBulk(validCards);
      setCustomCards(updated);
      onCardsUpdated();
      const addedNewCount = validCards.filter((c) => !existingAll.has(c.id)).length;
      setShowBatchImportDrawer(false);
      setBatchJsonText('');
      showNotice(
        `📥 Đã nhập ${validCards.length} lá bài từ JSON (${addedNewCount} lá mới)!`
      );
    } catch (err: unknown) {
      setBatchError(
        err instanceof Error ? `Lỗi cú pháp JSON: ${err.message}` : 'JSON không hợp lệ.'
      );
    }
  };

  const categoryTemplates = useMemo(
    () => EFFECT_TEMPLATE_OPTIONS.filter((opt) => opt.category === category),
    [category]
  );

  const selectedTemplateMeta = useMemo(
    () => categoryTemplates.find((t) => t.key === effectTemplate),
    [categoryTemplates, effectTemplate]
  );

  const previewCard = buildCardObject();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-5 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-300">
                Card Studio Pro — Thêm Bài 1-Click & Gói Mở Rộng
              </h2>
              <p className="text-[11px] text-slate-400">
                Tìm kiếm hàng loạt từ YGOProDeck, tự động suy đoán hiệu ứng, mở khóa Gói Bài Mở Rộng hoặc nhập JSON.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowExpansionDrawer((v) => !v);
                setShowBatchImportDrawer(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                showExpansionDrawer
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              Gói Mở Rộng ({unlockedExpansionCount}/{CLASSIC_EXPANSION_PACK.length})
            </button>
            <button
              onClick={() => {
                setShowBatchImportDrawer((v) => !v);
                setShowExpansionDrawer(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                showBatchImportDrawer
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
              }`}
            >
              <FileJson className="w-4 h-4" />
              Import JSON Hàng Loạt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Non-blocking status notification */}
        {statusBanner && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {statusBanner}
            </span>
            <button onClick={() => setStatusBanner('')} className="text-emerald-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Drawer: Gói Bài Cổ Điển Mở Rộng */}
        {showExpansionDrawer && (
          <div className="mb-4 bg-amber-950/20 border border-amber-500/40 rounded-xl p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-amber-300">
                  📦 Gói Bài Mở Rộng Cổ Điển (16 Lá Kinh Điển Chuẩn Engine)
                </h3>
                <p className="text-xs text-slate-400">
                  Bao gồm Solemn Judgment, Bottomless Trap Hole, Torrential Tribute, Swift Scarecrow, Dust Tornado, Compulsory, Brain Control, Upstart Goblin, Luster Dragon...
                </p>
              </div>
              <button
                onClick={handleUnlockExpansionPack}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Zap className="w-4 h-4" />
                {unlockedExpansionCount === CLASSIC_EXPANSION_PACK.length
                  ? 'Cập Nhật / Nạp Lại Tất Cả (16 Lá)'
                  : `Mở Khóa Tất Cả (${CLASSIC_EXPANSION_PACK.length} Lá)`}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {CLASSIC_EXPANSION_PACK.map((card) => {
                const owned = customIdsSet.has(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => loadCardIntoForm(card, 'Từ Gói Mở Rộng Cổ Điển')}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      owned
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-slate-900/80 border-slate-700 hover:border-amber-400/50'
                    }`}
                  >
                    <img
                      src={getCardArtUrl(card)}
                      alt={card.nameVi}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-100 truncate">{card.nameVi}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{card.category === 'MONSTER' ? `${card.atk}/${card.def}` : card.subType}</span>
                        {owned && <span className="text-emerald-400 font-bold">✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Drawer: Import JSON hàng loạt */}
        {showBatchImportDrawer && (
          <div className="mb-4 bg-sky-950/20 border border-sky-500/40 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-sky-300">
                📥 Nhập JSON Hàng Loạt (Mảng CardDefinition[])
              </h3>
              <button
                onClick={() => setBatchJsonText(JSON.stringify([previewCard], null, 2))}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 cursor-pointer"
              >
                Chèn JSON mẫu từ bài đang xem
              </button>
            </div>
            <textarea
              rows={5}
              value={batchJsonText}
              onChange={(e) => setBatchJsonText(e.target.value)}
              placeholder='Dán mảng JSON bài vào đây, VD: [{ "id": "...", "passcode": "...", "name": "...", "nameVi": "...", "category": "MONSTER", ... }]'
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-emerald-300"
            />
            {batchError && <p className="text-xs text-red-400">{batchError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBatchImportDrawer(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleImportBatchJson}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
              >
                Nhập Vào Kho Bài
              </button>
            </div>
          </div>
        )}

        {/* Tìm tự động từ YGOProDeck (hỗ trợ nhiều kết quả + Lưu Nhanh 1 click) */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 mb-4">
          <label className="block text-xs text-amber-300 font-semibold mb-1.5">
            Bước 1: Gõ tên tiếng Anh để tìm trên YGOProDeck & tự động nhận diện hiệu ứng (VD: Jinzo, Buster Blader, Mirror, Magician, Dragon...)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchFromYGOProDeck()}
              placeholder="Nhập tên lá bài tiếng Anh..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleFetchFromYGOProDeck}
              disabled={searching}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {searching ? 'Đang tìm...' : 'Tìm YGOProDeck'}
            </button>
          </div>
          {searchError && <p className="text-xs text-red-400 mt-1.5">{searchError}</p>}

          {/* Danh sách nhiều kết quả tìm kiếm */}
          {searchResults.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-700/80">
              <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
                <span>
                  Tìm thấy <strong className="text-amber-300">{searchResults.length}</strong> lá bài phù hợp — bấm để chọn sửa hoặc bấm{' '}
                  <strong className="text-emerald-400">⚡ Lưu Nhanh</strong> để thêm ngay:
                </span>
                <button
                  onClick={() => setSearchResults([])}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  Ẩn kết quả
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                {searchResults.map((row) => {
                  const existing = getCardByPasscode(String(row.id));
                  const mapped = inferCardFromYgoPro(row);
                  const isActive = passcode === String(row.id);
                  return (
                    <div
                      key={row.id}
                      onClick={() =>
                        loadCardIntoForm(
                          mapped.card,
                          mapped.confidenceVi,
                          mapped.detectedTemplate,
                          mapped.detectedParam
                        )
                      }
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-amber-950/35 border-amber-400'
                          : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <img
                        src={`https://images.ygoprodeck.com/images/cards_cropped/${row.id}.jpg`}
                        alt={row.name}
                        className="w-10 h-10 rounded object-cover shrink-0 bg-slate-950"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-100 truncate" title={row.name}>
                          {row.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {mapped.card.category === 'MONSTER'
                            ? `★${mapped.card.level} ${row.atk}/${row.def}`
                            : `${row.type}`}
                        </div>
                        <div className="text-[10px] text-emerald-300/90 truncate">
                          {existing ? '✓ Đã có trong game' : mapped.confidenceVi}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickSaveSearchResult(row);
                        }}
                        title="Tự nhận diện hiệu ứng và lưu ngay 1 click"
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-0.5 shrink-0 cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        Lưu
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cột thông tin */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300">
                {id && customIdsSet.has(id) ? (
                  <span className="text-sky-300 flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" /> Đang chỉnh sửa bài tự tạo: {nameVi || id}
                  </span>
                ) : (
                  'Thông Tin Lá Bài Mới:'
                )}
              </span>
              <button
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Làm mới form
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tên Tiếng Việt hiển thị</label>
                <input
                  type="text"
                  value={nameVi}
                  onChange={(e) => setNameVi(e.target.value)}
                  placeholder="VD: Kiếm Sĩ Diệt Rồng"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tên Tiếng Anh (gốc)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Buster Blader"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mã Passcode Konami</label>
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="VD: 78193831"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Phân loại bài</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value as CardCategory;
                    setCategory(cat);
                    const firstTpl = EFFECT_TEMPLATE_OPTIONS.find((t) => t.category === cat);
                    setEffectTemplate(firstTpl?.key ?? 'NONE');
                    if (firstTpl?.defaultParam !== undefined) {
                      setEffectNumberParam(firstTpl.defaultParam);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                >
                  <option value="MONSTER">Quái Thú (Monster)</option>
                  <option value="SPELL">Bài Phép (Spell)</option>
                  <option value="TRAP">Bài Bẫy (Trap)</option>
                </select>
              </div>

              {category === 'MONSTER' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Cấp Sao (Level 1-12)</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={level}
                      onChange={(e) => setLevel(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tộc (Race)</label>
                    <select
                      value={race}
                      onChange={(e) => setRace(e.target.value as MonsterRace)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                    >
                      {ALL_RACES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {category === 'MONSTER' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Chỉ số ATK</label>
                  <input
                    type="number"
                    step={50}
                    value={atk}
                    onChange={(e) => setAtk(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Chỉ số DEF</label>
                  <input
                    type="number"
                    step={50}
                    value={def}
                    onChange={(e) => setDef(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Hệ (Attribute)</label>
                  <select
                    value={attribute}
                    onChange={(e) => setAttribute(e.target.value as Attribute)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                  >
                    <option value="DARK">DARK (Bóng Tối)</option>
                    <option value="LIGHT">LIGHT (Ánh Sáng)</option>
                    <option value="EARTH">EARTH (Đất)</option>
                    <option value="WATER">WATER (Nước)</option>
                    <option value="FIRE">FIRE (Lửa)</option>
                    <option value="WIND">WIND (Gió)</option>
                    <option value="DIVINE">DIVINE (Thần Thánh)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Chọn Logic Hiệu ứng có sẵn (Không cần code) */}
            <div className="bg-slate-800/60 border border-slate-700 rounded p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-emerald-400">
                  Bước 2: Gán Logic Hiệu Ứng Tự Động (Zero-Code Effect Template)
                </label>
                {autoDetectHint && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-semibold">
                    ✨ {autoDetectHint}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={effectTemplate}
                  onChange={(e) => {
                    const key = e.target.value as EffectTemplateKey;
                    setEffectTemplate(key);
                    const found = categoryTemplates.find((t) => t.key === key);
                    if (found?.defaultParam !== undefined) {
                      setEffectNumberParam(found.defaultParam);
                    }
                  }}
                  className="sm:col-span-2 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                >
                  {categoryTemplates.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.labelVi}
                    </option>
                  ))}
                </select>

                {selectedTemplateMeta?.paramLabelVi && (
                  <div>
                    <input
                      type="number"
                      value={effectNumberParam}
                      onChange={(e) => setEffectNumberParam(Number(e.target.value))}
                      title={selectedTemplateMeta.paramLabelVi}
                      placeholder={selectedTemplateMeta.paramLabelVi}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
                    />
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {selectedTemplateMeta.paramLabelVi}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Mô tả hiệu ứng</label>
              <textarea
                rows={2}
                value={descriptionVi}
                onChange={(e) => setDescriptionVi(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleSaveCard}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {id && customIdsSet.has(id) ? 'Cập Nhật Lá Bài' : 'Lưu Lá Bài Vào Game'}
              </button>
              <button
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Code className="w-4 h-4" />
                {showJsonPreview ? 'Ẩn JSON' : 'Xem / Copy JSON'}
              </button>
            </div>

            {showJsonPreview && (
              <div className="relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(previewCard, null, 2));
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 1800);
                  }}
                  className="absolute right-2 top-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {copiedJson ? 'Đã copy!' : 'Copy'}
                </button>
                <pre className="bg-slate-950 border border-slate-800 p-3 rounded text-xs font-mono text-emerald-300 overflow-x-auto max-h-48">
                  {JSON.stringify(previewCard, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Cột Xem Trước Lá Bài */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center">
            <span className="text-xs text-slate-400 mb-3 font-semibold">
              Xem Trước Khung Bài YugiH5
            </span>
            <YugiH5HandCard card={previewCard} size="lg" />
            <div className="mt-3 text-center">
              <div className="text-xs font-bold text-amber-300">{previewCard.nameVi}</div>
              <div className="text-[11px] text-slate-400">
                {previewCard.category} • {previewCard.subType}
                {previewCard.effects?.some((e) => e.activateFromHand) && ' • Handtrap'}
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách các lá bài đã thêm */}
        {customCards.length > 0 && (
          <div className="mt-5 border-t border-slate-800 pt-3">
            <h3 className="text-xs font-bold text-slate-300 mb-2">
              Kho Bài Đã Thêm ({customCards.length} lá — bấm vào lá bài để chỉnh sửa):
            </h3>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {customCards.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadCardIntoForm(c, 'Đang chỉnh sửa bài tự tạo')}
                  className={`flex items-center gap-2 border rounded px-2.5 py-1 text-xs cursor-pointer transition-colors ${
                    id === c.id
                      ? 'bg-sky-950/60 border-sky-400'
                      : 'bg-slate-800 border-slate-700 hover:border-amber-400/50'
                  }`}
                >
                  <img
                    src={getCardArtUrl(c)}
                    alt={c.nameVi}
                    className="w-6 h-6 rounded object-cover"
                  />
                  <span className="font-medium text-amber-200">{c.nameVi}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                    title="Xóa lá bài này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

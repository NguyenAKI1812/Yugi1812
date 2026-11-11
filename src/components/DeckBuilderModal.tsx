import React, { useMemo, useRef, useState } from 'react';
import { CardDefinition, SavedCustomDeck } from '../types/game';
import {
  deleteCustomDeck,
  getAllCards,
  getCardArtUrl,
  getCardByExactName,
  getCardById,
  getCustomCards,
  getShortCardTitle,
  getSavedCustomDecks,
  normalizePasscode,
  saveCustomCardsBulk,
  saveCustomDeck,
} from '../data/cards.catalog';
import {
  exportDeckToYdk,
  fetchYgoProCardsByPasscodes,
  inferCardFromYgoPro,
  parseDeckImportInput,
  resolveTokenToExistingCard,
} from '../utils/cardImport';
import { YugiH5HandCard } from './YugiH5Card';
import {
  Plus,
  Minus,
  X,
  Check,
  RotateCcw,
  Search,
  Trash2,
  Save,
  Upload,
  Download,
  Copy,
  Wand2,
  Eraser,
  FileUp,
  CheckCircle2,
} from 'lucide-react';

interface DeckBuilderModalProps {
  initialMainDeck: string[];
  initialExtraDeck: string[];
  initialDeckName?: string;
  activeCustomDeckId?: string | null;
  onSaveDeck: (
    mainDeck: string[],
    extraDeck: string[],
    savedMeta?: { id?: string; name?: string }
  ) => void;
  onDecksUpdated?: () => void;
  onCardsUpdated?: () => void;
  onClose: () => void;
}

type FilterCategory =
  | 'ALL'
  | 'MONSTER'
  | 'SPELL'
  | 'TRAP'
  | 'FUSION'
  | 'BLUE_EYES'
  | 'DARK_MAGICIAN'
  | 'HANDTRAP'
  | 'CUSTOM';

type SortMode = 'DEFAULT' | 'ATK_DESC' | 'DEF_DESC' | 'LEVEL_ASC' | 'NAME_AZ';

export const DeckBuilderModal: React.FC<DeckBuilderModalProps> = ({
  initialMainDeck,
  initialExtraDeck,
  initialDeckName = 'Bộ Bài Tự Soạn',
  activeCustomDeckId = null,
  onSaveDeck,
  onDecksUpdated,
  onCardsUpdated,
  onClose,
}) => {
  const [catalogTick, setCatalogTick] = useState(0);
  const allCards = useMemo(() => {
    void catalogTick;
    return getAllCards();
  }, [catalogTick]);

  const customCardIds = useMemo(() => {
    void catalogTick;
    return new Set(getCustomCards().map((c) => c.id));
  }, [catalogTick]);

  const [mainDeck, setMainDeck] = useState<string[]>([...initialMainDeck]);
  const [extraDeck, setExtraDeck] = useState<string[]>([...initialExtraDeck]);

  // Bộ lọc & Sắp xếp
  const [searchText, setSearchText] = useState('');
  const [filterCat, setFilterCat] = useState<FilterCategory>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('DEFAULT');
  const [hoveredCard, setHoveredCard] = useState<CardDefinition>(allCards[0]);

  // Quản lý Bộ bài đã lưu
  const [savedDecks, setSavedDecks] = useState<SavedCustomDeck[]>(() => getSavedCustomDecks());
  const [editingDeckId, setEditingDeckId] = useState<string | null>(activeCustomDeckId);
  const [deckNameInput, setDeckNameInput] = useState<string>(initialDeckName);

  // Import / Export Drawer
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showNotice = (msg: string) => {
    setErrorMsg('');
    setStatusMsg(msg);
  };

  const showError = (msg: string) => {
    setStatusMsg('');
    setErrorMsg(msg);
  };

  const countInDeck = (cardId: string) =>
    mainDeck.filter((id) => id === cardId).length +
    extraDeck.filter((id) => id === cardId).length;

  const handleAddCard = (card: CardDefinition, qty = 1) => {
    const current = countInDeck(card.id);
    const toAdd = Math.min(qty, 3 - current);
    if (toAdd <= 0) return;

    const clones = Array(toAdd).fill(card.id) as string[];
    if (card.subType === 'FUSION') {
      if (extraDeck.length + toAdd > 15) {
        showError('Extra Deck tối đa 15 lá Dung Hợp!');
        return;
      }
      setExtraDeck([...extraDeck, ...clones]);
    } else {
      setMainDeck([...mainDeck, ...clones]);
    }
  };

  const handleRemoveCard = (card: CardDefinition, removeAll = false) => {
    if (card.subType === 'FUSION') {
      if (removeAll) {
        setExtraDeck(extraDeck.filter((id) => id !== card.id));
        return;
      }
      const idx = extraDeck.indexOf(card.id);
      if (idx !== -1) {
        const copy = [...extraDeck];
        copy.splice(idx, 1);
        setExtraDeck(copy);
      }
    } else {
      if (removeAll) {
        setMainDeck(mainDeck.filter((id) => id !== card.id));
        return;
      }
      const idx = mainDeck.indexOf(card.id);
      if (idx !== -1) {
        const copy = [...mainDeck];
        copy.splice(idx, 1);
        setMainDeck(copy);
      }
    }
  };

  const filteredCatalog = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = allCards.filter((c) => {
      if (filterCat === 'FUSION' && c.subType !== 'FUSION') return false;
      if (filterCat === 'MONSTER' && (c.category !== 'MONSTER' || c.subType === 'FUSION'))
        return false;
      if (filterCat === 'SPELL' && c.category !== 'SPELL') return false;
      if (filterCat === 'TRAP' && c.category !== 'TRAP') return false;
      if (filterCat === 'HANDTRAP' && !c.effects?.some((e) => e.activateFromHand)) return false;
      if (filterCat === 'BLUE_EYES') {
        const isBlueEyes =
          c.archetypeTags?.includes('BLUE_EYES') ||
          c.name.toLowerCase().includes('blue-eyes') ||
          c.name.toLowerCase().includes('eyes of blue') ||
          c.nameVi.toLowerCase().includes('mắt xanh');
        if (!isBlueEyes) return false;
      }
      if (filterCat === 'DARK_MAGICIAN') {
        const isDarkMagician =
          c.archetypeTags?.includes('DARK_MAGICIAN') ||
          c.archetypeTags?.includes('SPELLCASTER') ||
          c.race === 'Spellcaster';
        if (!isDarkMagician) return false;
      }
      if (filterCat === 'CUSTOM' && !customCardIds.has(c.id)) return false;

      if (!q) return true;
      return (
        c.nameVi.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.passcode.toLowerCase().includes(q) ||
        (c.altPasscodes?.some((ap) => ap.toLowerCase().includes(q)) ?? false) ||
        c.descriptionVi.toLowerCase().includes(q) ||
        (c.race && c.race.toLowerCase().includes(q))
      );
    });

    if (sortMode === 'DEFAULT') return list;
    return [...list].sort((a, b) => {
      if (sortMode === 'ATK_DESC') return (b.atk ?? -1) - (a.atk ?? -1);
      if (sortMode === 'DEF_DESC') return (b.def ?? -1) - (a.def ?? -1);
      if (sortMode === 'LEVEL_ASC') {
        const la = a.category === 'MONSTER' ? (a.level ?? 99) : 999;
        const lb = b.category === 'MONSTER' ? (b.level ?? 99) : 999;
        return la - lb || (b.atk ?? 0) - (a.atk ?? 0);
      }
      if (sortMode === 'NAME_AZ') {
        return getShortCardTitle(a).localeCompare(getShortCardTitle(b));
      }
      return 0;
    });
  }, [allCards, filterCat, searchText, sortMode, customCardIds]);

  const deckBreakdown = useMemo(() => {
    let monsters = 0;
    let spells = 0;
    let traps = 0;
    for (const id of mainDeck) {
      const def = getCardById(id);
      if (!def) continue;
      if (def.category === 'MONSTER') monsters += 1;
      else if (def.category === 'SPELL') spells += 1;
      else if (def.category === 'TRAP') traps += 1;
    }
    return { monsters, spells, traps, extra: extraDeck.length };
  }, [mainDeck, extraDeck, catalogTick]);

  const groupedMain = useMemo(() => {
    void catalogTick;
    return Array.from(new Set(mainDeck)).map((cardId) => ({
      card: getCardById(cardId),
      count: mainDeck.filter((id) => id === cardId).length,
    }));
  }, [mainDeck, catalogTick]);

  const groupedExtra = useMemo(() => {
    void catalogTick;
    return Array.from(new Set(extraDeck)).map((cardId) => ({
      card: getCardById(cardId),
      count: extraDeck.filter((id) => id === cardId).length,
    }));
  }, [extraDeck, catalogTick]);

  const handleAutoFill40 = () => {
    if (mainDeck.length >= 40) {
      showNotice('Bộ bài đã có ít nhất 40 lá!');
      return;
    }
    const nextMain = [...mainDeck];
    const counts = new Map<string, number>();
    nextMain.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));

    const tryAdd = (id: string) => {
      if (nextMain.length >= 40) return false;
      const def = getCardById(id);
      if (!def || def.subType === 'FUSION') return false;
      const cur = counts.get(id) ?? 0;
      if (cur >= 3) return false;
      nextMain.push(id);
      counts.set(id, cur + 1);
      return true;
    };

    // Ưu tiên bổ sung các lá cân bằng (Quái lv4, Phép rút/phá, Bẫy phòng thủ)
    const priorityPool = [
      'alexandrite_dragon',
      'vorse_raider',
      'gemini_elf',
      'pot_of_greed',
      'graceful_charity',
      'monster_reborn',
      'raigeki',
      'fissure',
      'mystical_space_typhoon',
      'mirror_force',
      'magic_cylinder',
      'sakuretsu_armor',
      'trap_hole',
      'seven_tools_of_the_bandit',
      'herald_of_purple_light',
      'kuriboh',
      'man_eater_bug',
      'wall_of_illusion',
      'sangan',
      'neo_magic_swordsman',
      'celtic_guardian',
      'giant_soldier_of_stone',
    ];

    let round = 0;
    while (nextMain.length < 40 && round < 4) {
      for (const id of priorityPool) {
        if (nextMain.length >= 40) break;
        tryAdd(id);
      }
      round += 1;
    }

    // Nếu vẫn thiếu, lấy thêm từ catalog thường (không phải Fusion)
    if (nextMain.length < 40) {
      for (const c of allCards) {
        if (nextMain.length >= 40) break;
        while ((counts.get(c.id) ?? 0) < 3 && nextMain.length < 40) {
          if (!tryAdd(c.id)) break;
        }
      }
    }

    setMainDeck(nextMain);
    showNotice(`⚡ Đã tự động bù bộ bài lên ${nextMain.length} lá!`);
  };

  const handleSaveSlot = (asNew = false) => {
    if (mainDeck.length < 20) {
      showError('Bộ bài chính cần tối thiểu 20 lá trước khi lưu!');
      return;
    }
    const cleanName = deckNameInput.trim() || 'Bộ Bài Tự Soạn';
    const firstCard = getCardById(mainDeck[0]);
    const avatarUrl = firstCard
      ? getCardArtUrl(firstCard)
      : 'https://images.ygoprodeck.com/images/cards_cropped/46986414.jpg';

    const targetId =
      !asNew && editingDeckId
        ? editingDeckId
        : `custom_deck_${Date.now()}`;

    const newDeck: SavedCustomDeck = {
      id: targetId,
      name: cleanName,
      avatarUrl,
      description: `Gồm ${deckBreakdown.monsters} Quái, ${deckBreakdown.spells} Phép, ${deckBreakdown.traps} Bẫy (+${deckBreakdown.extra} Extra).`,
      mainDeck: [...mainDeck],
      extraDeck: [...extraDeck],
      updatedAt: Date.now(),
    };

    const updated = saveCustomDeck(newDeck);
    setSavedDecks(updated);
    setEditingDeckId(newDeck.id);
    onDecksUpdated?.();
    onSaveDeck(mainDeck, extraDeck, { id: newDeck.id, name: newDeck.name });
    showNotice(`💾 Đã lưu bộ bài [${newDeck.name}] vào máy (giữ nguyên sau F5)!`);
  };

  const handleLoadSavedDeck = (deckId: string) => {
    if (!deckId) {
      setEditingDeckId(null);
      return;
    }
    const found = savedDecks.find((d) => d.id === deckId);
    if (!found) return;
    setEditingDeckId(found.id);
    setDeckNameInput(found.name);
    setMainDeck([...found.mainDeck]);
    setExtraDeck([...found.extraDeck]);
    showNotice(`📂 Đã mở bộ bài [${found.name}] (${found.mainDeck.length} lá).`);
  };

  const handleDeleteSavedDeck = () => {
    if (!editingDeckId) return;
    const updated = deleteCustomDeck(editingDeckId);
    setSavedDecks(updated);
    setEditingDeckId(null);
    onDecksUpdated?.();
    showNotice('🗑️ Đã xóa bộ bài khỏi danh sách lưu.');
  };

  const handleImportDeckText = async (overrideText?: string) => {
    const raw = (overrideText ?? importText).trim();
    if (!raw) {
      showError('Hãy dán mã .ydk / JSON hoặc chọn file .ydk trước.');
      return;
    }

    setImporting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const parsed = parseDeckImportInput(raw);
      const allTokens = [...parsed.mainTokens, ...parsed.extraTokens];
      if (allTokens.length === 0) {
        showError('Không tìm thấy mã lá bài nào trong nội dung vừa nhập.');
        return;
      }

      // Tìm những passcode số chưa có trong catalog để batch fetch 1 lần từ YGOProDeck
      const unresolvedPasscodes: string[] = [];
      for (const tk of allTokens) {
        if (!resolveTokenToExistingCard(tk) && /^\d+$/.test(tk)) {
          unresolvedPasscodes.push(tk);
        }
      }

      let newlyImportedCount = 0;
      let matchedBuiltInCount = 0;
      const fetchedByNorm = new Map<string, CardDefinition>();

      if (unresolvedPasscodes.length > 0) {
        const apiMap = await fetchYgoProCardsByPasscodes(unresolvedPasscodes);
        const newCards: CardDefinition[] = [];
        apiMap.forEach((apiCard, norm) => {
          const existingByName = getCardByExactName(apiCard.name);
          if (existingByName) {
            fetchedByNorm.set(norm, existingByName);
            matchedBuiltInCount += 1;
            return;
          }
          const mapped = inferCardFromYgoPro(apiCard);
          newCards.push(mapped.card);
          fetchedByNorm.set(norm, mapped.card);
        });
        if (newCards.length > 0) {
          saveCustomCardsBulk(newCards);
          newlyImportedCount = newCards.length;
          setCatalogTick((t) => t + 1);
          onCardsUpdated?.();
        }
      }

      const nextMain: string[] = [];
      const nextExtra: string[] = [];
      const counts = new Map<string, number>();
      let skippedCount = 0;

      const resolveCard = (tk: string): CardDefinition | undefined => {
        const existing = resolveTokenToExistingCard(tk);
        if (existing) return existing;
        if (/^\d+$/.test(tk)) {
          return fetchedByNorm.get(normalizePasscode(tk));
        }
        return undefined;
      };

      for (const tk of parsed.mainTokens) {
        const card = resolveCard(tk);
        if (!card) {
          skippedCount += 1;
          continue;
        }
        const cur = counts.get(card.id) ?? 0;
        if (cur >= 3) continue;
        counts.set(card.id, cur + 1);
        if (card.subType === 'FUSION') {
          if (nextExtra.length < 15) nextExtra.push(card.id);
        } else {
          nextMain.push(card.id);
        }
      }

      for (const tk of parsed.extraTokens) {
        const card = resolveCard(tk);
        if (!card) {
          skippedCount += 1;
          continue;
        }
        const cur = counts.get(card.id) ?? 0;
        if (cur >= 3) continue;
        counts.set(card.id, cur + 1);
        if (nextExtra.length < 15) {
          nextExtra.push(card.id);
        }
      }

      setMainDeck(nextMain);
      setExtraDeck(nextExtra);
      if (parsed.deckName) {
        setDeckNameInput(parsed.deckName);
      }

      showNotice(
        `✅ Nhập thành công ${nextMain.length} lá Chính + ${nextExtra.length} lá Extra` +
          (matchedBuiltInCount > 0 ? ` • Khớp ${matchedBuiltInCount} lá Việt hóa có sẵn` : '') +
          (newlyImportedCount > 0 ? ` • Tự dịch & tải mới ${newlyImportedCount} lá từ YGOProDeck` : '') +
          (skippedCount > 0 ? ` • Bỏ qua ${skippedCount} mã không hợp lệ.` : '!')
      );
      setShowImportDrawer(false);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Lỗi khi nhập bộ bài .ydk.');
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setImportText(text);
    const baseName = file.name.replace(/\.(ydk|json|txt)$/i, '').trim();
    if (baseName) setDeckNameInput(baseName);
    await handleImportDeckText(text);
    e.target.value = '';
  };

  const handleDownloadYdk = () => {
    const ydkContent = exportDeckToYdk(mainDeck, extraDeck);
    const blob = new Blob([ydkContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(deckNameInput || 'yugioh_h5_deck').replace(/[^a-zA-Z0-9_-]+/g, '_')}.ydk`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('📤 Đã tải xuống file .ydk (tương thích YGOPro / EDOPro / Omega)!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-7xl w-full max-h-[94vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-base font-bold text-amber-300">
              Deck Builder Pro — Soạn & Lưu Bộ Bài ({mainDeck.length} Chính / {extraDeck.length} Extra)
            </h2>
            <p className="text-[11px] text-slate-400">
              Tìm theo tên/mô tả/mã, bấm thẻ để thêm (+1) hoặc bấm <strong className="text-emerald-300">+3</strong>, hỗ trợ <strong className="text-sky-300">Import/Export .ydk & JSON</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setShowImportDrawer((v) => !v)}
              className={`px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer border ${
                showImportDrawer
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'bg-sky-950/60 hover:bg-sky-900 text-sky-300 border-sky-600/40'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Nhập / Xuất .ydk
            </button>
            <button
              onClick={() => {
                setMainDeck([...initialMainDeck]);
                setExtraDeck([...initialExtraDeck]);
                showNotice('Đã khôi phục bộ bài ban đầu.');
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Khôi phục
            </button>
            <button
              onClick={() => {
                if (mainDeck.length < 20) {
                  showError('Bộ bài chính cần tối thiểu 20 lá bài (khuyên dùng 40 lá)!');
                  return;
                }
                onSaveDeck(mainDeck, extraDeck, {
                  id: editingDeckId ?? undefined,
                  name: deckNameInput.trim() || undefined,
                });
                onClose();
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow"
            >
              <Check className="w-4 h-4" /> Áp Dụng Bộ Bài
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Saved Deck Slot Bar */}
        <div className="px-4 py-2 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Slot Đã Lưu:</span>
            <select
              value={editingDeckId ?? ''}
              onChange={(e) => handleLoadSavedDeck(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-200 max-w-[180px]"
            >
              <option value="">-- Bộ bài đang soạn --</option>
              {savedDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.mainDeck.length} lá)
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={deckNameInput}
            onChange={(e) => setDeckNameInput(e.target.value)}
            placeholder="Đặt tên bộ bài..."
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-semibold text-white flex-1 min-w-[150px] max-w-xs"
          />

          <button
            onClick={() => handleSaveSlot(false)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {editingDeckId ? 'Lưu Đè Slot' : 'Lưu Bộ Bài'}
          </button>

          {editingDeckId && (
            <>
              <button
                onClick={() => handleSaveSlot(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-xs font-semibold cursor-pointer"
              >
                + Lưu Thành Bản Mới
              </button>
              <button
                onClick={handleDeleteSavedDeck}
                title="Xóa slot bộ bài này"
                className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Status / Error Banner */}
        {(statusMsg || errorMsg) && (
          <div
            className={`px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b ${
              errorMsg
                ? 'bg-red-950/70 border-red-500/40 text-red-200'
                : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {errorMsg || statusMsg}
            </span>
            <button
              onClick={() => {
                setStatusMsg('');
                setErrorMsg('');
              }}
              className="hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Drawer: Import / Export .ydk & JSON */}
        {showImportDrawer && (
          <div className="p-3.5 bg-sky-950/25 border-b border-sky-500/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-sky-300">
                📥 Nhập từ file .ydk (YGOPro / Master Duel / EDOPro) hoặc JSON — tự động tải bài chưa có từ YGOProDeck!
              </div>
              <div className="flex flex-wrap gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ydk,.txt,.json"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" /> Chọn File .ydk / .json
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportDeckToYdk(mainDeck, extraDeck));
                    showNotice('📋 Đã copy mã bộ bài định dạng .ydk!');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy .ydk
                </button>
                <button
                  onClick={handleDownloadYdk}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải .ydk
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(
                        { name: deckNameInput, mainDeck, extraDeck },
                        null,
                        2
                      )
                    );
                    showNotice('📋 Đã copy JSON bộ bài!');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy JSON
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <textarea
                rows={3}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'Dán nội dung .ydk (#main ... #extra ...), danh sách mã Passcode từng dòng, hoặc JSON { "mainDeck": [...], "extraDeck": [...] }...'}
                className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-xs font-mono text-sky-200"
              />
              <button
                onClick={() => handleImportDeckText()}
                disabled={importing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-extrabold cursor-pointer disabled:opacity-50 shrink-0"
              >
                {importing ? 'Đang tải...' : 'Nạp Bộ Bài Ngay'}
              </button>
            </div>
          </div>
        )}

        {/* Main 4-Column Workspace */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 overflow-hidden min-h-0">
          {/* Cột Trái: Chi tiết lá bài đang chọn */}
          <div className="hidden md:flex bg-slate-950 border-r border-slate-800 p-3 flex-col items-center overflow-hidden">
            <div className="mb-2.5">
              <YugiH5HandCard card={hoveredCard} size="lg" />
            </div>
            <div className="font-bold text-sm text-amber-300 text-center">
              {hoveredCard.nameVi}
            </div>
            <div className="text-[11px] text-slate-400 mb-2 text-center">
              {hoveredCard.name} • #{hoveredCard.passcode}
              <br />
              {hoveredCard.category} / {hoveredCard.subType}
              {hoveredCard.category === 'MONSTER' &&
                ` • ★${hoveredCard.level} • ${hoveredCard.race}`}
            </div>
            <p className="w-full text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded p-2.5 leading-relaxed flex-1 overflow-y-auto">
              {hoveredCard.descriptionVi}
            </p>
          </div>

          {/* Cột Giữa: Kho bài tìm kiếm & lọc */}
          <div className="md:col-span-2 p-3 flex flex-col overflow-hidden border-r border-slate-800 bg-slate-950/80 min-h-0">
            {/* Thanh tìm kiếm + sắp xếp */}
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm tên Việt/Anh, từ khóa, tộc, passcode..."
                  className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-7 py-1.5 text-xs"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="DEFAULT">Sắp xếp: Mặc định</option>
                <option value="ATK_DESC">ATK Cao ➔ Thấp</option>
                <option value="DEF_DESC">DEF Cao ➔ Thấp</option>
                <option value="LEVEL_ASC">Cấp Sao Thấp ➔ Cao</option>
                <option value="NAME_AZ">Tên A ➔ Z</option>
              </select>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1 mb-2.5 flex-wrap">
              {(
                [
                  { id: 'ALL', label: `Tất Cả (${allCards.length})` },
                  { id: 'BLUE_EYES', label: 'Rồng Trắng' },
                  { id: 'DARK_MAGICIAN', label: 'Phù Thủy' },
                  { id: 'MONSTER', label: 'Quái Thú' },
                  { id: 'SPELL', label: 'Bài Phép' },
                  { id: 'TRAP', label: 'Bài Bẫy' },
                  { id: 'FUSION', label: 'Dung Hợp' },
                  { id: 'HANDTRAP', label: 'Handtrap' },
                  { id: 'CUSTOM', label: `★ Tự Thêm (${customCardIds.size})` },
                ] as { id: FilterCategory; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterCat(tab.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    filterCat === tab.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Catalog Card Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1 pr-1 justify-items-center content-start">
              {filteredCatalog.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-500">
                  Không tìm thấy lá bài nào khớp từ khóa.
                </div>
              ) : (
                filteredCatalog.map((card) => {
                  const count = countInDeck(card.id);
                  return (
                    <div
                      key={card.id}
                      onMouseEnter={() => setHoveredCard(card)}
                      className="flex flex-col items-center"
                    >
                      <YugiH5HandCard
                        card={card}
                        size="md"
                        onClick={() => handleAddCard(card, 1)}
                      />
                      <div className="mt-1 flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-full px-2 py-0.5">
                        <button
                          onClick={() => handleRemoveCard(card)}
                          disabled={count === 0}
                          className="text-red-400 hover:text-red-300 disabled:opacity-30 cursor-pointer"
                          title="Bớt 1 lá"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[11px] font-black text-white font-mono">
                          x{count}
                        </span>
                        <button
                          onClick={() => handleAddCard(card, 1)}
                          disabled={count >= 3}
                          className="text-emerald-400 hover:text-emerald-300 disabled:opacity-30 cursor-pointer"
                          title="Thêm 1 lá"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleAddCard(card, 3)}
                          disabled={count >= 3}
                          className="text-[10px] font-extrabold text-amber-300 hover:text-amber-200 disabled:opacity-30 pl-0.5 border-l border-slate-700 cursor-pointer"
                          title="Thêm nhanh đủ 3 lá"
                        >
                          +3
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cột Phải: Bộ bài hiện tại & công cụ soạn nhanh */}
          <div className="p-3 flex flex-col overflow-hidden bg-slate-950/50 min-h-0">
            {/* Thanh tỉ lệ Quái / Phép / Bẫy + nút hành động nhanh */}
            <div className="mb-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-300">
                  Bộ Bài Chính ({mainDeck.length}/40+)
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleAutoFill40}
                    title="Tự bù thêm các lá chủ lực & bẫy chuẩn cho đủ 40 lá"
                    className="px-2 py-1 rounded bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" /> Bù 40
                  </button>
                  <button
                    onClick={() => {
                      setMainDeck([]);
                      setExtraDeck([]);
                      showNotice('🧹 Đã xóa trắng bộ bài để soạn mới.');
                    }}
                    title="Xóa hết bài đang chọn"
                    className="px-2 py-1 rounded bg-red-950/50 hover:bg-red-900/70 border border-red-500/30 text-red-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser className="w-3 h-3" /> Xóa
                  </button>
                </div>
              </div>

              {/* Tỉ lệ Quái / Phép / Bẫy */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="flex justify-between text-[10px] font-semibold mb-1">
                  <span className="text-amber-300">Quái: {deckBreakdown.monsters}</span>
                  <span className="text-emerald-300">Phép: {deckBreakdown.spells}</span>
                  <span className="text-fuchsia-300">Bẫy: {deckBreakdown.traps}</span>
                  <span className="text-purple-300">Extra: {deckBreakdown.extra}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  {mainDeck.length > 0 && (
                    <>
                      <div
                        className="bg-amber-400 h-full"
                        style={{
                          width: `${(deckBreakdown.monsters / mainDeck.length) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-emerald-400 h-full"
                        style={{
                          width: `${(deckBreakdown.spells / mainDeck.length) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-fuchsia-500 h-full"
                        style={{
                          width: `${(deckBreakdown.traps / mainDeck.length) * 100}%`,
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Danh sách Main & Extra Deck */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
              {groupedMain.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Chưa có lá bài nào trong Bộ Bài Chính. Hãy bấm vào bài ở giữa để thêm hoặc bấm &quot;Bù 40&quot;.
                </div>
              ) : (
                groupedMain.map(
                  ({ card, count }) =>
                    card && (
                      <div
                        key={card.id}
                        onMouseEnter={() => setHoveredCard(card)}
                        className="flex items-center justify-between bg-slate-800/70 hover:bg-slate-800 px-2 py-1 rounded text-xs group"
                      >
                        <span
                          className={`leading-tight flex-1 truncate ${
                            card.category === 'SPELL'
                              ? 'text-emerald-300'
                              : card.category === 'TRAP'
                              ? 'text-fuchsia-300'
                              : 'text-amber-100'
                          }`}
                          title={card.nameVi}
                        >
                          {getShortCardTitle(card)}
                        </span>
                        <div className="flex items-center gap-1 ml-1.5 shrink-0">
                          <span className="font-mono text-amber-300 font-bold mr-0.5">
                            x{count}
                          </span>
                          <button
                            onClick={() => handleAddCard(card, 1)}
                            disabled={count >= 3}
                            className="text-emerald-400 hover:text-emerald-300 disabled:opacity-25 cursor-pointer"
                            title="Thêm 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveCard(card, false)}
                            className="text-amber-400 hover:text-amber-300 cursor-pointer"
                            title="Bớt 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveCard(card, true)}
                            className="text-red-400/70 hover:text-red-300 cursor-pointer"
                            title="Xóa hết lá này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                )
              )}

              {groupedExtra.length > 0 && (
                <div className="pt-2 mt-2 border-t border-purple-500/30">
                  <div className="text-[11px] font-bold text-purple-300 mb-1">
                    Extra Deck - Dung Hợp ({extraDeck.length}/15):
                  </div>
                  <div className="space-y-1">
                    {groupedExtra.map(
                      ({ card, count }) =>
                        card && (
                          <div
                            key={card.id}
                            onMouseEnter={() => setHoveredCard(card)}
                            className="flex items-center justify-between bg-purple-950/40 border border-purple-500/20 px-2 py-1 rounded text-xs"
                          >
                            <span className="leading-tight flex-1 truncate text-purple-200">
                              {getShortCardTitle(card)}
                            </span>
                            <div className="flex items-center gap-1 ml-1.5 shrink-0">
                              <span className="font-mono text-purple-300 font-bold">
                                x{count}
                              </span>
                              <button
                                onClick={() => handleRemoveCard(card, false)}
                                className="text-red-400 hover:text-red-300 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

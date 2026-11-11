import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getActiveDeckConfig,
  getCardById,
  getCustomCards,
  getSavedCustomDecks,
  PRESET_DECKS,
  PresetDeck,
  saveActiveDeckConfig,
  saveCustomCardsBulk,
} from './data/cards.catalog';
import {
  applyGameAction,
  createInitialDuelState,
} from './engine/DuelEngine';
import { computeNextBotAction } from './engine/BotAI';
import { PeerPacket, PeerRoomManager } from './network/PeerRoomManager';
import { CardDefinition, DuelState, GameAction, PlayerId, SavedCustomDeck } from './types/game';
import { DuelArena } from './components/DuelArena';
import { CardStudioModal } from './components/CardStudioModal';
import { DeckBuilderModal } from './components/DeckBuilderModal';
import { YugiH5HandCard } from './components/YugiH5Card';
import {
  Swords,
  Users,
  Bot,
  Sparkles,
  Layers,
  Copy,
  Check,
  Wifi,
  Pencil,
} from 'lucide-react';

function getPresetArchetypeTag(name: string): string {
  const m = name.match(/\(([^)]+)\)/);
  return m ? m[1] : name;
}

export const App: React.FC = () => {
  const initialActive = useRef(getActiveDeckConfig());
  const [savedDecks, setSavedDecks] = useState<SavedCustomDeck[]>(() => getSavedCustomDecks());

  const [playerName, setPlayerName] = useState<string>(
    initialActive.current?.playerName ?? 'Yugi'
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    initialActive.current?.selectedDeckId ?? PRESET_DECKS[0].id
  );
  const [customMainDeck, setCustomMainDeck] = useState<string[]>(
    initialActive.current?.mainDeck?.length
      ? initialActive.current.mainDeck
      : PRESET_DECKS[0].mainDeck
  );
  const [customExtraDeck, setCustomExtraDeck] = useState<string[]>(
    initialActive.current?.extraDeck ?? PRESET_DECKS[0].extraDeck
  );

  // Ghi nhớ bộ bài & tên bài thủ qua các lần tải lại trang (F5)
  useEffect(() => {
    saveActiveDeckConfig({
      selectedDeckId: selectedPresetId,
      mainDeck: customMainDeck,
      extraDeck: customExtraDeck,
      playerName,
    });
  }, [selectedPresetId, customMainDeck, customExtraDeck, playerName]);

  // Chế độ chơi: 'LOBBY' | 'WAITING_HOST' | 'DUEL_BOT' | 'DUEL_ONLINE'
  const [screenMode, setScreenMode] = useState<
    'LOBBY' | 'WAITING_HOST' | 'DUEL_BOT' | 'DUEL_ONLINE'
  >('LOBBY');

  const [botPresetId, setBotPresetId] = useState<string>(PRESET_DECKS[1].id);
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<PlayerId>('host');

  // Quản lý phòng P2P Online
  const peerManagerRef = useRef<PeerRoomManager | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [netStatus, setNetStatus] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Modals
  const [showCardStudio, setShowCardStudio] = useState<boolean>(false);
  const [showDeckBuilder, setShowDeckBuilder] = useState<boolean>(false);
  const [, setCatalogVersion] = useState<number>(0);

  // Giữ reference state mới nhất cho callback P2P của Host
  const duelStateRef = useRef<DuelState | null>(null);
  duelStateRef.current = duelState;

  const guestDeckRef = useRef<{
    name: string;
    avatar: string;
    mainDeck: string[];
    extraDeck: string[];
  } | null>(null);

  const selectedSavedDeck = savedDecks.find((d) => d.id === selectedPresetId);
  const selectedPreset: PresetDeck =
    PRESET_DECKS.find((d) => d.id === selectedPresetId) || PRESET_DECKS[0];

  const activePlayerAvatarUrl = selectedSavedDeck?.avatarUrl ?? selectedPreset.avatarUrl;
  const activeDeckTitle = selectedSavedDeck?.name ?? selectedPreset.name;

  const customCardsCount = getCustomCards().length;

  const deckStats = useMemo(() => {
    let monsters = 0;
    let spells = 0;
    let traps = 0;
    const candidates: { card: CardDefinition; score: number }[] = [];
    const seen = new Set<string>();

    for (const id of customExtraDeck) {
      const def = getCardById(id);
      if (def && !seen.has(id)) {
        seen.add(id);
        candidates.push({ card: def, score: (def.atk ?? 0) + 1200 });
      }
    }
    for (const id of customMainDeck) {
      const def = getCardById(id);
      if (!def) continue;
      if (def.category === 'MONSTER') {
        monsters += 1;
        if (!seen.has(id)) {
          seen.add(id);
          candidates.push({ card: def, score: (def.atk ?? 0) + (def.level ?? 4) * 80 });
        }
      } else if (def.category === 'SPELL') {
        spells += 1;
      } else {
        traps += 1;
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return {
      monsters,
      spells,
      traps,
      signatureCards: candidates.slice(0, 3).map((x) => x.card),
    };
  }, [customMainDeck, customExtraDeck]);

  const handleSelectPreset = (preset: PresetDeck) => {
    setSelectedPresetId(preset.id);
    setCustomMainDeck([...preset.mainDeck]);
    setCustomExtraDeck([...preset.extraDeck]);
  };

  const handleSelectSavedDeck = (deck: SavedCustomDeck) => {
    setSelectedPresetId(deck.id);
    setCustomMainDeck([...deck.mainDeck]);
    setCustomExtraDeck([...deck.extraDeck]);
  };

  // Tự động chạy lượt của Bot AI khi ở chế độ DUEL_BOT
  useEffect(() => {
    if (screenMode !== 'DUEL_BOT' || !duelState || duelState.winner) return;

    const botAction = computeNextBotAction(duelState, 'guest');
    if (!botAction) return;

    const timer = setTimeout(() => {
      setDuelState((prev) => (prev ? applyGameAction(prev, botAction) : prev));
    }, 1450);

    return () => clearTimeout(timer);
  }, [screenMode, duelState]);

  // Bắt đầu trận đấu với Bot AI
  const startBotDuel = () => {
    const botSaved = savedDecks.find((d) => d.id === botPresetId);
    const botPreset =
      PRESET_DECKS.find((d) => d.id === botPresetId) || PRESET_DECKS[1];

    const botCharName = botSaved ? botSaved.name : botPreset.character;
    const botAvatar = botSaved ? botSaved.avatarUrl : botPreset.avatarUrl;
    const botMain = botSaved ? botSaved.mainDeck : botPreset.mainDeck;
    const botExtra = botSaved ? botSaved.extraDeck : botPreset.extraDeck;

    const initial = createInitialDuelState(
      playerName.trim() || selectedPreset.character,
      activePlayerAvatarUrl,
      customMainDeck,
      customExtraDeck,
      `${botCharName} (Bot AI)`,
      botAvatar,
      botMain,
      botExtra
    );
    setMyPlayerId('host');
    setDuelState(initial);
    setScreenMode('DUEL_BOT');
  };

  // Tạo phòng Online 2 người (P2P Host)
  const handleHostOnlineRoom = async () => {
    setNetStatus('Đang khởi tạo Mã Phòng P2P...');
    const mgr = new PeerRoomManager();
    peerManagerRef.current = mgr;

    mgr.onError = (msg) => {
      setNetStatus(`Lỗi: ${msg}`);
    };

    mgr.onDisconnected = (reason) => {
      alert(reason);
      setScreenMode('LOBBY');
    };

    mgr.onPacket = (packet: PeerPacket) => {
      if (packet.type === 'GUEST_HELLO') {
        // Lưu bài tự tạo của bạn bè (nếu có)
        if (packet.customCards?.length) {
          saveCustomCardsBulk(packet.customCards);
        }
        guestDeckRef.current = {
          name: packet.guestName,
          avatar: packet.guestAvatar,
          mainDeck: packet.mainDeck,
          extraDeck: packet.extraDeck,
        };

        const initial = createInitialDuelState(
          playerName.trim() || selectedPreset.character,
          activePlayerAvatarUrl,
          customMainDeck,
          customExtraDeck,
          packet.guestName,
          packet.guestAvatar,
          packet.mainDeck,
          packet.extraDeck
        );

        setMyPlayerId('host');
        setDuelState(initial);
        setScreenMode('DUEL_ONLINE');

        mgr.send({
          type: 'HOST_WELCOME',
          hostName: playerName.trim() || selectedPreset.character,
          customCards: getCustomCards(),
          initialState: initial,
        });
      } else if (packet.type === 'CLIENT_ACTION') {
        if (!duelStateRef.current) return;
        const updated = applyGameAction(duelStateRef.current, packet.action);
        setDuelState(updated);
        mgr.send({
          type: 'STATE_SYNC',
          state: updated,
        });
      } else if (packet.type === 'REMATCH_REQUEST') {
        if (guestDeckRef.current) {
          const g = guestDeckRef.current;
          const nextDuel = createInitialDuelState(
            playerName.trim() || selectedPreset.character,
            activePlayerAvatarUrl,
            customMainDeck,
            customExtraDeck,
            g.name,
            g.avatar,
            g.mainDeck,
            g.extraDeck
          );
          setDuelState(nextDuel);
          mgr.send({
            type: 'STATE_SYNC',
            state: nextDuel,
          });
        }
      }
    };

    try {
      const code = await mgr.hostRoom();
      setRoomCode(code);
      setNetStatus('Phòng đã sẵn sàng! Hãy gửi Mã Phòng 4 số này cho bạn của bạn.');
      setScreenMode('WAITING_HOST');
    } catch {
      // handled in onError
    }
  };

  // Vào phòng Online của bạn bè (P2P Guest)
  const handleJoinOnlineRoom = async () => {
    if (!joinCodeInput.trim()) {
      alert('Vui lòng nhập Mã Phòng 4 số của bạn bè!');
      return;
    }
    setNetStatus(`Đang kết nối vào phòng ${joinCodeInput.trim()}...`);
    const mgr = new PeerRoomManager();
    peerManagerRef.current = mgr;

    mgr.onError = (msg) => {
      setNetStatus(msg);
    };

    mgr.onDisconnected = (reason) => {
      alert(reason);
      setScreenMode('LOBBY');
    };

    mgr.onPacket = (packet: PeerPacket) => {
      if (packet.type === 'HOST_WELCOME') {
        if (packet.customCards?.length) {
          saveCustomCardsBulk(packet.customCards);
        }
        setMyPlayerId('guest');
        setRoomCode(joinCodeInput.trim());
        setDuelState(packet.initialState);
        setScreenMode('DUEL_ONLINE');
        setNetStatus('');
      } else if (packet.type === 'STATE_SYNC') {
        setDuelState(packet.state);
      }
    };

    try {
      await mgr.joinRoom(joinCodeInput.trim());
      mgr.send({
        type: 'GUEST_HELLO',
        guestName: playerName.trim() || selectedPreset.character,
        guestAvatar: activePlayerAvatarUrl,
        mainDeck: customMainDeck,
        extraDeck: customExtraDeck,
        customCards: getCustomCards(),
      });
    } catch {
      // handled in onError
    }
  };

  // Xử lý hành động trong trận đấu
  const handleDispatchDuelAction = (action: GameAction) => {
    if (!duelState) return;

    if (screenMode === 'DUEL_BOT') {
      const next = applyGameAction(duelState, action);
      setDuelState(next);
      return;
    }

    if (screenMode === 'DUEL_ONLINE') {
      const mgr = peerManagerRef.current;
      if (myPlayerId === 'host') {
        const next = applyGameAction(duelState, action);
        setDuelState(next);
        mgr?.send({ type: 'STATE_SYNC', state: next });
      } else {
        mgr?.send({ type: 'CLIENT_ACTION', action });
      }
    }
  };

  const handleRematch = () => {
    if (screenMode === 'DUEL_BOT') {
      startBotDuel();
      return;
    }
    if (screenMode === 'DUEL_ONLINE') {
      const mgr = peerManagerRef.current;
      if (myPlayerId === 'host' && guestDeckRef.current) {
        const g = guestDeckRef.current;
        const nextDuel = createInitialDuelState(
          playerName.trim() || selectedPreset.character,
          activePlayerAvatarUrl,
          customMainDeck,
          customExtraDeck,
          g.name,
          g.avatar,
          g.mainDeck,
          g.extraDeck
        );
        setDuelState(nextDuel);
        mgr?.send({ type: 'STATE_SYNC', state: nextDuel });
      } else {
        mgr?.send({ type: 'REMATCH_REQUEST' });
      }
    }
  };

  const handleExitToLobby = () => {
    peerManagerRef.current?.cleanup();
    peerManagerRef.current = null;
    setDuelState(null);
    setNetStatus('');
    setScreenMode('LOBBY');
  };

  // MÀN HÌNH ĐANG ĐẤU
  if ((screenMode === 'DUEL_BOT' || screenMode === 'DUEL_ONLINE') && duelState) {
    return (
      <DuelArena
        state={duelState}
        myPlayerId={myPlayerId}
        roomCode={roomCode}
        isOnline={screenMode === 'DUEL_ONLINE'}
        onDispatchAction={handleDispatchDuelAction}
        onExitToLobby={handleExitToLobby}
        onRematch={handleRematch}
      />
    );
  }

  // MÀN HÌNH SẢNH CHỜ (LOBBY YUGIH5 HIỆN ĐẠI, GỌN SẠCH)
  const botCustomSelected = savedDecks.some((d) => d.id === botPresetId);

  return (
    <div className="yugih5-bg min-h-screen text-slate-100 relative overflow-x-hidden flex flex-col">
      {/* Lớp nền vũ trụ / lưới Cyber đồng bộ với Bàn Đấu */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-x-0 -top-[46px] bottom-0 yugih5-cyber-grid animate-cyber-grid opacity-40" />
        <div
          className="absolute -top-32 left-1/6 w-[560px] h-[360px] rounded-full blur-3xl animate-nebula-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 72%)',
          }}
        />
        <div
          style={{
            animationDelay: '3s',
            background: 'radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 72%)',
          }}
          className="absolute -bottom-28 right-1/6 w-[540px] h-[340px] rounded-full blur-3xl animate-nebula-breathe"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.1]">
          <svg viewBox="0 0 800 800" className="w-[820px] h-[820px]">
            <g className="origin-center animate-orbit-slow" style={{ transformOrigin: '400px 400px' }}>
              <circle
                cx="400"
                cy="400"
                r="350"
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="16 14"
              />
              <circle
                cx="400"
                cy="400"
                r="290"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1"
                strokeDasharray="5 15"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Thanh Điều Hướng Trên Cùng */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-400/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 p-[1.5px] shadow-[0_0_20px_rgba(251,191,36,0.3)] shrink-0">
              <div className="w-full h-full rounded-[10px] bg-slate-950/90 flex items-center justify-center">
                <Swords className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                  YU-GI-OH! H5
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/35 text-[10px] font-bold tracking-widest text-sky-300 uppercase">
                  Classic Duel
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowDeckBuilder(true)}
              className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 border border-sky-400/35 hover:border-sky-400/70 rounded-xl text-xs font-bold text-slate-100 flex items-center gap-2 cursor-pointer transition-all shadow-lg"
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Soạn Bộ Bài</span>
              <span className="px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                {customMainDeck.length}
              </span>
            </button>

            <button
              onClick={() => setShowCardStudio(true)}
              className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/45 hover:border-amber-400/80 text-amber-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Xưởng Tạo Bài</span>
              {customCardsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-[10px]">
                  +{customCardsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Bố Cục Sảnh Chính 2 Cột Cân Đối */}
      <main className="relative z-10 my-auto w-full max-w-6xl mx-auto px-4 sm:px-6 pb-8 pt-2 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7/12): HỒ SƠ BÀI THỦ + BỘ BÀI RA TRẬN */}
        <section className="lg:col-span-7 bg-slate-950/75 backdrop-blur-md border border-indigo-400/25 rounded-2xl p-4 sm:p-5 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
          {/* Card Hồ Sơ & Xem Nhanh Lá Chủ Lực */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#161538]/95 via-slate-900/95 to-slate-950/95 border border-amber-400/40 p-4 mb-5">
            <div className="pointer-events-none -right-8 -top-10 absolute w-56 h-56 rounded-full bg-amber-500/10 blur-2xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Tên Bài Thủ & Thống Kê Bộ Bài */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3.5">
                  <img
                    src={activePlayerAvatarUrl}
                    alt={playerName || 'Duelist'}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.35)] shrink-0 bg-slate-950"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                      <span>Tên Bài Thủ</span>
                      <Pencil className="w-2.5 h-2.5 text-amber-400/70" />
                    </div>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Nhập tên của bạn..."
                      className="w-full max-w-[230px] bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 rounded-lg px-3 py-1 text-sm font-extrabold text-amber-300 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-white/10">
                  <div className="text-xs sm:text-sm font-extrabold text-white leading-snug mb-2">
                    {activeDeckTitle}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/35 text-[11px] font-bold text-amber-300">
                        {deckStats.monsters} Quái
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/35 text-[11px] font-bold text-emerald-300">
                        {deckStats.spells} Phép
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-400/35 text-[11px] font-bold text-purple-300">
                        {deckStats.traps} Bẫy
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-[11px] font-bold text-sky-300">
                        {customExtraDeck.length} Extra
                      </span>
                    </div>
                    <button
                      onClick={() => setShowDeckBuilder(true)}
                      className="text-[11px] font-bold text-sky-300 hover:text-sky-200 cursor-pointer shrink-0"
                    >
                      Chỉnh sửa &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Lá Bài Chủ Lực Của Bộ Bài Đang Chọn */}
              {deckStats.signatureCards.length > 0 && (
                <div className="hidden sm:flex items-center justify-center shrink-0 pr-1 pt-1">
                  {deckStats.signatureCards.map((card, idx) => {
                    const rotCls =
                      deckStats.signatureCards.length === 1
                        ? 'rotate-0'
                        : idx === 0
                        ? '-rotate-6 -mr-6 translate-y-1'
                        : idx === 1
                        ? 'rotate-0 z-10 -translate-y-1'
                        : 'rotate-6 -ml-6 translate-y-1';
                    return (
                      <div
                        key={`sig-${card.id}-${idx}`}
                        className={`transform scale-[0.76] origin-center transition-transform hover:scale-[0.82] hover:z-20 ${rotCls}`}
                      >
                        <YugiH5HandCard card={card} size="sm" noHoverLift />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Danh Sách Bộ Bài Kinh Điển */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                Bộ Bài Kinh Điển
              </span>
              <span className="text-[11px] text-slate-500">Chọn nhanh để ra trận</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_DECKS.map((deck) => {
                const active = selectedPresetId === deck.id;
                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => handleSelectPreset(deck)}
                    className={`group text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer ${
                      active
                        ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.2)]'
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                    }`}
                  >
                    <img
                      src={deck.avatarUrl}
                      alt={deck.character}
                      className={`w-11 h-11 rounded-lg object-cover border shrink-0 ${
                        active ? 'border-amber-300' : 'border-slate-700'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-extrabold truncate ${
                            active ? 'text-amber-300' : 'text-slate-100'
                          }`}
                        >
                          {deck.character}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                          {deck.mainDeck.length}+{deck.extraDeck.length}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {deck.shortLabel ?? getPresetArchetypeTag(deck.name)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danh Sách Bộ Bài Tự Soạn Đã Lưu */}
          {savedDecks.length > 0 && (
            <div className="pt-3.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-300">
                  Bộ Bài Tự Soạn ({savedDecks.length})
                </span>
                <button
                  onClick={() => setShowDeckBuilder(true)}
                  className="text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
                >
                  + Quản lý / Import .ydk
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {savedDecks.map((deck) => {
                  const active = selectedPresetId === deck.id;
                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => handleSelectSavedDeck(deck)}
                      className={`group text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer ${
                        active
                          ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.2)]'
                          : 'bg-slate-900/75 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                      }`}
                    >
                      <img
                        src={deck.avatarUrl}
                        alt={deck.name}
                        className={`w-11 h-11 rounded-lg object-cover border shrink-0 ${
                          active ? 'border-sky-300' : 'border-slate-700'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs font-extrabold truncate ${
                            active ? 'text-sky-300' : 'text-slate-100'
                          }`}
                        >
                          {deck.name}
                        </div>
                        <div className="text-[11px] font-mono font-semibold text-emerald-300 mt-0.5">
                          {deck.mainDeck.length} Chính • {deck.extraDeck.length} Extra
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* CỘT PHẢI (5/12): CHẾ ĐỘ ĐẤU */}
        <aside className="lg:col-span-5 flex flex-col gap-4">
          {/* Card 1: Đấu Với Bot AI */}
          <div className="bg-slate-950/75 backdrop-blur-md border border-amber-400/40 rounded-2xl p-4 sm:p-5 shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                    Đấu Với Bot AI
                  </h2>
                  <p className="text-[11px] text-slate-400">Vào trận ngay &bull; Tự động hóa luật</p>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Chọn Đối Thủ
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
              {PRESET_DECKS.map((d) => {
                const chosen = botPresetId === d.id;
                const displayShort =
                  d.id === 'blue_eyes_archetype'
                    ? 'Blue-Eyes'
                    : d.id === 'dark_magician_archetype'
                    ? 'Phù Thủy'
                    : d.character.includes('Kaiba')
                    ? 'Kaiba'
                    : d.character.split(' ')[0];
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setBotPresetId(d.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      chosen
                        ? 'bg-amber-500/18 border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.2)]'
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={d.avatarUrl}
                      alt={d.character}
                      className={`w-10 h-10 rounded-full object-cover border ${
                        chosen ? 'border-amber-300' : 'border-slate-700'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold text-center truncate w-full ${
                        chosen ? 'text-amber-300' : 'text-slate-300'
                      }`}
                    >
                      {displayShort}
                    </span>
                  </button>
                );
              })}
            </div>

            {savedDecks.length > 0 && (
              <div className="mb-3">
                <select
                  value={botCustomSelected ? botPresetId : ''}
                  onChange={(e) => {
                    if (e.target.value) setBotPresetId(e.target.value);
                  }}
                  className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none cursor-pointer"
                >
                  <option value="">-- Hoặc cho Bot dùng Bộ Bài Tự Soạn --</option>
                  {savedDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      Bot cầm: {d.name} ({d.mainDeck.length} lá)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={startBotDuel}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-105 text-slate-950 font-black rounded-xl text-sm tracking-wide cursor-pointer shadow-[0_6px_24px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Swords className="w-4 h-4" />
              Vào Bàn Đấu Ngay
            </button>
          </div>

          {/* Card 2: Chơi Online 2 Người (P2P) */}
          <div className="bg-slate-950/75 backdrop-blur-md border border-emerald-400/35 rounded-2xl p-4 sm:p-5 shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                    Đấu Online Bạn Bè
                  </h2>
                  <p className="text-[11px] text-slate-400">Tạo phòng P2P hoặc nhập mã 4 số</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-mono font-bold text-emerald-300">
                P2P
              </span>
            </div>

            {screenMode === 'WAITING_HOST' ? (
              <div className="bg-slate-900/90 border border-emerald-400/60 rounded-xl p-4 text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Mã Phòng Của Bạn
                </div>
                <div className="text-3xl font-mono font-black tracking-[0.25em] text-amber-300 mb-3">
                  {roomCode}
                </div>
                <div className="flex justify-center gap-2 mb-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(roomCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã copy mã
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy mã
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExitToLobby}
                    className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Hủy phòng
                  </button>
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                  <Wifi className="w-3.5 h-3.5" /> Đang chờ bạn bè vào mã {roomCode}...
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleHostOnlineRoom}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-105 text-white font-bold rounded-xl text-sm cursor-pointer shadow-[0_4px_18px_rgba(16,185,129,0.28)] transition-all"
                >
                  + Tạo Phòng Mới
                </button>

                <div className="flex items-center gap-2">
                  <div className="h-px bg-slate-800 flex-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Hoặc nhập mã
                  </span>
                  <div className="h-px bg-slate-800 flex-1" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleJoinOnlineRoom();
                    }}
                    placeholder="VD: 4829"
                    className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-sky-400 rounded-xl px-3 py-2 text-sm font-mono font-bold text-center tracking-widest outline-none transition-colors"
                  />
                  <button
                    onClick={handleJoinOnlineRoom}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold rounded-xl text-sm cursor-pointer transition-colors shrink-0"
                  >
                    Vào Phòng
                  </button>
                </div>
              </div>
            )}

            {netStatus && (
              <p className="text-xs text-amber-300 mt-3 bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/30">
                {netStatus}
              </p>
            )}
          </div>
        </aside>
      </main>

      {/* Modal Thêm Bài Mới (Zero-Code Card Studio) */}
      {showCardStudio && (
        <CardStudioModal
          onClose={() => setShowCardStudio(false)}
          onCardsUpdated={() => setCatalogVersion((v) => v + 1)}
        />
      )}

      {/* Modal Chỉnh Sửa Bộ Bài */}
      {showDeckBuilder && (
        <DeckBuilderModal
          initialMainDeck={customMainDeck}
          initialExtraDeck={customExtraDeck}
          initialDeckName={selectedSavedDeck?.name ?? 'Bộ Bài Tự Soạn'}
          activeCustomDeckId={selectedSavedDeck?.id ?? null}
          onSaveDeck={(m, ex, savedMeta) => {
            setCustomMainDeck(m);
            setCustomExtraDeck(ex);
            if (savedMeta?.id) {
              setSelectedPresetId(savedMeta.id);
            }
          }}
          onDecksUpdated={() => setSavedDecks(getSavedCustomDecks())}
          onCardsUpdated={() => setCatalogVersion((v) => v + 1)}
          onClose={() => setShowDeckBuilder(false)}
        />
      )}
    </div>
  );
};

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CardDefinition,
  ChainLinkNode,
  ChainResponseOption,
  DuelAnimationEvent,
  DuelState,
  FieldCardInstance,
  GameAction,
  HandCardInstance,
  PlayerId,
  ResolvedChainRecord,
} from '../types/game';
import {
  canActivateSpellOrTrapNow,
  canSpecialSummonFromHand,
  getAvailableFusionSummons,
  getEffectiveStats,
  getOpponentId,
  getRequiredTributes,
  getValidTargetInstances,
} from '../engine/DuelEngine';
import {
  getCardArtUrl,
  getCardById,
  getCardFullImageUrl,
  getShortCardTitle,
} from '../data/cards.catalog';
import {
  FitCardTitle,
  YugiH5HandCard,
  YUGIOH_CARD_BACK_SVG,
} from './YugiH5Card';
import { CardShowcasePicker, ShowcasePickerItem } from './CardShowcasePicker';
import { soundFX } from '../utils/sound';
import {
  Swords,
  Shield,
  Sparkles,
  Settings,
  MousePointer,
  Layers,
  Skull,
  ArrowLeft,
  ArrowRight,
  Lock,
  X,
  Flag,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface StrikeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ZoneCardSnapshot {
  instanceId: string;
  cardId: string;
  position: FieldCardInstance['position'];
  atk: number;
  def: number;
  slotKey: string;
  rect: StrikeRect;
}

interface AttackStrikeAnim {
  id: string;
  attackerInstanceId: string;
  targetInstanceId: string | 'DIRECT';
  targetPlayer?: PlayerId;
  attackerCard: CardDefinition;
  attackerAtk: number;
  attackerDef: number;
  attackerSurvived: boolean;
  sourceRect: StrikeRect;
  targetRect: StrikeRect;
  isDirectAttack: boolean;
  defenderSnapshot?: {
    card: CardDefinition;
    atk: number;
    def: number;
    position: FieldCardInstance['position'];
    survived: boolean;
  };
}

const SPARK_VECTORS = [
  { x: '68px', y: '-18px' },
  { x: '48px', y: '-58px' },
  { x: '-14px', y: '-72px' },
  { x: '-62px', y: '-36px' },
  { x: '-70px', y: '20px' },
  { x: '-44px', y: '60px' },
  { x: '18px', y: '70px' },
  { x: '62px', y: '42px' },
];

const AMBIENT_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 19 + 7) % 94 + 3}%`,
  top: `${(i * 29 + 15) % 78 + 14}%`,
  size: i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2,
  duration: `${8 + (i % 7) * 1.4}s`,
  delay: `${-((i * 1.3) % 9)}s`,
  drift: `${(i % 2 === 0 ? 1 : -1) * (14 + (i % 4) * 8)}px`,
  color:
    i % 3 === 0
      ? 'bg-amber-300/60 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
      : i % 3 === 1
      ? 'bg-sky-300/60 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
      : 'bg-violet-300/60 shadow-[0_0_8px_rgba(192,132,252,0.8)]',
}));

/**
 * LỚP TRÌNH CHIẾU ĐÒN TẤN CÔNG:
 * - Lá bài lùi lại lấy đà -> lao nhanh tới mục tiêu trên sân hoặc thẳng vào LP đối thủ
 * - Tia chớp năng lượng đường lao + nhát chém chữ X + tia lửa văng + vỡ tan lá bài bị hạ
 */
const AttackStrikeOverlay: React.FC<{ strike: AttackStrikeAnim }> = ({ strike }) => {
  const { sourceRect, targetRect, attackerCard, defenderSnapshot } = strike;
  const sx = sourceRect.left + sourceRect.width / 2;
  const sy = sourceRect.top + sourceRect.height / 2;
  const tx = targetRect.left + targetRect.width / 2;
  const ty = targetRect.top + targetRect.height / 2;

  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  // Hướng lùi lại lấy đà (ngược hướng tới mục tiêu)
  const recoilDist = 34;
  const recoilX = -ux * recoilDist;
  const recoilY = -uy * recoilDist;
  const tiltDeg = ux >= 0 ? -5.5 : 5.5;

  const strikeMotionVars = {
    left: `${sourceRect.left}px`,
    top: `${sourceRect.top}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    '--atk-recoil-x': `${recoilX.toFixed(1)}px`,
    '--atk-recoil-y': `${recoilY.toFixed(1)}px`,
    '--atk-dx': `${dx.toFixed(1)}px`,
    '--atk-dy': `${dy.toFixed(1)}px`,
    '--atk-tilt': `${tiltDeg}deg`,
  } as React.CSSProperties;

  return (
    <div key={strike.id} className="fixed inset-0 pointer-events-none z-[45] overflow-hidden">
      {/* 1. Dải tia năng lượng nối điểm xuất phát tới mục tiêu */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient
            id={`strike-beam-${strike.id}`}
            x1={sx}
            y1={sy}
            x2={tx}
            y2={ty}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0)" />
            <stop offset="38%" stopColor="rgba(251, 146, 60, 0.85)" />
            <stop offset="78%" stopColor="rgba(239, 68, 68, 0.95)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 1)" />
          </linearGradient>
        </defs>
        <line
          x1={sx + recoilX * 0.7}
          y1={sy + recoilY * 0.7}
          x2={tx}
          y2={ty}
          stroke={`url(#strike-beam-${strike.id})`}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          className="animate-strike-beam drop-shadow-[0_0_16px_rgba(248,113,113,0.95)]"
        />
        <line
          x1={sx + recoilX * 0.7}
          y1={sy + recoilY * 0.7}
          x2={tx}
          y2={ty}
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          className="animate-strike-beam"
        />
      </svg>

      {/* 2. Bản sao quái mục tiêu bị tiêu diệt: giữ nguyên hình tới lúc trúng đòn -> rung -> vỡ tan */}
      {defenderSnapshot && !defenderSnapshot.survived && (
        <div
          style={{
            left: `${targetRect.left}px`,
            top: `${targetRect.top}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
          className="absolute animate-defender-shatter z-10"
        >
          <YugiH5HandCard
            card={defenderSnapshot.card}
            size="field"
            overrideAtk={defenderSnapshot.atk}
            overrideDef={defenderSnapshot.def}
            activeStat={defenderSnapshot.position === 'ATTACK' ? 'ATK' : 'DEF'}
            noHoverLift
          />
        </div>
      )}

      {/* 3. Lá bài tấn công đang lùi lấy đà -> lao vút tới mục tiêu -> bật về */}
      <div
        style={strikeMotionVars}
        className={`absolute z-20 ${
          strike.attackerSurvived
            ? 'animate-card-strike-return'
            : 'animate-card-strike-destroy'
        }`}
      >
        <div className="relative w-full h-full rounded-[6px] ring-2 ring-amber-300 shadow-[0_0_32px_rgba(251,191,36,0.9)]">
          <YugiH5HandCard
            card={attackerCard}
            size="field"
            overrideAtk={strike.attackerAtk}
            overrideDef={strike.attackerDef}
            activeStat="ATK"
            noHoverLift
          />
        </div>
      </div>

      {/* 4. Tổ hợp hiệu ứng VA CHẠM tại điểm đánh (nhát chém kép, chớp nổ, vòng xung kích, tia lửa) */}
      <div
        style={{ left: `${tx}px`, top: `${ty}px` }}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
      >
        {/* Vòng xung kích kép */}
        <div className="absolute -inset-16 rounded-full border-4 border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.95)] animate-impact-ring" />
        <div
          style={{ animationDelay: '430ms' }}
          className="absolute -inset-12 rounded-full border-2 border-red-400 animate-impact-ring"
        />

        {/* Chớp nổ ánh sáng tâm va chạm */}
        <div
          className="w-28 h-28 rounded-full animate-impact-flash"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(253,224,71,0.88) 32%, rgba(239,68,68,0.6) 62%, transparent 78%)',
          }}
        />

        {/* Nhát chém ánh sáng chữ X cắt ngang mục tiêu */}
        <div
          style={{ '--slash-rot': '-40deg' } as React.CSSProperties}
          className="absolute left-1/2 top-1/2 -ml-24 -mt-1.5 w-48 h-3 rounded-full bg-gradient-to-r from-transparent via-white to-amber-300 shadow-[0_0_22px_rgba(255,255,255,1)] animate-impact-slash"
        />
        <div
          style={{ '--slash-rot': '40deg', animationDelay: '420ms' } as React.CSSProperties}
          className="absolute left-1/2 top-1/2 -ml-20 -mt-1 w-40 h-2 rounded-full bg-gradient-to-r from-transparent via-amber-200 to-red-400 shadow-[0_0_18px_rgba(248,113,113,0.95)] animate-impact-slash"
        />

        {/* 8 mảnh tia lửa văng tỏa ra xung quanh */}
        {SPARK_VECTORS.map((sp, idx) => (
          <span
            key={idx}
            style={
              {
                '--spark-x': sp.x,
                '--spark-y': sp.y,
              } as React.CSSProperties
            }
            className="absolute left-1/2 top-1/2 -ml-1 -mt-1 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-white via-amber-300 to-red-500 shadow-[0_0_10px_rgba(251,191,36,1)] animate-spark-burst"
          />
        ))}
      </div>
    </div>
  );
};

function getChainLinkKindUi(link: ChainLinkNode) {
  if (link.kind === 'HANDTRAP') {
    return {
      badge: 'HANDTRAP',
      badgeCls: 'bg-sky-500/20 text-sky-200 border-sky-400/70',
      borderCls: 'border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.3)]',
    };
  }
  if (link.kind === 'TRAP') {
    return {
      badge: 'BÀI BẪY',
      badgeCls: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/70',
      borderCls: 'border-fuchsia-400/80 shadow-[0_0_20px_rgba(232,121,249,0.28)]',
    };
  }
  if (link.kind === 'SPELL') {
    return {
      badge: 'BÀI PHÉP',
      badgeCls: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/70',
      borderCls: 'border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.28)]',
    };
  }
  if (link.kind === 'MONSTER_EFFECT') {
    return {
      badge: 'HIỆU ỨNG',
      badgeCls: 'bg-orange-500/20 text-orange-200 border-orange-400/70',
      borderCls: 'border-orange-400/80 shadow-[0_0_20px_rgba(251,146,60,0.28)]',
    };
  }
  if (link.kind === 'ATTACK') {
    return {
      badge: 'TẤN CÔNG',
      badgeCls: 'bg-red-500/20 text-red-200 border-red-400/70',
      borderCls: 'border-red-400/80 shadow-[0_0_18px_rgba(248,113,113,0.28)]',
    };
  }
  return {
    badge: 'TRIỆU HỒI',
    badgeCls: 'bg-amber-500/20 text-amber-200 border-amber-400/70',
    borderCls: 'border-amber-400/80 shadow-[0_0_18px_rgba(251,191,36,0.28)]',
  };
}

function getChainConnectorLabel(fromLink: ChainLinkNode): string {
  if (fromLink.status === 'NEGATED') return 'Đã bị vô hiệu';
  if (fromLink.triggerType === 'ON_OPPONENT_TRAP') return 'Vô hiệu & Phá Bẫy';
  if (fromLink.triggerType === 'ON_OPPONENT_SUMMON') return 'Tiêu diệt quái';
  if (fromLink.triggerType === 'ON_OPPONENT_ATTACK') {
    if (fromLink.cardId === 'magic_cylinder') return 'Vô hiệu & Phản đòn';
    if (fromLink.cardId === 'negate_attack') return 'Kết thúc Battle';
    if (fromLink.cardId === 'kuriboh') return 'Chặn sát thương';
    return 'Phản đòn tấn công';
  }
  return fromLink.effectActionVi || 'Tác động lên';
}

function getSingleTargetOutcomeTag(sourceCardId: string, triggerType?: ChainLinkNode['triggerType']) {
  if (triggerType === 'ON_SENT_TO_GY') return { label: 'LÊN TAY', cls: 'bg-sky-900/95 border-sky-400 text-sky-200' };
  if (triggerType === 'ON_BATTLE_END_SURVIVE') return { label: 'VỀ TAY', cls: 'bg-amber-900/95 border-amber-400 text-amber-200' };
  if (sourceCardId === 'monster_reborn' || sourceCardId === 'call_of_the_haunted') {
    return { label: 'HỒI SINH', cls: 'bg-emerald-900/95 border-emerald-400 text-emerald-200' };
  }
  if (sourceCardId === 'change_of_heart') return { label: 'CHIẾM QUYỀN', cls: 'bg-pink-900/95 border-pink-400 text-pink-200' };
  if (sourceCardId === 'stop_defense') return { label: 'ÉP SANG CÔNG', cls: 'bg-amber-900/95 border-amber-400 text-amber-200' };
  if (sourceCardId === 'axe_of_despair' || sourceCardId === 'horn_of_the_unicorn') {
    return { label: 'TRANG BỊ', cls: 'bg-emerald-900/95 border-emerald-400 text-emerald-200' };
  }
  return { label: 'BỊ PHÁ HỦY', cls: 'bg-rose-950/95 border-red-400 text-red-200' };
}

/**
 * BẢNG TRÌNH CHIẾU CHUỖI CHAIN (TỐI GIẢN ICON, TẬP TRUNG VÀO LÁ BÀI + MŨI TÊN + MÔ TẢ):
 * - Với 1 lá: [Lá Nguồn] ━━(Hiệu ứng)━━▶ [Lá Mục Tiêu / Kết Quả]
 * - Với 2-3+ lá (Chain Stack): hiện các lá bài nối với nhau qua mũi tên tác động CL3 -> CL2 -> CL1 cùng mô tả ngắn gọn
 */
const ResolvedChainShowcase: React.FC<{
  record: ResolvedChainRecord;
  state: DuelState;
  myPlayerId: PlayerId;
  onClose: () => void;
}> = ({ record, state, myPlayerId, onClose }) => {
  const links = record.links;
  const total = links.length;
  const isMultiChain = total >= 2;
  const singleLink = total === 1 ? links[0] : null;
  const singleCardDef = singleLink ? getCardById(singleLink.cardId) : undefined;
  const singleTargetsList = singleLink
    ? (singleLink.extraTargetCardIds && singleLink.extraTargetCardIds.length > 0
        ? singleLink.extraTargetCardIds
        : singleLink.targetCardId
        ? [singleLink.targetCardId]
        : [])
    : [];

  return (
    <div className="fixed inset-0 z-[44] pointer-events-none flex items-center justify-center px-3">
      <div className="animate-chain-showcase pointer-events-auto relative max-w-[94vw] w-fit bg-slate-950/94 backdrop-blur-md border-2 border-amber-400/85 rounded-2xl px-4 sm:px-6 py-3.5 shadow-[0_18px_60px_rgba(0,0,0,0.95),0_0_36px_rgba(251,191,36,0.22)]">
        {/* Nút đóng nhanh */}
        <button
          onClick={onClose}
          title="Đóng thông báo Chain"
          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-slate-900 hover:bg-slate-800 border border-amber-400/80 text-amber-200 flex items-center justify-center shadow-lg cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Thanh Tiêu Đề Gọn Sạch Không Icon Thừa */}
        <div className="flex items-center justify-center mb-3 border-b border-slate-800/90 pb-1.5">
          <span className="text-xs sm:text-sm font-black tracking-wide text-amber-300 uppercase text-center">
            {record.titleVi}
          </span>
        </div>

        {/* NỘI DUNG CHÍNH: 1 LÁ TÁC ĐỘNG HOẶC CHUỖI CHAIN 2-3+ LÁ */}
        {singleLink && singleCardDef ? (
          <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap sm:flex-nowrap">
            {/* Lá bài kích hoạt */}
            {(() => {
              const ui = getChainLinkKindUi(singleLink);
              const actorName = singleLink.actor === myPlayerId ? 'Bạn' : state.players[singleLink.actor].name;
              return (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-[1px] rounded border text-[8.5px] font-black ${ui.badgeCls}`}>
                      {ui.badge}
                    </span>
                    <span
                      className={`px-1.5 py-[1px] rounded text-[8.5px] font-extrabold ${
                        singleLink.actor === myPlayerId
                          ? 'bg-sky-500/20 text-sky-200'
                          : 'bg-rose-500/20 text-rose-200'
                      }`}
                    >
                      {actorName}
                    </span>
                  </div>
                  <YugiH5HandCard card={singleCardDef} size="sm" noHoverLift />
                  <div className="max-w-[130px] text-[10px] font-semibold text-slate-200 text-center leading-snug">
                    {singleLink.effectActionVi || 'Kích hoạt hiệu ứng'}
                  </div>
                </div>
              );
            })()}

            {/* Mũi tên chỉ rõ hướng tác động sang lá mục tiêu / kết quả */}
            {(singleTargetsList.length > 0 || singleLink.targetPlayer || singleLink.lpDelta) && (
              <>
                <div className="flex flex-col items-center justify-center shrink-0 px-1 animate-chain-arrow">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/65 text-[9.5px] font-extrabold text-amber-200 whitespace-nowrap mb-1">
                    {singleLink.effectActionVi || 'Tác động lên'}
                  </span>
                  <div className="flex items-center gap-1 text-amber-300">
                    <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-amber-400/45 to-amber-300 rounded-full" />
                    <ArrowRight className="w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]" />
                  </div>
                </div>

                {/* Mục tiêu: 1 lá bài, nhiều lá bài, hoặc thay đổi LP */}
                {singleTargetsList.length === 1 ? (
                  (() => {
                    const tDef = getCardById(singleTargetsList[0]);
                    if (!tDef) return null;
                    const tag = getSingleTargetOutcomeTag(singleLink.cardId, singleLink.triggerType);
                    return (
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`px-1.5 py-[1px] rounded border text-[8.5px] font-black ${tag.cls}`}>
                          {tag.label}
                        </span>
                        <div className="rounded-[7px] ring-2 ring-red-400/75 shadow-[0_0_18px_rgba(248,113,113,0.3)]">
                          <YugiH5HandCard card={tDef} size="sm" noHoverLift />
                        </div>
                      </div>
                    );
                  })()
                ) : singleTargetsList.length > 1 ? (
                  <div className="bg-slate-900/85 border border-red-400/70 rounded-xl p-2.5 flex flex-col items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-rose-950/90 border border-red-400/75 text-[9px] font-black text-red-200">
                      BỊ TÁC ĐỘNG ({singleTargetsList.length} LÁ)
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      {singleTargetsList.slice(0, 4).map((cid, idx) => {
                        const td = getCardById(cid);
                        if (!td) return null;
                        return (
                          <div key={`${cid}-${idx}`} className="rounded-[6px] ring-1 ring-red-400/70">
                            <YugiH5HandCard card={td} size="sm" noHoverLift />
                          </div>
                        );
                      })}
                      {singleTargetsList.length > 4 && (
                        <span className="px-2 py-1 rounded bg-red-950 border border-red-400/60 text-red-200 text-xs font-black">
                          +{singleTargetsList.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/90 border border-amber-400/70 rounded-xl px-4 py-3 flex flex-col items-center min-w-[120px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Mục Tiêu
                    </span>
                    <span className="text-xs font-black text-white">
                      {singleLink.targetPlayer
                        ? singleLink.targetPlayer === myPlayerId
                          ? 'Bạn'
                          : state.players[singleLink.targetPlayer].name
                        : 'Kết Quả'}
                    </span>
                    {singleLink.lpDelta ? (
                      <span
                        className={`text-lg font-mono font-black mt-1 ${
                          singleLink.lpDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {singleLink.lpDelta > 0 ? `+${singleLink.lpDelta}` : singleLink.lpDelta} LP
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-200 mt-1 text-center">
                        {singleLink.resultVi}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* MULTI-LINK CHAIN STACK (2 - 3+ LÁ): Hiện các lá bài nối bằng mũi tên tác động + mô tả */
          <div className="flex items-start justify-center gap-1.5 sm:gap-2.5 flex-wrap md:flex-nowrap">
            {links.map((link, idx) => {
              const cardDef = getCardById(link.cardId);
              if (!cardDef) return null;
              const ui = getChainLinkKindUi(link);
              const isNegated = link.status === 'NEGATED';
              const resolveOrder = total - idx;
              const actorLabel =
                link.actor === myPlayerId ? 'Bạn' : state.players[link.actor].name;
              const nextLink = links[idx + 1];
              const nextIsNegated = nextLink?.status === 'NEGATED';
              const extraTargets = (link.extraTargetCardIds ?? []).filter(
                (cid, tIdx) => tIdx > 0 || cid !== link.targetCardId
              );

              return (
                <React.Fragment key={`cl-${link.chainNumber}-${link.cardId}`}>
                  {/* Mắt xích: Label gọn + Lá bài + Mô tả kết quả */}
                  <div className="w-[116px] sm:w-[130px] flex flex-col items-center">
                    <div className="w-full flex items-center justify-between gap-1 mb-1 px-0.5">
                      <span className="px-1.5 py-[1px] rounded bg-amber-400 text-slate-950 font-mono font-black text-[9.5px]">
                        CL{link.chainNumber}
                      </span>
                      {isMultiChain && (
                        <span className="text-[9px] font-mono font-bold text-slate-300">
                          #{resolveOrder} {resolveOrder === 1 ? 'Trước' : ''}
                        </span>
                      )}
                      <span
                        className={`px-1 py-[1px] rounded text-[8.5px] font-bold truncate ${
                          link.actor === myPlayerId
                            ? 'bg-sky-500/20 text-sky-200'
                            : 'bg-rose-500/20 text-rose-200'
                        }`}
                      >
                        {actorLabel}
                      </span>
                    </div>

                    <div
                      className={`relative rounded-[7px] p-[1px] transition-all ${
                        isNegated ? 'ring-2 ring-red-500/80' : `ring-1 ${ui.borderCls}`
                      }`}
                    >
                      <div className={isNegated ? 'brightness-45 saturate-50' : ''}>
                        <YugiH5HandCard card={cardDef} size="sm" noHoverLift />
                      </div>
                      {isNegated && (
                        <div className="animate-negate-stamp pointer-events-none absolute inset-x-0.5 top-1/2 -translate-y-1/2 bg-red-700/95 border border-white/85 text-white text-[8.5px] font-black text-center py-0.5 rounded shadow-lg tracking-wider">
                          {link.chainNumber === 1 && link.kind === 'SUMMON'
                            ? 'BỊ TIÊU DIỆT'
                            : link.chainNumber === 1 && link.kind === 'ATTACK'
                            ? 'BỊ CHẶN'
                            : 'BỊ VÔ HIỆU'}
                        </div>
                      )}
                    </div>

                    <div className="mt-1.5 w-full text-center">
                      <div
                        className={`px-1.5 py-1 rounded text-[9.5px] font-semibold leading-snug border ${
                          isNegated
                            ? 'bg-red-950/80 text-red-200 border-red-500/50'
                            : 'bg-slate-900/90 text-slate-200 border-slate-700/80'
                        }`}
                      >
                        {link.resultVi || link.effectActionVi}
                      </div>
                      {extraTargets.length > 0 && !isNegated && (
                        <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                          {extraTargets.slice(0, 2).map((cid, eIdx) => {
                            const ed = getCardById(cid);
                            return ed ? (
                              <span
                                key={`${cid}-${eIdx}`}
                                className="px-1.5 py-[1px] rounded bg-rose-950/75 border border-rose-500/50 text-[8px] font-semibold text-rose-200"
                              >
                                {getShortCardTitle(ed)}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mũi tên chỉ rõ lá sau (CL N+1) tác động lên lá trước (CL N) */}
                  {nextLink && (
                    <div className="flex flex-col items-center justify-center shrink-0 px-0.5 sm:px-1 mt-12">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[8.5px] font-bold whitespace-nowrap mb-1 ${
                          nextIsNegated
                            ? 'bg-slate-900/90 border-slate-700 text-slate-400 line-through'
                            : 'bg-amber-500/15 border-amber-400/75 text-amber-200'
                        }`}
                      >
                        {getChainConnectorLabel(nextLink)}
                      </span>
                      <div
                        className={`flex items-center gap-0.5 ${
                          nextIsNegated
                            ? 'text-slate-600 opacity-55'
                            : 'text-amber-300 animate-chain-arrow'
                        }`}
                      >
                        <ArrowLeft className="w-4 h-4 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]" />
                        <div
                          className={`w-6 sm:w-9 h-[2px] rounded-full ${
                            nextIsNegated
                              ? 'border-b-2 border-dashed border-slate-600 bg-transparent'
                              : 'bg-gradient-to-l from-amber-300/50 to-amber-300'
                          }`}
                        />
                      </div>
                      <span className="text-[8.5px] font-mono font-bold text-slate-400 mt-0.5">
                        CL{nextLink.chainNumber} &rarr; CL{link.chainNumber}
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Mô tả tổng kết nhân quả ngắn gọn */}
        {record.summaryVi && (
          <div className="mt-3 pt-2 border-t border-slate-800/90 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-900/95 border border-amber-400/45 text-[11px] sm:text-xs font-bold text-amber-200 leading-snug">
              {record.summaryVi}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * KHUNG Ô SÂN ĐẤU SVG VÁT GÓC KIM LOẠI CHUẨN YUGIH5
 * Không bị mất viền ở 4 góc vát như khi dùng CSS clip-path
 */
const ZoneFrameSVG: React.FC<{
  side: 'self' | 'opp';
  isSquare?: boolean;
  emblem?: 'diamond' | 'star' | 'none';
  highlight?: 'gold' | 'red' | 'cyan' | 'none';
}> = ({ side, isSquare = false, emblem = 'diamond', highlight = 'none' }) => {
  const strokeMain =
    highlight === 'red'
      ? '#ef4444'
      : highlight === 'gold'
      ? '#fde047'
      : highlight === 'cyan'
      ? '#38bdf8'
      : side === 'self'
      ? '#e2be75'
      : '#565d8a';

  const strokeCorner =
    highlight === 'red'
      ? '#fca5a5'
      : highlight === 'gold'
      ? '#fef08a'
      : highlight === 'cyan'
      ? '#bae6fd'
      : side === 'self'
      ? '#fbe39e'
      : '#7880b5';

  const strokeInner =
    side === 'self' ? 'rgba(226, 190, 117, 0.32)' : 'rgba(110, 120, 175, 0.25)';

  const bgFill =
    highlight === 'red'
      ? 'rgba(85, 16, 28, 0.82)'
      : highlight === 'gold'
      ? 'rgba(72, 52, 16, 0.78)'
      : side === 'self'
      ? 'rgba(20, 21, 46, 0.88)'
      : 'rgba(13, 14, 30, 0.88)';

  // Tọa độ vát góc cho ô vuông (100x100) hoặc ô chữ nhật đứng (100x140)
  const h = isSquare ? 100 : 140;
  const c = isSquare ? 10 : 9;
  const ci = isSquare ? 15 : 14;
  const cy = h / 2;

  return (
    <svg
      viewBox={`0 0 100 ${h}`}
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
    >
      {/* Nền đa giác vát 4 góc + Viền chính */}
      <polygon
        points={`${c},2 ${100 - c},2 98,${c} 98,${h - c} ${100 - c},${h - 2} ${c},${h - 2} 2,${h - c} 2,${c}`}
        fill={bgFill}
        stroke={strokeMain}
        strokeWidth={side === 'self' ? '2.2' : '1.6'}
      />

      {/* Viền mảnh bên trong tạo độ sâu cơ khí / ma thuật */}
      <polygon
        points={`${ci},6 ${100 - ci},6 94,${ci} 94,${h - ci} ${100 - ci},${h - 6} ${ci},${h - 6} 6,${h - ci} 6,${ci}`}
        fill="none"
        stroke={strokeInner}
        strokeWidth="1"
      />

      {/* 4 Góc Vát Kim Loại Đậm Chuẩn YugiH5 */}
      <polyline
        points={`2,${c + 10} 2,${c} ${c},2 ${c + 10},2`}
        fill="none"
        stroke={strokeCorner}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <polyline
        points={`${100 - c - 10},2 ${100 - c},2 98,${c} 98,${c + 10}`}
        fill="none"
        stroke={strokeCorner}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <polyline
        points={`2,${h - c - 10} 2,${h - c} ${c},${h - 2} ${c + 10},${h - 2}`}
        fill="none"
        stroke={strokeCorner}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <polyline
        points={`${100 - c - 10},${h - 2} ${100 - c},${h - 2} 98,${h - c} 98,${h - c - 10}`}
        fill="none"
        stroke={strokeCorner}
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Họa tiết tâm ô khi ô đang trống */}
      {emblem === 'diamond' && (
        <g opacity={side === 'self' ? '0.65' : '0.4'}>
          <line x1="16" y1="16" x2="38" y2={cy - 12} stroke={strokeInner} strokeWidth="0.9" />
          <line x1="84" y1="16" x2="62" y2={cy - 12} stroke={strokeInner} strokeWidth="0.9" />
          <line x1="16" y1={h - 16} x2="38" y2={cy + 12} stroke={strokeInner} strokeWidth="0.9" />
          <line x1="84" y1={h - 16} x2="62" y2={cy + 12} stroke={strokeInner} strokeWidth="0.9" />
          <polygon
            points={`50,${cy - 13} 63,${cy} 50,${cy + 13} 37,${cy}`}
            fill="none"
            stroke={strokeMain}
            strokeWidth="1.4"
          />
          <polygon
            points={`50,${cy - 7} 57,${cy} 50,${cy + 7} 43,${cy}`}
            fill={strokeInner}
          />
        </g>
      )}

      {emblem === 'star' && (
        <g opacity={side === 'self' ? '0.85' : '0.55'}>
          <polygon
            points={`50,${cy - 18} 55,${cy - 5} 68,${cy} 55,${cy + 5} 50,${cy + 18} 45,${cy + 5} 32,${cy} 45,${cy - 5}`}
            fill="none"
            stroke={strokeMain}
            strokeWidth="1.6"
          />
          <circle cx="50" cy={cy} r="3" fill={strokeCorner} />
        </g>
      )}
    </svg>
  );
};

/**
 * NÚT LỤC GIÁC 2 VIỀN KIM LOẠI / NEON CHUẨN YUGIH5
 */
const HexIconButton: React.FC<{
  onClick: () => void;
  title: string;
  label?: string;
  variant?: 'silver' | 'cyan' | 'gold' | 'crimson';
  active?: boolean;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}> = ({
  onClick,
  title,
  label,
  variant = 'silver',
  active = false,
  size = 'md',
  children,
}) => {
  const palette =
    active || variant === 'gold'
      ? { outer: '#fbbf24', inner: '#fde68a', bg1: '#3b2506', bg2: '#181004', text: 'text-amber-300' }
      : variant === 'cyan'
      ? { outer: '#38bdf8', inner: '#bae6fd', bg1: '#0c2d48', bg2: '#071626', text: 'text-sky-300' }
      : variant === 'crimson'
      ? { outer: '#f87171', inner: '#fecaca', bg1: '#450a0a', bg2: '#1f0505', text: 'text-rose-300' }
      : { outer: '#cbd5e1', inner: '#64748b', bg1: '#1e243b', bg2: '#0d101d', text: 'text-slate-100' };

  const dim = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';

  return (
    <button
      onClick={onClick}
      title={title}
      className={`group relative ${dim} flex flex-col items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95 select-none`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]">
        <defs>
          <linearGradient id={`hex-bg-${variant}-${active}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.bg1} />
            <stop offset="100%" stopColor={palette.bg2} />
          </linearGradient>
        </defs>
        {/* Lục giác ngoài */}
        <polygon
          points="50,3 93,26 93,74 50,97 7,74 7,26"
          fill={`url(#hex-bg-${variant}-${active})`}
          stroke={palette.outer}
          strokeWidth="4.5"
        />
        {/* Lục giác mảnh bên trong */}
        <polygon
          points="50,11 85,30 85,70 50,89 15,70 15,30"
          fill="none"
          stroke={palette.inner}
          strokeWidth="1.4"
          opacity="0.7"
        />
      </svg>
      <div className={`relative z-10 flex flex-col items-center justify-center ${palette.text}`}>
        {children}
        {label && (
          <span className="text-[8px] font-extrabold tracking-tight leading-none mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            {label}
          </span>
        )}
      </div>
    </button>
  );
};

interface DuelArenaProps {
  state: DuelState;
  myPlayerId: PlayerId;
  roomCode?: string;
  isOnline: boolean;
  onDispatchAction: (action: GameAction) => void;
  onExitToLobby: () => void;
  onRematch: () => void;
}

export const DuelArena: React.FC<DuelArenaProps> = ({
  state,
  myPlayerId,
  roomCode,
  isOnline,
  onDispatchAction,
  onExitToLobby,
  onRematch,
}) => {
  const oppPlayerId = getOpponentId(myPlayerId);
  const me = state.players[myPlayerId];
  const opp = state.players[oppPlayerId];
  const isMyTurn = state.currentTurnPlayer === myPlayerId;

  // Lá bài đang di chuột vào (Hover) -> tự động hiện khung hiệu ứng
  const [hoveredCard, setHoveredCard] = useState<CardDefinition | null>(null);
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(soundFX.muted);

  // Lá bài trên tay hoặc trên sân đang được bấm chọn
  const [selectedHandInstanceId, setSelectedHandInstanceId] = useState<string | null>(null);
  const [selectedFieldInstanceId, setSelectedFieldInstanceId] = useState<string | null>(null);

  // Chế độ chọn quái Hiến Tế (Tribute Summon)
  const [pendingTributeSummon, setPendingTributeSummon] = useState<{
    handInstanceId: string;
    position: 'ATTACK' | 'SET_DEFENSE';
    requiredCount: number;
    selectedTributeIds: string[];
  } | null>(null);

  // Chế độ chọn mục tiêu Tấn Công
  const [attackingMonsterId, setAttackingMonsterId] = useState<string | null>(null);

  // Hộp thoại chọn mục tiêu cho bài Phép / Bẫy
  const [pendingTargetModal, setPendingTargetModal] = useState<{
    instanceId: string;
    fromLocation: 'HAND' | 'FIELD';
    cardDef: CardDefinition;
    candidates: { instanceId: string; cardId: string; labelVi: string; location: string }[];
  } | null>(null);

  // Hộp thoại chọn quái Dung Hợp (Polymerization / Ultimate Fusion / Nhãn Thần Timaeus)
  const [pendingFusionModal, setPendingFusionModal] = useState<{
    polyInstanceId: string;
    fromLocation: 'HAND' | 'FIELD';
    targetInstanceId?: string;
    options: { extraCard: HandCardInstance; def: CardDefinition }[];
  } | null>(null);

  // Hộp thoại chọn lá bỏ tay khi Triệu hồi Đặc biệt từ tay (Apprentice, Timaeus United Dragon, Chaos...)
  const [pendingHandDiscardSummon, setPendingHandDiscardSummon] = useState<{
    handInstanceId: string;
    cardDef: CardDefinition;
    requiredCount: number;
    selectedDiscardIds: string[];
  } | null>(null);

  // Xem Mộ hoặc Extra Deck
  const [viewingPile, setViewingPile] = useState<{
    title: string;
    cards: HandCardInstance[];
  } | null>(null);

  // Lựa chọn các bài trong pendingSelection (Graceful Charity / Sangan)
  const [selectionPickedIds, setSelectionPickedIds] = useState<string[]>([]);

  // Hiệu ứng động đang trình chiếu trên màn hình
  const [activeAnimEvent, setActiveAnimEvent] = useState<DuelAnimationEvent | null>(null);
  const [lpPopup, setLpPopup] = useState<{
    player: PlayerId;
    delta: number;
    key: string;
  } | null>(null);

  const initialEvents =
    state.recentEvents && state.recentEvents.length > 0
      ? state.recentEvents
      : state.lastEvent
      ? [state.lastEvent]
      : [];
  const seenAttackEventIdsRef = useRef<Set<string>>(new Set(initialEvents.map((e) => e.id)));
  const seenToastEventIdsRef = useRef<Set<string>>(new Set(initialEvents.map((e) => e.id)));
  const seenChainAttackCheckRef = useRef<Set<string>>(new Set(initialEvents.map((e) => e.id)));

  const initialChains =
    state.recentResolvedChains && state.recentResolvedChains.length > 0
      ? state.recentResolvedChains
      : state.lastResolvedChain
      ? [state.lastResolvedChain]
      : [];
  const seenChainIdsRef = useRef<Set<string>>(new Set(initialChains.map((c) => c.id)));
  const [activeResolvedChain, setActiveResolvedChain] = useState<ResolvedChainRecord | null>(null);
  const [queuedResolvedChains, setQueuedResolvedChains] = useState<ResolvedChainRecord[]>([]);
  const [chainDelayActive, setChainDelayActive] = useState<boolean>(false);

  const prevLpRef = useRef<{ host: number; guest: number }>({
    host: state.players.host.lp,
    guest: state.players.guest.lp,
  });

  // Theo dõi các lá bài vừa được rút/thêm vào tay để trình chiếu trượt vào kế bên bài trên tay
  const prevMyHandIdsRef = useRef<Set<string>>(new Set(me.hand.map((h) => h.instanceId)));
  const prevOppHandIdsRef = useRef<Set<string>>(new Set(opp.hand.map((h) => h.instanceId)));
  const [newlyDrawnCards, setNewlyDrawnCards] = useState<Record<string, number>>({});

  // Lưu DOM refs của 10 ô quái thú & 2 HUD mục tiêu đánh trực diện để tính tọa độ lao bài chính xác
  const monsterSlotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const directTargetRefs = useRef<Record<PlayerId, HTMLDivElement | null>>({
    host: null,
    guest: null,
  });
  const prevBoardSnapshotRef = useRef<Record<string, ZoneCardSnapshot>>({});
  const [attackStrike, setAttackStrike] = useState<AttackStrikeAnim | null>(null);

  const isAnyCardPickerOpen = Boolean(
    (state.pendingChain && state.pendingChain.responder === myPlayerId) ||
      (state.pendingSelection && state.pendingSelection.player === myPlayerId) ||
      pendingTargetModal ||
      pendingFusionModal ||
      pendingHandDiscardSummon ||
      viewingPile
  );

  const isMyModalBlocking = Boolean(isAnyCardPickerOpen || state.winner);

  useLayoutEffect(() => {
    const nextSnapshot: Record<string, ZoneCardSnapshot> = {};

    const captureZones = (zones: (FieldCardInstance | null)[], prefix: 'self' | 'opp') => {
      zones.forEach((m, idx) => {
        if (!m) return;
        const slotKey = `${prefix}-${idx}`;
        const el = monsterSlotRefs.current[slotKey];
        if (!el) return;
        const r = el.getBoundingClientRect();
        const stats = getEffectiveStats(state, m);
        nextSnapshot[m.instanceId] = {
          instanceId: m.instanceId,
          cardId: m.cardId,
          position: m.position,
          atk: stats.atk,
          def: stats.def,
          slotKey,
          rect: { left: r.left, top: r.top, width: r.width, height: r.height },
        };
      });
    };

    captureZones(me.monsterZones, 'self');
    captureZones(opp.monsterZones, 'opp');

    const candidateEvents =
      state.recentEvents && state.recentEvents.length > 0
        ? state.recentEvents
        : state.lastEvent
        ? [state.lastEvent]
        : [];

    // Quét recentEvents để KHÔNG bao giờ bị mất hiệu ứng lao bài khi combat tiêu diệt quái (vì DESTROY bị ghi đè lên lastEvent)
    if (!state.pendingChain) {
      const unseenAttacks = candidateEvents.filter(
        (e) =>
          !seenAttackEventIdsRef.current.has(e.id) &&
          (e.type === 'ATTACK' || e.type === 'DIRECT_ATTACK') &&
          !e.isDeclarationOnly &&
          Boolean(e.sourceInstanceId)
      );
      if (unseenAttacks.length > 0) {
        unseenAttacks.forEach((e) => seenAttackEventIdsRef.current.add(e.id));
        const ev = unseenAttacks[unseenAttacks.length - 1];
        const prevSnap = prevBoardSnapshotRef.current;

        const attackerPrev = prevSnap[ev.sourceInstanceId!];
        const attackerCurr = nextSnapshot[ev.sourceInstanceId!];
        const attackerSlotRect =
          attackerCurr?.rect ??
          (attackerPrev?.slotKey && monsterSlotRefs.current[attackerPrev.slotKey]
            ? (() => {
                const r = monsterSlotRefs.current[attackerPrev.slotKey]!.getBoundingClientRect();
                return { left: r.left, top: r.top, width: r.width, height: r.height };
              })()
            : attackerPrev?.rect);

        const attackerDef = ev.cardId ? getCardById(ev.cardId) : undefined;

        if (attackerSlotRect && attackerDef) {
          let targetSlotRect: StrikeRect | undefined;
          let defenderSnapshot: AttackStrikeAnim['defenderSnapshot'];

          if (ev.type === 'DIRECT_ATTACK') {
            const receiverId = ev.actor ? getOpponentId(ev.actor) : oppPlayerId;
            const hudEl = directTargetRefs.current[receiverId];
            if (hudEl) {
              const r = hudEl.getBoundingClientRect();
              targetSlotRect = { left: r.left, top: r.top, width: r.width, height: r.height };
            }
          } else if (ev.targetInstanceId && ev.targetInstanceId !== 'DIRECT') {
            const defenderPrev = prevSnap[ev.targetInstanceId];
            const defenderCurr = nextSnapshot[ev.targetInstanceId];
            targetSlotRect =
              defenderCurr?.rect ??
              (defenderPrev?.slotKey && monsterSlotRefs.current[defenderPrev.slotKey]
                ? (() => {
                    const r = monsterSlotRefs.current[defenderPrev.slotKey]!.getBoundingClientRect();
                    return { left: r.left, top: r.top, width: r.width, height: r.height };
                  })()
                : defenderPrev?.rect);

            const defCardId = defenderCurr?.cardId ?? ev.targetCardId ?? defenderPrev?.cardId;
            const defCard = defCardId ? getCardById(defCardId) : undefined;
            if (defCard) {
              defenderSnapshot = {
                card: defCard,
                atk: defenderCurr?.atk ?? defenderPrev?.atk ?? defCard.atk ?? 0,
                def: defenderCurr?.def ?? defenderPrev?.def ?? defCard.def ?? 0,
                position:
                  defenderCurr?.position ??
                  (defenderPrev?.position === 'SET_DEFENSE'
                    ? 'DEFENSE'
                    : defenderPrev?.position ?? 'ATTACK'),
                survived: Boolean(defenderCurr),
              };
            }
          }

          if (targetSlotRect) {
            setAttackStrike({
              id: ev.id,
              attackerInstanceId: ev.sourceInstanceId!,
              targetInstanceId: ev.targetInstanceId || 'DIRECT',
              targetPlayer: ev.targetPlayer,
              attackerCard: attackerDef,
              attackerAtk: attackerCurr?.atk ?? attackerPrev?.atk ?? attackerDef.atk ?? 0,
              attackerDef: attackerCurr?.def ?? attackerPrev?.def ?? attackerDef.def ?? 0,
              attackerSurvived: Boolean(attackerCurr),
              sourceRect: attackerSlotRect,
              targetRect: targetSlotRect,
              isDirectAttack: ev.type === 'DIRECT_ATTACK',
              defenderSnapshot,
            });
          }
        }
      }
    }

    prevBoardSnapshotRef.current = nextSnapshot;
  }, [state, me.monsterZones, opp.monsterZones, oppPlayerId]);

  useEffect(() => {
    if (!attackStrike) return;
    const timer = setTimeout(() => {
      setAttackStrike((curr) => (curr?.id === attackStrike.id ? null : curr));
    }, 930);
    return () => clearTimeout(timer);
  }, [attackStrike]);

  // Phát hiệu ứng góc trái & âm thanh (ưu tiên sự kiện Tấn công > Phép/Bẫy > Triệu hồi > Phá hủy)
  useEffect(() => {
    const candidateEvents =
      state.recentEvents && state.recentEvents.length > 0
        ? state.recentEvents
        : state.lastEvent
        ? [state.lastEvent]
        : [];

    const unseen = candidateEvents.filter((e) => !seenToastEventIdsRef.current.has(e.id));
    if (unseen.length === 0) return;
    unseen.forEach((e) => seenToastEventIdsRef.current.add(e.id));

    const attackEv = [...unseen]
      .reverse()
      .find((e) => !e.isDeclarationOnly && (e.type === 'ATTACK' || e.type === 'DIRECT_ATTACK'));
    const spellTrapEv = [...unseen]
      .reverse()
      .find((e) => e.type === 'TRAP_ACTIVATE' || e.type === 'SPELL_ACTIVATE');
    const summonEv = [...unseen].reverse().find((e) => e.type === 'SUMMON');
    const primaryEv = attackEv ?? spellTrapEv ?? summonEv ?? unseen[unseen.length - 1];

    setActiveAnimEvent(primaryEv);

    if (primaryEv.type === 'DRAW') {
      soundFX.playDraw();
    } else if (primaryEv.type === 'SUMMON' || primaryEv.type === 'SET_CARD') {
      soundFX.playSummon();
    } else if (primaryEv.type === 'SPELL_ACTIVATE' || primaryEv.type === 'TRAP_ACTIVATE') {
      soundFX.playSpellTrap();
    } else if (primaryEv.type === 'ATTACK' || primaryEv.type === 'DIRECT_ATTACK') {
      soundFX.playAttack();
      if (unseen.some((u) => u.type === 'DESTROY')) {
        setTimeout(() => soundFX.playDestroy(), 420);
      }
    } else if (primaryEv.type === 'DESTROY') {
      soundFX.playDestroy();
    }
  }, [state]);

  useEffect(() => {
    if (!activeAnimEvent) return;
    const timer = setTimeout(() => {
      setActiveAnimEvent((curr) => (curr?.id === activeAnimEvent.id ? null : curr));
    }, 1900);
    return () => clearTimeout(timer);
  }, [activeAnimEvent?.id]);

  // Phát hiện các chuỗi Chain vừa giải quyết để hiển thị rõ ở chính giữa sân
  useEffect(() => {
    const candidateChains =
      state.recentResolvedChains && state.recentResolvedChains.length > 0
        ? state.recentResolvedChains
        : state.lastResolvedChain
        ? [state.lastResolvedChain]
        : [];
    const incomingChains = candidateChains.filter((c) => !seenChainIdsRef.current.has(c.id));

    const candidateEvents =
      state.recentEvents && state.recentEvents.length > 0
        ? state.recentEvents
        : state.lastEvent
        ? [state.lastEvent]
        : [];
    const unseenEvents = candidateEvents.filter((e) => !seenChainAttackCheckRef.current.has(e.id));
    unseenEvents.forEach((e) => seenChainAttackCheckRef.current.add(e.id));

    if (incomingChains.length === 0) return;
    incomingChains.forEach((c) => seenChainIdsRef.current.add(c.id));

    const attackAlsoTriggered =
      !state.pendingChain &&
      unseenEvents.some(
        (e) => (e.type === 'ATTACK' || e.type === 'DIRECT_ATTACK') && !e.isDeclarationOnly
      );

    setActiveResolvedChain(incomingChains[0]);
    setQueuedResolvedChains(incomingChains.slice(1));
    setChainDelayActive(attackAlsoTriggered || Boolean(attackStrike));
  }, [state]);

  // Nếu đòn tấn công đang lao đi -> chờ 620ms cho va chạm xong mới hiện Chain Showcase
  useEffect(() => {
    if (!chainDelayActive) return;
    const timer = setTimeout(() => {
      setChainDelayActive(false);
    }, 620);
    return () => clearTimeout(timer);
  }, [chainDelayActive]);

  // Tự động đóng bảng trình chiếu Chain ở giữa (tạm dừng nếu người chơi đang có cửa sổ chọn bài)
  useEffect(() => {
    if (!activeResolvedChain || chainDelayActive || isMyModalBlocking) return;
    const stayMs =
      activeResolvedChain.links.length >= 3
        ? 3900
        : activeResolvedChain.links.length === 2
        ? 3200
        : 2500;
    const timer = setTimeout(() => {
      if (queuedResolvedChains.length > 0) {
        setActiveResolvedChain(queuedResolvedChains[0]);
        setQueuedResolvedChains((prev) => prev.slice(1));
      } else {
        setActiveResolvedChain(null);
      }
    }, stayMs);
    return () => clearTimeout(timer);
  }, [activeResolvedChain?.id, chainDelayActive, isMyModalBlocking, queuedResolvedChains.length]);

  // Phát hiện thay đổi Điểm Gốc (LP) để hiện số máu bay lên & kêu tiếng đếm LP cổ điển
  useEffect(() => {
    const prev = prevLpRef.current;
    for (const pid of ['host', 'guest'] as PlayerId[]) {
      const currentLp = state.players[pid].lp;
      if (currentLp !== prev[pid]) {
        const delta = currentLp - prev[pid];
        prevLpRef.current[pid] = currentLp;
        soundFX.playLpCounter();
        setLpPopup({
          player: pid,
          delta,
          key: `${pid}_${Date.now()}`,
        });
        setTimeout(() => {
          setLpPopup((curr) => (curr?.player === pid ? null : curr));
        }, 1600);
      }
    }
  }, [state.players.host.lp, state.players.guest.lp]);

  // Phát hiện lá bài vừa rút vào tay (me.hand / opp.hand) để trượt ngay bên cạnh các lá đang có
  useEffect(() => {
    const currentMyIds = me.hand.map((h) => h.instanceId);
    const prevMySet = prevMyHandIdsRef.current;
    const isFreshSelfReset =
      state.turnNumber === 1 &&
      prevMySet.size > 0 &&
      currentMyIds.length === 5 &&
      !currentMyIds.some((id) => prevMySet.has(id));
    const addedSelf = isFreshSelfReset
      ? []
      : currentMyIds.filter((id) => !prevMySet.has(id));
    prevMyHandIdsRef.current = new Set(currentMyIds);

    const currentOppIds = opp.hand.map((h) => h.instanceId);
    const prevOppSet = prevOppHandIdsRef.current;
    const isFreshOppReset =
      state.turnNumber === 1 &&
      prevOppSet.size > 0 &&
      currentOppIds.length === 5 &&
      !currentOppIds.some((id) => prevOppSet.has(id));
    const addedOpp = isFreshOppReset
      ? []
      : currentOppIds.filter((id) => !prevOppSet.has(id));
    prevOppHandIdsRef.current = new Set(currentOppIds);

    const addedAll = [...addedSelf, ...addedOpp];
    if (addedAll.length === 0) return;

    const batch: Record<string, number> = {};
    addedSelf.forEach((id, i) => {
      batch[id] = i;
    });
    addedOpp.forEach((id, i) => {
      batch[id] = i;
    });

    setNewlyDrawnCards((prev) => ({ ...prev, ...batch }));
    const timer = setTimeout(() => {
      setNewlyDrawnCards((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const id of addedAll) {
          if (id in next) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [me.hand, opp.hand, state.turnNumber]);

  const handleHoverCard = (cardId: string | undefined, isSecret = false) => {
    if (!cardId || isSecret) {
      setHoveredCard((prev) => (prev === null ? null : null));
      return;
    }
    const d = getCardById(cardId);
    if (d) {
      setHoveredCard((prev) => (prev?.id === d.id ? prev : d));
    }
  };

  // Xác định quái đang tấn công và quái đang bị nhắm đánh
  const activeAttackerInstanceId =
    state.pendingChain?.attackerInstanceId ||
    (activeAnimEvent?.type === 'ATTACK' || activeAnimEvent?.type === 'DIRECT_ATTACK'
      ? activeAnimEvent.sourceInstanceId
      : undefined);

  const activeTargetInstanceId =
    state.pendingChain?.attackTargetInstanceId ||
    (activeAnimEvent?.type === 'ATTACK' ||
    activeAnimEvent?.type === 'DIRECT_ATTACK' ||
    activeAnimEvent?.type === 'SPELL_ACTIVATE' ||
    activeAnimEvent?.type === 'TRAP_ACTIVATE'
      ? activeAnimEvent.targetInstanceId
      : undefined);

  // Xác định lá bài vừa được đặt / triệu hồi / úp xuống sân để chạy animation đập bài xuống sân
  const isCardJustPlacedOnField = (instanceId: string): boolean => {
    if (!activeAnimEvent) return false;
    return (
      (activeAnimEvent.type === 'SUMMON' ||
        activeAnimEvent.type === 'SET_CARD' ||
        activeAnimEvent.type === 'SPELL_ACTIVATE' ||
        activeAnimEvent.type === 'TRAP_ACTIVATE') &&
      activeAnimEvent.sourceInstanceId === instanceId
    );
  };

  // Xử lý bấm Triệu Hồi hoặc Úp quái từ trên tay
  const handleStartSummonFromHand = (
    handCard: HandCardInstance,
    position: 'ATTACK' | 'SET_DEFENSE'
  ) => {
    const def = getCardById(handCard.cardId);
    if (!def) return;
    const reqTributes = getRequiredTributes(def);

    if (reqTributes === 0) {
      onDispatchAction({
        type: 'NORMAL_SUMMON',
        playerId: myPlayerId,
        handInstanceId: handCard.instanceId,
        position,
      });
      setSelectedHandInstanceId(null);
      return;
    }

    const myMonstersOnField = me.monsterZones.filter(
      (m): m is FieldCardInstance => m !== null
    );
    if (myMonstersOnField.length < reqTributes) {
      alert(`Cần hiến tế ${reqTributes} quái thú trên sân để triệu hồi [${def.nameVi}]!`);
      return;
    }

    if (myMonstersOnField.length === reqTributes) {
      onDispatchAction({
        type: 'NORMAL_SUMMON',
        playerId: myPlayerId,
        handInstanceId: handCard.instanceId,
        position,
        tributeInstanceIds: myMonstersOnField.map((m) => m.instanceId),
      });
      setSelectedHandInstanceId(null);
      return;
    }

    setPendingTributeSummon({
      handInstanceId: handCard.instanceId,
      position,
      requiredCount: reqTributes,
      selectedTributeIds: [],
    });
    setSelectedHandInstanceId(null);
  };

  // Xử lý kích hoạt Phép / Bẫy từ Tay hoặc Sân
  const handleInitiateActivateSpellTrap = (
    instanceId: string,
    cardId: string,
    fromLocation: 'HAND' | 'FIELD'
  ) => {
    const def = getCardById(cardId);
    if (!def) return;
    const eff = def.effects?.find((e) => e.trigger === 'ON_ACTIVATE');
    const fusionAct = eff?.actions?.find((a) => a.type === 'FUSION_SUMMON');

    // Nếu là Con Mắt Timaeus -> Chọn mục tiêu Phù Thủy trên sân trước, sau đó chọn quái Dung Hợp
    if (fusionAct?.useTargetAsOnlyFusionMaterial && eff?.target && eff.target.location !== 'NONE') {
      const candidates = getValidTargetInstances(
        state,
        myPlayerId,
        def,
        instanceId
      );
      if (candidates.length === 0) return;
      setPendingTargetModal({
        instanceId,
        fromLocation,
        cardDef: def,
        candidates,
      });
      setSelectedHandInstanceId(null);
      setSelectedFieldInstanceId(null);
      return;
    }

    if (fusionAct) {
      const fusions = getAvailableFusionSummons(state, myPlayerId, {
        allowGy: Boolean(fusionAct.allowGyFusionMaterials),
      });
      if (fusions.length === 1) {
        onDispatchAction({
          type: 'ACTIVATE_SPELL_OR_TRAP',
          playerId: myPlayerId,
          instanceId,
          fromLocation,
          fusionExtraInstanceId: fusions[0].extraCard.instanceId,
        });
      } else if (fusions.length > 1) {
        setPendingFusionModal({
          polyInstanceId: instanceId,
          fromLocation,
          options: fusions,
        });
      }
      setSelectedHandInstanceId(null);
      setSelectedFieldInstanceId(null);
      return;
    }

    if (eff?.target && eff.target.location !== 'NONE') {
      const candidates = getValidTargetInstances(
        state,
        myPlayerId,
        def,
        instanceId
      );
      if (candidates.length === 0) return;
      setPendingTargetModal({
        instanceId,
        fromLocation,
        cardDef: def,
        candidates,
      });
      setSelectedHandInstanceId(null);
      setSelectedFieldInstanceId(null);
      return;
    }

    onDispatchAction({
      type: 'ACTIVATE_SPELL_OR_TRAP',
      playerId: myPlayerId,
      instanceId,
      fromLocation,
    });
    setSelectedHandInstanceId(null);
    setSelectedFieldInstanceId(null);
  };

  // Xử lý khi bấm nút Tấn Công trên quái thú của mình
  const handleStartAttack = (attacker: FieldCardInstance) => {
    const oppMonsters = opp.monsterZones.filter(
      (m): m is FieldCardInstance => m !== null
    );
    if (oppMonsters.length === 0) {
      onDispatchAction({
        type: 'DECLARE_ATTACK',
        playerId: myPlayerId,
        attackerInstanceId: attacker.instanceId,
        targetInstanceId: 'DIRECT',
      });
      setSelectedFieldInstanceId(null);
      setAttackingMonsterId(null);
    } else if (oppMonsters.length === 1) {
      onDispatchAction({
        type: 'DECLARE_ATTACK',
        playerId: myPlayerId,
        attackerInstanceId: attacker.instanceId,
        targetInstanceId: oppMonsters[0].instanceId,
      });
      setSelectedFieldInstanceId(null);
      setAttackingMonsterId(null);
    } else {
      setAttackingMonsterId(attacker.instanceId);
      setSelectedFieldInstanceId(null);
    }
  };

  const canSummonHandMonster = (handCard: HandCardInstance): boolean => {
    if (!isMyTurn || (state.phase !== 'MAIN1' && state.phase !== 'MAIN2')) return false;
    if (me.normalSummonUsedThisTurn) return false;
    const def = getCardById(handCard.cardId);
    if (!def || def.category !== 'MONSTER') return false;
    const req = getRequiredTributes(def);
    const ownCount = me.monsterZones.filter((m) => m !== null).length;
    if (req === 0) return me.monsterZones.some((z) => z === null);
    return ownCount >= req;
  };

  const hasReadyAttacker =
    state.turnNumber > 1 &&
    me.attackLockedTurns === 0 &&
    me.monsterZones.some(
      (m) => m !== null && m.position === 'ATTACK' && m.attacksDeclaredThisTurn === 0
    );

  const oppTopGyCard = opp.graveyard.length > 0 ? opp.graveyard[opp.graveyard.length - 1] : null;
  const oppTopGyDef = oppTopGyCard ? getCardById(oppTopGyCard.cardId) : undefined;
  const meTopGyCard = me.graveyard.length > 0 ? me.graveyard[me.graveyard.length - 1] : null;
  const meTopGyDef = meTopGyCard ? getCardById(meTopGyCard.cardId) : undefined;
  const animCardDef = activeAnimEvent?.cardId ? getCardById(activeAnimEvent.cardId) : undefined;
  const animTargetCardDef = activeAnimEvent?.targetCardId
    ? getCardById(activeAnimEvent.targetCardId)
    : undefined;

  const activeFieldZone =
    (me.fieldZone?.position === 'FACE_UP' ? me.fieldZone : null) ??
    (opp.fieldZone?.position === 'FACE_UP' ? opp.fieldZone : null);
  const activeFieldSpellId = activeFieldZone?.cardId;

  return (
    <div className="yugih5-bg h-screen w-screen overflow-hidden relative select-none flex items-center justify-center">
      {/* ================================================================= */}
      {/* 0. NỀN ĐỘNG KHÔNG GIAN ĐẤU BÀI (CYBER GRID + DUEL RING + HẠT SÁNG) */}
      {/* ================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Lưới 3D trôi liên tục */}
        <div className="absolute inset-x-0 -top-[46px] bottom-0 yugih5-cyber-grid animate-cyber-grid opacity-70" />

        {/* Quầng tinh vân thở nhẹ ở 2 nửa sân */}
        <div
          className="absolute -top-24 left-1/4 w-[520px] h-[340px] rounded-full blur-3xl animate-nebula-breathe"
          style={{
            background:
              state.phase === 'BATTLE'
                ? 'radial-gradient(circle, rgba(220,38,38,0.22) 0%, transparent 72%)'
                : 'radial-gradient(circle, rgba(139,92,246,0.26) 0%, transparent 72%)',
          }}
        />
        <div
          style={{
            animationDelay: '3.5s',
            background:
              isMyTurn
                ? 'radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 72%)'
                : 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 72%)',
          }}
          className="absolute -bottom-24 right-1/4 w-[560px] h-[340px] rounded-full blur-3xl animate-nebula-breathe"
        />

        {/* Vòng tròn ma thuật & Duel Disk xoay chậm sau lưng bàn đấu */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.18]">
          <svg viewBox="0 0 800 800" className="w-[780px] h-[780px] sm:w-[980px] sm:h-[980px]">
            <g className="origin-center animate-orbit-slow" style={{ transformOrigin: '400px 400px' }}>
              <circle
                cx="400"
                cy="400"
                r="360"
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="18 14"
              />
              <circle
                cx="400"
                cy="400"
                r="335"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1"
                strokeDasharray="4 16"
              />
              <polygon
                points="400,48 705,224 705,576 400,752 95,576 95,224"
                fill="none"
                stroke="rgba(129, 140, 248, 0.45)"
                strokeWidth="1.2"
              />
            </g>
            <g
              className="origin-center animate-orbit-reverse"
              style={{ transformOrigin: '400px 400px' }}
            >
              <circle
                cx="400"
                cy="400"
                r="268"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.4"
                strokeDasharray="28 12 6 12"
              />
              <circle
                cx="400"
                cy="400"
                r="242"
                fill="none"
                stroke="rgba(251, 191, 36, 0.55)"
                strokeWidth="1"
              />
            </g>
          </svg>
        </div>

        {/* Các hạt năng lượng trôi lơ lửng trong nền */}
        {AMBIENT_PARTICLES.map((p) => (
          <span
            key={p.id}
            style={
              {
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                '--ember-dur': p.duration,
                '--ember-delay': p.delay,
                '--ember-drift': p.drift,
              } as React.CSSProperties
            }
            className={`absolute rounded-full animate-ember-float ${p.color}`}
          />
        ))}
      </div>

      {/* Hiệu ứng đòn tấn công bay qua sân + chém nổ */}
      {attackStrike && <AttackStrikeOverlay strike={attackStrike} />}

      {/* Trình chiếu Chuỗi Chain & Hiệu ứng tác động lá này -> lá kia ngay giữa sân */}
      {activeResolvedChain && !chainDelayActive && !isMyModalBlocking && (
        <ResolvedChainShowcase
          record={activeResolvedChain}
          state={state}
          myPlayerId={myPlayerId}
          onClose={() => {
            if (queuedResolvedChains.length > 0) {
              setActiveResolvedChain(queuedResolvedChains[0]);
              setQueuedResolvedChains((prev) => prev.slice(1));
            } else {
              setActiveResolvedChain(null);
            }
          }}
        />
      )}

      {/* Thanh báo chuỗi Chain sống động khi đang chờ Đối Thủ phản ứng Bẫy / Handtrap */}
      {state.pendingChain &&
        state.pendingChain.responder !== myPlayerId &&
        (state.pendingChain.chainLinks?.length ?? 0) > 0 && (
          <div className="fixed top-18 left-1/2 -translate-x-1/2 z-40 pointer-events-none max-w-[92vw]">
            <div className="bg-slate-950/92 border-2 border-fuchsia-400/80 rounded-2xl px-4 py-2 shadow-[0_0_28px_rgba(232,121,249,0.38)] flex items-center gap-2.5 flex-wrap justify-center">
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {state.pendingChain.chainLinks!.map((cl, idx) => {
                  const d = getCardById(cl.cardId);
                  return (
                    <React.Fragment key={`live-wait-cl-${cl.chainNumber}`}>
                      {idx > 0 && (
                        <ArrowRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      )}
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                        <span className="px-1 rounded bg-amber-400 text-slate-950 font-mono font-black text-[9px]">
                          CL{cl.chainNumber}
                        </span>
                        {d && (
                          <img
                            src={getCardArtUrl(d)}
                            alt={getShortCardTitle(d)}
                            className="w-5 h-5 rounded object-cover"
                          />
                        )}
                        <span className="text-[11px] font-bold text-white">
                          {d ? getShortCardTitle(d) : cl.cardId}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-amber-300 animate-pulse">
                Đang chờ {opp.name} phản ứng Handtrap / Bẫy...
              </span>
            </div>
          </div>
        )}

      {/* ================================================================= */}
      {/* THÔNG BÁO DÙNG BÀI GÓC TRÁI (RÚT BÀI HIỂN THỊ TRỰC TIẾP KẾ BÊN TAY) */}
      {/* ================================================================= */}

      {/* Thông Báo Khi Dùng Bài / Chiến Đấu / Rút Bài Ở Vùng Trống Góc Trên Trái */}
      {activeAnimEvent && (
        <div className="fixed top-2.5 left-17 sm:left-38 z-40 pointer-events-none max-w-[380px] sm:max-w-[440px]">
          {/* Trường hợp A: Giao Tranh Chiến Đấu (ATTACK / DIRECT_ATTACK) */}
          {(activeAnimEvent.type === 'ATTACK' || activeAnimEvent.type === 'DIRECT_ATTACK') &&
          animCardDef ? (
            <div
              key={activeAnimEvent.id}
              className="animate-corner-toast bg-gradient-to-r from-red-950/95 via-slate-950/95 to-indigo-950/95 border-2 border-red-400/90 rounded-xl px-3.5 py-2 shadow-[0_8px_30px_rgba(239,68,68,0.45)] flex items-center gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={getCardArtUrl(animCardDef)}
                  alt={getShortCardTitle(animCardDef)}
                  className="w-12 h-12 rounded-md object-cover border-2 border-red-400 shrink-0"
                />
                <div className="min-w-0 max-w-[120px]">
                  <div className="text-[9px] font-black text-red-300 uppercase">⚔️ Tấn Công</div>
                  <div className="text-[11px] font-extrabold text-white leading-tight">
                    {getShortCardTitle(animCardDef)}
                  </div>
                  <div className="text-[11px] font-mono font-black text-amber-300">
                    {animCardDef.atk} ATK
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center shrink-0">
                <span className="text-lg animate-sword-slash">⚔️</span>
                <span className="text-[9px] font-black text-amber-300 uppercase">VS</span>
              </div>

              {activeAnimEvent.type === 'DIRECT_ATTACK' ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-11 h-11 rounded-md bg-red-900/60 border-2 border-amber-400 flex items-center justify-center text-lg shrink-0">
                    🎯
                  </div>
                  <div className="min-w-0 max-w-[115px]">
                    <div className="text-[9px] font-black text-amber-300 uppercase">Trực Diện</div>
                    <div className="text-[11px] font-extrabold text-white leading-tight">
                      {activeAnimEvent.targetPlayer
                        ? state.players[activeAnimEvent.targetPlayer].name
                        : 'Đối Thủ'}
                    </div>
                  </div>
                </div>
              ) : (
                animTargetCardDef && (
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={getCardArtUrl(animTargetCardDef)}
                      alt={getShortCardTitle(animTargetCardDef)}
                      className="w-12 h-12 rounded-md object-cover border-2 border-sky-400 shrink-0"
                    />
                    <div className="min-w-0 max-w-[120px]">
                      <div className="text-[9px] font-black text-sky-300 uppercase">Mục Tiêu</div>
                      <div className="text-[11px] font-extrabold text-white leading-tight">
                        {getShortCardTitle(animTargetCardDef)}
                      </div>
                      <div className="text-[11px] font-mono font-black text-sky-300">
                        {animTargetCardDef.atk}/{animTargetCardDef.def}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (activeAnimEvent.type === 'SUMMON' ||
              activeAnimEvent.type === 'SPELL_ACTIVATE' ||
              activeAnimEvent.type === 'TRAP_ACTIVATE') &&
            animCardDef ? (
            /* Trường hợp B: Triệu Hồi Quái hoặc Kích Hoạt Phép / Bẫy */
            <div
              key={activeAnimEvent.id}
              className={`animate-corner-toast bg-slate-950/95 border-2 rounded-xl p-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center gap-3 ${
                activeAnimEvent.type === 'SUMMON'
                  ? 'border-amber-400/90 shadow-amber-500/20'
                  : activeAnimEvent.type === 'SPELL_ACTIVATE'
                  ? 'border-emerald-400/90 shadow-emerald-500/20'
                  : 'border-fuchsia-400/90 shadow-fuchsia-500/20'
              }`}
            >
              <YugiH5HandCard card={animCardDef} size="sm" noHoverLift />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      activeAnimEvent.type === 'SUMMON'
                        ? 'text-amber-400'
                        : activeAnimEvent.type === 'SPELL_ACTIVATE'
                        ? 'text-emerald-400'
                        : 'text-fuchsia-400'
                    }`}
                  >
                    {activeAnimEvent.type === 'SUMMON'
                      ? '🌟 TRIỆU HỒI'
                      : activeAnimEvent.type === 'SPELL_ACTIVATE'
                      ? '✨ BÀI PHÉP'
                      : '⚡ BÀI BẪY'}
                  </span>
                  {activeAnimEvent.actor && (
                    <span
                      className={`px-1.5 py-[1px] rounded text-[9px] font-extrabold ${
                        activeAnimEvent.actor === myPlayerId
                          ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40'
                          : 'bg-rose-500/25 text-rose-300 border border-rose-400/40'
                      }`}
                    >
                      {activeAnimEvent.actor === myPlayerId ? 'Bạn' : opp.name}
                    </span>
                  )}
                </div>
                <div className="text-[13px] font-extrabold text-white leading-tight">
                  {getShortCardTitle(animCardDef)}
                </div>
                {animCardDef.name && animCardDef.name !== getShortCardTitle(animCardDef) && (
                  <div className="text-[10px] font-semibold text-amber-300/80 leading-tight mt-0.5">
                    {animCardDef.name}
                  </div>
                )}
                {animCardDef.category === 'MONSTER' ? (
                  <div className="text-xs font-mono font-black text-amber-300 mt-1">
                    ATK {animCardDef.atk} / DEF {animCardDef.def}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-200 mt-1 line-clamp-3 leading-snug">
                    {animCardDef.descriptionVi}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Trường hợp C: Úp bài (SET_CARD), Rút bài (DRAW), Phá hủy, Hồi máu / Sát thương, Bắt đầu trận */
            <div
              key={activeAnimEvent.id}
              className={`animate-corner-toast bg-slate-950/95 border-2 rounded-xl px-3.5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.85)] flex items-center gap-3 ${
                activeAnimEvent.type === 'DESTROY' || activeAnimEvent.type === 'DAMAGE'
                  ? 'border-red-400/85'
                  : activeAnimEvent.type === 'HEAL'
                  ? 'border-emerald-400/85'
                  : activeAnimEvent.type === 'SET_CARD'
                  ? 'border-purple-400/85'
                  : 'border-amber-400/85'
              }`}
            >
              {activeAnimEvent.type === 'SET_CARD' || activeAnimEvent.type === 'DRAW' ? (
                <img
                  src={YUGIOH_CARD_BACK_SVG}
                  alt="Card Back"
                  className="w-10 h-14 rounded-xs border border-amber-400/80 shadow shrink-0"
                />
              ) : animCardDef ? (
                <img
                  src={getCardArtUrl(animCardDef)}
                  alt={animCardDef.nameVi}
                  className="w-12 h-12 rounded-md object-cover border border-amber-400/80 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-lg shrink-0">
                  ⚔️
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 mb-0.5">
                  {activeAnimEvent.type === 'SET_CARD'
                    ? '🂠 ÚP BÀI XUỐNG SÂN'
                    : activeAnimEvent.type === 'DRAW'
                    ? '🃏 RÚT BÀI'
                    : activeAnimEvent.type === 'DESTROY'
                    ? '💥 PHÁ HỦY BÀI'
                    : activeAnimEvent.type === 'HEAL'
                    ? '💚 HỒI ĐIỂM GỐC'
                    : activeAnimEvent.type === 'DAMAGE'
                    ? '🔥 GÂY SÁT THƯƠNG'
                    : '⚔️ TRẬN ĐẤU'}
                </div>
                <div className="text-xs font-bold text-slate-100 leading-snug line-clamp-2">
                  {activeAnimEvent.messageVi}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. CỤM NÚT LỤC GIÁC BÊN TRÁI + BÀI TRÊN TAY & HUD ĐỐI PHƯƠNG */}
      {/* ================================================================= */}

      {/* Cụm Góc Trái Trên: Ping/Deck + Các Nút Lục Giác Chuẩn YugiH5 */}
      <div className="fixed top-2.5 left-2.5 z-30 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <div className="px-2.5 py-1 bg-slate-950/90 border border-amber-400/50 rounded-lg flex items-center gap-1.5 shadow-lg">
            <img src={YUGIOH_CARD_BACK_SVG} alt="Deck" className="w-3.5 h-5 rounded-xs" />
            <span className="font-mono font-extrabold text-xs text-amber-200">
              {opp.deck.length}
            </span>
          </div>
          <div className="px-2.5 py-0.5 bg-slate-950/85 border border-sky-500/40 rounded-lg text-[10px] font-mono leading-tight text-emerald-400 shadow-lg">
            <div>{isOnline ? `Phòng ${roomCode}` : 'Ping 12ms'}</div>
            <div className="text-sky-300">60 FPS</div>
          </div>
        </div>

        {/* Cột Nút Bấm Lục Giác Kim Loại */}
        <div className="flex flex-col items-center gap-1.5 mt-1 w-13">
          <HexIconButton
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            title="Cài đặt / Đầu hàng / Thoát"
            label="Cài đặt"
            variant="silver"
            active={showSettingsMenu}
          >
            <Settings className="w-4 h-4" />
          </HexIconButton>

          <HexIconButton
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            title="Nhật ký trận đấu"
            label="Nhật ký"
            variant="cyan"
            active={showLogDrawer}
          >
            <MousePointer className="w-4 h-4" />
          </HexIconButton>

          <HexIconButton
            onClick={() => {
              soundFX.muted = !muted;
              setMuted(soundFX.muted);
            }}
            title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            label={muted ? 'Tắt tiếng' : 'Âm thanh'}
            variant={muted ? 'crimson' : 'silver'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </HexIconButton>
        </div>

        {showSettingsMenu && (
          <div className="bg-slate-950/95 border-2 border-amber-400/80 rounded-xl p-2.5 shadow-2xl space-y-1.5 w-46">
            <button
              onClick={() => {
                setShowSettingsMenu(false);
                if (confirm('Bạn có chắc muốn đầu hàng ván này?')) {
                  onDispatchAction({ type: 'SURRENDER', playerId: myPlayerId });
                }
              }}
              className="w-full px-3 py-1.5 bg-red-900/85 hover:bg-red-800 text-red-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" /> Đầu Hàng Ván Này
            </button>
            <button
              onClick={onExitToLobby}
              className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer text-left"
            >
              ← Về Sảnh Chờ
            </button>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* KHUNG HIỆN HIỆU ỨNG TỰ ĐỘNG KHI DI CHUỘT VÀO LÁ BÀI (HOVER PREVIEW) */}
      {/* ================================================================= */}
      {hoveredCard && (
        <div
          className={`fixed ${
            isAnyCardPickerOpen ? 'bottom-3 left-3' : 'top-16 left-17'
          } z-[65] w-80 sm:w-82 bg-slate-950/95 border-2 border-amber-400/90 rounded-xl p-3 shadow-[0_12px_40px_rgba(0,0,0,0.95)] pointer-events-none transition-all`}
        >
          <div className="flex gap-3">
            <img
              src={getCardFullImageUrl(hoveredCard)}
              alt={hoveredCard.nameVi}
              className="w-22 h-32 object-contain rounded bg-slate-900 shrink-0 border border-amber-500/40"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = getCardArtUrl(hoveredCard);
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-sm text-amber-300 leading-snug">
                {getShortCardTitle(hoveredCard)}
              </div>
              <div className="text-[11px] text-slate-400">{hoveredCard.name}</div>
              <div className="mt-1 flex items-center gap-1 flex-wrap">
                <div className="inline-block px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-sky-300">
                  {hoveredCard.category === 'MONSTER'
                    ? `Quái Thú • ${hoveredCard.race} / ${hoveredCard.attribute}`
                    : hoveredCard.category === 'SPELL'
                    ? `Bài Phép (${hoveredCard.subType})`
                    : `Bài Bẫy (${hoveredCard.subType})`}
                </div>
                {hoveredCard.effects?.some((e) => e.activateFromHand) && (
                  <div className="inline-block px-1.5 py-0.5 bg-sky-950 border border-sky-400/70 rounded text-[10px] font-black text-sky-200">
                    🖐️ Handtrap (Từ Tay)
                  </div>
                )}
              </div>
              {hoveredCard.category === 'MONSTER' && (
                <>
                  <div className="text-xs text-amber-400 mt-0.5">
                    {'★'.repeat(Math.min(12, hoveredCard.level || 4))} (Cấp {hoveredCard.level})
                  </div>
                  <div className="text-xs font-mono font-extrabold text-emerald-400 mt-0.5">
                    ATK {hoveredCard.atk} / DEF {hoveredCard.def}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-100 leading-relaxed">
            {hoveredCard.descriptionVi}
          </div>
        </div>
      )}

      {/* Bài Úp Trên Tay Đối Phương (Rút bài mới sẽ trượt ngay vào kế bên tay) */}
      <div className="fixed top-0 left-1/2 sm:left-[56%] -translate-x-1/2 z-20 pointer-events-none">
        <div className="flex items-start -space-x-1 overflow-visible pr-4">
          {opp.hand.map((h) => {
            const drawOrder = newlyDrawnCards[h.instanceId];
            const isJustDrawn = drawOrder !== undefined;
            return (
              <img
                key={h.instanceId}
                src={YUGIOH_CARD_BACK_SVG}
                alt="Opponent Hand"
                style={isJustDrawn ? { animationDelay: `${drawOrder * 110}ms` } : undefined}
                className={`w-11 sm:w-13 h-16 sm:h-19 -mt-3 rounded-xs border shadow-[0_6px_15px_rgba(0,0,0,0.8)] ${
                  isJustDrawn
                    ? 'animate-hand-draw-opp border-amber-300 ring-2 ring-amber-300/80 shadow-[0_0_16px_rgba(251,191,36,0.85)]'
                    : 'border-amber-400/60'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* HUD Đối Phương Góc Phải Trên (Thiết kế vát góc Sci-Fi Đỏ Thẫm chuẩn YugiH5) */}
      <div className="fixed top-0 right-0 z-30 flex items-start">
        <div
          ref={(el) => {
            directTargetRefs.current[oppPlayerId] = el;
          }}
          className={`relative flex items-center ${
            attackStrike?.isDirectAttack && attackStrike.targetPlayer === oppPlayerId
              ? 'animate-hit-shake-delayed ring-4 ring-red-500 rounded-full'
              : state.pendingChain?.attackTargetInstanceId === 'DIRECT' &&
                state.currentTurnPlayer === myPlayerId
              ? 'ring-4 ring-red-500 rounded-full'
              : ''
          }`}
        >
          <div
            className="bg-gradient-to-r from-rose-950/95 via-red-800/95 to-rose-600/95 border-b-2 border-l-2 border-amber-300/80 pl-8 pr-16 py-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.85)]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 92% 100%, 14% 100%)' }}
          >
            <div className="text-[11px] font-extrabold text-rose-100 text-right leading-tight max-w-[175px] drop-shadow">
              {opp.name}
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-tight text-right drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {opp.lp}
            </div>
            {opp.attackLockedTurns > 0 && (
              <div className="text-[9px] text-sky-200 flex items-center justify-end gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Khóa công ({opp.attackLockedTurns})
              </div>
            )}
          </div>
          <img
            src={opp.avatar}
            alt={opp.name}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-300 shadow-2xl -ml-12 mt-0.5 bg-slate-950"
          />

          {lpPopup && lpPopup.player === oppPlayerId && (
            <div
              key={lpPopup.key}
              className={`absolute top-16 right-6 z-50 text-2xl sm:text-3xl font-mono font-black animate-lp-popup drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${
                lpPopup.delta < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {lpPopup.delta > 0 ? `+${lpPopup.delta}` : lpPopup.delta} LP
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. SÀN ĐẤU 2.5D LỚN HƠN + HIỆU ỨNG SÀN ĐẤU ĐỘNG */}
      {/* ================================================================= */}
      <div
        className={`relative z-10 w-full flex items-center justify-center px-2 sm:px-5 yugih5-perspective-wrapper ${
          attackStrike ? 'animate-board-impact' : ''
        }`}
      >
        <div className="yugih5-board-plane w-[96vw] max-w-[1250px] rounded-2xl px-4 sm:px-7 py-3.5 sm:py-4.5 relative">
          {/* Lớp hiệu ứng động bên trong sàn đấu (Hologram quét sáng + khí hậu Môi Trường + 4 góc phát sáng) */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden z-0">
            {/* Bầu khí quyển khi có lá bài Môi Trường (Yami / Mountain / Sogen) hoặc pha Chiến Đấu */}
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background:
                  activeFieldSpellId === 'yami'
                    ? 'radial-gradient(ellipse at center, rgba(126,34,206,0.22) 0%, transparent 72%)'
                    : activeFieldSpellId === 'mountain'
                    ? 'radial-gradient(ellipse at center, rgba(217,119,6,0.2) 0%, transparent 72%)'
                    : activeFieldSpellId === 'sogen'
                    ? 'radial-gradient(ellipse at center, rgba(16,185,129,0.18) 0%, transparent 72%)'
                    : state.phase === 'BATTLE'
                    ? 'radial-gradient(ellipse at center, rgba(220,38,38,0.16) 0%, transparent 72%)'
                    : 'radial-gradient(ellipse at center, rgba(56,189,248,0.08) 0%, transparent 72%)',
              }}
            />

            {/* Dải ánh sáng hologram quét chéo mặt bàn đấu */}
            <div className="absolute -inset-y-12 left-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-300/[0.08] to-transparent animate-board-holo-sweep" />

            {/* 4 Góc phát sáng nhẹ của sàn đấu */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-rose-500/20 to-transparent" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-400/20 to-transparent" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-sky-400/20 to-transparent" />
          </div>

          {/* Viền ánh sáng kim loại 4 góc bàn đấu */}
          <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-amber-300/25 z-0" />

          {/* ------------------------------------------------------- */}
          {/* NỬA TRÊN: SÂN CỦA ĐỐI PHƯƠNG */}
          {/* ------------------------------------------------------- */}
          <div className="relative z-10 flex items-center justify-between gap-2.5 sm:gap-4">
            {/* Cột Trái Đối Phương: Mộ Bài (Nhấp xem Mộ) + Ô Môi Trường (Cao 190px / 222px bằng khít Ô Quái Thú) */}
            <div className="w-[92px] sm:w-[112px] h-[190px] sm:h-[222px] flex flex-col justify-between shrink-0">
              {/* Mộ Bài Đối Phương - Nhấp để xem danh sách bài trong Mộ */}
              <div
                onClick={() =>
                  setViewingPile({
                    title: `Mộ Của ${opp.name} (${opp.graveyard.length} lá)`,
                    cards: opp.graveyard,
                  })
                }
                onMouseEnter={() => oppTopGyDef && handleHoverCard(oppTopGyDef.id, false)}
                onMouseLeave={() => handleHoverCard(undefined)}
                title={`Nhấp để xem Mộ của ${opp.name} (${opp.graveyard.length} lá)`}
                className="group relative w-full h-[118px] sm:h-[140px] flex items-center justify-center p-1 cursor-pointer transition-transform duration-150 hover:scale-[1.03]"
              >
                <ZoneFrameSVG
                  side="opp"
                  emblem={opp.graveyard.length > 0 ? 'none' : 'diamond'}
                  highlight={opp.graveyard.length > 0 ? 'red' : 'none'}
                />
                {opp.graveyard.length > 0 && oppTopGyDef ? (
                  <div
                    className={`pointer-events-none relative z-10 w-full h-full flex flex-col justify-between rounded-[4px] overflow-hidden border ${
                      oppTopGyDef.category === 'MONSTER'
                        ? 'border-amber-400/75'
                        : oppTopGyDef.category === 'SPELL'
                        ? 'border-emerald-400/75'
                        : 'border-purple-400/75'
                    }`}
                  >
                    <div className="bg-black/88 px-1 py-[2px] border-b border-white/10">
                      <FitCardTitle
                        text={getShortCardTitle(oppTopGyDef)}
                        baseFontSize={8}
                        minFontSize={5.5}
                        className="font-bold text-slate-100"
                      />
                    </div>
                    <div className="relative flex-1 overflow-hidden bg-slate-950">
                      <img
                        src={getCardArtUrl(oppTopGyDef)}
                        alt={getShortCardTitle(oppTopGyDef)}
                        className="w-full h-full object-cover brightness-75 saturate-85 group-hover:brightness-95 transition"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="px-2 py-0.5 rounded-md bg-slate-950/88 border border-rose-400/80 shadow-lg flex flex-col items-center leading-none">
                          <span className="text-[7.5px] font-black uppercase tracking-wider text-rose-300">
                            Mộ bài
                          </span>
                          <span className="text-base sm:text-lg font-mono font-black text-white">
                            {opp.graveyard.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/92 border-t border-white/15 text-[8px] font-mono font-bold text-center py-[2px]">
                      {oppTopGyDef.category === 'MONSTER' ? (
                        <span className="text-amber-300">
                          {oppTopGyDef.atk}/{oppTopGyDef.def}
                        </span>
                      ) : (
                        <span className={oppTopGyDef.category === 'SPELL' ? 'text-emerald-300' : 'text-purple-300'}>
                          {oppTopGyDef.category === 'SPELL' ? 'Bài Phép' : 'Bài Bẫy'}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-rose-200 transition-colors">
                      Mộ bài
                    </span>
                    <span className="text-sm font-mono font-black text-slate-500 mt-0.5">0</span>
                  </div>
                )}
              </div>

              {/* Ô Môi Trường Đối Phương */}
              <div
                onMouseEnter={() =>
                  opp.fieldZone &&
                  handleHoverCard(opp.fieldZone.cardId, opp.fieldZone.position === 'SET')
                }
                onMouseLeave={() => handleHoverCard(undefined)}
                className="relative w-full h-[64px] sm:h-[74px] flex items-center justify-center p-1 cursor-pointer"
                title="Ô Môi Trường đối phương"
              >
                <ZoneFrameSVG side="opp" isSquare emblem={opp.fieldZone ? 'none' : 'star'} />
                {opp.fieldZone ? (
                  <img
                    src={
                      opp.fieldZone.position === 'SET'
                        ? YUGIOH_CARD_BACK_SVG
                        : getCardArtUrl(getCardById(opp.fieldZone.cardId)!)
                    }
                    alt="Opp Field"
                    className={`pointer-events-none relative z-10 w-full h-full object-cover rounded-xs ${
                      opp.fieldZone.position === 'SET' ? 'brightness-50 saturate-50 opacity-80' : ''
                    } ${
                      isCardJustPlacedOnField(opp.fieldZone.instanceId) ? 'animate-place-opp' : ''
                    }`}
                  />
                ) : (
                  <span className="pointer-events-none relative z-10 text-[9px] font-bold text-slate-400/80 uppercase">
                    Môi trường
                  </span>
                )}
              </div>
            </div>

            {/* 5 Ô Quái Thú Dài Chuẩn Tỷ Lệ Lá Bài (152px x 222px ~ 1 : 1.46) */}
            <div className="flex-1 max-w-[810px] grid grid-cols-5 gap-2 sm:gap-3">
              {opp.monsterZones.map((m, idx) => {
                const isSecret = m?.position === 'SET_DEFENSE';
                const def = m ? getCardById(m.cardId) : undefined;
                const stats = m ? getEffectiveStats(state, m) : null;
                const isTargetableForAttack = Boolean(attackingMonsterId && m);
                const isStrikeAttacker = Boolean(m && attackStrike?.attackerInstanceId === m.instanceId);
                const isStrikeTarget = Boolean(m && attackStrike?.targetInstanceId === m.instanceId);
                const isPendingAttackStance = Boolean(
                  m &&
                    state.pendingChain?.triggerType === 'ON_OPPONENT_ATTACK' &&
                    state.pendingChain.attackerInstanceId === m.instanceId
                );
                const isPendingTargetMark = Boolean(
                  m &&
                    state.pendingChain?.triggerType === 'ON_OPPONENT_ATTACK' &&
                    state.pendingChain.attackTargetInstanceId === m.instanceId
                );
                const isCurrentlyAttacking = Boolean(
                  isPendingAttackStance || (!attackStrike && m && activeAttackerInstanceId === m.instanceId)
                );
                const justPlaced = Boolean(m && isCardJustPlacedOnField(m.instanceId));

                return (
                  <div
                    key={`opp-m-${idx}`}
                    ref={(el) => {
                      monsterSlotRefs.current[`opp-${idx}`] = el;
                    }}
                    onMouseEnter={() => m && handleHoverCard(m.cardId, isSecret)}
                    onMouseLeave={() => handleHoverCard(undefined)}
                    onClick={() => {
                      if (isTargetableForAttack && m && attackingMonsterId) {
                        onDispatchAction({
                          type: 'DECLARE_ATTACK',
                          playerId: myPlayerId,
                          attackerInstanceId: attackingMonsterId,
                          targetInstanceId: m.instanceId,
                        });
                        setAttackingMonsterId(null);
                      }
                    }}
                    className={`h-[190px] sm:h-[222px] relative flex flex-col items-center justify-center p-1.5 transition-colors duration-200 ${
                      isPendingAttackStance
                        ? 'translate-y-4 z-30'
                        : isStrikeTarget
                        ? 'animate-hit-shake-delayed z-30'
                        : isTargetableForAttack
                        ? 'cursor-pointer z-20 ring-2 ring-red-400/75 rounded-lg animate-pulse'
                        : ''
                    }`}
                  >
                    <ZoneFrameSVG
                      side="opp"
                      emblem={m ? 'none' : 'diamond'}
                      highlight={
                        isCurrentlyAttacking ||
                        isStrikeAttacker ||
                        isStrikeTarget ||
                        isPendingTargetMark ||
                        isTargetableForAttack
                          ? 'red'
                          : 'none'
                      }
                    />

                    {/* Vòng sóng chấn động khi đặt bài / triệu hồi xuống sân */}
                    {justPlaced && (
                      <div className="absolute inset-0 rounded-lg border-4 border-amber-300 animate-shockwave pointer-events-none z-30" />
                    )}

                    {isPendingAttackStance && (
                      <div className="pointer-events-none absolute -top-6 inset-x-0 z-40 bg-red-600 text-white text-[10px] font-black text-center py-0.5 rounded shadow-lg animate-bounce">
                        ⚔️ ĐANG TẤN CÔNG!
                      </div>
                    )}
                    {isPendingTargetMark && (
                      <div className="pointer-events-none absolute top-2 inset-x-2 z-40 bg-red-600/95 text-white text-[9px] font-black text-center py-0.5 rounded shadow-lg animate-pulse">
                        🎯 MỤC TIÊU TẤN CÔNG
                      </div>
                    )}

                    {m && def && stats && (
                      <div
                        className={`pointer-events-none relative z-10 w-full h-full flex items-center justify-center ${
                          isStrikeAttacker ? 'opacity-0' : ''
                        } ${justPlaced ? 'animate-place-opp' : ''}`}
                      >
                        {isSecret ? (
                          <div className="w-full h-full flex flex-col items-center justify-center relative">
                            <img
                              src={YUGIOH_CARD_BACK_SVG}
                              alt="Quái Úp"
                              className="w-24 sm:w-28 h-34 sm:h-38 object-contain rotate-90 scale-80 brightness-60 saturate-65 opacity-85 drop-shadow-xl"
                            />
                            <span className="absolute bottom-1 px-2 py-0.5 bg-black/90 border border-amber-500/50 rounded text-[9px] font-extrabold text-amber-300/90">
                              🂠 THẾ THỦ ÚP
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full relative">
                            <YugiH5HandCard
                              card={def}
                              size="field"
                              overrideAtk={stats.atk}
                              overrideDef={stats.def}
                              activeStat={m.position === 'ATTACK' ? 'ATK' : 'DEF'}
                              noHoverLift
                            />
                            {m.position === 'DEFENSE' && (
                              <div className="absolute top-6 inset-x-1 bg-sky-900/90 border border-sky-300 text-sky-100 text-[9px] font-black text-center py-0.5 rounded shadow z-20">
                                🛡️ THẾ PHÒNG THỦ
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cụm Phải Đối Phương: 6 Ô VUÔNG (5 Ô Phép/Bẫy + 1 Ô Mộ) xếp lưới 2x3 cao 190px / 222px bằng khít Ô Quái */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 shrink-0">
              {opp.spellTrapZones.map((st, idx) => {
                const isSecret = st?.position === 'SET';
                const def = st ? getCardById(st.cardId) : undefined;
                const justPlaced = Boolean(st && isCardJustPlacedOnField(st.instanceId));
                return (
                  <div
                    key={`opp-st-${idx}`}
                    onMouseEnter={() => st && handleHoverCard(st.cardId, isSecret)}
                    onMouseLeave={() => handleHoverCard(undefined)}
                    className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] aspect-square relative flex items-center justify-center p-1 cursor-pointer"
                  >
                    <ZoneFrameSVG
                      side="opp"
                      isSquare
                      emblem={st ? 'none' : 'diamond'}
                      highlight={justPlaced ? 'gold' : 'none'}
                    />
                    {justPlaced && (
                      <div className="absolute inset-0 rounded border-2 border-amber-300 animate-shockwave pointer-events-none z-30" />
                    )}
                    {st && def && (
                      <div
                        className={`pointer-events-none relative z-10 w-full h-full rounded-xs overflow-hidden border ${
                          isSecret
                            ? 'border-amber-500/40 brightness-55 saturate-60 opacity-80'
                            : def.category === 'SPELL'
                            ? 'border-emerald-400'
                            : 'border-purple-400'
                        } ${justPlaced ? 'animate-place-opp' : ''}`}
                      >
                        <img
                          src={isSecret ? YUGIOH_CARD_BACK_SVG : getCardArtUrl(def)}
                          alt="ST"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ô Bộ Bài Chính Đối Phương (Ô Vuông thứ 6 góc phải trên) */}
              <div
                className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] aspect-square relative flex items-center justify-center p-1.5"
                title={`Bộ bài chính của ${opp.name} (${opp.deck.length} lá)`}
              >
                <ZoneFrameSVG side="opp" isSquare emblem="none" />
                {opp.deck.length > 0 && (
                  <img
                    src={YUGIOH_CARD_BACK_SVG}
                    alt="Opponent Deck"
                    className="pointer-events-none relative z-10 w-8 sm:w-9 h-11 sm:h-13 object-cover rounded-xs opacity-90 shadow"
                  />
                )}
                <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center font-mono font-black text-sm text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  {opp.deck.length}
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* ĐƯỜNG PHÂN CÁCH GIỮA SÂN + 2 Ô "E X" SCI-FI PHÁT SÁNG */}
          {/* ------------------------------------------------------- */}
          <div className="relative z-10 py-1.5 flex items-center justify-center gap-6 sm:gap-14 my-0.5">
            {/* Đường chân trời năng lượng động đổi màu theo lượt & pha */}
            <div
              className={`pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent to-transparent ${
                state.phase === 'BATTLE'
                  ? 'via-red-400 shadow-[0_0_16px_rgba(248,113,113,0.95)]'
                  : isMyTurn
                  ? 'via-amber-400/85 shadow-[0_0_14px_rgba(251,191,36,0.85)]'
                  : 'via-indigo-400/80 shadow-[0_0_14px_rgba(129,140,248,0.85)]'
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-x-10 h-[4px] blur-[2px] bg-gradient-to-r from-transparent to-transparent animate-horizon-flow ${
                state.phase === 'BATTLE'
                  ? 'via-amber-300/85'
                  : isMyTurn
                  ? 'via-sky-300/75'
                  : 'via-fuchsia-400/75'
              }`}
            />

            {/* Ô E X Đỏ (Trái) */}
            <div className="relative z-10 w-28 sm:w-36 h-7.5 flex items-center justify-center">
              <div className="pointer-events-none absolute inset-0 bg-red-500/20 blur-md rounded-full animate-pulse" />
              <svg viewBox="0 0 160 36" className="absolute inset-0 w-full h-full">
                <polygon
                  points="14,2 146,2 158,34 2,34"
                  fill="rgba(127, 29, 29, 0.85)"
                  stroke="#f87171"
                  strokeWidth="2.2"
                />
                <polygon
                  points="18,6 142,6 151,30 9,30"
                  fill="none"
                  stroke="rgba(254, 202, 202, 0.45)"
                  strokeWidth="1"
                />
              </svg>
              <span className="relative z-10 font-mono font-black text-xs sm:text-sm tracking-[0.4em] text-red-100 drop-shadow-[0_0_8px_rgba(248,113,113,0.9)]">
                E X
              </span>
            </div>

            {/* Bảng Trạng Thái Lượt & Nút Chuyển Nhanh Phase Ở Giữa Sân */}
            <div className="relative z-10 flex items-center gap-1.5 bg-slate-950/95 border-2 border-amber-400/80 rounded-full px-3.5 py-0.5 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
              <span
                className={`text-[11px] sm:text-xs font-black uppercase tracking-wide ${
                  isMyTurn ? 'text-amber-300' : 'text-rose-400'
                }`}
              >
                {isMyTurn ? '⚡ LƯỢT BẠN' : `⏳ LƯỢT ${opp.name}`}
              </span>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    state.phase === 'MAIN1'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400'
                  }`}
                >
                  Main 1
                </span>
                <button
                  disabled={!isMyTurn || state.phase !== 'MAIN1' || state.turnNumber === 1}
                  onClick={() =>
                    onDispatchAction({
                      type: 'CHANGE_PHASE',
                      playerId: myPlayerId,
                      nextPhase: 'BATTLE',
                    })
                  }
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                    state.phase === 'BATTLE'
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                      : isMyTurn && state.phase === 'MAIN1' && state.turnNumber > 1
                      ? 'bg-red-950/80 hover:bg-red-700 text-red-200 border border-red-400/60 cursor-pointer'
                      : 'text-slate-500 cursor-default'
                  }`}
                >
                  ⚔️ Chiến Đấu
                </button>
                <button
                  disabled={!isMyTurn || state.phase !== 'BATTLE'}
                  onClick={() =>
                    onDispatchAction({
                      type: 'CHANGE_PHASE',
                      playerId: myPlayerId,
                      nextPhase: 'MAIN2',
                    })
                  }
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                    state.phase === 'MAIN2'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : isMyTurn && state.phase === 'BATTLE'
                      ? 'bg-sky-950/80 hover:bg-sky-700 text-sky-200 border border-sky-400/60 cursor-pointer'
                      : 'text-slate-500 cursor-default'
                  }`}
                >
                  Main 2
                </button>
              </div>
            </div>

            {/* Ô E X Xanh (Phải) */}
            <div className="relative z-10 w-28 sm:w-36 h-7.5 flex items-center justify-center">
              <div className="pointer-events-none absolute inset-0 bg-sky-500/20 blur-md rounded-full animate-pulse" />
              <svg viewBox="0 0 160 36" className="absolute inset-0 w-full h-full">
                <polygon
                  points="14,2 146,2 158,34 2,34"
                  fill="rgba(12, 74, 110, 0.85)"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                />
                <polygon
                  points="18,6 142,6 151,30 9,30"
                  fill="none"
                  stroke="rgba(186, 230, 253, 0.45)"
                  strokeWidth="1"
                />
              </svg>
              <span className="relative z-10 font-mono font-black text-xs sm:text-sm tracking-[0.4em] text-sky-100 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]">
                E X
              </span>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* NỬA DƯỚI: SÂN CỦA BẠN (Ô QUÁI DÀI CHUẨN TỶ LỆ LÁ BÀI + BÀI ÚP TỐI MỜ HƠN) */}
          {/* ------------------------------------------------------- */}
          <div className="relative z-10 flex items-center justify-between gap-2.5 sm:gap-4">
            {/* Cột Trái Của Bạn: Ô Môi Trường + Mộ Bài Của Bạn (Nhấp xem Mộ, cao 190px / 222px bằng khít Ô Quái) */}
            <div className="w-[92px] sm:w-[112px] h-[190px] sm:h-[222px] flex flex-col justify-between shrink-0">
              {/* Ô Môi Trường Của Bạn */}
              <div
                onMouseEnter={() => me.fieldZone && handleHoverCard(me.fieldZone.cardId, false)}
                onMouseLeave={() => handleHoverCard(undefined)}
                className="relative w-full h-[64px] sm:h-[74px] flex items-center justify-center p-1 cursor-pointer"
                title="Ô Môi Trường (Field Zone)"
              >
                <ZoneFrameSVG side="self" isSquare emblem={me.fieldZone ? 'none' : 'star'} />
                {me.fieldZone ? (
                  <img
                    src={getCardArtUrl(getCardById(me.fieldZone.cardId)!)}
                    alt="My Field"
                    className={`pointer-events-none relative z-10 w-full h-full object-cover rounded-xs ${
                      me.fieldZone.position === 'SET' ? 'brightness-45 saturate-60 opacity-80' : ''
                    } ${
                      isCardJustPlacedOnField(me.fieldZone.instanceId) ? 'animate-place-self' : ''
                    }`}
                  />
                ) : (
                  <span className="pointer-events-none relative z-10 text-[9px] font-bold text-amber-200/75 uppercase">
                    Môi trường
                  </span>
                )}
              </div>

              {/* Mộ Bài Của Bạn - Nhấp để xem các lá đã vào Mộ */}
              <div
                onClick={() =>
                  setViewingPile({
                    title: `Mộ Của Bạn (${me.graveyard.length} lá)`,
                    cards: me.graveyard,
                  })
                }
                onMouseEnter={() => meTopGyDef && handleHoverCard(meTopGyDef.id, false)}
                onMouseLeave={() => handleHoverCard(undefined)}
                title={`Nhấp để xem Mộ bài của bạn (${me.graveyard.length} lá)`}
                className="group relative w-full h-[118px] sm:h-[140px] p-1 flex items-center justify-center shadow-2xl cursor-pointer transition-transform duration-150 hover:scale-[1.03]"
              >
                <ZoneFrameSVG
                  side="self"
                  emblem={me.graveyard.length > 0 ? 'none' : 'diamond'}
                  highlight={me.graveyard.length > 0 ? 'gold' : 'none'}
                />
                {me.graveyard.length > 0 && meTopGyDef ? (
                  <div
                    className={`pointer-events-none relative z-10 w-full h-full flex flex-col justify-between rounded-[4px] overflow-hidden border ${
                      meTopGyDef.category === 'MONSTER'
                        ? 'border-amber-400/80'
                        : meTopGyDef.category === 'SPELL'
                        ? 'border-emerald-400/80'
                        : 'border-purple-400/80'
                    }`}
                  >
                    <div className="bg-black/88 px-1 py-[2px] border-b border-white/10">
                      <FitCardTitle
                        text={getShortCardTitle(meTopGyDef)}
                        baseFontSize={8}
                        minFontSize={5.5}
                        className="font-bold text-amber-100"
                      />
                    </div>
                    <div className="relative flex-1 overflow-hidden bg-slate-950">
                      <img
                        src={getCardArtUrl(meTopGyDef)}
                        alt={getShortCardTitle(meTopGyDef)}
                        className="w-full h-full object-cover brightness-80 saturate-90 group-hover:brightness-100 transition"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="px-2.5 py-0.5 rounded-md bg-slate-950/88 border border-amber-400/85 shadow-lg flex flex-col items-center leading-none">
                          <span className="text-[7.5px] font-black uppercase tracking-wider text-amber-300">
                            Mộ bài
                          </span>
                          <span className="text-base sm:text-lg font-mono font-black text-white">
                            {me.graveyard.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/92 border-t border-white/15 text-[8px] font-mono font-bold text-center py-[2px]">
                      {meTopGyDef.category === 'MONSTER' ? (
                        <span className="text-amber-300">
                          {meTopGyDef.atk}/{meTopGyDef.def}
                        </span>
                      ) : (
                        <span className={meTopGyDef.category === 'SPELL' ? 'text-emerald-300' : 'text-purple-300'}>
                          {meTopGyDef.category === 'SPELL' ? 'Bài Phép' : 'Bài Bẫy'}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center text-center">
                    <span className="text-[9.5px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-amber-200/80 group-hover:text-amber-200 transition-colors">
                      Mộ bài
                    </span>
                    <span className="text-sm font-mono font-black text-amber-300/70 mt-0.5">
                      0
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 5 Ô Quái Thú Dài Chuẩn Tỷ Lệ Lá Bài Của Bạn (152px x 222px) */}
            <div className="flex-1 max-w-[810px] grid grid-cols-5 gap-2 sm:gap-3">
              {me.monsterZones.map((m, idx) => {
                const def = m ? getCardById(m.cardId) : undefined;
                const stats = m ? getEffectiveStats(state, m) : null;
                const isSelected = selectedFieldInstanceId === m?.instanceId;
                const isTributeCandidate = Boolean(pendingTributeSummon && m);
                const isTributeChosen = Boolean(
                  m && pendingTributeSummon?.selectedTributeIds.includes(m.instanceId)
                );

                const isStrikeAttacker = Boolean(m && attackStrike?.attackerInstanceId === m.instanceId);
                const isStrikeTarget = Boolean(m && attackStrike?.targetInstanceId === m.instanceId);
                const isPendingAttackStance = Boolean(
                  m &&
                    state.pendingChain?.triggerType === 'ON_OPPONENT_ATTACK' &&
                    state.pendingChain.attackerInstanceId === m.instanceId
                );
                const isPendingTargetMark = Boolean(
                  m &&
                    state.pendingChain?.triggerType === 'ON_OPPONENT_ATTACK' &&
                    state.pendingChain.attackTargetInstanceId === m.instanceId
                );
                const isCurrentlyAttacking = Boolean(
                  isPendingAttackStance || (!attackStrike && m && activeAttackerInstanceId === m.instanceId)
                );
                const justPlaced = Boolean(m && isCardJustPlacedOnField(m.instanceId));

                const canAttackNow =
                  isMyTurn &&
                  state.phase === 'BATTLE' &&
                  state.turnNumber > 1 &&
                  me.attackLockedTurns === 0 &&
                  m?.position === 'ATTACK' &&
                  m.attacksDeclaredThisTurn === 0;

                const canChangePosNow =
                  isMyTurn &&
                  (state.phase === 'MAIN1' || state.phase === 'MAIN2') &&
                  m &&
                  m.summonedTurn < state.turnNumber &&
                  !m.changedPositionThisTurn &&
                  m.attacksDeclaredThisTurn === 0;

                const isFaceDownSetMonster = m?.position === 'SET_DEFENSE';
                const hasAlreadyAttackedInBattle =
                  !isStrikeAttacker &&
                  state.phase === 'BATTLE' &&
                  m?.position === 'ATTACK' &&
                  (m?.attacksDeclaredThisTurn ?? 0) > 0;

                return (
                  <div
                    key={`me-m-${idx}`}
                    ref={(el) => {
                      monsterSlotRefs.current[`self-${idx}`] = el;
                    }}
                    onMouseEnter={() => m && handleHoverCard(m.cardId, false)}
                    onMouseLeave={() => handleHoverCard(undefined)}
                    onClick={() => {
                      if (!m || !def) return;

                      if (pendingTributeSummon) {
                        const already = pendingTributeSummon.selectedTributeIds.includes(
                          m.instanceId
                        );
                        const nextList = already
                          ? pendingTributeSummon.selectedTributeIds.filter(
                              (id) => id !== m.instanceId
                            )
                          : [...pendingTributeSummon.selectedTributeIds, m.instanceId];

                        if (nextList.length === pendingTributeSummon.requiredCount) {
                          onDispatchAction({
                            type: 'NORMAL_SUMMON',
                            playerId: myPlayerId,
                            handInstanceId: pendingTributeSummon.handInstanceId,
                            position: pendingTributeSummon.position,
                            tributeInstanceIds: nextList,
                          });
                          setPendingTributeSummon(null);
                        } else {
                          setPendingTributeSummon({
                            ...pendingTributeSummon,
                            selectedTributeIds: nextList,
                          });
                        }
                        return;
                      }

                      setSelectedFieldInstanceId(isSelected ? null : m.instanceId);
                      setSelectedHandInstanceId(null);
                    }}
                    className={`h-[190px] sm:h-[222px] relative flex flex-col items-center justify-center p-1.5 transition-colors duration-200 cursor-pointer ${
                      isPendingAttackStance
                        ? '-translate-y-4 z-30'
                        : isStrikeTarget
                        ? 'animate-hit-shake-delayed z-30'
                        : isTributeChosen
                        ? 'z-20'
                        : ''
                    }`}
                  >
                    <ZoneFrameSVG
                      side="self"
                      emblem={m ? 'none' : 'diamond'}
                      highlight={
                        isCurrentlyAttacking ||
                        isStrikeAttacker ||
                        isStrikeTarget ||
                        isPendingTargetMark
                          ? 'red'
                          : isTributeChosen || isTributeCandidate || canAttackNow || isSelected
                          ? 'gold'
                          : 'none'
                      }
                    />

                    {/* Vòng sóng chấn động khi đặt bài / triệu hồi xuống sân */}
                    {justPlaced && (
                      <div className="absolute inset-0 rounded-lg border-4 border-yellow-300 animate-shockwave pointer-events-none z-30" />
                    )}

                    {isPendingAttackStance && (
                      <div className="pointer-events-none absolute -top-6 inset-x-0 z-40 bg-red-600 text-white text-[10px] font-black text-center py-0.5 rounded shadow-lg animate-bounce">
                        ⚔️ TẤN CÔNG!
                      </div>
                    )}
                    {isPendingTargetMark && (
                      <div className="pointer-events-none absolute top-2 inset-x-2 z-40 bg-red-600/95 text-white text-[9px] font-black text-center py-0.5 rounded shadow-lg animate-pulse">
                        🎯 MỤC TIÊU BỊ ĐÁNH!
                      </div>
                    )}

                    {m && def && stats && (
                      <div
                        className={`relative z-10 w-full h-full ${
                          isStrikeAttacker ? 'opacity-0' : ''
                        } ${justPlaced ? 'animate-place-self' : ''}`}
                      >
                        {/* Quái thú đang ÚP THỦ hoặc đã đánh xong sẽ tối mờ hơn để phân biệt rõ */}
                        <div
                          className={`pointer-events-none w-full h-full transition-opacity ${
                            isFaceDownSetMonster
                              ? 'brightness-[0.46] saturate-[0.65] opacity-85'
                              : hasAlreadyAttackedInBattle
                              ? 'brightness-65 opacity-85'
                              : ''
                          }`}
                        >
                          <YugiH5HandCard
                            card={def}
                            size="field"
                            overrideAtk={stats.atk}
                            overrideDef={stats.def}
                            activeStat={m.position === 'ATTACK' ? 'ATK' : 'DEF'}
                            isPlayable={canAttackNow}
                            isSelected={isSelected}
                            noHoverLift
                          />
                        </div>

                        {isFaceDownSetMonster && (
                          <div className="pointer-events-none absolute top-9 inset-x-1 bg-slate-950/90 border border-amber-400/70 text-amber-300 text-[9px] font-black text-center py-0.5 rounded shadow-lg z-20">
                            🂠 ĐANG ÚP THỦ
                          </div>
                        )}
                        {m.position === 'DEFENSE' && (
                          <div className="pointer-events-none absolute top-9 inset-x-1 bg-sky-900/90 border border-sky-300 text-sky-100 text-[9px] font-black text-center py-0.5 rounded shadow z-20">
                            🛡️ THẾ PHÒNG THỦ
                          </div>
                        )}

                        {isSelected &&
                          !pendingTributeSummon &&
                          (canAttackNow || canChangePosNow) && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-x-1 top-1/2 -translate-y-1/2 z-40 bg-slate-950/95 border-2 border-amber-400 rounded-lg p-1.5 shadow-2xl flex flex-col gap-1"
                            >
                              {canAttackNow && (
                                <button
                                  onClick={() => handleStartAttack(m)}
                                  className="w-full py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer shadow"
                                >
                                  <Swords className="w-3.5 h-3.5" /> Tấn Công
                                </button>
                              )}
                              {canChangePosNow && (
                                <button
                                  onClick={() => {
                                    onDispatchAction({
                                      type: 'CHANGE_POSITION',
                                      playerId: myPlayerId,
                                      fieldInstanceId: m.instanceId,
                                    });
                                    setSelectedFieldInstanceId(null);
                                  }}
                                  className="w-full py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  {m.position === 'SET_DEFENSE'
                                    ? '✨ Lật Ngửa'
                                    : m.position === 'ATTACK'
                                    ? '🛡️ Sang Thủ'
                                    : '⚔️ Sang Công'}
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cụm Phải Của Bạn: 6 Ô VUÔNG CHUẨN YUGIH5 (Không còn scale khi hover nên hết sạch lỗi nháy!) */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 shrink-0">
              {me.spellTrapZones.map((st, idx) => {
                const def = st ? getCardById(st.cardId) : undefined;
                const isSelected = selectedFieldInstanceId === st?.instanceId;
                const justPlaced = Boolean(st && isCardJustPlacedOnField(st.instanceId));
                const isSetST = st?.position === 'SET';
                const canActivateFieldST = Boolean(
                  st &&
                    def &&
                    isSetST &&
                    canActivateSpellOrTrapNow(state, myPlayerId, def.id, 'FIELD', st)
                );

                return (
                  <div
                    key={`me-st-${idx}`}
                    onMouseEnter={() => st && handleHoverCard(st.cardId, false)}
                    onMouseLeave={() => handleHoverCard(undefined)}
                    onClick={() => {
                      if (!st || !def) return;
                      setSelectedFieldInstanceId(isSelected ? null : st.instanceId);
                      setSelectedHandInstanceId(null);
                    }}
                    className={`w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] aspect-square relative flex items-center justify-center p-1 cursor-pointer ${
                      canActivateFieldST ? 'yugih5-card-glow' : ''
                    }`}
                  >
                    <ZoneFrameSVG
                      side="self"
                      isSquare
                      emblem={st ? 'none' : 'diamond'}
                      highlight={canActivateFieldST || isSelected ? 'gold' : 'none'}
                    />

                    {justPlaced && (
                      <div className="absolute inset-0 rounded border-2 border-yellow-300 animate-shockwave pointer-events-none z-30" />
                    )}

                    {st && def && (
                      <div
                        className={`pointer-events-none relative z-10 w-full h-full rounded-xs overflow-hidden border-2 ${
                          isSetST
                            ? canActivateFieldST
                              ? 'border-amber-400'
                              : 'border-slate-600/80'
                            : def.category === 'SPELL'
                            ? 'border-emerald-400'
                            : 'border-purple-400'
                        } ${justPlaced ? 'animate-place-self' : ''}`}
                      >
                        {/* Nếu bài Phép/Bẫy đang ÚP (chưa sử dụng) thì tối mờ rõ rệt hơn bài đã lật ngửa */}
                        <img
                          src={getCardArtUrl(def)}
                          alt={def.nameVi}
                          className={`w-full h-full object-cover ${
                            isSetST
                              ? canActivateFieldST
                                ? 'brightness-[0.52] saturate-[0.75]'
                                : 'brightness-[0.38] saturate-[0.5] opacity-80'
                              : 'brightness-105'
                          }`}
                        />

                        {isSetST && (
                          <div className="absolute inset-0 bg-slate-950/35 pointer-events-none" />
                        )}

                        {/* Nhãn góc gọn đẹp cho ô vuông Phép/Bẫy */}
                        <div
                          className={`absolute bottom-0 inset-x-0 text-[7.5px] font-black text-center leading-tight py-[1px] ${
                            isSetST
                              ? canActivateFieldST
                                ? 'bg-amber-950/95 text-amber-300'
                                : 'bg-black/90 text-slate-400'
                              : def.category === 'SPELL'
                              ? 'bg-emerald-950/90 text-emerald-200'
                              : 'bg-purple-950/90 text-purple-200'
                          }`}
                        >
                          {isSetST
                            ? canActivateFieldST
                              ? '⚡ SẴN SÀNG'
                              : '🂠 ĐANG ÚP'
                            : def.category === 'SPELL'
                            ? 'PHÉP'
                            : 'BẪY'}
                        </div>
                      </div>
                    )}

                    {/* Nút Kích Hoạt nổi phía trên ô vuông khi bấm chọn */}
                    {st && def && isSelected && canActivateFieldST && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-amber-400 rounded-lg p-1 shadow-2xl whitespace-nowrap"
                      >
                        <button
                          onClick={() =>
                            handleInitiateActivateSpellTrap(st.instanceId, def.id, 'FIELD')
                          }
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-[10px] font-black rounded cursor-pointer shadow"
                        >
                          ✨ Kích Hoạt
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ô Bộ Bài Chính Của Bạn (Ô Vuông thứ 6 góc phải dưới) */}
              <div
                className="w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] aspect-square relative flex items-center justify-center p-1.5"
                title={`Bộ bài chính của bạn (${me.deck.length} lá)`}
              >
                <ZoneFrameSVG side="self" isSquare emblem="none" />
                {me.deck.length > 0 && (
                  <img
                    src={YUGIOH_CARD_BACK_SVG}
                    alt="My Deck"
                    className="pointer-events-none relative z-10 w-8 sm:w-9 h-11 sm:h-13 object-cover rounded-xs opacity-90 shadow"
                  />
                )}
                <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center font-mono font-black text-sm text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  {me.deck.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo nổi khi đang chọn quái Hiến Tế hoặc chọn mục tiêu Tấn Công */}
      {pendingTributeSummon && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-40 bg-amber-950/95 border-2 border-amber-400 rounded-full px-5 py-2 flex items-center gap-4 shadow-2xl">
          <span className="text-xs sm:text-sm font-bold text-amber-200">
            🔥 Chọn {pendingTributeSummon.requiredCount} quái trên sân bạn để Hiến Tế (
            {pendingTributeSummon.selectedTributeIds.length}/{pendingTributeSummon.requiredCount})
          </span>
          <button
            onClick={() => setPendingTributeSummon(null)}
            className="px-3 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-full text-xs text-slate-200 cursor-pointer"
          >
            Hủy
          </button>
        </div>
      )}

      {attackingMonsterId && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-40 bg-red-950/95 border-2 border-red-400 rounded-full px-5 py-2 flex items-center gap-4 shadow-2xl">
          <span className="text-xs sm:text-sm font-bold text-red-200">
            ⚔️ Bấm vào 1 quái thú trên sân của {opp.name} để Tấn Công!
          </span>
          <button
            onClick={() => setAttackingMonsterId(null)}
            className="px-3 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-full text-xs text-slate-200 cursor-pointer"
          >
            Hủy
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. ĐÁY MÀN HÌNH: HUD BẠN (TRÁI) + BÀI TRÊN TAY (GIỮA) + KẾT THÚC (PHẢI) */}
      {/* ================================================================= */}

      {/* Góc Trái Dưới: Nút Lục Giác Extra Deck + HUD Người Chơi Vát Góc Sci-Fi */}
      <div className="fixed bottom-0 left-0 z-30 flex flex-col items-start">
        <div className="ml-18 mb-1">
          <HexIconButton
            onClick={() =>
              setViewingPile({
                title: `Extra Deck Dung Hợp (${me.extraDeck.length} lá)`,
                cards: me.extraDeck,
              })
            }
            title="Xem Extra Deck (Quái Dung Hợp)"
            label="Dung hợp"
            variant="cyan"
          >
            <Layers className="w-4 h-4" />
          </HexIconButton>
        </div>

        <div
          ref={(el) => {
            directTargetRefs.current[myPlayerId] = el;
          }}
          className={`relative flex items-end ${
            attackStrike?.isDirectAttack && attackStrike.targetPlayer === myPlayerId
              ? 'animate-hit-shake-delayed ring-4 ring-red-500 rounded-full'
              : state.pendingChain?.attackTargetInstanceId === 'DIRECT' &&
                state.currentTurnPlayer === oppPlayerId
              ? 'ring-4 ring-red-500 rounded-full'
              : ''
          }`}
        >
          <img
            src={me.avatar}
            alt={me.name}
            className="w-15 h-15 sm:w-17 sm:h-17 rounded-full object-cover border-3 border-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.6)] z-10 ml-1.5 mb-1 bg-slate-950"
          />
          <div
            className="bg-gradient-to-r from-sky-600/95 via-blue-800/95 to-indigo-950/95 border-t-2 border-r-2 border-sky-300 pl-13 pr-10 py-1.5 -ml-10 shadow-2xl"
            style={{ clipPath: 'polygon(0 0, 88% 0, 100% 100%, 0 100%)' }}
          >
            <div className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-tight leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              {me.lp}
            </div>
            <div className="text-xs font-extrabold text-white mt-0.5 leading-tight max-w-[165px]">
              {me.name}
            </div>
          </div>

          {lpPopup && lpPopup.player === myPlayerId && (
            <div
              key={lpPopup.key}
              className={`absolute -top-10 left-16 z-50 text-2xl sm:text-3xl font-mono font-black animate-lp-popup drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${
                lpPopup.delta < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {lpPopup.delta > 0 ? `+${lpPopup.delta}` : lpPopup.delta} LP
            </div>
          )}
        </div>
      </div>

      {/* Chính Giữa Đáy Màn Hình: Hàng Bài Trên Tay (Lá mới rút xuất hiện kế bên bài trên tay) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 flex items-end justify-center pb-0.5 max-w-[74vw]">
        <div
          className={`flex items-end justify-center -space-x-1.5 sm:space-x-1.5 pt-14 pl-3 pr-6 ${
            me.hand.length <= 7 ? 'overflow-visible' : 'overflow-x-auto'
          }`}
        >
          {me.hand.map((h) => {
            const def = getCardById(h.cardId);
            if (!def) return null;
            const isSelected = selectedHandInstanceId === h.instanceId;
            const drawOrder = newlyDrawnCards[h.instanceId];
            const isJustDrawn = drawOrder !== undefined;
            const canSummon = canSummonHandMonster(h);
            const canSpecialSummonHand = canSpecialSummonFromHand(state, myPlayerId, h.instanceId);
            const canActivateSpell =
              def.category === 'SPELL' &&
              canActivateSpellOrTrapNow(state, myPlayerId, def.id, 'HAND', undefined, h.instanceId);
            const canSetST =
              isMyTurn &&
              (state.phase === 'MAIN1' || state.phase === 'MAIN2') &&
              (def.category === 'SPELL' || def.category === 'TRAP') &&
              (def.subType === 'FIELD' || me.spellTrapZones.some((z) => z === null));

            const isPlayableGlow = canSummon || canSpecialSummonHand || canActivateSpell || canSetST;
            const reqTrib = def.category === 'MONSTER' ? getRequiredTributes(def) : 0;

            return (
              <div
                key={h.instanceId}
                style={isJustDrawn ? { animationDelay: `${drawOrder * 110}ms` } : undefined}
                className={`relative ${isJustDrawn ? 'animate-hand-draw-self' : ''}`}
              >
                {isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-amber-400 rounded-lg p-1 shadow-2xl flex items-center gap-1 whitespace-nowrap"
                  >
                    {canSummon && (
                      <>
                        <button
                          onClick={() => handleStartSummonFromHand(h, 'ATTACK')}
                          className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          {reqTrib > 0 ? `Hiến Tế (${reqTrib})` : 'Triệu Hồi'}
                        </button>
                        <button
                          onClick={() => handleStartSummonFromHand(h, 'SET_DEFENSE')}
                          className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow"
                        >
                          <Shield className="w-3.5 h-3.5" /> Úp Thủ
                        </button>
                      </>
                    )}

                    {canSpecialSummonHand && (
                      <button
                        onClick={() => {
                          const reqDiscard = def.specialSummonHand?.discardHandCount ?? 0;
                          if (reqDiscard > 0) {
                            setPendingHandDiscardSummon({
                              handInstanceId: h.instanceId,
                              cardDef: def,
                              requiredCount: reqDiscard,
                              selectedDiscardIds: [],
                            });
                          } else {
                            onDispatchAction({
                              type: 'SPECIAL_SUMMON_FROM_HAND',
                              playerId: myPlayerId,
                              handInstanceId: h.instanceId,
                            });
                          }
                          setSelectedHandInstanceId(null);
                        }}
                        title={def.specialSummonHand?.labelVi ?? 'Triệu hồi Đặc biệt từ tay'}
                        className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 rounded text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Triệu Hồi ĐB
                      </button>
                    )}

                    {canActivateSpell && (
                      <button
                        onClick={() =>
                          handleInitiateActivateSpellTrap(h.instanceId, def.id, 'HAND')
                        }
                        className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Kích Hoạt
                      </button>
                    )}

                    {canSetST && (
                      <button
                        onClick={() => {
                          onDispatchAction({
                            type: 'SET_SPELL_TRAP',
                            playerId: myPlayerId,
                            handInstanceId: h.instanceId,
                          });
                          setSelectedHandInstanceId(null);
                        }}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold cursor-pointer shadow"
                      >
                        🂠 Úp Bài
                      </button>
                    )}
                  </div>
                )}

                <YugiH5HandCard
                  card={def}
                  isPlayable={isPlayableGlow}
                  isSelected={isSelected}
                  onMouseEnter={() => setHoveredCard(def)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => {
                    setSelectedHandInstanceId(isSelected ? null : h.instanceId);
                    setSelectedFieldInstanceId(null);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Góc Phải Dưới: Nút Đa Giác Pha Lê SVG "Kết thúc / Chiến đấu" + Các Nút Lục Giác Đáy */}
      <div className="fixed bottom-2 right-3 z-30 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2.5">
          {isMyTurn && state.phase === 'MAIN1' && hasReadyAttacker && (
            <button
              onClick={() =>
                onDispatchAction({
                  type: 'CHANGE_PHASE',
                  playerId: myPlayerId,
                  nextPhase: 'BATTLE',
                })
              }
              className="group relative px-4 py-2.5 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <svg viewBox="0 0 150 56" className="absolute inset-0 w-full h-full drop-shadow-[0_0_15px_rgba(239,68,68,0.65)]">
                <polygon
                  points="14,3 145,3 136,53 5,53"
                  fill="url(#battle-grad)"
                  stroke="#fde047"
                  strokeWidth="3"
                />
                <defs>
                  <linearGradient id="battle-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="relative z-10 text-xs sm:text-sm font-black text-white flex items-center gap-1.5 drop-shadow">
                <Swords className="w-4 h-4 text-amber-300" /> Chiến Đấu
              </span>
            </button>
          )}

          {/* Nút Đa Giác Pha Lê "Kết thúc" Chuẩn YugiH5 (Vẽ bằng SVG nên viền sắc nét 100% quanh 6 cạnh) */}
          <div className="relative">
            <button
              disabled={!isMyTurn || Boolean(state.pendingChain) || Boolean(state.pendingSelection)}
              onClick={() =>
                onDispatchAction({
                  type: 'CHANGE_PHASE',
                  playerId: myPlayerId,
                  nextPhase: 'END',
                })
              }
              className={`group relative w-28 sm:w-32 h-22 sm:h-25 flex flex-col items-center justify-center transition-transform duration-150 ${
                isMyTurn
                  ? 'cursor-pointer hover:scale-105 active:scale-95'
                  : 'cursor-not-allowed opacity-70'
              }`}
            >
              <svg
                viewBox="0 0 140 112"
                className="absolute inset-0 w-full h-full drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]"
              >
                <defs>
                  <linearGradient id="endPolyGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={isMyTurn ? '#1e293b' : '#0f172a'} />
                    <stop offset="100%" stopColor="#090d16" />
                  </linearGradient>
                </defs>
                {/* Khung đa giác bất đối xứng chuẩn YugiH5 */}
                <polygon
                  points="24,4 122,12 136,68 104,108 12,96 4,38"
                  fill="url(#endPolyGrad)"
                  stroke={isMyTurn ? '#f8fafc' : '#475569'}
                  strokeWidth="3.2"
                />
                {/* Viền phụ bên trong */}
                <polygon
                  points="28,11 116,18 128,66 100,100 18,90 11,40"
                  fill="none"
                  stroke={isMyTurn ? '#38bdf8' : '#334155'}
                  strokeWidth="1.2"
                  opacity="0.75"
                />
                {/* Vòng cung trang trí bên trong */}
                <circle
                  cx="70"
                  cy="54"
                  r="34"
                  fill="none"
                  stroke={isMyTurn ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}
                  strokeWidth="1.5"
                  strokeDasharray="8 5"
                />
              </svg>

              <span
                className={`relative z-10 text-xs sm:text-sm font-extrabold tracking-tight drop-shadow ${
                  isMyTurn ? 'text-white group-hover:text-amber-300' : 'text-slate-400'
                }`}
              >
                {isMyTurn ? 'Kết thúc' : 'Đợi đối thủ'}
              </span>
              <span className="relative z-10 text-[9px] font-bold text-sky-300/80">
                {state.phase}
              </span>
            </button>

            {/* Vòng tròn hiển thị Số Lượt gắn trên cạnh phải dưới của đa giác giống hệt YugiH5 */}
            <div className="pointer-events-none absolute bottom-1.5 right-2.5 w-8 h-8 rounded-full bg-slate-950 border-2 border-white shadow-[0_0_10px_rgba(56,189,248,0.8)] flex items-center justify-center text-xs font-mono font-black text-amber-300">
              {state.turnNumber}
            </div>
          </div>
        </div>

        {/* Cụm 3 nút Lục Giác & Đếm Deck ở đáy phải */}
        <div className="flex items-center gap-1.5">
          <HexIconButton
            size="sm"
            variant="cyan"
            onClick={() =>
              setViewingPile({
                title: `Mộ Của Bạn (${me.graveyard.length} lá)`,
                cards: me.graveyard,
              })
            }
            title="Xem Mộ của bạn"
          >
            <Skull className="w-4 h-4" />
          </HexIconButton>

          <HexIconButton
            size="sm"
            variant="cyan"
            active={showLogDrawer}
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            title="Xem Nhật ký trận đấu"
          >
            <Sparkles className="w-4 h-4" />
          </HexIconButton>

          <div className="px-3 py-1.5 bg-slate-950/95 border-2 border-amber-400/60 rounded-lg flex items-center gap-2 shadow-xl">
            <img src={YUGIOH_CARD_BACK_SVG} alt="Deck" className="w-4 h-5.5 rounded-xs" />
            <span className="font-mono font-black text-sm text-white">{me.deck.length}</span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DRAWER NHẬT KÝ TRẬN ĐẤU */}
      {/* ================================================================= */}
      {showLogDrawer && (
        <div className="fixed top-14 left-18 z-40 w-80 max-h-[75vh] bg-slate-900/95 border-2 border-amber-400/70 rounded-xl p-3 shadow-2xl flex flex-col justify-between text-slate-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-xs font-extrabold text-amber-300 uppercase">
              Nhật Ký Trận Đấu (Duel Log)
            </span>
            <button
              onClick={() => setShowLogDrawer(false)}
              className="p-1 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 max-h-60 overflow-y-auto space-y-1 text-[11px]">
            {[...state.logs].reverse().map((line, i) => (
              <div
                key={i}
                className={i === 0 ? 'text-amber-300 font-semibold' : 'text-slate-400'}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CỬA SỔ TỰ ĐỘNG HỎI KÍCH HOẠT BẪY / HANDTRAP (LIVE CHAIN STACK) */}
      {/* ==================================================================== */}
      {state.pendingChain && state.pendingChain.responder === myPlayerId && (() => {
        const chain = state.pendingChain;
        const currentLinks = chain.chainLinks ?? [];
        const nextLinkNum = currentLinks.length + 1;
        const respOptions: ChainResponseOption[] =
          chain.availableResponses && chain.availableResponses.length > 0
            ? chain.availableResponses
            : chain.availableTrapInstanceIds.map((id) => {
                const handCard = me.hand.find((h) => h.instanceId === id);
                const fieldCard = me.spellTrapZones.find((s) => s?.instanceId === id);
                return {
                  instanceId: id,
                  cardId: handCard?.cardId ?? fieldCard?.cardId ?? '',
                  fromLocation: handCard ? 'HAND' : 'FIELD',
                };
              });

        const pickerItems: ShowcasePickerItem[] = respOptions
          .map((opt): ShowcasePickerItem | null => {
            const def = getCardById(opt.cardId);
            if (!def) return null;
            const isHand = opt.fromLocation === 'HAND';
            return {
              id: opt.instanceId,
              card: def,
              badgeText: isHand ? 'Handtrap • Từ Tay' : 'Bẫy Trên Sân',
              badgeTone: isHand ? 'sky' : 'purple',
              subTag: opt.lpCost && opt.lpCost > 0 ? `-${opt.lpCost} LP` : undefined,
              buttonLabel: 'Chọn',
            };
          })
          .filter((item): item is ShowcasePickerItem => item !== null);

        const chainStrip =
          currentLinks.length > 0 ? (
            <div className="px-3 py-2 bg-slate-950/85 border border-slate-700/80 rounded-xl flex items-center justify-center gap-1.5 flex-wrap backdrop-blur-sm">
              {currentLinks.map((cl, idx) => {
                const clDef = getCardById(cl.cardId);
                const ui = getChainLinkKindUi(cl);
                return (
                  <React.Fragment key={`prompt-cl-${cl.chainNumber}`}>
                    {idx > 0 && <ArrowRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                      <span className="px-1 py-[1px] rounded bg-amber-400 text-slate-950 font-mono font-black text-[9.5px]">
                        CL{cl.chainNumber}
                      </span>
                      {clDef && (
                        <img
                          src={getCardArtUrl(clDef)}
                          alt={getShortCardTitle(clDef)}
                          className="w-6 h-6 rounded object-cover"
                        />
                      )}
                      <div className="text-left min-w-0">
                        <div className="text-[11px] font-bold text-white leading-tight">
                          {clDef ? getShortCardTitle(clDef) : cl.cardId}
                        </div>
                        <div className="text-[9px] text-slate-400 leading-tight">
                          {ui.badge} • {cl.actor === myPlayerId ? 'Bạn' : opp.name}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <div className="px-2.5 py-1 rounded-lg border border-dashed border-sky-400/75 bg-sky-950/40 text-[11px] font-extrabold text-sky-200 animate-pulse">
                CL{nextLinkNum}: Chọn lá nối Chain
              </div>
            </div>
          ) : undefined;

        return (
          <CardShowcasePicker
            title={
              chain.triggerType === 'ON_OPPONENT_TRAP'
                ? `Phản đòn Handtrap / Bẫy phản đòn (Chain Link ${nextLinkNum})`
                : `Cơ hội kích hoạt Bẫy / Handtrap (Chain Link ${nextLinkNum})`
            }
            subtitle={chain.descriptionVi}
            headerExtra={chainStrip}
            items={pickerItems}
            onHoverCard={(c) => setHoveredCard(c)}
            onSelectItem={(item) =>
              onDispatchAction({
                type: 'RESPOND_CHAIN',
                playerId: myPlayerId,
                activateTrapInstanceId: item.id,
              })
            }
            cancelLabel={
              currentLinks.length >= 2
                ? `Bỏ Qua (Giải quyết Chain ${currentLinks.length} lá ngay)`
                : 'Bỏ Qua (Không Kích Hoạt)'
            }
            onCancel={() =>
              onDispatchAction({
                type: 'RESPOND_CHAIN',
                playerId: myPlayerId,
                activateTrapInstanceId: null,
              })
            }
          />
        );
      })()}

      {/* ==================================================================== */}
      {/* CỬA SỔ CHỌN MỤC TIÊU CHO PHÉP / BẪY */}
      {/* ==================================================================== */}
      {pendingTargetModal && (() => {
        const fusionAct = pendingTargetModal.cardDef.effects
          ?.find((e) => e.trigger === 'ON_ACTIVATE')
          ?.actions?.find((a) => a.type === 'FUSION_SUMMON');

        const targetItems: ShowcasePickerItem[] = pendingTargetModal.candidates
          .map((cand): ShowcasePickerItem | null => {
            const cDef = getCardById(cand.cardId);
            if (!cDef) return null;
            const zoneMatch = cand.labelVi.match(/\[([^\]]+)\]\s*$/);
            const zoneLabel = zoneMatch ? zoneMatch[1] : undefined;
            const badgeTone: ShowcasePickerItem['badgeTone'] = zoneLabel?.includes('Đối Phương')
              ? 'rose'
              : zoneLabel?.includes('Mộ')
              ? 'purple'
              : zoneLabel?.includes('Sân Bạn')
              ? 'sky'
              : 'emerald';

            const isHiddenOpp =
              cand.labelVi.startsWith('Quái thú đang Úp') ||
              cand.labelVi.startsWith('Bài Phép/Bẫy Úp');
            const liveFieldMonster =
              !isHiddenOpp && cand.location === 'FIELD_MONSTER'
                ? [...opp.monsterZones, ...me.monsterZones].find(
                    (m) => m?.instanceId === cand.instanceId
                  )
                : undefined;
            const liveStats = liveFieldMonster ? getEffectiveStats(state, liveFieldMonster) : undefined;

            return {
              id: cand.instanceId,
              card: cDef,
              badgeText: zoneLabel,
              badgeTone,
              overrideAtk: liveStats?.atk,
              overrideDef: liveStats?.def,
              isHiddenCard: isHiddenOpp,
              hiddenLabel: cand.labelVi.startsWith('Quái thú đang Úp')
                ? 'Quái Đang Úp'
                : 'Phép/Bẫy Đang Úp',
              buttonLabel: 'Chọn',
            };
          })
          .filter((item): item is ShowcasePickerItem => item !== null);

        return (
          <CardShowcasePicker
            title={`Chọn mục tiêu cho ${getShortCardTitle(pendingTargetModal.cardDef)}`}
            subtitle={
              pendingTargetModal.cardDef.effects?.[0]?.target?.promptVi ||
              'Chọn 1 lá bài mục tiêu bên dưới'
            }
            items={targetItems}
            onHoverCard={(c) => setHoveredCard(c)}
            onSelectItem={(item) => {
              if (fusionAct?.useTargetAsOnlyFusionMaterial) {
                const fusions = getAvailableFusionSummons(state, myPlayerId, {
                  onlyMaterialInstanceId: item.id,
                });
                if (fusions.length === 1) {
                  onDispatchAction({
                    type: 'ACTIVATE_SPELL_OR_TRAP',
                    playerId: myPlayerId,
                    instanceId: pendingTargetModal.instanceId,
                    fromLocation: pendingTargetModal.fromLocation,
                    targetInstanceId: item.id,
                    fusionExtraInstanceId: fusions[0].extraCard.instanceId,
                  });
                } else if (fusions.length > 1) {
                  setPendingFusionModal({
                    polyInstanceId: pendingTargetModal.instanceId,
                    fromLocation: pendingTargetModal.fromLocation,
                    targetInstanceId: item.id,
                    options: fusions,
                  });
                }
                setPendingTargetModal(null);
                return;
              }

              onDispatchAction({
                type: 'ACTIVATE_SPELL_OR_TRAP',
                playerId: myPlayerId,
                instanceId: pendingTargetModal.instanceId,
                fromLocation: pendingTargetModal.fromLocation,
                targetInstanceId: item.id,
              });
              setPendingTargetModal(null);
            }}
            cancelLabel="Hủy Bỏ"
            onCancel={() => setPendingTargetModal(null)}
            closeOnBackdrop
          />
        );
      })()}

      {/* ==================================================================== */}
      {/* CỬA SỔ CHỌN QUÁI DUNG HỢP */}
      {/* ==================================================================== */}
      {pendingFusionModal && (
        <CardShowcasePicker
          title="Chọn mục tiêu dung hợp"
          items={pendingFusionModal.options.map((opt) => ({
            id: opt.extraCard.instanceId,
            card: opt.def,
            buttonLabel: 'Chọn',
          }))}
          onHoverCard={(c) => setHoveredCard(c)}
          onSelectItem={(item) => {
            onDispatchAction({
              type: 'ACTIVATE_SPELL_OR_TRAP',
              playerId: myPlayerId,
              instanceId: pendingFusionModal.polyInstanceId,
              fromLocation: pendingFusionModal.fromLocation,
              ...(pendingFusionModal.targetInstanceId
                ? { targetInstanceId: pendingFusionModal.targetInstanceId }
                : {}),
              fusionExtraInstanceId: item.id,
            });
            setPendingFusionModal(null);
          }}
          cancelLabel="Hủy"
          onCancel={() => setPendingFusionModal(null)}
          closeOnBackdrop
        />
      )}

      {/* ==================================================================== */}
      {/* CỬA SỔ BỎ BÀI ĐỂ TRIỆU HỒI ĐẶC BIỆT TỪ TAY */}
      {/* ==================================================================== */}
      {pendingHandDiscardSummon && (() => {
        const handCandidates: ShowcasePickerItem[] = me.hand
          .filter((h) => h.instanceId !== pendingHandDiscardSummon.handInstanceId)
          .map((h): ShowcasePickerItem | null => {
            const def = getCardById(h.cardId);
            if (!def) return null;
            const pickIdx = pendingHandDiscardSummon.selectedDiscardIds.indexOf(h.instanceId);
            return {
              id: h.instanceId,
              card: def,
              isPicked: pickIdx !== -1,
              pickOrder: pickIdx !== -1 ? pickIdx + 1 : undefined,
              badgeText: 'Trên Tay',
              badgeTone: 'sky',
              buttonLabel: 'Chọn',
            };
          })
          .filter((item): item is ShowcasePickerItem => item !== null);

        return (
          <CardShowcasePicker
            title={`Bỏ ${pendingHandDiscardSummon.requiredCount} lá để Triệu hồi [${getShortCardTitle(pendingHandDiscardSummon.cardDef)}]`}
            subtitle={`Đã chọn: ${pendingHandDiscardSummon.selectedDiscardIds.length} / ${pendingHandDiscardSummon.requiredCount}`}
            items={handCandidates}
            onHoverCard={(c) => setHoveredCard(c)}
            onSelectItem={(item) => {
              const picked = pendingHandDiscardSummon.selectedDiscardIds.includes(item.id);
              const next = picked
                ? pendingHandDiscardSummon.selectedDiscardIds.filter((id) => id !== item.id)
                : [...pendingHandDiscardSummon.selectedDiscardIds, item.id];
              if (next.length >= pendingHandDiscardSummon.requiredCount) {
                onDispatchAction({
                  type: 'SPECIAL_SUMMON_FROM_HAND',
                  playerId: myPlayerId,
                  handInstanceId: pendingHandDiscardSummon.handInstanceId,
                  discardInstanceIds: next.slice(0, pendingHandDiscardSummon.requiredCount),
                });
                setPendingHandDiscardSummon(null);
              } else {
                setPendingHandDiscardSummon({
                  ...pendingHandDiscardSummon,
                  selectedDiscardIds: next,
                });
              }
            }}
            cancelLabel="Hủy Bỏ"
            onCancel={() => setPendingHandDiscardSummon(null)}
            closeOnBackdrop
          />
        );
      })()}

      {/* ==================================================================== */}
      {/* CỬA SỔ BỎ BÀI HOẶC TÌM BÀI TỪ DECK / MỘ */}
      {/* ==================================================================== */}
      {state.pendingSelection && state.pendingSelection.player === myPlayerId && (() => {
        const sel = state.pendingSelection;
        const maxPick = sel.requiredCount;
        const isUpTo = Boolean(sel.upToCount);

        const selItems: ShowcasePickerItem[] = sel.candidateInstanceIds
          .map((instId): ShowcasePickerItem | null => {
            const inHand = me.hand.find((h) => h.instanceId === instId);
            const inDeck = !inHand ? me.deck.find((d) => d.instanceId === instId) : undefined;
            const inGy =
              !inHand && !inDeck ? me.graveyard.find((g) => g.instanceId === instId) : undefined;
            const cardObj = inHand ?? inDeck ?? inGy;
            const def = cardObj ? getCardById(cardObj.cardId) : undefined;
            if (!def) return null;
            const pickIdx = selectionPickedIds.indexOf(instId);
            return {
              id: instId,
              card: def,
              isPicked: pickIdx !== -1,
              pickOrder: pickIdx !== -1 ? pickIdx + 1 : undefined,
              badgeText: inGy ? 'Dưới Mộ' : inHand ? 'Trên Tay' : 'Bộ Bài',
              badgeTone: inGy ? 'purple' : inHand ? 'sky' : 'amber',
              buttonLabel: 'Chọn',
            };
          })
          .filter((item): item is ShowcasePickerItem => item !== null);

        const showConfirm = isUpTo || selectionPickedIds.length > 0;
        const confirmDisabled = isUpTo
          ? selectionPickedIds.length < 1
          : selectionPickedIds.length < maxPick;

        return (
          <CardShowcasePicker
            title={sel.descriptionVi}
            subtitle={`Đã chọn: ${selectionPickedIds.length} / ${sel.requiredCount}${isUpTo ? ' (tối đa)' : ''}`}
            items={selItems}
            onHoverCard={(c) => setHoveredCard(c)}
            onSelectItem={(item) => {
              const picked = selectionPickedIds.includes(item.id);
              const next = picked
                ? selectionPickedIds.filter((id) => id !== item.id)
                : selectionPickedIds.length < maxPick
                ? [...selectionPickedIds, item.id]
                : selectionPickedIds;
              if (!isUpTo && next.length === maxPick) {
                onDispatchAction({
                  type: 'SUBMIT_SELECTION',
                  playerId: myPlayerId,
                  selectedInstanceIds: next,
                });
                setSelectionPickedIds([]);
              } else {
                setSelectionPickedIds(next);
              }
            }}
            confirmLabel={showConfirm ? `Xác Nhận (${selectionPickedIds.length}/${maxPick})` : undefined}
            confirmDisabled={confirmDisabled}
            onConfirm={() => {
              onDispatchAction({
                type: 'SUBMIT_SELECTION',
                playerId: myPlayerId,
                selectedInstanceIds: selectionPickedIds,
              });
              setSelectionPickedIds([]);
            }}
          />
        );
      })()}

      {/* ==================================================================== */}
      {/* CỬA SỔ XEM MỘ / EXTRA DECK */}
      {/* ==================================================================== */}
      {viewingPile && (() => {
        const isGy = viewingPile.title.startsWith('Mộ');
        const orderedCards = isGy ? [...viewingPile.cards].reverse() : viewingPile.cards;
        const pileItems: ShowcasePickerItem[] = orderedCards
          .map((c, idx): ShowcasePickerItem | null => {
            const def = getCardById(c.cardId);
            if (!def) return null;
            return {
              id: c.instanceId,
              card: def,
              badgeText: isGy && idx === 0 ? 'Mới vào Mộ' : undefined,
              badgeTone: 'amber',
            };
          })
          .filter((item): item is ShowcasePickerItem => item !== null);

        return (
          <CardShowcasePicker
            title={viewingPile.title}
            subtitle={orderedCards.length > 0 ? 'Di chuột hoặc chạm vào lá bài để xem chi tiết hiệu ứng' : undefined}
            items={pileItems}
            emptyText="Mộ bài hiện chưa có lá nào."
            viewOnly
            onHoverCard={(c) => setHoveredCard(c)}
            cancelLabel="Đóng"
            onCancel={() => setViewingPile(null)}
            closeOnBackdrop
          />
        );
      })()}

      {/* ==================================================================== */}
      {/* MÀN HÌNH KẾT THÚC TRẬN ĐẤU */}
      {/* ==================================================================== */}
      {state.winner && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="text-4xl mb-2">
              {state.winner === myPlayerId ? '🏆' : state.winner === 'DRAW' ? '🤝' : '💀'}
            </div>
            <h2 className="text-2xl font-extrabold text-amber-300 mb-2">
              {state.winner === myPlayerId
                ? 'CHIẾN THẮNG!'
                : state.winner === 'DRAW'
                ? 'HÒA TRẬN!'
                : 'THẤT BẠI!'}
            </h2>
            <p className="text-sm text-slate-300 mb-6">{state.winReasonVi}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onRematch}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm cursor-pointer"
              >
                🔄 Đấu Lại Ván Mới
              </button>
              <button
                onClick={onExitToLobby}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-sm cursor-pointer"
              >
                Về Sảnh Chờ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

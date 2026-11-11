import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardDefinition } from '../types/game';
import { YugiH5HandCard, YUGIOH_CARD_BACK_SVG } from './YugiH5Card';

export interface ShowcasePickerItem {
  id: string;
  card: CardDefinition;
  isPicked?: boolean;
  pickOrder?: number;
  badgeText?: string;
  badgeTone?: 'amber' | 'sky' | 'purple' | 'rose' | 'emerald';
  subTag?: string;
  buttonLabel?: string;
  overrideAtk?: number;
  overrideDef?: number;
  isHiddenCard?: boolean;
  hiddenLabel?: string;
}

interface CardShowcasePickerProps {
  title: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
  items: ShowcasePickerItem[];
  emptyText?: string;
  viewOnly?: boolean;
  onSelectItem?: (item: ShowcasePickerItem) => void;
  onHoverCard?: (card: CardDefinition | null) => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  closeOnBackdrop?: boolean;
}

const BADGE_TONE_CLASSES: Record<NonNullable<ShowcasePickerItem['badgeTone']>, string> = {
  amber: 'bg-amber-950/90 border-amber-400/70 text-amber-200',
  sky: 'bg-sky-950/90 border-sky-400/70 text-sky-200',
  purple: 'bg-purple-950/90 border-purple-400/70 text-purple-200',
  rose: 'bg-rose-950/90 border-rose-400/70 text-rose-200',
  emerald: 'bg-emerald-950/90 border-emerald-400/70 text-emerald-200',
};

const CARD_SPARKLES = [
  { cls: '-top-3 left-4 w-1.5 h-1.5', delay: '0s' },
  { cls: 'top-8 -right-4 w-1 h-1', delay: '0.6s' },
  { cls: 'top-1/2 -left-4 w-1 h-1', delay: '1.1s' },
  { cls: 'bottom-10 -right-3 w-1.5 h-1.5', delay: '0.35s' },
  { cls: '-bottom-2 left-6 w-1 h-1', delay: '0.9s' },
  { cls: '-top-2 right-5 w-1 h-1', delay: '1.4s' },
];

export const CardShowcasePicker: React.FC<CardShowcasePickerProps> = ({
  title,
  subtitle,
  headerExtra,
  items,
  emptyText = 'Không có lá bài nào.',
  viewOnly = false,
  onSelectItem,
  onHoverCard,
  confirmLabel,
  confirmDisabled = false,
  onConfirm,
  cancelLabel,
  onCancel,
  closeOnBackdrop = false,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDraggingVisual, setIsDraggingVisual] = useState(false);

  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });
  const suppressClickRef = useRef(false);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 6;
    setHasOverflow(overflow);
    setCanScrollLeft(overflow && scrollLeft > 8);
    setCanScrollRight(overflow && scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const raf = requestAnimationFrame(updateScrollButtons);
    const el = trackRef.current;
    let observer: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateScrollButtons());
      observer.observe(el);
    }
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [items.length, updateScrollButtons]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds.active) return;
      const dx = e.clientX - ds.startX;
      if (!ds.moved && Math.abs(dx) > 6) {
        ds.moved = true;
        setIsDraggingVisual(true);
      }
      if (ds.moved && trackRef.current) {
        trackRef.current.scrollLeft = ds.startScroll - dx;
      }
    };

    const handlePointerUp = () => {
      const ds = dragStateRef.current;
      if (!ds.active) return;
      if (ds.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 70);
      }
      ds.active = false;
      ds.moved = false;
      setIsDraggingVisual(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !trackRef.current) return;
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: trackRef.current.scrollLeft,
      moved: false,
    };
  };

  const handleTrackWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || el.scrollWidth <= el.clientWidth + 6) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  const scrollByStep = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.55));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const handleItemClick = (item: ShowcasePickerItem) => {
    if (suppressClickRef.current) return;
    if (viewOnly) {
      if (!item.isHiddenCard) onHoverCard?.(item.card);
      return;
    }
    onHoverCard?.(null);
    onSelectItem?.(item);
  };

  return (
    <div
      onClick={() => {
        if (closeOnBackdrop && onCancel) {
          onHoverCard?.(null);
          onCancel();
        }
      }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[1.5px] flex flex-col items-center justify-between py-5 sm:py-8 px-2 sm:px-6 animate-picker-in select-none"
    >
      {/* Tiêu đề nổi sạch phía trên (không đóng khung hộp) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-20 flex flex-col items-center text-center max-w-4xl w-full px-3"
      >
        {headerExtra && <div className="mb-2.5 w-full flex justify-center">{headerExtra}</div>}
        <h3 className="text-lg sm:text-2xl font-bold text-white tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.98)]">
          {title}
        </h3>
        {(subtitle || hasOverflow) && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm font-medium text-sky-200/90 drop-shadow-[0_1px_8px_rgba(0,0,0,1)]">
            {subtitle && <span>{subtitle}</span>}
            {hasOverflow && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-sky-400/35 text-[11px] font-semibold text-amber-200">
                ← Kéo sang để xem ({items.length} lá) →
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hàng lá bài nổi phát sáng ở giữa màn hình + kéo ngang khi nhiều bài */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1320px] flex-1 flex items-center justify-center min-h-0"
      >
        {items.length === 0 ? (
          <div className="px-6 py-8 rounded-2xl bg-slate-950/70 border border-slate-700/70 text-sm text-slate-300 text-center">
            {emptyText}
          </div>
        ) : (
          <div className="relative w-full flex items-center justify-center">
            {/* Mũi tên trái khi có thể cuộn sang trái */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollByStep(-1)}
                aria-label="Kéo sang trái"
                className="absolute left-1 sm:left-3 top-1/2 -translate-y-7 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/85 hover:bg-sky-800/95 border border-sky-300/60 text-white shadow-[0_0_24px_rgba(0,0,0,0.95)] flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Đường ray cuộn / kéo ngang */}
            <div
              ref={trackRef}
              onScroll={updateScrollButtons}
              onPointerDown={handleTrackPointerDown}
              onWheel={handleTrackWheel}
              onDragStart={(e) => e.preventDefault()}
              onClickCapture={(e) => {
                if (suppressClickRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              className={`w-full overflow-x-auto overflow-y-hidden py-8 sm:py-10 px-8 sm:px-14 yugih5-picker-scroll ${
                hasOverflow
                  ? isDraggingVisual
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : ''
              }`}
            >
              <div className="w-max mx-auto flex items-start gap-6 sm:gap-10 px-4">
                {items.map((item) => {
                  const isPicked = Boolean(item.isPicked);
                  const badgeCls =
                    BADGE_TONE_CLASSES[item.badgeTone ?? 'sky'] ?? BADGE_TONE_CLASSES.sky;

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => !item.isHiddenCard && onHoverCard?.(item.card)}
                      onMouseLeave={() => onHoverCard?.(null)}
                      className="group relative flex flex-col items-center shrink-0"
                    >
                      {/* Nhãn vị trí / thứ tự nhỏ gọn phía trên card nếu cần */}
                      {(item.badgeText || isPicked) && (
                        <div className="mb-2 flex items-center gap-1.5 min-h-[20px]">
                          {item.badgeText && (
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide shadow-md ${badgeCls}`}
                            >
                              {item.badgeText}
                            </span>
                          )}
                          {item.subTag && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-950/90 border border-rose-400/70 text-[10px] font-black text-rose-200 shadow-md">
                              {item.subTag}
                            </span>
                          )}
                          {isPicked && item.pickOrder !== undefined && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-md">
                              #{item.pickOrder}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Khung lá bài + Hào quang sáng trắng-vàng & hạt lấp lánh */}
                      <div
                        onClick={() => handleItemClick(item)}
                        className={`relative cursor-pointer transition-transform duration-200 ${
                          isPicked
                            ? '-translate-y-2 scale-[1.03]'
                            : 'group-hover:-translate-y-1.5 group-hover:scale-[1.02]'
                        }`}
                      >
                        {/* Quầng sáng khuếch tán mềm quanh lá bài */}
                        <div
                          className={`pointer-events-none absolute -inset-5 rounded-2xl blur-md transition-opacity duration-200 animate-picker-halo ${
                            isPicked
                              ? 'opacity-100 bg-[radial-gradient(circle,rgba(253,224,71,0.72)_0%,rgba(56,189,248,0.34)_48%,transparent_76%)]'
                              : 'opacity-85 group-hover:opacity-100 bg-[radial-gradient(circle,rgba(255,255,244,0.62)_0%,rgba(253,230,138,0.22)_46%,transparent_74%)]'
                          }`}
                        />

                        {/* Các hạt sáng nhỏ lấp lánh quanh hào quang */}
                        {CARD_SPARKLES.map((sp, sIdx) => (
                          <span
                            key={sIdx}
                            style={{ animationDelay: sp.delay }}
                            className={`pointer-events-none absolute rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse ${sp.cls}`}
                          />
                        ))}

                        {/* Viền sáng sắc nét bao quanh lá bài */}
                        <div
                          className={`relative rounded-[7px] transition-all duration-200 [&_img]:pointer-events-none ${
                            isPicked
                              ? 'ring-3 ring-amber-300 shadow-[0_0_32px_rgba(251,191,36,0.9),0_0_64px_rgba(56,189,248,0.45)]'
                              : 'ring-1 ring-white/45 shadow-[0_0_24px_rgba(255,255,245,0.58),0_0_52px_rgba(253,224,71,0.2)] group-hover:ring-2 group-hover:ring-white/80 group-hover:shadow-[0_0_34px_rgba(255,255,255,0.82),0_0_66px_rgba(56,189,248,0.35)]'
                          }`}
                        >
                          {item.isHiddenCard ? (
                            <div className="relative w-[154px] h-[226px] sm:w-[178px] sm:h-[260px] rounded-[6px] overflow-hidden border-2 border-amber-400/80 shadow-xl bg-slate-950">
                              <img
                                src={YUGIOH_CARD_BACK_SVG}
                                alt={item.hiddenLabel ?? 'Lá Bài Úp'}
                                draggable={false}
                                className="w-full h-full object-cover brightness-90"
                              />
                              <div className="absolute inset-x-3 bottom-6 py-1.5 rounded-lg bg-slate-950/90 border border-amber-400/70 text-center">
                                <span className="text-xs font-extrabold text-amber-200">
                                  {item.hiddenLabel ?? 'Lá Bài Đang Úp'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <YugiH5HandCard
                              card={item.card}
                              size="xl"
                              overrideAtk={item.overrideAtk}
                              overrideDef={item.overrideDef}
                              noHoverLift
                            />
                          )}
                        </div>
                      </div>

                      {/* Nút "Chọn" màu xanh lam ngay bên dưới từng lá bài */}
                      {!viewOnly && (
                        <button
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className={`relative z-20 mt-3.5 w-[126px] sm:w-[144px] h-[38px] sm:h-[42px] rounded-[6px] text-sm tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 active:scale-95 ${
                            isPicked
                              ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 hover:from-amber-200 hover:to-amber-600 border border-yellow-100 text-slate-950 font-extrabold shadow-[0_0_24px_rgba(251,191,36,0.75),inset_0_1px_0_rgba(255,255,255,0.5)]'
                              : 'bg-gradient-to-b from-[#2f6f91] via-[#1f516e] to-[#13374d] hover:from-[#3a85ad] hover:via-[#276385] hover:to-[#18445f] border border-sky-300/60 text-white font-bold shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.28)]'
                          }`}
                        >
                          {isPicked && <Check className="w-4 h-4 stroke-[3]" />}
                          <span>{isPicked ? 'Đã Chọn' : item.buttonLabel ?? 'Chọn'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mũi tên phải khi còn lá bài phía bên phải */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollByStep(1)}
                aria-label="Kéo sang phải"
                className="absolute right-1 sm:right-3 top-1/2 -translate-y-7 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/85 hover:bg-sky-800/95 border border-sky-300/60 text-white shadow-[0_0_24px_rgba(0,0,0,0.95)] flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Thanh nút Xác Nhận / Hủy Bỏ gọn phía đáy */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-20 flex flex-wrap items-center justify-center gap-3 pt-1"
      >
        {confirmLabel && onConfirm && (
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={() => {
              onHoverCard?.(null);
              onConfirm();
            }}
            className="px-7 py-2.5 rounded-lg bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 hover:from-amber-300 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed border border-yellow-200 text-slate-950 font-extrabold text-xs sm:text-sm shadow-[0_8px_24px_rgba(0,0,0,0.85)] cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            {confirmLabel}
          </button>
        )}
        {cancelLabel && onCancel && (
          <button
            type="button"
            onClick={() => {
              onHoverCard?.(null);
              onCancel();
            }}
            className="px-7 py-2.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 border border-slate-400/45 text-slate-200 font-bold text-xs sm:text-sm shadow-[0_8px_24px_rgba(0,0,0,0.85)] backdrop-blur-sm cursor-pointer transition-all hover:border-slate-300/70"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  );
};

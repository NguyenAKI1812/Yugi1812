import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { CardDefinition } from '../types/game';
import { getCardArtUrl, getShortCardTitle } from '../data/cards.catalog';

interface FitCardTitleProps {
  text: string;
  baseFontSize?: number;
  minFontSize?: number;
  className?: string;
}

/**
 * Thành phần chữ tự co vừa khung trên một dòng:
 * Tự động hạ cỡ chữ xuống (và nén nhẹ theo chiều ngang nếu tên siêu dài),
 * đảm bảo KHÔNG BAO GIỜ bị cắt thành dấu '...'
 */
export const FitCardTitle: React.FC<FitCardTitleProps> = ({
  text,
  baseFontSize = 9,
  minFontSize = 6.2,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  const fit = () => {
    const container = containerRef.current;
    const span = spanRef.current;
    if (!container || !span) return;

    const availW = container.clientWidth;
    if (availW <= 4) return;

    span.style.fontSize = `${baseFontSize}px`;
    span.style.transform = 'scaleX(1)';

    const naturalW = span.scrollWidth;
    if (naturalW <= availW) return;

    let currentSize = Math.max(
      minFontSize,
      Math.floor(baseFontSize * ((availW - 1) / naturalW) * 10) / 10
    );
    span.style.fontSize = `${currentSize}px`;

    let afterFontW = span.scrollWidth;
    while (afterFontW > availW && currentSize > minFontSize) {
      currentSize = Math.max(minFontSize, Math.round((currentSize - 0.3) * 10) / 10);
      span.style.fontSize = `${currentSize}px`;
      afterFontW = span.scrollWidth;
      if (currentSize <= minFontSize) break;
    }

    if (afterFontW > availW) {
      const sx = Math.max(0.5, (availW - 1) / afterFontW);
      span.style.transform = `scaleX(${sx})`;
    }
  };

  useLayoutEffect(() => {
    fit();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(container);
    return () => observer.disconnect();
  }, [text, baseFontSize, minFontSize]);

  useEffect(() => {
    let active = true;
    document.fonts?.ready?.then(() => {
      if (active) fit();
    });
    return () => {
      active = false;
    };
  }, [text, baseFontSize, minFontSize]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden flex items-center justify-center"
    >
      <span
        ref={spanRef}
        style={{ fontSize: `${baseFontSize}px` }}
        className={`inline-block whitespace-nowrap origin-center leading-none ${className}`}
      >
        {text}
      </span>
    </div>
  );
};

export const YUGIOH_CARD_BACK_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 290">
  <defs>
    <radialGradient id="vortex" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#140804"/>
      <stop offset="45%" stop-color="#4e230e"/>
      <stop offset="80%" stop-color="#8c481e"/>
      <stop offset="100%" stop-color="#2c1206"/>
    </radialGradient>
  </defs>
  <rect width="200" height="290" rx="8" fill="#3a1c0d" stroke="#d4a259" stroke-width="7"/>
  <rect x="12" y="12" width="176" height="266" rx="4" fill="url(#vortex)" stroke="#9e6b30" stroke-width="2.5"/>
  <ellipse cx="100" cy="145" rx="52" ry="82" fill="#0d0502" stroke="#c89146" stroke-width="3.5"/>
  <ellipse cx="100" cy="145" rx="30" ry="48" fill="none" stroke="#855221" stroke-width="2" stroke-dasharray="5 4"/>
</svg>`);

const ATTRIBUTE_ORB_MAP: Record<
  string,
  { label: string; grad: string; border: string; text: string }
> = {
  LIGHT: {
    label: 'Quang',
    grad: 'radial-gradient(circle at 30% 30%, #fef08a, #ca8a04 65%, #713f12)',
    border: '#fde047',
    text: '#1c1917',
  },
  DARK: {
    label: 'Ám',
    grad: 'radial-gradient(circle at 30% 30%, #c084fc, #6b21a8 65%, #2e1065)',
    border: '#e9d5ff',
    text: '#ffffff',
  },
  EARTH: {
    label: 'Địa',
    grad: 'radial-gradient(circle at 30% 30%, #d6b07a, #78350f 65%, #3b1704)',
    border: '#fcd34d',
    text: '#fffbeb',
  },
  WATER: {
    label: 'Thủy',
    grad: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0369a1 65%, #0c4a6e)',
    border: '#bae6fd',
    text: '#ffffff',
  },
  FIRE: {
    label: 'Hỏa',
    grad: 'radial-gradient(circle at 30% 30%, #fca5a5, #dc2626 65%, #7f1d1d)',
    border: '#fecaca',
    text: '#ffffff',
  },
  WIND: {
    label: 'Phong',
    grad: 'radial-gradient(circle at 30% 30%, #86efac, #15803d 65%, #052e16)',
    border: '#bbf7d0',
    text: '#ffffff',
  },
  DIVINE: {
    label: 'Thần',
    grad: 'radial-gradient(circle at 30% 30%, #fde68a, #b45309 65%, #451a03)',
    border: '#fef08a',
    text: '#fffbeb',
  },
};

interface YugiH5HandCardProps {
  card: CardDefinition;
  isPlayable?: boolean;
  isSelected?: boolean;
  size?: 'sm' | 'field' | 'md' | 'lg' | 'xl';
  overrideAtk?: number;
  overrideDef?: number;
  activeStat?: 'ATK' | 'DEF';
  noHoverLift?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * KHUNG BÀI CHUẨN YUGIH5:
 * - Không có tag UR / SR / GR
 * - Quái thú dưới sân (`size="field"`): Hiển thị giống hệt khung trên tay nhưng bảng chỉ số ATK và DEF lớn hơn, rõ nét hơn!
 */
export const YugiH5HandCard: React.FC<YugiH5HandCardProps> = ({
  card,
  isPlayable = false,
  isSelected = false,
  size = 'md',
  overrideAtk,
  overrideDef,
  activeStat,
  noHoverLift = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const isMonster = card.category === 'MONSTER';
  const isSpell = card.category === 'SPELL';
  const isTrap = card.category === 'TRAP';
  const isFieldSize = size === 'field';

  const orb = isMonster
    ? ATTRIBUTE_ORB_MAP[card.attribute || 'DARK'] || ATTRIBUTE_ORB_MAP.DARK
    : isSpell
    ? {
        label: 'Ma',
        grad: 'radial-gradient(circle at 30% 30%, #67e8f9, #0f766e 65%, #134e4a)',
        border: '#99f6e4',
        text: '#ffffff',
      }
    : {
        label: 'Bẫy',
        grad: 'radial-gradient(circle at 30% 30%, #f0abfc, #7e22ce 65%, #3b0764)',
        border: '#f5d0fe',
        text: '#ffffff',
      };

  const outerFrameStyle = isMonster
    ? {
        background:
          card.subType === 'FUSION'
            ? 'linear-gradient(180deg, #9333ea 0%, #581c87 40%, #b45309 100%)'
            : 'linear-gradient(180deg, #b91c1c 0%, #9a3412 35%, #b45309 75%, #78350f 100%)',
        borderColor: '#f59e0b',
      }
    : isSpell
    ? {
        background: 'linear-gradient(180deg, #10b981 0%, #047857 45%, #065f46 80%, #064e3b 100%)',
        borderColor: '#34d399',
      }
    : {
        background: 'linear-gradient(180deg, #a855f7 0%, #7e22ce 45%, #581c87 80%, #3b0764 100%)',
        borderColor: '#c084fc',
      };

  const subBarStyle = isMonster
    ? {
        background: 'linear-gradient(90deg, #581c87 0%, #9d174d 50%, #7c2d12 100%)',
      }
    : isSpell
    ? {
        background: 'linear-gradient(90deg, #065f46 0%, #10b981 50%, #047857 100%)',
      }
    : {
        background: 'linear-gradient(90deg, #4c1d95 0%, #9333ea 50%, #581c87 100%)',
      };

  const bottomPlaqueBg = isMonster
    ? 'linear-gradient(180deg, #27120b 0%, #140804 100%)'
    : isSpell
    ? 'linear-gradient(180deg, #064e3b 0%, #022c22 100%)'
    : 'linear-gradient(180deg, #4c1d95 0%, #2e1065 100%)';

  const sizeClasses =
    size === 'sm'
      ? 'w-[86px] h-[126px]'
      : size === 'field'
      ? 'w-full h-full'
      : size === 'lg'
      ? 'w-[144px] h-[212px]'
      : size === 'xl'
      ? 'w-[154px] h-[226px] sm:w-[178px] sm:h-[260px]'
      : 'w-[116px] sm:w-[128px] h-[170px] sm:h-[186px]';

  const displayAtk = overrideAtk !== undefined ? overrideAtk : card.atk ?? 0;
  const displayDef = overrideDef !== undefined ? overrideDef : card.def ?? 0;
  const isAtkBuffed = card.atk !== undefined && displayAtk > card.atk;
  const isDefBuffed = card.def !== undefined && displayDef > card.def;
  const starCount = Math.min(12, card.level || 4);
  const renderedStars = size === 'xl' ? starCount : Math.min(8, starCount);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={outerFrameStyle}
      className={`relative select-none ${sizeClasses} rounded-[6px] border-2 p-[2.5px] flex flex-col justify-between shadow-xl cursor-pointer transition-all duration-200 shrink-0 ${
        noHoverLift
          ? isSelected
            ? 'ring-2 ring-yellow-300 z-30 yugih5-card-glow'
            : isPlayable
            ? 'yugih5-card-glow'
            : ''
          : isSelected
          ? '-translate-y-6 scale-105 ring-2 ring-yellow-300 z-30 yugih5-card-glow'
          : isPlayable
          ? 'yugih5-card-glow hover:-translate-y-3 z-10'
          : 'hover:-translate-y-2'
      }`}
    >
      {/* 1. THANH TÊN LÁ BÀI + QUẢ CẦU HỆ 3D Ở GÓC PHẢI TRÊN */}
      <div
        className={`relative bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 border border-amber-500/60 rounded-t-[4px] ${
          size === 'sm'
            ? 'h-[18px] pl-1 pr-[16px]'
            : isFieldSize
            ? 'h-[20px] pl-1 pr-[19px]'
            : size === 'xl'
            ? 'h-[24px] sm:h-[26px] pl-1.5 pr-[24px]'
            : size === 'lg'
            ? 'h-[22px] pl-1.5 pr-[21px]'
            : 'h-[20px] sm:h-[21px] pl-1 pr-[19px]'
        } flex items-center shadow-inner`}
      >
        <FitCardTitle
          text={getShortCardTitle(card)}
          baseFontSize={size === 'sm' ? 8 : isFieldSize ? 9.5 : size === 'xl' ? 11.5 : size === 'lg' ? 10 : 8.8}
          minFontSize={size === 'sm' ? 5.8 : isFieldSize ? 6.5 : size === 'xl' ? 7.4 : size === 'lg' ? 6.8 : 6.2}
          className="font-extrabold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)]"
        />

        {/* Quả cầu Hệ nổi 3D ở góc phải trên */}
        <div
          style={{
            background: orb.grad,
            borderColor: orb.border,
            color: orb.text,
          }}
          className={`absolute -right-0.5 -top-0.5 ${
            size === 'sm'
              ? 'w-[16px] h-[16px]'
              : isFieldSize
              ? 'w-[19px] h-[19px]'
              : size === 'xl'
              ? 'w-[22px] sm:w-[24px] h-[22px] sm:h-[24px]'
              : size === 'lg'
              ? 'w-[21px] h-[21px]'
              : 'w-[19px] sm:w-[20px] h-[19px] sm:h-[20px]'
          } rounded-full border-[1.5px] shadow-[0_2px_5px_rgba(0,0,0,0.85)] flex items-center justify-center z-20`}
        >
          <span
            className={`${
              size === 'sm' ? 'text-[6px]' : size === 'xl' ? 'text-[8px]' : 'text-[7px]'
            } font-black tracking-tighter leading-none drop-shadow`}
          >
            {orb.label}
          </span>
        </div>
      </div>

      {/* 2. THANH NGỌC SAO (CHO QUÁI THÚ) HOẶC DẢI NGỌC (CHO PHÉP/BẪY) */}
      <div
        style={subBarStyle}
        className={`${
          isFieldSize ? 'h-[12px]' : size === 'xl' ? 'h-[17px]' : 'h-[15px]'
        } px-1 border-x border-b border-amber-500/40 flex items-center justify-end gap-[1px] overflow-hidden shadow-inner`}
      >
        {isMonster ? (
          Array.from({ length: renderedStars }).map((_, idx) => (
            <span
              key={idx}
              className={`${
                isFieldSize
                  ? 'w-[10px] h-[10px] text-[7px]'
                  : size === 'xl'
                  ? starCount > 9
                    ? 'w-[11px] h-[11px] text-[7.5px]'
                    : 'w-[13px] h-[13px] text-[9px]'
                  : 'w-[12px] h-[12px] text-[8px]'
              } rounded-full bg-gradient-to-b from-yellow-300 via-amber-500 to-red-700 border border-yellow-200 flex items-center justify-center text-yellow-100 shadow-xs leading-none`}
            >
              ★
            </span>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2/3 h-[3px] rounded-full bg-white/25" />
          </div>
        )}
      </div>

      {/* 3. KHUNG TRANH ARTWORK TRUNG TÂM + VIÊN KIM TỰ THÁP VÀNG Ở ĐÁY TRANH */}
      <div className="relative flex-1 mx-[1px] overflow-hidden border-x border-amber-500/50 bg-slate-950">
        <img
          src={getCardArtUrl(card)}
          alt={card.nameVi}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.ygoprodeck.com/images/cards_cropped/89631139.jpg';
          }}
        />

        {/* Viên ngọc kim tự tháp vàng ở chính giữa mép dưới ảnh */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-gradient-to-br from-yellow-200 via-amber-500 to-amber-800 border border-yellow-100 shadow-md z-10" />
      </div>

      {/* 4. BẢNG ĐÁY VIỀN HOA VĂN VÀNG KIM: ATK / DEF TO RÕ TRÊN SÂN */}
      <div
        style={{ background: bottomPlaqueBg }}
        className={`relative rounded-b-[4px] border-2 border-amber-400/90 shadow-[inset_0_0_8px_rgba(0,0,0,0.9)] px-1 ${
          isFieldSize ? 'py-1' : size === 'xl' ? 'py-1 sm:py-1.5' : 'py-0.5'
        } z-10`}
      >
        <span className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-amber-300/80" />
        <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-300/80" />
        <span className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full bg-amber-300/80" />
        <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-300/80" />

        {isMonster ? (
          <div className="grid grid-cols-2 text-center items-center">
            <div className="border-r border-amber-500/40 flex flex-col leading-none">
              <span
                className={`${
                  isFieldSize || size === 'xl' ? 'text-[9px] sm:text-[10px]' : 'text-[8.5px]'
                } font-black text-amber-300 tracking-wider drop-shadow`}
              >
                ATK
              </span>
              <span
                className={`${
                  size === 'xl'
                    ? 'text-[16px] sm:text-[18px]'
                    : isFieldSize
                    ? 'text-[14px] sm:text-[16px]'
                    : 'text-[12px] sm:text-[13px]'
                } font-black font-mono tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)] ${
                  isAtkBuffed
                    ? 'text-emerald-300'
                    : activeStat === 'ATK'
                    ? 'text-yellow-200'
                    : 'text-white'
                }`}
              >
                {displayAtk}
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <span
                className={`${
                  isFieldSize || size === 'xl' ? 'text-[9px] sm:text-[10px]' : 'text-[8.5px]'
                } font-black text-amber-300 tracking-wider drop-shadow`}
              >
                DEF
              </span>
              <span
                className={`${
                  size === 'xl'
                    ? 'text-[16px] sm:text-[18px]'
                    : isFieldSize
                    ? 'text-[14px] sm:text-[16px]'
                    : 'text-[12px] sm:text-[13px]'
                } font-black font-mono tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)] ${
                  isDefBuffed
                    ? 'text-emerald-300'
                    : activeStat === 'DEF'
                    ? 'text-sky-200'
                    : 'text-white'
                }`}
              >
                {displayDef}
              </span>
            </div>
          </div>
        ) : (
          <div className={`${size === 'xl' ? 'py-1.5' : 'py-1'} flex items-center justify-center`}>
            <span
              className={`${
                size === 'xl'
                  ? 'text-[15px] sm:text-[16px]'
                  : isFieldSize
                  ? 'text-[12px] sm:text-[13px]'
                  : 'text-[13px] sm:text-[14px]'
              } font-black tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)] bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent`}
            >
              {isSpell ? 'Bài Phép' : isTrap ? 'Bài Bẫy' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

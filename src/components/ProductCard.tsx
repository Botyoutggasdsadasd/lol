import React from 'react';
import { Product } from '../types';
import { ShieldCheck, Zap, Gift, Users } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  lang: 'KM' | 'EN';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  lang,
}) => {
  const isSoldOut = product.isSold || product.stock <= 0;
  const isAccount = product.fulfillmentType === 'account' || product.category === 'account';
  const isGift = product.fulfillmentType === 'gift' || product.category === 'gamepass';
  const isTrade = product.fulfillmentType === 'trade' || (!isAccount && !isGift);
  const warrantyDays = product.warrantyDays || 14;

  return (
    <div
      className={`rounded-2xl p-3 md:p-4 flex flex-col gap-3 transition-all duration-300 ${
        isSoldOut
          ? 'bg-[#15171F] border border-white/5 opacity-75'
          : product.isShimmer
          ? 'shimmer-wrapper bg-[#1C1F29]/95 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
          : 'bg-[#1C1F29] border border-white/5 shadow-md hover:border-[#ffb230]/40'
      }`}
    >
      {/* Product Image Box */}
      <div
        className="relative w-full aspect-square rounded-xl bg-gradient-to-b from-[#14161D] to-[#0A0B0E] overflow-hidden flex items-center justify-center border border-white/10 group cursor-pointer"
        onClick={() => onSelect(product)}
      >
        {/* SOLD OUT OVERLAY */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-[#0A0B0E]/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-2 text-center">
            <span className="bg-[#E8433F] text-white font-price font-extrabold text-xs md:text-sm px-3 py-1 rounded-full shadow-lg tracking-wider animate-pulse">
              {lang === 'KM' ? 'ដាច់ស្តុក • SOLD OUT' : 'SOLD OUT'}
            </span>
            <span className="text-[10px] font-price text-[#8B90A0] mt-1">
              {lang === 'KM' ? 'ទំនិញត្រូវបានទិញអស់ហើយ' : 'Auto-closed'}
            </span>
          </div>
        )}

        {/* Warranty Badge - ONLY FOR ACCOUNTS */}
        {isAccount && !isSoldOut && (
          <div className="absolute top-0 left-0 bg-gradient-to-r from-[#ffb230] to-[#ffa000] text-[#291800] font-price text-[10px] md:text-xs font-black px-2.5 py-1 rounded-br-xl z-10 flex items-center gap-1 shadow-lg">
            <span>🛡️</span>
            <span>{warrantyDays}D WARRANTY</span>
          </div>
        )}

        {/* Gift badge */}
        {!isAccount && isGift && !isSoldOut && (
          <div className="absolute top-0 left-0 bg-[#E8433F] text-white font-price text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-br-xl z-10 flex items-center gap-1 shadow-md">
            <Gift className="w-3 h-3" />
            <span>GIFT 15-30M</span>
          </div>
        )}

        {/* Trade badge */}
        {!isAccount && isTrade && !isSoldOut && (
          <div className="absolute top-0 left-0 bg-[#1C1F29]/90 border border-white/20 text-[#ffd7a1] font-price text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-br-xl z-10 flex items-center gap-1 shadow-md">
            <Users className="w-3 h-3 text-[#ffb230]" />
            <span>TRADE</span>
          </div>
        )}

        {product.badge === 'NEW' && !isSoldOut && (
          <div className="absolute top-2 right-2 bg-[#E8433F] text-white font-price text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full z-10 shadow-md animate-pulse">
            NEW
          </div>
        )}

        {product.badge === 'LEGENDARY' && !isSoldOut && (
          <div className="absolute top-2 right-2 bg-[#6F00BE] text-[#ebd4ff] font-price text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full z-10 border border-[#d6b2fc]/40 shadow-md">
            LEGENDARY
          </div>
        )}

        {/* Ambient radial glow backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ffb230]/15 via-transparent to-transparent opacity-80 group-hover:scale-110 transition-transform duration-500" />

        <img
          src={product.image}
          alt={product.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            isSoldOut ? 'opacity-40 grayscale' : 'opacity-90'
          }`}
          loading="lazy"
        />

        {/* Delivery Type Overlay Pill */}
        {!isSoldOut && (
          <div className="absolute bottom-2 left-2 bg-[#0A0B0E]/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
            {isAccount ? (
              <>
                <Zap className="w-3 h-3 text-[#3ECF8E]" />
                <span className="text-[9px] font-price text-[#3ECF8E] font-bold uppercase">Auto Send</span>
              </>
            ) : isGift ? (
              <>
                <Gift className="w-3 h-3 text-[#ffb230]" />
                <span className="text-[9px] font-price text-[#ffb230] font-bold uppercase">Gift (15-30m)</span>
              </>
            ) : (
              <>
                <Users className="w-3 h-3 text-[#60a5fa]" />
                <span className="text-[9px] font-price text-[#60a5fa] font-bold uppercase">Admin Trade</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info Block */}
      <div className="flex flex-col flex-grow justify-between gap-2">
        <div>
          <h3
            className="font-khmer text-sm md:text-base font-semibold line-clamp-2 text-[#e2e2ec] hover:text-[#ffd7a1] transition-colors cursor-pointer"
            onClick={() => onSelect(product)}
          >
            {lang === 'KM' ? product.titleKhmer : product.title}
          </h3>
          <p className="font-price text-[11px] text-[#8B90A0] mt-1 line-clamp-1">
            {isSoldOut
              ? lang === 'KM' ? 'ទំនិញត្រូវបានលក់អស់ • មិនមានស្តុក' : 'OUT OF STOCK • NOT AVAILABLE'
              : isAccount
              ? `ROBLOX ACCOUNT • ${warrantyDays} DAYS WARRANTY`
              : isGift
              ? 'GAMEPASS / GIFT • USERNAME REQUIRED'
              : 'IN-GAME ITEM • TRADE WITH ADMIN'}
          </p>
        </div>

        {/* Pricing Row */}
        <div className="flex justify-between items-end mt-1 pt-2 border-t border-white/5">
          <div className="flex flex-col">
            <span className={`font-price text-xl md:text-2xl font-bold ${
              isSoldOut ? 'text-[#8B90A0] line-through' : 'text-[#ffb230] drop-shadow-[0_0_8px_rgba(255,178,48,0.3)]'
            }`}>
              ${(product?.price ?? 0).toFixed(2)}
            </span>
            <span className="text-[10px] font-price text-[#8B90A0]">
              {((product?.price ?? 0) * 4100).toLocaleString()} KHR
            </span>
          </div>

          {/* Stock Display */}
          {isSoldOut ? (
            <span className="font-price text-[11px] text-[#E8433F] font-bold flex items-center gap-1 bg-[#E8433F]/10 px-2 py-0.5 rounded-md border border-[#E8433F]/20">
              <span>Sold Out</span>
            </span>
          ) : isAccount ? (
            <span className="font-price text-[11px] text-[#3ECF8E] font-bold flex items-center gap-1 bg-[#3ECF8E]/10 px-2 py-0.5 rounded-md border border-[#3ECF8E]/20">
              <Zap className="w-3 h-3" />
              <span>Instant</span>
            </span>
          ) : (
            <span className="font-price text-xs text-[#8B90A0]">
              Stock: <span className="text-[#e2e2ec] font-bold">{product.stock}</span>
            </span>
          )}
        </div>
      </div>

      {/* Chunky Buy Button or Sold Out indicator */}
      {isSoldOut ? (
        <button
          disabled
          className="w-full bg-[#1e2029] border border-white/10 text-[#8B90A0] font-headline text-sm md:text-base py-2.5 rounded-xl uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          <span className="font-khmer font-bold">{lang === 'KM' ? 'ដាច់ស្តុក (SOLD OUT)' : 'SOLD OUT'}</span>
        </button>
      ) : (
        <button
          onClick={() => onSelect(product)}
          className="w-full chunky-btn-gold bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-base md:text-lg py-2.5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <span className="font-khmer font-bold">{lang === 'KM' ? 'ទិញឥឡូវ' : 'BUY NOW'}</span>
        </button>
      )}
    </div>
  );
};

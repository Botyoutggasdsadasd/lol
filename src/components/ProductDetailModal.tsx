import React, { useState } from 'react';
import { Product } from '../types';
import { Shield, Zap, X, ZoomIn, ShoppingCart, Gift, Users, Send, AlertTriangle, ChevronRight, Ban } from 'lucide-react';
import { AccountLoginRulesModal } from './AccountLoginRulesModal';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onProceedToCheckout: (product: Product) => void;
  lang: 'KM' | 'EN';
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onProceedToCheckout,
  lang,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  if (!product) return null;

  const isSoldOut = product.isSold || product.stock <= 0;
  const isAccount = product.fulfillmentType === 'account' || product.category === 'account';
  const isGift = product.fulfillmentType === 'gift' || product.category === 'gamepass';
  const isTrade = product.fulfillmentType === 'trade' || (!isAccount && !isGift);
  const warrantyDays = product.warrantyDays || 14;

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col justify-end items-center sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Card / Bottom Sheet on Mobile */}
        <div className="relative w-full max-w-lg bg-[#14161D] border border-white/10 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10 animate-slide-up">
          {/* Drag Handle & Close */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <div className="w-12 h-1.5 bg-[#33343c] rounded-full mx-auto" />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#1C1F29] border border-white/10 text-[#8B90A0] hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto px-5 md:px-6 pb-6 flex flex-col gap-4">
            {/* Media Header */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 group bg-[#0A0B0E]">
              <img
                src={product.image}
                alt={product.title}
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  isZoomed ? 'scale-125' : 'scale-100'
                }`}
              />
              {/* Zoom button */}
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute bottom-3 right-3 bg-[#1C1F29]/80 backdrop-blur-md text-[#e2e2ec] hover:text-[#ffb230] p-2 rounded-full border border-white/15 shadow-lg transition-all"
                title="Toggle Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Badge overlay - Warranty strictly for accounts */}
              {isAccount && (
                <div className="absolute top-3 left-3 bg-[#ffb230] text-[#291800] font-price text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <span>🛡️</span>
                  <span>{warrantyDays}-Day Official Warranty</span>
                </div>
              )}
              {!isAccount && isGift && (
                <div className="absolute top-3 left-3 bg-[#E8433F] text-white font-price text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Gift (15-30 mins delivery)</span>
                </div>
              )}
              {!isAccount && isTrade && (
                <div className="absolute top-3 left-3 bg-[#1C1F29] border border-white/20 text-[#ffd7a1] font-price text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#ffb230]" />
                  <span>In-Game Trade with Admin</span>
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-1 mt-1">
              <h2 className="font-headline text-2xl md:text-3xl text-[#e2e2ec] leading-tight uppercase tracking-wide">
                {product.title}
              </h2>
              <p className="font-khmer text-sm text-[#ffd7a1] leading-relaxed mt-1">
                {product.descriptionKhmer}
              </p>
              <p className="text-xs text-[#8B90A0] font-sans">
                {product.description}
              </p>
            </div>

            {/* Delivery Specific Notice Box */}
            {isAccount && (
              <div className="flex flex-col gap-2.5">
                <div className="bg-[#1C1F29] border border-[#ffb230]/30 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#ffb230]/10 text-[#ffb230] shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-price font-bold text-[#ffd7a1] uppercase">
                      {lang === 'KM' ? `ធានាគណនី ${warrantyDays} ថ្ងៃ + ផ្ញើស្វ័យប្រវត្តិ` : `${warrantyDays}-Day Account Warranty + Instant Delivery`}
                    </h4>
                    <p className="font-khmer text-[#8B90A0] text-[11px] leading-relaxed">
                      {lang === 'KM'
                        ? 'បន្ទាប់ពីស្កេនទូទាត់ KHQR រួច អ្នកនឹងទទួលបាន Username, Password និងកូដ Live 2FA ភ្លាមៗលើអេក្រង់។'
                        : 'Instant automated delivery with credentials and 2FA Live Code generated on screen immediately upon KHQR payment.'}
                    </p>
                  </div>
                </div>

                {/* Warranty & No-Refund Quick Button */}
                <button
                  type="button"
                  onClick={() => setShowRulesModal(true)}
                  className="bg-[#1C1F29] hover:bg-[#282a31] border border-white/10 rounded-2xl p-3 flex items-center justify-between transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#ffb230]" />
                    <span className="font-khmer text-xs text-[#ffd7a1] font-bold">
                      {lang === 'KM' ? 'ច្បាប់ធានា ១៤ ថ្ងៃ & របៀប Login (ចុចមើល)' : '14-Day Warranty Rules & Login Guide (Click)'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8B90A0] group-hover:text-[#ffb230] transition-colors" />
                </button>
              </div>
            )}

            {isGift && (
              <div className="bg-[#1C1F29] border border-[#E8433F]/30 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#E8433F]/10 text-[#E8433F] shrink-0 mt-0.5">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-price font-bold text-[#ffd7a1] uppercase">
                    {lang === 'KM' ? 'ផ្ញើកាដូ (Gift) • រង់ចាំ ១៥-៣០ នាទី' : 'Gift Delivery • 15-30 Minutes Wait'}
                  </h4>
                  <p className="font-khmer text-[#8B90A0] text-[11px] leading-relaxed">
                    {lang === 'KM'
                      ? 'សូមបញ្ចូល Roblox Username របស់អ្នកនៅពេលទូទាត់។ Admin នឹងផ្ញើ Gift ត្រង់ទៅគណនីរបស់អ្នកក្នុងរយៈពេល ១៥-៣០ នាទី។ មិនបង្វិលប្រាក់វិញ (No Refund)។'
                      : 'Enter your Roblox Username during checkout. Admin will send the gamepass/item directly within 15-30 mins. Strictly No Refund.'}
                  </p>
                </div>
              </div>
            )}

            {isTrade && (
              <div className="bg-[#1C1F29] border border-[#60a5fa]/30 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#60a5fa]/10 text-[#60a5fa] shrink-0 mt-0.5">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-price font-bold text-[#ffd7a1] uppercase">
                    {lang === 'KM' ? 'Trade ក្នុងហ្គេម • ទាក់ទង Admin Telegram' : 'In-Game Item Trade • Contact Admin'}
                  </h4>
                  <p className="font-khmer text-[#8B90A0] text-[11px] leading-relaxed">
                    {lang === 'KM'
                      ? 'បន្ទាប់ពីទូទាត់រួច សូមទាក់ទង Admin តាម Telegram (@Noreakyout) ដើម្បីចូល Private Server ធ្វើការ Trade ផ្លែឈើ ឬអាវុធ MM2/Blade Ball។ មិនបង្វិលប្រាក់ (No Refund)។'
                      : 'After payment, contact Admin on Telegram (@Noreakyout) with your Order ID to join private server for in-game trade. Strictly No Refund.'}
                  </p>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="bg-[#1C1F29] border border-white/10 text-[#d6c4ae] rounded-full px-3 py-1 text-xs font-price uppercase font-semibold">
                Category: {product.category}
              </span>
              {isSoldOut ? (
                <div className="bg-[#E8433F]/15 border border-[#E8433F]/40 rounded-full px-3 py-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E8433F] animate-ping" />
                  <span className="font-price text-xs text-[#E8433F] font-bold">SOLD OUT (0 Stock)</span>
                </div>
              ) : isAccount ? (
                <div className="bg-[#ffb230]/15 border border-[#ffb230]/40 rounded-full px-3 py-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#ffb230]" />
                  <span className="font-price text-xs text-[#ffb230] font-bold">{warrantyDays}-day warranty</span>
                </div>
              ) : (
                <span className="bg-[#3ECF8E]/15 border border-[#3ECF8E]/40 text-[#3ECF8E] rounded-full px-3 py-1 text-xs font-price font-bold">
                  In Stock ({product.stock})
                </span>
              )}
            </div>

            {/* Pricing Row */}
            <div className="flex justify-between items-end mt-2 pt-4 border-t border-[#33343c]">
              <div className="flex flex-col">
                <span className="font-khmer text-xs text-[#8B90A0] font-medium">
                  {lang === 'KM' ? 'តម្លៃសរុប (USD)' : 'Total Price (USD)'}
                </span>
                <span className={`font-price text-3xl font-bold ${
                  isSoldOut ? 'text-[#8B90A0] line-through' : 'text-[#ffb94d] drop-shadow-[0_0_12px_rgba(255,178,48,0.4)]'
                }`}>
                  ${(product?.price ?? 0).toFixed(2)}
                </span>
                <span className="text-[11px] font-price text-[#8B90A0]">
                  ≈ {((product?.price ?? 0) * 4100).toLocaleString()} KHR
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#282a31] border border-white/10 rounded-full px-3 py-1.5">
                {isSoldOut ? (
                  <span className="font-price text-xs text-[#E8433F] font-medium">Closed / Sold Out</span>
                ) : isAccount ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[#3ECF8E]" />
                    <span className="font-price text-xs text-[#3ECF8E] font-medium">Auto Delivery</span>
                  </>
                ) : isGift ? (
                  <>
                    <Gift className="w-3.5 h-3.5 text-[#ffb230]" />
                    <span className="font-price text-xs text-[#ffb230] font-medium">Gift Delivery (15-30m)</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-[#60a5fa]" />
                    <span className="font-price text-xs text-[#60a5fa] font-medium">Admin Trade</span>
                  </>
                )}
              </div>
            </div>

            {/* Action CTA Button */}
            {isSoldOut ? (
              <button
                disabled
                className="w-full bg-[#1e2029] border border-[#E8433F]/30 text-[#8B90A0] font-headline text-lg py-4 rounded-xl mt-2 flex items-center justify-center gap-2 uppercase tracking-wider cursor-not-allowed"
              >
                <span className="font-khmer font-bold text-[#E8433F]">
                  {lang === 'KM' ? 'ទំនិញនេះលក់អស់ហើយ (SOLD OUT)' : 'ITEM SOLD OUT • OUT OF STOCK'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout(product);
                }}
                className="w-full bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-xl py-4 rounded-xl chunky-btn-gold mt-2 flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="font-khmer font-bold">
                  {lang === 'KM' ? `ទិញឥឡូវ — $${(product?.price ?? 0).toFixed(2)}` : `BUY NOW — $${(product?.price ?? 0).toFixed(2)}`}
                </span>
              </button>
            )}

            <p className="text-center font-price text-xs text-[#8B90A0] mt-1">
              🔒 100% Verified KHQR Instant Settlement
            </p>
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      <AccountLoginRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        lang={lang}
        initialTab="rules"
      />
    </>
  );
};

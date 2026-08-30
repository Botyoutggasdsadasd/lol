import React, { useState } from 'react';
import { StoreSettings, ActiveScreen } from '../types';
import { ShieldCheck, MessageCircle, Send, Lock, Heart, FileText, ChevronRight, Gift, HelpCircle } from 'lucide-react';
import { AccountLoginRulesModal } from './AccountLoginRulesModal';

interface StoreFooterProps {
  settings: StoreSettings;
  onAdminLoginClick: () => void;
  lang: 'KM' | 'EN';
  setActiveScreen?: (screen: ActiveScreen) => void;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({
  settings,
  onAdminLoginClick,
  lang,
  setActiveScreen,
}) => {
  const [showRulesModal, setShowRulesModal] = useState(false);

  return (
    <>
      <footer className="w-full bg-[#0D0E14] border-t border-white/5 pt-10 pb-24 md:pb-12 mt-12 text-[#8B90A0]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Col 1: Store Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl overflow-hidden bg-gradient-to-br from-[#ffb230] to-[#E8433F] p-0.5 shadow-md">
                  <img
                    src={settings.logoUrl}
                    alt={settings.storeName}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                </div>
                <span className="font-headline text-lg text-[#ffd7a1] tracking-wider">
                  {settings.storeName}
                </span>
              </div>
              <p className="font-khmer text-xs leading-relaxed text-[#8B90A0]">
                {lang === 'KM'
                  ? 'ហាងលក់គណនីហ្គេម និងផ្លែឈើរឿងព្រេងនិទានឈានមុខគេនៅកម្ពុជា។ ធានាសុវត្ថិភាព ១០០% និងផ្ទេរស្វ័យប្រវត្ត។'
                  : 'Cambodia premier marketplace for Roblox game accounts and legendary items. 100% verified instant KHQR delivery.'}
              </p>
              {setActiveScreen && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setActiveScreen('referral')}
                    className="text-xs font-price bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Refer & Earn (5%)</span>
                  </button>
                  <button
                    onClick={() => setActiveScreen('help')}
                    className="text-xs font-price bg-white/5 hover:bg-white/10 text-[#ffd7a1] border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Help Center</span>
                  </button>
                </div>
              )}
            </div>

            {/* Col 2: Supported Payment Gateways */}
            <div className="space-y-2.5">
              <h4 className="font-headline text-xs text-[#e2e2ec] uppercase tracking-wider">
                PAYMENT PARTNERS (KHQR)
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Bakong', 'ABA Bank', 'ACLEDA', 'Wing Bank', 'Canadia'].map((bank) => (
                  <span
                    key={bank}
                    className="font-price text-xs bg-[#1C1F29] border border-white/10 text-[#ffd7a1] px-2.5 py-1 rounded-lg"
                  >
                    {bank}
                  </span>
                ))}
              </div>
              <p className="font-price text-[11px] text-[#3ECF8E] flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>National Bank of Cambodia KHQR Standard</span>
              </p>
            </div>

            {/* Col 3: Direct Support Channels */}
            <div className="space-y-2.5">
              <h4 className="font-headline text-xs text-[#e2e2ec] uppercase tracking-wider">
                COMMUNITY & SUPPORT
              </h4>
              <div className="space-y-2 font-price text-xs">
                {setActiveScreen && (
                  <button
                    onClick={() => setActiveScreen('help')}
                    className="flex items-center gap-2 text-[#d6c4ae] hover:text-[#ffb230] transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#ffb230]" />
                    <span>Help & Knowledge Base</span>
                  </button>
                )}
                {settings.telegramUrl && (
                  <a
                    href={settings.telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-[#d6c4ae] hover:text-[#ffb230] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-[#ffb230]" />
                    <span>Telegram Channel</span>
                  </a>
                )}
                <a
                  href="https://t.me/Noreakyout"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[#d6c4ae] hover:text-[#3ECF8E] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#3ECF8E]" />
                  <span>Direct Admin (@Noreakyout)</span>
                </a>
              </div>
            </div>

            {/* Col 4: Buyer Protection & Guarantee */}
            <div className="space-y-2.5">
              <h4 className="font-headline text-xs text-[#e2e2ec] uppercase tracking-wider">
                BUYER PROTECTION & RULES
              </h4>
              <p className="font-price text-xs text-[#8B90A0]">
                All Roblox accounts include 14-day warranty protection, instant automated 2FA delivery, and dedicated customer support.
              </p>
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="w-full bg-[#1C1F29] hover:bg-[#282a31] border border-white/10 hover:border-[#ffb230]/40 rounded-xl p-2.5 flex items-center justify-between transition-colors text-left group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#ffb230]" />
                  <span className="font-khmer text-xs text-[#ffd7a1] font-bold">
                    {lang === 'KM' ? 'ច្បាប់ធានា ១៤ ថ្ងៃ & របៀប Login' : '14-Day Warranty & Login Rules'}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#8B90A0] group-hover:text-[#ffb230] transition-colors" />
              </button>
              <div className="flex items-center gap-2 text-xs font-price text-[#3ECF8E]">
                <ShieldCheck className="w-4 h-4 text-[#3ECF8E]" />
                <span>100% Verified Delivery</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs font-user text-[#8B90A0]">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <span>
                © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5 text-[#cac6bb]">
                Built with <Heart className="w-3.5 h-3.5 text-[#E8433F] fill-current animate-pulse" /> for Cambodian Gamers
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-3 gap-y-2 text-xs">
              {setActiveScreen && (
                <>
                  <button
                    onClick={() => setActiveScreen('referral')}
                    className="hover:text-[#ffb230] text-[#d6c4ae] transition-colors py-0.5 px-1.5 rounded hover:bg-white/5"
                  >
                    Refer & Earn (5%)
                  </button>
                  <span className="text-white/20 select-none">•</span>
                  <button
                    onClick={() => setActiveScreen('help')}
                    className="hover:text-[#ffb230] text-[#d6c4ae] transition-colors py-0.5 px-1.5 rounded hover:bg-white/5"
                  >
                    Help & Support
                  </button>
                  <span className="text-white/20 select-none">•</span>
                </>
              )}
              <button
                onClick={() => setShowRulesModal(true)}
                className="hover:text-[#ffb230] text-[#d6c4ae] transition-colors py-0.5 px-1.5 rounded hover:bg-white/5 font-khmer text-xs"
              >
                {lang === 'KM' ? 'ច្បាប់ទិញគណនី & ធានា' : 'Account & Warranty Rules'}
              </button>
              <span className="text-white/20 select-none">•</span>
              <a
                href={settings.telegramUrl || 'https://t.me/uchirostore'}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#ffb230] text-[#d6c4ae] transition-colors py-0.5 px-1.5 rounded hover:bg-white/5"
              >
                Telegram Community
              </a>
              <span className="text-white/20 select-none">•</span>
              <span className="text-[#3ECF8E] font-medium font-price px-2 py-0.5 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20">
                KHQR USD Instant
              </span>
            </div>
          </div>
        </div>
      </footer>

      <AccountLoginRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        lang={lang}
      />
    </>
  );
};

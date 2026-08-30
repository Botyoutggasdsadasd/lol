import React from 'react';
import { ActiveScreen, StoreSettings, UserProfile } from '../types';
import { Shield, Lock, Store as StoreIcon, Globe, Bell, Sparkles } from 'lucide-react';
import { getMemberRankInfo } from '../utils/memberRank';

interface TopAppBarProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  lang: 'KM' | 'EN';
  setLang: (lang: 'KM' | 'EN') => void;
  userBalanceUSD: number;
  pendingOrdersCount: number;
  onOpenTopup: () => void;
  settings: StoreSettings;
  isAdminAuthenticated: boolean;
  onAdminPortalClick: () => void;
  onOpenNotificationModal?: () => void;
  userProfile?: UserProfile;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeScreen,
  setActiveScreen,
  lang,
  setLang,
  userBalanceUSD,
  pendingOrdersCount,
  onOpenTopup,
  settings,
  isAdminAuthenticated,
  onAdminPortalClick,
  onOpenNotificationModal,
  userProfile,
}) => {
  const isAdminMode = activeScreen.startsWith('admin-') && activeScreen !== 'admin-login';
  const rankInfo = userProfile
    ? getMemberRankInfo(userProfile.totalSpentUSD || 0, userProfile.isResellerUnlocked)
    : null;
  const [logoClickCount, setLogoClickCount] = React.useState(0);
  const logoTimerRef = React.useRef<any>(null);

  // Secret admin shortcut (Alt+A or triple logo click)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        onAdminPortalClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAdminPortalClick]);

  const handleLogoClick = () => {
    if (isAdminMode) {
      setActiveScreen('admin-dashboard');
      return;
    }
    setActiveScreen('store');
    
    // Secret 3-click trigger to safely open Admin Portal without customer knowledge
    setLogoClickCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        onAdminPortalClick();
        return 0;
      }
      return next;
    });

    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
    logoTimerRef.current = setTimeout(() => {
      setLogoClickCount(0);
    }, 1200);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#11131a]/95 backdrop-blur-[20px] border-b border-white/10 shadow-lg">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 md:px-8 h-13 sm:h-15 md:h-18 flex items-center justify-between">
        {/* Left: Brand Custom Logo (No text name in header as requested) */}
        <div
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
          onClick={handleLogoClick}
          title="Uchiro Store (Triple click for Admin)"
        >
          <div className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 md:w-10 md:h-10 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#ffb230] to-[#E8433F] p-0.5 shrink-0 shadow-[0_0_12px_rgba(255,178,48,0.35)] hover:scale-105 transition-transform">
            <img
              src={settings.logoUrl}
              alt="Store Logo"
              className="w-full h-full object-cover rounded-[10px] sm:rounded-[14px]"
            />
          </div>
          {isAdminMode && (
            <div className="flex items-center gap-2">
              <span className="font-headline text-base sm:text-lg md:text-xl bg-gradient-to-r from-[#ffd7a1] via-[#ffb230] to-[#ffddb2] bg-clip-text text-transparent tracking-wider">
                ADMIN SUITE
              </span>
              <span className="bg-[#ffb230]/20 text-[#ffb230] border border-[#ffb230]/40 text-[9px] sm:text-[10px] font-price px-1.5 py-0.2 rounded-full font-bold uppercase">
                Staff
              </span>
            </div>
          )}
        </div>

        {/* Center: Desktop Nav Links for Customer */}
        {!isAdminMode && (
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => setActiveScreen('store')}
              className={`font-user text-sm font-semibold transition-colors ${
                activeScreen === 'store' ? 'text-[#ffb230] font-bold' : 'text-[#cac6bb] hover:text-[#ffb230]'
              }`}
            >
              {lang === 'KM' ? 'ទំព័រដើម' : 'Store'}
            </button>
            <button
              onClick={() => setActiveScreen('my-orders')}
              className={`font-user text-sm font-semibold transition-colors flex items-center gap-1 ${
                activeScreen === 'my-orders' ? 'text-[#ffb230] font-bold' : 'text-[#cac6bb] hover:text-[#ffb230]'
              }`}
            >
              {lang === 'KM' ? 'ការបញ្ជាទិញ' : 'Orders'}
            </button>
            <button
              onClick={() => setActiveScreen('referral')}
              className={`font-user text-sm font-semibold transition-colors flex items-center gap-1 ${
                activeScreen === 'referral'
                  ? 'text-[#ffb230] font-bold'
                  : 'text-[#cac6bb] hover:text-[#ffb230]'
              }`}
            >
              <span className="text-[#3ECF8E]">🎁</span>
              <span>{lang === 'KM' ? 'ណែនាំ & រង្វាន់' : 'Refer & Earn'}</span>
            </button>
            <button
              onClick={() => setActiveScreen('help')}
              className={`font-user text-sm font-semibold transition-colors ${
                activeScreen === 'help'
                  ? 'text-[#ffb230] font-bold'
                  : 'text-[#cac6bb] hover:text-[#ffb230]'
              }`}
            >
              {lang === 'KM' ? 'ជំនួយ' : 'Help'}
            </button>
            <button
              onClick={() => setActiveScreen('profile')}
              className={`font-user text-sm font-semibold transition-colors ${
                activeScreen === 'profile' || activeScreen === 'security'
                  ? 'text-[#ffb230] font-bold'
                  : 'text-[#cac6bb] hover:text-[#ffb230]'
              }`}
            >
              {lang === 'KM' ? 'គណនី' : 'Account'}
            </button>
          </nav>
        )}

        {/* Right: Controls, Balance, Language, View Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3.5">
          {/* Balance Pill for Customer */}
          {!isAdminMode && (
            <button
              onClick={onOpenTopup}
              className="flex items-center gap-1 sm:gap-1.5 bg-[#1C1F29] hover:bg-[#282a31] border border-[#ffb230]/30 text-[#ffd7a1] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-price shadow-inner transition-all active:scale-95 group"
              title="Click to Top-up USD via KHQR"
            >
              <span className="text-[#3ECF8E] font-bold">$</span>
              <span className="font-bold text-[#ffb230] text-xs sm:text-sm">${(userBalanceUSD ?? 0).toFixed(2)}</span>
              <span className="bg-[#ffb230] text-[#291800] text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded font-bold ml-0.5 group-hover:scale-105 transition-transform">
                + Top Up
              </span>
            </button>
          )}

          {/* Desktop Alert Bell Button */}
          {onOpenNotificationModal && (
            <button
              onClick={onOpenNotificationModal}
              className="relative p-1.5 sm:p-2 rounded-xl bg-[#1C1F29]/80 hover:bg-[#1C1F29] border border-white/5 text-[#ffd7a1] hover:text-[#ffb230] transition-colors"
              title="Notifications & Audio"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E8433F] rounded-full animate-ping" />
              )}
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'KM' ? 'EN' : 'KM')}
            className="flex items-center gap-1 text-[#d6c4ae] hover:text-[#ffb230] transition-colors text-xs font-price bg-[#1C1F29]/80 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-white/5"
            title="Toggle Language (KM / EN)"
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="font-bold text-[11px] sm:text-xs">{lang}</span>
          </button>

          {/* Mode Switcher Button: ONLY displayed if currently in admin mode */}
          {isAdminMode && (
            <button
              onClick={() => setActiveScreen('store')}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-headline uppercase tracking-wider transition-all active:scale-95 bg-[#1C1F29] border border-[#3ECF8E] text-[#3ECF8E] hover:bg-[#3ECF8E]/10"
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">To Store</span>
            </button>
          )}

          {/* User Profile & Rank Badge in Store Header */}
          {isAdminMode ? (
            <button
              onClick={() => setActiveScreen('admin-dashboard')}
              className="flex items-center gap-1.5 sm:gap-2 p-0.5 sm:p-1 pl-1.5 sm:pl-2.5 rounded-full bg-[#1C1F29]/80 hover:bg-[#1C1F29] border border-[#ffb230]/40 transition-all group"
              title="Admin Profile"
            >
              <div className="flex flex-col items-end hidden md:flex leading-tight">
                <span className="font-headline text-xs text-[#ffd7a1]">
                  ADMIN
                </span>
                <span className="font-price text-[9px] font-bold text-[#ffb230] uppercase">
                  Staff Console
                </span>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-[#ffb230] shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_10px_rgba(255,178,48,0.3)]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGjl6eh5pUP_7c6Jvet7EisIdcMEmHdbe6fXeVnIwOC6MrLpaqzHUgiy9imwKdfKng_HXxJsfxjXYoTba2l4RxQvrGPb_p7mFQBmZ6poiEHqCOa1ICevgeq3OmRpMdDqqACeHtYY4gMCMvqbhDQcZhah4bMirl0SyNLZ9OhRpJpdfP_JKp4DLfy3aGZdXRPNcZS9R1vX_6UZLNuWZ-voATX8XsY3NcC8gbCl_x4CR3vKsUaf0vGWXW"
                  alt="Admin Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          ) : userProfile && rankInfo ? (
            <button
              onClick={() => setActiveScreen('profile')}
              className="flex items-center gap-1.5 sm:gap-2 p-0.5 sm:p-1 pl-1.5 sm:pl-2 rounded-full bg-[#1C1F29]/90 hover:bg-[#282a31] border border-white/10 hover:border-[#ffb230]/40 transition-all group shadow-md"
              title={`Logged in as @${userProfile.username} (${rankInfo.title}) - Click to view profile & rank`}
            >
              <div className="flex flex-col items-end leading-tight text-right hidden xs:flex">
                <span className="font-headline text-xs text-[#e2e2ec] group-hover:text-white transition-colors max-w-[70px] sm:max-w-[110px] truncate">
                  @{userProfile.username}
                </span>
                <span
                  className={`font-price text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.2 rounded-full border uppercase tracking-wider flex items-center gap-0.5 ${rankInfo.chipClass}`}
                >
                  <span>{rankInfo.icon}</span>
                  <span>{rankInfo.badgeLabel}</span>
                </span>
              </div>
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 ${rankInfo.avatarBorder} shrink-0 group-hover:scale-105 transition-transform`}
              >
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          ) : (
            <button
              onClick={() => setActiveScreen('profile')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-[#ffb230] shrink-0 hover:scale-105 transition-transform"
              title="User Profile"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCV3j4VML-lVWoaql9SA7mM_jmhuKq3z5ICBl-mVI5bBXY4pS6WXd_tOZ8PkLI9Vv6GTMIlFgnf6QiwoOszhs5DGGUxvMoqnDnVNcTWIVNnKjKcnKgs0JGbUZ78wivDcMmWXni4dGDPJt8dXFbjR_bo1eva4Fn3x0rjdiuE0uCrwJwO42IQR-gQYF6eCxZ9O628DwUDqFQ2o4-prFhIZqe0w2kVzDOM3ndfkRjW6WDgkdirsNk0roiB"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

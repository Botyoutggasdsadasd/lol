import React, { useState, useEffect } from 'react';
import { Product, Order, VisitorAnalyticsData, ActiveScreen, Coupon, StoreSettings, UserProfile, SongTrack, FullAppState } from '../../types';
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Boxes,
  PackageCheck,
  Plus,
  QrCode,
  Tag,
  ArrowUpRight,
  Zap,
  RefreshCw,
  Settings,
  Music,
  Bell,
  Volume2,
  Radio,
  Sparkles,
  Bot,
  Send,
  ShieldCheck,
  ArrowRight,
  Database,
  Download,
  Upload,
  FileJson,
} from 'lucide-react';
import { getNotificationPermission, sendTestDesktopNotification, isSoundAlertEnabled } from '../../utils/desktopNotification';
import { AdminBackupModal } from './AdminBackupModal';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  analytics: VisitorAnalyticsData;
  settings?: StoreSettings;
  userProfile?: UserProfile;
  songs?: SongTrack[];
  setActiveScreen: (screen: ActiveScreen) => void;
  onReleaseAllDrafts: () => void;
  onLogoutAdmin: () => void;
  onImportBackup?: (importedData: FullAppState, mode: 'overwrite' | 'merge') => Promise<boolean>;
  onResetToZero?: () => void;
  lang: 'KM' | 'EN';
  onOpenNotificationModal?: () => void;
  storeLogoUrl?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  coupons,
  analytics,
  settings,
  userProfile,
  songs,
  setActiveScreen,
  onReleaseAllDrafts,
  onLogoutAdmin,
  onImportBackup,
  onResetToZero,
  lang,
  onOpenNotificationModal,
  storeLogoUrl,
}) => {
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const approvedOrders = orders.filter((o) => o.status === 'delivered');
  const activeProducts = products.filter((p) => !p.isDraft);
  const inStockActiveProducts = activeProducts.filter((p) => p.stock > 0);
  const draftCount = products.filter((p) => p.isDraft).length;
  const totalRevenueUSD = approvedOrders.reduce((acc, curr) => acc + (curr?.totalUSD ?? curr?.product?.price ?? 0), 0);

  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [testSuccess, setTestSuccess] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleQuickTest = () => {
    sendTestDesktopNotification(storeLogoUrl, () => setActiveScreen('admin-orders'));
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen pb-28 pt-20 px-4 md:px-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top Welcome & Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-headline text-2xl md:text-3xl text-[#ffd7a1] uppercase tracking-wider">
              {lang === 'KM' ? 'ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល' : 'ADMIN DASHBOARD'}
            </h1>
            <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-bold font-price px-2.5 py-0.5 rounded-full border border-[#3ECF8E]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
              LIVE STORE
            </span>
          </div>
          <p className="font-price text-xs text-[#8B90A0] mt-1">
            {lang === 'KM'
              ? 'ទិដ្ឋភាពទូទៅនៃចំណូល ការបញ្ជាទិញ និងទំនិញក្នុងស្តុក'
              : 'Real-time overview of revenue, order queue, and inventory health'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('admin-add-item')}
            className="bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-xs px-4 py-2 rounded-xl uppercase font-bold chunky-btn-gold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'KM' ? 'បន្ថែមទំនិញ' : 'Add Product'}</span>
          </button>
          <button
            onClick={onLogoutAdmin}
            className="bg-[#E8433F]/15 hover:bg-[#E8433F]/25 text-[#E8433F] border border-[#E8433F]/30 font-price text-xs font-bold px-3.5 py-2 rounded-xl transition-colors active:scale-95"
            title="Logout from Admin Panel"
          >
            Logout
          </button>
        </div>
      </div>

      {/* High-Level Executive Summary Cards (Top of Dashboard) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Revenue (USD) */}
        <div
          id="summary-card-total-revenue"
          onClick={() => setActiveScreen('admin-orders')}
          className="bg-gradient-to-br from-[#1C1F29] to-[#14161D] border border-white/10 hover:border-[#3ECF8E]/60 rounded-3xl p-5 md:p-6 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 shadow-xl group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#3ECF8E]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#3ECF8E]/10 transition-colors" />

          <div>
            <div className="flex items-center justify-between">
              <span className="font-price text-xs text-[#8B90A0] uppercase font-bold tracking-wider">
                {lang === 'KM' ? 'ចំណូលសរុប (USD)' : 'Total Revenue (USD)'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <span className="font-headline text-3xl sm:text-4xl text-[#3ECF8E] font-bold tracking-tight block">
                ${totalRevenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="font-price text-xs text-[#ffd7a1] font-semibold mt-1 block">
                ≈ {(totalRevenueUSD * 4100).toLocaleString('en-US')} KHR (Bakong)
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
            <span className="bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30 text-[11px] font-price font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{approvedOrders.length} Completed</span>
            </span>
            <span className="text-[11px] font-price text-[#8B90A0] group-hover:text-[#3ECF8E] flex items-center gap-0.5 transition-colors">
              <span>View Orders</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 2: Pending Orders */}
        <div
          id="summary-card-pending-orders"
          onClick={() => setActiveScreen('admin-orders')}
          className={`bg-gradient-to-br from-[#1C1F29] to-[#14161D] border rounded-3xl p-5 md:p-6 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 shadow-xl group relative overflow-hidden ${
            pendingOrders.length > 0
              ? 'border-[#ffb230]/40 hover:border-[#ffb230] shadow-[0_0_20px_rgba(255,178,48,0.1)]'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffb230]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#ffb230]/10 transition-colors" />

          <div>
            <div className="flex items-center justify-between">
              <span className="font-price text-xs text-[#8B90A0] uppercase font-bold tracking-wider">
                {lang === 'KM' ? 'ការបញ្ជាទិញរង់ចាំ' : 'Pending Orders'}
              </span>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  pendingOrders.length > 0
                    ? 'bg-[#ffb230]/20 text-[#ffb230] border border-[#ffb230]/40 animate-pulse'
                    : 'bg-white/10 text-[#8B90A0]'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <span
                className={`font-headline text-3xl sm:text-4xl font-bold tracking-tight block ${
                  pendingOrders.length > 0 ? 'text-[#ffb230]' : 'text-[#e2e2ec]'
                }`}
              >
                {pendingOrders.length}
              </span>
              <span className="font-price text-xs text-[#8B90A0] mt-1 block">
                {pendingOrders.length > 0
                  ? 'Awaiting KHQR payment review & delivery'
                  : 'All customer orders cleared & delivered'}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
            <span
              className={`text-[11px] font-price font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                pendingOrders.length > 0
                  ? 'bg-[#ffb230]/20 text-[#ffb230] border-[#ffb230]/40'
                  : 'bg-[#3ECF8E]/20 text-[#3ECF8E] border-[#3ECF8E]/30'
              }`}
            >
              {pendingOrders.length > 0 ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Action Required</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>All Clear</span>
                </>
              )}
            </span>
            <span className="text-[11px] font-price text-[#8B90A0] group-hover:text-[#ffb230] flex items-center gap-0.5 transition-colors">
              <span>Process Queue</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 3: Active Products */}
        <div
          id="summary-card-active-products"
          onClick={() => setActiveScreen('admin-items')}
          className="bg-gradient-to-br from-[#1C1F29] to-[#14161D] border border-white/10 hover:border-[#00F0FF]/60 rounded-3xl p-5 md:p-6 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 shadow-xl group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#00F0FF]/10 transition-colors" />

          <div>
            <div className="flex items-center justify-between">
              <span className="font-price text-xs text-[#8B90A0] uppercase font-bold tracking-wider">
                {lang === 'KM' ? 'ទំនិញសកម្ម' : 'Active Products'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl sm:text-4xl text-[#00F0FF] font-bold tracking-tight">
                  {activeProducts.length}
                </span>
                <span className="font-price text-xs text-[#8B90A0]">
                  / {products.length} catalog total
                </span>
              </div>
              <span className="font-price text-xs text-[#8B90A0] mt-1 block">
                {inStockActiveProducts.length} items currently in stock
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
            <span className="bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 text-[11px] font-price font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <PackageCheck className="w-3 h-3" />
              <span>{draftCount > 0 ? `${draftCount} Drafts` : 'Catalog Live'}</span>
            </span>
            <span className="text-[11px] font-price text-[#8B90A0] group-hover:text-[#00F0FF] flex items-center gap-0.5 transition-colors">
              <span>Manage Items</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </section>

      {/* Top Banner: Draft Items Waiting (if any) */}
      {draftCount > 0 && (
        <div className="bg-gradient-to-r from-[#ffb230]/20 via-[#ffb230]/10 to-transparent border border-[#ffb230]/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffb230] text-[#291800] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-headline text-lg text-[#ffd7a1]">
                {draftCount} DRAFT ITEMS WAITING
              </h4>
              <p className="font-price text-xs text-[#8B90A0]">
                Pre-configured game accounts ready for public marketplace.
              </p>
            </div>
          </div>
          <button
            onClick={onReleaseAllDrafts}
            className="bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-xs px-5 py-2.5 rounded-xl uppercase font-bold chunky-btn-gold shadow-md shrink-0"
          >
            🚀 RELEASE ALL DRAFTS
          </button>
        </div>
      )}

      {/* Desktop Order Notification System Banner */}
      <div className="bg-[#1C1F29] border border-[#ffb230]/30 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ffb230] to-[#E8433F] text-[#291800] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,178,48,0.35)] shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-headline text-base text-[#ffd7a1] uppercase">
                Desktop Order Alerts & Sound Chime
              </h4>
              <span
                className={`font-price text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  notifPermission === 'granted'
                    ? 'bg-[#3ECF8E]/20 text-[#3ECF8E] border-[#3ECF8E]/40'
                    : notifPermission === 'denied'
                    ? 'bg-[#E8433F]/20 text-[#E8433F] border-[#E8433F]/40'
                    : 'bg-[#ffb230]/20 text-[#ffb230] border-[#ffb230]/40 animate-pulse'
                }`}
              >
                {notifPermission === 'granted'
                  ? '🟢 LIVE & ACTIVE'
                  : notifPermission === 'denied'
                  ? '🔴 BLOCKED BY BROWSER'
                  : '🟡 PERMISSION NEEDED'}
              </span>
            </div>
            <p className="font-price text-xs text-[#8B90A0] mt-0.5">
              Instant sound chime and OS notifications when customers place orders, even when minimized.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleQuickTest}
            className="flex-1 sm:flex-initial bg-[#11131a] hover:bg-[#282a31] border border-white/10 text-[#ffd7a1] hover:text-[#ffb230] font-headline text-xs px-3.5 py-2.5 rounded-xl uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Radio className={`w-3.5 h-3.5 ${testSuccess ? 'text-[#3ECF8E] animate-ping' : 'text-[#ffb230]'}`} />
            <span>{testSuccess ? 'Chime Sent! 🔔' : 'Test Sound'}</span>
          </button>

          {onOpenNotificationModal && (
            <button
              onClick={onOpenNotificationModal}
              className="flex-1 sm:flex-initial bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-xs px-4 py-2.5 rounded-xl uppercase font-bold chunky-btn-gold transition-all flex items-center justify-center gap-1.5 shadow-md shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure</span>
            </button>
          )}
        </div>
      </div>

      {/* Telegram Dual-Bot & Order Dispatch Section Banner */}
      <div className="bg-gradient-to-r from-[#00F0FF]/15 via-[#1C1F29] to-[#6F00BE]/20 border border-[#00F0FF]/30 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 flex items-center justify-center font-bold shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-headline text-sm md:text-base text-[#ffd7a1] uppercase">
                {lang === 'KM' ? 'ប្រព័ន្ធ Telegram Bots & ត្រួតពិនិត្យ Username' : 'Telegram Dual-Bot & Profile Inspector'}
              </h3>
              <span className="bg-[#3ECF8E]/15 text-[#3ECF8E] border border-[#3ECF8E]/30 text-[10px] font-price font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
                Real-Time Orders Alert Ready
              </span>
            </div>
            <p className="font-price text-xs text-[#8B90A0] mt-0.5">
              {lang === 'KM'
                ? 'Bot #1 ទទួលដំណឹង Order ភ្លាមៗ • Bot #2 សេវាអតិថិជន Mini App • ប្រព័ន្ធ Check Roblox Profile'
                : 'Bot 1: Real-time Order Alerts • Bot 2: Customer Mini App • Live Roblox/Telegram Profile Inspector'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveScreen('admin-bot-config')}
            className="w-full sm:w-auto bg-[#00F0FF] hover:bg-[#33f3ff] text-[#05131A] font-headline text-xs px-5 py-3 rounded-xl uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 shrink-0"
          >
            <Settings className="w-4 h-4" />
            <span>{lang === 'KM' ? 'កំណត់ Telegram Bots' : 'Configure Bots & Scanner'}</span>
          </button>
        </div>
      </div>

      {/* Main Feature Navigation Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveScreen('admin-orders')}
          className="bg-[#1C1F29] hover:bg-[#282a31] border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group shadow-md"
        >
          <div className="w-11 h-11 rounded-xl bg-[#ffb230]/15 text-[#ffb230] group-hover:scale-110 transition-transform flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="font-headline text-xs text-[#e2e2ec] uppercase">
            Orders ({pendingOrders.length})
          </span>
        </button>

        <button
          onClick={() => setActiveScreen('admin-bot-config')}
          className="bg-[#1C1F29] hover:bg-[#282a31] border border-[#00F0FF]/30 hover:border-[#00F0FF] rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group shadow-md"
        >
          <div className="w-11 h-11 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] group-hover:scale-110 transition-transform flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-headline text-xs text-[#00F0FF] uppercase">
            Telegram Bots
          </span>
        </button>

        <button
          onClick={() => setActiveScreen('admin-items')}
          className="bg-[#1C1F29] hover:bg-[#282a31] border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group shadow-md"
        >
          <div className="w-11 h-11 rounded-xl bg-[#6F00BE]/20 text-[#d6b2fc] group-hover:scale-110 transition-transform flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <span className="font-headline text-xs text-[#e2e2ec] uppercase">
            Inventory ({products.length})
          </span>
        </button>

        <button
          onClick={() => setActiveScreen('admin-add-item')}
          className="bg-[#1C1F29] hover:bg-[#282a31] border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group shadow-md"
        >
          <div className="w-11 h-11 rounded-xl bg-[#3ECF8E]/15 text-[#3ECF8E] group-hover:scale-110 transition-transform flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-headline text-xs text-[#e2e2ec] uppercase">
            + Add Product
          </span>
        </button>

        <button
          onClick={() => setActiveScreen('admin-settings')}
          className="bg-[#1C1F29] hover:bg-[#282a31] border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group shadow-md"
        >
          <div className="w-11 h-11 rounded-xl bg-[#ffb230]/20 text-[#ffb230] group-hover:scale-110 transition-transform flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="font-headline text-xs text-[#e2e2ec] uppercase">
            KHQR & Settings
          </span>
        </button>

        <button
          onClick={() => setActiveScreen('admin-coupons')}
          className="bg-[#1C1F29] hover:bg-[#282a31] border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group shadow-md"
        >
          <div className="w-11 h-11 rounded-xl bg-[#ffb230]/15 text-[#ffd7a1] group-hover:scale-110 transition-transform flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
          <span className="font-headline text-xs text-[#e2e2ec] uppercase">
            Coupons ({coupons.length})
          </span>
        </button>

        <button
          onClick={() => setIsBackupModalOpen(true)}
          className="col-span-2 sm:col-span-2 lg:col-span-6 bg-gradient-to-r from-[#1C1F29] via-[#222633] to-[#1C1F29] hover:border-[#ffb230] border border-[#ffb230]/30 rounded-2xl p-3.5 flex items-center justify-between transition-all active:scale-[0.99] group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffb230]/20 text-[#ffb230] group-hover:scale-110 transition-transform flex items-center justify-center border border-[#ffb230]/30">
              <Database className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-headline text-sm text-[#ffd7a1] uppercase tracking-wide">
                  {lang === 'KM' ? 'មជ្ឈមណ្ឌលគ្រប់គ្រងទិន្នន័យ & បម្រុងទុក (Export / Import Backup)' : 'Database Backup & Restore Hub'}
                </span>
                <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-price font-bold px-2 py-0.5 rounded-full uppercase border border-[#3ECF8E]/30">
                  Full Store Control
                </span>
              </div>
              <p className="font-price text-xs text-[#8B90A0]">
                {lang === 'KM'
                  ? 'ទាញយក JSON/CSV Backup ឬ Import ទិន្នន័យផលិតផល Order និងការកំណត់ទាំងអស់'
                  : 'Export complete store JSON/CSV backups, restore from files, or manage database slate'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block bg-[#ffb230] text-[#291800] px-3 py-1.5 rounded-xl font-headline text-xs font-bold uppercase">
              Manage Database
            </span>
            <ArrowRight className="w-4 h-4 text-[#ffb230] group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </section>

      {/* Main Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visitor 7-Day Trend Chart */}
        <div className="lg:col-span-2 bg-[#1C1F29] rounded-2xl p-5 md:p-6 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-price text-xs text-[#8B90A0] uppercase font-bold">
                VISITORS (LAST 7 DAYS)
              </span>
              <h3 className="font-headline text-2xl text-[#ffd7a1] mt-0.5">
                45,280 Visits
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-[#3ECF8E]/20 text-[#3ECF8E] font-price text-xs font-bold px-2.5 py-1 rounded-full border border-[#3ECF8E]/30">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2%</span>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2">
            {[
              { day: 'Mon', count: 4200, height: '55%' },
              { day: 'Tue', count: 5800, height: '70%' },
              { day: 'Wed', count: 5100, height: '62%' },
              { day: 'Thu', count: 6900, height: '85%' },
              { day: 'Fri', count: 8200, height: '95%' },
              { day: 'Sat', count: 7600, height: '90%' },
              { day: 'Sun', count: 8900, height: '100%' },
            ].map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-[#11131a] rounded-lg h-32 flex items-end p-1 relative">
                  <div
                    className="w-full bg-gradient-to-t from-[#ffb230] to-[#ffd7a1] rounded-md transition-all duration-500 group-hover:brightness-125"
                    style={{ height: d.height }}
                  />
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0c0e15] border border-white/10 text-[10px] font-price text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {d.count.toLocaleString()}
                  </span>
                </div>
                <span className="font-price text-xs text-[#8B90A0]">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visitor Insights Side Panel */}
        <div className="bg-[#1C1F29] rounded-2xl p-5 md:p-6 border border-white/10 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-headline text-lg text-[#e2e2ec] uppercase">
              Live Insights
            </h3>
            <span className="flex items-center gap-1 text-[11px] text-[#3ECF8E] font-price font-bold">
              <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
              Live
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#8B90A0] font-sans">Visitors Today</span>
              <span className="font-price text-base font-bold text-[#ffd7a1]">
                {analytics.liveNow.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-[#8B90A0] font-sans">TG Referred</span>
              <span className="font-price text-base font-bold text-[#3ECF8E]">
                {analytics.tgReferred}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-[#8B90A0] font-sans">Top Page</span>
              <span className="font-price text-xs font-bold text-[#e2e2ec] truncate max-w-[140px]">
                {analytics.topPage}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-[#8B90A0] font-sans">Est. USD Sales</span>
              <span className="font-price text-base font-bold text-[#ffb230]">
                ${(totalRevenueUSD || 0).toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveScreen('admin-analytics')}
              className="flex-1 bg-[#282a31] hover:bg-[#33343c] border border-white/10 text-[#ffd7a1] font-price text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onLogoutAdmin}
              className="bg-[#E8433F]/15 hover:bg-[#E8433F]/25 text-[#E8433F] border border-[#E8433F]/30 font-price text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
              title="Logout from Admin Panel"
            >
              Logout
            </button>
          </div>
        </div>
      </section>

      {/* Database Backup & Data Management Modal */}
      {isBackupModalOpen && (
        <AdminBackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          products={products}
          orders={orders}
          coupons={coupons}
          settings={settings || {
            storeName: 'Uchiro Store',
            storeNameKhmer: 'ហាង អ៊ុយឈីរ៉ូ',
            tagline: "Cambodia's #1 Automated Roblox Store",
            logoUrl: storeLogoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
            telegramUrl: 'https://t.me/Noreakyout',
            supportPhone: '+855 16866125',
            merchantName: 'UCHIRO STORE',
            merchantCity: 'Phnom Penh',
            bakongAccountId: 'noreak_store@aclb',
            announcement: 'ស្វាគមន៍មកកាន់ Uchiro Store!',
            exchangeRateKHR: 4100,
          }}
          userProfile={userProfile}
          songs={songs}
          onImportBackup={onImportBackup || (async () => false)}
          onResetToZero={onResetToZero}
          lang={lang}
        />
      )}
    </div>
  );
};

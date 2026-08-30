import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  Order,
  UserProfile,
  Coupon,
  VisitorAnalyticsData,
  ActiveScreen,
  CategoryType,
  StoreSettings,
  SongTrack,
  FullAppState,
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_USER_PROFILE,
  INITIAL_COUPONS,
  INITIAL_VISITOR_ANALYTICS,
  INITIAL_STORE_SETTINGS,
  INITIAL_SONGS,
} from './data/mockData';
import { api } from './utils/api';
import { sendOrderDesktopNotification, playOrderAlertChime } from './utils/desktopNotification';
import { getMemberRankInfo, verifyResellerCode } from './utils/memberRank';
import { NotificationManagerModal } from './components/NotificationManagerModal';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { StoreHero } from './components/StoreHero';
import { StoreFooter } from './components/StoreFooter';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderCompleteScreen } from './components/OrderCompleteScreen';
import { TopUpModal } from './components/TopUpModal';
import { OrderHistoryScreen } from './components/OrderHistoryScreen';
import { UserProfileScreen } from './components/UserProfileScreen';
import { SecuritySettingsScreen } from './components/SecuritySettingsScreen';
import { ReferralScreen } from './components/ReferralScreen';
import { HelpSupportScreen } from './components/HelpSupportScreen';
import { MusicPlayer } from './components/MusicPlayer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminAddItem } from './components/admin/AdminAddItem';
import { AdminItemsList } from './components/admin/AdminItemsList';
import { AdminAnalytics } from './components/admin/AdminAnalytics';
import { AdminCoupons } from './components/admin/AdminCoupons';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminStoreBotConfig } from './components/admin/AdminStoreBotConfig';
import { AdminLogin } from './components/admin/AdminLogin';
import { Search, Flame, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';

export function App() {
  // State loaded from persistent Backend Database (/api/state)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [analytics, setAnalytics] = useState<VisitorAnalyticsData>(INITIAL_VISITOR_ANALYTICS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [songs, setSongs] = useState<SongTrack[]>(INITIAL_SONGS);

  // Desktop Notifications Modal State
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialOrdersLoadRef = useRef<boolean>(true);

  // Authentication state for Admin Panel
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('uchiro_admin_token');
  });

  // Navigation & Modal state
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const isAdminRoute =
      path.startsWith('/admin') ||
      path.includes('admin') ||
      hash.includes('admin') ||
      search.includes('admin');

    if (isAdminRoute) {
      const token = localStorage.getItem('uchiro_admin_token');
      return token ? 'admin-dashboard' : 'admin-login';
    }
    return 'store';
  });

  // Keep browser URL synchronized with current active screen
  useEffect(() => {
    const isAdmin = activeScreen.startsWith('admin-');
    const path = window.location.pathname.toLowerCase();
    if (isAdmin) {
      if (!path.startsWith('/admin')) {
        window.history.pushState(null, '', '/admin');
      }
    } else {
      if (path.startsWith('/admin') || path.includes('admin')) {
        window.history.pushState(null, '', '/');
      }
    }
  }, [activeScreen]);

  // Listen for browser navigation (e.g. typing /admin, clicking back/forward)
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const isAdminRoute =
        path.startsWith('/admin') ||
        path.includes('admin') ||
        hash.includes('admin') ||
        search.includes('admin');

      if (isAdminRoute) {
        const token = localStorage.getItem('uchiro_admin_token');
        if (token) {
          setActiveScreen((prev) =>
            prev.startsWith('admin-') && prev !== 'admin-login' ? prev : 'admin-dashboard'
          );
        } else {
          setActiveScreen('admin-login');
        }
      } else {
        setActiveScreen((prev) => (prev.startsWith('admin-') ? 'store' : prev));
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'KM' | 'EN'>('KM');

  // Modals & Selected items
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupDefaultRefCode, setTopupDefaultRefCode] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Fetch initial full state from backend database on mount
  useEffect(() => {
    async function fetchBackendState() {
      try {
        const fullState = await api.getFullState();
        if (fullState) {
          if (fullState.products) setProducts(fullState.products);
          if (fullState.orders) {
            setOrders(fullState.orders);
            knownOrderIdsRef.current = new Set(fullState.orders.map((o) => o.id));
            if (fullState.orders.length > 0) {
              setLastCompletedOrder(fullState.orders[0]);
            }
          }
          if (fullState.userProfile) setUserProfile(fullState.userProfile);
          if (fullState.coupons) setCoupons(fullState.coupons);
          if (fullState.analytics) setAnalytics(fullState.analytics);
          if (fullState.settings) setSettings(fullState.settings);
          if (fullState.songs) setSongs(fullState.songs);
        }
      } catch (err) {
        console.warn('Using local fallback state:', err);
      } finally {
        isInitialOrdersLoadRef.current = false;
      }
    }
    fetchBackendState();
  }, []);

  // Background Order Poller (every 4s) to detect new orders and trigger desktop notifications + chime
  useEffect(() => {
    const pollInterval = window.setInterval(async () => {
      try {
        const remoteOrders = await api.getOrders();
        if (remoteOrders && Array.isArray(remoteOrders)) {
          const newOrdersList: Order[] = [];
          remoteOrders.forEach((ord) => {
            if (!knownOrderIdsRef.current.has(ord.id)) {
              newOrdersList.push(ord);
              knownOrderIdsRef.current.add(ord.id);
            }
          });

          if (newOrdersList.length > 0) {
            setOrders(remoteOrders);

            if (!isInitialOrdersLoadRef.current) {
              const latestOrder = newOrdersList[0];
              // Fire Native Desktop Notification + Chime for Admins
              sendOrderDesktopNotification(
                latestOrder,
                settings.logoUrl,
                () => {
                  setActiveScreen('admin-orders');
                }
              );
            }
          }
        }
      } catch (_) {
        // Ignore network polling interruptions
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [settings.logoUrl]);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Order Handlers
  const handleProceedToCheckout = (product: Product) => {
    setSelectedProduct(null);
    setCheckoutProduct(product);
  };

  const handleCompleteOrder = async (newOrder: Order) => {
    setCheckoutProduct(null);
    setOrders((prev) => [newOrder, ...prev]);
    setLastCompletedOrder(newOrder);
    knownOrderIdsRef.current.add(newOrder.id);

    // Update user lifetime spent, wallet balance (if paid with store balance), and member rank
    const wasPaidWithBalance = newOrder.paymentMethod === 'Balance';
    const userCurrentBal = userProfile?.balanceUSD ?? 0;
    const newBalance = wasPaidWithBalance
      ? Math.max(0, parseFloat((userCurrentBal - (newOrder.totalUSD || 0)).toFixed(2)))
      : userCurrentBal;
    const updatedSpent = (userProfile?.totalSpentUSD || 0) + (newOrder.totalUSD || 0);
    const rankInfo = getMemberRankInfo(updatedSpent);
    const updatedProfile: UserProfile = {
      ...userProfile,
      balanceUSD: newBalance,
      totalSpentUSD: updatedSpent,
      rank: rankInfo.title,
    };
    setUserProfile(updatedProfile);

    // Play chime and send desktop notification
    sendOrderDesktopNotification(newOrder, settings.logoUrl, () => {
      setActiveScreen('admin-orders');
    });

    // Save to Backend Database
    try {
      await api.createOrder(newOrder);
      await api.updateUserProfile({
        balanceUSD: newBalance,
        totalSpentUSD: updatedSpent,
        rank: rankInfo.title,
      });
      // Deduct stock in backend
      await api.updateProduct(newOrder.product.id, {
        stock: Math.max(0, newOrder.product.stock - 1),
      });
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === newOrder.product.id) {
            const nextStock = Math.max(0, p.stock - (newOrder.quantity || 1));
            return {
              ...p,
              stock: nextStock,
              isSold: nextStock <= 0,
            };
          }
          return p;
        })
      );

      // Dispatch Telegram Order Alert with Product Name & Buyer Username
      const tgRes = await api.sendTelegramOrderAlert(newOrder);
      if (tgRes) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === newOrder.id
              ? {
                  ...o,
                  telegramDispatched: tgRes.dispatched,
                  telegramDispatchStatus: tgRes.status,
                  telegramDispatchedAt: new Date().toLocaleTimeString(),
                  productName: tgRes.productName || newOrder.product?.title,
                  buyerUsername: tgRes.buyerUsername || newOrder.customerName,
                }
              : o
          )
        );
      }
    } catch (err) {
      console.error('Failed to sync order to server:', err);
    }

    setActiveScreen('order-complete');
  };

  const handleTopUpSuccess = async (amountUSD: number, bonusUSD: number = 0, refCode?: string) => {
    const totalCredited = amountUSD + bonusUSD;
    const updatedBalance = userProfile.balanceUSD + totalCredited;
    const updates: Partial<UserProfile> = {
      balanceUSD: updatedBalance,
    };
    if (refCode) {
      updates.referredBy = refCode;
    }
    setUserProfile((prev) => ({ ...prev, ...updates }));
    try {
      await api.updateUserProfile(updates);
      if (bonusUSD > 0) {
        showToast(`Added $${amountUSD.toFixed(2)} + $${bonusUSD.toFixed(2)} (5% Referral Bonus) to balance!`);
      } else {
        showToast(`Successfully added $${amountUSD.toFixed(2)} USD to balance!`);
      }
    } catch (err) {
      console.error('Failed to save profile balance:', err);
    }
    setTimeout(() => {
      setIsTopupOpen(false);
    }, 1500);
  };

  const handleSimulateReferralBonus = async (friendName: string, topUpAmountUSD: number) => {
    const validAmount = Number(topUpAmountUSD) || 0;
    const bonusUSD = parseFloat((validAmount * 0.05).toFixed(2));
    const newReward = {
      id: `ref-${Date.now()}`,
      friendUsername: friendName,
      topUpAmountUSD: validAmount,
      bonusEarnedUSD: bonusUSD,
      date: 'Just now • 5% Bonus Credited',
    };

    const updatedEarnings = (userProfile?.referralEarningsUSD || 0) + bonusUSD;
    const updatedCount = (userProfile?.referralCount || 0) + 1;
    const updatedHistory = [newReward, ...(userProfile?.referralHistory || [])];
    const updatedBalance = (userProfile?.balanceUSD || 0) + bonusUSD;

    const updates: Partial<UserProfile> = {
      balanceUSD: updatedBalance,
      referralEarningsUSD: updatedEarnings,
      referralCount: updatedCount,
      referralHistory: updatedHistory,
    };

    setUserProfile((prev) => ({ ...prev, ...updates }));

    try {
      await api.updateUserProfile(updates);
      showToast(`🎉 Friend ${friendName} topped up $${validAmount.toFixed(2)}! You earned +$${bonusUSD.toFixed(2)} USD (5%)!`);
    } catch (err) {
      console.error('Failed to sync referral bonus:', err);
    }
  };

  // Admin Order Actions
  const handleApproveOrder = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered' } : o))
    );
    try {
      await api.updateOrderStatus(orderId, 'delivered', adminToken || '');
      showToast('Order approved & credentials released!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'rejected' } : o))
    );
    try {
      await api.updateOrderStatus(orderId, 'rejected', adminToken || '');
      showToast('Order rejected.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    // 1. Immediately remove from state
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    // 2. Clear from last completed order if matching
    if (lastCompletedOrder?.id === orderId) {
      setLastCompletedOrder(null);
    }

    try {
      const ok = await api.deleteOrder(orderId, adminToken || '');
      if (ok) {
        showToast(`Order ${orderId} deleted successfully.`);
      } else {
        showToast(`Removed order ${orderId}.`);
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  const handleDeleteOrdersByStatus = async (status?: string) => {
    setOrders((prev) => (status ? prev.filter((o) => o.status !== status) : []));
    try {
      await api.deleteOrdersByStatus(status, adminToken || '');
      showToast(status ? `Cleared all ${status} orders.` : 'All orders deleted.');
    } catch (err) {
      console.error('Failed to clear orders by status:', err);
    }
  };

  const handleResendTelegramAlert = async (orderId: string) => {
    try {
      const res = await api.resendTelegramOrderAlert(orderId);
      if (res.dispatched) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  telegramDispatched: true,
                  telegramDispatchStatus: 'success',
                  telegramDispatchedAt: new Date().toLocaleTimeString(),
                }
              : o
          )
        );
        showToast(`✅ Alert for ${orderId} successfully dispatched to Telegram!`);
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  telegramDispatched: false,
                  telegramDispatchStatus: 'failed',
                }
              : o
          )
        );
        showToast(`❌ Failed to dispatch Telegram alert for ${orderId}. Check bot settings.`);
      }
    } catch (err) {
      console.error('Failed to resend telegram alert:', err);
      showToast('Error connecting to Telegram dispatch endpoint.');
    }
  };

  // Admin Product Actions
  const handleAddProduct = async (newProduct: Product) => {
    try {
      const saved = await api.createProduct(newProduct, adminToken || '');
      setProducts((prev) => [saved, ...prev]);
      showToast(`Product "${saved.title}" added to store!`);
      setActiveScreen('admin-items');
    } catch (err) {
      console.error('Failed to create product on backend:', err);
      setProducts((prev) => [newProduct, ...prev]);
      setActiveScreen('admin-items');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId, adminToken || '');
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast('Product deleted from inventory.');
    } catch (err) {
      console.error('Failed to delete product:', err);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const updated = await api.updateProduct(productId, updates, adminToken || '');
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      showToast('Product updated successfully!');
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  const handleReleaseAllDrafts = async () => {
    setProducts((prev) => prev.map((p) => ({ ...p, isDraft: false })));
    for (const p of products.filter((x) => x.isDraft)) {
      try {
        await api.updateProduct(p.id, { isDraft: false }, adminToken || '');
      } catch (err) {
        console.error(err);
      }
    }
    showToast('All draft products published to live marketplace!');
  };

  // Admin Settings & BGM Actions
  const handleSaveSettings = async (newSettings: StoreSettings) => {
    setSettings(newSettings);
    try {
      await api.updateSettings(newSettings, adminToken || '');
      showToast('Store & KHQR configuration saved!');
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const handleSaveSongs = async (newSongs: SongTrack[]) => {
    setSongs(newSongs);
    try {
      await api.updateSongs(newSongs, adminToken || '');
      showToast('Music playlist updated!');
    } catch (err) {
      console.error('Failed to update songs:', err);
    }
  };

  const handleResetToZero = async () => {
    try {
      const resetData = await api.resetToZeroSlate(adminToken || '');
      setProducts(resetData.products || []);
      setOrders(resetData.orders || []);
      showToast('Clean slate initialized! You can now add products from zero.');
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };

  const handleImportBackup = async (importedData: FullAppState, mode: 'overwrite' | 'merge'): Promise<boolean> => {
    try {
      const res = await api.importBackup(importedData, mode);
      const db = res?.data || (res as any)?.database;
      if (db) {
        if (db.products) setProducts(db.products);
        if (db.orders) setOrders(db.orders);
        if (db.coupons) setCoupons(db.coupons);
        if (db.settings) setSettings(db.settings);
        if (db.userProfile) setUserProfile(db.userProfile);
        if (db.songs) setSongs(db.songs);
        if (db.analytics) setAnalytics(db.analytics);
        showToast('Backup restored successfully! All data updated.');
        return true;
      } else {
        if (importedData.products) setProducts(importedData.products);
        if (importedData.orders) setOrders(importedData.orders);
        if (importedData.coupons) setCoupons(importedData.coupons);
        if (importedData.settings) setSettings(importedData.settings);
        if (importedData.userProfile) setUserProfile(importedData.userProfile);
        if (importedData.songs) setSongs(importedData.songs);
        showToast('Backup loaded and applied to store!');
        return true;
      }
    } catch (err) {
      console.error('Failed to import backup:', err);
      showToast('Error importing backup. Please verify JSON file.');
      return false;
    }
  };

  // Admin Coupons Actions
  const handleAddCoupon = async (newCoupon: Coupon) => {
    try {
      const saved = await api.createCoupon(newCoupon, adminToken || '');
      setCoupons((prev) => [saved, ...prev]);
      showToast(`Coupon "${saved.code}" activated!`);
    } catch (err) {
      console.error(err);
      setCoupons((prev) => [newCoupon, ...prev]);
    }
  };

  const handleToggleCoupon = (code: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.code === code ? { ...c, active: !c.active } : c))
    );
  };

  // Admin Auth handler
  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('uchiro_admin_token', token);
    setActiveScreen('admin-dashboard');
    showToast('Welcome to Uchiro Admin Suite!');
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('uchiro_admin_token');
    setActiveScreen('store');
    showToast('Logged out of Admin Portal.');
  };

  const handleRedeemResellerCode = async (
    code: string
  ): Promise<{ success: boolean; message?: string }> => {
    const isMatch = verifyResellerCode(code);
    if (!isMatch) {
      return {
        success: false,
        message:
          lang === 'KM'
            ? 'កូដ Reseller មិនត្រឹមត្រូវទេ។ សូមទាក់ទង Admin លើ Telegram (@uchirostore) ដើម្បីស្នើសុំកូដ!'
            : 'Invalid Reseller Code. Please contact Admin on Telegram (@uchirostore) to request a valid VIP code!',
      };
    }

    const updates: Partial<UserProfile> = {
      isResellerUnlocked: true,
      rank: 'Reseller VIP',
      resellerRedeemedCode: code.trim().toUpperCase(),
      resellerRedeemedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const newProfile = { ...userProfile, ...updates };
    setUserProfile(newProfile);
    localStorage.setItem('uchiro_user', JSON.stringify(newProfile));

    try {
      await api.updateUserProfile(updates);
    } catch (err) {
      console.error('Failed to sync user profile:', err);
    }

    showToast(
      lang === 'KM'
        ? '🎉 ឋានៈ Reseller VIP ត្រូវបានបើកដំណើរការ! បញ្ចុះតម្លៃ ២០% គ្រប់មុខទំនិញ!'
        : '🎉 Reseller VIP Rank Unlocked! 20% Auto Discount enabled.'
    );

    return {
      success: true,
      message:
        lang === 'KM'
          ? '🎉 អបអរសាទរ! អ្នកបានបើកដំណើរការឋានៈ Reseller VIP ជោគជ័យហើយ (ទទួលបានការបញ្ចុះតម្លៃ ២០% គ្រប់មុខទំនិញ)!'
          : '🎉 Congratulations! You have successfully unlocked Reseller VIP Rank (20% Auto Discount on all products)!',
    };
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    localStorage.setItem('uchiro_user', JSON.stringify(updated));
    try {
      await api.updateUserProfile(updates);
      showToast(lang === 'KM' ? '✅ បានកែប្រែព័ត៌មានគណនីជោគជ័យ!' : '✅ Profile updated successfully!');
    } catch (err) {
      console.error('Failed to sync profile update:', err);
    }
  };

  const handleAdminPortalClick = () => {
    if (adminToken) {
      setActiveScreen('admin-dashboard');
    } else {
      setActiveScreen('admin-login');
    }
  };

  // Check if current screen is admin-protected
  const isAdminScreen = activeScreen.startsWith('admin-') && activeScreen !== 'admin-login';

  // Filtered store products for customers
  const filteredProducts = products.filter((p) => {
    if (p.isDraft) return false;
    if (settings.hideSoldOutProducts && (p.isSold || p.stock <= 0)) return false;
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.titleKhmer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#0c0e15] text-[#e2e2ec] selection:bg-[#ffb230] selection:text-[#291800] relative flex flex-col justify-between">
      {/* Background Music Ambient System */}
      <MusicPlayer songs={songs} defaultVolume={settings.defaultVolume} />

      {/* Floating Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-4 z-[100] bg-[#1C1F29] border border-[#ffb230] text-[#ffd7a1] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 font-price text-xs font-bold animate-[slideDown_0.3s_ease-out]">
          <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Desktop Order Notification & Sound Control Center Modal */}
      <NotificationManagerModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        logoUrl={settings.logoUrl}
        onViewOrders={() => {
          setIsNotificationModalOpen(false);
          setActiveScreen('admin-orders');
        }}
      />

      {/* Top Application Bar with dynamic branding */}
      <TopAppBar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        lang={lang}
        setLang={setLang}
        userBalanceUSD={userProfile.balanceUSD}
        pendingOrdersCount={pendingOrdersCount}
        onOpenTopup={() => setIsTopupOpen(true)}
        settings={settings}
        isAdminAuthenticated={!!adminToken}
        onAdminPortalClick={handleAdminPortalClick}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        userProfile={userProfile}
      />

      {/* Main View Router */}
      <main className="w-full flex-1">
        {/* Admin Login Gate: If navigating to any admin screen without valid token */}
        {isAdminScreen && !adminToken ? (
          <AdminLogin
            onLoginSuccess={handleAdminLoginSuccess}
            onCancel={() => setActiveScreen('store')}
            onBackToStore={() => setActiveScreen('store')}
            settings={settings}
            lang={lang}
          />
        ) : (
          <>
            {/* Customer Store Front */}
            {activeScreen === 'store' && (
              <div className="max-w-[1280px] mx-auto px-3 sm:px-4 md:px-8 pb-12 pt-14 sm:pt-16 md:pt-20">
                {/* Store Hero Banner with dynamic Logo and Announcement */}
                <StoreHero settings={settings} lang={lang} />

                {/* Category Grid Filter */}
                <CategoryGrid
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  lang={lang}
                  products={products}
                />

                {/* Search & Header Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-5 sm:mt-8 md:mt-10 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#ffb230]" />
                    <h2 className="font-headline text-xl sm:text-2xl md:text-3xl text-[#ffd7a1] uppercase tracking-wider">
                      {lang === 'KM' ? 'ទំនិញពេញនិយម (FEATURED ITEMS)' : 'FEATURED ITEMS'}
                    </h2>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B90A0]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={lang === 'KM' ? 'ស្វែងរកគណនី, ផ្លែឈើ...' : 'Search items...'}
                      className="w-full bg-[#1C1F29] border border-white/10 text-[#e2e2ec] rounded-xl pl-10 pr-4 py-2 font-price text-sm focus:outline-none focus:border-[#ffb230]"
                    />
                  </div>
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 bg-[#14161D] rounded-3xl border border-white/5 space-y-3">
                    <Sparkles className="w-10 h-10 text-[#8B90A0] mx-auto opacity-50" />
                    <h3 className="font-headline text-xl text-[#e2e2ec] uppercase">
                      No items in store yet
                    </h3>
                    <p className="font-price text-xs text-[#8B90A0] max-w-sm mx-auto">
                      Inventory is being stocked. Admins can log in to add products with custom images and USD pricing.
                    </p>
                    <button
                      onClick={handleAdminPortalClick}
                      className="bg-[#ffb230] text-[#291800] font-headline text-xs px-4 py-2 rounded-xl uppercase font-bold chunky-btn-gold mt-2"
                    >
                      + Add Products as Admin
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={setSelectedProduct}
                        lang={lang}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin Login Explicit Screen */}
            {activeScreen === 'admin-login' && (
              <AdminLogin
                onLoginSuccess={handleAdminLoginSuccess}
                onCancel={() => setActiveScreen('store')}
                onBackToStore={() => setActiveScreen('store')}
                settings={settings}
                lang={lang}
              />
            )}

            {/* Order Complete Screen with Live 2FA TOTP Generator */}
            {activeScreen === 'order-complete' && lastCompletedOrder && (
              <OrderCompleteScreen
                order={lastCompletedOrder}
                onGoHome={() => setActiveScreen('store')}
                onViewOrders={() => setActiveScreen('my-orders')}
                lang={lang}
              />
            )}

            {/* Customer Order History */}
            {activeScreen === 'my-orders' && (
              <OrderHistoryScreen
                orders={orders}
                onSelectOrder={(order) => {
                  setLastCompletedOrder(order);
                  setActiveScreen('order-complete');
                }}
                onGoHome={() => setActiveScreen('store')}
                lang={lang}
              />
            )}

            {/* Top-up Balance View */}
            {activeScreen === 'topup' && (
              <div className="pt-14 sm:pt-18">
                <TopUpModal
                  userBalanceUSD={userProfile.balanceUSD}
                  defaultReferralCode={topupDefaultRefCode}
                  onClose={() => setActiveScreen('store')}
                  onTopUpSuccess={(amt, bonus, refCode) => {
                    handleTopUpSuccess(amt, bonus, refCode);
                    setActiveScreen('store');
                  }}
                  lang={lang}
                />
              </div>
            )}

            {/* Customer Profile */}
            {activeScreen === 'profile' && (
              <UserProfileScreen
                userProfile={userProfile}
                setActiveScreen={setActiveScreen}
                onOpenTopup={(defaultCode) => {
                  setTopupDefaultRefCode(defaultCode || '');
                  setIsTopupOpen(true);
                }}
                onUpdateProfile={handleUpdateProfile}
                onSimulateReferralBonus={handleSimulateReferralBonus}
                onRedeemResellerCode={handleRedeemResellerCode}
                onGoHome={() => setActiveScreen('store')}
                lang={lang}
              />
            )}

            {/* Referral & Rewards Dedicated Page */}
            {activeScreen === 'referral' && (
              <ReferralScreen
                userProfile={userProfile}
                onOpenTopup={(defaultCode) => {
                  setTopupDefaultRefCode(defaultCode || '');
                  setIsTopupOpen(true);
                }}
                onSimulateReferralBonus={handleSimulateReferralBonus}
                onGoHome={() => setActiveScreen('store')}
                lang={lang}
              />
            )}

            {/* Help & Support Dedicated Knowledge Base Page */}
            {activeScreen === 'help' && (
              <HelpSupportScreen
                settings={settings}
                onGoHome={() => setActiveScreen('store')}
                lang={lang}
              />
            )}

            {/* Security & 2FA Settings */}
            {activeScreen === 'security' && (
              <SecuritySettingsScreen
                userProfile={userProfile}
                onBack={() => setActiveScreen('profile')}
                lang={lang}
              />
            )}

            {/* Admin Dashboard */}
            {activeScreen === 'admin-dashboard' && (
              <AdminDashboard
                products={products}
                orders={orders}
                coupons={coupons}
                analytics={analytics}
                settings={settings}
                userProfile={userProfile}
                songs={songs}
                setActiveScreen={setActiveScreen}
                onReleaseAllDrafts={handleReleaseAllDrafts}
                onLogoutAdmin={handleAdminLogout}
                onImportBackup={handleImportBackup}
                onResetToZero={handleResetToZero}
                lang={lang}
                onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
                storeLogoUrl={settings.logoUrl}
              />
            )}

            {/* Admin Orders Management */}
            {activeScreen === 'admin-orders' && (
              <AdminOrders
                orders={orders}
                onApproveOrder={handleApproveOrder}
                onRejectOrder={handleRejectOrder}
                onDeleteOrder={handleDeleteOrder}
                onDeleteOrdersByStatus={handleDeleteOrdersByStatus}
                onBack={() => setActiveScreen('admin-dashboard')}
                lang={lang}
                onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
                storeLogoUrl={settings.logoUrl}
                onResendTelegramAlert={handleResendTelegramAlert}
              />
            )}

            {/* Admin Add Product with Photo Upload & Credentials */}
            {activeScreen === 'admin-add-item' && (
              <AdminAddItem
                onAddProduct={handleAddProduct}
                onBack={() => setActiveScreen('admin-dashboard')}
                lang={lang}
              />
            )}

            {/* Admin Inventory List (Edit, Delete, Stock control) */}
            {activeScreen === 'admin-items' && (
              <AdminItemsList
                products={products}
                onDeleteProduct={handleDeleteProduct}
                onUpdateProduct={handleUpdateProduct}
                onAddNew={() => setActiveScreen('admin-add-item')}
                onBack={() => setActiveScreen('admin-dashboard')}
                lang={lang}
              />
            )}

            {/* Admin Store & KHQR API Settings */}
            {activeScreen === 'admin-settings' && (
              <AdminSettings
                settings={settings}
                songs={songs}
                onSaveSettings={handleSaveSettings}
                onSaveSongs={handleSaveSongs}
                onResetToZero={handleResetToZero}
                onBack={() => setActiveScreen('admin-dashboard')}
                lang={lang}
              />
            )}

            {/* Admin Visitor & Revenue Analytics */}
            {activeScreen === 'admin-analytics' && (
              <AdminAnalytics
                analytics={analytics}
                orders={orders}
                onBack={() => setActiveScreen('admin-dashboard')}
                lang={lang}
              />
            )}

            {/* Admin Coupons */}
            {activeScreen === 'admin-coupons' && (
              <AdminCoupons
                coupons={coupons}
                onAddCoupon={handleAddCoupon}
                onToggleCoupon={handleToggleCoupon}
                onBack={() => setActiveScreen('admin-dashboard')}
                lang={lang}
              />
            )}

            {/* Admin Telegram Dual-Bot & Username Inspector Config */}
            {activeScreen === 'admin-bot-config' && (
              <AdminStoreBotConfig
                settings={settings}
                onSaveSettings={handleSaveSettings}
                orders={orders}
                products={products}
                userProfile={userProfile}
                onBack={() => setActiveScreen('admin-dashboard')}
                lang={lang}
              />
            )}
          </>
        )}
      </main>

      {/* Customer Store Footer */}
      {!isAdminScreen && (
        <StoreFooter
          settings={settings}
          onAdminLoginClick={handleAdminPortalClick}
          lang={lang}
          setActiveScreen={setActiveScreen}
        />
      )}

      {/* Product Detail Bottom Sheet */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onProceedToCheckout={handleProceedToCheckout}
          lang={lang}
        />
      )}

      {/* Checkout Modal with Live Official KHQR and Dynamic Store Settings */}
      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          availableCoupons={coupons}
          settings={settings}
          userProfile={userProfile}
          onClose={() => setCheckoutProduct(null)}
          onCompleteOrder={handleCompleteOrder}
          onOpenTopup={() => setIsTopupOpen(true)}
          lang={lang}
        />
      )}

      {/* Top-up Balance Modal */}
      {isTopupOpen && (
        <TopUpModal
          userBalanceUSD={userProfile.balanceUSD}
          defaultReferralCode={topupDefaultRefCode}
          onClose={() => {
            setIsTopupOpen(false);
            setTopupDefaultRefCode('');
          }}
          onTopUpSuccess={handleTopUpSuccess}
          lang={lang}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        lang={lang}
        pendingOrdersCount={pendingOrdersCount}
      />
    </div>
  );
}

export default App;

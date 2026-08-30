import React, { useState, useRef } from 'react';
import { Product, Order, Coupon, StoreSettings, UserProfile, RobloxProfile } from '../types';
import { generateKHQRDataURL, generateKHQRPayload } from '../utils/khqr';
import { getMemberRankInfo } from '../utils/memberRank';
import { AccountLoginRulesModal } from './AccountLoginRulesModal';
import { Api } from '../utils/api';
import {
  X,
  CheckCircle,
  Upload,
  QrCode,
  Tag,
  ShieldCheck,
  Info,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Gift,
  Users,
  Send,
  AlertCircle,
  Wallet,
  Zap,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  Ban,
  ChevronRight,
  UserCheck,
  ExternalLink,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  product: Product;
  onClose: () => void;
  onCompleteOrder: (newOrder: Order) => void;
  availableCoupons: Coupon[];
  settings?: StoreSettings;
  userProfile?: UserProfile;
  lang: 'KM' | 'EN';
  onOpenTopup?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  onClose,
  onCompleteOrder,
  availableCoupons,
  settings,
  userProfile,
  lang,
  onOpenTopup,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'khqr'>('balance');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);

  // KHQR creation states (NOT auto generated; only when confirmed by user)
  const [isKhqrGenerated, setIsKhqrGenerated] = useState<boolean>(false);
  const [isGeneratingKhqr, setIsGeneratingKhqr] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [khqrString, setKhqrString] = useState<string>('');
  const [uploadedSlip, setUploadedSlip] = useState<string | null>(null);
  const [copiedKHQR, setCopiedKHQR] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [robloxUsername, setRobloxUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [checkedRobloxProfile, setCheckedRobloxProfile] = useState<RobloxProfile | null>(null);
  const [usernameVerified, setUsernameVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSoldOut = product.isSold || product.stock <= 0;
  const isAccount = product.fulfillmentType === 'account' || product.category === 'account';
  const isGift = product.fulfillmentType === 'gift' || product.category === 'gamepass';
  const isTrade = product.fulfillmentType === 'trade' || (!isAccount && !isGift);
  const warrantyDays = product.warrantyDays || 14;

  // Check and verify Roblox username for gifts
  const handleCheckUsername = async (overrideUser?: string): Promise<RobloxProfile | null> => {
    const rawUser = (overrideUser !== undefined ? overrideUser : robloxUsername).trim();
    const cleanUser = rawUser.replace(/^@/, '').trim();

    if (!cleanUser) {
      setUsernameError(
        lang === 'KM'
          ? 'សូមបញ្ចូល Roblox Username របស់អ្នកដើម្បីពិនិត្យ'
          : 'Please enter your Roblox username to verify'
      );
      setCheckedRobloxProfile(null);
      setUsernameVerified(false);
      return null;
    }

    if (cleanUser.length < 3 || cleanUser.length > 20) {
      setUsernameError(
        lang === 'KM'
          ? 'Roblox Username ត្រូវមានចន្លោះពី ៣ ដល់ ២០ តួអក្សរ'
          : 'Roblox username must be between 3 and 20 characters'
      );
      setCheckedRobloxProfile(null);
      setUsernameVerified(false);
      return null;
    }

    setIsCheckingUsername(true);
    setUsernameError('');

    try {
      const res = await Api.checkRobloxProfile(cleanUser);
      if (res.success && res.profile) {
        setCheckedRobloxProfile(res.profile);
        setRobloxUsername(res.profile.username);
        setUsernameVerified(true);
        setUsernameError('');
        return res.profile;
      } else {
        setUsernameError(
          res.error ||
            (lang === 'KM'
              ? 'រកមិនឃើញគណនី Roblox នេះទេ សូមពិនិត្យឈ្មោះឡើងវិញ'
              : 'Roblox user not found. Please verify spelling.')
        );
        setCheckedRobloxProfile(null);
        setUsernameVerified(false);
        return null;
      }
    } catch (err: any) {
      setUsernameError(err.message || 'Error checking Roblox username');
      setCheckedRobloxProfile(null);
      setUsernameVerified(false);
      return null;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Member Rank Auto Discount Calculation
  const productPrice = product?.price ?? 0;
  const rankInfo = getMemberRankInfo(userProfile?.totalSpentUSD || 0, userProfile?.isResellerUnlocked);
  const rankDiscountPercent = rankInfo.autoDiscountPercent;
  const rankDiscountUSD = (productPrice * rankDiscountPercent) / 100;

  // Coupon Discount
  const couponDiscountUSD = appliedCoupon
    ? (productPrice * appliedCoupon.discountPercent) / 100
    : 0;

  // Total discounts combined
  const totalDiscountUSD = rankDiscountUSD + couponDiscountUSD;
  const finalTotalUSD = Math.max(0, productPrice - totalDiscountUSD);

  const currentBalance = userProfile?.balanceUSD ?? 0;
  const hasSufficientBalance = currentBalance >= finalTotalUSD;

  const merchantName = settings?.merchantName || 'UCHIRO STORE';
  const merchantCity = settings?.merchantCity || 'Phnom Penh';
  const bakongAccountId = settings?.bakongAccountId || 'uchiro_store@aclb';

  // Generate dynamic KHQR only when user explicitly confirms
  const handleGenerateKHQR = async () => {
    if (isGift) {
      if (!robloxUsername.trim()) {
        setUsernameError(
          lang === 'KM'
            ? 'សូមបញ្ចូល Roblox Username របស់អ្នកដើម្បីទទួលកាដូ'
            : 'Please enter your Roblox username for the gift'
        );
        return;
      }
      if (!checkedRobloxProfile) {
        const verified = await handleCheckUsername();
        if (!verified) return;
      }
    }

    setIsGeneratingKhqr(true);
    const orderRef = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const payload = generateKHQRPayload({
        merchantName,
        merchantCity,
        bakongAccountId,
        amount: finalTotalUSD,
        currency: 'USD',
        billNumber: orderRef,
      });

      const qrUrl = await generateKHQRDataURL({
        merchantName,
        merchantCity,
        bakongAccountId,
        amount: finalTotalUSD,
        currency: 'USD',
        billNumber: orderRef,
      });

      setKhqrString(payload);
      setQrDataUrl(qrUrl);
      setIsKhqrGenerated(true);
    } catch (err) {
      console.error('Failed to generate KHQR:', err);
    } finally {
      setIsGeneratingKhqr(false);
    }
  };

  // Apply discount code
  const handleApplyCoupon = () => {
    setCouponError('');
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a discount code');
      return;
    }
    const found = availableCoupons.find((c) => c.code.toUpperCase() === code && c.active);
    if (found) {
      setAppliedCoupon(found);
      // Reset KHQR state if already generated so the new price is reflected
      if (isKhqrGenerated) {
        setIsKhqrGenerated(false);
      }
    } else {
      setCouponError('Invalid or expired discount code. Try "UCHIRO10"');
    }
  };

  // File slip upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedSlip(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Order flow (Balance vs KHQR)
  const handleSubmitOrder = async (isBalancePayment: boolean = false) => {
    let finalRecipientProfile = checkedRobloxProfile;

    if (isGift) {
      if (!robloxUsername.trim()) {
        setUsernameError(
          lang === 'KM'
            ? 'សូមបញ្ចូល Roblox Username របស់អ្នក ដើម្បីទទួលកាដូ / Please enter your Roblox Username'
            : 'Please enter your Roblox username for the gift'
        );
        return;
      }

      if (!finalRecipientProfile) {
        finalRecipientProfile = await handleCheckUsername();
        if (!finalRecipientProfile) return;
      }
    }
    setUsernameError('');

    if (isBalancePayment && !hasSufficientBalance) {
      return;
    }

    setIsProcessing(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffb230', '#3ECF8E', '#ffffff', '#6F00BE'],
      });
    } catch {
      // Confetti fallback
    }

    setTimeout(() => {
      setIsProcessing(false);
      const newOrderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

      const newOrder: Order = {
        id: newOrderId,
        customerName: isGift ? robloxUsername.trim() : (userProfile?.username || 'Uchiro_Player77'),
        date: 'Just now',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        product: product,
        quantity: 1,
        totalUSD: finalTotalUSD,
        status: isBalancePayment || (settings?.autoApproveKHQR || isAccount) ? 'delivered' : 'pending',
        paymentMethod: isBalancePayment ? 'Balance' : 'KHQR',
        fulfillmentType: isAccount ? 'account' : isGift ? 'gift' : 'trade',
        recipientRobloxUsername: isGift ? robloxUsername.trim() : undefined,
        recipientRobloxProfile: isGift ? (finalRecipientProfile || undefined) : undefined,
        paymentSlipUrl: isBalancePayment
          ? undefined
          : (uploadedSlip || 'https://lh3.googleusercontent.com/aida/AEtjO1Wd_gGrzgJ8oYxj2s2PXAeDAm_I7pteiAAYAQmsETHiI3aggEjvNC-M4XsWrx-bXgntwWAl7wiFlbc3SkrCF8Q4wh1CXWCt8wwSX4RnLnV5bi3xNtluTAe-mAoOsUbDECvCnTOHM6eyMGsM_Cj5WCK8Yinoj1M7bZcAtxnUsnjjgEhOc3dbJxMzJNOlx771tkQ6m_8NIFnx4FHkl-X44TtJBY6lqO0Hbkvee6kiBS4yuBIvnGaoygQlLc8'),
        khqrPayload: isBalancePayment ? undefined : khqrString,
        credentialsDelivered: isAccount
          ? {
              username: product.autoDeliveryPayload?.username || 'Uchiro_Player77',
              password: product.autoDeliveryPayload?.password || 'Trus7!P@ss24',
              authenticatorKey: product.autoDeliveryPayload?.authenticatorKey || 'JBSWY3DPEHPK3PXP',
              live2faSeed: product.autoDeliveryPayload?.authenticatorKey || 'JBSWY3DPEHPK3PXP',
              deliveryTime: 'Just now',
              warrantyDurationDays: warrantyDays,
            }
          : undefined,
        discountApplied: appliedCoupon
          ? {
              code: appliedCoupon.code,
              discountPercent: appliedCoupon.discountPercent,
              amountSavedUSD: couponDiscountUSD,
            }
          : undefined,
        rankDiscountApplied: rankDiscountPercent > 0
          ? {
              rankTier: rankInfo.tier,
              rankTitle: rankInfo.title,
              discountPercent: rankDiscountPercent,
              amountSavedUSD: rankDiscountUSD,
            }
          : undefined,
        transactionRef: isBalancePayment
          ? `WALLET-BAL-${Math.floor(1000 + Math.random() * 9000)}`
          : `KHQR-${Math.floor(1000 + Math.random() * 9000)}-ABA`,
      };

      onCompleteOrder(newOrder);
    }, 1100);
  };

  const copyKHQRPayload = () => {
    if (khqrString) {
      navigator.clipboard.writeText(khqrString);
      setCopiedKHQR(true);
      setTimeout(() => setCopiedKHQR(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Checkout Bottom Sheet / Dialog */}
      <div className="w-full max-w-lg bg-[#1C1F29] rounded-t-[32px] sm:rounded-[32px] z-50 relative overflow-hidden flex flex-col shadow-2xl border-t sm:border border-white/10 max-h-[92vh] animate-[slideUp_0.3s_ease-out]">
        {/* Drag Handle on Mobile */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-[#33343c] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-3 sm:pt-6 pb-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-price text-xs text-[#ffb230] uppercase font-bold tracking-wider">
                CHECKOUT & PURCHASE
              </span>
              {isAccount && (
                <span className="bg-[#ffb230]/20 text-[#ffd7a1] text-[10px] font-price font-bold px-2 py-0.5 rounded-full border border-[#ffb230]/40">
                  🛡️ {warrantyDays}D WARRANTY
                </span>
              )}
              {isGift && (
                <span className="bg-[#E8433F]/20 text-[#ff8e8b] text-[10px] font-price font-bold px-2 py-0.5 rounded-full border border-[#E8433F]/40">
                  🎁 GIFT (15-30m)
                </span>
              )}
              {isTrade && (
                <span className="bg-[#60a5fa]/20 text-[#93c5fd] text-[10px] font-price font-bold px-2 py-0.5 rounded-full border border-[#60a5fa]/40">
                  🤝 IN-GAME TRADE
                </span>
              )}
            </div>
            <h1 className="font-headline text-xl sm:text-2xl text-[#e2e2ec] uppercase tracking-wide line-clamp-1">
              {product.title}
            </h1>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#14161D] text-[#8B90A0] hover:text-white flex items-center justify-center border border-white/10 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* SOLD OUT WARNING */}
          {isSoldOut && (
            <div className="p-4 bg-[#E8433F]/15 border border-[#E8433F]/40 rounded-2xl flex items-center gap-3 text-[#ff8e8b] shadow-lg">
              <AlertTriangle className="w-6 h-6 text-[#E8433F] shrink-0 animate-bounce" />
              <div className="text-xs">
                <strong className="block text-sm text-[#E8433F] font-headline uppercase">
                  {lang === 'KM' ? 'ទំនិញនេះត្រូវបានលក់អស់ហើយ' : 'ITEM OUT OF STOCK / SOLD OUT'}
                </strong>
                <span>
                  {lang === 'KM'
                    ? 'ទំនិញនេះមិនមានស្តុកទៀតទេ មិនអាចធ្វើការទូទាត់បានឡើយ។'
                    : 'This product has been sold out and cannot be purchased at this time.'}
                </span>
              </div>
            </div>
          )}

          {/* Automatic Member Rank Discount Banner */}
          {rankDiscountPercent > 0 ? (
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-md ${
                rankInfo.tier === 'Reseller'
                  ? 'bg-[#FF007A]/15 border-[#FF007A]/40 text-[#FF007A]'
                  : rankInfo.tier === 'Diamond'
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]'
                  : 'bg-[#ffb230]/15 border-[#ffb230]/40 text-[#ffd7a1]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{rankInfo.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-xs uppercase tracking-wider font-bold">
                      {rankInfo.title}
                    </span>
                    <span className="bg-white/10 text-[10px] font-price font-bold px-2 py-0.2 rounded-full">
                      -{rankDiscountPercent}% AUTO DISCOUNT
                    </span>
                  </div>
                  <p className="text-[11px] font-price text-[#cac6bb] mt-0.5">
                    {lang === 'KM'
                      ? `បញ្ចុះតម្លៃ ${rankDiscountPercent}% ស្វ័យប្រវត្តិតាមឋានៈ VIP (សន្សំបាន $${rankDiscountUSD.toFixed(2)})`
                      : `Automatic ${rankDiscountPercent}% member discount saved -$${rankDiscountUSD.toFixed(2)} USD`}
                  </p>
                </div>
              </div>
              <span className="font-headline text-base font-bold text-[#3ECF8E]">
                -${rankDiscountUSD.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="bg-[#14161D] border border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#8B90A0]">
                <span>👑</span>
                <span>
                  Spend <strong>$30+</strong> for Gold (5% OFF), <strong>$50+</strong> for Diamond (10% OFF), <strong>$100+</strong> for Reseller (20% OFF)
                </span>
              </div>
            </div>
          )}

          {/* GIFT RECIPIENT USERNAME PROMPT WITH LIVE ROBLOX AVATAR CHECK */}
          {isGift && (
            <div className="bg-[#11131a] border border-[#ffb230]/40 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <label className="font-price text-xs text-[#ffd7a1] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-[#ffb230]" />
                  <span>{lang === 'KM' ? 'ROBLOX USERNAME ទទួលកាដូ (GIFT RECIPIENT)' : 'ROBLOX RECIPIENT (REQUIRED)'}</span>
                </label>
                <span className="bg-[#ffb230]/15 text-[#ffd7a1] text-[10px] font-price font-bold px-2 py-0.5 rounded-full border border-[#ffb230]/30">
                  REQUIRED
                </span>
              </div>

              {/* Input & Check Button */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={robloxUsername}
                    onChange={(e) => {
                      setRobloxUsername(e.target.value);
                      if (usernameError) setUsernameError('');
                      if (checkedRobloxProfile && e.target.value.trim() !== checkedRobloxProfile.username) {
                        setCheckedRobloxProfile(null);
                        setUsernameVerified(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckUsername();
                      }
                    }}
                    placeholder="e.g. RobloxUser_123 or @Username"
                    className={`w-full bg-[#1C1F29] text-[#e2e2ec] border rounded-xl px-4 py-3 focus:outline-none focus:border-[#ffb230] font-price text-sm transition-all ${
                      usernameVerified
                        ? 'border-[#3ECF8E]/60 focus:border-[#3ECF8E]'
                        : usernameError
                        ? 'border-[#E8433F]/60'
                        : 'border-white/20'
                    }`}
                  />
                  {usernameVerified && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#3ECF8E] text-xs font-price font-bold">
                      <CheckCircle className="w-4 h-4 text-[#3ECF8E]" />
                      <span className="hidden sm:inline">Verified</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCheckUsername()}
                  disabled={isCheckingUsername || !robloxUsername.trim()}
                  className="bg-[#282a31] hover:bg-[#ffb230] hover:text-[#291800] text-[#ffd7a1] border border-white/10 font-headline text-xs sm:text-sm px-4 py-3 rounded-xl uppercase font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isCheckingUsername ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#ffb230]" />
                      <span>{lang === 'KM' ? 'កំពុងពិនិត្យ...' : 'Checking...'}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 text-[#3ECF8E]" />
                      <span>{lang === 'KM' ? 'ផ្ទៀងផ្ទាត់ (Check)' : 'Check Username'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error message */}
              {usernameError && (
                <div className="bg-[#E8433F]/15 border border-[#E8433F]/30 rounded-xl p-2.5 flex items-center gap-2 text-xs text-[#E8433F]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-price">{usernameError}</span>
                </div>
              )}

              {/* Verified Roblox Player Preview Card */}
              {checkedRobloxProfile && (
                <div className="bg-[#141622] border border-[#3ECF8E]/40 rounded-xl p-3.5 flex items-center justify-between gap-3 animate-fade-in shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={checkedRobloxProfile.avatarUrl}
                        alt={checkedRobloxProfile.displayName}
                        className="w-12 h-12 rounded-xl object-cover bg-black/40 border-2 border-[#3ECF8E] shadow-[0_0_12px_rgba(62,207,142,0.3)]"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-[#3ECF8E] text-[#003822] rounded-full p-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-headline text-sm text-[#e2e2ec] font-bold">
                          {checkedRobloxProfile.displayName}
                        </h4>
                        <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-price font-bold px-1.5 py-0.5 rounded border border-[#3ECF8E]/40">
                          Roblox Player
                        </span>
                      </div>
                      <p className="font-price text-xs text-[#00F0FF]">
                        @{checkedRobloxProfile.username} <span className="text-[#8B90A0] text-[11px]">• ID: {checkedRobloxProfile.userId}</span>
                      </p>
                      <p className="font-khmer text-[11px] text-[#3ECF8E] font-medium mt-0.5 flex items-center gap-1">
                        <span>✅ គណនីត្រឹមត្រូវ កាដូនឹងផ្ញើជូនរូបតំណាងនេះ</span>
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://www.roblox.com/search/users?keyword=${encodeURIComponent(checkedRobloxProfile.username)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B90A0] hover:text-[#00F0FF] p-2 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                    title="Open Roblox Profile in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Explanatory helper note */}
              <p className="font-khmer text-[11px] text-[#8B90A0] leading-relaxed">
                {lang === 'KM'
                  ? '⚡ សូមពិនិត្យមើលឈ្មោះ (Username) និងរូប Avatar ឱ្យបានត្រឹមត្រូវមុនពេលទូទាត់ ដើម្បីធានាថាកាដូ Gamepass ឬ Fruit នឹងត្រូវបញ្ជូនទៅគណនីពិតប្រាកដរបស់អ្នក។'
                  : '⚡ The gamepass/gift will be dispatched directly to this verified Roblox account within 15-30 minutes after payment.'}
              </p>
            </div>
          )}

          {/* TRADE NOTICE (FOR MM2, BLADE BALL, PHYSICAL FRUITS) */}
          {isTrade && (
            <div className="bg-[#11131a] border border-[#60a5fa]/40 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-[#60a5fa] font-price text-xs font-bold uppercase">
                <Users className="w-4 h-4" />
                <span>IN-GAME TRADE PROCEDURE</span>
              </div>
              <p className="font-khmer text-xs text-[#ffd7a1] leading-relaxed">
                {lang === 'KM'
                  ? 'បន្ទាប់ពីទូទាត់រួច សូមទាក់ទងមកកាន់ Telegram: @Noreakyout ដើម្បី Join Game ធ្វើការ Trade អាវុធ/ផ្លែឈើ។'
                  : 'After payment, message Telegram @Noreakyout to join private server for fast in-game trade.'}
              </p>
            </div>
          )}

          {/* Discount Code Section */}
          <div className="space-y-1.5">
            <label className="font-price text-xs text-[#8B90A0] uppercase tracking-wider flex items-center justify-between">
              <span>COUPON CODE (OPTIONAL)</span>
              <span
                className="text-[10px] text-[#ffb230] cursor-pointer hover:underline"
                onClick={() => setDiscountCode('UCHIRO10')}
              >
                Use code: UCHIRO10
              </span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="UCHIRO10"
                  className="w-full bg-[#11131a] text-[#e2e2ec] border border-white/15 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ffb230] focus:ring-1 focus:ring-[#ffb230] font-price text-sm uppercase"
                />
                {appliedCoupon && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-price font-bold px-2 py-0.5 rounded-full border border-[#3ECF8E]/40">
                    -{appliedCoupon.discountPercent}% OFF
                  </span>
                )}
              </div>
              <button
                onClick={handleApplyCoupon}
                className="bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-base px-6 py-3 rounded-xl chunky-btn-gold uppercase font-bold"
              >
                APPLY
              </button>
            </div>
            {couponError && <p className="text-xs text-[#E8433F] font-price">{couponError}</p>}
          </div>

          {/* ================= PAYMENT METHOD SELECTION ================= */}
          <div className="space-y-2 pt-1">
            <label className="font-price text-xs text-[#ffd7a1] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <span>SELECT PAYMENT METHOD</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option A: Store Balance */}
              <button
                type="button"
                onClick={() => setPaymentMethod('balance')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'balance'
                    ? 'bg-[#1C1F29] border-2 border-[#3ECF8E] shadow-[0_0_15px_rgba(62,207,142,0.25)]'
                    : 'bg-[#11131a] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#3ECF8E]" />
                    <span className="font-headline text-sm text-[#e2e2ec] uppercase">Store Wallet</span>
                  </div>
                  {paymentMethod === 'balance' && (
                    <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
                  )}
                </div>
                <div className="font-price text-xs text-[#8B90A0]">
                  Available:{' '}
                  <span className="text-[#3ECF8E] font-bold">
                    ${currentBalance.toFixed(2)} USD
                  </span>
                </div>
                <span className="text-[10px] text-[#ffd7a1] font-price font-bold mt-1 bg-[#3ECF8E]/10 rounded px-1.5 py-0.5 self-start">
                  Instant Auto-Cut ⚡
                </span>
              </button>

              {/* Option B: Bakong KHQR */}
              <button
                type="button"
                onClick={() => setPaymentMethod('khqr')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'khqr'
                    ? 'bg-[#1C1F29] border-2 border-[#ffb230] shadow-[0_0_15px_rgba(255,178,48,0.25)]'
                    : 'bg-[#11131a] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#ffb230]" />
                    <span className="font-headline text-sm text-[#e2e2ec] uppercase">Bakong KHQR</span>
                  </div>
                  {paymentMethod === 'khqr' && (
                    <span className="w-2 h-2 rounded-full bg-[#ffb230] animate-pulse" />
                  )}
                </div>
                <div className="font-price text-xs text-[#8B90A0]">
                  ABA • ACLEDA • Wing
                </div>
                <span className="text-[10px] text-[#ffd7a1] font-price font-bold mt-1 bg-[#ffb230]/10 rounded px-1.5 py-0.5 self-start">
                  Scan to Pay 🇰🇭
                </span>
              </button>
            </div>
          </div>

          {/* ================= BALANCE PAYMENT DETAILS ================= */}
          {paymentMethod === 'balance' && (
            <div className="bg-[#11131a] rounded-2xl p-4 sm:p-5 border border-[#3ECF8E]/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#3ECF8E]" />
                  <span className="font-headline text-sm text-[#3ECF8E] uppercase tracking-wide">
                    Pay with Account Balance
                  </span>
                </div>
                <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-price font-bold px-2 py-0.5 rounded-full border border-[#3ECF8E]/40">
                  Instant Auto-Delivery
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-price">
                <div className="bg-[#1C1F29] p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[#8B90A0]">Your Wallet:</span>
                  <p className="font-bold text-sm text-white">${currentBalance.toFixed(2)} USD</p>
                </div>
                <div className="bg-[#1C1F29] p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[#8B90A0]">Item Cost:</span>
                  <p className="font-bold text-sm text-[#ffb230]">${finalTotalUSD.toFixed(2)} USD</p>
                </div>
              </div>

              {hasSufficientBalance ? (
                <div className="bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 rounded-xl p-3 flex items-center justify-between text-xs font-price">
                  <span className="text-[#3ECF8E] font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Sufficient Funds (Ready to Buy)</span>
                  </span>
                  <span className="text-[#8B90A0]">
                    Remaining: <strong className="text-white">${(currentBalance - finalTotalUSD).toFixed(2)}</strong>
                  </span>
                </div>
              ) : (
                <div className="bg-[#E8433F]/15 border border-[#E8433F]/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#ff8e8b] font-price font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Insufficient Balance (Needs +${(finalTotalUSD - currentBalance).toFixed(2)} USD)
                    </span>
                  </div>
                  <p className="text-[11px] font-price text-[#cac6bb]">
                    Please top up your wallet balance or switch to Bakong KHQR scan.
                  </p>
                  {onOpenTopup && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTopup();
                      }}
                      className="w-full bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] py-2 rounded-lg text-xs font-headline font-bold uppercase flex items-center justify-center gap-1.5 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Top Up Wallet Now</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= BAKONG KHQR PAYMENT DETAILS (ONLY GENERATED ON CONFIRM) ================= */}
          {paymentMethod === 'khqr' && (
            <div className="bg-[#11131a] rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center border border-white/10 relative overflow-hidden shadow-inner space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-1 z-10">
                <span className="w-2 h-2 rounded-full bg-[#ffb230] animate-pulse" />
                <h2 className="font-headline text-lg sm:text-xl text-[#ffd7a1] tracking-wider uppercase">
                  BAKONG KHQR PAYMENT
                </h2>
              </div>

              {!isKhqrGenerated ? (
                /* Uncreated State: Prompt to generate KHQR */
                <div className="w-full flex flex-col items-center justify-center text-center p-5 bg-[#1C1F29]/70 rounded-2xl border border-white/10 space-y-3 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#ffb230]/10 border border-[#ffb230]/30 flex items-center justify-center text-[#ffb230]">
                    <QrCode className="w-8 h-8 opacity-90" />
                  </div>
                  <h4 className="font-headline text-base text-[#ffd7a1] uppercase">
                    {lang === 'KM' ? 'បង្កើតកូដ KHQR សម្រាប់ការទូទាត់' : 'Create KHQR Code to Pay'}
                  </h4>
                  <p className="font-price text-xs text-[#8B90A0] max-w-[260px]">
                    {lang === 'KM'
                      ? `តម្លៃសរុប $${finalTotalUSD.toFixed(2)} USD។ ចុចខាងក្រោមដើម្បីបង្កើតកូដ KHQR ផ្លូវការ។`
                      : `Total is $${finalTotalUSD.toFixed(2)} USD. Click below to generate your unique Bakong KHQR code.`}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateKHQR}
                    disabled={isGeneratingKhqr}
                    className="w-full bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-base py-3.5 rounded-xl chunky-btn-gold uppercase font-bold tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {isGeneratingKhqr ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating Code...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        <span className="font-khmer font-bold">
                          {lang === 'KM' ? `បង្កើតកូដ KHQR ($${finalTotalUSD.toFixed(2)})` : `Generate KHQR ($${finalTotalUSD.toFixed(2)} USD)`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Generated KHQR State */
                <div className="flex flex-col items-center justify-center w-full z-10 space-y-3">
                  <div className="relative bg-white p-3.5 rounded-2xl shadow-2xl border-4 border-[#ffb230]/40 group">
                    <div className="w-full bg-[#E8433F] text-white text-center text-[10px] font-bold py-0.5 rounded-t-md mb-1 font-price uppercase tracking-widest flex items-center justify-center gap-1">
                      <span>🇰🇭</span>
                      <span>BAKONG / KHQR PAYMENT</span>
                    </div>

                    {qrDataUrl ? (
                      <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
                        <img
                          src={qrDataUrl}
                          alt="KHQR Payment Code"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <div className="absolute w-11 h-11 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col items-center justify-center p-0.5">
                          <span className="font-bold text-[9px] text-[#003822] font-sans leading-none">KHQR</span>
                          <span className="text-[7px] text-[#8B90A0] font-price">USD</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center bg-gray-100 rounded-lg">
                        <Loader2 className="w-8 h-8 text-[#ffb230] animate-spin" />
                      </div>
                    )}

                    <div className="w-full bg-[#0A0B0E] text-[#ffd7a1] text-center text-xs font-price font-bold py-1 rounded-b-md mt-1 border border-white/10">
                      Amount: ${finalTotalUSD.toFixed(2)} USD
                    </div>
                  </div>

                  <p className="font-price text-xs text-[#8B90A0] text-center">
                    Scan using <span className="text-[#ffd7a1] font-bold">ABA Bank, ACLEDA, Wing, Canadia</span> or any Bakong app.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyKHQRPayload}
                      className="flex items-center gap-1 text-[11px] font-price text-[#d6c4ae] hover:text-[#ffb230] bg-[#1C1F29] px-3 py-1 rounded-full border border-white/10 transition-colors"
                    >
                      {copiedKHQR ? <Check className="w-3 h-3 text-[#3ECF8E]" /> : <Copy className="w-3 h-3 text-[#ffb230]" />}
                      <span>{copiedKHQR ? 'Copied Raw KHQR EMVCo' : 'Copy Raw KHQR String'}</span>
                    </button>
                  </div>

                  {/* Screenshot Upload Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-2xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#11131a]/60 hover:bg-[#11131a] ${
                      uploadedSlip ? 'border-[#3ECF8E] bg-[#3ECF8E]/5' : 'border-white/20 hover:border-[#ffb230]/60'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    {uploadedSlip ? (
                      <div className="flex items-center gap-3 w-full">
                        <img
                          src={uploadedSlip}
                          alt="Payment Slip"
                          className="w-12 h-12 object-cover rounded-lg border border-[#3ECF8E]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-[#3ECF8E] font-price text-xs font-bold">
                            <CheckCircle className="w-4 h-4" />
                            <span>Payment Slip Uploaded</span>
                          </div>
                          <p className="text-[11px] text-[#8B90A0] font-price mt-0.5">
                            Click to change screenshot
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-8 h-8 rounded-full bg-[#1C1F29] flex items-center justify-center mb-1 text-[#8B90A0]">
                          <Upload className="w-4 h-4 text-[#ffd7a1]" />
                        </div>
                        <span className="font-khmer text-xs font-semibold text-[#e2e2ec]">
                          {lang === 'KM' ? 'បញ្ចូលរូបភាពវិក្កយបត្រ (Upload Slip)' : 'Upload payment screenshot'}
                        </span>
                        <span className="font-price text-[10px] text-[#8B90A0]">
                          ABA / ACLEDA / Wing Transfer Receipt (PNG, JPG)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warranty & Purchase Rules Notice */}
          <div className="bg-[#14161F] border border-[#ffb230]/30 rounded-2xl p-3.5 space-y-2 text-xs font-price">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ffb230] shrink-0" />
                <span className="text-[#ffd7a1] font-bold uppercase">
                  {isAccount
                    ? (lang === 'KM' ? 'លក្ខខណ្ឌធានា ១៤ ថ្ងៃ & មិនបង្វិលប្រាក់' : '14-Day Warranty & No-Refund Policy')
                    : (lang === 'KM' ? 'គោលការណ៍មិនបង្វិលប្រាក់ (No Refund)' : 'Strict No-Refund Policy')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="text-[#ffb230] hover:underline text-[11px] font-bold flex items-center gap-0.5"
              >
                <span>{lang === 'KM' ? 'មើលច្បាប់លម្អិត' : 'View Rules'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {isAccount ? (
              <p className="text-[11px] text-[#cac6bb] leading-relaxed">
                {lang === 'KM'
                  ? '🛡️ ធានា ១៤ ថ្ងៃ៖ អ្នកទិញត្រូវរក្សាទុក 2FA & Email ក្នុងអំឡុងពេល ១៤ ថ្ងៃ។ ប្រសិនបើលុប 2FA/Email ការធានានឹងអស់សុពលភាព (No Warranty)។ ផុត ១៤ ថ្ងៃ អាចលុប/ប្តូរគ្រប់យ៉ាងបាន។'
                  : '🛡️ 14-Day Warranty: You must keep 2FA Authenticator & email active during 14 days (removing them voids warranty). After 14 days, you can change everything freely.'}
              </p>
            ) : (
              <p className="text-[11px] text-[#cac6bb] leading-relaxed">
                {lang === 'KM'
                  ? '🚫 មុខទំនិញ Gamepass, ផ្លែឈើ, ឬអាវុធ MM2/Blade Ball ដែលបានផ្ញើជូនរួច មិនអាចបង្វិលប្រាក់វិញបានឡើយ (No Refund)។'
                  : '🚫 Digital items including Gamepasses, Fruits, and MM2/Blade Ball trade items cannot be refunded once dispatched.'}
              </p>
            )}
          </div>

          {/* Pricing Breakdown & Total Row */}
          <div className="bg-[#11131a] rounded-2xl p-4 border border-white/10 space-y-2 font-price text-xs">
            <div className="flex justify-between text-[#8B90A0]">
              <span>Original Price</span>
              <span>${product.price.toFixed(2)} USD</span>
            </div>

            {rankDiscountPercent > 0 && (
              <div className="flex justify-between text-[#3ECF8E] font-bold">
                <span className="flex items-center gap-1">
                  <span>{rankInfo.icon}</span>
                  <span>{rankInfo.title} Discount (-{rankDiscountPercent}%)</span>
                </span>
                <span>-${rankDiscountUSD.toFixed(2)} USD</span>
              </div>
            )}

            {appliedCoupon && (
              <div className="flex justify-between text-[#ffb230]">
                <span>Coupon ({appliedCoupon.code} -{appliedCoupon.discountPercent}%)</span>
                <span>-${couponDiscountUSD.toFixed(2)} USD</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-base">
              <span className="font-headline text-lg text-[#e2e2ec] uppercase">Total to Pay</span>
              <span className="font-price text-2xl font-bold text-[#ffb94d] drop-shadow-[0_0_10px_rgba(255,178,48,0.4)]">
                ${finalTotalUSD.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 glass-panel sm:rounded-b-[32px] space-y-2.5">
          {isSoldOut ? (
            <div className="w-full bg-[#1e2029] border border-[#E8433F]/30 text-[#E8433F] font-headline text-lg py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-center">
              <Ban className="w-5 h-5" />
              <span>{lang === 'KM' ? 'ទំនិញដាច់ស្តុក • មិនអាចទិញបានទេ' : 'SOLD OUT • PURCHASING CLOSED'}</span>
            </div>
          ) : paymentMethod === 'balance' ? (
            /* Balance Payment Trigger */
            <button
              onClick={() => handleSubmitOrder(true)}
              disabled={isProcessing || !hasSufficientBalance}
              className={`w-full font-headline text-lg sm:text-xl py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider transition-all ${
                hasSufficientBalance
                  ? 'bg-[#3ECF8E] hover:bg-[#32b479] text-[#052e16] shadow-[0_0_20px_rgba(62,207,142,0.4)] cursor-pointer'
                  : 'bg-[#1C1F29] text-[#8B90A0] border border-white/10 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Deducting Balance & Delivering...</span>
                </>
              ) : hasSufficientBalance ? (
                <>
                  <Zap className="w-5 h-5 text-[#052e16]" />
                  <span className="font-khmer font-bold">
                    {lang === 'KM' ? `ទូទាត់ជាមួយកាបូប ($${finalTotalUSD.toFixed(2)})` : `Pay with Balance ($${finalTotalUSD.toFixed(2)} USD)`}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Insufficient Balance ($${currentBalance.toFixed(2)})</span>
                </>
              )}
            </button>
          ) : (
            /* KHQR Payment Trigger */
            <button
              onClick={() => {
                if (!isKhqrGenerated) {
                  handleGenerateKHQR();
                } else {
                  handleSubmitOrder(false);
                }
              }}
              disabled={isProcessing || isGeneratingKhqr}
              className="w-full bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-xl py-4 rounded-xl chunky-btn-gold flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Verifying Payment...</span>
                </>
              ) : isGeneratingKhqr ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Generating Code...</span>
                </>
              ) : !isKhqrGenerated ? (
                <>
                  <QrCode className="w-5 h-5" />
                  <span className="font-khmer font-bold">
                    {lang === 'KM' ? 'បង្កើតកូដ KHQR ដើម្បីទូទាត់' : `Generate KHQR Code ($${finalTotalUSD.toFixed(2)})`}
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-khmer font-bold">
                    {lang === 'KM' ? 'ខ្ញុំបានទូទាត់រួចរាល់ (Confirm Paid)' : 'I HAVE PAID (Confirm Order)'}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Info Banner */}
          <div className="flex items-start gap-2 bg-[#14161D] p-3 rounded-xl border border-white/5">
            <Info className="w-4 h-4 text-[#ffb230] shrink-0 mt-0.5" />
            <p className="font-sans text-xs text-[#8B90A0] leading-snug">
              {isAccount
                ? `Account credentials & 2FA live key are delivered immediately with ${warrantyDays}-day warranty.`
                : isGift
                ? 'Gift items are dispatched to your Roblox Username within 15-30 minutes.'
                : 'Trade items will be delivered in-game via Private Server. Staff support available on Telegram.'}
            </p>
          </div>
        </div>
      </div>

      {/* Account Login & Rules Modal */}
      <AccountLoginRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        lang={lang}
        initialTab="rules"
      />
    </div>
  );
};

import React, { useState } from 'react';
import { generateKHQRDataURL, generateKHQRPayload } from '../utils/khqr';
import { api } from '../utils/api';
import { UserProfile } from '../types';
import {
  QrCode,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Sparkles,
  Check,
  Gift,
  Tag,
  Edit3,
  ShieldCheck,
  RefreshCw,
  Ticket,
  Zap,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TopUpModalProps {
  userBalanceUSD: number;
  userProfile?: UserProfile;
  onClose: () => void;
  onTopUpSuccess: (amount: number, bonusAmount?: number, referralCode?: string) => void;
  lang: 'KM' | 'EN';
  defaultReferralCode?: string;
  onRedeemResellerCode?: (code: string) => Promise<{ success: boolean; message?: string }>;
}

interface TopUpPackage {
  id: string;
  name: string;
  amountUSD: number;
  popular?: boolean;
}

const PACKAGES: TopUpPackage[] = [
  { id: 'pkg-1', name: '$5.00 Pack', amountUSD: 5.00 },
  { id: 'pkg-2', name: '$10.00 Pack', amountUSD: 10.00 },
  { id: 'pkg-3', name: '$20.00 Pack', amountUSD: 20.00, popular: true },
  { id: 'pkg-4', name: '$50.00 Pack', amountUSD: 50.00 },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({
  userBalanceUSD,
  userProfile,
  onClose,
  onTopUpSuccess,
  lang,
  defaultReferralCode = '',
}) => {
  const [activeTab, setActiveTab] = useState<'khqr' | 'voucher'>('khqr');
  const [selectedPkg, setSelectedPkg] = useState<TopUpPackage>(PACKAGES[2]);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isQrGenerated, setIsQrGenerated] = useState<boolean>(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [khqrString, setKhqrString] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Referral code state for 2.5% friend topup bonus
  const [refCodeInput, setRefCodeInput] = useState<string>(defaultReferralCode);
  const [appliedRefCode, setAppliedRefCode] = useState<string>(
    defaultReferralCode ? defaultReferralCode.trim().toUpperCase() : ''
  );
  const [isValidatingRef, setIsValidatingRef] = useState(false);
  const [refError, setRefError] = useState<string>('');
  const [refSuccessMsg, setRefSuccessMsg] = useState<string>(
    defaultReferralCode ? 'Referral code applied (+2.5% Bonus)' : ''
  );

  // Voucher / Reseller Redeem State
  const [voucherInput, setVoucherInput] = useState<string>('');
  const [isRedeemingVoucher, setIsRedeemingVoucher] = useState(false);
  const [voucherResult, setVoucherResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    amountUSD?: number;
  }>({ type: null, message: '' });

  const finalAmount = customAmount ? parseFloat(customAmount) || 5.00 : selectedPkg.amountUSD;
  // 2.5% friend bonus on top-up
  const referralBonusUSD = appliedRefCode ? parseFloat((finalAmount * 0.025).toFixed(2)) : 0;
  const totalCreditedUSD = finalAmount + referralBonusUSD;

  // Generate KHQR
  const handleGenerateKHQR = async () => {
    setIsGeneratingQR(true);
    const topupRef = `TOPUP-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const payload = generateKHQRPayload({
        merchantName: 'UCHIRO STORE TOPUP',
        merchantCity: 'Phnom Penh',
        bakongAccountId: 'uchiro_topup@aclb',
        amount: finalAmount,
        currency: 'USD',
        billNumber: topupRef,
        storeLabel: 'Uchiro Wallet',
      });

      const qrUrl = await generateKHQRDataURL({
        merchantName: 'UCHIRO STORE TOPUP',
        merchantCity: 'Phnom Penh',
        bakongAccountId: 'uchiro_topup@aclb',
        amount: finalAmount,
        currency: 'USD',
        billNumber: topupRef,
        storeLabel: 'Uchiro Wallet',
      });

      setKhqrString(payload);
      setQrDataUrl(qrUrl);
      setIsQrGenerated(true);
    } catch (err) {
      console.error('Failed to generate KHQR:', err);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleApplyReferral = async () => {
    const code = refCodeInput.trim().toUpperCase();
    if (!code) {
      setRefError(lang === 'KM' ? 'សូមបញ្ចូលកូដណែនាំ' : 'Please enter a referral code');
      setRefSuccessMsg('');
      return;
    }

    const myCode = (userProfile?.referralCode || `UCH-${(userProfile?.username || 'GUEST').toUpperCase().slice(0, 4)}-99`).toUpperCase();
    if (code === myCode || (userProfile?.username && code.includes(userProfile.username.toUpperCase()))) {
      setRefError(
        lang === 'KM'
          ? 'អ្នកមិនអាចប្រើប្រាស់កូដណែនាំផ្ទាល់ខ្លួនរបស់អ្នកបានទេ'
          : 'You cannot use your own referral code'
      );
      setRefSuccessMsg('');
      return;
    }

    setIsValidatingRef(true);
    setRefError('');
    setRefSuccessMsg('');

    try {
      const res = await api.validateReferralCode(code, userProfile?.username);
      if (!res.valid) {
        setRefError(
          res.error ||
            (lang === 'KM'
              ? 'កូដណែនាំមិនមានក្នុងប្រព័ន្ធទេ។ សូមពិនិត្យមើលឡើងវិញ!'
              : 'Referral code not found. Only existing user codes can be used.')
        );
        setAppliedRefCode('');
        return;
      }

      setAppliedRefCode(code);
      setRefSuccessMsg(
        lang === 'KM'
          ? '🎉 កូដត្រឹមត្រូវ! អ្នកនឹងទទួលបានប្រាក់រង្វាន់បន្ថែម +2.5%!'
          : '🎉 Valid Referral Code! You will get +2.5% Extra Balance Bonus!'
      );

      if (isQrGenerated) {
        setIsQrGenerated(false);
      }
    } catch {
      setRefError('Network error validating referral code');
    } finally {
      setIsValidatingRef(false);
    }
  };

  const handlePaidConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffb230', '#3ECF8E', '#ffffff'],
        });
      } catch {}

      setTimeout(() => {
        onTopUpSuccess(finalAmount, referralBonusUSD, appliedRefCode || undefined);
      }, 1500);
    }, 1200);
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;

    setIsRedeemingVoucher(true);
    setVoucherResult({ type: null, message: '' });

    try {
      const res = await api.redeemCode(code, userProfile?.username);
      if (!res.success) {
        setVoucherResult({
          type: 'error',
          message: res.error || (lang === 'KM' ? 'កូដមិនត្រឹមត្រូវ ឬត្រូវបានប្រើប្រាស់រួចហើយ!' : 'Invalid code or already redeemed!'),
        });
        return;
      }

      setVoucherResult({
        type: 'success',
        message: res.message || 'Code successfully redeemed!',
        amountUSD: res.amountUSD,
      });

      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF007A', '#3ECF8E', '#ffb230', '#00F0FF'],
        });
      } catch {}

      setTimeout(() => {
        if (res.amountUSD && res.amountUSD > 0) {
          onTopUpSuccess(res.amountUSD, 0);
        } else {
          onClose();
        }
      }, 1800);
    } catch (err: any) {
      setVoucherResult({
        type: 'error',
        message: err?.message || 'Error redeeming code. Please try again.',
      });
    } finally {
      setIsRedeemingVoucher(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#14161D] rounded-3xl border border-white/10 shadow-2xl p-5 md:p-8 space-y-5 my-auto animate-[scaleIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#1C1F29] border border-white/10 text-[#ffd7a1] hover:text-white flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-headline text-2xl md:text-3xl text-[#ffd7a1] uppercase tracking-wider text-center flex-1 pr-10">
            {lang === 'KM' ? 'បញ្ចូលសមតុល្យកាបូប (USD)' : 'TOP-UP BALANCE (USD)'}
          </h1>
        </div>

        {/* Current Balance Display */}
        <section className="glass-panel rounded-2xl p-4 text-center flex flex-col items-center justify-center relative overflow-hidden border border-white/10 shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ffb230]/10 via-transparent to-transparent pointer-events-none" />
          <p className="font-sans text-xs text-[#8B90A0] uppercase font-bold tracking-widest mb-1">
            {lang === 'KM' ? 'សមតុល្យកាបូបបច្ចុប្បន្ន' : 'Current Wallet Balance'}
          </p>
          <h2 className="font-headline text-3xl md:text-4xl text-[#ffd7a1] drop-shadow-[0_0_15px_rgba(255,178,48,0.3)]">
            ${(userBalanceUSD ?? 0).toFixed(2)}{' '}
            <span className="text-lg font-price text-[#3ECF8E] font-bold">USD</span>
          </h2>
        </section>

        {/* Top-up Method Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#10121A] p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('khqr')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-headline text-xs uppercase tracking-wider transition-all font-bold ${
              activeTab === 'khqr'
                ? 'bg-[#ffb230] text-[#291800] shadow-md'
                : 'text-[#8B90A0] hover:text-[#ffd7a1]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{lang === 'KM' ? 'ស្កេន KHQR (Bakong)' : 'KHQR Instant Pay'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voucher')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-headline text-xs uppercase tracking-wider transition-all font-bold ${
              activeTab === 'voucher'
                ? 'bg-[#3ECF8E] text-[#003822] shadow-md'
                : 'text-[#8B90A0] hover:text-[#3ECF8E]'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>{lang === 'KM' ? 'កូដ Voucher / Reseller' : 'Redeem Reseller Voucher'}</span>
          </button>
        </div>

        {/* Tab 1: KHQR Top-Up Flow */}
        {activeTab === 'khqr' && (
          <>
            {isSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-[#3ECF8E]/20 text-[#3ECF8E] rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-headline text-2xl text-[#3ECF8E] uppercase">
                  {lang === 'KM' ? 'បញ្ចូលលុយជោគជ័យ!' : 'TOP-UP SUCCESSFUL!'}
                </h3>
                <p className="font-price text-sm text-[#e2e2ec]">
                  Added{' '}
                  <span className="text-[#ffd7a1] font-bold">
                    +${totalCreditedUSD.toFixed(2)} USD
                  </span>{' '}
                  to your wallet!
                </p>
                {referralBonusUSD > 0 && (
                  <div className="inline-flex items-center gap-1.5 bg-[#3ECF8E]/15 border border-[#3ECF8E]/40 text-[#3ECF8E] px-3 py-1 rounded-full text-xs font-price font-bold">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Includes +${referralBonusUSD.toFixed(2)} USD (2.5% Friend Bonus)</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: Package Selection & Referral Code */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline text-sm sm:text-base text-[#e2e2ec] uppercase">
                      1. Select USD Amount
                    </h3>
                    {isQrGenerated && (
                      <span className="text-[10px] font-price text-[#3ECF8E] font-bold bg-[#3ECF8E]/15 px-2 py-0.5 rounded-full">
                        Confirmed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {PACKAGES.map((pkg) => {
                      const isSelected = selectedPkg.id === pkg.id && !customAmount;
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => {
                            setSelectedPkg(pkg);
                            setCustomAmount('');
                            if (isQrGenerated) setIsQrGenerated(false);
                          }}
                          className={`relative rounded-2xl p-3 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                            pkg.popular ? 'shimmer-wrapper' : ''
                          } ${
                            isSelected
                              ? 'bg-[#1C1F29] border-2 border-[#ffb230] shadow-[0_0_15px_rgba(255,178,48,0.3)]'
                              : 'bg-[#1C1F29] border border-white/10 hover:border-white/25'
                          }`}
                        >
                          {pkg.popular && (
                            <div className="absolute -top-2.5 bg-[#ffb230] text-[#291800] text-[8px] font-headline font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                              Popular
                            </div>
                          )}
                          <span className="font-headline text-lg text-[#ffd7a1]">
                            ${pkg.amountUSD.toFixed(2)}
                          </span>
                          <span className="font-price text-[10px] text-[#8B90A0]">
                            Instant Credit
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom amount */}
                  <div>
                    <label className="font-price text-[11px] text-[#8B90A0] block mb-1">
                      Or enter custom USD amount:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-price text-xs text-[#ffb230] font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          if (isQrGenerated) setIsQrGenerated(false);
                        }}
                        placeholder="e.g. 25.00"
                        className="w-full bg-[#11131a] text-[#e2e2ec] border border-white/15 rounded-xl pl-7 pr-3 py-2 font-price text-xs focus:outline-none focus:border-[#ffb230]"
                      />
                    </div>
                  </div>

                  {/* Referral Code Box (2.5% Bonus for Friend, 5% for Referrer) */}
                  <div className="bg-[#1C1F29] p-3 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-price text-xs text-[#ffd7a1] font-bold flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-[#3ECF8E]" />
                        <span>Friend Referral Code</span>
                      </span>
                      {appliedRefCode && (
                        <span className="text-[9px] font-price font-bold bg-[#3ECF8E]/20 text-[#3ECF8E] px-2 py-0.5 rounded-full">
                          +2.5% APPLIED
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={refCodeInput}
                        onChange={(e) => {
                          setRefCodeInput(e.target.value);
                          setRefError('');
                        }}
                        placeholder="e.g. UCH-NORE-01"
                        className="flex-1 bg-[#11131a] text-[#e2e2ec] border border-white/15 rounded-xl px-3 py-2 text-xs font-price uppercase focus:outline-none focus:border-[#3ECF8E]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyReferral}
                        disabled={isValidatingRef}
                        className="bg-[#3ECF8E]/20 hover:bg-[#3ECF8E]/30 text-[#3ECF8E] border border-[#3ECF8E]/40 px-3 py-2 rounded-xl text-xs font-headline font-bold uppercase transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                      >
                        {isValidatingRef ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                      </button>
                    </div>

                    {refError && (
                      <p className="text-[10px] text-[#ff5752] font-price flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{refError}</span>
                      </p>
                    )}

                    {refSuccessMsg && (
                      <p className="text-[10px] text-[#3ECF8E] font-price flex items-center gap-1">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>{refSuccessMsg}</span>
                      </p>
                    )}

                    {appliedRefCode && (
                      <div className="flex items-center justify-between text-[11px] font-price text-[#3ECF8E] pt-0.5 border-t border-white/5">
                        <span>Code <strong className="text-white">{appliedRefCode}</strong>:</span>
                        <span className="font-bold">+${referralBonusUSD.toFixed(2)} USD (2.5% Bonus)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: KHQR Creation & Payment Container */}
                <div className="bg-[#11131a] rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-between gap-3">
                  <div className="w-full flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#ffb230]" />
                      <span className="font-price text-xs font-bold text-[#e2e2ec]">KHQR Instant Pay</span>
                    </div>
                    <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/40 text-[9px] font-price font-bold px-2 py-0.5 rounded-full">
                      Bakong API
                    </span>
                  </div>

                  {!isQrGenerated ? (
                    <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-4 bg-[#1C1F29]/60 rounded-2xl border border-white/5 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#ffb230]/10 border border-[#ffb230]/20 flex items-center justify-center text-[#ffb230]">
                        <QrCode className="w-6 h-6 opacity-80" />
                      </div>
                      <div>
                        <h4 className="font-headline text-sm text-[#ffd7a1] uppercase">
                          {lang === 'KM' ? 'ជ្រើសរើសចំនួនប្រាក់ រួចបង្កើត QR' : 'Confirm Amount to Create QR'}
                        </h4>
                        <p className="font-price text-[11px] text-[#8B90A0] mt-1 max-w-[200px]">
                          {lang === 'KM'
                            ? `ចុចខាងក្រោមដើម្បីបង្កើតកូដ KHQR ចំនួន $${finalAmount.toFixed(2)} USD`
                            : `Click confirm to generate dynamic KHQR for $${finalAmount.toFixed(2)} USD.`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 w-full flex flex-col items-center animate-fade-in">
                      <div className="bg-white p-2.5 rounded-2xl shadow-xl relative max-w-[150px] aspect-square flex items-center justify-center border-2 border-[#ffb230]">
                        {qrDataUrl ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img
                              src={qrDataUrl}
                              alt="KHQR Topup Code"
                              className="w-full h-full object-contain rounded-lg"
                            />
                            <div className="absolute w-7 h-7 bg-white rounded-md shadow border border-gray-200 flex flex-col items-center justify-center">
                              <span className="font-bold text-[6px] text-[#003822]">KHQR</span>
                            </div>
                          </div>
                        ) : (
                          <Loader2 className="w-6 h-6 text-[#ffb230] animate-spin" />
                        )}
                      </div>

                      <button
                        onClick={() => setIsQrGenerated(false)}
                        className="inline-flex items-center gap-1 text-[10px] font-price text-[#8B90A0] hover:text-[#ffb230] transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Change Amount / Edit</span>
                      </button>
                    </div>
                  )}

                  {/* Amount Breakdown */}
                  <div className="w-full bg-[#1C1F29] p-2.5 rounded-xl border border-white/5 space-y-1 text-[11px] font-price">
                    <div className="flex justify-between text-[#8B90A0]">
                      <span>Top-Up Amount:</span>
                      <span className="text-white font-bold">${finalAmount.toFixed(2)} USD</span>
                    </div>
                    {referralBonusUSD > 0 && (
                      <div className="flex justify-between text-[#3ECF8E]">
                        <span>+2.5% Friend Bonus:</span>
                        <span className="font-bold">+${referralBonusUSD.toFixed(2)} USD</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#ffd7a1] pt-1 border-t border-white/5 font-bold">
                      <span>Total Wallet Credit:</span>
                      <span>${totalCreditedUSD.toFixed(2)} USD</span>
                    </div>
                  </div>

                  {!isQrGenerated ? (
                    <button
                      type="button"
                      onClick={handleGenerateKHQR}
                      disabled={isGeneratingQR}
                      className="w-full bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-sm py-3 rounded-xl uppercase font-bold tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGeneratingQR ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating QR...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          <span>
                            {lang === 'KM' ? `បង្កើតកូដ QR ($${finalAmount.toFixed(2)})` : `Generate KHQR ($${finalAmount.toFixed(2)})`}
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePaidConfirm}
                      disabled={isProcessing}
                      className="w-full bg-[#3ECF8E] hover:bg-[#32b479] text-[#052e16] font-headline text-base py-3 rounded-xl uppercase font-bold tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(62,207,142,0.4)]"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying with Bakong...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>I HAVE PAID ($${finalAmount.toFixed(2)})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Voucher / Reseller Code Redeem */}
        {activeTab === 'voucher' && (
          <form onSubmit={handleRedeemVoucher} className="space-y-4 py-2">
            <div className="bg-[#1C1F29] p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-price font-bold text-[#3ECF8E] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#3ECF8E]" />
                  <span>Instant Balance Deposit & VIP Rank Codes</span>
                </span>
                <h3 className="font-headline text-lg text-[#ffd7a1] uppercase">
                  {lang === 'KM' ? 'បញ្ចូលកូដ Voucher / Reseller' : 'Enter Reseller Voucher Code'}
                </h3>
                <p className="font-price text-xs text-[#8B90A0]">
                  {lang === 'KM'
                    ? 'បញ្ចូលកូដដែលទទួលបានពី Admin ឬ Reseller ដើម្បីទទួលបានប្រាក់សមតុល្យ ឬបើកដំណើរការ VIP Rank ភ្លាមៗ!'
                    : 'Enter official gift voucher or reseller rank codes created by Admin to instantly credit wallet funds or unlock 20% discount.'}
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => {
                    setVoucherInput(e.target.value);
                    setVoucherResult({ type: null, message: '' });
                  }}
                  placeholder="e.g. UCHIRO-GIFT-10 or RESELLER-VIP"
                  className="w-full bg-[#11131a] text-[#ffd7a1] border border-white/15 rounded-xl px-4 py-3 font-mono font-bold text-sm tracking-widest uppercase focus:outline-none focus:border-[#3ECF8E]"
                />
              </div>

              {voucherResult.type && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-price flex items-center gap-2.5 ${
                    voucherResult.type === 'success'
                      ? 'bg-[#3ECF8E]/15 border border-[#3ECF8E]/40 text-[#3ECF8E]'
                      : 'bg-[#ff5752]/15 border border-[#ff5752]/40 text-[#ff5752]'
                  }`}
                >
                  {voucherResult.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{voucherResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isRedeemingVoucher || !voucherInput.trim()}
                className="w-full bg-[#3ECF8E] hover:bg-[#48de9a] text-[#003822] font-headline text-sm py-3.5 rounded-xl uppercase font-bold tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {isRedeemingVoucher ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redeeming Voucher...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{lang === 'KM' ? 'ប្តូរយករង្វាន់ (Redeem Now)' : 'Redeem Voucher Now'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-price text-[#8B90A0] px-1">
              <span>Need a reseller / bulk voucher?</span>
              <a
                href="https://t.me/Noreakyout"
                target="_blank"
                rel="noreferrer"
                className="text-[#ffb230] hover:underline flex items-center gap-1 font-bold"
              >
                <span>Contact Admin @Noreakyout</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { UserProfile, ActiveScreen } from '../types';
import { generateKHQRDataURL } from '../utils/khqr';
import {
  Send,
  UserPlus,
  Award,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  Sparkles,
  QrCode,
  MessageCircle,
  Play,
  ArrowLeft,
  Gift,
  Zap,
  TrendingUp,
  Percent,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReferralScreenProps {
  userProfile: UserProfile;
  setActiveScreen?: (screen: ActiveScreen) => void;
  onOpenTopup: (defaultCode?: string) => void;
  onSimulateReferralBonus: (friendName: string, topUpAmountUSD: number) => Promise<void> | void;
  onGoHome: () => void;
  lang: 'KM' | 'EN';
}

export const ReferralScreen: React.FC<ReferralScreenProps> = ({
  userProfile,
  setActiveScreen,
  onOpenTopup,
  onSimulateReferralBonus,
  onGoHome,
  lang,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Simulator State
  const [simFriendName, setSimFriendName] = useState('ProGamer_KH');
  const [simTopUpAmount, setSimTopUpAmount] = useState<number>(20);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    friend: string;
    topup: number;
    friendBonus: number;
    referrerBonus: number;
  } | null>(null);

  const referralCode = userProfile?.referralCode || `UCH-${(userProfile?.username || 'GUEST').toUpperCase().slice(0, 4)}-99`;
  const shareableUrl = `${window.location.origin}?ref=${encodeURIComponent(referralCode)}`;
  const referralEarnings = Number(userProfile?.referralEarningsUSD) || 0;
  const referralCount = Number(userProfile?.referralCount) || 0;
  const referralBonusPercent = 5.0; // Referrer gets 5%
  const friendBonusPercent = 2.5; // Friend gets 2.5%

  useEffect(() => {
    async function loadQr() {
      try {
        const url = await generateKHQRDataURL(shareableUrl);
        setQrCodeUrl(url);
      } catch (err) {
        console.warn('QR code generate fallback:', err);
      }
    }
    loadQr();
  }, [shareableUrl]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    try {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    } catch {}
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `🔥 ចូលរួមទិញគណនី Roblox និង Gamepass នៅលើ Uchiro Store! ប្រើកូដណែនាំ [${referralCode}] របស់ខ្ញុំពេលបញ្ចូលប្រាក់ ដើម្បីទទួលបានប្រាក់រង្វាន់បន្ថែម +2.5% ភ្លាមៗ 🎁៖ ${shareableUrl}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareableUrl)}&text=${text}`, '_blank');
  };

  const handleRunSimulation = async () => {
    if (!simFriendName.trim() || isSimulating) return;
    setIsSimulating(true);
    const validAmount = Number(simTopUpAmount) || 0;
    const friendBonus = Number((validAmount * (friendBonusPercent / 100)).toFixed(2));
    const referrerBonus = Number((validAmount * (referralBonusPercent / 100)).toFixed(2));

    try {
      if (onSimulateReferralBonus) {
        await onSimulateReferralBonus(simFriendName.trim(), validAmount);
      }
      setSimulationResult({
        friend: simFriendName.trim(),
        topup: validAmount,
        friendBonus,
        referrerBonus,
      });
      try {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } catch {}
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-32 px-3 sm:px-6 md:px-8 max-w-[1280px] mx-auto w-full relative overflow-hidden">
      {/* Ambient Sunburst Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-40">
        <div
          className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%]"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, rgba(255, 178, 48, 0.04) 0deg 15deg, transparent 15deg 30deg)',
          }}
        />
      </div>

      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 bg-[#1C1F29] hover:bg-[#282a31] text-[#ffd7a1] border border-white/10 px-4 py-2 rounded-xl font-headline text-xs uppercase tracking-wider transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'KM' ? 'ត្រឡប់ទៅហាង' : 'Back to Store'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="bg-[#ffb230]/20 text-[#ffb230] border border-[#ffb230]/40 text-xs font-price px-3 py-1 rounded-full font-bold uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,178,48,0.2)]">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>5% YOU EARN • 2.5% FRIEND GETS</span>
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="mb-10 text-center relative z-10 space-y-3">
        <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl text-[#ffd7a1] uppercase tracking-wider">
          {lang === 'KM' ? 'ណែនាំមិត្តភក្តិ & ទទួលរង្វាន់' : 'REFER & EARN CASH'}
        </h1>
        <p className="font-body-md text-xs sm:text-sm md:text-base text-[#8B90A0] max-w-xl mx-auto leading-relaxed">
          {lang === 'KM'
            ? 'ចែករំលែកកូដរបស់អ្នកទៅកាន់មិត្តភក្តិ៖ មិត្តភក្តិទទួលបានប្រាក់រង្វាន់បន្ថែម ២.៥% ហើយអ្នកទទួលបានកម្រៃជើងសារ ៥% ភ្លាមៗចូលកាបូប!'
            : 'Invite your friends to Uchiro Store: Your friend gets an instant +2.5% Top-up bonus, and you earn 5% cash commission directly to your balance!'}
        </p>
      </section>

      {/* Referral Flow Grid (1. Invite -> 2. Friend gets 2.5% -> 3. You earn 5%) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 relative z-10">
        {/* Step 1 */}
        <div className="bg-[#1C1F29]/90 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center relative overflow-hidden group hover:border-[#ffb230]/40 transition-all shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-[#11131A] flex items-center justify-center mb-4 border border-white/10 shadow-sm group-hover:scale-110 group-hover:border-[#ffb230] transition-all">
            <Send className="w-8 h-8 text-[#ffb230]" />
          </div>
          <h3 className="font-headline text-lg text-[#e2e2ec] mb-1 uppercase tracking-wide">
            {lang === 'KM' ? '១. ចែករំលែកកូដ (Share Code)' : '1. Share Your Code'}
          </h3>
          <p className="font-price text-xs text-[#8B90A0]">
            {lang === 'KM'
              ? 'ផ្ញើ Referral Code ផ្ទាល់ខ្លួនរបស់អ្នកទៅកាន់មិត្តភក្តិ ឬក្រុមលេងហ្គេម'
              : 'Share your unique invite code with friends before they top up.'}
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-[#1C1F29]/90 backdrop-blur-md rounded-2xl p-6 border border-[#3ECF8E]/40 flex flex-col items-center text-center relative overflow-hidden group hover:border-[#3ECF8E] transition-all shadow-[0_0_15px_rgba(62,207,142,0.1)]">
          <div className="w-16 h-16 rounded-2xl bg-[#3ECF8E]/15 flex items-center justify-center mb-4 border border-[#3ECF8E]/40 shadow-sm group-hover:scale-110 transition-all">
            <Gift className="w-8 h-8 text-[#3ECF8E]" />
          </div>
          <div className="bg-[#3ECF8E] text-[#003822] text-[10px] font-headline font-bold px-2.5 py-0.5 rounded-full uppercase mb-2">
            Friend Gets +2.5%
          </div>
          <h3 className="font-headline text-lg text-[#e2e2ec] mb-1 uppercase tracking-wide">
            {lang === 'KM' ? '២. មិត្តភក្តិទទួលបាន ២.៥%' : '2. Friend Gets +2.5%'}
          </h3>
          <p className="font-price text-xs text-[#8B90A0]">
            {lang === 'KM'
              ? 'នៅពេលមិត្តភក្តិបញ្ចូលប្រាក់ដោយប្រើកូដរបស់អ្នក ពួកគេទទួលបានថែម ២.៥%'
              : 'Your friend receives +2.5% extra wallet cash bonus on every top-up.'}
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-[#1C1F29]/90 backdrop-blur-md rounded-2xl p-6 border border-[#ffb230]/50 flex flex-col items-center text-center relative overflow-hidden group hover:border-[#ffb230] transition-all shadow-[0_0_20px_rgba(255,178,48,0.15)]">
          <div className="w-16 h-16 rounded-2xl bg-[#ffb230]/20 flex items-center justify-center mb-4 border border-[#ffb230]/50 shadow-[0_0_15px_rgba(255,178,48,0.3)] group-hover:scale-110 transition-all">
            <Award className="w-8 h-8 text-[#ffb230]" />
          </div>
          <div className="bg-[#ffb230] text-[#291800] text-[10px] font-headline font-bold px-2.5 py-0.5 rounded-full uppercase mb-2">
            You Earn 5.0% Cash
          </div>
          <h3 className="font-headline text-lg text-[#ffd7a1] mb-1 uppercase tracking-wide">
            {lang === 'KM' ? '៣. អ្នកទទួលបាន ៥.០%' : '3. You Earn 5.0%'}
          </h3>
          <p className="font-price text-xs text-[#ffd7a1]/80">
            {lang === 'KM'
              ? 'ទទួលបានប្រាក់ ៥% ភ្លាមៗចូលក្នុងសមតុល្យកាបូប គ្មានដែនកំណត់!'
              : 'You receive instant 5% commission added to your balance with zero caps.'}
          </p>
        </div>
      </section>

      {/* Referral Code & Quick Sharing Box */}
      <section className="bg-[#1C1F29] rounded-3xl p-6 sm:p-8 mb-10 border border-[#ffb230]/30 relative z-10 max-w-2xl mx-auto shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-price font-bold text-[#3ECF8E] uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3ECF8E]" />
            <span>YOUR REGISTERED INVITATION CODE</span>
          </span>
          <h2 className="font-headline text-xl sm:text-2xl text-[#e2e2ec] uppercase">
            {lang === 'KM' ? 'កូដណែនាំផ្លូវការរបស់អ្នក' : 'Your Official Referral Code'}
          </h2>
        </div>

        {/* Code Display & Action Buttons */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="flex-1 bg-[#10121A] border border-white/15 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between focus-within:border-[#ffb230] transition-all">
              <span className="font-mono text-base sm:text-lg font-bold text-[#ffd7a1] tracking-widest uppercase select-all">
                {referralCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-[#8B90A0] hover:text-[#ffd7a1] p-1 rounded-lg transition-colors"
                title="Copy code"
              >
                {copiedCode ? <Check className="w-5 h-5 text-[#3ECF8E]" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="bg-[#ffb230] hover:bg-[#ffc259] text-[#291800] font-headline text-xs sm:text-sm px-6 py-3.5 rounded-2xl uppercase tracking-wider font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#ffb230]/20"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-[#291800]" />
                  <span>{lang === 'KM' ? 'បានចម្លង!' : 'Link Copied!'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>{lang === 'KM' ? 'ចម្លងតំណភ្ជាប់ (Copy Link)' : 'Copy Invite Link'}</span>
                </>
              )}
            </button>
          </div>

          {/* Social Share Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={handleShareTelegram}
              className="bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-[#0088cc] px-4 py-2 rounded-xl text-xs font-price font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{lang === 'KM' ? 'ផ្ញើតាម Telegram' : 'Share to Telegram'}</span>
            </button>

            {qrCodeUrl && (
              <button
                onClick={() => setShowQRModal(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#ffd7a1] px-4 py-2 rounded-xl text-xs font-price font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                <QrCode className="w-4 h-4 text-[#ffd7a1]" />
                <span>{lang === 'KM' ? 'បង្ហាញ QR Code' : 'View QR Code'}</span>
              </button>
            )}

            <button
              onClick={() => onOpenTopup(referralCode)}
              className="bg-[#3ECF8E]/15 hover:bg-[#3ECF8E]/25 border border-[#3ECF8E]/30 text-[#3ECF8E] px-4 py-2 rounded-xl text-xs font-price font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>{lang === 'KM' ? 'សាកល្បង Top-Up ឥឡូវ' : 'Test Top-Up'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mb-10 relative z-10 space-y-4">
        <h3 className="font-headline text-lg sm:text-xl text-[#e2e2ec] uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#ffb230]" />
          <span>{lang === 'KM' ? 'ស្ថិតិការណែនាំរបស់អ្នក' : 'Referral Performance Stats'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Friends Invited */}
          <div className="bg-[#1C1F29] rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-price text-[#8B90A0]">
              <span className="uppercase">{lang === 'KM' ? 'មិត្តភក្តិបានណែនាំ' : 'Friends Invited'}</span>
              <Users className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div className="mt-3">
              <span className="font-headline text-3xl sm:text-4xl text-[#e2e2ec]">
                {referralCount}
              </span>
              <p className="text-[11px] font-price text-[#8B90A0] mt-1">
                Active gamers who used your code
              </p>
            </div>
          </div>

          {/* Total Rewards Earned */}
          <div className="bg-[#1C1F29] rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-price text-[#8B90A0]">
              <span className="uppercase">{lang === 'KM' ? 'ប្រាក់រង្វាន់សរុប (USD)' : 'Total 5% Commission Earned'}</span>
              <Coins className="w-4 h-4 text-[#3ECF8E]" />
            </div>
            <div className="mt-3">
              <span className="font-headline text-3xl sm:text-4xl text-[#3ECF8E]">
                ${referralEarnings.toFixed(2)}{' '}
                <span className="font-price text-sm text-[#8B90A0]">USD</span>
              </span>
              <p className="text-[11px] font-price text-[#8B90A0] mt-1">
                Directly added to your balance
              </p>
            </div>
          </div>

          {/* Bonus Rate Breakdown */}
          <div className="bg-[#1C1F29] rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-price text-[#8B90A0]">
              <span className="uppercase">{lang === 'KM' ? 'អត្រាប្រាក់រង្វាន់' : 'Split Bonus Structure'}</span>
              <Percent className="w-4 h-4 text-[#ffd7a1]" />
            </div>
            <div className="mt-3">
              <span className="font-headline text-2xl sm:text-3xl text-[#ffd7a1]">
                5% <span className="text-xs font-price text-white">/</span> 2.5%
              </span>
              <p className="text-[11px] font-price text-[#3ECF8E] mt-1">
                You get 5% • Friend gets 2.5%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Friend Top-Up Simulation Tester */}
      <section className="bg-[#141622] rounded-3xl p-6 sm:p-8 border border-white/10 relative z-10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-headline text-base sm:text-lg text-[#ffd7a1] uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffb230]" />
              <span>{lang === 'KM' ? 'សាកល្បងគណនាប្រាក់រង្វាន់ (Bonus Calculator & Test)' : 'Simulate Split Referral Reward'}</span>
            </h3>
            <p className="text-xs font-price text-[#8B90A0] mt-0.5">
              Test how much your friend receives (+2.5%) and how much commission you earn (+5.0%) when they top up.
            </p>
          </div>
          <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] text-[11px] font-price font-bold px-2.5 py-1 rounded-full border border-[#3ECF8E]/30 shrink-0">
            Interactive Test
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-xs font-price text-[#8B90A0] block mb-1">
              {lang === 'KM' ? 'ឈ្មោះមិត្តភក្តិ (Friend Username)' : 'Friend Username'}
            </label>
            <input
              type="text"
              value={simFriendName}
              onChange={(e) => setSimFriendName(e.target.value)}
              placeholder="e.g. GamerPro_KH"
              className="w-full bg-[#1C1F29] text-[#e2e2ec] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-price focus:outline-none focus:border-[#ffb230]"
            />
          </div>

          <div>
            <label className="text-xs font-price text-[#8B90A0] block mb-1">
              {lang === 'KM' ? 'ចំនួនប្រាក់ Top-Up' : 'Friend Top-Up Amount'}
            </label>
            <select
              value={simTopUpAmount}
              onChange={(e) => setSimTopUpAmount(parseFloat(e.target.value))}
              className="w-full bg-[#1C1F29] text-[#e2e2ec] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-price focus:outline-none focus:border-[#ffb230]"
            >
              <option value={10}>$10.00 Pack (Friend: +$0.25 | You: +$0.50)</option>
              <option value={20}>$20.00 Pack (Friend: +$0.50 | You: +$1.00)</option>
              <option value={50}>$50.00 Pack (Friend: +$1.25 | You: +$2.50)</option>
              <option value={100}>$100.00 Pack (Friend: +$2.50 | You: +$5.00)</option>
              <option value={200}>$200.00 Pack (Friend: +$5.00 | You: +$10.00)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating || !simFriendName.trim()}
              className="w-full bg-[#3ECF8E] hover:bg-[#48de9a] text-[#003822] font-headline text-xs py-3 rounded-xl uppercase font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {isSimulating ? 'Simulating...' : `Simulate (+$${(simTopUpAmount * 0.05).toFixed(2)} You Earn)`}
              </span>
            </button>
          </div>
        </div>

        {simulationResult && (
          <div className="bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 rounded-2xl p-4 space-y-1 text-xs font-price text-[#e2e2ec] animate-fade-in mt-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#3ECF8E] shrink-0" />
              <p className="font-bold text-[#3ECF8E]">
                Simulation Successful!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[12px]">
              <div className="bg-[#10121A] p-2.5 rounded-xl border border-white/10">
                <span className="text-[#8B90A0] block text-[10px]">FRIEND ({simulationResult.friend}) GETS:</span>
                <span className="text-[#3ECF8E] font-bold text-sm">+${simulationResult.friendBonus.toFixed(2)} USD (2.5% Bonus)</span>
              </div>
              <div className="bg-[#10121A] p-2.5 rounded-xl border border-white/10">
                <span className="text-[#8B90A0] block text-[10px]">YOU ({userProfile.username}) EARN:</span>
                <span className="text-[#ffd7a1] font-bold text-sm">+${simulationResult.referrerBonus.toFixed(2)} USD (5.0% Cash)</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1F29] border border-[#ffb230]/40 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl animate-scale-in">
            <h3 className="font-headline text-lg text-[#ffd7a1] uppercase">
              {lang === 'KM' ? 'ស្កេនកូដណែនាំ (Scan QR)' : 'Scan Referral QR'}
            </h3>
            <p className="text-xs font-price text-[#8B90A0]">
              Friends can scan this QR code directly with their phone camera to apply your referral code automatically.
            </p>

            {qrCodeUrl && (
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
                <img src={qrCodeUrl} alt="Referral QR Code" className="w-48 h-48 mx-auto" />
              </div>
            )}

            <div className="bg-[#10121A] p-2.5 rounded-xl border border-white/10 font-mono text-xs text-[#ffd7a1] font-bold">
              {referralCode}
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full bg-[#282a31] hover:bg-[#ffb230] hover:text-[#291800] text-[#e2e2ec] font-headline text-xs py-3 rounded-xl uppercase font-bold transition-colors"
            >
              {lang === 'KM' ? 'បិទ (Close)' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

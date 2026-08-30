import React, { useState } from 'react';
import { Coupon } from '../../types';
import { ArrowLeft, Tag, Plus, Check, Percent } from 'lucide-react';

interface AdminCouponsProps {
  coupons: Coupon[];
  onAddCoupon: (coupon: Coupon) => void;
  onToggleCoupon: (code: string) => void;
  onBack: () => void;
  lang: 'KM' | 'EN';
}

export const AdminCoupons: React.FC<AdminCouponsProps> = ({
  coupons,
  onAddCoupon,
  onToggleCoupon,
  onBack,
  lang,
}) => {
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState('10');
  const [newDesc, setNewDesc] = useState('');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const coupon: Coupon = {
      code: newCode.trim().toUpperCase(),
      discountPercent: parseInt(newPercent, 10) || 10,
      active: true,
      usageCount: 0,
      description: newDesc.trim() || 'Store promo discount code',
    };

    onAddCoupon(coupon);
    setNewCode('');
    setNewDesc('');
  };

  return (
    <div className="min-h-screen pb-28 pt-20 px-4 md:px-8 max-w-2xl mx-auto flex flex-col gap-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#1C1F29] border border-white/10 text-[#ffd7a1] hover:text-[#ffb230] flex items-center justify-center transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-headline text-2xl md:text-3xl text-[#ffd7a1] uppercase tracking-wider text-center flex-1 pr-10">
          COUPON CODES
        </h1>
      </div>

      {/* Create New Coupon */}
      <form onSubmit={handleCreateCoupon} className="bg-[#1C1F29] border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="font-headline text-lg text-[#ffd7a1] uppercase flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Create Discount Coupon
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-price text-xs text-[#8B90A0] block mb-1">
              Coupon Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MEGA20"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="w-full bg-[#11131a] text-[#e2e2ec] border border-white/10 rounded-xl px-3 py-2 text-sm font-price uppercase focus:border-[#ffb230] outline-none"
            />
          </div>

          <div>
            <label className="font-price text-xs text-[#8B90A0] block mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              required
              value={newPercent}
              onChange={(e) => setNewPercent(e.target.value)}
              className="w-full bg-[#11131a] text-[#e2e2ec] border border-white/10 rounded-xl px-3 py-2 text-sm font-price focus:border-[#ffb230] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-price text-xs text-[#8B90A0] block mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="Special event promo"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-[#11131a] text-[#e2e2ec] border border-white/10 rounded-xl px-3 py-2 text-xs font-price focus:border-[#ffb230] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-base py-3 rounded-xl uppercase font-bold chunky-btn-gold transition-all"
        >
          + ADD COUPON CODE
        </button>
      </form>

      {/* Coupons List */}
      <div className="space-y-3">
        <h3 className="font-price text-xs text-[#8B90A0] uppercase tracking-wider px-1">
          Active Store Coupons ({coupons.length})
        </h3>

        <div className="space-y-3">
          {coupons.map((c) => (
            <div
              key={c.code}
              className="bg-[#1C1F29] border border-white/10 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/15 text-[#3ECF8E] flex items-center justify-center font-price font-bold">
                  %{c.discountPercent}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-lg text-[#ffd7a1] tracking-wider">{c.code}</span>
                    <span
                      className={`text-[10px] font-price font-bold px-2 py-0.5 rounded-full ${
                        c.active
                          ? 'bg-[#3ECF8E]/20 text-[#3ECF8E]'
                          : 'bg-[#8B90A0]/20 text-[#8B90A0]'
                      }`}
                    >
                      {c.active ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  <p className="font-price text-xs text-[#8B90A0]">{c.description} • {c.usageCount} Uses</p>
                </div>
              </div>

              <button
                onClick={() => onToggleCoupon(c.code)}
                className={`font-price text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                  c.active
                    ? 'border-[#E8433F]/40 text-[#E8433F] hover:bg-[#E8433F]/10'
                    : 'border-[#3ECF8E]/40 text-[#3ECF8E] hover:bg-[#3ECF8E]/10'
                }`}
              >
                {c.active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

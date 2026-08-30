import React, { useState } from 'react';
import { UserProfile, ActiveScreen } from '../types';
import { ShieldCheck, Smartphone, Laptop, Lock, ArrowLeft, Check, AlertTriangle, Key } from 'lucide-react';

interface SecuritySettingsScreenProps {
  userProfile: UserProfile;
  onBack: () => void;
  lang: 'KM' | 'EN';
}

export const SecuritySettingsScreen: React.FC<SecuritySettingsScreenProps> = ({
  userProfile,
  onBack,
  lang,
}) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(userProfile.is2FAEnabled);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSaved, setPassSaved] = useState(false);

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
          SECURITY & PRIVACY
        </h1>
      </div>

      {/* Password Management */}
      <section className="bg-[#1C1F29] rounded-2xl p-5 border border-white/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffb230]/15 text-[#ffb230] flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold text-[#e2e2ec]">Account Password</h3>
              <p className="font-price text-xs text-[#8B90A0]">Last changed 3 weeks ago</p>
            </div>
          </div>
          <button
            onClick={() => setIsChangingPass(!isChangingPass)}
            className="bg-[#282a31] hover:bg-[#33343c] text-[#ffd7a1] font-price text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
          >
            {isChangingPass ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {isChangingPass && (
          <div className="pt-3 border-t border-white/5 space-y-3">
            <input
              type="password"
              placeholder="Current Password"
              className="w-full bg-[#11131a] text-[#e2e2ec] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-price focus:border-[#ffb230] outline-none"
            />
            <input
              type="password"
              placeholder="New Secure Password"
              className="w-full bg-[#11131a] text-[#e2e2ec] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-price focus:border-[#ffb230] outline-none"
            />
            <button
              onClick={() => {
                setPassSaved(true);
                setTimeout(() => {
                  setPassSaved(false);
                  setIsChangingPass(false);
                }, 1200);
              }}
              className="w-full bg-[#ffb230] text-[#291800] font-headline py-2.5 rounded-xl uppercase font-bold chunky-btn-gold"
            >
              {passSaved ? 'Password Updated!' : 'Save New Password'}
            </button>
          </div>
        )}
      </section>

      {/* Two-Factor Authentication (2FA) */}
      <section className="bg-[#1C1F29] rounded-2xl p-5 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/15 text-[#3ECF8E] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-sm font-bold text-[#e2e2ec]">Two-Factor Authentication (2FA)</h3>
              <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-price font-bold px-2 py-0.5 rounded-full">
                Protected
              </span>
            </div>
            <p className="font-price text-xs text-[#8B90A0] mt-0.5">
              Google Authenticator / live OTP code active
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => setIs2FAEnabled(!is2FAEnabled)}
          className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
            is2FAEnabled ? 'bg-[#3ECF8E]' : 'bg-[#33343c]'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
              is2FAEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </section>

      {/* Login Activity / Active Sessions */}
      <section className="space-y-3">
        <h3 className="font-price text-xs text-[#8B90A0] uppercase tracking-wider px-1">
          Active Login Sessions
        </h3>

        <div className="bg-[#1C1F29] rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
          {userProfile.activeSessions.map((session) => (
            <div key={session.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#282a31] text-[#ffd7a1] flex items-center justify-center">
                  {session.type === 'mobile' ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-sans text-sm font-semibold text-[#e2e2ec]">{session.device}</p>
                    {session.isCurrent && (
                      <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-price font-bold px-2 py-0.5 rounded-full">
                        This Device
                      </span>
                    )}
                  </div>
                  <p className="font-price text-xs text-[#8B90A0]">
                    {session.location} • {session.lastActive}
                  </p>
                </div>
              </div>

              {!session.isCurrent && (
                <button className="text-xs font-price text-[#E8433F] hover:underline">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-[#1C1F29]/60 border border-[#E8433F]/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[#E8433F]">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="font-sans text-sm font-bold">Delete Account & Data</h4>
          </div>
          <p className="font-price text-xs text-[#8B90A0] mt-0.5">
            Permanently delete your Uchiro Store account and wallet balance.
          </p>
        </div>
        <button className="bg-[#E8433F]/20 hover:bg-[#E8433F] text-[#E8433F] hover:text-white border border-[#E8433F]/40 font-price text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0">
          Delete Account
        </button>
      </section>
    </div>
  );
};

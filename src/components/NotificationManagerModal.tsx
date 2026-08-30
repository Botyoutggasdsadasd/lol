import React, { useState, useEffect } from 'react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  isSoundAlertEnabled,
  setSoundAlertEnabled,
  getSoundAlertVolume,
  setSoundAlertVolume,
  sendTestDesktopNotification,
  playOrderAlertChime,
  NotificationPermissionStatus,
} from '../utils/desktopNotification';
import { Bell, Volume2, VolumeX, Shield, CheckCircle2, AlertTriangle, Sparkles, X, Radio, Laptop } from 'lucide-react';

interface NotificationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  logoUrl?: string;
  onViewOrders?: () => void;
}

export const NotificationManagerModal: React.FC<NotificationManagerModalProps> = ({
  isOpen,
  onClose,
  logoUrl,
  onViewOrders,
}) => {
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setSoundEnabledState(isSoundAlertEnabled());
      setVolumeState(getSoundAlertVolume());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      sendTestDesktopNotification(logoUrl, onViewOrders);
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundAlertEnabled(next);
    if (next) {
      playOrderAlertChime(volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolumeState(newVol);
    setSoundAlertVolume(newVol);
  };

  const handleTestAlert = () => {
    sendTestDesktopNotification(logoUrl, onViewOrders);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const isSupported = isNotificationSupported();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-md w-full bg-[#1C1F29] border border-[#ffb230]/30 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ffb230] to-[#E8433F] text-[#291800] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,178,48,0.4)]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline text-lg text-[#ffd7a1] uppercase tracking-wide">
                Desktop Order Alerts
              </h2>
              <p className="font-price text-xs text-[#8B90A0]">
                Real-time alerts for incoming orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#11131a] hover:bg-white/10 text-[#8B90A0] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Desktop Notification Permission Status Box */}
        <section className="bg-[#11131a] rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#ffd7a1]" />
              <span className="font-price text-xs font-bold text-[#e2e2ec] uppercase">
                System OS Notifications
              </span>
            </div>
            <span
              className={`font-price text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                permission === 'granted'
                  ? 'bg-[#3ECF8E]/20 text-[#3ECF8E] border-[#3ECF8E]/40'
                  : permission === 'denied'
                  ? 'bg-[#E8433F]/20 text-[#E8433F] border-[#E8433F]/40'
                  : 'bg-[#ffb230]/20 text-[#ffb230] border-[#ffb230]/40'
              }`}
            >
              {permission === 'granted'
                ? '🟢 Active'
                : permission === 'denied'
                ? '🔴 Blocked'
                : '🟡 Pending Permission'}
            </span>
          </div>

          <p className="font-price text-xs text-[#8B90A0] leading-relaxed">
            Pops up native desktop notifications on Windows, macOS, Linux, or mobile whenever a customer submits a KHQR payment, even if your browser is minimized or in the background.
          </p>

          {permission !== 'granted' && isSupported && (
            <button
              onClick={handleRequestPermission}
              className="w-full bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-xs py-3 rounded-xl uppercase font-bold tracking-wider chunky-btn-gold transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Allow Desktop Notifications</span>
            </button>
          )}

          {permission === 'denied' && (
            <div className="bg-[#E8433F]/15 border border-[#E8433F]/30 p-2.5 rounded-xl text-[11px] text-[#ff8e8b] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Notifications are blocked in your browser. Click the lock icon in your browser URL bar to Allow notifications.
              </span>
            </div>
          )}
        </section>

        {/* 2. Audio Chime Settings */}
        <section className="bg-[#11131a] rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#3ECF8E]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#8B90A0]" />
              )}
              <span className="font-price text-xs font-bold text-[#e2e2ec] uppercase">
                Synthesized Alert Chime
              </span>
            </div>

            <button
              onClick={handleToggleSound}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                soundEnabled ? 'bg-[#3ECF8E]' : 'bg-[#33343c]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {soundEnabled && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-price text-[#8B90A0]">
                <span>Chime Volume</span>
                <span className="text-[#ffd7a1] font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                onMouseUp={() => playOrderAlertChime(volume)}
                className="w-full accent-[#ffb230] h-1.5 bg-[#1C1F29] rounded-lg cursor-pointer"
              />
            </div>
          )}
        </section>

        {/* 3. Test & Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={handleTestAlert}
            className="flex-1 bg-[#11131a] hover:bg-[#282a31] border border-[#ffb230]/40 text-[#ffd7a1] hover:text-[#ffb230] font-headline text-xs py-3 rounded-xl uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Radio className={`w-4 h-4 ${testSent ? 'text-[#3ECF8E] animate-ping' : 'text-[#ffb230]'}`} />
            <span>{testSent ? 'Alert Sent! 🔔' : 'Test Alert & Chime'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-[#ffb230] hover:bg-[#ffb94d] text-[#291800] font-headline text-xs px-5 py-3 rounded-xl uppercase font-bold chunky-btn-gold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

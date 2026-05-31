import React, { useState } from 'react';
import { AppUser } from '../types';
import { ShieldAlert, KeyRound, Eye, EyeOff, Loader2, ArrowRight, Lock, LogOut } from 'lucide-react';

interface ConsoleLockOverlayProps {
  currentUser: AppUser | null;
  onUnlock: (password: string) => boolean;
  onLogout: () => void;
}

export default function ConsoleLockOverlay({ currentUser, onUnlock, onLogout }: ConsoleLockOverlayProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('សូមបញ្ចូលលេខសម្ងាត់! (Password is required)');
      return;
    }

    setIsVerifying(true);
    
    // Slight artificial lag for a hyper-realistic premium secure look
    setTimeout(() => {
      const success = onUnlock(password);
      setIsVerifying(false);
      if (success) {
        setPassword('');
      } else {
        setErrorMsg('លេខសម្ងាត់ចាក់សោមិនត្រឹមត្រូវឡើយ! (Incorrect screen unlock password)');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center p-4 font-sans select-none overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute right-1/4 top-1/4 w-96 h-96 bg-[#D40511] opacity-10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute left-1/4 bottom-1/4 w-80 h-80 bg-[#FFCC00] opacity-5 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full text-center space-y-8 relative z-10 animate-scale-up">
        
        {/* Shield Header */}
        <div className="space-y-3">
          <div className="inline-flex relative">
            <div className="w-16 h-16 bg-[#D40511]/10 rounded-3xl border border-[#D40511]/25 flex items-center justify-center relative">
              <Lock className="w-8 h-8 text-[#D40511] animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFCC00] rounded-full border-4 border-[#0a0a0a] animate-ping" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFCC00] rounded-full border-4 border-[#0a0a0a]" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D40511]/10 rounded-full border border-[#D40511]/20">
              <ShieldAlert className="w-3 h-3 text-[#D40511]" />
              <span className="text-[9px] font-black tracking-widest text-[#D40511] uppercase">
                CONSOLE ACCESS RESTRICTED
              </span>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              អេក្រង់ចាក់សោសុវត្ថិភាព (SECURE LOCK)
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              DHL Games Day scoring workspace has been suspended
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-[#141414] border border-[#222222] p-5 rounded-3xl flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D40511] to-[#b0040d] flex items-center justify-center text-white font-black text-lg shadow-inner">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 leading-none">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              ACTIVE ACCOUNT SESSION
            </p>
            <p className="text-base font-black text-white uppercase mt-1">
              {currentUser.name}
            </p>
            <p className="text-[9px] text-[#FFCC00] font-bold uppercase tracking-wider mt-1.5">
              {currentUser.role === 'super_admin' ? '✪ SUPER ADMIN' : '✪ MODERATOR'}
            </p>
          </div>
        </div>

        {/* Unlock Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500">
              <KeyRound className="w-4 h-4" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isVerifying}
              placeholder="វាយលេខសម្ងាត់ដើម្បីដោះសោ (Enter password to unlock)"
              className="w-full bg-[#141414] border border-[#262626] pl-11 pr-12 py-3.5 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#D40511]/30 focus:border-[#D40511] transition duration-200 placeholder:text-gray-600 disabled:opacity-50 text-center tracking-widest"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/45 border border-red-900/30 rounded-2xl flex items-start gap-2 text-left animate-shake">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span className="text-[11px] text-red-400 font-bold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-gray-400 font-bold text-xs uppercase tracking-wider rounded-2xl border border-neutral-800 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ចាកចេញ (Exit Log)</span>
            </button>

            <button
              type="submit"
              disabled={isVerifying}
              className="flex-[2] py-3 bg-[#D40511] hover:bg-[#b0040d] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-[#D40511]/10 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>ផ្ទៀងផ្ទាត់... (Decrypting...)</span>
                </>
              ) : (
                <>
                  <span>ដោះសោឧបករណ៍ (Unlock Console)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

        {/* Footer */}
        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider border-t border-[#1a1a1a] pt-4 mt-8">
          DHL CRITICAL SECURE TERMINAL v2.6
        </div>

      </div>

    </div>
  );
}

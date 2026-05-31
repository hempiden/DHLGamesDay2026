import React, { useState } from 'react';
import { AppUser } from '../types';
import { X, ShieldCheck, KeyRound, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Sparkles, User, Mail, Calendar } from 'lucide-react';

interface ProfileOverlayProps {
  currentUser: AppUser | null;
  onClose: () => void;
  onUpdatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ProfileOverlay({ currentUser, onClose, onUpdatePassword }: ProfileOverlayProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('សូមបំពេញគ្រប់ចន្លោះសម្រាប់ការផ្លាស់ប្តូរលេខសម្ងាត់! (Please fill of all password fields)');
      return;
    }

    if (currentPassword !== currentUser.passwordPlain) {
      setErrorMsg('លេខសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវឡើយ! (Current password is incorrect)');
      return;
    }

    if (newPassword.length < 5) {
      setErrorMsg('លេខសម្ងាត់ថ្មីត្រូវមានប្រវែងយ៉ាងតិច ៥ ខ្ទង់! (New password must be at least 5 characters)');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('ការបញ្ជាក់លេខសម្ងាត់ថ្មីមិនត្រូវគ្នាឡើយ! (Confirm password does not match)');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg('លេខសម្ងាត់ថ្មីមិនអាចដូចលេខសម្ងាត់ចាស់ទេ! (New password cannot be the same as the old password)');
      return;
    }

    setSaving(true);
    try {
      const res = await onUpdatePassword(newPassword);
      if (res.success) {
        setSuccessMsg(res.error || 'លេខសម្ងាត់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ! (Password successfully updated!)');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.error || 'ការផ្លាស់ប្តូរលេខសម្ងាត់មានបញ្ហា! (Failed to change password)');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred during operation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-gray-100 flex flex-col md:flex-row animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Aspect Banner (Profile Info) */}
        <div className="bg-gradient-to-br from-[#D40511] to-[#b0040d] p-8 text-white flex-1 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#FFCC00] opacity-10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFCC00] fill-[#FFCC00]/20" />
              <span className="text-[9px] font-black tracking-wider uppercase text-[#FFCC00]">DHL ACCESS CARD</span>
            </div>

            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 mb-2">
                <User className="w-8 h-8 text-[#FFCC00]" />
              </div>
              <h3 className="text-xl font-black truncate leading-tight">{currentUser.name}</h3>
              <p className="text-[10px] bg-black/20 text-[#FFCC00] font-black uppercase tracking-wider px-2 py-0.5 rounded-md inline-block">
                {currentUser.role === 'super_admin' ? 'Super Admin' : 'Tournament Facilitator'}
              </p>
            </div>

            <div className="space-y-3.5 pt-4 border-t border-white/10 text-xs text-white/80 font-medium">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
                <span className="truncate">Username: {currentUser.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
                <span>Created: {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'Active Session'}</span>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-[#FFCC00] font-black uppercase tracking-wider mt-8 border-t border-white/10 pt-4 leading-normal">
            GAMES DAY TOURNAMENT SYSTEM
          </div>
        </div>

        {/* Right Aspect Form (Security change password) */}
        <div className="p-8 flex-[1.25] flex flex-col justify-between relative bg-white min-h-[420px]">
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <KeyRound className="w-4.5 h-4.5 text-[#D40511]" />
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">
                ប្តូរលេខសម្ងាត់ (Change Password)
              </h4>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  លេខសម្ងាត់បច្ចុប្បន្ន (Current Password)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    maxLength={30}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D40511]/15 focus:border-[#D40511] transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  លេខសម្ងាត់ថ្មី (New Password)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    maxLength={30}
                    placeholder="Must be at least 5 chars"
                    className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D40511]/15 focus:border-[#D40511] transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  បញ្ជាក់លេខសម្ងាត់ថ្មី (Confirm New Password)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    maxLength={30}
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D40511]/15 focus:border-[#D40511] transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-[#D40511] font-bold leading-normal">{errorMsg}</span>
                </div>
              )}

              {/* Success messages */}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-emerald-700 font-bold leading-normal">{successMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>កំពុងផ្លាស់ប្តូរ (Updating...)</span>
                  </>
                ) : (
                  <>
                    <span>ផ្លាស់ប្តូរលេខសម្ងាត់ (Update Password)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-[10px] text-gray-400 font-semibold border-t border-gray-100 pt-4 mt-4 text-center">
            DHL SCORING SECURITY COMPLIANT
          </div>
        </div>
      </div>
    </div>
  );
}

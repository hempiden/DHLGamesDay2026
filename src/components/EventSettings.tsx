import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, QrCode, Copy, Check, ExternalLink, Settings2, Sliders, ShieldCheck } from 'lucide-react';

interface EventSettingsProps {
  showPublicTeamsInHeader: boolean;
  onUpdateShowPublicTeamsInHeader: (val: boolean) => Promise<void>;
  isSupabaseEnabled: boolean;
  supabaseConnected: boolean;
}

export default function EventSettings({
  showPublicTeamsInHeader,
  onUpdateShowPublicTeamsInHeader,
  isSupabaseEnabled,
  supabaseConnected,
}: EventSettingsProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Derive dynamic shareable path for Public Teams page
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dhlgamesday2026.web.app';
  const shareableUrl = `${origin}/?tab=public_teams`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [toggleVal, setToggleVal] = useState(showPublicTeamsInHeader);

  // Sync state if prop changes from external sync
  useEffect(() => {
    setToggleVal(showPublicTeamsInHeader);
  }, [showPublicTeamsInHeader]);

  const handleToggle = async () => {
    const newVal = !toggleVal;
    setToggleVal(newVal);
    setIsUpdating(true);
    try {
      await onUpdateShowPublicTeamsInHeader(newVal);
    } catch (err) {
      console.error('Failed to update header settings:', err);
      // Rollback on failure
      setToggleVal(!newVal);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Centered Settings Container */}
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Banner Title */}
        <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 transform translate-x-12 translate-y-8 opacity-10">
            <Settings2 className="w-64 h-64" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-yellow-400 text-red-900 text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border border-yellow-300">
                Event Setting Suite
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-1.5">
                ការកំណត់ការប្រកួត (Event Manager)
              </h2>
              <p className="text-xs text-red-100 font-medium max-w-lg">
                គ្រប់គ្រងភាពមើលឃើញនៃមុខងារផ្សេងៗ និងទីតាំងទំព័រសាធារណៈដើម្បីភាពងាយស្រួលរបស់អ្នកទស្សនា។
                Manage view visibility and share direct action page links or custom QR spectator passes.
              </p>
            </div>
          </div>
        </div>

        {/* Setting Card 1 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  ការបង្ហាញម៉ឺនុយហ្គេម (Header Navigation Menu)
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                  Toggle what spectators see on top header panel
                </p>
              </div>
            </div>
            
            {/* Sync status */}
            {isSupabaseEnabled && (
              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                supabaseConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-red-50 text-red-500 border border-red-100'
              }`}>
                {supabaseConnected ? 'Remote Sync Enabled' : 'Local Only Sync'}
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="space-y-1 max-w-md">
                <h4 className="text-xs font-black text-gray-800 uppercase">
                  ទំព័របញ្ជីឈ្មោះក្រុមសាធារណៈ (Public Teams Page)
                </h4>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  អនុញ្ញាតឱ្យបង្ហាញ ឬលាក់ប៊ូតុង <strong className="text-red-600 font-bold">"បញ្ជីឈ្មោះក្រុម (Public Teams)"</strong> ចេញពី Header menu សម្រាប់ spectators ទូទៅ។
                  Toggle whether the "Public Teams" button is placed directly in the navigation header bar.
                </p>
              </div>

              {/* IOS Styled Toggle Switch */}
              <button
                type="button"
                onClick={handleToggle}
                disabled={isUpdating}
                className="focus:outline-none flex items-center select-none cursor-pointer transition active:scale-95 duration-150"
              >
                {toggleVal ? (
                  <ToggleRight className="w-14 h-10 text-[#D40511] font-light" />
                ) : (
                  <ToggleLeft className="w-14 h-10 text-gray-300 font-light" />
                )}
              </button>
            </div>

            <div className="space-y-3 pt-2 text-xs border-t border-gray-50 mt-4">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-[11px] text-amber-800 space-y-1.5 font-medium leading-relaxed">
                <p className="font-bold">
                  ⚠️ ចំណាំ (Note for Admins):
                </p>
                <p>
                  ទោះបីជាលាក់ប៊ូតុងនេះចេញពី Header menu ក៏ដោយ ក៏លោកអ្នក ឬអ្នកទស្សនានៅតែអាចចូលទំព័រនេះដោយផ្ទាល់បានដែរ តាមរយៈរយៈការស្កែន QR Code ឬចុចលើតំណភ្ជាប់ (Link) ខាងក្រោមនេះ។
                </p>
                <p className="text-amber-700 italic">
                  Even when hidden, spectators can still view live squads and rosters if they scan the QR card or use the direct link you distribute.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QR & Share distribution container */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-2xl border border-yellow-105">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                តំណភ្ជាប់ និង QR Code សម្រាប់ចែករំលែក (Direct Page Distribution)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                Distribute direct spectator link to search teams and upload athlete profile photos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left side: descriptions & copy link */}
            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-gray-800 uppercase">
                  តំណភ្ជាប់ផ្ទាល់ទៅកាន់ទំព័រ (Specator Direct Link)
                </h4>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  ចម្លងតំណភ្ជាប់នេះ រួចផ្ញើតាម Telegram, ផុសលើ Social Media ឬប្រើប្រាស់ដើម្បីបង្កើតប្រព័ន្ធផ្សព្វផ្សាយរបស់លោកអ្នក៖
                  Copy and send this direct URL to athletes or groups so they can check profiles and upload photos easily.
                </p>
              </div>

              {/* Direct link URL display container */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-150 font-mono text-[10px] text-gray-600 break-all select-all relative group shadow-inner">
                <span className="flex-1 truncate pr-8">{shareableUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="absolute right-2 p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-[#D40511] rounded-lg transition-all cursor-pointer shadow-xs active:scale-90"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Additional trigger buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    copied
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-[#FFCC00] text-gray-900 hover:bg-[#ffe054] border border-[#e5b800]'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'ចម្លងរួចរាល់! Copied' : 'ចម្លងតំណភ្ជាប់ (Copy URL)'}</span>
                </button>

                <a
                  href={shareableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>បើកមើលផ្ទាល់ (Open Page)</span>
                </a>
              </div>
            </div>

            {/* Right side: QR Code layout */}
            <div className="flex flex-col items-center justify-center bg-gray-50 p-5 rounded-3xl border border-gray-150 relative space-y-3 shadow-inner">
              
              {/* QR Code Container styled like a pass card */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareableUrl)}`}
                  alt="Public Teams Direct QR Code"
                  className="w-40 h-40 object-contain select-none pointer-events-none"
                />
                <div className="mt-2 text-center">
                  <p className="text-[10px] font-black font-dhl-title text-[#D40511] uppercase tracking-wide">
                    DHL GAMES DAY 2026
                  </p>
                  <p className="text-[7.5px] text-gray-400 font-bold uppercase tracking-wider">
                    Spectator Roster Scan Pass
                  </p>
                </div>
              </div>

              {/* Utility actions for QR */}
              <div className="text-center space-y-1.5">
                <p className="text-[10px] text-gray-400 font-bold uppercase">
                  ស្កែនសម្រាប់មើលបញ្ជីក្រុម (Scan for Public Teams)
                </p>
                <div className="flex gap-2 justify-center">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shareableUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-indigo-600 hover:underline flex items-center gap-1 uppercase"
                  >
                    <ExternalLink className="w-3 h-3" /> Get Large QR Code Image
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

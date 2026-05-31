import React, { useState, useEffect } from 'react';
import { Award, Layers, ToggleLeft, RefreshCw, AlertCircle, Laptop, Settings, Wifi, WifiOff, Users, Upload, Monitor, Database, ShieldAlert, LogOut, KeyRound, BarChart3, Timer, ChevronDown, Share2, Check, Languages } from 'lucide-react';
import { AppUser, EventInfo, OrganizationInfo } from '../types';

interface HeaderProps {
  activeTab: 'leaderboard' | 'public_teams' | 'dashboard' | 'scoring' | 'admin' | 'teams' | 'database' | 'users' | 'login' | 'settings' | 'enrolment' | 'organization';
  setActiveTab: (tab: 'leaderboard' | 'public_teams' | 'dashboard' | 'scoring' | 'admin' | 'teams' | 'database' | 'users' | 'login' | 'settings' | 'enrolment' | 'organization') => void;
  isOnline: boolean;
  supabaseConnected: boolean;
  currentUser: AppUser | null;
  onLogout: () => void;
  showPublicTeamsInHeader: boolean;
  isEnrolmentEnabled: boolean;
  events: EventInfo[];
  activeEventId: string;
  setActiveEventId: (id: string) => void;
  organization?: OrganizationInfo;
  currentLanguage?: 'kh' | 'en';
  onChangeLanguage?: (lang: 'kh' | 'en') => void;
}


export default function Header({ 
  activeTab, 
  setActiveTab, 
  isOnline, 
  supabaseConnected, 
  currentUser, 
  onLogout, 
  showPublicTeamsInHeader, 
  isEnrolmentEnabled,
  events,
  activeEventId,
  setActiveEventId,
  organization,
  currentLanguage = 'kh',
  onChangeLanguage = () => {}
}: HeaderProps) {
  
  const activeEvent = events.find(e => e.id === activeEventId) || events[0];
  const theme = activeEvent?.themeColor || 'dhl';

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/${organization?.slug || 'dhl-games'}/${activeEventId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      try {
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    });
  };

  // Dynamic colors based on active event theme
  const themeColors = {
    dhl: {
      primaryBg: 'bg-[#D40511]',
      textHex: 'text-[#D40511]',
      borderHex: 'border-b-4 border-[#FFCC00]',
      badgeBg: 'bg-[#D40511]',
      buttonActive: 'bg-[#D40511]',
    },
    cosmic: {
      primaryBg: 'bg-indigo-950',
      textHex: 'text-indigo-900',
      borderHex: 'border-b-4 border-cyan-400',
      badgeBg: 'bg-indigo-950',
      buttonActive: 'bg-indigo-950',
    },
    forest: {
      primaryBg: 'bg-emerald-950',
      textHex: 'text-emerald-900',
      borderHex: 'border-b-4 border-emerald-400',
      badgeBg: 'bg-emerald-950',
      buttonActive: 'bg-emerald-950',
    }
  };

  const colors = themeColors[theme] || themeColors.dhl;
  const brandAcronym = activeEvent?.name 
    ? activeEvent.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase() 
    : 'DHL';

  return (
    <header className={`sticky top-0 z-50 bg-white ${colors.borderHex} shadow-md transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 md:py-4 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              {organization?.logoUrl ? (
                <img 
                  src={organization.logoUrl} 
                  alt={organization.name || "Logo"} 
                  className="h-10 max-w-[140px] object-contain filter hover:brightness-95 hover:contrast-110 duration-200"
                  onError={(e) => {
                    // Fallback to text acronym if download fails
                    (e.target as HTMLElement).style.display = 'none';
                  }} 
                />
              ) : (
                <div className={`${colors.primaryBg} px-3 py-1.5 rounded-sm transform -skew-x-12 shadow-sm`}>
                  <span className="text-white font-black italic tracking-tighter text-lg leading-none select-none">
                    {brandAcronym}
                  </span>
                </div>
              )}
              <div className="border-l-2 border-gray-200 pl-3">
                {currentLanguage === 'kh' ? (
                  <>
                    <h1 className="font-bold text-gray-950 text-base sm:text-lg tracking-tight leading-none">
                      {activeEvent?.khmerName || 'ទិវាហ្គេម DHL ២០២៦'}
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      {activeEvent?.name || 'GAMES DAY 2026'}
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="font-bold text-gray-950 text-base sm:text-lg tracking-tight leading-none uppercase">
                      {activeEvent?.name || 'GAMES DAY 2026'}
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold tracking-wider mt-0.5">
                      {activeEvent?.khmerName || 'ទិវាហ្គេម DHL ២០២៦'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Language Switcher (visible only on mobile/tablet) */}
            {(activeEvent?.enabled_languages || ['kh', 'en']).length > 1 && (
              <div className="lg:hidden flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner select-none">
                {(activeEvent?.enabled_languages || ['kh', 'en']).includes('kh') && (
                  <button
                    type="button"
                    onClick={() => onChangeLanguage('kh')}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black tracking-wide transition-all active:scale-95 duration-150 cursor-pointer ${
                      currentLanguage === 'kh'
                        ? `${colors.primaryBg} text-white shadow-sm font-extrabold`
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>ខ្មែរ</span>
                  </button>
                )}
                {(activeEvent?.enabled_languages || ['kh', 'en']).includes('en') && (
                  <button
                    type="button"
                    onClick={() => onChangeLanguage('en')}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black tracking-wide transition-all active:scale-95 duration-150 cursor-pointer ${
                      currentLanguage === 'en'
                        ? `${colors.primaryBg} text-white shadow-sm font-extrabold`
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>EN</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tab Navigation Menu */}
          <div className="flex items-center overflow-x-auto pb-1 lg:pb-0 gap-1.5 no-scrollbar scroll-smooth">
            <button
               id="tab-leaderboard"
               onClick={() => setActiveTab('leaderboard')}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                 activeTab === 'leaderboard'
                   ? `${colors.primaryBg} text-white shadow-md`
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
               }`}
             >
               <Award className="w-4 h-4" />
               <span>{currentLanguage === 'kh' ? 'លទ្ធផល (Live Board)' : 'Leaderboard'}</span>
             </button>
 
            {showPublicTeamsInHeader && (
              <button
                id="tab-public-teams"
                onClick={() => setActiveTab('public_teams')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                  activeTab === 'public_teams'
                    ? `${colors.primaryBg} text-white shadow-md`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4 animate-pulse" />
                <span>{currentLanguage === 'kh' ? 'បញ្ជីឈ្មោះក្រុម (Public Teams)' : 'Public Teams'}</span>
              </button>
            )}
 
            {isEnrolmentEnabled && (
              <button
                id="tab-enrolment"
                onClick={() => setActiveTab('enrolment')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                  activeTab === 'enrolment'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{currentLanguage === 'kh' ? 'ចុះឈ្មោះលេងកីឡា (Enrol Athlete)' : 'Enrol Athlete'}</span>
              </button>
            )}
 
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? `${colors.primaryBg} text-white shadow-md`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{currentLanguage === 'kh' ? 'វិភាគទិន្នន័យ (Dashboard)' : 'Analytics Dashboard'}</span>
            </button>
 
            {currentUser ? (
              <>
                <button
                  id="tab-scoring"
                  onClick={() => setActiveTab('scoring')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                    activeTab === 'scoring'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{currentLanguage === 'kh' ? 'ផ្ទាំងបញ្ចូលពិន្ទុ (Scoring Panel)' : 'Scoring Panel'}</span>
                </button>
 
                <button
                  id="tab-settings"
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/15'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Settings className="w-4 h-4 font-bold" />
                  <span>{currentLanguage === 'kh' ? 'ការកំណត់ (Event Settings)' : 'Event Settings'}</span>
                </button>
              </>
            ) : (
              <button
                id="tab-login"
                onClick={() => setActiveTab('login')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap bg-[#FFCC00] text-gray-900 hover:bg-[#ffe054] shadow-sm`}
              >
                <KeyRound className="w-4 h-4" />
                <span>{currentLanguage === 'kh' ? 'ចូលគ្រងប្រព័ន្ធ (Admin Sign In)' : 'Admin Sign In'}</span>
              </button>
            )}
          </div>

          {/* Desktop Connection Status & User Profile */}
          <div className="hidden lg:flex items-center gap-4">
            
            {/* Show User Badge with Logout */}
            {currentUser && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
                <div className="text-right leading-none select-none">
                  <p className="text-[10px] font-black text-gray-800 uppercase">
                    {currentUser.name}
                  </p>
                  <p className="text-[8px] text-[#D40511] font-bold uppercase tracking-wider mt-0.5">
                    {currentUser.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 bg-red-50 hover:bg-red-100 text-[#D40511] rounded-xl transition cursor-pointer hover:scale-105"
                  title="Logout Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Desktop Language Switcher (visible only on desktop) */}
            {(activeEvent?.enabled_languages || ['kh', 'en']).length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner select-none">
                {(activeEvent?.enabled_languages || ['kh', 'en']).includes('kh') && (
                  <button
                    type="button"
                    onClick={() => onChangeLanguage('kh')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide transition-all active:scale-95 duration-150 cursor-pointer ${
                      currentLanguage === 'kh'
                        ? `${colors.primaryBg} text-white shadow-sm font-extrabold`
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>ភាសារខ្មែរ</span>
                  </button>
                )}
                {(activeEvent?.enabled_languages || ['kh', 'en']).includes('en') && (
                  <button
                    type="button"
                    onClick={() => onChangeLanguage('en')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide transition-all active:scale-95 duration-150 cursor-pointer ${
                      currentLanguage === 'en'
                        ? `${colors.primaryBg} text-white shadow-sm font-extrabold`
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>English</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

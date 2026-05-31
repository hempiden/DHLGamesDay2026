import React, { useState, useEffect } from 'react';
import { Award, Layers, ToggleLeft, RefreshCw, AlertCircle, Laptop, Settings, Wifi, WifiOff, Users, Upload, Monitor, Database, ShieldAlert, LogOut, KeyRound, BarChart3, Timer, ChevronDown } from 'lucide-react';
import { AppUser, EventInfo } from '../types';

interface HeaderProps {
  activeTab: 'leaderboard' | 'public_teams' | 'dashboard' | 'scoring' | 'admin' | 'teams' | 'database' | 'users' | 'login' | 'settings' | 'enrolment';
  setActiveTab: (tab: 'leaderboard' | 'public_teams' | 'dashboard' | 'scoring' | 'admin' | 'teams' | 'database' | 'users' | 'login' | 'settings' | 'enrolment') => void;
  isOnline: boolean;
  supabaseConnected: boolean;
  currentUser: AppUser | null;
  onLogout: () => void;
  showPublicTeamsInHeader: boolean;
  isEnrolmentEnabled: boolean;
  events: EventInfo[];
  activeEventId: string;
  setActiveEventId: (id: string) => void;
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
  setActiveEventId
}: HeaderProps) {
  
  const activeEvent = events.find(e => e.id === activeEventId) || events[0];
  const theme = activeEvent?.themeColor || 'dhl';

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
              <div className={`${colors.primaryBg} px-3 py-1.5 rounded-sm transform -skew-x-12 shadow-sm`}>
                <span className="text-white font-black italic tracking-tighter text-lg leading-none select-none">
                  {brandAcronym}
                </span>
              </div>
              <div className="border-l-2 border-gray-200 pl-3">
                <h1 className="font-bold text-gray-950 text-base sm:text-lg tracking-tight leading-none uppercase">
                  {activeEvent?.name || 'GAMES DAY 2026'}
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  {activeEvent?.khmerName || 'ទិវាហ្គេម DHL ២០២៦'}
                </p>
              </div>
            </div>

            {/* Event Selector Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
              <span className="text-gray-400 text-[9px] uppercase tracking-wider font-extrabold">សកម្មភាព / Event:</span>
              <select
                value={activeEventId}
                onChange={(e) => setActiveEventId(e.target.value)}
                className="bg-transparent text-gray-800 focus:outline-[#FFCC00] cursor-pointer font-black text-xs pr-1"
              >
                {(currentUser 
                  ? events.filter(ev => ev.created_by === currentUser.username)
                  : events
                ).map((ev) => (
                  <option key={ev.id} value={ev.id} className="text-gray-800 font-semibold bg-white">
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Connection Status (visible only on mobile/tablet) */}
            <div className="lg:hidden flex items-center gap-1.5 bg-gray-50 border px-2.5 py-1 rounded-full">
              <span className={`w-2 h-2 rounded-full ${
                isOnline ? (supabaseConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500') : 'bg-red-500'
              }`}></span>
              <span className="text-[10px] font-bold tracking-wider text-gray-500">
                {isOnline ? (supabaseConnected ? 'SUPABASE' : 'LOCAL') : 'OFFLINE'}
              </span>
            </div>
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
               <span>លទ្ធផល (Live Board)</span>
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
                <span>បញ្ជីឈ្មោះក្រុម (Public Teams)</span>
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
                <span>ចុះឈ្មោះលេងកីឡា (Enrol Athlete)</span>
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
              <span>វិភាគទិន្នន័យ (Dashboard)</span>
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
                  <span>ផ្ទាំងបញ្ចូលពិន្ទុ (Scoring Panel)</span>
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
                  <span>ការកំណត់ (Event Settings)</span>
                </button>
              </>
            ) : (
              <button
                id="tab-login"
                onClick={() => setActiveTab('login')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap bg-[#FFCC00] text-gray-900 hover:bg-[#ffe054] shadow-sm`}
              >
                <KeyRound className="w-4 h-4" />
                <span>ចូលគ្រងប្រព័ន្ធ (Admin Sign In)</span>
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

            <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
              {isOnline ? (
                supabaseConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <div className="text-left">
                      <p className="text-[10px] font-black text-emerald-600 uppercase leading-none">SUPABASE LIVE</p>
                      <p className="text-[8px] text-gray-400 font-bold tracking-tight">REAL-TIME SYNCED</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 text-amber-500" />
                    <div className="text-left">
                      <p className="text-[10px] font-black text-amber-600 uppercase leading-none">LOCAL OFFLINE</p>
                      <p className="text-[8px] text-gray-400 font-bold tracking-tight">STORAGE EMULATED</p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
                  <div className="text-left">
                    <p className="text-[10px] font-black text-red-500 uppercase leading-none">DISCONNECTED</p>
                    <p className="text-[8px] text-gray-400 font-bold tracking-tight">OFFLINE SAVES ONLY</p>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

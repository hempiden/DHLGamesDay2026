import React, { useState, useEffect } from 'react';
import { Award, Layers, ToggleLeft, RefreshCw, AlertCircle, Laptop, Settings, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  activeTab: 'leaderboard' | 'scoring' | 'admin';
  setActiveTab: (tab: 'leaderboard' | 'scoring' | 'admin') => void;
  isOnline: boolean;
  supabaseConnected: boolean;
}

export default function Header({ activeTab, setActiveTab, isOnline, supabaseConnected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-[#FFCC00] shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 md:py-4 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-[#D40511] px-3 py-1.5 rounded-sm transform -skew-x-12 shadow-sm">
                <span className="text-white font-black italic tracking-tighter text-lg leading-none select-none">
                  DHL
                </span>
              </div>
              <div className="border-l-2 border-gray-200 pl-3">
                <h1 className="font-dhl-title text-[#D40511] text-base sm:text-lg tracking-tight leading-none">
                  GAMES DAY 2026
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  SCORING & TOURNAMENT SUITE
                </p>
              </div>
            </div>

            {/* Mobile Connection Status (visible only on mobile) */}
            <div className="md:hidden flex items-center gap-1.5 bg-gray-50 border px-2.5 py-1 rounded-full">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                isOnline ? (supabaseConnected ? 'bg-green-500' : 'bg-yellow-500') : 'bg-red-500'
              }`}></span>
              <span className="text-[10px] font-bold tracking-wider text-gray-500">
                {isOnline ? (supabaseConnected ? 'SUPABASE' : 'LOCAL') : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Tab Navigation Menu */}
          <div className="flex items-center overflow-x-auto pb-1 md:pb-0 gap-1.5 no-scrollbar scroll-smooth">
            <button
              id="tab-leaderboard"
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'bg-[#D40511] text-white shadow-md shadow-[#D40511]/15'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>លទ្ធផល & តារាងពិន្ទុ (Live Board)</span>
            </button>

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
              <span>ផ្ទាំងបញ្ញាពិន្ទុ (Admin Scoring)</span>
            </button>

            <button
              id="tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-[#1a1a1a] text-white shadow-md shadow-black/15'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>រៀបចំការប្រកួត (Setup Engine)</span>
            </button>
          </div>

          {/* Desktop Connection Status */}
          <div className="hidden md:flex items-center gap-2.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
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
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { Award, Layers, ToggleLeft, RefreshCw, AlertCircle, Laptop, Settings, Wifi, WifiOff, Users, Upload, Monitor, Database, ShieldAlert, LogOut, KeyRound, BarChart3 } from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  activeTab: 'leaderboard' | 'public_teams' | 'dashboard' | 'scoring' | 'admin' | 'teams' | 'database' | 'users' | 'login';
  setActiveTab: (tab: 'leaderboard' | 'public_teams' | 'dashboard' | 'scoring' | 'admin' | 'teams' | 'database' | 'users' | 'login') => void;
  isOnline: boolean;
  supabaseConnected: boolean;
  currentUser: AppUser | null;
  onLogout: () => void;
}


export default function Header({ activeTab, setActiveTab, isOnline, supabaseConnected, currentUser, onLogout }: HeaderProps) {
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
                <h1 className="font-dhl-title text-[#D40511] text-base sm:text-lg tracking-tight leading-none text-nowrap">
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
              <span>លទ្ធផល (Live Board)</span>
            </button>

            <button
              id="tab-public-teams"
              onClick={() => setActiveTab('public_teams')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                activeTab === 'public_teams'
                  ? 'bg-[#D40511] text-white shadow-md shadow-[#D40511]/15'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 animate-pulse" />
              <span>បញ្ជីឈ្មោះក្រុម (Public Teams)</span>
            </button>

            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-[#D40511] text-white shadow-md shadow-[#D40511]/15'
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
                  id="tab-teams"
                  onClick={() => setActiveTab('teams')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                    activeTab === 'teams'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>គ្រប់គ្រងក្រុម & កីឡាករ (Teams & Athletes)</span>
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
                  <span>រៀបចំការប្រកួត (Setup Game)</span>
                </button>

                <button
                  id="tab-database"
                  onClick={() => setActiveTab('database')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                    activeTab === 'database'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>ការកំណត់ទិន្នន័យ (Database Setup)</span>
                </button>

                {currentUser.role === 'super_admin' && (
                  <button
                    id="tab-users"
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      activeTab === 'users'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/15'
                        : 'bg-[#FFCC00]/10 text-amber-800 border-2 border-dashed border-[#FFCC00] hover:bg-[#FFCC00]/25'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>ការអនុញ្ញាតអាដមីន (Admins & Approvals)</span>
                  </button>
                )}
              </>
            ) : (
              <button
                id="tab-login"
                onClick={() => setActiveTab('login')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer tracking-wide transition-all duration-200 active:scale-95 whitespace-nowrap ${
                  activeTab === 'login'
                    ? 'bg-[#D40511] text-white shadow-md shadow-[#D40511]/15'
                    : 'bg-[#FFCC00] text-gray-900 hover:bg-[#ffe054] shadow-sm'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>ចូលគ្រងប្រព័ន្ធ (Admin Sign In)</span>
              </button>
            )}
          </div>

          {/* Desktop Connection Status & User Profile */}
          <div className="hidden md:flex items-center gap-4">
            
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

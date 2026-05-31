import React, { useState } from 'react';
import { Match, SportType, Participant, AppUser } from '../types';
import { SPORT_CONFIGS, getSportConfig, getActiveSports, isSportMeasure } from '../data';
import { Play, Check, Trophy, Trash2, ArrowRight, ShieldCheck, AlertCircle, Plus, Minus } from 'lucide-react';
import SwimmingTimer from './SwimmingTimer';

interface ScoringPanelProps {
  matches: Match[];
  participants: Participant[];
  updateMatchScore: (id: string, scoreA: number, scoreB: number) => Promise<boolean>;
  updateMatchFields: (id: string, fields: Partial<Match>) => Promise<boolean>;
  finishMatch: (id: string) => Promise<boolean>;
  deleteMatch?: (id: string) => void;
  currentUser: AppUser | null;
  isSupabaseEnabled?: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export default function ScoringPanel({ 
  matches, 
  participants,
  updateMatchScore, 
  updateMatchFields,
  finishMatch, 
  deleteMatch,
  currentUser,
  isSupabaseEnabled,
  supabaseUrl,
  supabaseAnonKey
}: ScoringPanelProps) {
  const [selectedSport, setSelectedSport] = useState<SportType | 'All'>('All');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showConfirmFinishId, setShowConfirmFinishId] = useState<string | null>(null);

  // Buffer input states for performance and real-time typing
  const [scoresBuffer, setScoresBuffer] = useState<Record<string, { a: number; b: number }>>({});

  const filterSports = ['All', ...getActiveSports()];

  const filteredMatches = matches.filter((m) => {
    const isLive = m.status === 'Live';
    const matchesSport = selectedSport === 'All' ? true : m.sport_name === selectedSport;
    return isLive && matchesSport;
  });

  const getScore = (matchId: string, team: 'a' | 'b', defaultValue: number): number => {
    if (scoresBuffer[matchId]) {
      return team === 'a' ? scoresBuffer[matchId].a : scoresBuffer[matchId].b;
    }
    return defaultValue;
  };

  const setLocalScore = (matchId: string, team: 'a' | 'b', value: number) => {
    const safeValue = Math.max(0, isNaN(value) ? 0 : value);
    setScoresBuffer((prev) => {
      const existing = prev[matchId] || {
        a: matches.find((m) => m.id === matchId)?.score_a ?? 0,
        b: matches.find((m) => m.id === matchId)?.score_b ?? 0,
      };
      return {
        ...prev,
        [matchId]: {
          ...existing,
          [team]: safeValue,
        },
      };
    });
  };

  const adjustScore = (matchId: string, team: 'a' | 'b', originalValue: number, amount: number) => {
    const current = getScore(matchId, team, originalValue);
    setLocalScore(matchId, team, current + amount);
  };

  const handleUpdate = async (matchId: string, origA: number, origB: number) => {
    const finalA = getScore(matchId, 'a', origA);
    const finalB = getScore(matchId, 'b', origB);

    setSavingId(matchId);
    const success = await updateMatchScore(matchId, finalA, finalB);
    if (success) {
      setTimeout(() => {
        setSavingId(null);
      }, 1500);
    } else {
      setSavingId(null);
    }
  };

  const handleFinish = async (matchId: string) => {
    setShowConfirmFinishId(null);
    await finishMatch(matchId);
  };

  return (
    <div className="space-y-6">
      
      {/* Sport Filtering Segmented Control */}
      <div className="w-full bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar">
        {filterSports.map((sport) => {
          const config = sport !== 'All' ? getSportConfig(sport) : null;
          const isActive = selectedSport === sport;
          return (
            <button
              key={sport}
              id={`filter-sport-${sport}`}
              onClick={() => setSelectedSport(sport)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-200 active:scale-95 whitespace-nowrap scroll-mx-4 ${
                isActive
                  ? 'bg-[#1a1a1a] text-white shadow-md'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {config ? (
                <>
                  <span className="text-sm">{config.icon}</span>
                  <span>{config.khmerName} ({sport})</span>
                </>
              ) : (
                <span>ទាំងអស់ (All Sports)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Container of Active / Live Matches */}
      {isSportMeasure(selectedSport) ? (
        <div className="col-span-full">
          <SwimmingTimer
            sportName={selectedSport}
            matches={matches}
            participants={participants}
            updateMatchFields={updateMatchFields}
            currentUser={currentUser}
            isSupabaseEnabled={isSupabaseEnabled}
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
          />
        </div>
      ) : (
        <div id="scoring-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl border border-dashed border-gray-200 py-20 px-4 text-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-yellow-200">
                <Play className="w-6 h-6 text-[#D40511] animate-pulse" />
              </div>
              <h3 className="font-bold text-gray-700 text-base mb-1">
                មិនមានការប្រកួតកំពុងផ្សាយផ្ទាល់ឡើយទីនេះ
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {selectedSport === 'All'
                  ? 'សូមចូលទៅកាន់ផ្ទាំង "រៀបចំការប្រកួត" ដើម្បីផ្លាស់ប្តូរការប្រកួតទៅជា "Live" ឬបង្កើតថ្មី។'
                  : `មិនមានការប្រកួតកំពុងផ្សាយផ្ទាល់សម្រាប់ប្រភេទកីឡា ${selectedSport} ឡើយ។`}
              </p>
            </div>
          ) : (
            filteredMatches.map((m) => {
              if (isSportMeasure(m.sport_name)) {
                const mConfig = getSportConfig(m.sport_name);
                return (
                  <div
                    key={m.id}
                    className="bg-[#0f172a] text-white rounded-[32px] overflow-hidden shadow-xl border-t-8 border-cyan-400 hover:shadow-2xl transition-all duration-300 relative flex flex-col justify-between"
                  >
                    <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <span className="text-lg">{mConfig?.icon || '⏱️'}</span>
                        <span className="font-dhl-title text-xs leading-none">{(m.sport_name || '').toUpperCase()} TIMER STYLE</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#1a1a1a] bg-cyan-400 px-2.5 py-1 rounded-md uppercase tracking-wide">
                        {m.match_label}
                      </span>
                    </div>

                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div className="space-y-2 mb-6">
                        <h4 className="font-black text-sm uppercase tracking-tight text-white mb-1">
                          {m.match_label || 'Heat Match'}
                        </h4>
                        <p className="text-[11.5px] text-gray-400 leading-relaxed font-bold">
                          គម្រោង {mConfig?.khmerName || m.sport_name} មិនប្រើប្រាស់ពិន្ទុ២ក្រុមធម្មតាទេ។ សូមប្រើប្រាស់ឧបករណ៍វាស់ម៉ោង និង Lane Stop ក្នុងផ្ទាំងវាស់ម៉ោង {mConfig?.khmerName || m.sport_name} Timer!
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSport(m.sport_name)}
                        className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-black uppercase rounded-2xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-95"
                      >
                        <span>បើកផ្ទាំងវាស់ម៉ោង (Open {m.sport_name} Timer)</span>
                        <ArrowRight className="w-4 h-4 text-slate-950" />
                      </button>
                    </div>
                  </div>
                );
              }

              const config = getSportConfig(m.sport_name);
              const isSaving = savingId === m.id;
              const currentA = getScore(m.id, 'a', m.score_a);
              const currentB = getScore(m.id, 'b', m.score_b);

              return (
              <div
                key={m.id}
                id={`score-card-${m.id}`}
                className="bg-white rounded-3xl shadow-xl border-t-8 border-[#FFCC00] hover:shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Header Information of Card */}
                <div className="px-5 py-4 bg-gray-50 flex justify-between items-center border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none" role="img" aria-label={m.sport_name}>
                      {config?.icon || '🏆'}
                    </span>
                    <span className="font-dhl-title text-[#D40511] text-xs leading-none">
                      {config?.khmerName || m.sport_name}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#1a1a1a] bg-[#FFCC00] px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {m.match_label || 'Regular Match'}
                  </span>
                </div>

                {/* Score Editing Content */}
                <div className="p-6">
                  <div className="grid grid-cols-11 gap-1 items-center mb-8 relative">
                    
                    {/* Team A Entry */}
                    <div className="col-span-5 text-center">
                      <div className="text-xs font-black text-gray-700 uppercase mb-3 truncate" title={m.team_a}>
                        {m.team_a}
                      </div>
                      
                      {/* Interactive score controller layout */}
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustScore(m.id, 'a', m.score_a, -1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-500 font-bold active:scale-90 transition-all select-none"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        
                        <input
                          type="number"
                          id={`score-a-${m.id}`}
                          value={currentA}
                          onChange={(e) => setLocalScore(m.id, 'a', parseInt(e.target.value))}
                          className="score-input w-20 h-24 text-center text-5xl bg-gray-50 border-2 border-gray-100 focus:border-[#FFCC00] focus:bg-white rounded-2xl outline-none transition font-black score-display selection:bg-yellow-100 text-gray-800"
                        />

                        <button
                          type="button"
                          onClick={() => adjustScore(m.id, 'a', m.score_a, 1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-gray-500 font-bold active:scale-90 transition-all select-none"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Separator Col */}
                    <div className="col-span-1 text-center font-dhl text-2xl text-gray-300 italic self-center pt-6 leading-none">
                      :
                    </div>

                    {/* Team B Entry */}
                    <div className="col-span-5 text-center">
                      <div className="text-xs font-black text-gray-700 uppercase mb-3 truncate" title={m.team_b}>
                        {m.team_b}
                      </div>

                      {/* Interactive score controller layout */}
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustScore(m.id, 'b', m.score_b, -1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-500 font-bold active:scale-90 transition-all select-none"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          id={`score-b-${m.id}`}
                          value={currentB}
                          onChange={(e) => setLocalScore(m.id, 'b', parseInt(e.target.value))}
                          className="score-input w-20 h-24 text-center text-5xl bg-gray-50 border-2 border-gray-100 focus:border-[#FFCC00] focus:bg-white rounded-2xl outline-none transition font-black score-display selection:bg-yellow-100 text-gray-800"
                        />

                        <button
                          type="button"
                          onClick={() => adjustScore(m.id, 'b', m.score_b, 1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-gray-500 font-bold active:scale-90 transition-all select-none"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Operational buttons container */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(m.id, m.score_a, m.score_b)}
                      className={`flex-grow py-4 px-4 rounded-xl font-bold uppercase italic text-sm shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                        isSaving
                          ? 'bg-emerald-700 text-white animate-pulse shadow-emerald-200'
                          : 'bg-green-500 hover:bg-green-600 text-white shadow-green-100'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>SAVED! ✓</span>
                        </>
                      ) : (
                        <span>Update Score</span>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowConfirmFinishId(m.id)}
                      className="px-6 py-4 bg-[#1A1A1A] hover:bg-gray-800 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                      Finish
                    </button>
                  </div>
                </div>

                {/* Confirm Finish Modal overlay per Card */}
                {showConfirmFinishId === m.id && (
                  <div className="absolute inset-0 bg-black/90 text-white flex flex-col justify-center items-center p-4 z-10 animate-fade-in">
                    <div className="w-12 h-12 bg-yellow-500/20 text-[#FFCC00] rounded-full flex items-center justify-center mb-3 border border-[#FFCC00]/40">
                      <Trophy className="w-6 h-6 animate-bounce" />
                    </div>
                    <h4 className="font-bold text-center text-sm mb-1 px-4 leading-snug">
                      តើអ្នកចង់បញ្ជាក់ការបញ្ចប់ការប្រកួតនេះពិតមែនទេ?
                    </h4>
                    <p className="text-[10px] text-gray-400 text-center mb-5 px-6 leading-normal">
                      លទ្ធផលនឹងត្រូវបានកត់ត្រាទុកក្នុងតារាងចំណាត់ថ្នាក់ជាស្ថាពរ។
                    </p>
                    <div className="flex gap-2.5 w-full max-w-[240px]">
                      <button
                        type="button"
                        onClick={() => handleFinish(m.id)}
                        className="flex-1 py-2.5 bg-[#D40511] hover:bg-red-700 text-white text-xs font-extrabold rounded-lg uppercase tracking-wide cursor-pointer active:scale-95"
                      >
                        បាទ! បញ្ចប់ (Yes)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmFinishId(null)}
                        className="flex-1 py-2.5 bg-gray-600 hover:bg-gray-500 text-gray-100 text-xs font-extrabold rounded-lg uppercase tracking-wide cursor-pointer active:scale-95"
                      >
                        បោះបង់ (Cancel)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
}

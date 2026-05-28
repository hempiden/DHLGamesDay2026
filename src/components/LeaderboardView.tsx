import React, { useState } from 'react';
import { Match, SportType, TeamStanding } from '../types';
import { SPORT_CONFIGS, calculateStandings } from '../data';
import { Sparkles, Trophy, Calendar, RefreshCw, Zap, Flame, Grid, Compass, Timer } from 'lucide-react';

interface LeaderboardViewProps {
  matches: Match[];
}

export default function LeaderboardView({ matches }: LeaderboardViewProps) {
  const [selectedSport, setSelectedSport] = useState<SportType>('Soccer');

  const liveMatches = matches.filter((m) => m.status === 'Live');
  const finishedMatches = matches.filter((m) => m.status === 'Finished');

  // Calculate standings dynamically for the chosen sport category
  const standings = calculateStandings(matches, selectedSport);

  const sportsList: SportType[] = ['Soccer', 'Volleyball', 'Pingpong', 'Badminton', 'Swimming'];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Live Matches Section (Top Display Board) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2 border-gray-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#D40511]"></span>
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
              <span>ការប្រកួតកំពុងផ្សាយផ្ទាល់</span>
              <span className="text-gray-400 font-normal">|</span>
              <span className="text-[#D40511] font-black italic font-dhl">LIVE MATCHES ({liveMatches.length})</span>
            </h2>
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">
            DHL Live Ingress Updates
          </span>
        </div>

        {liveMatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <p className="text-xs text-gray-400 italic">
              មិនមានការប្រកួតកំពុងលេងនៅឡើយទេ... សូមពិសោធកែប្រែស្ថានភាពការប្រកួតទៅជា Live នៅក្នុងទំព័រ Scoring ឬ Setup។
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveMatches.map((m) => {
              const config = SPORT_CONFIGS[m.sport_name];
              return (
                <div
                  key={m.id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-l-8 border-[#D40511] shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  {/* Category and Badge Strip */}
                  <div className="px-4 py-2 bg-gray-100/50 flex justify-between items-center text-[10px] font-bold border-b border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span>{config?.icon}</span>
                      <span className="uppercase text-gray-700">{config?.khmerName || m.sport_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#D40511] bg-red-50 px-2 py-0.5 rounded-md animate-pulse">
                      <Timer className="w-3 h-3" />
                      <span className="font-mono tracking-wider font-extrabold uppercase">LIVE</span>
                    </div>
                  </div>

                  {/* Visual Live Board */}
                  <div className="p-6">
                    <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mb-3">
                      {m.match_label}
                    </p>
                    
                    <div className="flex items-center justify-between gap-4">
                      {/* Team A */}
                      <div className="flex-1 text-center">
                        <div className="text-xs font-black text-gray-800 uppercase h-8 flex items-center justify-center line-clamp-2 leading-tight">
                          {m.team_a}
                        </div>
                        <div className="text-gray-300 text-[10px] font-semibold mt-1 uppercase">TEAM A</div>
                      </div>

                      {/* Display Score Big Board */}
                      <div className="flex items-center gap-3 bg-white px-5 py-3.5 rounded-2xl shadow-inner border border-gray-100">
                        <span className="text-4xl font-extrabold pb-0.5 tracking-tighter text-[#1a1a1a] min-w-[40px] text-center font-dhl score-display">
                          {m.score_a}
                        </span>
                        <span className="text-xl font-black text-gray-300 select-none animate-pulse">:</span>
                        <span className="text-4xl font-extrabold pb-0.5 tracking-tighter text-[#1a1a1a] min-w-[40px] text-center font-dhl score-display">
                          {m.score_b}
                        </span>
                      </div>

                      {/* Team B */}
                      <div className="flex-1 text-center">
                        <div className="text-xs font-black text-gray-800 uppercase h-8 flex items-center justify-center line-clamp-2 leading-tight">
                          {m.team_b}
                        </div>
                        <div className="text-gray-300 text-[10px] font-semibold mt-1 uppercase">TEAM B</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Standings Section & Sport Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column (standings table) */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#1a1a1a] text-white p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FFCC00]" />
                <h2 className="text-base font-extrabold tracking-wide uppercase font-dhl text-[#FFCC00]">
                  តារាងចំណាត់ថ្នាក់ពិន្ទុ (Standings)
                </h2>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">
                កីឡា៖ {SPORT_CONFIGS[selectedSport].khmerName} ({selectedSport} Standing)
              </p>
            </div>

            {/* In-View Sport Tabs selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {sportsList.map((sport) => {
                const config = SPORT_CONFIGS[sport];
                const isActive = selectedSport === sport;
                return (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#FFCC00] text-[#1a1a1a]'
                        : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <span>{config.icon}</span>
                    <span>{sport}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-4.5 px-6 text-center w-16">ចំណាត់ថ្នាក់</th>
                  <th className="py-4.5 px-4">ឈ្មោះក្រុម (DHL Team)</th>
                  <th className="py-4.5 px-3 text-center w-14">ប្រកួត</th>
                  <th className="py-4.5 px-3 text-center w-14">ឈ្នះ</th>
                  <th className="py-4.5 px-3 text-center w-14">ស្មើ</th>
                  <th className="py-4.5 px-3 text-center w-14">ចាញ់</th>
                  <th className="py-4.5 px-4 text-center w-18">គ្រាប់ស៊ុត (GD)</th>
                  <th className="py-4.5 px-6 text-center w-20 bg-yellow-50/30 text-[#D40511] font-extrabold text-xs">ពិន្ទុ (PTS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {standings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400 italic">
                      មិនទាន់មានការប្រកួតបង្ហើយលទ្ធផលសម្រាប់ប្រភេទកីឡានេះនៅឡើយទេ។
                    </td>
                  </tr>
                ) : (
                  standings.map((row, index) => {
                    const isTopThree = index < 3;
                    const rankBadgeColor =
                      index === 0
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : index === 1
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-orange-100 text-orange-800 border-orange-300';

                    const scoreDiff = row.score_for - row.score_against;

                    return (
                      <tr
                        key={row.team_name}
                        className={`hover:bg-gray-50/50 transition duration-150 ${
                          index === 0 ? 'bg-amber-50/10' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4.5 px-6 text-center">
                          {isTopThree ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 font-black text-xs rounded-full border ${rankBadgeColor} font-dhl score-display`}>
                              {index + 1}
                            </span>
                          ) : (
                            <span className="font-bold text-gray-500 font-dhl score-display">{index + 1}</span>
                          )}
                        </td>

                        {/* Team Name */}
                        <td className="py-4.5 px-4 font-black text-gray-800 uppercase sm:text-xs">
                          {row.team_name}
                        </td>

                        {/* Stats Columns */}
                        <td className="py-4.5 px-3 text-center font-bold text-gray-600 font-dhl score-display">{row.played}</td>
                        <td className="py-4.5 px-3 text-center font-bold text-emerald-600 font-dhl score-display">{row.wins}</td>
                        <td className="py-4.5 px-3 text-center font-bold text-amber-600 font-dhl score-display">{row.draws}</td>
                        <td className="py-4.5 px-3 text-center font-bold text-red-500 font-dhl score-display">{row.losses}</td>
                        
                        {/* Score Diff */}
                        <td className="py-4.5 px-4 text-center font-bold text-gray-500">
                          <span className="font-dhl score-display">
                            {row.score_for}:{row.score_against}
                          </span>
                          <span className={`text-[9px] font-black font-mono ml-1.5 px-1 py-0.5 rounded ${
                            scoreDiff > 0 ? 'text-emerald-600 bg-emerald-50' : scoreDiff < 0 ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50'
                          }`}>
                            {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff}
                          </span>
                        </td>

                        {/* Total Points */}
                        <td className="py-4.5 px-6 text-center bg-yellow-50/20 text-gray-900 font-black text-sm font-dhl score-display">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer of standings key indicator */}
          <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
            <span>ឈ្នះ = ៣ ពិន្ទុ | ស្មើ = ១ ពិន្ទុ | ចាញ់ = ០ ពិន្ទុ</span>
            <span>DHL Games Rule Standard</span>
          </div>

        </div>

        {/* Right column (recent log / sport legend) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Recent Match Log Card */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-[#1a1a1a] text-white p-5 border-b border-gray-800 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-[#FFCC00]" />
              <h2 className="text-xs font-extrabold tracking-wide uppercase font-dhl">
                ការប្រកួតដែលបានបញ្ជប់ (RECENT MATCHES)
              </h2>
            </div>

            <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
              {finishedMatches.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic text-xs">
                  មិនទាន់មានលទ្ធផលការប្រកួតដែលបានបញ្ចប់នៅឡើយទេ។
                </div>
              ) : (
                finishedMatches.map((m) => {
                  const config = SPORT_CONFIGS[m.sport_name];
                  const aWon = m.score_a > m.score_b;
                  const bWon = m.score_b > m.score_a;

                  return (
                    <div key={m.id} className="p-4 hover:bg-gray-50/50 transition duration-150">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          {m.match_label}
                        </span>
                        <span className="text-[9px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                          {config?.icon} {config?.khmerName || m.sport_name}
                        </span>
                      </div>

                      <div className="grid grid-cols-11 gap-1 items-center">
                        {/* Team A name */}
                        <div className={`col-span-4 text-xs truncate ${aWon ? 'font-black text-gray-900' : 'text-gray-500'}`}>
                          {m.team_a}
                        </div>
                        
                        {/* Score display */}
                        <div className="col-span-3 text-center bg-gray-100/70 rounded-lg px-2 py-1 flex items-center justify-center gap-1.5">
                          <span className={`font-mono text-xs font-bold ${aWon ? 'text-gray-900 font-extrabold' : 'text-gray-500'}`}>
                            {m.score_a}
                          </span>
                          <span className="text-[10px] text-gray-300 font-bold">:</span>
                          <span className={`font-mono text-xs font-bold ${bWon ? 'text-gray-900 font-extrabold' : 'text-gray-500'}`}>
                            {m.score_b}
                          </span>
                        </div>

                        {/* Team B name */}
                        <div className={`col-span-4 text-xs text-right truncate ${bWon ? 'font-black text-gray-900' : 'text-gray-500'}`}>
                          {m.team_b}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="bg-gray-50 border-t p-4.5 text-center">
              <span className="text-[10px] font-extrabold text-[#D40511] uppercase tracking-wider">
                Total Games COMPLETED: {finishedMatches.length}
              </span>
            </div>
          </div>

          {/* Sport Config Index */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 space-y-3.5">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">
              ឯកសារយោងកីឡា (Sport Configurations)
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.values(SPORT_CONFIGS).map((sport) => (
                <div
                  key={sport.name}
                  className="bg-gray-50 border rounded-xl p-2.5 flex items-center gap-2"
                >
                  <span className="text-xl">{sport.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-800 leading-tight truncate">{sport.name}</p>
                    <p className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">{sport.khmerName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

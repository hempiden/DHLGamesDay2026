import React, { useState } from 'react';
import { Award, Trophy, Zap, Users, AlertCircle, RefreshCw, Star, CheckCircle, Flame, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Match, Participant, SportType } from '../types';
import { SPORT_CONFIGS } from '../data';

interface PublicScoresProps {
  matches: Match[];
  participants: Participant[];
}

export default function PublicScores({ matches, participants }: PublicScoresProps) {
  // Select active sport to view scores
  const [selectedSport, setSelectedSport] = useState<SportType | 'All'>('All');

  // Filter matches based on selected sport
  const filteredMatches = matches.filter(
    (m) => selectedSport === 'All' || m.sport_name === selectedSport
  );

  // Active / Live matches
  const liveMatches = filteredMatches.filter((m) => m.status === 'Live');
  // Finished matches
  const finishedMatches = filteredMatches.filter((m) => m.status === 'Finished');
  // Scheduled / Upcoming matches
  const upcomingMatches = filteredMatches.filter((m) => m.status === 'Upcoming');

  // Try to locate a winner from the finished matches to offer custom, high-fidelity Congratulations!
  // If no match is finished, pick the most recent completed or even live leading score for testing/demo.
  const completedWithWinner = finishedMatches.map(m => {
    let winningTeamName = '';
    let winningScore = 0;
    let losingScore = 0;
    
    if (m.score_a > m.score_b) {
      winningTeamName = m.team_a;
      winningScore = m.score_a;
      losingScore = m.score_b;
    } else if (m.score_b > m.score_a) {
      winningTeamName = m.team_b;
      winningScore = m.score_b;
      losingScore = m.score_a;
    }

    return {
      match: m,
      winningTeamName,
      winningScore,
      losingScore
    };
  }).filter(item => item.winningTeamName !== ''); // Exclude draws for pure clear victory celebrations

  // Find corresponding Team participant for the winner
  const getTeamRosterAndTheme = (teamName: string, sportType: SportType) => {
    const teamObj = participants.find(
      (p) => p.is_team && p.sport_type === sportType && p.name.trim().toLowerCase() === teamName.trim().toLowerCase()
    );
    
    if (!teamObj) {
      return { roster: [], themePhoto: null, id: null };
    }

    const roster = participants.filter((p) => !p.is_team && p.team_id === teamObj.id);
    return {
      roster,
      themePhoto: teamObj.photo_url || null,
      id: teamObj.id
    };
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Stadium-style ticker header */}
      <div className="relative overflow-hidden bg-gray-950 text-white p-6 md:p-10 rounded-[30px] border-4 border-[#FFCC00] shadow-xl">
        <div className="absolute inset-0 bg-radial-gradient from-red-950/20 via-transparent to-transparent opacity-90"></div>
        <div className="absolute top-0 right-0 p-4 animate-pulse">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[9px] font-black tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            LIVE BROADCASTING
          </span>
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#D40511] px-3.5 py-1.5 transform -skew-x-12 inline-block">
              <span className="text-white font-black italic tracking-tighter text-sm sm:text-base">DHL GAMES 2026</span>
            </div>
            <span className="bg-gray-800 text-gray-300 font-bold px-2.5 py-1 text-[9px] rounded-md tracking-wider uppercase">SPECTATOR DECK</span>
          </div>
          
          <h2 className="font-dhl-title text-2xl sm:text-4xl text-[#FFCC00] italic uppercase leading-tight tracking-tight drop-shadow-sm">
            មហាជនមើលពិន្ទុផ្ទាល់ <br className="hidden sm:inline" />
            <span className="text-white">SPECTATORS LIVE ACTION PORTAL</span>
          </h2>
          <p className="text-gray-400 text-xs font-medium max-w-xl leading-relaxed">
            Stay aligned with the continuous scoreboard, real-time sports updates, and celebrate the registered athletes delivering excellence across the arena.
          </p>
        </div>
        
        {/* Retro scanlines or glowing accents */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-[#FFCC00] to-emerald-500"></div>
      </div>

      {/* SPORT SELECTOR TAB MENU */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-black uppercase tracking-wider mb-3.5 pl-1.5">
          <Flame className="w-4 h-4 text-[#D40511] animate-bounce" />
          <span>ជ្រើសរើសប្រភេទកីឡាដើម្បីមើល (Select Sport to Filter)</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <button
            onClick={() => setSelectedSport('All')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
              selectedSport === 'All'
                ? 'bg-gray-950 text-[#FFCC00] border-gray-950 shadow-md transform -translate-y-0.5'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <span className="text-xl mb-1">🌍</span>
            <span className="text-[10px] font-black uppercase tracking-wider">All Sports</span>
          </button>

          {(Object.keys(SPORT_CONFIGS) as SportType[]).map((sportKey) => {
            const config = SPORT_CONFIGS[sportKey];
            const isSelected = selectedSport === sportKey;
            return (
              <button
                key={sportKey}
                onClick={() => setSelectedSport(sportKey)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFCC00] text-gray-950 border-[#FFCC00] shadow-md transform -translate-y-0.5'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-slate-100'
                }`}
              >
                <span className="text-2xl mb-1 filter saturate-120">{config.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{sportKey}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONGRATULATIONS WINNING TEAM CEREMONY SCREEN */}
      {completedWithWinner.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pl-1">
            <Trophy className="w-5 h-5 text-amber-500 animate-spin" />
            <h3 className="font-dhl-title text-base sm:text-lg text-gray-800 italic uppercase">
              អបអរសាទរក្រុមឈ្នះ (CONGRATULATIONS CHAMPIONS SESSIONS)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedWithWinner.slice(0, 2).map((item, idx) => {
              const { roster, themePhoto } = getTeamRosterAndTheme(item.winningTeamName, item.match.sport_name);
              
              return (
                <div 
                  key={item.match.id}
                  className="bg-white rounded-3xl border-2 border-[#FFCC00] shadow-xl overflow-hidden flex flex-col relative"
                >
                  {/* Decorative Confetti Banner Background */}
                  <div className="relative h-44 flex flex-col justify-end p-5 bg-gradient-to-t from-gray-950 via-gray-900/40 to-slate-800 overflow-hidden shrink-0">
                    {themePhoto ? (
                      <img 
                        src={themePhoto} 
                        alt={item.winningTeamName} 
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#D40511] to-red-950 opacity-20"></div>
                    )}
                    
                    {/* Confetti glowing circles placeholder in CSS */}
                    <div className="absolute top-4 left-6 w-20 h-20 rounded-full bg-amber-400/20 blur-xl animate-pulse"></div>
                    <div className="absolute right-10 top-2 w-16 h-16 rounded-full bg-[#FFCC00]/15 blur-lg"></div>

                    <div className="relative z-10 space-y-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFCC00] text-gray-950 font-black tracking-widest text-[8px] uppercase">
                        ★ {item.match.sport_name} GRAND WINNER ★
                      </span>
                      <h4 className="text-white text-xl font-black uppercase tracking-tight italic drop-shadow-sm">
                        {item.winningTeamName}
                      </h4>
                      <p className="text-gray-300 text-[10px] uppercase font-bold tracking-wider">
                        Defeated opponent with a glorious final score of <span className="text-[#FFCC00] font-black">{item.winningScore} - {item.losingScore}</span>!
                      </p>
                    </div>
                  </div>

                  {/* Registered Roster Members Congratulation Deck */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div>
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">
                        សមាជិកជ័យលាភី (COMMENDED WINNING PLAYERS ROSTER)
                      </h5>
                      
                      {roster.length === 0 ? (
                        <div className="py-6 text-center text-gray-400">
                          <Users className="w-8 h-8 opacity-20 mx-auto mb-1" />
                          <p className="text-[9px] font-bold uppercase">No players assigned to this roster yet</p>
                          <p className="text-[8px] text-gray-400 normal-case mt-0.5">Edit this team under the Teams tab to link players for their medals.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3.5">
                          {roster.map((player) => (
                            <div 
                              key={player.id} 
                              className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#FFCC00] transition"
                            >
                              <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 shrink-0 bg-white flex items-center justify-center">
                                {player.photo_url ? (
                                  <img 
                                    src={player.photo_url} 
                                    alt={player.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <span className="font-extrabold text-[#D40511] text-xs">
                                    {player.name.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-xs text-gray-800 line-clamp-1 leading-tighter">{player.name}</p>
                                <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold uppercase text-amber-500 tracking-tighter">
                                  🏆 Medal Hero
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Congratulation Footer */}
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-3xl">
                      <div className="text-left">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">COMMITTEE GREETINGS:</span>
                        <p className="text-[9.5px] text-[#D40511] font-black tracking-tight italic mt-1 uppercase">Excellence. Simply Delivered.</p>
                      </div>
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SPECTRUM LIVE BROADCAST PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Live Active Scores */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center gap-2 pl-1.5">
            <Zap className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="font-dhl-title text-base sm:text-lg text-gray-800 italic uppercase">
              ការប្រកួតកំពង់ប្រព្រឹត្តទៅ (Live Match Tension Deck)
            </h3>
          </div>

          {selectedSport === 'Swimming' && (() => {
            // Group finished swimming matches by match_label
            const finishedSwimMatches = matches.filter(
              (m) => m.sport_name === 'Swimming' && m.status === 'Finished'
            );

            if (finishedSwimMatches.length === 0) return null;

            // Group swimmers by stage label
            const swimGroups: Record<string, { name: string; time: number; matchLabel: string }[]> = {};

            finishedSwimMatches.forEach((m) => {
              try {
                const swimmersList = JSON.parse(m.team_a) as { id: string; name: string }[];
                const timerState = JSON.parse(m.team_b) as { times: Record<string, number | null> };
                
                swimmersList.forEach((sw) => {
                  const duration = timerState.times?.[sw.id] ?? timerState.times?.[sw.name];
                  if (duration !== undefined && duration !== null) {
                    if (!swimGroups[m.match_label]) {
                      swimGroups[m.match_label] = [];
                    }
                    swimGroups[m.match_label].push({
                      name: sw.name,
                      time: duration,
                      matchLabel: m.match_label,
                    });
                  }
                });
              } catch (e) {
                console.error("Failed to parse swimming match for leaderboard:", e);
              }
            });

            const labels = Object.keys(swimGroups);
            if (labels.length === 0) return null;

            return (
              <div className="bg-[#0f172a] rounded-[30px] p-6 border-2 border-cyan-500/30 text-white space-y-4 shadow-lg mb-6">
                <div className="flex items-center gap-2.5 border-b border-cyan-500/20 pb-3">
                  <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                      ចំណាត់ថ្នាក់ហែលទឹកសរុប (Consolidated Swimming Rankings)
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      កីឡាករក្នុងវគ្គជាមួយគ្នា ត្រូវបានចាត់ចំណាត់ថ្នាក់រួមគ្នា (Players in the same stage label are ranked together)
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {labels.map((label) => {
                    // Sort swimmers in this label by time ascending (lowest time = fastest!)
                    const sortedSwimmers = [...swimGroups[label]].sort((a, b) => a.time - b.time);

                    return (
                      <div key={label} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex justify-between items-center bg-cyan-950/45 px-3 py-1.5 rounded-xl border border-cyan-500/10">
                          <span className="text-[11px] font-black text-cyan-450 uppercase">
                            📍 វគ្គប្រកួត៖ {label}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400">
                            ចំនួនកីឡាករ៖ {sortedSwimmers.length} នាក់
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sortedSwimmers.map((sw, index) => {
                            const isGold = index === 0;
                            const isSilver = index === 1;
                            const isBronze = index === 2;

                            // Format as mm:ss.SS
                            const totalMs = sw.time;
                            const mins = Math.floor(totalMs / 60000);
                            const secs = Math.floor((totalMs % 60000) / 1000);
                            const ms = Math.floor((totalMs % 1000) / 10);
                            const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;

                            return (
                              <div
                                key={sw.name + index}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                                  isGold
                                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/5 border border-yellow-500/40 text-yellow-100'
                                    : isSilver
                                    ? 'bg-slate-100/5 border border-slate-400/30 text-slate-100'
                                    : isBronze
                                    ? 'bg-amber-700/5 border border-amber-805/30 text-amber-200'
                                    : 'bg-slate-950/45 border border-slate-900/40 text-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                                    isGold
                                      ? 'bg-yellow-400 text-gray-950 text-[10px]'
                                      : isSilver
                                      ? 'bg-slate-300 text-gray-900 text-[10px]'
                                      : isBronze
                                      ? 'bg-amber-600 text-white text-[10px]'
                                      : 'bg-slate-900 text-gray-400'
                                  }`}>
                                    {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `${index + 1}`}
                                  </span>
                                  <span className="font-extrabold text-xs">{sw.name}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-black tracking-widest text-[#FFCC00]/80">
                                    {isGold ? 'Winner' : ''}
                                  </span>
                                  <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/10">
                                    ⏱️ {formattedTime}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {liveMatches.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-dotted border-gray-200 text-gray-400 flex flex-col items-center justify-center">
              <span className="text-3xl filter grayscale opacity-45 mb-2">🚥</span>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">គ្មានការប្រកួតបច្ចុប្បន្នទេ (No matches are currently active)</p>
              <p className="text-[10px] text-gray-400 max-w-sm mt-1 normal-case leading-relaxed">
                Matches are either scheduled to start next or have fully resolved. Check scheduled listings below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {liveMatches.map((m) => {
                const isSwimming = m.sport_name === 'Swimming';

                if (isSwimming) {
                  let swimmersList: { id: string; name: string }[] = [];
                  let stopwatchState = { start_time: null as number | null, is_running: false, times: {} as Record<string, number | null> };
                  try {
                    swimmersList = JSON.parse(m.team_a);
                    stopwatchState = JSON.parse(m.team_b);
                  } catch (e) {}

                  return (
                    <div 
                      key={m.id}
                      className="bg-[#0f172a] text-white rounded-[24px] border-l-[6px] border-l-cyan-550 border border-slate-800 shadow-md p-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 py-1.5 px-4 bg-cyan-600 text-white font-black text-[9px] uppercase tracking-widest rounded-bl-xl animate-pulse">
                        LIVE SWIM HEAT
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-400 font-extrabold uppercase text-[9px] tracking-wider rounded-md border border-cyan-800 inline-block">
                            ⏱️ SWIMMING • {m.match_label}
                          </span>
                          <h4 className="font-black text-white text-md tracking-tight uppercase">គន្លងហែលទឹកផ្សាយផ្ទាល់ (Live Lane Track Feed)</h4>
                        </div>

                        {/* List lanes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                          {swimmersList.map((sw, idx) => {
                            const stoppedTime = stopwatchState.times?.[sw.id] ?? stopwatchState.times?.[sw.name];
                            const isStopped = stoppedTime !== undefined && stoppedTime !== null;
                            const isTimerRunning = stopwatchState.is_running && !isStopped;

                            // format stopped time
                            let displayTime = "Ready (ត្រៀម)";
                            if (isStopped) {
                              const totalMs = stoppedTime!;
                              const mins = Math.floor(totalMs / 60000);
                              const secs = Math.floor((totalMs % 60000) / 1000);
                              const ms = Math.floor((totalMs % 1000) / 10);
                              displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
                            } else if (isTimerRunning) {
                              displayTime = "Running... (កំពុងហែល)";
                            }

                            return (
                              <div 
                                key={sw.id || idx}
                                className={`p-3 rounded-xl flex items-center justify-between border ${
                                  isStopped
                                    ? 'bg-slate-900 border-slate-800 text-gray-400'
                                    : isTimerRunning
                                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-100 animate-pulse'
                                    : 'bg-slate-950/60 border-slate-900 text-gray-500'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 text-xs">
                                  <span className="font-mono font-black text-[9px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-850">
                                    Lane {idx + 1}
                                  </span>
                                  <p className="font-bold truncate max-w-[120px] text-white">{sw.name}</p>
                                </div>
                                <span className={`font-mono text-[11px] font-black ${isStopped ? 'text-cyan-400' : 'text-[#FFCC00]'}`}>
                                  {isStopped ? `⏱️ ${displayTime}` : isTimerRunning ? '🏊‍♂️ ' + displayTime : '⏱️ ' + displayTime}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={m.id}
                    className="bg-white rounded-[24px] border-l-[6px] border-l-red-500 border border-gray-100 shadow-md p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 py-1.5 px-4 bg-red-600 text-white font-black text-[9px] uppercase tracking-widest rounded-bl-xl animate-pulse">
                      Live Score
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="space-y-1 text-center sm:text-left shrink-0">
                        <span className="px-2 py-0.5 bg-red-50 text-[#D40511] font-black uppercase text-[9px] tracking-wider rounded-md border border-red-100">
                          {SPORT_CONFIGS[m.sport_name]?.icon} {m.sport_name}
                        </span>
                        <h4 className="font-black text-gray-800 text-sm mt-1 uppercase">{m.match_label}</h4>
                        <div className="flex items-center gap-1 text-[9px] text-[#D40511] font-bold uppercase">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Live Timing Active</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-3 sm:gap-7 w-full sm:w-auto">
                        <div className="text-right w-24 sm:w-36">
                          <p className="font-extrabold text-xs sm:text-sm text-gray-800 line-clamp-1">{m.team_a}</p>
                          <span className="text-[9px] text-gray-400 uppercase font-black">Competitor A</span>
                        </div>

                        <div className="px-5 py-2.5 bg-gray-950 text-[#FFCC00] rounded-2xl font-mono text-xl sm:text-2xl font-black tracking-widest shadow-inner">
                          {m.score_a} - {m.score_b}
                        </div>

                        <div className="text-left w-24 sm:w-36">
                          <p className="font-extrabold text-xs sm:text-sm text-gray-800 line-clamp-1">{m.team_b}</p>
                          <span className="text-[9px] text-gray-400 uppercase font-black">Competitor B</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming Matches */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-2 pl-1.5">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="font-dhl-title text-base sm:text-lg text-gray-800 italic uppercase">
                ការប្រកួតដែលគ្រោងទុកបន្ទាប់ (Scheduled Matches Feed)
              </h3>
            </div>

            {upcomingMatches.length === 0 ? (
              <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest pl-1.5">No upcoming games listed under filtering</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingMatches.map((m) => (
                  <div 
                    key={m.id}
                    className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl font-extrabold text-[9px] uppercase tracking-wide">
                        {SPORT_CONFIGS[m.sport_name]?.icon} {m.sport_name}
                      </span>
                      <span className="text-[9px] text-gray-400 font-extrabold uppercase bg-gray-50 px-2 py-0.5 rounded-md">Upcoming</span>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-black text-gray-400 uppercase text-[9px] tracking-wider">{m.match_label}</h5>
                      <div className="flex items-center gap-1 font-bold text-xs text-gray-700">
                        <span className="line-clamp-1 max-w-[110px]">{m.team_a}</span>
                        <span className="text-gray-300 font-black italic select-none px-1">VS</span>
                        <span className="line-clamp-1 max-w-[110px]">{m.team_b}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-black uppercase text-gray-400 border-t border-slate-50 pt-3">
                      <Clock className="w-3.5 h-3.5 text-gray-300" />
                      <span>Scheduled Setup Complete</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resolved Matches History Side Rail */}
        <div id="spectator-resolved" className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 pl-1.5">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h3 className="font-dhl-title text-base sm:text-lg text-gray-800 italic uppercase">
              លទ្ធផលដែលបានបញ្ចបញ្ចប់ (Game Results)
            </h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 max-h-[560px] overflow-y-auto">
            {finishedMatches.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <AlertCircle className="w-7 h-7 mx-auto opacity-20 mb-1" />
                <p className="text-[10px] font-black uppercase">No finished matches available yet</p>
                <p className="text-[9px] text-gray-400">Completed events will register scores here live.</p>
              </div>
            ) : (
              finishedMatches.map((m) => {
                const isSwim = m.sport_name === 'Swimming';

                if (isSwim) {
                  let swimmersList: { id: string; name: string }[] = [];
                  let stopwatchState = { times: {} as Record<string, number | null> };
                  try {
                    swimmersList = JSON.parse(m.team_a);
                    stopwatchState = JSON.parse(m.team_b);
                  } catch (e) {}

                  // Sort swimmers by recorded stopped times
                  const sortedSwimmers = swimmersList
                    .map(sw => ({
                      name: sw.name,
                      time: stopwatchState.times?.[sw.id] ?? stopwatchState.times?.[sw.name] ?? null
                    }))
                    .filter(s => s.time !== null)
                    .sort((a, b) => a.time! - b.time!);

                  return (
                    <div key={m.id} className="p-3.5 bg-cyan-50/20 border border-cyan-100 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-cyan-700 bg-cyan-100/50 px-2 py-0.5 rounded-md uppercase tracking-tight">
                          🏊‍♂️ Swimming • {m.match_label}
                        </span>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-black uppercase">
                          RESOLVED
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {sortedSwimmers.slice(0, 3).map((sw, insideIdx) => {
                          const totalMs = sw.time!;
                          const mins = Math.floor(totalMs / 60000);
                          const secs = Math.floor((totalMs % 60000) / 1000);
                          const ms = Math.floor((totalMs % 1000) / 10);
                          const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;

                          return (
                            <div key={insideIdx} className="flex justify-between items-center text-[11px]">
                              <span className="font-extrabold text-gray-700 flex items-center gap-1">
                                <span className="font-mono text-[9px] text-gray-400">#{insideIdx + 1}</span> {sw.name} {insideIdx === 0 ? '🥇' : insideIdx === 1 ? '🥈' : insideIdx === 2 ? '🥉' : ''}
                              </span>
                              <span className="font-mono font-bold text-[10px] text-cyan-600">
                                {formatted}
                              </span>
                            </div>
                          );
                        })}
                        {sortedSwimmers.length === 0 && (
                          <p className="text-[9px] text-gray-400 text-center py-2">No swimmer times logged.</p>
                        )}
                      </div>
                    </div>
                  );
                }

                const winnerA = m.score_a > m.score_b;
                const winnerB = m.score_b > m.score_a;
                
                return (
                  <div key={m.id} className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] font-black text-[#D40511] uppercase tracking-tight italic">
                        {SPORT_CONFIGS[m.sport_name]?.icon} {m.sport_name}
                      </span>
                      <span className="text-[8.5px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase">
                        RESOLVED
                      </span>
                    </div>

                    <p className="text-[8.5px] font-bold text-gray-400 uppercase tracking-widest">{m.match_label}</p>

                    <div className="space-y-1.5 font-sans">
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] ${winnerA ? 'font-extrabold text-gray-800' : 'text-gray-500'}`}>
                          {m.team_a} {winnerA && '🏆'}
                        </span>
                        <span className={`font-mono text-xs ${winnerA ? 'font-black text-gray-900' : 'text-gray-400'}`}>
                          {m.score_a}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] ${winnerB ? 'font-extrabold text-gray-800' : 'text-gray-500'}`}>
                          {m.team_b} {winnerB && '🏆'}
                        </span>
                        <span className={`font-mono text-xs ${winnerB ? 'font-black text-gray-900' : 'text-gray-400'}`}>
                          {m.score_b}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

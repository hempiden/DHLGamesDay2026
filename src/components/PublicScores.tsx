import React, { useState, useEffect } from 'react';
import { Award, Trophy, Zap, Users, AlertCircle, RefreshCw, Star, CheckCircle, Flame, Calendar, Clock, ArrowRight, X, Maximize2 } from 'lucide-react';
import { Match, Participant, SportType, getTranslatedText } from '../types';
import { SPORT_CONFIGS, isSportDistance, formatSportScore } from '../data';

interface PublicScoresProps {
  matches: Match[];
  participants: Participant[];
  currentLanguage?: 'kh' | 'en';
  translations?: Record<string, { kh: string; en: string }>;
}

export default function PublicScores({ matches, participants, currentLanguage = 'kh', translations }: PublicScoresProps) {
  const t = (key: string, defaultKh: string, defaultEn: string): string => {
    return getTranslatedText(key, defaultKh, defaultEn, currentLanguage, translations);
  };

  // Select active sport to view scores
  const [selectedSport, setSelectedSport] = useState<SportType | 'All'>('All');

  // Fullscreen slideshow match state
  const [selectedFullscreenMatchId, setSelectedFullscreenMatchId] = useState<string | null>(null);

  // Auto-dismiss or escape handler for projector view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFullscreenMatchId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time swimming stopwatch ticker state (ticks every 43ms to update live spectator views)
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    const isLiveSwimActive = matches.some((m) => m.sport_name === 'Swimming' && m.status === 'Live');
    if (!isLiveSwimActive) return;

    const intervalId = setInterval(() => {
      setTick((t) => t + 1);
    }, 43);
    return () => clearInterval(intervalId);
  }, [matches]);

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
            {t('header_live_broadcasting', 'ផ្សាយផ្ទាល់ពីទីលាន', 'LIVE BROADCASTING')}
          </span>
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#D40511] px-3.5 py-1.5 transform -skew-x-12 inline-block">
              <span className="text-white font-black italic tracking-tighter text-sm sm:text-base">CHAMPIONSHIPS 2026</span>
            </div>
            <span className="bg-gray-800 text-gray-300 font-bold px-2.5 py-1 text-[9px] rounded-md tracking-wider uppercase">
              {t('header_spectator_deck', 'ផ្ទាំងទស្សនាលទ្ធផល', 'SPECTATOR DECK')}
            </span>
          </div>
          
          <h2 className="font-dhl-title text-2xl sm:text-4xl text-[#FFCC00] italic uppercase leading-tight tracking-tight drop-shadow-sm">
            {currentLanguage === 'kh' ? (
              <>
                {t('header_portal_khmer', 'មហាជនមើលពិន្ទុផ្ទាល់', 'មហាជនមើលពិន្ទុផ្ទាល់')} <br className="hidden sm:inline" />
                <span className="text-white text-base sm:text-lg block not-italic font-sans font-bold tracking-wide mt-1 uppercase">SPECTATORS LIVE ACTION PORTAL</span>
              </>
            ) : (
              <span className="text-white">{t('header_portal_khmer', 'មហាជនមើលពិន្ទុផ្ទាល់', 'SPECTATORS LIVE ACTION PORTAL')}</span>
            )}
          </h2>
          <p className="text-gray-400 text-xs font-medium max-w-xl leading-relaxed">
            {t('header_portal_subtitle', 'ទទួលបានពិន្ទុថ្មីៗឥតឈប់ឈរ កាលវិភាគប្រកួត និងសកម្មភាពលេចធ្លោពីកីឡាករគ្រប់រូបក្នុងទីលានភ្លាមៗ។', 'Stay aligned with the continuous scoreboard, real-time sports updates, and celebrate the registered athletes delivering excellence across the arena.')}
          </p>
        </div>
        
        {/* Retro scanlines or glowing accents */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-[#FFCC00] to-emerald-500"></div>
      </div>

      {/* SPORT SELECTOR TAB MENU */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-black uppercase tracking-wider mb-3.5 pl-1.5">
          <Flame className="w-4 h-4 text-[#D40511] animate-bounce" />
          <span>{t('select_sport_filter', 'ជ្រើសរើសប្រភេទកីឡាដើម្បីមើល (Select Sport to Filter)', 'Select Sport Category to Filter')}</span>
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
            <span className="text-[10px] font-black uppercase tracking-wider">
              {t('all_sports_filter', 'វិញ្ញាសាទាំងអស់', 'All Sports')}
            </span>
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
              {t('congrats_victory', 'អបអរសាទរម្ចាស់ជ័យជំនះ!', 'Victory Celebration!')}
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
                        ★ {item.match.sport_name} {t('winner_badge', 'ជ័យជម្នះ (Winner)', 'Winner').toUpperCase()} ★
                      </span>
                      <h4 className="text-white text-xl font-black uppercase tracking-tight italic drop-shadow-sm">
                        {item.winningTeamName}
                      </h4>
                      <p className="text-gray-300 text-[10px] uppercase font-bold tracking-wider">
                        {currentLanguage === 'kh' ? (
                          <span>បានឈ្នះគូប្រកួតជាមួយពិន្ទុចុងក្រោយដ៏ល្អឥតខ្ចោះគឺ <span className="text-[#FFCC00] font-black">{item.winningScore} - {item.losingScore}</span>!</span>
                        ) : (
                          <span>Defeated opponent with a glorious final score of <span className="text-[#FFCC00] font-black">{item.winningScore} - {item.losingScore}</span>!</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Registered Roster Members Congratulation Deck */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div>
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 animate-fade-in">
                        {t('team_roster_members', 'សមាជិកក្រុមដែលបានចុះឈ្មោះ', 'Registered Team Members').toUpperCase()}
                      </h5>
                      
                      {roster.length === 0 ? (
                        <div className="py-6 text-center text-gray-400">
                          <Users className="w-8 h-8 opacity-20 mx-auto mb-1" />
                          <p className="text-[9px] font-bold uppercase">
                            {t('empty_roster_msg', 'មិនទាន់មានឈ្មោះសមាជិកនៅឡើយទេ (Roster Empty)', 'No members in this roster yet.')}
                          </p>
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
              {t('live_matches_title', 'ការប្រកួតកំពុងលេង (Live)', 'Live Matches')}
            </h3>
          </div>

          {selectedSport === 'Swimming' && (() => {
            // Group finished swimming matches by match_label
            const finishedSwimMatches = matches.filter(
              (m) => m.sport_name === 'Swimming' && m.status === 'Finished'
            );

            if (finishedSwimMatches.length === 0) return null;

            // Group swimmers by stage label
            const swimGroupsDict: Record<string, Record<string, { id: string; name: string; time: number | null; matchLabel: string }>> = {};

            // Sort matches chronologically so later results come last and overwrite earlier ones
            const sortedFinishedSwimMatches = [...finishedSwimMatches].sort((a, b) => {
              const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
              const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
              return aTime - bTime;
            });

            sortedFinishedSwimMatches.forEach((m) => {
              try {
                const swimmersList = typeof m.team_a === 'object' && m.team_a !== null
                  ? (m.team_a as any)
                  : (JSON.parse(m.team_a || '[]') as { id: string; name: string }[]);
                  
                const timerState = typeof m.team_b === 'object' && m.team_b !== null
                  ? (m.team_b as any)
                  : (JSON.parse(m.team_b || '{}') as { times: Record<string, number | null> });
                
                swimmersList.forEach((sw) => {
                  const duration = timerState.times?.[sw.id] !== undefined
                    ? timerState.times?.[sw.id]
                    : (timerState.times?.[sw.name] !== undefined ? timerState.times?.[sw.name] : null);
                  
                  if (!swimGroupsDict[m.match_label]) {
                    swimGroupsDict[m.match_label] = {};
                  }
                  swimGroupsDict[m.match_label][sw.name] = {
                    id: sw.id,
                    name: sw.name,
                    time: duration,
                    matchLabel: m.match_label,
                  };
                });
              } catch (e) {
                console.error("Failed to parse swimming match for leaderboard:", e);
              }
            });

            const swimGroups: Record<string, { id: string; name: string; time: number | null; matchLabel: string }[]> = {};
            Object.keys(swimGroupsDict).forEach((label) => {
              swimGroups[label] = Object.values(swimGroupsDict[label]);
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
                    // Sort swimmers in this label by time ascending (lowest time = fastest, nulls rank last as Disqualified!)
                    const sortedSwimmers = [...swimGroups[label]].sort((a, b) => {
                      if (a.time === null) return 1;
                      if (b.time === null) return -1;
                      return a.time! - b.time!;
                    });

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
                            const isDisqualified = sw.time === null;
                            const isGold = index === 0 && !isDisqualified;
                            const isSilver = index === 1 && !isDisqualified;
                            const isBronze = index === 2 && !isDisqualified;

                            // Format as mm:ss.SS
                            let formattedTime = "Disqualify (DQ)";
                            if (sw.time !== null) {
                              const totalMs = sw.time!;
                              const mins = Math.floor(totalMs / 60000);
                              const secs = Math.floor((totalMs % 60000) / 1000);
                              const ms = Math.floor((totalMs % 1000) / 10);
                              formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
                            }

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
                                    : isDisqualified
                                    ? 'bg-red-950/20 border border-red-900/35 text-red-350'
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
                                      : isDisqualified
                                      ? 'bg-red-950 text-red-400 text-[9px] font-black'
                                      : 'bg-slate-900 text-gray-400'
                                  }`}>
                                    {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : isDisqualified ? 'DQ' : `${index + 1}`}
                                  </span>
                                  <span className="font-extrabold text-xs">{sw.name}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isGold && (
                                    <span className="text-[10px] uppercase font-black tracking-widest text-[#FFCC00]/80">
                                      Winner
                                    </span>
                                  )}
                                  <span className={`font-mono text-xs font-black ${isDisqualified ? 'text-red-400 bg-red-950/30 border border-red-900/15' : 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/10'} px-2.5 py-1 rounded-lg`}>
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
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('no_live_matches', 'មិនទាន់មានការប្រកួតកំពុងលេង នាពេលបច្ចុប្បន្នទេ។', 'There are no live matches in play currently.')}
              </p>
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
                    swimmersList = typeof m.team_a === 'object' && m.team_a !== null
                      ? (m.team_a as any)
                      : JSON.parse(m.team_a || '[]');
                    
                    stopwatchState = typeof m.team_b === 'object' && m.team_b !== null
                      ? (m.team_b as any)
                      : JSON.parse(m.team_b || '{}');
                  } catch (e) {}

                  return (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedFullscreenMatchId(m.id)}
                      className="bg-white text-gray-800 rounded-[24px] border-l-[6px] border-l-red-650 border border-gray-150 shadow-md p-6 relative overflow-hidden cursor-pointer hover:scale-[1.01] hover:shadow-lg hover:border-red-200 transition-all duration-200 group"
                      title="Click to enter Fullscreen Slideshow Mode"
                    >
                      <div className="absolute top-0 right-0 py-1.5 px-4 bg-red-650 text-white font-black text-[9px] uppercase tracking-widest rounded-bl-xl flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        <span>LIVE SWIM HEAT</span>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2.5 py-0.5 bg-red-50 text-[#D40511] font-extrabold uppercase text-[9px] tracking-wider rounded-md border border-red-100 inline-block">
                                ⏱️ SWIMMING • {m.match_label}
                              </span>
                              {(m.scheduled_date || m.scheduled_time) && (
                                <span className="px-2 py-0.5 bg-gray-50 border border-gray-150 text-gray-500 font-extrabold uppercase text-[9px] tracking-wider rounded-md inline-block">
                                  📅 {[m.scheduled_date, m.scheduled_time].filter(Boolean).join(' • ')}
                                </span>
                              )}
                            </div>
                            <h4 className="font-black text-gray-800 text-sm mt-1 uppercase">គន្លងហែលទឹកផ្សាយផ្ទាល់ (Live Lane Track Feed)</h4>
                          </div>
                          
                          <span className="text-[9px] inline-flex items-center gap-1.5 text-[#D40511] font-black uppercase tracking-wider bg-red-50 border border-red-100 px-2.5 py-1 rounded-full shrink-0">
                            <Maximize2 className="w-3 h-3 animate-pulse" />
                            <span>បង្ហាញ Fullscreen Slideshow 📺</span>
                          </span>
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
                            } else if (isTimerRunning && stopwatchState.start_time) {
                              // Ticks dynamically in millisecond precision
                              const elapsedMs = Math.max(0, Date.now() - stopwatchState.start_time);
                              const mins = Math.floor(elapsedMs / 60000);
                              const secs = Math.floor((elapsedMs % 60000) / 1000);
                              const ms = Math.floor((elapsedMs % 1000) / 10);
                              displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
                            }

                            return (
                              <div 
                                key={sw.id || idx}
                                className={`p-3 rounded-xl flex items-center justify-between border transition ${
                                  isStopped
                                    ? 'bg-gray-50 border-gray-200 text-gray-500'
                                    : isTimerRunning
                                    ? 'bg-yellow-50 border-yellow-400/45 text-slate-800'
                                    : 'bg-white border-gray-100 text-gray-400'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 text-xs">
                                  <span className={`font-mono font-black text-[9px] px-2 py-0.5 rounded border ${
                                    isTimerRunning 
                                      ? 'text-[#D40511] bg-yellow-100 border-yellow-300' 
                                      : 'text-gray-500 bg-gray-100 border-gray-200'
                                  }`}>
                                    Lane {idx + 1}
                                  </span>
                                  <p className="font-bold truncate max-w-[120px] text-gray-800">{sw.name}</p>
                                </div>
                                <span className={`font-mono text-[11px] font-black ${isStopped ? 'text-emerald-600' : isTimerRunning ? 'text-[#D40511]' : 'text-gray-400'}`}>
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
                    onClick={() => setSelectedFullscreenMatchId(m.id)}
                    className="bg-white rounded-[24px] border-l-[6px] border-l-red-500 border border-gray-150 shadow-md p-6 relative overflow-hidden cursor-pointer hover:scale-[1.01] hover:shadow-lg hover:border-red-200 transition-all duration-200 group"
                    title="Click to enter Fullscreen Slideshow Mode"
                  >
                    <div className="absolute top-0 right-0 py-1.5 px-4 bg-red-650 text-white font-black text-[9px] uppercase tracking-widest rounded-bl-xl flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      <span>Live Score</span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="space-y-1 text-center sm:text-left shrink-0">
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-red-50 text-[#D40511] font-black uppercase text-[9px] tracking-wider rounded-md border border-red-100">
                            {SPORT_CONFIGS[m.sport_name]?.icon} {m.sport_name}
                          </span>
                          {(m.scheduled_date || m.scheduled_time) && (
                            <span className="px-2 py-0.5 bg-gray-50 border border-gray-150 text-gray-500 font-extrabold uppercase text-[9px] tracking-wider rounded-md inline-block">
                              📅 {[m.scheduled_date, m.scheduled_time].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-gray-800 text-sm mt-1 uppercase">{m.match_label}</h4>
                        <div className="flex items-center gap-1 text-[9px] text-[#D40511] font-bold uppercase">
                          <Clock className="w-3 h-3 animate-spin text-[#D40511]" />
                          <span>Live Timing Active</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-3 sm:gap-7 w-full sm:w-auto">
                        <div className="text-right w-24 sm:w-36">
                          <p className="font-extrabold text-xs sm:text-sm text-gray-800 line-clamp-1">{m.team_a}</p>
                          <span className="text-[9px] text-gray-400 uppercase font-black">Competitor A</span>
                        </div>

                        <div className="px-5 py-2.5 bg-gray-950 text-[#FFCC00] rounded-2xl font-mono text-xl sm:text-2xl font-black tracking-widest shadow-inner group-hover:scale-105 duration-100 flex items-center gap-2">
                          {formatSportScore(m.score_a, m.sport_name)} - {formatSportScore(m.score_b, m.sport_name)}
                        </div>

                        <div className="text-left w-24 sm:w-36">
                          <p className="font-extrabold text-xs sm:text-sm text-gray-800 line-clamp-1">{m.team_b}</p>
                          <span className="text-[9px] text-gray-400 uppercase font-black">Competitor B</span>
                        </div>
                      </div>
                    </div>

                    {/* Fullscreen indicator banner */}
                    <div className="mt-4 pt-3 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] uppercase font-bold text-gray-400 gap-2">
                      <span>👉 ចុចលើផ្ទាំងនេះដើម្បីបង្ហាញបែបស្លាយ Slide Show (Click to Broadcast)</span>
                      <span className="opacity-80 group-hover:opacity-100 text-[#D40511] font-black transition-opacity flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" /> FULLSCREEN AREA 📺
                      </span>
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
                {t('upcoming_matches_title', 'ការប្រកួតនាពេលខាងមុខ (Upcoming)', 'Upcoming Fixtures')}
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl font-extrabold text-[9px] uppercase tracking-wide">
                          {SPORT_CONFIGS[m.sport_name]?.icon} {m.sport_name}
                        </span>
                        {(m.scheduled_date || m.scheduled_time) && (
                          <span className="px-2 py-0.5 bg-gray-50 border border-gray-150 text-gray-500 font-extrabold uppercase text-[9px] tracking-wider rounded-md inline-block">
                            📅 {[m.scheduled_date, m.scheduled_time].filter(Boolean).join(' • ')}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400 font-extrabold uppercase bg-gray-50 px-2 py-0.5 rounded-md">Upcoming</span>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-black text-gray-400 uppercase text-[9px] tracking-wider">{m.match_label}</h5>
                      {m.sport_name === 'Swimming' ? (
                        <div className="text-[10.5px] text-gray-700">
                          <span className="font-black text-red-650 block text-[9.5px] uppercase tracking-wide mb-1">
                            🏊‍♂️ ឈ្មោះកីឡាករ (Racer Pool Roster):
                          </span>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {(() => {
                              let list: { id: string; name: string }[] = [];
                              let parseSuccess = false;
                              try {
                                if (typeof m.team_a === 'object' && m.team_a !== null) {
                                  list = m.team_a as any;
                                  parseSuccess = Array.isArray(list);
                                } else if (typeof m.team_a === 'string' && m.team_a.trim().startsWith('[')) {
                                  list = JSON.parse(m.team_a);
                                  parseSuccess = Array.isArray(list);
                                }
                              } catch(e) {}

                              if (!parseSuccess || list.length === 0) {
                                const rawText = typeof m.team_a === 'string' ? m.team_a : '';
                                if (rawText) {
                                  return (
                                    <span className="px-2 py-0.5 bg-yellow-50 text-slate-800 border border-yellow-250 rounded-md text-[9.5px] font-extrabold shadow-xs">
                                      {rawText}
                                    </span>
                                  );
                                }
                                return <span className="text-gray-400 italic">No registered swimmers</span>;
                              }
                              return list.map((sw, index) => (
                                <span key={sw.id || index} className="px-2 py-0.5 bg-yellow-50 text-slate-800 border border-yellow-250 rounded-md text-[9.5px] font-extrabold shadow-xs transition hover:bg-yellow-100">
                                  Lane {index + 1}: {sw.name}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 font-bold text-xs text-gray-700 font-bold text-xs text-gray-700">
                          <span className="line-clamp-1 max-w-[110px]">{m.team_a}</span>
                          <span className="text-gray-300 font-black italic select-none px-1">VS</span>
                          <span className="line-clamp-1 max-w-[110px]">{m.team_b}</span>
                        </div>
                      )}
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
              {t('finished_matches_title', 'ការប្រកួតដែលបានបញ្ចប់ (Finished)', 'Finished Matches')}
            </h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 max-h-[560px] overflow-y-auto">
            {finishedMatches.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <AlertCircle className="w-7 h-7 mx-auto opacity-20 mb-1" />
                <p className="text-[10px] font-black uppercase">
                  {t('no_finished_matches', 'មិនទាន់មានការប្រកួតដែលបានបញ្ចប់នៅឡើយទេ។', 'No matches have finished in this category yet.')}
                </p>
                <p className="text-[9px] text-gray-400">Completed events will register scores here live.</p>
              </div>
            ) : (
              finishedMatches.map((m) => {
                const isSwim = m.sport_name === 'Swimming';

                if (isSwim) {
                  let swimmersList: { id: string; name: string }[] = [];
                  let stopwatchState = { times: {} as Record<string, number | null> };
                  try {
                    swimmersList = typeof m.team_a === 'object' && m.team_a !== null
                      ? (m.team_a as any)
                      : JSON.parse(m.team_a || '[]');
                    
                    stopwatchState = typeof m.team_b === 'object' && m.team_b !== null
                      ? (m.team_b as any)
                      : JSON.parse(m.team_b || '{}');
                  } catch (e) {}

                  // Sort swimmers by recorded stopped times, putting nulls (Disqualified) at the bottom
                  const sortedSwimmers = swimmersList
                    .map(sw => ({
                      name: sw.name,
                      time: stopwatchState.times?.[sw.id] !== undefined
                        ? stopwatchState.times?.[sw.id]
                        : (stopwatchState.times?.[sw.name] !== undefined ? stopwatchState.times?.[sw.name] : null)
                    }))
                    .sort((a, b) => {
                      if (a.time === null) return 1;
                      if (b.time === null) return -1;
                      return b.time - a.time; // sort descending to print properly in slice or show full list
                    })
                    // Sort ascending for placement rank, placing DQ at the bottom
                    .sort((a, b) => {
                      if (a.time === null) return 1;
                      if (b.time === null) return -1;
                      return a.time - b.time;
                    });

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
                        {sortedSwimmers.map((sw, insideIdx) => {
                          const isDisqualified = sw.time === null;
                          let formatted = "Disqualify (DQ)";
                          if (!isDisqualified) {
                            const totalMs = sw.time!;
                            const mins = Math.floor(totalMs / 60000);
                            const secs = Math.floor((totalMs % 60000) / 1000);
                            const ms = Math.floor((totalMs % 1000) / 10);
                            formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
                          }

                          return (
                            <div key={insideIdx} className="flex justify-between items-center text-[11px]">
                              <span className="font-extrabold text-gray-700 flex items-center gap-1">
                                <span className="font-mono text-[9px] text-gray-400">#{insideIdx + 1}</span> {sw.name} {!isDisqualified && (insideIdx === 0 ? '🥇' : insideIdx === 1 ? '🥈' : insideIdx === 2 ? '🥉' : '')}
                              </span>
                              <span className={`font-mono font-black text-[10px] ${isDisqualified ? 'text-red-500' : 'text-cyan-600'}`}>
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
                          {formatSportScore(m.score_a, m.sport_name)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] ${winnerB ? 'font-extrabold text-gray-800' : 'text-gray-500'}`}>
                          {m.team_b} {winnerB && '🏆'}
                        </span>
                        <span className={`font-mono text-xs ${winnerB ? 'font-black text-gray-900' : 'text-gray-400'}`}>
                          {formatSportScore(m.score_b, m.sport_name)}
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

      {/* FULLSCREEN IMMERSIVE BROADCAST SCOREBOARD FOR SLIDESHOW / PROJECTOR DISPLAY */}
      {selectedFullscreenMatchId && (() => {
        const m = matches.find(match => match.id === selectedFullscreenMatchId);
        if (!m) return null;
        const isSwimming = m.sport_name === 'Swimming';

        if (isSwimming) {
          let swimmersList: { id: string; name: string }[] = [];
          let stopwatchState = { start_time: null as number | null, is_running: false, times: {} as Record<string, number | null> };
          try {
            swimmersList = typeof m.team_a === 'object' && m.team_a !== null
              ? (m.team_a as any)
              : JSON.parse(m.team_a || '[]');
            
            stopwatchState = typeof m.team_b === 'object' && m.team_b !== null
              ? (m.team_b as any)
              : JSON.parse(m.team_b || '{}');
          } catch (e) {}

          // Math to calculate live continuous ticking or stopped time for the master clock
          let masterDisplayTime = "00:00.00";
          if (stopwatchState.start_time) {
            const elapsed = stopwatchState.is_running 
              ? Math.max(0, Date.now() - stopwatchState.start_time)
              : Object.values(stopwatchState.times).filter(t => t !== null).reduce((max: number, curr: number | null) => Math.max(max, curr ?? 0), 0) || 0;
            
            if (elapsed) {
              const mins = Math.floor(elapsed / 60000);
              const secs = Math.floor((elapsed % 60000) / 1000);
              const ms = Math.floor((elapsed % 1000) / 10);
              masterDisplayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
            }
          }

          return (
            <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col justify-between p-6 sm:p-12 overflow-y-auto font-sans text-white select-none">
              {/* Background Ambient Cosmic Glows */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none"></div>

              {/* Header section */}
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center bg-slate-900/60 backdrop-blur-md border border-cyan-500/30 px-6 py-4 rounded-[32px] gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-[#D40511] px-4 py-1.5 transform -skew-x-12 inline-block shadow-lg">
                    <span className="text-white font-black italic tracking-tighter text-sm">CHAMPIONSHIPS 2026</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="text-cyan-400 font-extrabold text-xs uppercase tracking-widest font-mono">LIVE STADIUM BROADCAST</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[11px] text-zinc-400 font-black tracking-widest uppercase mb-0.5">SWIMMING HEAT SLIDESHOW</p>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">{m.match_label}</h1>
                </div>

                <button 
                  onClick={() => setSelectedFullscreenMatchId(null)}
                  className="px-5 py-2.5 bg-red-650 hover:bg-red-700 active:scale-95 duration-100 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>ចាកចេញពី Fullscreen [ESC]</span>
                </button>
              </div>

              {/* Master Digital Stopwatch Stage */}
              <div className="relative z-10 flex-1 flex flex-col justify-center items-center py-6">
                <div className="text-center space-y-2 bg-slate-950/90 border-4 border-cyan-500/40 p-8 sm:p-12 rounded-[40px] shadow-[0_0_50px_rgba(34,211,238,0.25)] max-w-xl sm:max-w-2xl w-full">
                  <span className="text-cyan-400 font-black text-xs uppercase tracking-[0.3em] font-mono block">MASTER DIGITAL STOPWATCH</span>
                  <div className="text-6xl sm:text-[8.5rem] font-mono font-black tracking-widest text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] leading-none my-4">
                    {masterDisplayTime}
                  </div>
                  <div className="inline-flex items-center justify-center gap-1.5 py-1 px-4 bg-cyan-950/50 border border-cyan-800/40 rounded-full text-[10px] uppercase font-black tracking-widest text-cyan-300">
                    <span className={`w-2 h-2 rounded-full ${stopwatchState.is_running ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`}></span>
                    <span>{stopwatchState.is_running ? 'HEAT RUNNING (ម៉ោងកំពុងដើរ)' : 'HEAT IDLE / STOPPED (ម៉ោងផ្អាក)'}</span>
                  </div>
                </div>

                {/* Sub swimmers progress list */}
                <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {swimmersList.map((sw, idx) => {
                    const stoppedTime = stopwatchState.times?.[sw.id] ?? stopwatchState.times?.[sw.name];
                    const isStopped = stoppedTime !== undefined && stoppedTime !== null;
                    const isTimerRunning = stopwatchState.is_running && !isStopped;

                    // format individual times
                    let displayTime = "00:00.00";
                    if (isStopped) {
                      const totalMs = stoppedTime!;
                      const mins = Math.floor(totalMs / 60000);
                      const secs = Math.floor((totalMs % 60000) / 1000);
                      const ms = Math.floor((totalMs % 1000) / 10);
                      displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
                    } else if (isTimerRunning && stopwatchState.start_time) {
                      const elapsedMs = Math.max(0, Date.now() - stopwatchState.start_time);
                      const mins = Math.floor(elapsedMs / 60000);
                      const secs = Math.floor((elapsedMs % 60000) / 1000);
                      const ms = Math.floor((elapsedMs % 1000) / 10);
                      displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
                    }

                    return (
                      <div 
                        key={sw.id || idx}
                        className={`p-5 rounded-3xl flex items-center justify-between border-2 transition-all duration-200 ${
                          isStopped
                            ? 'bg-slate-900 border-slate-705/50 text-gray-450'
                            : isTimerRunning
                            ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.15)] animate-pulse'
                            : 'bg-slate-950/50 border-slate-850 text-gray-550'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`font-mono font-black text-xs px-3 py-1 rounded-xl border ${
                            isStopped 
                              ? 'bg-slate-950 border-slate-800 text-slate-500' 
                              : 'bg-cyan-900 border-cyan-700 text-cyan-300'
                          }`}>
                            LANE {idx + 1}
                          </span>
                          <div>
                            <p className="font-extrabold text-sm sm:text-base text-white tracking-wide uppercase leading-tight">{sw.name}</p>
                            <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase">
                              {isStopped ? '✅ FINISHED' : isTimerRunning ? '🏊‍♂️ PACING LANE' : '⏱️ READY TO START'}
                            </span>
                          </div>
                        </div>

                        <span className={`font-mono text-lg sm:text-2xl font-black ${
                          isStopped ? 'text-emerald-400' : isTimerRunning ? 'text-[#FFCC00] animate-pulse' : 'text-zinc-500'
                        }`}>
                          {displayTime}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informational footer */}
              <div className="relative z-10 border-t border-slate-900 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400 mt-8">
                <span>SWIMMING CHAMPIONSHIPS • SPECTATOR DISPLAY</span>
                <span>Press escape [ESC] or click close to return to board</span>
              </div>
            </div>
          );
        } else {
          // Standard traditional team match view
          const rosterA = getTeamRosterAndTheme(m.team_a, m.sport_name).roster;
          const rosterB = getTeamRosterAndTheme(m.team_b, m.sport_name).roster;

          return (
            <div className="fixed inset-0 bg-[#090505] z-50 flex flex-col justify-between p-6 sm:p-12 overflow-y-auto font-sans text-white select-none">
              {/* Backglow decoration for big-screen stadium board */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D40511]/10 rounded-full blur-[140px] pointer-events-none"></div>

               {/* Header section */}
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center bg-zinc-950/80 border border-zinc-805 px-6 py-4 rounded-[32px] gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[#D40511] px-4 py-1.5 transform -skew-x-12 inline-block shadow-lg">
                    <span className="text-white font-black italic tracking-tighter text-sm">CHAMPIONSHIPS 2026</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                    <span className="text-red-600 font-extrabold text-xs uppercase tracking-widest font-mono">LIVE STADIUM SCREEN</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[11px] text-zinc-400 font-black tracking-widest uppercase mb-0.5">{m.sport_name} ACTION BOARD</p>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">{m.match_label}</h1>
                </div>

                <button 
                  onClick={() => setSelectedFullscreenMatchId(null)}
                  className="px-5 py-2.5 bg-red-650 hover:bg-red-700 active:scale-95 duration-100 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>ចាកចេញពី Fullscreen [ESC]</span>
                </button>
              </div>

              {/* Huge Stadium scoreboard */}
              <div className="relative z-10 flex-grow flex flex-col lg:flex-row justify-center items-center gap-12 py-10">
                {/* Team A on the left */}
                <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-end text-center lg:text-right space-y-6">
                  <div className="space-y-1">
                    <span className="text-[11px] bg-red-950 text-[#FF3B30] font-black uppercase tracking-widest py-1 px-3.5 rounded-full border border-red-900 border-opacity-30">COMPETITOR A</span>
                    <h2 className="text-3xl sm:text-6xl font-black text-white tracking-normal leading-tight uppercase pr-1">
                      {m.team_a}
                    </h2>
                  </div>

                  {/* Player roster for Team A */}
                  <div className="w-full max-w-sm bg-neutral-900/40 p-5 rounded-3xl border border-zinc-800/40">
                    <h3 className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-3.5 text-center lg:text-right">ROSTER MEMBERS (កីឡាករជាសមាជិក)</h3>
                    {rosterA.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 uppercase font-bold text-center lg:text-right">No roster registered under Team A</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-left">
                        {rosterA.map((p, idx) => (
                          <div key={p.id || idx} className="flex items-center gap-2.5 p-1.5 bg-zinc-950/60 rounded-xl">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center font-mono font-black text-[10px] text-red-500">
                              {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold truncate text-zinc-300">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Score section in the center */}
                <div className="flex flex-col justify-center items-center">
                  <div className="bg-gradient-to-b from-neutral-900 to-black border-4 border-zinc-800 px-12 sm:px-16 py-10 rounded-[48px] shadow-2xl flex items-center gap-6 sm:gap-10 sm:scale-110">
                    <span className={`${isSportDistance(m.sport_name) ? 'text-5xl sm:text-[6rem]' : 'text-7xl sm:text-[10rem]'} font-mono font-black text-[#FFCC00] leading-none drop-shadow-[0_0_20px_rgba(255,204,0,0.5)]`}>
                      {formatSportScore(m.score_a, m.sport_name)}
                    </span>
                    <span className="text-4xl sm:text-[6rem] font-black text-zinc-700 leading-none select-none tracking-tighter">
                      -
                    </span>
                    <span className={`${isSportDistance(m.sport_name) ? 'text-5xl sm:text-[6rem]' : 'text-7xl sm:text-[10rem]'} font-mono font-black text-[#FFCC00] leading-none drop-shadow-[0_0_20px_rgba(255,204,0,0.5)]`}>
                      {formatSportScore(m.score_b, m.sport_name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 py-1 px-4 bg-red-950/30 border border-red-900/30 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400 mt-6 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                    <span>LIVE PROGRESS IN PLAY (កំពុងលេង)</span>
                  </div>
                </div>

                {/* Team B on the right */}
                <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                  <div className="space-y-1">
                    <span className="text-[11px] bg-red-950 text-[#FF3B30] font-black uppercase tracking-widest py-1 px-3.5 rounded-full border border-red-900 border-opacity-30">COMPETITOR B</span>
                    <h2 className="text-3xl sm:text-6xl font-black text-white tracking-normal leading-tight uppercase pl-1">
                      {m.team_b}
                    </h2>
                  </div>

                  {/* Player roster for Team B */}
                  <div className="w-full max-w-sm bg-neutral-900/40 p-5 rounded-3xl border border-zinc-800/40">
                    <h3 className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-3.5 text-center lg:text-left">ROSTER MEMBERS (កីឡាករជាសមាជិក)</h3>
                    {rosterB.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 uppercase font-bold text-center lg:text-right">No roster registered under Team B</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-left">
                        {rosterB.map((p, idx) => (
                          <div key={p.id || idx} className="flex items-center gap-2.5 p-1.5 bg-zinc-950/60 rounded-xl">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center font-mono font-black text-[10px] text-red-500">
                              {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold truncate text-zinc-300">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informational footer */}
              <div className="relative z-10 border-t border-zinc-900 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500 mt-4">
                <span>SPORTS TOURNAMENT ARENA CODES • SLIDESHOW OVERVIEW</span>
                <span>Press escape [ESC] or click close to return to board</span>
              </div>
            </div>
          );
        }
      })()}

    </div>
  );
}

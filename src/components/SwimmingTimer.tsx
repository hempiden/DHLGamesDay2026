import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Match, Participant, AppUser } from '../types';
import { 
  Timer, 
  Play, 
  CircleDot, 
  Flag, 
  VolumeX, 
  Volume2, 
  Users, 
  Activity, 
  Award, 
  Trophy, 
  RotateCcw, 
  CheckCircle, 
  User, 
  Sparkles,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  Clock
} from 'lucide-react';
import { SPORT_CONFIGS } from '../data';

interface SwimmingTimerProps {
  matches: Match[];
  participants: Participant[];
  updateMatchFields: (id: string, fields: Partial<Match>) => Promise<boolean>;
  currentUser: AppUser | null;
}

interface SwimmerData {
  id: string;
  name: string;
}

interface SwimmingState {
  start_time: number | null; // epoch timestamp ms
  is_running: boolean;
  times: Record<string, number | null>; // swimmer_id to seconds (number)
}

export default function SwimmingTimer({ matches, participants, updateMatchFields, currentUser }: SwimmingTimerProps) {
  // 1. Filter active swimming matches (Upcoming or Live)
  const swimmingMatches = useMemo(() => {
    return matches.filter(m => m.sport_name === 'Swimming');
  }, [matches]);

  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  // Auto-select the first live swimming match, or fallback to upcoming
  useEffect(() => {
    if (swimmingMatches.length > 0 && !selectedMatchId) {
      const live = swimmingMatches.find(m => m.status === 'Live');
      if (live) {
        setSelectedMatchId(live.id);
      } else {
        const upcoming = swimmingMatches.find(m => m.status === 'Upcoming');
        if (upcoming) {
          setSelectedMatchId(upcoming.id);
        } else if (swimmingMatches.length > 0) {
          setSelectedMatchId(swimmingMatches[0].id);
        }
      }
    }
  }, [swimmingMatches, selectedMatchId]);

  const activeMatch = useMemo(() => {
    return swimmingMatches.find(m => m.id === selectedMatchId);
  }, [swimmingMatches, selectedMatchId]);

  // Parse swimmers from activeMatch.team_a
  const swimmers: SwimmerData[] = useMemo(() => {
    if (!activeMatch) return [];
    try {
      if (activeMatch.team_a.startsWith('[')) {
        return JSON.parse(activeMatch.team_a);
      }
    } catch (e) {
      console.warn('Failed parsing JSON swimmers list, falling back to comma split');
    }
    
    // Fallback: split by comma or treat team_a and team_b as simple single names
    if (!activeMatch.team_a) return [];
    const split = activeMatch.team_a.split(',').map(s => s.trim()).filter(Boolean);
    if (split.length > 1) {
      return split.map((name, i) => ({ id: `swimmer-${i}-${name}`, name }));
    }
    
    return [
      { id: 'team-a', name: activeMatch.team_a },
      { id: 'team-b', name: activeMatch.team_b }
    ];
  }, [activeMatch]);

  // Parse swimming times and master clock from team_b
  const swimState: SwimmingState = useMemo(() => {
    const defaultState: SwimmingState = { start_time: null, is_running: false, times: {} };
    if (!activeMatch) return defaultState;
    try {
      if (activeMatch.team_b.startsWith('{')) {
        return JSON.parse(activeMatch.team_b);
      }
    } catch (e) {
      // Fallback or legacy setup
    }
    return defaultState;
  }, [activeMatch]);

  // Live countdown state for stopwatch visualization
  const [liveElapsed, setLiveElapsed] = useState<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (swimState.is_running && swimState.start_time) {
      // Clear any existing timer
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        const diff = Date.now() - (swimState.start_time as number);
        setLiveElapsed(Math.max(0, diff / 1000));
      }, 43); // high update rate for tenths/hundredths ticking
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (swimState.start_time) {
        // Run once to show final or current stopped time before finish
        // Find maximum stopped time
        const timesArray = Object.values(swimState.times).filter(Boolean) as number[];
        if (timesArray.length > 0) {
          setLiveElapsed(Math.max(...timesArray));
        } else {
          setLiveElapsed(0);
        }
      } else {
        setLiveElapsed(0);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [swimState.is_running, swimState.start_time, swimState.times]);

  // Sound feedback option (optional bleeps)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const playBeep = (freq = 440, type: OscillatorType = 'sine', duration = 0.15) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      // benign
    }
  };

  const handleStartAll = async () => {
    if (!activeMatch) return;
    playBeep(880, 'triangle', 0.5);

    const now = Date.now();
    const cleanTimes: Record<string, number | null> = {};
    swimmers.forEach(s => {
      cleanTimes[s.id] = null;
    });

    const nextState: SwimmingState = {
      start_time: now,
      is_running: true,
      times: cleanTimes
    };

    // Update match info
    await updateMatchFields(activeMatch.id, {
      status: 'Live',
      team_b: JSON.stringify(nextState)
    });
  };

  const handleStopSwimmer = async (swimmerId: string) => {
    if (!activeMatch || !swimState.start_time || !swimState.is_running) return;
    playBeep(554, 'sine', 0.15);

    const currentTime = (Date.now() - swimState.start_time) / 1000;
    const nextTimes = {
      ...swimState.times,
      [swimmerId]: Number(currentTime.toFixed(2))
    };

    // Check if ALL registered swimmers have stopped
    const pendingSwimmers = swimmers.filter(s => nextTimes[s.id] === null || nextTimes[s.id] === undefined);
    const stillRunning = pendingSwimmers.length > 0;

    const nextState: SwimmingState = {
      ...swimState,
      is_running: stillRunning,
      times: nextTimes
    };

    await updateMatchFields(activeMatch.id, {
      team_b: JSON.stringify(nextState)
    });
  };

  const handleResetSwimmer = async (swimmerId: string) => {
    if (!activeMatch) return;
    playBeep(330, 'sine', 0.1);

    const nextTimes = { ...swimState.times };
    delete nextTimes[swimmerId];
    nextTimes[swimmerId] = null;

    const nextState: SwimmingState = {
      ...swimState,
      is_running: true, // resume running heat if it was stopped
      times: nextTimes
    };

    await updateMatchFields(activeMatch.id, {
      team_b: JSON.stringify(nextState)
    });
  };

  const handleCompleteMatch = async () => {
    if (!activeMatch) return;
    playBeep(1200, 'square', 0.4);

    const nextState: SwimmingState = {
      ...swimState,
      is_running: false
    };

    // Sort swimmers by best time to determine score_a and score_b representing ranks or counts
    await updateMatchFields(activeMatch.id, {
      status: 'Finished',
      team_b: JSON.stringify(nextState)
    });
  };

  const handleResetHeat = async () => {
    if (!activeMatch) return;
    if (!window.confirm('តើអ្នកចង់កំណត់ម៉ោងកីឡាករទាំងអស់ឡើងវិញមែនទេ? Confirm Reset Heat?')) return;
    
    playBeep(220, 'sawtooth', 0.3);
    const defaultState: SwimmingState = {
      start_time: null,
      is_running: false,
      times: {}
    };

    await updateMatchFields(activeMatch.id, {
      status: 'Upcoming',
      team_b: JSON.stringify(defaultState)
    });
  };

  // Find photo URL for a swimmer name or ID
  const getSwimmerPhoto = (swimmerName: string) => {
    const p = participants.find(part => part.name.trim().toLowerCase() === swimmerName.trim().toLowerCase() && !part.is_team);
    return p?.photo_url || null;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans pb-16">
      
      {/* Dynamic Header Information Card */}
      <div className="bg-gradient-to-r from-teal-900 to-cyan-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border-b-4 border-cyan-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-cyan-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                <span>ឧបករណ៍វាស់ម៉ោងហែលទឹក (Stopwatch deck)</span>
              </span>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                  soundEnabled ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-transparent border-white/20 text-white/50'
                }`}
                title="Toggle Beep Sounds"
              >
                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <span>{soundEnabled ? 'ប៊ីប ON' : 'ប៊ីប OFF'}</span>
              </button>
            </div>
            <h2 className="text-xl sm:text-2xl font-black italic tracking-tight font-dhl-title uppercase text-cyan-100">
              ប្រព័ន្ធវាស់ស្ទង់ល្បឿនហែលទឹក (Swimming Live Timer Engine)
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              អត្តពលិករត់/ហែលមកដល់ទីអាចចុច **STOP** លើទូរស័ព្ទរបស់ខ្លួនភ្លាមៗ ឬអាជ្ញាកណ្តាលចុចជំនួសដើម្បីកត់ត្រាម៉ោងការប្រកួតយ៉ាងត្រឹមត្រូវ។ ម៉ោងនឹងរក្សាទុកក្នុងទិន្នន័យចំណាត់ថ្នាក់រួមសម្រាប់ Group Stage/Match Label ដូចគ្នា។
            </p>
          </div>

          {/* Quick Match Picker for different Heats */}
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 shrink-0 sm:max-w-xs w-full">
            <span className="text-[9px] font-black text-cyan-300 uppercase tracking-wider block mb-1">ជ្រើសរើសជុំប្រកួត (Select Active Heat):</span>
            {swimmingMatches.length === 0 ? (
              <p className="text-[11px] text-red-300 font-bold">គ្មានការប្រកួតហែលទឹកនៅក្នុងបញ្ជីទេ</p>
            ) : (
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 border-cyan-400/40 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-300"
              >
                {swimmingMatches.map(m => (
                  <option key={m.id} value={m.id}>
                    ({m.status}) {m.match_label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {activeMatch ? (
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-8">
          
          {/* Main Heat Stopwatch Console */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-md flex flex-col justify-between space-y-6 min-h-[380px]">
              
              {/* Heat Header */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] bg-cyan-50 text-cyan-700 font-black px-2.5 py-0.5 rounded-md border border-cyan-100 uppercase tracking-wider">
                    {activeMatch.match_label}
                  </span>
                  <h3 className="text-sm font-black text-slate-800 uppercase mt-1">
                    ដំណើរការវាស់ម៉ោងប្រឡាំង (Active Racers Stopwatch)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    activeMatch.status === 'Live' ? 'bg-red-500 animate-ping' : activeMatch.status === 'Finished' ? 'bg-slate-500' : 'bg-amber-400'
                  }`}></span>
                  <span className="text-[11px] font-black text-slate-500 uppercase">
                    {activeMatch.status}
                  </span>
                </div>
              </div>

              {/* Master Digital Clock Display */}
              <div className="py-8 text-center bg-slate-950 rounded-[32px] text-cyan-400 font-mono shadow-inner border-y-4 border-cyan-500 relative overflow-hidden flex flex-col justify-center items-center">
                <div className="absolute inset-0 bg-radial-gradient from-cyan-950/20 via-transparent to-transparent opacity-80"></div>
                <span className="text-[11px] font-black tracking-widest text-[#FFCC00] uppercase mb-1 relative z-10">
                  MASTER STOPWATCH TIMER
                </span>
                <span className="text-6xl sm:text-7xl font-black tracking-tight drop-shadow-md select-none relative z-10">
                  {liveElapsed.toFixed(2)}s
                </span>
                
                {swimState.is_running && (
                  <span className="text-[10px] text-cyan-300 font-extrabold italic animate-pulse tracking-wide mt-2">
                    ● TIMES RUNNING LIVE SECONDS
                  </span>
                )}
              </div>

              {/* Control Deck (Start All, Stop, Reset Heat) */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                {activeMatch.status === 'Upcoming' || (!swimState.start_time && !swimState.is_running) ? (
                  <button
                    onClick={handleStartAll}
                    disabled={swimmers.length === 0}
                    className="flex-1 py-4.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>ចាប់ផ្តើមទាំងអស់គ្នា (START ALL RACERS)</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCompleteMatch}
                      disabled={activeMatch.status === 'Finished'}
                      className="flex-1 py-4 bg-gray-950 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Flag className="w-4 h-4 text-cyan-400" />
                      <span>បញ្ជប់ការប្រកួតទាំងស្រុង (Lock & Finish Heat)</span>
                    </button>

                    <button
                      onClick={handleResetHeat}
                      className="px-5 py-4 bg-red-50 text-red-650 hover:bg-red-100/80 rounded-2xl text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>កំណត់ម៉ោងឡើងវិញ (Reset Heat)</span>
                    </button>
                  </>
                )}
              </div>

            </div>

            {/* Explainer FAQ for Swimmers */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 text-slate-700 space-y-3">
              <h4 className="font-extrabold text-xs uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-600" />
                <span>តើត្រូវវាស់ម៉ោងដោយរបៀបណា? (SOP Swimming instructions)</span>
              </h4>
              <ul className="list-disc pl-5 text-[11px] space-y-1.5 leading-relaxed font-semibold text-slate-600">
                <li>គ្រូបង្គោល ឬអ្នកកាន់ម៉ោងចុចប៊ូតុង <strong className="text-emerald-600">START ALL</strong> ដើម្បីចាប់ផ្តើមម៉ោងរត់ព្រមគ្នា។</li>
                <li>នៅពេលអត្តពលិកហែលមកដល់ច្រាំងផ្សេងទៀត ពួកគេអាចចុច <strong className="text-red-500">STOP</strong> លើឧបករណ៍រៀងៗខ្លួនដើម្បីកត់ត្រាម៉ោងការប្រកួតរហ័ស។</li>
                <li>ប្រសិនបើចុចច្រឡំ ឬឆាប់ពេក អាដមីនអាចចុច <span className="text-cyan-600">Reset Swimmer ⟲</span> ដើម្បីអនុញ្ញាតឱ្យចុចម្តងទៀតបាន។</li>
                <li>បន្ទាប់ពីអ្នកហែលទឹកទាំងអស់បានមកដល់គោលដៅ សូមចុច <strong className="text-slate-800">Lock & Finish Heat</strong> ដើម្បីរក្សាទុកចំណាត់ថ្នាក់ជាស្ថាពរ។</li>
              </ul>
            </div>
          </div>

          {/* Swimmers Tactile Stop Buttons list */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 pl-1">
              <Users className="w-4.5 h-4.5 text-cyan-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                បញ្ជីអត្តពលិកក្នុងកំរាលស្ទង់ ({swimmers.length} Swimmers Slot)
              </h3>
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/50 space-y-3 max-h-[580px] overflow-y-auto">
              {swimmers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <User className="w-8 h-8 opacity-25 mx-auto mb-1" />
                  <p className="text-xs font-bold uppercase">គ្មានកីឡាករនៅក្នុងជុំនេះទេ</p>
                  <p className="text-[10px] text-slate-400 normal-case mt-0.5">Please setup players under Setup Game for Swimming category first.</p>
                </div>
              ) : (
                swimmers.map((sw, index) => {
                  const finalTime = swimState.times[sw.id];
                  const hasFinished = finalTime !== null && finalTime !== undefined;
                  const photo = getSwimmerPhoto(sw.name);

                  return (
                    <div 
                      key={sw.id} 
                      className={`p-4 rounded-2xl border transition duration-150 flex flex-col justify-between gap-3 ${
                        hasFinished
                          ? 'bg-emerald-50/75 border-emerald-200'
                          : swimState.is_running
                          ? 'bg-white border-cyan-200 shadow-sm shadow-cyan-100/50 hover:shadow-md'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* Circle Avatar */}
                          <div className="w-10 h-10 rounded-full border overflow-hidden shrink-0 bg-white flex items-center justify-center">
                            {photo ? (
                              <img 
                                src={photo} 
                                alt={sw.name} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="font-extrabold text-[#D40511] text-sm">
                                {sw.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">កន្លងហែលទឹកទី {index + 1} (Lane {index + 1})</span>
                            <h4 className="font-black text-slate-800 text-xs sm:text-[13px]">{sw.name}</h4>
                          </div>
                        </div>

                        {hasFinished && (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>{finalTime}s</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tactile stop button trigger */}
                      {swimState.is_running && !hasFinished && (
                        <button
                          type="button"
                          onClick={() => handleStopSwimmer(sw.id)}
                          className="w-full py-4.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl cursor-pointer shadow-md active:scale-95 shadow-red-200 hover:shadow-lg duration-100 flex items-center justify-center gap-1.5"
                        >
                          <CircleDot className="w-4 h-4 text-white animate-pulse" />
                          <span>ឈប់វាស់ម៉ោង (STOP TIMER FOR {sw.name})</span>
                        </button>
                      )}

                      {/* Reset button only for finished or corrected times */}
                      {hasFinished && activeMatch.status !== 'Finished' && (
                        <button
                          type="button"
                          onClick={() => handleResetSwimmer(sw.id)}
                          className="text-[9px] font-black uppercase tracking-wide text-slate-400 hover:text-red-500 self-end flex items-center gap-0.5 mt-1 hover:underline cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-400 hover:text-red-500" />
                          <span>វាស់ឡើងវិញ (RESET LANE TIME)</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
          <Activity className="w-14 h-14 text-cyan-400 mx-auto mb-4 animate-bounce" />
          <h4 className="font-bold text-slate-700 text-base mb-1">មិនទាន់មានការប្រកួតហែលទឹកដែលត្រូវវាស់ម៉ោងទេ</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            សូមចូលទៅកាន់បន្ទះ "Setup Game" ដើម្បីបង្កើតការប្រកួតហែលទឹកមួយ ជាមួយកីឡាករចុះឈ្មោះជាមុនសិន។
          </p>
        </div>
      )}

    </div>
  );
}

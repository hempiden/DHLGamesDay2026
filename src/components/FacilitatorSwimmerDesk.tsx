import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Match, SportType } from '../types';
import { Timer, CheckCircle, Flame, Smartphone, Activity, Wifi, ShieldAlert, ArrowLeft, XCircle } from 'lucide-react';
import { getSupabaseClient } from '../supabase';

interface FacilitatorSwimmerDeskProps {
  matchId: string;
  swinnerId: string; // The selected ID to stop
  swimmerName: string;
  isSupabaseEnabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  onUpdateMatchFields: (id: string, fields: Partial<Match>) => Promise<boolean>;
  onBackToMain: () => void;
}

export default function FacilitatorSwimmerDesk({
  matchId,
  swinnerId,
  swimmerName,
  isSupabaseEnabled,
  supabaseUrl,
  supabaseAnonKey,
  onUpdateMatchFields,
  onBackToMain
}: FacilitatorSwimmerDeskProps) {
  const [localMatch, setLocalMatch] = useState<Match | null>(null);
  const [liveElapsed, setLiveElapsed] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'polling' | 'offline'>('polling');
  
  // Timer for incrementing the running clock locally
  const timerRef = useRef<any>(null);

  // Poll match details in real-time from Supabase
  useEffect(() => {
    let active = true;
    const fetchLatest = async () => {
      try {
        if (!isSupabaseEnabled || !supabaseUrl || !supabaseAnonKey) {
          setSyncStatus('offline');
          // For local storage, try to reload from localStorage
          const savedStr = localStorage.getItem('dhl_games_day_matches');
          if (savedStr) {
            const matchesArr = JSON.parse(savedStr) as Match[];
            const found = matchesArr.find(m => m.id === matchId);
            if (found && active) {
              setLocalMatch(found);
            }
          }
          return;
        }

        const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
        if (!client) {
          setSyncStatus('offline');
          return;
        }

        const parsedId = isNaN(Number(matchId)) ? matchId : Number(matchId);
        const { data, error } = await client
          .from('matches')
          .select('*')
          .eq('id', parsedId)
          .single();

        if (error) {
          console.error('Error polling match on facilitator side:', error.message);
          setSyncStatus('offline');
        } else if (data && active) {
          const mapped: Match = {
            id: String(data.id),
            sport_name: data.sport_name as SportType,
            match_label: data.match_label || 'Heat Match',
            team_a: data.team_a,
            team_b: data.team_b,
            score_a: Number(data.score_a),
            score_b: Number(data.score_b),
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          setLocalMatch(mapped);
          setSyncStatus('connected');
        }
      } catch (err) {
        console.error('Poll match failed:', err);
        setSyncStatus('offline');
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 1500); // Fast 1.5s refresh for mobile updates
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [matchId, isSupabaseEnabled, supabaseUrl, supabaseAnonKey]);

  // Decode the stopwatch state from database
  const swimState = useMemo(() => {
    const defaultState = { start_time: null as number | null, is_running: false, times: {} as Record<string, number | null> };
    if (!localMatch) return defaultState;
    try {
      if (localMatch.team_b.startsWith('{')) {
        return JSON.parse(localMatch.team_b);
      }
    } catch (e) {}
    return defaultState;
  }, [localMatch]);

  // Ticking physical stopwatch handler
  useEffect(() => {
    if (swimState.is_running && swimState.start_time) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        const diff = Date.now() - (swimState.start_time as number);
        setLiveElapsed(Math.max(0, diff / 1000));
      }, 43); // fast 20fps redraw for millisecond thrill
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (swimState.start_time) {
        // Show stopped teammate time or max stopped time
        const specTime = swimState.times[swinnerId];
        if (specTime !== undefined && specTime !== null) {
          setLiveElapsed(specTime);
        } else {
          const timesArray = Object.values(swimState.times).filter(Boolean) as number[];
          setLiveElapsed(timesArray.length > 0 ? Math.max(...timesArray) : 0);
        }
      } else {
        setLiveElapsed(0);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [swimState.is_running, swimState.start_time, swimState.times, swinnerId]);

  // Handle Stop Action triggered from mobile device
  const handleStopClimbing = async () => {
    if (!localMatch || !swimState.start_time || !swimState.is_running || isUpdating) return;
    
    // Check if parent match is finalized
    if (localMatch.status === 'Finished') {
      alert('Heat has already been finalized and locked by Admin!');
      return;
    }

    setIsUpdating(true);

    const stopTime = Number(((Date.now() - swimState.start_time) / 1000).toFixed(2));
    const nextTimes = {
      ...swimState.times,
      [swinnerId]: stopTime
    };

    // Auto calculate if all have completed
    let matchSwimmers: { id: string; name: string }[] = [];
    try {
      if (localMatch.team_a.startsWith('[')) {
        matchSwimmers = JSON.parse(localMatch.team_a);
      } else if (localMatch.team_a) {
        const split = localMatch.team_a.split(',').map(s => s.trim()).filter(Boolean);
        matchSwimmers = split.map((name, i) => ({ id: `swimmer-${i}-${name}`, name }));
      }
    } catch (e) {
      if (localMatch.team_a) {
        const split = localMatch.team_a.split(',').map(s => s.trim()).filter(Boolean);
        matchSwimmers = split.map((name, i) => ({ id: `swimmer-${i}-${name}`, name }));
      }
    }
    const completedAll = matchSwimmers.length > 0 && matchSwimmers.every(s => nextTimes[s.id] !== null && nextTimes[s.id] !== undefined);

    const nextState = {
      ...swimState,
      is_running: completedAll ? false : swimState.is_running,
      times: nextTimes
    };

    const success = await onUpdateMatchFields(localMatch.id, {
      team_b: JSON.stringify(nextState)
    });

    if (success) {
      // update local match state immediately to reflect finished state instantly
      setLocalMatch(prev => prev ? {
        ...prev,
        team_b: JSON.stringify(nextState)
      } : null);
    }
    
    setIsUpdating(false);
  };

  // Determine Swimmer result state
  const myRecordedTime = swimState.times[swinnerId];
  const hasFinished = myRecordedTime !== null && myRecordedTime !== undefined;
  const isHeatClosed = localMatch?.status === 'Finished';

  // Format as mm:ss.SS
  const formatTimeMinutes = (totalSecs: number) => {
    const totalMs = totalSecs * 1000;
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor((totalMs % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-between p-6 select-none font-sans">
      
      {/* Header Info */}
      <div className="space-y-2 pb-4 border-b border-cyan-950">
        <div className="flex justify-between items-center">
          <button 
            onClick={onBackToMain}
            className="flex items-center gap-1.5 text-xs text-cyan-400 font-extrabold uppercase hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Spectator Board</span>
          </button>
          
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${
              syncStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}></span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {syncStatus === 'connected' ? 'Real-time Linked' : 'Reconnecting...'}
            </span>
          </div>
        </div>

        <div className="pt-2 text-center sm:text-left">
          <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-900 text-[9px] font-black tracking-widest uppercase rounded">
            🏊‍♂️ LANEMASTER MOBILE DISPATCH
          </span>
          <h2 className="text-sm font-black text-gray-300 uppercase mt-1">
            {localMatch?.match_label || 'Swimming Heat Match'}
          </h2>
        </div>
      </div>

      {/* Main Stopwatch Face */}
      <div className="text-center py-8 space-y-6 flex-grow flex flex-col justify-center items-center">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/10 rounded-full scale-125 blur-xl animate-pulse"></div>
          <div className="relative w-48 h-48 rounded-full border-4 border-cyan-500/30 flex flex-col items-center justify-center p-4 bg-slate-950/80 shadow-2xl">
            <Timer className={`w-8 h-8 ${swimState.is_running ? 'text-cyan-400 animate-spin' : 'text-slate-500'} mb-2`} />
            <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
              {hasFinished ? 'LOCKED LAP TIME' : swimState.is_running ? 'ELAPSED TIMER' : 'READY TO START'}
            </span>
            <span className="font-mono text-2xl font-black text-cyan-400 mt-1 select-all">
              {formatTimeMinutes(liveElapsed)}
            </span>
          </div>
        </div>

        {/* Competitor Banner */}
        <div className="space-y-1.5 max-w-sm">
          <p className="text-[10px] font-bold text-cyan-300 tracking-wider uppercase">កីឡាករហែលទឹក (ACTIVE SWIM PARTICIPANT)</p>
          <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">
            {swimmerName}
          </h1>
          <p className="text-[11px] text-gray-400">
            Lane Coach / Timekeeper role assigned. Log times by clicking bottom button instantly at the wall touches!
          </p>
        </div>
      </div>

      {/* Action Deck / Big Stop Button */}
      <div className="pb-8 pt-4">
        {isHeatClosed ? (
          <div className="bg-red-500/10 border-2 border-red-500/30 p-5 rounded-2xl text-center space-y-2">
            <XCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="font-extrabold uppercase text-xs text-red-100">
              ការប្រកួតត្រូវបានបិទបញ្ចប់រួចហើយ (Heat Closed)
            </h4>
            <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
              {hasFinished 
                ? `ម៉ោងផ្លូវការរបស់អ្នកគឺ៖ ${formatTimeMinutes(myRecordedTime!)} (Official Time)` 
                : 'អ្នកមិនបានបញ្ចប់ការវាស់ម៉ោងទាន់ពេលរឺត្រូវបានចាត់ទុកជា Disqualify (DQ)!'
              }
            </p>
          </div>
        ) : hasFinished ? (
          <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-5 rounded-2xl text-center space-y-2.5 animate-pulse">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase text-emerald-300 tracking-widest block">ម៉ោងកត់ត្រាបានជោគជ័យ (SAVED)</span>
              <p className="font-mono font-black text-xl text-emerald-200">
                {formatTimeMinutes(myRecordedTime!)}
              </p>
            </div>
            <p className="text-[9px] text-gray-400">
              Wait for other lanes to touch the wall to conclude the global standings!
            </p>
          </div>
        ) : swimState.is_running ? (
          <button
            onClick={handleStopClimbing}
            disabled={isUpdating}
            className="w-full h-28 bg-gradient-to-br from-red-500 to-rose-600 active:scale-95 duration-75 rounded-2xl font-black text-base uppercase tracking-widest text-white shadow-xl hover:shadow-2xl border-b-8 border-red-700 flex flex-col items-center justify-center gap-1 cursor-pointer select-none"
          >
            <Flame className="w-7 h-7 text-white fill-white animate-bounce" />
            <span>ប៉ះបាតអាង (TOUCHED - ALL STOP!)</span>
          </button>
        ) : (
          <div className="bg-cyan-950/20 border border-cyan-800/40 px-5 py-4.5 rounded-2xl text-center text-xs space-y-1">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse mx-auto" />
            <h4 className="font-bold text-cyan-100 uppercase tracking-wide">កំពុងរងចាំការបញ្ជាចេញដំណើរ (Awaiting Start...)</h4>
            <p className="text-[10px] text-slate-400">
              The master stopwatch hasn't started yet. When the Head Coach taps "START ALL", your phone timer will automatically align and run!
            </p>
          </div>
        )}
      </div>

      {/* Aesthetic Footer */}
      <div className="text-center pt-2 border-t border-cyan-950 text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
        <span>EXCELLENCE. SIMPLY DELIVERED • DHL GAMES</span>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LeaderboardView from './components/LeaderboardView';
import ScoringPanel from './components/ScoringPanel';
import AdminPanel from './components/AdminPanel';
import { Match, SportType } from './types';
import { INITIAL_MATCHES } from './data';
import { getSupabaseClient, testSupabaseConnection } from './supabase';
import { Laptop, Wifi, WifiOff, RefreshCw, Layers, ShieldAlert, Heart, Calendar } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'scoring' | 'admin'>('leaderboard');
  const [matches, setMatches] = useState<Match[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true);

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    localStorage.getItem('dhl_supabase_url') || 'https://yaabfbyzvcqmnlzlribl.supabase.co'
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(
    localStorage.getItem('dhl_supabase_anon_key') || 'sb_publishable_UG2etT68udwph9BSHi_ciw_ydzIUjLR'
  );
  const [isSupabaseEnabled, setIsSupabaseEnabled] = useState<boolean>(
    localStorage.getItem('dhl_supabase_enabled') !== 'false'
  );
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // 1. Live Session Clock Timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Listen for network connection events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Initialize and Seed data locally
  useEffect(() => {
    const localData = localStorage.getItem('dhl_games_day_matches');
    if (localData) {
      try {
        setMatches(JSON.parse(localData));
      } catch (err) {
        console.error('Error parsing local matches:', err);
        setMatches(INITIAL_MATCHES);
      }
    } else {
      setMatches(INITIAL_MATCHES);
      localStorage.setItem('dhl_games_day_matches', JSON.stringify(INITIAL_MATCHES));
    }
  }, []);

  // 3. Sync from / to Supabase if enabled
  useEffect(() => {
    async function syncAndFetch() {
      if (!isSupabaseEnabled || !isOnline) {
        setSupabaseConnected(false);
        return;
      }

      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (!client) {
        setSupabaseConnected(false);
        return;
      }

      // Test Connection live
      const tested = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      setSupabaseConnected(tested);

      if (tested) {
        setIsSyncing(true);
        try {
          // Fetch remote matches
          const { data, error } = await client
            .from('matches')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Supabase fetch error:', error.message);
          } else if (data && data.length > 0) {
            // Map table records back to our Match TS interface safely
            const mappedMatches: Match[] = data.map((item: any) => ({
              id: String(item.id),
              sport_name: item.sport_name as SportType,
              match_label: item.match_label || 'Regular Match',
              team_a: item.team_a,
              team_b: item.team_b,
              score_a: Number(item.score_a),
              score_b: Number(item.score_b),
              status: item.status as 'Upcoming' | 'Live' | 'Finished',
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
            }));
            
            setMatches(mappedMatches);
            localStorage.setItem('dhl_games_day_matches', JSON.stringify(mappedMatches));
          }
        } catch (err) {
          console.error('Database Sync Issue:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    }

    syncAndFetch();
  }, [isSupabaseEnabled, supabaseUrl, supabaseAnonKey, isOnline]);

  // Save matches change locally
  const saveLocalMatches = (updated: Match[]) => {
    setMatches(updated);
    localStorage.setItem('dhl_games_day_matches', JSON.stringify(updated));
  };

  // Helper component action: Modify Match Score
  const updateMatchScore = async (id: string, scoreA: number, scoreB: number): Promise<boolean> => {
    const updated = matches.map((m) => {
      if (m.id === id) {
        return { ...m, score_a: scoreA, score_b: scoreB, updated_at: new Date().toISOString() };
      }
      return m;
    });

    saveLocalMatches(updated);

    // Push to Supabase optionally
    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          // Match might be identified by an integer or a UUID in Supabase depending on DB table schemas
          // First attempt to convert id to double check compatibility
          const parsedId = isNaN(Number(id)) ? id : Number(id);
          const { error } = await client
            .from('matches')
            .update({ score_a: scoreA, score_b: scoreB, updated_at: new Date().toISOString() })
            .eq('id', parsedId);

          if (error) {
            console.error('Error syncing updated score:', error.message);
            return false;
          }
        } catch (err) {
          console.error('Network push score failed:', err);
          return false;
        }
      }
    }
    return true;
  };

  // Helper component action: Finish Match Status
  const finishMatch = async (id: string): Promise<boolean> => {
    const updated = matches.map((m) => {
      if (m.id === id) {
        return { ...m, status: 'Finished' as const, updated_at: new Date().toISOString() };
      }
      return m;
    });

    saveLocalMatches(updated);

    // Push to Supabase optionally
    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          const parsedId = isNaN(Number(id)) ? id : Number(id);
          const { error } = await client
            .from('matches')
            .update({ status: 'Finished', updated_at: new Date().toISOString() })
            .eq('id', parsedId);

          if (error) {
            console.error('Error syncing finished status:', error.message);
            return false;
          }
        } catch (err) {
          console.error('Network push finish failed:', err);
          return false;
        }
      }
    }
    return true;
  };

  // Helper component action: Create Match
  const addMatch = async (items: Omit<Match, 'id' | 'created_at' | 'updated_at'>) => {
    const newId = `match-${Date.now()}`;
    const newMatch: Match = {
      ...items,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newMatch, ...matches];
    saveLocalMatches(updated);

    // Push to Supabase optionally
    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          // Send to database
          const { error } = await client.from('matches').insert({
            sport_name: items.sport_name,
            match_label: items.match_label,
            team_a: items.team_a,
            team_b: items.team_b,
            score_a: items.score_a,
            score_b: items.score_b,
            status: items.status,
          });
          if (error) console.error('Error inserting match:', error.message);
        } catch (err) {
          console.error('Network push insert failed:', err);
        }
      }
    }
  };

  // Helper component action: Update general match status
  const updateMatchStatus = async (id: string, status: 'Upcoming' | 'Live' | 'Finished') => {
    const updated = matches.map((m) => {
      if (m.id === id) {
        return { ...m, status, updated_at: new Date().toISOString() };
      }
      return m;
    });

    saveLocalMatches(updated);

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          const parsedId = isNaN(Number(id)) ? id : Number(id);
          const { error } = await client
            .from('matches')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', parsedId);
          if (error) console.error('Status sync error:', error.message);
        } catch (err) {
          console.error('Status sync network error:', err);
        }
      }
    }
  };

  // Helper component action: Delete Match
  const deleteMatch = async (id: string) => {
    const updated = matches.filter((m) => m.id !== id);
    saveLocalMatches(updated);

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          const parsedId = isNaN(Number(id)) ? id : Number(id);
          const { error } = await client.from('matches').delete().eq('id', parsedId);
          if (error) console.error('Delete sync error:', error.message);
        } catch (err) {
          console.error('Delete sync network error:', err);
        }
      }
    }
  };

  // Helper component action: Reset to Seed default
  const resetToDefault = () => {
    setMatches(INITIAL_MATCHES);
    localStorage.setItem('dhl_games_day_matches', JSON.stringify(INITIAL_MATCHES));
    
    // Clear custom DB sync matches if needed, or simply let localStorage overwrite
    alert('ទិន្នន័យគំរូដើមត្រូវបានដាក់ដំណើរការវិញជោគជ័យ! All match entries reset to defaults.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 select-none">
      
      {/* DHL Branded Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        supabaseConnected={supabaseConnected}
      />

      {/* Synchronizing indicator banner */}
      {isSyncing && (
        <div className="w-full bg-indigo-600 text-white text-[10px] py-1 px-4 text-center font-bold tracking-wider animate-pulse uppercase flex items-center justify-center gap-1.5 shrink-0 select-none">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>កំពុងទាញយកទិន្នន័យពី Supabase Database... (Fetching Remote Sync...)</span>
        </div>
      )}

      {/* Main Container of App Pages */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: PRESENTATION VIEW / LIVE LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView matches={matches} />
        )}

        {/* TAB 2: ACTIVE SCORING DASHBOARD FOR FIELD SUB-ADMINS */}
        {activeTab === 'scoring' && (
          <ScoringPanel
            matches={matches}
            updateMatchScore={updateMatchScore}
            finishMatch={finishMatch}
            deleteMatch={deleteMatch}
          />
        )}

        {/* TAB 3: ADMIN SETUP AND CONTROL CONSOLE */}
        {activeTab === 'admin' && (
          <AdminPanel
            matches={matches}
            addMatch={addMatch}
            updateMatchStatus={updateMatchStatus}
            deleteMatch={deleteMatch}
            resetToDefault={resetToDefault}
            supabaseUrl={supabaseUrl}
            setSupabaseUrl={setSupabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
            setSupabaseAnonKey={setSupabaseAnonKey}
            isSupabaseEnabled={isSupabaseEnabled}
            setIsSupabaseEnabled={setIsSupabaseEnabled}
          />
        )}

      </main>

      {/* Brand Footer Info mimicking score.html footer exactly with dynamic clock */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-6 sm:px-8 py-3 flex flex-col sm:flex-row justify-between items-center z-40 gap-2 shadow-inner select-none">
        <div className="flex gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase">Admin:</span>
            <span className="text-[10px] font-semibold text-gray-700">SOVANNA_D</span>
          </div>
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <span className="text-[10px] font-black text-gray-400 uppercase">Session:</span>
            <span className="text-[10px] font-bold text-[#D40511] font-mono tracking-tight">{currentTime || '12:00:00 PM'}</span>
          </div>
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <span className="text-[#FFCC00] font-extrabold pr-1">★</span>
          <span>Excellence. Simply delivered.</span>
          <span className="text-red-500 animate-pulse pl-0.5">❤️</span>
        </div>
      </footer>

    </div>
  );
}

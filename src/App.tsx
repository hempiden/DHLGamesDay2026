import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LeaderboardView from './components/LeaderboardView';
import ScoringPanel from './components/ScoringPanel';
import AdminPanel from './components/AdminPanel';
import TeamManagement from './components/TeamManagement';
import DatabaseSetup from './components/DatabaseSetup';
import LoginView from './components/LoginView';
import UsersApprovalPanel from './components/UsersApprovalPanel';
import PublicTeamsView from './components/PublicTeamsView';
import PublicAthletePhotoUpload from './components/PublicAthletePhotoUpload';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { Match, SportType, Participant, AppUser } from './types';
import { INITIAL_MATCHES, INITIAL_PARTICIPANTS } from './data';
import { getSupabaseClient, testSupabaseConnection } from './supabase';
import { Laptop, Wifi, WifiOff, RefreshCw, Layers, ShieldAlert, Heart, Calendar } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'public_teams' | 'dashboard' | 'scoring' | 'admin' | 'teams' | 'database' | 'users' | 'login'>('leaderboard');
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true);

  // External upload target
  const [uploadPhotoPlayerId, setUploadPhotoPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('upload_photo_for');
      if (pid) {
        setUploadPhotoPlayerId(pid);
      }
    }
  }, []);

  const handleClearUploadParam = () => {
    setUploadPhotoPlayerId(null);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('upload_photo_for');
      url.searchParams.delete('s_url');
      url.searchParams.delete('s_key');
      url.searchParams.delete('s_enabled');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  // App authentication states
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('dhl_games_day_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        return null;
      }
    }
    return null;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('dhl_games_day_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppUser[];
        // Always ensure the Super Admin preset is in the list
        const adminPresetIdx = parsed.findIndex((p) => p.username === 'hempiden');
        if (adminPresetIdx === -1) {
          parsed.unshift({
            id: 'super_admin_hempiden',
            username: 'hempiden',
            email: 'piden.hem@dhl.com',
            name: 'Piden Hem',
            role: 'super_admin',
            status: 'approved',
            passwordPlain: 'P1d#nXGamesDay',
            created_at: new Date().toISOString()
          });
          localStorage.setItem('dhl_games_day_users', JSON.stringify(parsed));
        }
        return parsed;
      } catch (err) {
        // Fallback to default list below
      }
    }
    const defaultList: AppUser[] = [
      {
        id: 'super_admin_hempiden',
        username: 'hempiden',
        email: 'piden.hem@dhl.com',
        name: 'Piden Hem',
        role: 'super_admin',
        status: 'approved',
        passwordPlain: 'P1d#nXGamesDay',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('dhl_games_day_users', JSON.stringify(defaultList));
    return defaultList;
  });

  // User Actions
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('dhl_games_day_current_user', JSON.stringify(user));
    setActiveTab('leaderboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dhl_games_day_current_user');
    setActiveTab('leaderboard');
  };

  const handleRegisterUser = (name: string, username: string, email: string, passwordPlain: string) => {
    const newUser: AppUser = {
      id: 'user_' + Date.now(),
      name,
      username,
      email,
      role: 'admin',
      status: 'pending',
      passwordPlain,
      created_at: new Date().toISOString()
    };
    const updated = [newUser, ...users];
    setUsers(updated);
    localStorage.setItem('dhl_games_day_users', JSON.stringify(updated));
    return { success: true };
  };

  const handleUpdateUserStatus = (userId: string, status: 'approved' | 'rejected' | 'pending') => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const updatedUser = { ...u, status };
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updatedUser);
          localStorage.setItem('dhl_games_day_current_user', JSON.stringify(updatedUser));
        }
        return updatedUser;
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('dhl_games_day_users', JSON.stringify(updated));
  };

  const handleUpdateUserRole = (userId: string, role: 'admin' | 'super_admin') => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const updatedUser = { ...u, role };
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updatedUser);
          localStorage.setItem('dhl_games_day_current_user', JSON.stringify(updatedUser));
        }
        return updatedUser;
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('dhl_games_day_users', JSON.stringify(updated));
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    localStorage.setItem('dhl_games_day_users', JSON.stringify(updated));
  };

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramUrl = params.get('s_url');
      if (paramUrl) {
        localStorage.setItem('dhl_supabase_url', paramUrl);
        return paramUrl;
      }
    }
    return localStorage.getItem('dhl_supabase_url') || 'https://yaabfbyzvcqmnlzlribl.supabase.co';
  });

  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramKey = params.get('s_key');
      if (paramKey) {
        localStorage.setItem('dhl_supabase_anon_key', paramKey);
        return paramKey;
      }
    }
    return localStorage.getItem('dhl_supabase_anon_key') || 'sb_publishable_UG2etT68udwph9BSHi_ciw_ydzIUjLR';
  });

  const [isSupabaseEnabled, setIsSupabaseEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramEnabled = params.get('s_enabled');
      if (paramEnabled) {
        localStorage.setItem('dhl_supabase_enabled', paramEnabled);
        return paramEnabled === 'true';
      }
    }
    return localStorage.getItem('dhl_supabase_enabled') !== 'false';
  });
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
    // 2a. Matches Seeding
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

    // 2b. Participants Seeding
    const localParticipants = localStorage.getItem('dhl_games_day_participants');
    if (localParticipants) {
      try {
        setParticipants(JSON.parse(localParticipants));
      } catch (err) {
        console.error('Error parsing local participants:', err);
        setParticipants(INITIAL_PARTICIPANTS);
      }
    } else {
      setParticipants(INITIAL_PARTICIPANTS);
      localStorage.setItem('dhl_games_day_participants', JSON.stringify(INITIAL_PARTICIPANTS));
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

          // Fetch remote participants table
          const pResult = await client
            .from('participants')
            .select('*')
            .order('name');
          
          if (pResult.error) {
            console.error('Supabase participants fetch error:', pResult.error.message);
          } else if (pResult.data && pResult.data.length > 0) {
            const mappedParticipants: Participant[] = pResult.data.map((item: any) => ({
              id: String(item.id),
              name: item.name,
              sport_type: item.sport_type as SportType,
              is_team: Boolean(item.is_team),
              team_id: item.team_id ? String(item.team_id) : null,
              photo_url: item.photo_url || null,
              created_at: item.created_at,
              updated_at: item.updated_at,
            }));
            setParticipants(mappedParticipants);
            localStorage.setItem('dhl_games_day_participants', JSON.stringify(mappedParticipants));
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

  // Participant specific helper functions and database sync actions
  const saveLocalParticipants = (updated: Participant[]) => {
    setParticipants(updated);
    localStorage.setItem('dhl_games_day_participants', JSON.stringify(updated));
  };

  const addParticipant = async (name: string, sport_type: SportType, is_team: boolean, team_id: string | null, photo_url?: string): Promise<boolean> => {
    const newId = `p-${Date.now()}`;
    const newPar: Participant = {
      id: newId,
      name,
      sport_type,
      is_team,
      team_id,
      photo_url: photo_url || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [...participants, newPar];
    saveLocalParticipants(updated);

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          const { data, error } = await client.from('participants').insert({
            name,
            sport_type,
            is_team,
            team_id: team_id && !isNaN(Number(team_id)) ? Number(team_id) : null,
            photo_url: photo_url || null,
          }).select('id');
          
          if (error) {
            console.error('Supabase insert participant failed:', error.message);
            return false;
          }
          if (data && data[0]) {
            const updatedWithDbId = updated.map(p => p.id === newId ? { ...p, id: String(data[0].id) } : p);
            saveLocalParticipants(updatedWithDbId);
          }
        } catch (err) {
          console.error('Remote insert participant failed:', err);
          return false;
        }
      }
    }
    return true;
  };

  const updateParticipantName = async (id: string, name: string): Promise<boolean> => {
    const updated = participants.map((p) => {
      if (p.id === id) {
        return { ...p, name, updated_at: new Date().toISOString() };
      }
      return p;
    });
    saveLocalParticipants(updated);

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          const parsedId = isNaN(Number(id)) ? id : Number(id);
          const { error } = await client
            .from('participants')
            .update({ name, updated_at: new Date().toISOString() })
            .eq('id', parsedId);

          if (error) {
            console.error('Supabase update name error:', error.message);
            return false;
          }
        } catch (err) {
          console.error('Remote name update failed:', err);
          return false;
        }
      }
    }
    return true;
  };

  const updateParticipantPhoto = async (id: string, photoUrl: string | null): Promise<boolean> => {
    const updated = participants.map((p) => {
      if (p.id === id) {
        return { ...p, photo_url: photoUrl || undefined, updated_at: new Date().toISOString() };
      }
      return p;
    });
    saveLocalParticipants(updated);

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          const parsedId = isNaN(Number(id)) ? id : Number(id);
          const { error } = await client
            .from('participants')
            .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
            .eq('id', parsedId);

          if (error) {
            console.error('Supabase update photo error:', error.message);
            return false;
          }
        } catch (err) {
          console.error('Remote photo update failed:', err);
          return false;
        }
      }
    }
    return true;
  };

  const assignPlayerToTeam = async (playerId: string, teamId: string | null): Promise<boolean> => {
    const updated = participants.map((p) => {
      if (p.id === playerId) {
        return { ...p, team_id: teamId, updated_at: new Date().toISOString() };
      }
      return p;
    });
    saveLocalParticipants(updated);

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          const parsedPlayerId = isNaN(Number(playerId)) ? playerId : Number(playerId);
          const parsedTeamId = teamId ? (isNaN(Number(teamId)) ? teamId : Number(teamId)) : null;

          const { error } = await client
            .from('participants')
            .update({ team_id: parsedTeamId, updated_at: new Date().toISOString() })
            .eq('id', parsedPlayerId);

          if (error) {
            console.error('Supabase assign roster error:', error.message);
            return false;
          }
        } catch (err) {
          console.error('Remote assign roster failed:', err);
          return false;
        }
      }
    }
    return true;
  };

  const deleteParticipant = async (id: string): Promise<boolean> => {
    const updated = participants.filter((p) => p.id !== id);
    saveLocalParticipants(updated);

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          const parsedId = isNaN(Number(id)) ? id : Number(id);
          const { error } = await client.from('participants').delete().eq('id', parsedId);
          if (error) {
            console.error('Supabase delete participant error:', error.message);
            return false;
          }
        } catch (err) {
          console.error('Remote delete participant failed:', err);
          return false;
        }
      }
    }
    return true;
  };

  const resetParticipantsToDefault = () => {
    setParticipants(INITIAL_PARTICIPANTS);
    localStorage.setItem('dhl_games_day_participants', JSON.stringify(INITIAL_PARTICIPANTS));
    alert('ទិន្នន័យដើមរបស់កីឡាករ និងក្រុមការងារត្រូវបានកំណត់ឡើងវិញជោគជ័យ!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 select-none">
      
      {/* DHL Branded Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        supabaseConnected={supabaseConnected}
        currentUser={currentUser}
        onLogout={handleLogout}
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
        
        {uploadPhotoPlayerId ? (
          <PublicAthletePhotoUpload
            playerId={uploadPhotoPlayerId}
            participants={participants}
            updateParticipantPhoto={updateParticipantPhoto}
            onBack={handleClearUploadParam}
          />
        ) : (
          <>
            {/* TAB 1: PRESENTATION VIEW / LIVE LEADERBOARD & SPECTATORS */}
            {activeTab === 'leaderboard' && (
              <LeaderboardView 
                matches={matches} 
                participants={participants} 
              />
            )}

            {/* NEW TAB: PUBLIC TEAMS & MEMBERS VIEW */}
            {activeTab === 'public_teams' && (
              <PublicTeamsView
                participants={participants}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                isSupabaseEnabled={isSupabaseEnabled}
              />
            )}

            {/* NEW TAB: DYNAMIC ANALYTICS DASHBOARD */}
            {activeTab === 'dashboard' && (
              <AnalyticsDashboard
                matches={matches}
                participants={participants}
                setActiveTab={setActiveTab}
              />
            )}

            {/* TAB 2: ACTIVE SCORING DASHBOARD FOR FIELD SUB-ADMINS */}
            {activeTab === 'scoring' && currentUser && (
              <ScoringPanel
                matches={matches}
                updateMatchScore={updateMatchScore}
                finishMatch={finishMatch}
                deleteMatch={deleteMatch}
              />
            )}

            {/* TAB 3: ADMIN SETUP AND CONTROL CONSOLE */}
            {activeTab === 'admin' && currentUser && (
              <AdminPanel
                matches={matches}
                participants={participants}
                addMatch={addMatch}
                updateMatchStatus={updateMatchStatus}
                deleteMatch={deleteMatch}
                resetToDefault={resetToDefault}
              />
            )}

            {/* TAB 4: TEAM MANAGEMENT AND ATHLETE ROSTER */}
            {activeTab === 'teams' && currentUser && (
              <TeamManagement
                participants={participants}
                isOnline={isOnline}
                supabaseConnected={supabaseConnected}
                addParticipant={addParticipant}
                updateParticipantName={updateParticipantName}
                updateParticipantPhoto={updateParticipantPhoto}
                assignPlayerToTeam={assignPlayerToTeam}
                deleteParticipant={deleteParticipant}
                resetParticipantsToDefault={resetParticipantsToDefault}
              />
            )}

            {/* TAB 5: DATABASE SYNCHRONIZATION SETUP */}
            {activeTab === 'database' && currentUser && (
              <DatabaseSetup
                supabaseUrl={supabaseUrl}
                setSupabaseUrl={setSupabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                setSupabaseAnonKey={setSupabaseAnonKey}
                isSupabaseEnabled={isSupabaseEnabled}
                setIsSupabaseEnabled={setIsSupabaseEnabled}
              />
            )}

            {/* TAB 6: AUTH LOGIN / REGISTRATION SCREEN */}
            {activeTab === 'login' && !currentUser && (
              <LoginView
                onLoginSuccess={handleLoginSuccess}
                users={users}
                onRegisterUser={handleRegisterUser}
              />
            )}

            {/* TAB 7: USERS & APPROVAL PANEL */}
            {activeTab === 'users' && currentUser && currentUser.role === 'super_admin' && (
              <UsersApprovalPanel
                users={users}
                onUpdateUserStatus={handleUpdateUserStatus}
                onUpdateUserRole={handleUpdateUserRole}
                onDeleteUser={handleDeleteUser}
                currentUser={currentUser}
              />
            )}
          </>
        )}

      </main>

      {/* Brand Footer Info mimicking score.html footer exactly with dynamic clock */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-6 sm:px-8 py-3 flex flex-col sm:flex-row justify-between items-center z-40 gap-2 shadow-inner select-none">
        <div className="flex gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase">Admin:</span>
            <span className="text-[10px] font-bold text-gray-700">{currentUser ? currentUser.name : 'GUEST / SPECTATOR'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <span className="text-[10px] font-black text-gray-400 uppercase">Session:</span>
            <span className="text-[10px] font-bold text-[#D40511] font-mono tracking-tight">{currentTime || '12:00:00 PM'}</span>
          </div>
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <span className="text-[#FFCC00] font-extrabold pr-1">★</span>
          <span>Excellence. Simply delivered.</span>
          <span className="text-red-500 animate-pulse pl-0.5 font-sans">❤️</span>
        </div>
      </footer>

    </div>
  );
}

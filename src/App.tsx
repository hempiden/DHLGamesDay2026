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
import SwimmingTimer from './components/SwimmingTimer';
import FacilitatorSwimmerDesk from './components/FacilitatorSwimmerDesk';
import EventSettings from './components/EventSettings';
import SelfRegistrationForm from './components/SelfRegistrationForm';
import { Match, SportType, Participant, AppUser, EventInfo, Sport, OrganizationInfo } from './types';
import { INITIAL_MATCHES, INITIAL_PARTICIPANTS } from './data';
import { getSupabaseClient, testSupabaseConnection } from './supabase';
import { Laptop, Wifi, WifiOff, RefreshCw, Layers, ShieldAlert, Heart, Calendar } from 'lucide-react';
import OrganizationSettings from './components/OrganizationSettings';

export default function App() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'public_teams' | 'dashboard' | 'scoring' | 'admin' | 'teams' | 'database' | 'users' | 'login' | 'settings' | 'enrolment' | 'organization'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const tab = p.get('tab');
      if (tab === 'public_teams') return 'public_teams';
      if (tab === 'leaderboard') return 'leaderboard';
      if (tab === 'dashboard') return 'dashboard';
      if (tab === 'scoring') return 'scoring';
      if (tab === 'admin') return 'admin';
      if (tab === 'teams') return 'teams';
      if (tab === 'database') return 'database';
      if (tab === 'users') return 'users';
      if (tab === 'login') return 'login';
      if (tab === 'settings') return 'settings';
      if (tab === 'enrolment') return 'enrolment';
      if (tab === 'organization') return 'organization';
    }
    return 'leaderboard';
  });
  
  const [events, setEvents] = useState<EventInfo[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dhl_events');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing stored events:', e);
        }
      }
    }
    return [
      {
        id: 'dhl-games-2026',
        name: 'DHL Games Day 2026',
        khmerName: 'ទិវាហ្គេម DHL ២០២៦',
        date: '2026-05-31',
        description: 'The official sports event of DHL Games Day 2026.',
        sports: [
          { name: 'Soccer', khmerName: 'បាល់ទាត់', icon: '⚽', scoringMethod: 'score' },
          { name: 'Volleyball', khmerName: 'បាល់ទះ', icon: '🏐', scoringMethod: 'score' },
          { name: 'Pingpong', khmerName: 'វាយកូនឃ្លីលើតុ', icon: '🏓', scoringMethod: 'score' },
          { name: 'Badminton', khmerName: 'វាយសី', icon: '🏸', scoringMethod: 'score' },
          { name: 'Swimming', khmerName: 'ហែលទឹក', icon: '🏊', scoringMethod: 'measure' },
        ],
        created_by: 'hempiden',
        show_public_teams: true,
        is_enrolment_enabled: true
      }
    ];
  });

  const [activeEventId, setActiveEventId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const urlId = p.get('event_id') || p.get('event');
      if (urlId) {
        localStorage.setItem('dhl_active_event_id', urlId);
        return urlId;
      }

      const pathnameParts = window.location.pathname.replace(/^\//, '').split('/');
      if (pathnameParts.length > 1) {
        const pathEventId = pathnameParts[1];
        if (pathEventId && pathEventId !== 'index.html' && pathEventId !== 'assets' && pathEventId !== 'api' && pathEventId !== 'favicon.ico' && pathEventId !== 'org') {
          localStorage.setItem('dhl_active_event_id', pathEventId);
          return pathEventId;
        }
      }

      const saved = localStorage.getItem('dhl_active_event_id');
      if (saved) return saved;
    }
    return 'dhl-games-2026';
  });

  // Derived properties from active event configuration
  const activeEvent = React.useMemo(() => {
    return events.find(e => e.id === activeEventId) || events[0];
  }, [events, activeEventId]);

  const showPublicTeamsInHeader = activeEvent?.show_public_teams ?? true;
  const isEnrolmentEnabled = activeEvent?.is_enrolment_enabled ?? true;

  const [organization, setOrganization] = useState<OrganizationInfo>(() => {
    let baseOrg: OrganizationInfo = {
      name: 'DHL Express Cambodia',
      logoUrl: 'https://logos-world.net/wp-content/uploads/2020/08/DHL-Logo.png',
      slug: 'dhl-games',
      tagline: 'Excellence. Simply delivered.',
      contactEmail: 'kh.info@dhl.com',
      contactPhone: '+855 23 999 444',
      website: 'https://www.dhl.com',
      address: 'Phnom Penh, Cambodia',
      footerMotto: 'Excellence. Simply delivered.',
    };

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dhl_organization_settings');
      if (saved) {
        try {
          baseOrg = { ...baseOrg, ...JSON.parse(saved) };
        } catch (err) {
          console.error('Failed to parse local organization settings:', err);
        }
      }

      // If there is a dynamic slug in the URL pathname, prioritize it
      const pathname = window.location.pathname.replace(/^\//, '').split('/')[0];
      if (pathname && pathname !== 'index.html' && pathname !== 'assets' && pathname !== 'api' && pathname !== 'favicon.ico' && pathname !== 'org') {
        baseOrg.slug = pathname;
        if (baseOrg.slug !== 'dhl-games' && (!saved || JSON.parse(saved).slug !== pathname)) {
          baseOrg.name = pathname.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }
    }
    return baseOrg;
  });

  const updateOrganization = async (updated: OrganizationInfo) => {
    setOrganization(updated);
    localStorage.setItem('dhl_organization_settings', JSON.stringify(updated));

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          await client
            .from('organization_settings')
            .upsert({
              id: 'current',
              name: updated.name,
              logo_url: updated.logoUrl,
              slug: updated.slug,
              tagline: updated.tagline,
              contact_email: updated.contactEmail,
              contact_phone: updated.contactPhone,
              website: updated.website,
              address: updated.address,
              footer_motto: updated.footerMotto,
              updated_at: new Date().toISOString()
            });
        } catch (err) {
          console.warn('Failed to sync organization settings inside Supabase:', err);
        }
      }
    }
  };

  const updateIsEnrolmentEnabled = async (val: boolean) => {
    const updatedEvents = events.map(e => {
      if (e.id === activeEventId) {
        return { ...e, is_enrolment_enabled: val };
      }
      return e;
    });
    setEvents(updatedEvents);

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          await client.from('events').update({ is_enrolment_enabled: val }).eq('id', activeEventId);
        } catch (err) {
          console.error('Failed to sync enrolment toggle to database:', err);
        }
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('dhl_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('dhl_active_event_id', activeEventId);
    
    const activeEvent = events.find(e => e.id === activeEventId) || events[0];
    const theme = activeEvent?.themeColor || 'dhl';
    const root = document.documentElement;
    if (theme === 'cosmic') {
      root.style.setProperty('--primary-brand', '#1E1B4B');
      root.style.setProperty('--accent-brand', '#06B6D4');
    } else if (theme === 'forest') {
      root.style.setProperty('--primary-brand', '#064E3B');
      root.style.setProperty('--accent-brand', '#10B981');
    } else {
      root.style.setProperty('--primary-brand', '#D40511');
      root.style.setProperty('--accent-brand', '#FFCC00');
    }
  }, [activeEventId, events]);

  // Dynamic URL rewrite to format the address bar matching /org-slug/active-event-id
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const pathnameParts = window.location.pathname.replace(/^\//, '').split('/');
      const firstPart = pathnameParts[0];
      const isSystemPath = !firstPart || firstPart === 'index.html' || firstPart === 'assets' || firstPart === 'api' || firstPart === 'favicon.ico' || firstPart === 'org';
      
      const currentSlug = organization.slug || 'dhl-games';
      
      if (!isSystemPath || firstPart === 'dhl-games') {
        const nextPathname = `/${currentSlug}/${activeEventId}`;
        if (window.location.pathname !== nextPathname) {
          window.history.replaceState({}, '', nextPathname + window.location.search + window.location.hash);
        }
      }
    }
  }, [activeEventId, organization.slug]);

  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Filter matches and participants to only the active event ID for isolation
  const filteredMatches = React.useMemo(() => {
    return matches.filter((m) => m.event_id === activeEventId || !m.event_id || m.event_id === 'dhl-games-2026');
  }, [matches, activeEventId]);

  const filteredParticipants = React.useMemo(() => {
    return participants.filter((p) => p.event_id === activeEventId || !p.event_id || p.event_id === 'dhl-games-2026');
  }, [participants, activeEventId]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true);

  // QR Mobile Facilitator controller state
  const [facilitatorParams, setFacilitatorParams] = useState<{ matchId: string; swimId: string; name: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const matchId = p.get('swim_match');
      const swimId = p.get('swim_id');
      const username = p.get('username') || '';
      if (matchId && swimId) {
        return { matchId, swimId, name: username };
      }
    }
    return null;
  });

  const handleClearFacilitatorParams = () => {
    setFacilitatorParams(null);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('swim_match');
      url.searchParams.delete('swim_id');
      url.searchParams.delete('username');
      window.history.replaceState({}, '', url.toString());
    }
  };

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

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        client.from('admin_users').insert({
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          password_plain: newUser.passwordPlain,
          created_at: newUser.created_at
        }).then(({ error }) => {
          if (error) {
            console.error('Failed to sync new user to Supabase:', error.message);
          }
        });
      }
    }
    return { success: true };
  };

  const handleUpdateUserStatus = async (userId: string, status: 'approved' | 'rejected' | 'pending') => {
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

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          await client.from('admin_users').update({ status }).eq('id', userId);
        } catch (err) {
          console.error('Failed to update user status in Supabase:', err);
        }
      }
    }
  };

  const handleUpdateUserRole = async (userId: string, role: 'admin' | 'super_admin') => {
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

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          await client.from('admin_users').update({ role }).eq('id', userId);
        } catch (err) {
          console.error('Failed to update user role in Supabase:', err);
        }
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    localStorage.setItem('dhl_games_day_users', JSON.stringify(updated));

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          await client.from('admin_users').delete().eq('id', userId);
        } catch (err) {
          console.error('Failed to delete user in Supabase:', err);
        }
      }
    }
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

  const filteredEventsByOrg = React.useMemo(() => {
    return events.filter(e => {
      const orgSlug = e.organization_slug || 'dhl-games';
      return orgSlug === organization.slug;
    });
  }, [events, organization.slug]);

  // Seeding default template sports event for selected organization if none exist
  useEffect(() => {
    const hasOrgEvents = events.some(e => (e.organization_slug || 'dhl-games') === organization.slug);
    if (!hasOrgEvents) {
      const defaultOrgEvent: EventInfo = {
        id: `event-${organization.slug}-${Date.now()}`,
        name: `${organization.name} Games Day`,
        khmerName: `ទិវាហ្គេម ${organization.name}`,
        date: new Date().toISOString().split('T')[0],
        description: `Official sports tournament events of ${organization.name}.`,
        sports: [
          { name: 'Soccer', khmerName: 'បាល់ទាត់', icon: '⚽', scoringMethod: 'score' },
          { name: 'Volleyball', khmerName: 'បាល់ទះ', icon: '🏐', scoringMethod: 'score' },
          { name: 'Pingpong', khmerName: 'វាយកូនឃ្លីលើតុ', icon: '🏓', scoringMethod: 'score' },
          { name: 'Badminton', khmerName: 'វាយសី', icon: '🏸', scoringMethod: 'score' },
          { name: 'Swimming', khmerName: 'ហែលទឹក', icon: '🏊', scoringMethod: 'measure' },
        ],
        created_by: currentUser?.username || 'hempiden',
        show_public_teams: true,
        is_enrolment_enabled: true,
        organization_slug: organization.slug
      };
      
      const newEvents = [...events, defaultOrgEvent];
      setEvents(newEvents);
      setActiveEventId(defaultOrgEvent.id);
      
      if (isSupabaseEnabled && supabaseConnected) {
        const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
        if (client) {
          const insertPromise = client.from('events').insert({
            id: defaultOrgEvent.id,
            name: defaultOrgEvent.name,
            khmer_name: defaultOrgEvent.khmerName,
            date: defaultOrgEvent.date,
            description: defaultOrgEvent.description,
            sports: defaultOrgEvent.sports,
            theme_color: 'dhl',
            created_by: defaultOrgEvent.created_by,
            show_public_teams: true,
            is_enrolment_enabled: true,
            organization_slug: organization.slug
          }) as any;
          
          insertPromise.then(({ error }: any) => {
            if (error) {
              const isFetchErr = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('typeerror') || error.message?.toLowerCase().includes('network');
              if (isFetchErr) {
                setSupabaseConnected(false);
                console.warn('Failed to sync auto-seeded org event offline:', error.message);
              } else {
                console.error('Failed to sync auto-seeded org event:', error.message);
              }
            }
          }).catch((err: any) => {
            setSupabaseConnected(false);
            console.warn('Failed to sync auto-seeded org event offline exception:', err);
          });
        }
      }
    }
  }, [organization.slug, events, currentUser, isSupabaseEnabled, supabaseConnected]);

  // Ensure active event is selected correctly from current organization's subset
  useEffect(() => {
    if (filteredEventsByOrg.length > 0) {
      const exists = filteredEventsByOrg.some(e => e.id === activeEventId);
      if (!exists) {
        setActiveEventId(filteredEventsByOrg[0].id);
      }
    }
  }, [filteredEventsByOrg, activeEventId]);

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
    let active = true;

    async function syncAndFetch(silent = false) {
      if (!isSupabaseEnabled || !isOnline) {
        setSupabaseConnected(false);
        return;
      }

      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (!client) {
        setSupabaseConnected(false);
        return;
      }

      // Test Connection live (skip testing continuously to save latency except once on init)
      let tested = true;
      if (!silent) {
        tested = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
        setSupabaseConnected(tested);
      }

      if (tested) {
        if (!silent) setIsSyncing(true);
        try {
          // Fetch remote organization settings table
          try {
            const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '').split('/')[0] : '';
            const hasCustomSlug = pathname && pathname !== 'index.html' && pathname !== 'assets' && pathname !== 'api' && pathname !== 'favicon.ico' && pathname !== 'org';
            
            let query = client.from('organization_settings').select('*');
            if (hasCustomSlug) {
              query = query.eq('slug', pathname);
            } else {
              query = query.eq('id', 'current');
            }
            const orgResult = await query.maybeSingle();

            if (orgResult && orgResult.data && active) {
              const d = orgResult.data;
              const remoteOrg: OrganizationInfo = {
                name: d.name || 'DHL Express Cambodia',
                logoUrl: d.logo_url || 'https://logos-world.net/wp-content/uploads/2020/08/DHL-Logo.png',
                slug: d.slug || 'dhl-games',
                tagline: d.tagline || 'Excellence. Simply delivered.',
                contactEmail: d.contact_email || 'kh.info@dhl.com',
                contactPhone: d.contact_phone || '+855 23 999 444',
                website: d.website || 'https://www.dhl.com',
                address: d.address || 'Phnom Penh, Cambodia',
                footerMotto: d.footer_motto || 'Excellence. Simply delivered.',
              };
              setOrganization(remoteOrg);
              localStorage.setItem('dhl_organization_settings', JSON.stringify(remoteOrg));
            }
          } catch (errOrg) {
            console.warn('Silent note: organization_settings table could not be fetched or does not exist yet.', errOrg);
          }

          // Fetch remote events table
          const eventsResult = await client
            .from('events')
            .select('*');

          if (eventsResult.error) {
            console.warn('Supabase events fetch notice (Table may not exist yet):', eventsResult.error.message);
          } else if (eventsResult.data && active) {
            if (eventsResult.data.length > 0) {
              const mappedEvents: EventInfo[] = eventsResult.data.map((item: any) => ({
                id: String(item.id),
                name: item.name,
                khmerName: item.khmer_name || item.khmerName || '',
                date: item.date || '',
                description: item.description || '',
                sports: typeof item.sports === 'string' ? JSON.parse(item.sports) : (item.sports || []),
                themeColor: (item.theme_color || item.themeColor || 'dhl') as any,
                created_by: item.created_by || 'hempiden',
                show_public_teams: item.show_public_teams ?? false,
                is_enrolment_enabled: item.is_enrolment_enabled ?? true,
                organization_slug: item.organization_slug || 'dhl-games'
              }));

              setEvents((prev) => {
                const combined = [...prev];
                mappedEvents.forEach((m) => {
                  const idx = combined.findIndex((c) => c.id === m.id);
                  if (idx === -1) {
                    combined.push(m);
                  } else {
                    if (JSON.stringify(combined[idx]) !== JSON.stringify(m)) {
                      combined[idx] = m;
                    }
                  }
                });
                if (JSON.stringify(prev) !== JSON.stringify(combined)) {
                  localStorage.setItem('dhl_events', JSON.stringify(combined));
                  return combined;
                }
                return prev;
              });
            } else if (eventsResult.data.length === 0 && events.length > 0) {
              // Auto-seed local events to remote Supabase DB
              const localClean = events.map((ev) => ({
                id: ev.id,
                name: ev.name,
                khmer_name: ev.khmerName,
                date: ev.date || null,
                description: ev.description || null,
                sports: ev.sports,
                theme_color: ev.themeColor || 'dhl',
                created_by: ev.created_by || 'hempiden',
                show_public_teams: ev.show_public_teams || false,
                is_enrolment_enabled: ev.is_enrolment_enabled || true,
                organization_slug: ev.organization_slug || organization.slug || 'dhl-games'
              }));
              const emptySyncPromise = client.from('events').insert(localClean) as any;
              
              emptySyncPromise.then(({ error }: any) => {
                if (error) {
                  const isFetchErr = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('typeerror') || error.message?.toLowerCase().includes('network');
                  if (isFetchErr) {
                    setSupabaseConnected(false);
                    console.warn('Failed to sync empty remote events offline:', error.message);
                  } else {
                    console.error('Failed to sync empty remote events:', error.message);
                  }
                }
              }).catch((err: any) => {
                setSupabaseConnected(false);
                console.warn('Failed to sync empty remote events offline exception:', err);
              });
            }
          }

          // Fetch isolated matches (isolate per admin or active event)
          let matchesData = null;
          let matchesError = null;

          if (currentUser) {
            const matchesRes = await client
              .from('matches')
              .select('*')
              .eq('created_by', currentUser.username)
              .order('created_at', { ascending: false });

            if (matchesRes.error && (matchesRes.error.message.includes('column') || matchesRes.error.message.includes('attribute'))) {
              const fallbackRes = await client.from('matches').select('*').order('created_at', { ascending: false });
              matchesData = fallbackRes.data;
              matchesError = fallbackRes.error;
            } else {
              matchesData = matchesRes.data;
              matchesError = matchesRes.error;
            }
          } else {
            const matchesRes = await client
              .from('matches')
              .select('*')
              .eq('event_id', activeEventId)
              .order('created_at', { ascending: false });

            if (matchesRes.error && (matchesRes.error.message.includes('column') || matchesRes.error.message.includes('attribute'))) {
              const fallbackRes = await client.from('matches').select('*').order('created_at', { ascending: false });
              matchesData = fallbackRes.data;
              matchesError = fallbackRes.error;
            } else {
              matchesData = matchesRes.data;
              matchesError = matchesRes.error;
            }
          }

          if (matchesError) {
            const isFetchErr = matchesError.message?.toLowerCase().includes('fetch') || matchesError.message?.toLowerCase().includes('typeerror') || matchesError.message?.toLowerCase().includes('network');
            if (isFetchErr) {
              setSupabaseConnected(false);
              console.warn('Supabase matches fetch offline:', matchesError.message);
            } else {
              console.error('Supabase fetch error:', matchesError.message);
            }
          } else if (matchesData && active) {
            const mappedMatches: Match[] = matchesData.map((item: any) => ({
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
              scheduled_date: item.scheduled_date || undefined,
              scheduled_time: item.scheduled_time || undefined,
              event_id: item.event_id || undefined,
              created_by: item.created_by || undefined
            }));
            
            setMatches((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(mappedMatches)) {
                localStorage.setItem('dhl_games_day_matches', JSON.stringify(mappedMatches));
                return mappedMatches;
              }
              return prev;
            });
          }

          // Fetch isolated participants table (isolate per admin or active event)
          let pData = null;
          let pError = null;

          if (currentUser) {
            const pRes = await client
              .from('participants')
              .select('*')
              .eq('created_by', currentUser.username)
              .order('name');

            if (pRes.error && (pRes.error.message.includes('column') || pRes.error.message.includes('attribute'))) {
              const fallbackRes = await client.from('participants').select('*').order('name');
              pData = fallbackRes.data;
              pError = fallbackRes.error;
            } else {
              pData = pRes.data;
              pError = pRes.error;
            }
          } else {
            const pRes = await client
              .from('participants')
              .select('*')
              .eq('event_id', activeEventId)
              .order('name');

            if (pRes.error && (pRes.error.message.includes('column') || pRes.error.message.includes('attribute'))) {
              const fallbackRes = await client.from('participants').select('*').order('name');
              pData = fallbackRes.data;
              pError = fallbackRes.error;
            } else {
              pData = pRes.data;
              pError = pRes.error;
            }
          }
          
          if (pError) {
            const isFetchErr = pError.message?.toLowerCase().includes('fetch') || pError.message?.toLowerCase().includes('typeerror') || pError.message?.toLowerCase().includes('network');
            if (isFetchErr) {
              setSupabaseConnected(false);
              console.warn('Supabase participants fetch offline:', pError.message);
            } else {
              console.error('Supabase participants fetch error:', pError.message);
            }
          } else if (pData && active) {
            const mappedParticipants: Participant[] = pData.map((item: any) => ({
              id: String(item.id),
              name: item.name,
              sport_type: item.sport_type as SportType,
              is_team: Boolean(item.is_team),
              team_id: item.team_id ? String(item.team_id) : null,
              photo_url: item.photo_url || null,
              created_at: item.created_at,
              updated_at: item.updated_at,
              event_id: item.event_id || undefined,
              created_by: item.created_by || undefined
            }));
            setParticipants((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(mappedParticipants)) {
                localStorage.setItem('dhl_games_day_participants', JSON.stringify(mappedParticipants));
                return mappedParticipants;
              }
              return prev;
            });
          }

          // Fetch remote admin_users table
          const usersResult = await client
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });

          if (usersResult.error) {
            console.warn('Supabase admin_users fetch notice (Table may not exist yet):', usersResult.error.message);
          } else if (usersResult.data && active) {
            const mappedUsers: AppUser[] = usersResult.data.map((item: any) => ({
              id: String(item.id),
              username: item.username,
              email: item.email,
              name: item.name,
              role: item.role as 'admin' | 'super_admin',
              status: item.status as 'pending' | 'approved' | 'rejected',
              passwordPlain: item.password_plain || item.passwordPlain || '',
              created_at: item.created_at
            }));

            const adminPresetIdx = mappedUsers.findIndex((p) => p.username === 'hempiden');
            if (adminPresetIdx === -1) {
              const hempidenPreset: AppUser = {
                id: 'super_admin_hempiden',
                username: 'hempiden',
                email: 'piden.hem@dhl.com',
                name: 'Piden Hem',
                role: 'super_admin',
                status: 'approved',
                passwordPlain: 'P1d#nXGamesDay',
                created_at: new Date().toISOString()
              };
              mappedUsers.unshift(hempidenPreset);
              client.from('admin_users').insert({
                id: hempidenPreset.id,
                username: hempidenPreset.username,
                email: hempidenPreset.email,
                name: hempidenPreset.name,
                role: hempidenPreset.role,
                status: hempidenPreset.status,
                password_plain: hempidenPreset.passwordPlain,
                created_at: hempidenPreset.created_at
              }).then(({ error }) => {
                if (error) console.log('Supabase user preset insertion note:', error.message);
              });
            }

            setUsers((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(mappedUsers)) {
                localStorage.setItem('dhl_games_day_users', JSON.stringify(mappedUsers));
                return mappedUsers;
              }
              return prev;
            });
          }


        } catch (err: any) {
          const isFetchErr = err?.message?.toLowerCase().includes('fetch') || err?.message?.toLowerCase().includes('typeerror') || err?.message?.toLowerCase().includes('network');
          if (isFetchErr) {
            setSupabaseConnected(false);
            console.warn('Database Sync Connection offline:', err.message);
          } else {
            console.error('Database Sync Issue:', err);
          }
        } finally {
          if (!silent && active) {
            setIsSyncing(false);
          }
        }
      }
    }

    syncAndFetch(false);

    const pollInterval = setInterval(() => {
      syncAndFetch(true);
    }, 2500);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [isSupabaseEnabled, supabaseUrl, supabaseAnonKey, isOnline, currentUser, activeEventId]);

  // Save matches change locally
  const saveLocalMatches = (updated: Match[]) => {
    setMatches(updated);
    localStorage.setItem('dhl_games_day_matches', JSON.stringify(updated));
  };

  const updateShowPublicTeamsInHeader = async (val: boolean) => {
    const updatedEvents = events.map(e => {
      if (e.id === activeEventId) {
        return { ...e, show_public_teams: val };
      }
      return e;
    });
    setEvents(updatedEvents);

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          await client
            .from('events')
            .update({ show_public_teams: val })
            .eq('id', activeEventId);
        } catch (err) {
          console.error('Failed to sync settings to Supabase settings:', err);
        }
      }
    }
  };

  // Helper component action: Modify Match Score
  const updateMatchScore = async (id: string, scoreA: number, scoreB: number): Promise<boolean> => {
    let latestMatches: Match[] = [];
    setMatches((prev) => {
      latestMatches = prev.map((m) => {
        if (m.id === id) {
          return { ...m, score_a: scoreA, score_b: scoreB, updated_at: new Date().toISOString() };
        }
        return m;
      });
      localStorage.setItem('dhl_games_day_matches', JSON.stringify(latestMatches));
      return latestMatches;
    });

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

  // Helper component action: Modify arbitrary Match Fields
  const updateMatchFields = async (id: string, fields: Partial<Match>): Promise<boolean> => {
    let latestMatches: Match[] = [];
    setMatches((prev) => {
      latestMatches = prev.map((m) => {
        if (m.id === id) {
          return { ...m, ...fields, updated_at: new Date().toISOString() };
        }
        return m;
      });
      localStorage.setItem('dhl_games_day_matches', JSON.stringify(latestMatches));
      return latestMatches;
    });

    if (isSupabaseEnabled && supabaseConnected) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        try {
          const parsedId = isNaN(Number(id)) ? id : Number(id);
          const { error } = await client
            .from('matches')
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq('id', parsedId);

          if (error) {
            console.error('Error syncing updated match fields:', error.message);
            return false;
          }
        } catch (err) {
          console.error('Network push match fields failed:', err);
          return false;
        }
      }
    }
    return true;
  };

  // Helper component action: Finish Match Status
  const finishMatch = async (id: string): Promise<boolean> => {
    let latestMatches: Match[] = [];
    setMatches((prev) => {
      latestMatches = prev.map((m) => {
        if (m.id === id) {
          return { ...m, status: 'Finished' as const, updated_at: new Date().toISOString() };
        }
        return m;
      });
      localStorage.setItem('dhl_games_day_matches', JSON.stringify(latestMatches));
      return latestMatches;
    });

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
            scheduled_date: items.scheduled_date || null,
            scheduled_time: items.scheduled_time || null,
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

  const addParticipant = async (name: string, sport_type: SportType, is_team: boolean, team_id: string | null, photo_url?: string): Promise<string | null> => {
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
            const isFetchErr = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('typeerror') || error.message?.toLowerCase().includes('network');
            if (isFetchErr) {
              setSupabaseConnected(false);
              console.warn('Supabase insert participant offline:', error.message);
            } else {
              console.error('Supabase insert participant failed:', error.message);
            }
            return null;
          }
          if (data && data[0]) {
            const finalId = String(data[0].id);
            const updatedWithDbId = updated.map(p => p.id === newId ? { ...p, id: finalId } : p);
            saveLocalParticipants(updatedWithDbId);
            return finalId;
          }
        } catch (err) {
          console.error('Remote insert participant failed:', err);
          return null;
        }
      }
    }
    return newPar.id;
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
            const isFetchErr = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('typeerror') || error.message?.toLowerCase().includes('network');
            if (isFetchErr) {
              setSupabaseConnected(false);
              console.warn('Supabase update name offline:', error.message);
            } else {
              console.error('Supabase update name error:', error.message);
            }
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
            const isFetchErr = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('typeerror') || error.message?.toLowerCase().includes('network');
            if (isFetchErr) {
              setSupabaseConnected(false);
              console.warn('Supabase update photo offline:', error.message);
            } else {
              console.error('Supabase update photo error:', error.message);
            }
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
            const isFetchErr = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('typeerror') || error.message?.toLowerCase().includes('network');
            if (isFetchErr) {
              setSupabaseConnected(false);
              console.warn('Supabase assign roster offline:', error.message);
            } else {
              console.error('Supabase assign roster error:', error.message);
            }
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
            const isFetchErr = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('typeerror') || error.message?.toLowerCase().includes('network');
            if (isFetchErr) {
              setSupabaseConnected(false);
              console.warn('Supabase delete participant offline:', error.message);
            } else {
              console.error('Supabase delete participant error:', error.message);
            }
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

  if (facilitatorParams) {
    return (
      <FacilitatorSwimmerDesk
        matchId={facilitatorParams.matchId}
        swinnerId={facilitatorParams.swimId}
        swimmerName={facilitatorParams.name || 'Swimmer'}
        isSupabaseEnabled={isSupabaseEnabled}
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
        onUpdateMatchFields={updateMatchFields}
        onBackToMain={handleClearFacilitatorParams}
      />
    );
  }

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
        showPublicTeamsInHeader={showPublicTeamsInHeader}
        isEnrolmentEnabled={isEnrolmentEnabled}
        events={filteredEventsByOrg}
        activeEventId={activeEventId}
        setActiveEventId={setActiveEventId}
        organization={organization}
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
            participants={filteredParticipants}
            updateParticipantPhoto={updateParticipantPhoto}
            onBack={handleClearUploadParam}
          />
        ) : (
          <>
            {/* TAB 1: PRESENTATION VIEW / LIVE LEADERBOARD & SPECTATORS */}
            {activeTab === 'leaderboard' && (
              <LeaderboardView 
                matches={filteredMatches} 
                participants={filteredParticipants} 
              />
            )}

            {/* NEW TAB: PUBLIC TEAMS & MEMBERS VIEW */}
            {activeTab === 'public_teams' && (
              <PublicTeamsView
                participants={filteredParticipants}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                isSupabaseEnabled={isSupabaseEnabled}
                matches={filteredMatches}
              />
            )}

            {/* NEW TAB: DYNAMIC ANALYTICS DASHBOARD */}
            {activeTab === 'dashboard' && (
              <AnalyticsDashboard
                matches={filteredMatches}
                participants={filteredParticipants}
                setActiveTab={setActiveTab}
              />
            )}

            {/* TAB 2: ACTIVE SCORING DASHBOARD FOR FIELD SUB-ADMINS */}
            {activeTab === 'scoring' && currentUser && (
              <ScoringPanel
                matches={filteredMatches}
                participants={filteredParticipants}
                updateMatchScore={updateMatchScore}
                updateMatchFields={updateMatchFields}
                finishMatch={finishMatch}
                deleteMatch={deleteMatch}
                currentUser={currentUser}
                isSupabaseEnabled={isSupabaseEnabled}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
              />
            )}

            {/* TAB 3: ADMIN SETUP AND CONTROL CONSOLE */}
            {activeTab === 'admin' && currentUser && (
              <AdminPanel
                matches={filteredMatches}
                participants={filteredParticipants}
                addMatch={addMatch}
                updateMatchStatus={updateMatchStatus}
                deleteMatch={deleteMatch}
                resetToDefault={resetToDefault}
              />
            )}

            {/* TAB 4: TEAM MANAGEMENT AND ATHLETE ROSTER */}
            {activeTab === 'teams' && currentUser && (
              <TeamManagement
                participants={filteredParticipants}
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

            {/* TAB 8: EVENT CUSTOM SETTINGS */}
            {activeTab === 'settings' && currentUser && (
              <EventSettings
                showPublicTeamsInHeader={showPublicTeamsInHeader}
                onUpdateShowPublicTeamsInHeader={updateShowPublicTeamsInHeader}
                isEnrolmentEnabled={isEnrolmentEnabled}
                setIsEnrolmentEnabled={updateIsEnrolmentEnabled}
                isSupabaseEnabled={isSupabaseEnabled}
                supabaseConnected={supabaseConnected}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                currentUser={currentUser}
                matches={filteredMatches}
                participants={filteredParticipants}
                addMatch={addMatch}
                updateMatchStatus={updateMatchStatus}
                deleteMatch={deleteMatch}
                resetToDefault={resetToDefault}
                isOnline={isOnline}
                addParticipant={addParticipant}
                updateParticipantName={updateParticipantName}
                updateParticipantPhoto={updateParticipantPhoto}
                assignPlayerToTeam={assignPlayerToTeam}
                deleteParticipant={deleteParticipant}
                resetParticipantsToDefault={resetParticipantsToDefault}
                events={filteredEventsByOrg}
                setEvents={setEvents}
                activeEventId={activeEventId}
                setActiveEventId={setActiveEventId}
                organizationSlug={organization?.slug}
              />
            )}

            {/* TAB FOR PUBLIC ATHLETE SELF-REGISTRATION PORTAL */}
            {activeTab === 'enrolment' && (
              <SelfRegistrationForm
                isEnrolmentEnabled={isEnrolmentEnabled}
                activeEventId={activeEventId}
                events={filteredEventsByOrg}
                participants={filteredParticipants}
                addParticipant={addParticipant}
              />
            )}

            {/* TAB 5: DATABASE SYNCHRONIZATION SETUP */}
            {activeTab === 'database' && currentUser && currentUser.role === 'super_admin' && (
              <DatabaseSetup
                supabaseUrl={supabaseUrl}
                setSupabaseUrl={setSupabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                setSupabaseAnonKey={setSupabaseAnonKey}
                isSupabaseEnabled={isSupabaseEnabled}
                setIsSupabaseEnabled={setIsSupabaseEnabled}
                users={users}
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

            {/* TAB 9: ORGANIZATION BRANDING & SETTINGS */}
            {activeTab === 'organization' && currentUser && currentUser.role === 'super_admin' && (
              <OrganizationSettings
                organization={organization}
                onUpdateOrganization={updateOrganization}
              />
            )}
          </>
        )}

      </main>

      {/* Brand Footer Info mimicking score.html footer exactly with dynamic clock */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-6 sm:px-8 py-3 flex flex-col sm:flex-row justify-between items-center z-45 gap-2 shadow-inner select-none">
        <div className="flex gap-6 items-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase">Admin:</span>
            <span className="text-[10px] font-bold text-gray-700">{currentUser ? `${currentUser.name} (${currentUser.role === 'super_admin' ? 'SuperAdmin' : 'Facilitator'})` : 'GUEST / SPECTATOR'}</span>
          </div>
          {currentUser && currentUser.role === 'super_admin' && (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <button
                type="button"
                onClick={() => setActiveTab('database')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer shrink-0 ${
                  activeTab === 'database'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                💾 Database Setup
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer shrink-0 ${
                  activeTab === 'users'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                🛡️ Admins & Approvals
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('organization')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer shrink-0 ${
                  activeTab === 'organization'
                    ? 'bg-amber-500 text-slate-900 shadow-xs ring-2 ring-amber-300'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                🏢 Org Settings
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <span className="text-[10px] font-black text-gray-400 uppercase">Session:</span>
            <span className="text-[10px] font-bold text-[#D40511] font-mono tracking-tight">{currentTime || '12:00:00 PM'}</span>
          </div>
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          {organization.logoUrl ? (
            <img 
              src={organization.logoUrl} 
              alt="Org" 
              className="h-3 max-w-full object-contain filter hover:brightness-95 hover:contrast-110 duration-200 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://logos-world.net/wp-content/uploads/2020/08/DHL-Logo.png';
              }} 
            />
          ) : (
            <span className="text-[#FFCC00] font-extrabold pr-1">★</span>
          )}
          <span>{organization.footerMotto || organization.tagline || 'Excellence. Simply delivered.'}</span>
          <span className="text-red-500 animate-pulse pl-0.5 font-sans">❤️</span>
        </div>
      </footer>

    </div>
  );
}

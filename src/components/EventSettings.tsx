import React, { useState, useEffect, useMemo } from 'react';
import { 
  ToggleLeft, ToggleRight, QrCode, Copy, Check, ExternalLink, Settings2, Sliders, 
  ShieldCheck, Trophy, Layers, Users, Calendar, Plus, Trash2, Edit, CheckCircle, 
  Clock, Award, HelpCircle, Activity, LayoutGrid, Settings, KeyRound, Play, ChevronRight, AlertTriangle, Languages, UserPlus
} from 'lucide-react';
import { Match, Participant, AppUser, EventInfo, Sport, SportType, DEFAULT_TRANSLATIONS } from '../types';
import { getSupabaseClient } from '../supabase';
import AdminPanel from './AdminPanel';
import TeamManagement from './TeamManagement';

const KEY_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
  menu_leaderboard: { label: 'ផ្ទាំងលទ្ធផល (Live Board Tab)', desc: 'The first main tab in the top header.' },
  menu_public_teams: { label: 'បញ្ជីឈ្មោះក្រុម (Public Teams Tab)', desc: 'The second main tab for listing public teams & rosters.' },
  menu_enrol: { label: 'ចុះឈ្មោះលេងកីឡា (Enrol Athlete Tab)', desc: 'Dynamic public self-registration action tab.' },
  menu_dashboard: { label: 'វិភាគទិន្នន័យ (Dashboard Tab)', desc: 'Analytics summary and sport charts tab.' },
  menu_scoring: { label: 'ផ្ទាំងបញ្ចូលពិន្ទុ (Scoring Panel Tab)', desc: 'Admin scoring interface tab.' },
  menu_settings: { label: 'ការកំណត់ព្រឹត្តិការណ៍ (Event Settings Tab)', desc: 'Admin event architecture setting tab.' },
  menu_admin_signin: { label: 'ចូលគ្រប់គ្រងប្រព័ន្ធ (Admin Sign-In Tab)', desc: 'Admin authentication button label.' },
  status_upcoming: { label: 'ស្លាក: មិនទាន់ប្រកួត (Upcoming Status Indicator)', desc: 'Label displayed when a match has not started yet.' },
  status_live: { label: 'ស្លាក: កំពុងប្រកួត (Live Status Indicator)', desc: 'Label displayed when a match is currently ongoing.' },
  status_finished: { label: 'ស្លាក: បញ្ចប់ការប្រកួត (Finished Status Indicator)', desc: 'Label displayed when a match is completed.' },
  select_sport: { label: 'សំណួរជ្រើសរើសកីឡា (Select Sport Instruction)', desc: 'Helper text instructing viewers to select a sport above scoreboard.' },
  scheduled_title: { label: 'ចំណងជើង: កាលវិភាគប្រកួត (Scheduled Matches Title)', desc: 'Header for the list of upcoming fixtures.' },
  athlete_name: { label: 'វាល: ឈ្មោះពេញកីឡាករ (Athlete Full Name Field)', desc: "Label for athlete name inputs in rosters and self-registration." },
  sport_type: { label: 'វាល: ប្រភេទកីឡា (Sport Category Field)', desc: 'Dropdown or input descriptor for choosing sports.' },

  // Live broadcast / spectator portal elements
  header_live_broadcasting: { label: 'ផ្សាយផ្ទាល់ពីទីលាន (Live Broadcasting Label)', desc: 'Indicates the page content is feeding live score information.' },
  header_spectator_deck: { label: 'ផ្ទាំងទស្សនាលទ្ធផល (Spectator Deck Label)', desc: 'Identifier for the spectator views.' },
  header_portal_khmer: { label: 'មហាជនមើលពិន្ទុផ្ទាល់ (Spectators Portal Title)', desc: 'Title displayed on the main spectators scoring landing page.' },
  header_portal_subtitle: { label: 'ពន្យល់ផ្ទាំងព័ត៌មាន (Spectators Subtitle Description)', desc: 'Detailed caption explaining live scoreboard functionalities.' },
  select_sport_filter: { label: 'ជ្រើសរើសប្រភេទកីឡាដើម្បីមើល (Select Sport To Filter Label)', desc: 'Instruction label above the sport filters buttons.' },
  all_sports_filter: { label: 'វិញ្ញាសាទាំងអស់ (All Sports Button Option)', desc: 'Option button to display all matches regardless of sport type.' },

  // Public Teams section
  team_rosters_title: { label: 'បញ្ជីឈ្មោះក្រុម និងកីឡាករ (Team Rosters Header)', desc: 'Main title of the public teams tab list.' },
  spectator_mode_subtitle: { label: 'ស្វែងរក និងមើលព័ត៌មានក្រុម (Rosters Mode Caption)', desc: 'Explains spectator view reads rosters.' },
  total_athletes_badge: { label: 'ចំនួនកីឡាករចុះឈ្មោះសរុប (Total Registered Badge)', desc: 'Subtext for tracking total enrolled athletes count.' },
  active_competitors: { label: 'កីឡាករសកម្ម (Active Competitors Metric)', desc: 'Unit measurement text next to athlete counters.' },
  search_placeholder: { label: 'ស្វែងរកក្រុម ឬកីឡាករ... (Search Input Hint)', desc: 'Text inside the search input box before typing.' },
  no_teams_found: { label: 'រកមិនឃើញសោះ (No Teams/Athletes Found warning)', desc: 'Fallback message when filtering/searching yields zero matches.' },
  btn_upload_photo: { label: 'ប៊ូតុង: ផ្ទុកឡើងរូបថត (Upload photo action)', desc: 'Interactive link trigger to send photos.' },
  btn_share_qr: { label: 'ប៊ូតុង: ចែករំលែក QR (Share QR action)', desc: 'Triggers popups demonstrating live camera upload link.' },
  team_roster_members: { label: 'បញ្ជីឈ្មោះសមាជិក (Registered Team Members heading)', desc: 'Dividing title indicating the team member blocks.' },
  empty_roster_msg: { label: 'មិនទាន់មានឈ្មោះសមាជិក (Roster Empty Note)', desc: 'Placeholder displayed on team rosters containing zero athletes.' },
  scan_photo_upload: { label: 'ចំណងជើងស្កេន (Scan QR code wrapper text)', desc: 'QR Modal top heading instructions.' },
  scan_photo_inst: { label: 'ការណែនាំថតរូបជាមួយទូរស័ព្ទ (QR Upload guide detail)', desc: 'Detailed descriptions inside the qr scanner popup.' },

  // Enrolment registration form section
  enrol_title: { label: 'ចុះឈ្មោះកីឡាករ (Athlete Enrollment Heading)', desc: 'Heading for public athlete online enrolment portal.' },
  enrol_inst_title: { label: 'ណែនាំការចុះឈ្មោះ (Instructions Heading)', desc: 'Heading of the box guiding how athletes should sign up.' },
  enrol_inst_body: { label: 'ខ្លឹមសារណែនាំចុះឈ្មោះ (Instructions Body guide)', desc: 'Step-by-step guideline details in the box.' },
  your_fullname: { label: 'វាល: ឈ្មោះពេញរបស់អ្នក (Your Full Name input label)', desc: 'Required name indicator.' },
  fullname_placeholder: { label: 'គំរូឈ្មោះ (e.g. Sok Piseth placeholder)', desc: 'Sample name shown inside name field.' },
  select_sport_event: { label: 'វាល: ជ្រើសរើសប្រភេទកីឡា (Select Sport Event dropdown)', desc: 'Dropdown label for selecting sports.' },
  select_sport_event_placeholder: { label: 'ជ្រើសរើសវិញ្ញាសា (Select Sport initial selection)', desc: 'Prompt shown before choosing an event.' },
  choose_team: { label: 'វាល: ជ្រើសរើសក្រុមលេង (Choose Team dropdown label)', desc: 'Selecting optional team roster affiliations.' },
  choose_team_placeholder_no_sport: { label: 'ជ្រើសរើសកីឡាជាមុន (Select sport first instruction)', desc: 'Shown when choose team dropdown is locked.' },
  choose_team_free_agent: { label: 'មិនទាន់មានក្រុម (Free Agent / No Team description)', desc: 'Option representing zero team assignments.' },
  profile_photo_url: { label: 'វាល: តំណភ្ជាប់រូបថត (Profile Photo URL option label)', desc: 'Input box for hosting raw image URLs.' },
  profile_photo_desc: { label: 'ការណែនាំ URLs (Profile photo guidance detail)', desc: 'Tells athletes which sites are suitable for links.' },
  btn_submit_registration: { label: 'ប៊ូតុង: បញ្ជូនព័ត៌មាន (Complete Registration Button)', desc: 'Submit form action button.' },
  submitting_registration: { label: 'កំពុងបញ្ចូលទិន្នន័យ (Registration progress indicator)', desc: 'Spinner text shown during synchronization.' },
  registration_success_title: { label: 'ជោគជ័យ: ចុះឈ្មោះបានជោគជ័យ (Registration complete alert)', desc: 'Bold alert heading upon completion.' },
  registration_success_desc: { label: 'លទ្ធផលចុះឈ្មោះខ្លី (Registration complete caption)', desc: 'Slightly smaller result caption.' },
  registration_success_body: { label: 'អបអរសាទរជោគជ័យ (Congratulations registration text)', desc: 'Friendly Khmer and English success notification.' },
  btn_register_another: { label: 'ប៊ូតុង: ចុះឈ្មោះសមាជិកម្នាក់ទៀត (Register another action)', desc: 'Standard trigger resetting registration views.' },
  self_enrol_closed: { label: 'ការចុះឈ្មោះត្រូវបានបិទ (Self-enrolment closed flag)', desc: 'Crucial warning when registry is toggled off.' },
  sport_category: { label: 'ស្លាក៖ វិញ្ញាសាកីឡា (Sport Category label details)', desc: 'Detailed meta labels inside completion cards.' },
  team_assigned: { label: 'ស្លាក៖ ក្រុមលេង (Assigned Team label details)', desc: 'Affiliated team meta name upon signups.' },

  // Match result section
  congrats_victory: { label: 'អបអរសាទរម្ចាស់ជ័យជំនះ (Match Winner Banner)', desc: 'Congratulations message displayed above match win details.' },
  winner_badge: { label: 'ស្លាក: ជ័យជម្នះ (Winner Ribbon text)', desc: 'Text above the winning team roster.' },
  declared_winner_msg: { label: 'ប្រកាសជ័យលាភី (Declared Winner Message text)', desc: 'Success description after winning a match.' },
  live_matches_title: { label: 'ការប្រកួតកំពុងលេង (Live Matches Heading)', desc: 'Heading for active match lists.' },
  finished_matches_title: { label: 'ការប្រកួតដែលបានបញ្ចប់ (Finished Matches Heading)', desc: 'Heading for completed match lists.' },
  upcoming_matches_title: { label: 'ការប្រកួតនាពេលខាងមុខ (Upcoming Matches Heading)', desc: 'Heading for scheduled future fixtures.' },
  no_live_matches: { label: 'គ្មានការប្រកួតកំពុងលេង (No Live Matches Alert)', desc: 'Display when current live listings are empty.' },
  no_finished_matches: { label: 'គ្មានការប្រកួតដែលបានបញ្ចប់ (No Finished Matches Alert)', desc: 'Display when zero completed games exist.' },
  no_upcoming_matches: { label: 'គ្មានការប្រកួតគ្រោងទុក (No Upcoming Matches Alert)', desc: 'Display when matches have not been configured.' }
};

interface EventSettingsProps {
  // Original visibility settings props
  showPublicTeamsInHeader: boolean;
  onUpdateShowPublicTeamsInHeader: (val: boolean) => Promise<void>;
  isSupabaseEnabled: boolean;
  supabaseConnected: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;

  // Active user session
  currentUser: AppUser | null;

  // Embedded AdminPanel props
  matches: Match[];
  participants: Participant[];
  addMatch: (match: Omit<Match, 'id' | 'created_at' | 'updated_at'>) => void;
  updateMatchStatus: (id: string, status: 'Upcoming' | 'Live' | 'Finished') => void;
  deleteMatch: (id: string) => void;
  resetToDefault: () => void;

  // Embedded TeamManagement props
  isOnline: boolean;
  addParticipant: (name: string, sport_type: SportType, is_team: boolean, team_id: string | null, photo_url?: string, gender?: string) => Promise<any>;
  updateParticipantName: (id: string, name: string) => Promise<boolean>;
  updateParticipantPhoto: (id: string, photoUrl: string | null) => Promise<boolean>;
  assignPlayerToTeam: (playerId: string, teamId: string | null) => Promise<boolean>;
  deleteParticipant: (id: string) => Promise<boolean>;
  resetParticipantsToDefault: () => void;

  // Dynamic Event settings props
  events: EventInfo[];
  setEvents: (events: EventInfo[]) => void;
  activeEventId: string;
  setActiveEventId: (id: string) => void;
  isEnrolmentEnabled: boolean;
  setIsEnrolmentEnabled: (val: boolean) => void;
  organizationSlug?: string;
  translations?: Record<string, { kh: string; en: string }>;
  saveTranslations?: (newTrans: Record<string, { kh: string; en: string }>) => Promise<any>;
}

export default function EventSettings({
  showPublicTeamsInHeader,
  onUpdateShowPublicTeamsInHeader,
  isSupabaseEnabled,
  supabaseConnected,
  supabaseUrl,
  supabaseAnonKey,
  currentUser,
  matches,
  participants,
  addMatch,
  updateMatchStatus,
  deleteMatch,
  resetToDefault,
  isOnline,
  addParticipant,
  updateParticipantName,
  updateParticipantPhoto,
  assignPlayerToTeam,
  deleteParticipant,
  resetParticipantsToDefault,
  events,
  setEvents,
  activeEventId,
  setActiveEventId,
  isEnrolmentEnabled,
  setIsEnrolmentEnabled,
  organizationSlug,
  translations,
  saveTranslations = async () => {},
}: EventSettingsProps) {

  // Filter events dynamically to support administrative data isolation per creator session
  const filteredAdminEvents = useMemo(() => {
    return events;
  }, [events]);

  const syncEventsToSupabase = async (updatedEventsList: EventInfo[]) => {
    if (isSupabaseEnabled && supabaseConnected && supabaseUrl && supabaseAnonKey) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        const myAdminEvents = updatedEventsList.filter(e => {
          const orgSlug = e.organization_slug || 'dhl-games';
          return orgSlug === organizationSlug;
        });
        for (const ev of myAdminEvents) {
          const payload: any = {
            id: ev.id,
            name: ev.name,
            khmer_name: ev.khmerName,
            date: ev.date || null,
            description: ev.description || null,
            sports: ev.sports,
            theme_color: ev.themeColor || 'dhl',
            created_by: ev.created_by || currentUser?.username || 'hempiden',
            show_public_teams: ev.show_public_teams ?? false,
            is_enrolment_enabled: ev.is_enrolment_enabled ?? true,
            organization_slug: ev.organization_slug || null,
            enabled_languages: (ev.enabled_languages || ['kh', 'en']).join(',')
          };
          const { error } = await client.from('events').upsert(payload);
          if (error) {
            const isRLSErr = error.message?.toLowerCase().includes('row-level security') || 
                             error.message?.toLowerCase().includes('policy') || 
                             error.message?.toLowerCase().includes('permission') || 
                             error.message?.toLowerCase().includes('violates');
            if (error.message?.includes('enabled_languages')) {
              // Fallback for older database schemas that lack the enabled_languages column
              const { enabled_languages, ...fallbackPayload } = payload;
              const { error: secondErr } = await client.from('events').upsert(fallbackPayload);
              if (secondErr) {
                const isSecondRLSErr = secondErr.message?.toLowerCase().includes('row-level security') || 
                                       secondErr.message?.toLowerCase().includes('policy') || 
                                       secondErr.message?.toLowerCase().includes('permission') || 
                                       secondErr.message?.toLowerCase().includes('violates');
                if (isSecondRLSErr) {
                  console.warn('Failed to sync event upsert after retry (RLS/policy constraint):', secondErr.message);
                } else {
                  console.error('Failed to sync event upsert after retry:', secondErr.message);
                }
              } else {
                console.log('Successfully synced event upsert (fallback without enabled_languages column)');
              }
            } else if (isRLSErr) {
              console.warn('Failed to sync event upsert (RLS/policy constraint):', error.message);
            } else {
              console.error('Failed to sync event upsert:', error.message);
            }
          }
        }
      }
    }
  };

  const deleteEventFromSupabase = async (eventId: string) => {
    if (isSupabaseEnabled && supabaseConnected && supabaseUrl && supabaseAnonKey) {
      const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
      if (client) {
        const { error } = await client.from('events').delete().eq('id', eventId);
        if (error) console.error('Failed to remote delete event:', error.message);
      }
    }
  };
  // Sidebar states
  const [activeSubTab, setActiveSubTab] = useState<'events_sports' | 'design' | 'setup_matches' | 'teams_structure' | 'athletes_hub' | 'enrolment' | 'language'>('events_sports');

  // Event Creation Form States
  const [newEventName, setNewEventName] = useState('');
  const [newEventKhmerName, setNewEventKhmerName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [populateDefaultSports, setPopulateDefaultSports] = useState(true);

  // Custom Sport Form States
  const [selectedEventIdForSport, setSelectedEventIdForSport] = useState(activeEventId);
  const [newSportName, setNewSportName] = useState('');
  const [newSportKhmerName, setNewSportKhmerName] = useState('');
  const [newSportIcon, setNewSportIcon] = useState('⚽');
  const [newSportScoringMethod, setNewSportScoringMethod] = useState<'score' | 'measure' | 'distance'>('score');
  const [newSportDistanceUnit, setNewSportDistanceUnit] = useState<'m' | 'km'>('m');

  // Copy Link State
  const [copied, setCopied] = useState(false);
  const [copiedEnrol, setCopiedEnrol] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toggleVal, setToggleVal] = useState(showPublicTeamsInHeader);

  // Enrolment Simulator Form State
  const [simName, setSimName] = useState('');
  const [simSport, setSimSport] = useState('');
  const [simTeam, setSimTeam] = useState('none');
  const [simPhotoUrl, setSimPhotoUrl] = useState('');
  const [simSuccess, setSimSuccess] = useState(false);

  // Wordings local translation states 
  const [localTranslations, setLocalTranslations] = useState<Record<string, { kh: string; en: string }>>(() => {
    return translations || DEFAULT_TRANSLATIONS;
  });

  useEffect(() => {
    if (translations) {
      setLocalTranslations(translations);
    }
  }, [translations]);

  const [isSavingTrans, setIsSavingTrans] = useState(false);
  const [transSaveSuccess, setTransSaveSuccess] = useState(false);

  // Sync selected event target if active ID shifts
  useEffect(() => {
    setSelectedEventIdForSport(activeEventId);
  }, [activeEventId]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dhlgamesday2026.web.app';
  const shareableUrl = `${origin}/?tab=public_teams`;
  const shareableEnrolUrl = `${origin}/?tab=enrolment`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEnrolLink = () => {
    navigator.clipboard.writeText(shareableEnrolUrl);
    setCopiedEnrol(true);
    setTimeout(() => setCopiedEnrol(false), 2000);
  };

  useEffect(() => {
    setToggleVal(showPublicTeamsInHeader);
  }, [showPublicTeamsInHeader]);

  const handleToggle = async () => {
    const newVal = !toggleVal;
    setToggleVal(newVal);
    setIsUpdating(true);
    try {
      await onUpdateShowPublicTeamsInHeader(newVal);
    } catch (err) {
      console.error('Failed to update visibility settings:', err);
      // Rollback
      setToggleVal(!newVal);
    } finally {
      setIsUpdating(false);
    }
  };

  // 1. Create New Event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim() || !newEventKhmerName.trim()) {
      alert('សូមបញ្ចូលឈ្មោះព្រឹត្តិការណ៍ទាំង អង់គ្លេស និង ខ្មែរ! (Please input both English and Khmer names.)');
      return;
    }

    const initialSports: Sport[] = populateDefaultSports ? [
      { name: 'Soccer', khmerName: 'បាល់ទាត់', icon: '⚽', scoringMethod: 'score' },
      { name: 'Volleyball', khmerName: 'បាល់ទះ', icon: '🏐', scoringMethod: 'score' },
      { name: 'Pingpong', khmerName: 'វាយកូនឃ្លីលើតុ', icon: '🏓', scoringMethod: 'score' },
      { name: 'Badminton', khmerName: 'វាយសី', icon: '🏸', scoringMethod: 'score' },
      { name: 'Swimming', khmerName: 'ហែលទឹក', icon: '🏊', scoringMethod: 'measure' },
    ] : [];

    const brandNew: EventInfo = {
      id: 'event-' + Date.now(),
      name: newEventName.trim(),
      khmerName: newEventKhmerName.trim(),
      date: newEventDate || new Date().toISOString().split('T')[0],
      description: newEventDesc.trim(),
      sports: initialSports,
      created_by: currentUser?.username || 'hempiden',
      show_public_teams: true,
      is_enrolment_enabled: true,
      organization_slug: organizationSlug || 'dhl-games'
    };

    const updated = [...events, brandNew];
    setEvents(updated);
    syncEventsToSupabase(updated);
    
    // Auto-select as active
    setActiveEventId(brandNew.id);

    // Reset Form
    setNewEventName('');
    setNewEventKhmerName('');
    setNewEventDate('');
    setNewEventDesc('');
    alert('បង្កើតព្រឹត្តិការណ៍ថ្មីបានជោគជ័យ! New event created and selected as active.');
  };

  // 2. Delete Event
  const handleDeleteEvent = (id: string) => {
    if (id === activeEventId) {
      alert('មិនអាចលុបព្រឹត្តិការណ៍ដែលកំពុងដំណើរការបានទេ! (Cannot delete the active event. Please switch to another first.)');
      return;
    }
    if (events.length <= 1) {
      alert('ត្រូវតែមានព្រឹត្តិការណ៍យ៉ាងហោចណាស់១ជានិច្ច! (Must keep at least one event.)');
      return;
    }
    if (!confirm('តើអ្នកពិតជាចង់លុបព្រឹត្តិការណ៍នេះមែនទេ? (Are you sure you want to delete this event?)')) {
      return;
    }

    const filtered = events.filter(e => e.id !== id);
    setEvents(filtered);
    deleteEventFromSupabase(id);
  };

  // 3. Add Custom Sport to selected Event
  const handleAddSport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSportName.trim() || !newSportKhmerName.trim()) {
      alert('សូមបំពេញឈ្មោះប្រភេទកីឡា! (Please fill both sport names.)');
      return;
    }

    const modifiedEvents = events.map(ev => {
      if (ev.id === selectedEventIdForSport) {
        // Prevent duplicate sport name
        const exists = ev.sports.some(s => s.name.toLowerCase() === newSportName.trim().toLowerCase());
        if (exists) {
          alert('ឈ្មោះកីឡានេះមានរួចហើយនៅក្នុងព្រឹត្តិការណ៍នេះ! (This sport name already exists in this event.)');
          return ev;
        }

        const newSport: Sport = {
          name: newSportName.trim().replace(/\s+/g, ''), // remove internal space for url/routing safety
          khmerName: newSportKhmerName.trim(),
          icon: newSportIcon,
          scoringMethod: newSportScoringMethod,
          ...(newSportScoringMethod === 'distance' ? { distanceUnit: newSportDistanceUnit } : {})
        };
        return {
          ...ev,
          sports: [...ev.sports, newSport]
        };
      }
      return ev;
    });

    setEvents(modifiedEvents);
    syncEventsToSupabase(modifiedEvents);
    // Reset Form
    setNewSportName('');
    setNewSportKhmerName('');
    setNewSportIcon('⚽');
    alert('បន្ថែមប្រភេទកីឡាថ្មីបានជោគជ័យ! New sport added to event.');
  };

  // 4. Delete Sport from selected Event
  const handleDeleteSport = (eventId: string, sportName: string) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុបប្រភេទកីឡា "${sportName}" នេះមែនទេ? (Are you sure you want to delete this sport?)`)) {
      return;
    }

    const modifiedEvents = events.map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          sports: ev.sports.filter(s => s.name !== sportName)
        };
      }
      return ev;
    });

    setEvents(modifiedEvents);
    syncEventsToSupabase(modifiedEvents);
  };

  const currentActiveEventObj = events.find(e => e.id === activeEventId) || events[0];

  return (
    <div className="w-full flex flex-col gap-6 select-all">
      
      {/* Top Banner with dynamic active event indicator */}
      <div className="bg-[#D40511] text-white p-5 rounded-3xl shadow-md border-b-4 border-[#FFCC00] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10">
          <p className="text-[9px] font-black tracking-widest bg-yellow-400 text-red-950 px-2.5 py-1 rounded-md uppercase w-fit select-none font-mono">
            ADMINISTRATOR SUITE
          </p>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-1.5 flex items-center gap-2">
            <Settings className="w-6 sm:w-7 sm:h-7 animate-spin-slow text-yellow-400" />
            <span>ការកំណត់ប្រព័ន្ធប្រកួត (Tournament Dashboard)</span>
          </h2>
          <p className="text-xs text-red-100 max-w-xl mt-1.5 leading-relaxed font-semibold">
            ព្រឹត្តិការណ៍សកម្ម៖ <strong className="text-yellow-300 underline underline-offset-4">{currentActiveEventObj?.khmerName} ({currentActiveEventObj?.name})</strong>
          </p>
        </div>

        {/* Sync Badges */}
        <div className="flex select-none gap-2 shrink-0 h-fit">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 text-left font-bold min-w-[120px]">
            <span className="text-[8px] text-red-200 block uppercase font-extrabold tracking-wider">DATABASE STORAGE</span>
            <span className="text-xs text-white uppercase block mt-0.5">{isSupabaseEnabled ? 'SUPABASE' : 'BROWSER LOCAL'}</span>
          </div>
          <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 text-left font-bold min-w-[120px]">
            <span className="text-[8px] text-red-200 block uppercase font-extrabold tracking-wider">EVENTS AMOUNT</span>
            <span className="text-xs text-yellow-300 block mt-0.5 font-mono">{events.length} EVENTS REC</span>
          </div>
        </div>
      </div>

      {/* Admin Operations panel horizontal: right below Administrator Suite banner */}
      <div id="admin-operations-horizontal-panel" className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm space-y-3.5 select-none w-full">
        <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider px-1">
          ម៉ឺនុយចាត់ការ (Admin Operations)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('events_sports')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all duration-150 border cursor-pointer ${
              activeSubTab === 'events_sports'
                ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-md'
                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="truncate">ព្រឹត្តិការណ៍ & កីឡា</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('setup_matches')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all duration-150 border cursor-pointer ${
              activeSubTab === 'setup_matches'
                ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-md'
                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings2 className="w-4 h-4 shrink-0 text-indigo-500" />
            <span className="truncate">រៀបចំការប្រកួត</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('teams_structure')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all duration-150 border cursor-pointer ${
              activeSubTab === 'teams_structure'
                ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-md'
                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 text-blue-500" />
            <span className="truncate">រចនាសម្ព័ន្ធក្រុម</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('athletes_hub')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all duration-150 border cursor-pointer ${
              activeSubTab === 'athletes_hub'
                ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-md'
                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="truncate">កីឡាករ & បន្ថែមរូប</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('design')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wide transition duration-150 border cursor-pointer ${
              activeSubTab === 'design'
                ? 'bg-dhl-red border-dhl-red text-white shadow-md'
                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="truncate">ការរចនា & ចែករំលែក</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('enrolment')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wide transition duration-150 border cursor-pointer ${
              activeSubTab === 'enrolment'
                ? 'bg-dhl-red border-dhl-red text-white shadow-md'
                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Award className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="truncate">ទម្រង់ចុះឈ្មោះ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('language')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wide transition duration-150 border cursor-pointer ${
              activeSubTab === 'language'
                ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-md'
                : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Languages className="w-4 h-4 shrink-0 text-cyan-500" />
            <span className="truncate">ភាសា (Languages)</span>
          </button>
        </div>
      </div>

      {/* Main Content Panels occupying 100% full width */}
      <div id="admin-operations-content-panel" className="w-full space-y-6">

          {/* TAB 1: EVENTS AND SPORTS ARCHITECT */}
          {activeSubTab === 'events_sports' && (
            <div className="space-y-6">
              
              {/* Card 1: Active Event Info & Switcher */}
              <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-2xl border border-yellow-100">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                        ជ្រើសរើស និង ដំណើរការព្រឹត្តិការណ៍ (Set Active Event)
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        Choose which tournament is live across dashboards
                      </p>
                    </div>
                  </div>

                  {/* Dropdown switch active event */}
                  <div className="flex items-center gap-2 select-none shrink-0">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Tournament:</label>
                    <select
                      value={activeEventId}
                      onChange={(e) => setActiveEventId(e.target.value)}
                      className="px-3.5 py-2 bg-yellow-50 hover:bg-yellow-100 text-slate-900 border border-[#FFCC00] text-xs font-black rounded-xl focus:ring-2 focus:ring-[#FFCC00] outline-none transition duration-150"
                    >
                      {filteredAdminEvents.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.khmerName} ({ev.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub: Active event sports visualization checklist */}
                <div className="bg-gray-50/60 rounded-2xl border border-gray-100 p-5 space-y-4">
                  <div className="flex items-center justify-between select-none">
                    <h4 className="text-xs font-black text-gray-700 uppercase tracking-wide">
                      បញ្ជីកីឡាក្នុងព្រឹត្តិការណ៍សកម្ម ({currentActiveEventObj?.sports?.length || 0} Sports in Active Event)
                    </h4>
                    <span className="text-[8px] bg-red-100 text-red-700 font-black px-2.5 py-0.5 rounded-full uppercase">
                      Active Configuration
                    </span>
                  </div>

                  {currentActiveEventObj?.sports?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4 text-center">
                      មិនទាន់មានប្រភេទកីឡាឡើយក្នុងព្រឹត្តិការណ៍នេះ។ សូមបញ្ចូលនៅទម្រង់ខាងក្រោម! (No sports inside this event yet. Add one below!)
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {currentActiveEventObj?.sports.map((sp) => (
                        <div key={sp.name} className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center border select-none">{sp.icon || '🏆'}</span>
                            <div className="leading-tight">
                              <h5 className="text-xs font-black text-gray-800">{sp.khmerName}</h5>
                              <p className="text-[9.5px] text-gray-400 font-mono mt-0.5">{sp.name}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 select-none">
                            <span className={`text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider leading-none ${
                              sp.scoringMethod === 'measure' 
                                ? 'bg-cyan-50 text-cyan-600 border border-cyan-150' 
                                : sp.scoringMethod === 'distance'
                                ? 'bg-amber-50 text-amber-600 border border-amber-150'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-150'
                            }`}>
                              {sp.scoringMethod === 'measure' 
                                ? '⏱️ Measure' 
                                : sp.scoringMethod === 'distance'
                                ? `📏 Dist (${sp.distanceUnit || 'm'})`
                                : '⚽ Goals'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSport(currentActiveEventObj.id, sp.name)}
                              className="text-[9px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                              title="Delete sport from event"
                            >
                              លុប (Delete)
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Grid Form 1: Create New Event Form & Add custom sport */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left: Create Event Form */}
                <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                    <Calendar className="w-4.5 h-4.5 text-red-650" />
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                      បង្កើតព្រឹត្តិការណ៍ថ្មី (Create Tournament Event)
                    </h3>
                  </div>

                  <form onSubmit={handleCreateEvent} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">ឈ្មោះអង់គ្លេស English Name:</label>
                      <input
                        type="text"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="e.g. Summer Games 2026"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">ឈ្មោះខ្មែរ Khmer Name:</label>
                      <input
                        type="text"
                        value={newEventKhmerName}
                        onChange={(e) => setNewEventKhmerName(e.target.value)}
                        placeholder="ឧ. ពានរង្វាន់រដូវក្តៅ ២០២៦"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">កាលបរិច្ឆេទ Date:</label>
                        <input
                          type="date"
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 select-none">Populate:</label>
                        <div className="flex items-center gap-2 mt-2 h-7 select-none">
                          <input
                            type="checkbox"
                            id="populate-defaults"
                            checked={populateDefaultSports}
                            onChange={(e) => setPopulateDefaultSports(e.target.checked)}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <label htmlFor="populate-defaults" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer">5 Default Sports</label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">ពណ៌នា Description:</label>
                      <textarea
                        value={newEventDesc}
                        onChange={(e) => setNewEventDesc(e.target.value)}
                        placeholder="Tournament summary..."
                        rows={2}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl shadow-md transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>បង្កើតព្រឹត្តិការណ៍ (Create Event)</span>
                    </button>
                  </form>
                </div>

                {/* Right: Add Custom Sport to selected Event */}
                <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                    <Plus className="w-4.5 h-4.5 text-blue-600" />
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                      បន្ថែមប្រភេទកីឡាក្នុងព្រឹត្តិការណ៍ (Create & Add Sport)
                    </h3>
                  </div>

                  <form onSubmit={handleAddSport} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">ជ្រើសរើសព្រឹត្តិការណ៍ Select Target Event:</label>
                      <select
                        value={selectedEventIdForSport}
                        onChange={(e) => setSelectedEventIdForSport(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        {filteredAdminEvents.map(ev => (
                          <option key={ev.id} value={ev.id}>
                            {ev.khmerName} ({ev.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">ឈ្មោះកីឡា (English):</label>
                        <input
                          type="text"
                          value={newSportName}
                          onChange={(e) => setNewSportName(e.target.value)}
                          placeholder="e.g. Basketball, Chess"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">ឈ្មោះកីឡា (Khmer):</label>
                        <input
                          type="text"
                          value={newSportKhmerName}
                          onChange={(e) => setNewSportKhmerName(e.target.value)}
                          placeholder="ឧ. បាល់បោះ, អុក"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">រូបតំណាង Icon (Emoji):</label>
                        <select
                          value={newSportIcon}
                          onChange={(e) => setNewSportIcon(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                        >
                          <option value="⚽">⚽ Soccer Ball</option>
                          <option value="🏐">🏐 Volleyball</option>
                          <option value="🏓">🏓 Ping Pong</option>
                          <option value="🏸">🏸 Badminton</option>
                          <option value="🏊">🏊 Swimmer</option>
                          <option value="🏀">🏀 Basketball</option>
                          <option value="🏃">🏃 Runner</option>
                          <option value="♟️">♟️ Chess Piece</option>
                          <option value="🎳">🎳 Bowling</option>
                          <option value="🎾">🎾 Tennis</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">គម្រោងពិន្ទុ Scoring Method:</label>
                        <select
                          value={newSportScoringMethod}
                          onChange={(e) => setNewSportScoringMethod(e.target.value as any)}
                          className="w-full px-3 py-2 bg-gray-50 border border-[#e5e7eb] text-xs font-black text-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                        >
                          <option value="score">⚽ Goals Counter (ដូច soccer)</option>
                          <option value="measure">⏱️ Timer Stopwatch (វាស់វិនាទីដូចហែលទឹក)</option>
                          <option value="distance">📏 Distance (m, km) (វាស់ចម្ងាយដូចជារត់ លោត...)</option>
                        </select>
                      </div>
                    </div>

                    {newSportScoringMethod === 'distance' && (
                      <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-2xl animate-fade-in">
                        <label className="block text-[10px] uppercase font-black text-amber-800 mb-1">ឯកតាចម្ងាយ Distance Unit:</label>
                        <select
                          value={newSportDistanceUnit}
                          onChange={(e) => setNewSportDistanceUnit(e.target.value as 'm' | 'km')}
                          className="w-full px-3 py-2 bg-white border border-amber-200 text-xs font-black text-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition"
                        >
                          <option value="m">Meters (m) - សម្រាប់លោតចម្ងាយ ហែលទឹក ឬរត់ចម្ងាយខ្លី</option>
                          <option value="km">Kilometers (km) - សម្រាប់រត់ម៉ារ៉ាតុង ឬជិះកង់</option>
                        </select>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-xl shadow-md transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>បន្ថែមប្រភេទកីឡា (Add Sport)</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Event Directory Listing Row */}
              <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-150 pb-3">
                  <LayoutGrid className="w-4.5 h-4.5 text-gray-600" />
                  <h4 className="text-xs font-black text-gray-850 uppercase tracking-wide">
                    តារាងព្រឹត្តិការណ៍ទាំងអស់ក្នុងប្រព័ន្ធ (Existing Tournaments Directory)
                  </h4>
                </div>

                <div className="overflow-x-auto w-full no-scrollbar">
                  <table className="w-full text-xs text-left text-gray-500 border-collapse">
                    <thead className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 select-none">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Khmer / English Name</th>
                        <th className="px-4 py-3">Scheduled Date</th>
                        <th className="px-4 py-3">Roster of Sports</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAdminEvents.map((ev) => {
                        const isActive = ev.id === activeEventId;
                        return (
                          <tr key={ev.id} className={`hover:bg-gray-50/50 ${isActive ? 'bg-yellow-50-important' : ''}`}>
                            <td className="px-4 py-3.5 font-bold">
                              <p className="text-gray-800 text-xs sm:text-[12.5px]">{ev.khmerName}</p>
                              <p className="text-[10px] text-gray-400 font-mono font-medium">{ev.name}</p>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-gray-500">
                              {ev.date || 'No Date'}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap gap-1 w-xs">
                                {ev.sports?.map(s => (
                                  <span key={s.name} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 border text-gray-600 text-[9.5px] rounded-md font-bold" title={s.khmerName}>
                                    {s.icon} {s.name}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center select-none">
                              {isActive ? (
                                <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[8.5px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                                  ● ACTIVE MATCH LIVE
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-400 border text-[8.5px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                                  Standby
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right select-none">
                              <div className="flex gap-2 justify-end">
                                {!isActive && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveEventId(ev.id)}
                                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-xs text-white font-black rounded-lg cursor-pointer transition shadow-xs"
                                  >
                                    Activate
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvent(ev.id)}
                                  className="p-1.5 bg-red-50 hover:bg-red-150 border border-red-250 text-[#D40511] rounded-lg cursor-pointer transition h-fit inline-flex align-middle"
                                  disabled={isActive}
                                  title="Delete Tourney"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMBEDDED SETUP MATCHED VIEW */}
          {activeSubTab === 'setup_matches' && (
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
              <div className="border-b border-gray-100 pb-3 mb-6 select-none">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  រៀបចំការប្រកួត និង កាលវិភាគ (Match Fixture Setup Console)
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                  Created matches here will populate the public live board and sub-admin scorer panel
                </p>
              </div>

              <AdminPanel
                matches={matches}
                participants={participants}
                addMatch={addMatch}
                updateMatchStatus={updateMatchStatus}
                deleteMatch={deleteMatch}
                resetToDefault={resetToDefault}
              />
            </div>
          )}

          {/* TAB 3a: EMBEDDED TEAM STRUCTURE ROSTER */}
          {activeSubTab === 'teams_structure' && (
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
              <div className="border-b border-gray-100 pb-3 mb-6 select-none">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  រៀបចំរចនាសម្ព័ន្ធក្រុម (Team Structure Roster)
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                  Config and associate team structures for active tournament schedules
                </p>
              </div>

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
                forceTab="structure"
              />
            </div>
          )}

          {/* TAB 3b: EMBEDDED ATHLETE HUB */}
          {activeSubTab === 'athletes_hub' && (
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
              <div className="border-b border-gray-100 pb-3 mb-6 select-none">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  បញ្ជីឈ្មោះកីឡាករ & បន្ថែមរូប (Athlete Hub)
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                  Register players and upload profile assets for tournament sports
                </p>
              </div>

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
                forceTab="athletes"
              />
            </div>
          )}

          {/* TAB 4: DESIGN & VISIBILITY & SPECATOR DISTRIBUTION */}
          {activeSubTab === 'design' && (
            <div className="space-y-6">
              
              {/* Preset Theme Selection */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-2xl border border-yellow-100">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                        ពណ៌រចនាប័ទ្មរបស់ព្រឹត្តិការណ៍ (Event Premium Themes)
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        Choose one of 3 eye-catching themes to paint your tournament view
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Theme 1: Sporty Classic */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = events.map(ev => {
                          if (ev.id === activeEventId) {
                            return { ...ev, themeColor: 'dhl' as const };
                          }
                          return ev;
                        });
                        setEvents(updated);
                      }}
                      className={`relative p-4 rounded-2xl border text-left transition duration-200 cursor-pointer ${
                        (events.find(e => e.id === activeEventId)?.themeColor || 'dhl') === 'dhl'
                          ? 'border-red-650 bg-red-50/20 shadow-sm ring-2 ring-red-600'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-black">
                        {(events.find(e => e.id === activeEventId)?.themeColor || 'dhl') === 'dhl' && '✓'}
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        <span className="w-6 h-6 rounded-md bg-[#D40511] border border-gray-200"></span>
                        <span className="w-6 h-6 rounded-md bg-[#FFCC00] border border-gray-200"></span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 uppercase">Sporty Classic</h4>
                      <p className="text-[10px] text-gray-500 mt-1 font-medium">ពណ៌ក្រហម និងលឿងបែបស្ព័រលំនាំដើម</p>
                    </button>

                    {/* Theme 2: Cosmic Midnight */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = events.map(ev => {
                          if (ev.id === activeEventId) {
                            return { ...ev, themeColor: 'cosmic' as const };
                          }
                          return ev;
                        });
                        setEvents(updated);
                      }}
                      className={`relative p-4 rounded-2xl border text-left transition duration-200 cursor-pointer ${
                        events.find(e => e.id === activeEventId)?.themeColor === 'cosmic'
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-sm ring-2 ring-indigo-650'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-800 flex items-center justify-center text-white text-[10px] font-black">
                        {events.find(e => e.id === activeEventId)?.themeColor === 'cosmic' && '✓'}
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        <span className="w-6 h-6 rounded-md bg-[#1E1B4B] border border-gray-200"></span>
                        <span className="w-6 h-6 rounded-md bg-cyan-400 border border-gray-200"></span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 uppercase">Cosmic Midnight</h4>
                      <p className="text-[10px] text-gray-500 mt-1 font-medium">ពណ៌ខៀវចាស់ និងផ្ទៃមេឃផ្កាយ</p>
                    </button>

                    {/* Theme 3: Forest Emerald */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = events.map(ev => {
                          if (ev.id === activeEventId) {
                            return { ...ev, themeColor: 'forest' as const };
                          }
                          return ev;
                        });
                        setEvents(updated);
                      }}
                      className={`relative p-4 rounded-2xl border text-left transition duration-200 cursor-pointer ${
                        events.find(e => e.id === activeEventId)?.themeColor === 'forest'
                          ? 'border-emerald-600 bg-emerald-50/20 shadow-sm ring-2 ring-emerald-650'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-white text-[10px] font-black">
                        {events.find(e => e.id === activeEventId)?.themeColor === 'forest' && '✓'}
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        <span className="w-6 h-6 rounded-md bg-[#064E3B] border border-gray-200"></span>
                        <span className="w-6 h-6 rounded-md bg-emerald-500 border border-gray-200"></span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 uppercase">Forest Emerald</h4>
                      <p className="text-[10px] text-gray-500 mt-1 font-medium">ពណ៌បៃតងធម្មជាតិស្រស់ស្រាយ</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Header visible toggle */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 select-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-50 text-red-650 rounded-2xl border border-red-100">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                        ការបង្ហាញម៉ឺនុយហ្គេម (Header Navigation Menu)
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        Toggle what spectators see on top header panel
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="space-y-1 max-w-md">
                      <h4 className="text-xs font-black text-gray-800 uppercase">
                        ទំព័របញ្ជីឈ្មោះក្រុមសាធារណៈ (Public Teams Page)
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                        អនុញ្ញាតឱ្យបង្ហាញ ឬលាក់ប៊ូតុង <strong className="text-dhl-red font-bold">"បញ្ជីឈ្មោះក្រុម (Public Teams)"</strong> ចេញពី Header menu សម្រាប់ spectators ទូទៅ។
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggle}
                      disabled={isUpdating}
                      className="focus:outline-none flex items-center select-none cursor-pointer transition active:scale-95 duration-150 animate-fade-in"
                    >
                      {toggleVal ? (
                        <ToggleRight className="w-14 h-10 text-dhl-red" />
                      ) : (
                        <ToggleLeft className="w-14 h-10 text-gray-300" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="space-y-1 max-w-md">
                      <h4 className="text-xs font-black text-gray-800 uppercase">
                        ទំព័រចុះឈ្មោះកីឡាករដោយខ្លួនឯង (Athlete Self-Enrolment Page)
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                        អនុញ្ញាតឱ្យបង្ហាញ ឬលាក់ប៊ូតុង <strong className="text-emerald-700 font-bold">"ចុះឈ្មោះលេងកីឡា (Enrol Athlete)"</strong> ចេញពី Header menu សម្រាប់ spectators ទូទៅ។
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEnrolmentEnabled(!isEnrolmentEnabled)}
                      className="focus:outline-none flex items-center select-none cursor-pointer transition active:scale-95 duration-150 animate-fade-in"
                    >
                      {isEnrolmentEnabled ? (
                        <ToggleRight className="w-14 h-10 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-14 h-10 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* QR & Share distribution */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-8">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3 select-none">
                  <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-2xl border border-yellow-105">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                      តំណភ្ជាប់ និង QR Code សម្រាប់ចែករំលែក (Direct Page Distribution Channels)
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                      Distribute spectator page links to search teams or register athletes with ease
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Channel 1: Public Teams Direct Page */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-150">
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] bg-red-50 text-dhl-red font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-red-100">Public Teams Overview</span>
                        <h4 className="text-sm font-black text-gray-800 uppercase mt-1">
                          តំណភ្ជាប់ទៅកាន់បញ្ជីឈ្មោះក្រុមសាធារណៈ
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                          ចម្លងតំណភ្ជាប់នេះផ្ញើជូន spectators ដើម្បីស្វែងរកឈ្មោះកីឡាករ និងក្រុមលេង៖
                        </p>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-150 font-mono text-[10px] text-gray-600 break-all select-all relative group shadow-sm">
                        <span className="flex-1 truncate pr-8">{shareableUrl}</span>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="absolute right-2 p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-dhl-red rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs select-none">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition duration-150 cursor-pointer ${
                            copied
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-dhl-yellow text-gray-900 hover:brightness-105 border border-amber-400'
                          }`}
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 font-black" />}
                          <span>{copied ? 'ចម្លងរួចរាល់! Copied' : 'ចម្លងតំណភ្ជាប់ (Copy URL)'}</span>
                        </button>

                        <a
                          href={shareableUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>បើកមើលផ្ទាល់ (Open Page)</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-white p-4 rounded-3xl border border-gray-150 relative space-y-2 shadow-sm selection-none">
                      <div className="p-2 bg-white rounded-2xl flex flex-col items-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareableUrl)}`}
                          alt="Public Teams Direct QR Code"
                          className="w-32 h-32 object-contain select-none pointer-events-none"
                        />
                        <div className="mt-1.5 text-center select-none">
                          <p className="text-[9px] font-black font-dhl-title text-dhl-red uppercase tracking-wide">
                            PUBLIC TEAMS ROADMAP
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Channel 2: Athlete Self-Enrolment Direct Page */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-150">
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100">Athlete Self-Enrolment</span>
                        <h4 className="text-sm font-black text-gray-800 uppercase mt-1">
                          តំណភ្ជាប់ចុះឈ្មោះកីឡាករដោយខ្លួនឯង
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                          ចម្លងតំណភ្ជាប់នេះផ្ញើជូនបុគ្គលិក ដើម្បីឱ្យពួកគេចុះឈ្មោះចូលរួមលេងដោយខ្លួនឯង៖
                        </p>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-150 font-mono text-[10px] text-gray-600 break-all select-all relative group shadow-sm">
                        <span className="flex-1 truncate pr-8">{shareableEnrolUrl}</span>
                        <button
                          type="button"
                          onClick={handleCopyEnrolLink}
                          className="absolute right-2 p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-emerald-600 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          {copiedEnrol ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs select-none">
                        <button
                          type="button"
                          onClick={handleCopyEnrolLink}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition duration-150 cursor-pointer ${
                            copiedEnrol
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-250 font-black'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-500'
                          }`}
                        >
                          {copiedEnrol ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 font-black" />}
                          <span>{copiedEnrol ? 'ចម្លងរួចរាល់! Copied' : 'ចម្លងតំណភ្ជាប់ (Copy URL)'}</span>
                        </button>

                        <a
                          href={shareableEnrolUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>បើកមើលផ្ទាល់ (Open Page)</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-white p-4 rounded-3xl border border-gray-150 relative space-y-2 shadow-sm selection-none">
                      <div className="p-2 bg-white rounded-2xl flex flex-col items-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareableEnrolUrl)}`}
                          alt="Athlete Enrolment Direct QR Code"
                          className="w-32 h-32 object-contain select-none pointer-events-none"
                        />
                        <div className="mt-1.5 text-center select-none">
                          <p className="text-[9px] font-black font-dhl-title text-emerald-600 uppercase tracking-wide">
                            ATHLETE REGISTRATION
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PUBLIC ATHLETE ENROLMENT FORM CONFIGURATOR */}
          {activeSubTab === 'enrolment' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                        ចុះឈ្មោះកីឡាករដោយខ្លួនឯង (Athlete Self-Enrolment Configuration)
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        Provide a dedicated registration portal for employees to register themselves
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6 text-xs">
                  {/* Status configuration */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-150 shadow-inner">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-gray-800 uppercase">
                        បើកដំណើរការទម្រង់ចុះឈ្មោះជាសាធារណៈ (Enable Registration Portal)
                      </h4>
                      <p className="text-[10px] text-gray-500 font-bold tracking-wide leading-relaxed">
                        If enabled, anyone can visit the link or scan the QR Code below to choose their sport, enter name, upload a photo and self-register!
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEnrolmentEnabled(!isEnrolmentEnabled)}
                      className="focus:outline-none flex items-center select-none cursor-pointer transition active:scale-95 duration-100"
                    >
                      {isEnrolmentEnabled ? (
                        <ToggleRight className="w-14 h-10 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-14 h-10 text-gray-300" />
                      )}
                    </button>
                  </div>

                  {/* Public Link Direct Sharing */}
                  <div className="bg-white rounded-2xl border border-gray-150 p-5 space-y-4">
                    <h4 className="text-xs font-black text-gray-800 uppercase">
                      តំណភ្ជាប់ផ្ទាល់ទៅកាន់ទម្រង់ចុះឈ្មោះសមាជិក (Enrolment Direct Link & QR)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      <div className="md:col-span-8 space-y-3">
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          ចែករំលែកតំណភ្ជាប់នេះ ដើម្បីឱ្យសហការីចុះឈ្មោះចូលរួមលេងកីឡាដោយខ្លួនឯង ដោយមិនបាច់បុកបញ្ចូល (Bulk Upload) ពី Admin ឡើយ៖
                        </p>

                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-150 font-mono text-[10px] text-gray-600 break-all select-all relative">
                          <span className="flex-1 truncate pr-8">{`${origin}/?tab=enrolment`}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${origin}/?tab=enrolment`);
                              alert('Copied registration link! ចម្លងតំណភ្ជាប់ចុះឈ្មោះកីឡាកររួចរាល់។');
                            }}
                            className="absolute right-2 p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 rounded-lg transition-all active:scale-95"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${origin}/?tab=enrolment`);
                              alert('Copied registration link! ចម្លងតំណភ្ជាប់ចុះឈ្មោះកីឡាកររួចរាល់។');
                            }}
                            className="bg-emerald-600 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider hover:bg-emerald-700 active:scale-95 transition"
                          >
                            Copy Link
                          </button>
                          <a
                            href={`${origin}/?tab=enrolment`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-100 text-gray-700 font-bold text-[10px] px-3.5 py-2 border rounded-xl uppercase tracking-wider hover:bg-gray-200 transition"
                          >
                            Open Portal Tab
                          </a>
                        </div>
                      </div>

                      <div className="md:col-span-4 flex justify-center">
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 shadow-inner flex flex-col items-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${origin}/?tab=enrolment`)}`}
                            alt="Athlete Registration QR Code"
                            className="w-28 h-28 object-contain"
                          />
                          <span className="text-[8px] font-bold text-gray-400 mt-1">SCAN TO REGISTER</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Live Simulator */}
                  <div className="bg-gray-50 rounded-2xl border border-gray-150 p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase">
                        សាកល្បងចុះឈ្មោះ (Interactive Form Simulator)
                      </h4>
                    </div>

                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      នេះជាផ្ទាំងសាកល្បង ដែលដំណើរការដូចទៅនឹងទម្រង់ចុះឈ្មោះពិតប្រាកដ។ អ្នកអាចសាកល្បងចុះឈ្មោះសមាជិក រួចពិនិត្យមើលលទ្ធផលក្នុងបញ្ជីឈ្មោះភ្លាមៗ៖
                    </p>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!simName.trim()) {
                          alert('សូមបញ្ចូលឈ្មោះកីឡាករ! Please enter athlete name.');
                          return;
                        }
                        if (!simSport) {
                          alert('សូមជ្រើសរើសប្រភេទកីឡា! Please select sport.');
                          return;
                        }

                        const targetTeam = simTeam === 'none' ? null : simTeam;
                        const res = await addParticipant(simName.trim(), simSport, false, targetTeam, simPhotoUrl.trim() || undefined);
                        if (res) {
                          setSimSuccess(true);
                          setSimName('');
                          setSimPhotoUrl('');
                          setSimTeam('none');
                          setTimeout(() => setSimSuccess(false), 4000);
                        } else {
                          alert('ការចុះឈ្មោះមានបញ្ហា Error completing registration.');
                        }
                      }}
                      className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4"
                    >
                      {simSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-700 font-bold text-[11px] flex items-center gap-2 animate-bounce">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>ការចុះឈ្មោះទទួលបានជោគជ័យ! Enrolled successfully and added to team roster.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                            ឈ្មោះពេញ (Full Name) <strong className="text-dhl-red">*</strong>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="ឧ. សុខ ម៉ានិត"
                            value={simName}
                            onChange={(e) => setSimName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                            ប្រភេទកីឡា (Select Sport) <strong className="text-dhl-red">*</strong>
                          </label>
                          <select
                            required
                            value={simSport}
                            onChange={(e) => setSimSport(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs transition-colors"
                          >
                            <option value="">-- ជ្រើសរើសប្រភេទកីឡា --</option>
                            {(events.find(e => e.id === activeEventId)?.sports || []).map((sp) => (
                              <option key={sp.name} value={sp.name}>
                                {sp.icon} {sp.khmerName} ({sp.name})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                            រូបថត Profile Link (Photo URL - Optional)
                          </label>
                          <input
                            type="url"
                            placeholder="https://example.com/photo.jpg"
                            value={simPhotoUrl}
                            onChange={(e) => setSimPhotoUrl(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                            ជ្រើសរើសក្រុមលេង (Select Team - Optional)
                          </label>
                          <select
                            value={simTeam}
                            onChange={(e) => setSimTeam(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
                          >
                            <option value="none">មិនទាន់មានក្រុម (Assign team later / None)</option>
                            {participants
                              .filter(p => p.is_team && (!simSport || p.sport_type === simSport))
                              .map(team => (
                                <option key={team.id} value={team.id}>
                                  {team.name} ({team.sport_type})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                        >
                          រក្សាទុកកីឡាករ (Add Athlete)
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOM WORDING AND LANGUAGE SETTINGS */}
          {activeSubTab === 'language' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Card 1: Language Switcher Option (Moved here from design session as requested) */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 select-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                      <Languages className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                        ការកំណត់ភាសាផ្ទាំងព័ត៌មាន (Dashboard Language Settings)
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        Enable or disable language switcher options (ភាសារខ្មែរ & English)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Khmer toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="space-y-1 max-w-md">
                      <h4 className="text-xs font-black text-gray-800 uppercase">
                        ភាសារខ្មែរ (Khmer Language Option)
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                        អនុញ្ញាតឱ្យអ្នកទស្សនា (spectators) ជ្រើសរើសមើលផ្ទាំងព័ត៌មានជា <strong className="text-blue-600 font-bold">ភាសាខ្មែរ</strong>។
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const activeEv = events.find(e => e.id === activeEventId);
                        const currentLangs = activeEv?.enabled_languages || ['kh', 'en'];
                        let nextLangs: string[];
                        if (currentLangs.includes('kh')) {
                          if (currentLangs.length <= 1) return;
                          nextLangs = currentLangs.filter(l => l !== 'kh');
                        } else {
                          nextLangs = [...currentLangs, 'kh'];
                        }
                        const updated = events.map(ev => {
                          if (ev.id === activeEventId) {
                            return { ...ev, enabled_languages: nextLangs };
                          }
                          return ev;
                        });
                        setEvents(updated);
                        syncEventsToSupabase(updated);
                      }}
                      className="focus:outline-none flex items-center select-none cursor-pointer transition active:scale-95 duration-150"
                    >
                      {(events.find(e => e.id === activeEventId)?.enabled_languages || ['kh', 'en']).includes('kh') ? (
                        <ToggleRight className="w-14 h-10 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-14 h-10 text-gray-300" />
                      )}
                    </button>
                  </div>

                  {/* English toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="space-y-1 max-w-md">
                      <h4 className="text-xs font-black text-gray-800 uppercase">
                        English Language (English Language Option)
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                        Allow spectators to toggle and view the tournament web dashboard in <strong className="text-indigo-600 font-bold">English language</strong> mode.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const activeEv = events.find(e => e.id === activeEventId);
                        const currentLangs = activeEv?.enabled_languages || ['kh', 'en'];
                        let nextLangs: string[];
                        if (currentLangs.includes('en')) {
                          if (currentLangs.length <= 1) return;
                          nextLangs = currentLangs.filter(l => l !== 'en');
                        } else {
                          nextLangs = [...currentLangs, 'en'];
                        }
                        const updated = events.map(ev => {
                          if (ev.id === activeEventId) {
                            return { ...ev, enabled_languages: nextLangs };
                          }
                          return ev;
                        });
                        setEvents(updated);
                        syncEventsToSupabase(updated);
                      }}
                      className="focus:outline-none flex items-center select-none cursor-pointer transition active:scale-95 duration-150"
                    >
                      {(events.find(e => e.id === activeEventId)?.enabled_languages || ['kh', 'en']).includes('en') ? (
                        <ToggleRight className="w-14 h-10 text-indigo-600" />
                      ) : (
                        <ToggleLeft className="w-14 h-10 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Custom Wordings Localization customization */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-2xl border border-yellow-105">
                      <Settings2 className="w-5 h-5 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                        កែប្រែពាក្យពេចន៍ទូទៅ (Custom Wording Localization)
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                        Translate or override wording for all menus, forms, and status indicators in the app
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('តើអ្នកពិតជាចង់កំណត់ពាក្យពេចន៍ទាំងអស់ត្រឡប់ទៅជាលំនាំដើមវិញមែនទេ? Reset translations to default?')) {
                          setLocalTranslations(DEFAULT_TRANSLATIONS);
                        }
                      }}
                      className="bg-gray-100 text-gray-750 hover:text-black font-black text-[10px] px-3.5 py-1.5 rounded-lg border hover:bg-gray-200 transition uppercase tracking-wider cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    {Object.keys(DEFAULT_TRANSLATIONS).map((key) => {
                      const desc = KEY_DESCRIPTIONS[key] || { label: key, desc: 'Wording translation key' };
                      return (
                        <div key={key} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-150 space-y-3 shadow-sm hover:border-gray-200 transition">
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-blue-750 bg-blue-50 border border-blue-100 py-0.5 px-2 rounded-md uppercase tracking-wider">
                                {desc.label}
                              </span>
                              <p className="text-[10px] text-gray-400 font-extrabold tracking-wide uppercase mt-1">
                                {desc.desc} (Key: <code className="font-mono bg-gray-200/60 py-0.5 px-1 rounded text-red-600 lowercase">{key}</code>)
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Khmer Translation (ខ្មែរ)</label>
                              <input
                                type="text"
                                value={localTranslations[key]?.kh || ''}
                                onChange={(e) => {
                                  const updated = {
                                    ...localTranslations,
                                    [key]: {
                                      kh: e.target.value,
                                      en: localTranslations[key]?.en || ''
                                    }
                                  };
                                  setLocalTranslations(updated);
                                }}
                                className="w-full bg-white border border-gray-150 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-bold text-gray-800"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">English Translation (EN)</label>
                              <input
                                type="text"
                                value={localTranslations[key]?.en || ''}
                                onChange={(e) => {
                                  const updated = {
                                    ...localTranslations,
                                    [key]: {
                                      kh: localTranslations[key]?.kh || '',
                                      en: e.target.value
                                    }
                                  };
                                  setLocalTranslations(updated);
                                }}
                                className="w-full bg-white border border-gray-150 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-gray-800"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-gray-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {transSaveSuccess ? (
                      <span className="text-[11px] text-emerald-600 font-extrabold flex items-center gap-1.5 animate-bounce">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        រក្សាទុកពាក្យពេចន៍ដោយជូច័យ! Translations successfully saved and applied.
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wide">
                        Review changes and click save to apply database synchronization
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={isSavingTrans}
                      onClick={async () => {
                        setIsSavingTrans(true);
                        try {
                          await saveTranslations(localTranslations);
                          setTransSaveSuccess(true);
                          setTimeout(() => setTransSaveSuccess(false), 3000);
                        } catch (err) {
                          alert('រក្សាទុកមានបញ្ហា Saving translations error.');
                        } finally {
                          setIsSavingTrans(false);
                        }
                      }}
                      className="bg-[#1a1a1a] hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition active:scale-95 text-xs select-none disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingTrans ? 'Saving...' : 'រក្សាទុកពាក្យពេចន៍ (Save Wordings)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
  );
}

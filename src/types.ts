export type SportType = 'Soccer' | 'Volleyball' | 'Pingpong' | 'Badminton' | 'Swimming' | string;

export interface Sport {
  name: string;
  khmerName: string;
  icon: string;
  scoringMethod: 'score' | 'measure' | 'distance';
  distanceUnit?: 'm' | 'km';
}

export interface EventInfo {
  id: string;
  name: string;
  khmerName: string;
  date?: string;
  description?: string;
  sports: Sport[];
  themeColor?: 'dhl' | 'cosmic' | 'forest';
  created_by?: string;
  show_public_teams?: boolean;
  is_enrolment_enabled?: boolean;
  organization_slug?: string;
  enabled_languages?: string[];
}

export interface Match {
  id: string;
  sport_name: SportType;
  match_label: string; // e.g., 'Group Stage', 'Quarterfinal', 'Semifinal', 'Grand Final'
  team_a: string;
  team_b: string;
  score_a: number;
  score_b: number;
  status: 'Upcoming' | 'Live' | 'Finished';
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
  scheduled_time?: string;
  event_id?: string;
  created_by?: string;
}

export interface TeamStanding {
  team_name: string;
  sport_name: SportType;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  score_for: number;
  score_against: number;
}

export interface SportConfig {
  name: SportType;
  icon: string;
  khmerName: string;
  color: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnabled: boolean;
}

export interface Participant {
  id: string; // matches both local string UUIDs/timestamp IDs and Supabase numeric bigints strings
  name: string;
  sport_type: SportType;
  is_team: boolean;
  team_id: string | null;
  created_at?: string;
  updated_at?: string;
  photo_url?: string;
  event_id?: string;
  created_by?: string;
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  status: 'pending' | 'approved' | 'rejected';
  passwordPlain: string; // Stored simply for local auth demo/persistence
  created_at?: string;
}

export interface OrganizationInfo {
  name: string;
  logoUrl: string;
  slug: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  footerMotto: string;
}

export const DEFAULT_TRANSLATIONS: Record<string, { kh: string; en: string }> = {
  menu_leaderboard: { kh: 'លទ្ធផល (Live Board)', en: 'Leaderboard' },
  menu_public_teams: { kh: 'បញ្ជីឈ្មោះក្រុម (Public Teams)', en: 'Public Teams' },
  menu_enrol: { kh: 'ចុះឈ្មោះលេងកីឡា (Enrol Athlete)', en: 'Enrol Athlete' },
  menu_dashboard: { kh: 'វិភាគទិន្នន័យ (Dashboard)', en: 'Analytics Dashboard' },
  menu_scoring: { kh: 'ផ្ទាំងបញ្ចូលពិន្ទុ (Scoring Panel)', en: 'Scoring Panel' },
  menu_settings: { kh: 'ការកំណត់ (Event Settings)', en: 'Event Settings' },
  menu_admin_signin: { kh: 'ចូលគ្រងប្រព័ន្ធ (Admin Sign In)', en: 'Admin Sign In' },
  status_upcoming: { kh: 'មិនទាន់ប្រកួត', en: 'Upcoming' },
  status_live: { kh: 'កំពុងប្រកួត (Live)', en: 'Live' },
  status_finished: { kh: 'បញ្ចប់ការប្រកួត', en: 'Finished' },
  select_sport: { kh: 'ជ្រើសរើសប្រភេទកីឡាសម្រាប់ការមើលលទ្ធផល / Select Sport To View Scores:', en: 'Select Sport to View Scores:' },
  scheduled_title: { kh: 'កាលវិភាគប្រកួត', en: 'Scheduled Matches' },
  athlete_name: { kh: 'ឈ្មោះពេញកីឡាករ', en: 'Athlete Full Name' },
  sport_type: { kh: 'ប្រភេទកីឡា', en: 'Sport Category' },

  // Live broadcast / spectator portal elements
  header_live_broadcasting: { kh: 'ផ្សាយផ្ទាល់ពីទីលាន', en: 'LIVE BROADCASTING' },
  header_spectator_deck: { kh: 'ផ្ទាំងទស្សនាលទ្ធផល', en: 'SPECTATOR DECK' },
  header_portal_khmer: { kh: 'មហាជនមើលពិន្ទុផ្ទាល់', en: 'SPECTATORS LIVE ACTION PORTAL' },
  header_portal_subtitle: { kh: 'ទទួលបានពិន្ទុថ្មីៗឥតឈប់ឈរ កាលវិភាគប្រកួត និងសកម្មភាពលេចធ្លោពីកីឡាករគ្រប់រូបក្នុងទីលានភ្លាមៗ។', en: 'Stay aligned with the continuous scoreboard, real-time sports updates, and celebrate the registered athletes delivering excellence across the arena.' },
  select_sport_filter: { kh: 'ជ្រើសរើសប្រភេទកីឡាដើម្បីមើល (Select Sport to Filter)', en: 'Select Sport Category to Filter' },
  all_sports_filter: { kh: 'វិញ្ញាសាទាំងអស់ (All Sports)', en: 'All Sports' },

  // Public Teams section
  team_rosters_title: { kh: 'បញ្ជីឈ្មោះក្រុម និងកីឡាករ (TEAM ROSTERS & ATHLETES)', en: 'TEAM ROSTERS & ATHLETES' },
  spectator_mode_subtitle: { kh: 'ស្វែងរក និងមើលព័ត៌មានក្រុម កីឡាករនៃវិញ្ញាសានីមួយៗ (Read-Only Spectator Mode)', en: 'Browse and view rosters easily (Read-Only Spectator Mode)' },
  total_athletes_badge: { kh: 'ចំនួនកីឡាករចុះឈ្មោះសរុប', en: 'Total Athletes Registered' },
  active_competitors: { kh: 'កីឡាករសកម្ម', en: 'Active Competitors' },
  search_placeholder: { kh: 'ស្វែងរកក្រុម ឬឈ្មោះកីឡាករ... (Search...)', en: 'Search teams or athletes...' },
  no_teams_found: { kh: 'រកមិនឃើញក្រុម ឬកីឡាករដែលអ្នកចង់ស្វែងរកទេ', en: 'No teams or athletes found match your search' },
  btn_upload_photo: { kh: 'ផ្ទុកឡើងរូបថត', en: 'Upload Photo' },
  btn_share_qr: { kh: 'ចែករំលែក QR', en: 'Share QR Code' },
  team_roster_members: { kh: 'សមាជិកក្រុមដែលបានចុះឈ្មោះ', en: 'Registered Team Members' },
  empty_roster_msg: { kh: 'មិនទាន់មានឈ្មោះសមាជិកនៅឡើយទេ (Roster Empty)', en: 'No members in this roster yet.' },
  scan_photo_upload: { kh: 'ស្កេន QR កូដ ដើម្បីផ្ទុករូបភាពកីឡាករ', en: 'Scan QR Code to Upload Athlete Photo' },
  scan_photo_inst: { kh: 'អ្នកអាចប្រើប្រាស់ទូរស័ព្ទដៃដើម្បីស្កេនរូបភាព QR នេះ ហើយថតរូបភាពផ្ទាល់ភ្លាមៗដើម្បីបង្ហាញនៅលើផ្ទាំងលទ្ធផល', en: 'Scan this QR code with a mobile device to capture and upload a photo instantly.' },

  // Enrolment registration form section
  enrol_title: { kh: 'ចុះឈ្មោះកីឡាករ (Athlete Enrollment)', en: 'Athlete Enrollment' },
  enrol_inst_title: { kh: 'ណែនាំការចុះឈ្មោះ (Instructions)', en: 'Registration Instructions' },
  enrol_inst_body: { kh: 'សូមបំពេញឈ្មោះពេញរបស់អ្នក ជ្រើសរើសប្រភេទកីឡាដែលអ្នកចង់លេង និងជ្រើសរើសក្រុមដែលទទួលបានការប្រកាសពីគណៈកម្មការ។', en: 'Please fill in your full name, select the sport event you want to compete in, and pick your assigned team.' },
  your_fullname: { kh: 'ឈ្មោះពេញរបស់អ្នក (Your Full Name)', en: 'Your Full Name' },
  fullname_placeholder: { kh: 'ឧ. សុខ ពិសិដ្ឋ', en: 'e.g. John Doe' },
  select_sport_event: { kh: 'ជ្រើសរើសប្រភេទកីឡា (Select Sport Event)', en: 'Select Sport Event' },
  select_sport_event_placeholder: { kh: '-- សូមជ្រើសរើសវិញ្ញាសាដែលចង់លេង --', en: '-- Please select a sport --' },
  choose_team: { kh: 'ជ្រើសរើសក្រុមលេង (Choose Your Team - Optional)', en: 'Choose Your Team (Optional)' },
  choose_team_placeholder_no_sport: { kh: '-- សូមជ្រើសរើសកីឡាជាមុនសិន --', en: '-- Please choose a sport first --' },
  choose_team_free_agent: { kh: 'មិនទាន់មានក្រុម (Free Agent / No Team)', en: 'Free Agent / No Team' },
  profile_photo_url: { kh: 'តំណភ្ជាប់រូបភាព Profile (Profile Photo URL - Optional)', en: 'Profile Photo URL (Optional)' },
  profile_photo_desc: { kh: 'អ្នកអាចប្រើប្រាស់តំណភ្ជាប់រូបភាពផ្ទាល់ខ្លួនពី Telegram, Google, Facebook ឬ Unsplash។', en: 'You can use image URLs from Telegram, Google, Facebook, or Unsplash.' },
  btn_submit_registration: { kh: 'បញ្ជូនព័ត៌មានចុះឈ្មោះ (Complete Registration)', en: 'Complete Registration' },
  submitting_registration: { kh: 'កំពុងបញ្ចូលទិន្នន័យ... (Submitting...)', en: 'Registration in progress...' },
  registration_success_title: { kh: 'ចុះឈ្មោះបានជោគជ័យ!', en: 'Registration Successful!' },
  registration_success_desc: { kh: 'ព័ត៌មានកីឡាកររក្សាទុករួចរាល់ (Athlete Registration Complete)', en: 'Athlete Registration Complete' },
  registration_success_body: { kh: 'អបអរសាទរ! ព័ត៌មានរបស់អ្នកត្រូវបានរក្សាទុកក្នុងបញ្ជីឈ្មោះកីឡាករផ្លូវការរួចរាល់ហើយ។', en: 'Congratulations! Your details have been successfully saved into the official athletes roster.' },
  btn_register_another: { kh: 'ចុះឈ្មោះសមាជិកម្នាក់ទៀត (Register Another member)', en: 'Register Another Competitor' },
  self_enrol_closed: { kh: 'ទម្រង់ចុះឈ្មោះកីឡាករដោយខ្លួនឯង ត្រូវបានបិទជាបណ្ដោះអាសន្ន។', en: 'Self-registration is currently closed by administration.' },
  sport_category: { kh: 'វិញ្ញាសាកីឡា៖', en: 'Sport category:' },
  team_assigned: { kh: 'ក្រុមលេង៖', en: 'Assigned Team:' },

  // Match result section
  congrats_victory: { kh: 'អបអរសាទរម្ចាស់ជ័យជំនះ!', en: 'Victory Celebration!' },
  winner_badge: { kh: 'ជ័យជម្នះ (Winner)', en: 'Winner' },
  declared_winner_msg: { kh: 'ត្រូវបានប្រកាសជាម្ចាស់ជ័យលាភីសម្រាប់ការប្រកួតនេះ!', en: 'is declared winner of this match!' },
  live_matches_title: { kh: 'ការប្រកួតកំពុងលេង (Live)', en: 'Live Matches' },
  finished_matches_title: { kh: 'ការប្រកួតដែលបានបញ្ចប់ (Finished)', en: 'Finished Matches' },
  upcoming_matches_title: { kh: 'ការប្រកួតនាពេលខាងមុខ (Upcoming)', en: 'Upcoming Fixtures' },
  no_live_matches: { kh: 'មិនទាន់មានការប្រកួតកំពុងលេង នាពេលបច្ចុប្បន្នទេ។', en: 'There are no live matches in play currently.' },
  no_finished_matches: { kh: 'មិនទាន់មានការប្រកួតដែលបានបញ្ចប់នៅឡើយទេ។', en: 'No matches have finished in this category yet.' },
  no_upcoming_matches: { kh: 'មិនទាន់មានការប្រកួតគ្រោងទុកនាពេលខាងមុខទេ។', en: 'No upcoming fixtures scheduled in this category.' }
};

export function getTranslatedText(
  key: string,
  defaultKh: string,
  defaultEn: string,
  currentLanguage: 'kh' | 'en' = 'kh',
  translations?: Record<string, { kh: string; en: string }>
): string {
  if (translations && translations[key]) {
    return currentLanguage === 'kh' ? translations[key].kh : translations[key].en;
  }
  return currentLanguage === 'kh' ? defaultKh : defaultEn;
}





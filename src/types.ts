export type SportType = 'Soccer' | 'Volleyball' | 'Pingpong' | 'Badminton' | 'Swimming' | string;

export interface Sport {
  name: string;
  khmerName: string;
  icon: string;
  scoringMethod: 'score' | 'measure';
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


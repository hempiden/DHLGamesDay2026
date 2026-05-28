export type SportType = 'Soccer' | 'Volleyball' | 'Pingpong' | 'Badminton' | 'Swimming';

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

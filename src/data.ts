import { Match, TeamStanding, SportConfig, SportType, Participant } from './types';

export const INITIAL_PARTICIPANTS: Participant[] = [
  // Soccer Teams
  { id: 'team-1', name: 'DHL Express Warriors', sport_type: 'Soccer', is_team: true, team_id: null },
  { id: 'team-2', name: 'DHL Supply Chain United', sport_type: 'Soccer', is_team: true, team_id: null },
  // Volleyball Teams
  { id: 'team-3', name: 'DHL Global Forwarding Titans', sport_type: 'Volleyball', is_team: true, team_id: null },
  { id: 'team-4', name: 'DHL eCommerce Flyers', sport_type: 'Volleyball', is_team: true, team_id: null },
  // Pingpong Teams
  { id: 'team-5', name: 'DHL IT Solutions CyberKnights', sport_type: 'Pingpong', is_team: true, team_id: null },
  { id: 'team-6', name: 'DHL Aviation Chargers', sport_type: 'Pingpong', is_team: true, team_id: null },

  // Soccer Players (Assigned)
  { id: 'player-1', name: 'Vichet Ly', sport_type: 'Soccer', is_team: false, team_id: 'team-1' },
  { id: 'player-2', name: 'Somnang Mean', sport_type: 'Soccer', is_team: false, team_id: 'team-1' },
  { id: 'player-3', name: 'Phanith Sok', sport_type: 'Soccer', is_team: false, team_id: 'team-1' },
  { id: 'player-4', name: 'Sopheap Oum', sport_type: 'Soccer', is_team: false, team_id: 'team-2' },
  { id: 'player-5', name: 'Kosal Chea', sport_type: 'Soccer', is_team: false, team_id: 'team-2' },
  { id: 'player-6', name: 'Dara Heng', sport_type: 'Soccer', is_team: false, team_id: 'team-2' },
  
  // Soccer Players - Unassigned (free agents for soccer)
  { id: 'player-7', name: 'Rithy Srun', sport_type: 'Soccer', is_team: false, team_id: null },
  { id: 'player-8', name: 'Piseth Chan', sport_type: 'Soccer', is_team: false, team_id: null },
  { id: 'player-9', name: 'Vuthy Nhim', sport_type: 'Soccer', is_team: false, team_id: null },

  // Volleyball Players
  { id: 'player-10', name: 'Khemara Seng', sport_type: 'Volleyball', is_team: false, team_id: 'team-3' },
  { id: 'player-11', name: 'Vandeth Meas', sport_type: 'Volleyball', is_team: false, team_id: 'team-3' },
  { id: 'player-12', name: 'Chanthou Lay', sport_type: 'Volleyball', is_team: false, team_id: 'team-4' },
  { id: 'player-13', name: 'Sokha Roth', sport_type: 'Volleyball', is_team: false, team_id: 'team-4' },
  { id: 'player-14', name: 'Nara Phoung', sport_type: 'Volleyball', is_team: false, team_id: null },

  // Pingpong Players
  { id: 'player-15', name: 'Sovanna Dy', sport_type: 'Pingpong', is_team: false, team_id: 'team-5' },
  { id: 'player-16', name: 'Vibol Bun', sport_type: 'Pingpong', is_team: false, team_id: null },
];


export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  Soccer: {
    name: 'Soccer',
    icon: '⚽',
    khmerName: 'បាល់ទាត់',
    color: 'from-emerald-500 to-teal-600',
  },
  Volleyball: {
    name: 'Volleyball',
    icon: '🏐',
    khmerName: 'បាល់ទះ',
    color: 'from-blue-500 to-indigo-600',
  },
  Pingpong: {
    name: 'Pingpong',
    icon: '🏓',
    khmerName: 'វាយកូនឃ្លីលើតុ',
    color: 'from-orange-500 to-red-500',
  },
  Badminton: {
    name: 'Badminton',
    icon: '🏸',
    khmerName: 'វាយសី',
    color: 'from-yellow-500 to-amber-600',
  },
  Swimming: {
    name: 'Swimming',
    icon: '🏊',
    khmerName: 'ហែលទឹក',
    color: 'from-sky-500 to-cyan-500',
  },
};

export const DEFAULT_TEAMS = [
  'DHL Express Warriors',
  'DHL Supply Chain United',
  'DHL Global Forwarding Titans',
  'DHL eCommerce Flyers',
  'DHL IT Solutions CyberKnights',
  'DHL Aviation Chargers',
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'match-1',
    sport_name: 'Soccer',
    match_label: 'វគ្គជម្រុះតាមពូល (Group Stage)',
    team_a: 'DHL Express Warriors',
    team_b: 'DHL Supply Chain United',
    score_a: 2,
    score_b: 1,
    status: 'Live',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'match-2',
    sport_name: 'Volleyball',
    match_label: 'វគ្គមុនផ្តាច់ព្រ័ត្រ (Semifinal)',
    team_a: 'DHL Global Forwarding Titans',
    team_b: 'DHL eCommerce Flyers',
    score_a: 15,
    score_b: 15,
    status: 'Live',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'match-3',
    sport_name: 'Pingpong',
    match_label: 'វគ្គផ្តាច់ព្រ័ត្រ (Grand Final)',
    team_a: 'DHL IT Solutions CyberKnights',
    team_b: 'DHL Aviation Chargers',
    score_a: 11,
    score_b: 9,
    status: 'Finished',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'match-4',
    sport_name: 'Badminton',
    match_label: 'វគ្គជម្រុះជុំទី១ (Round 1)',
    team_a: 'DHL Express Warriors',
    team_b: 'DHL Global Forwarding Titans',
    score_a: 0,
    score_b: 0,
    status: 'Upcoming',
    created_at: new Date(Date.now() + 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'match-5',
    sport_name: 'Swimming',
    match_label: 'វគ្គជម្រុះល្បឿន (Heats)',
    team_a: 'DHL Supply Chain United',
    team_b: 'DHL Aviation Chargers',
    score_a: 0,
    score_b: 0,
    status: 'Upcoming',
    created_at: new Date(Date.now() + 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Calculate Standings dynamically for a specific sport based on all finished matches
export function calculateStandings(matches: Match[], sport: SportType): TeamStanding[] {
  const standingsMap: Record<string, TeamStanding> = {};

  const finishedMatches = matches.filter(
    (m) => m.sport_name === sport && m.status === 'Finished'
  );

  // Initialize standings for all unique teams found or default teams
  const activeTeams = Array.from(
    new Set([
      ...DEFAULT_TEAMS,
      ...matches.filter((m) => m.sport_name === sport).flatMap((m) => [m.team_a, m.team_b]),
    ])
  );

  activeTeams.forEach((team) => {
    standingsMap[team] = {
      team_name: team,
      sport_name: sport,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      score_for: 0,
      score_against: 0,
    };
  });

  finishedMatches.forEach((m) => {
    const sA = m.score_a;
    const sB = m.score_b;

    if (!standingsMap[m.team_a]) {
      standingsMap[m.team_a] = {
        team_name: m.team_a,
        sport_name: sport,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        score_for: 0,
        score_against: 0,
      };
    }
    if (!standingsMap[m.team_b]) {
      standingsMap[m.team_b] = {
        team_name: m.team_b,
        sport_name: sport,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        score_for: 0,
        score_against: 0,
      };
    }

    const teamA = standingsMap[m.team_a];
    const teamB = standingsMap[m.team_b];

    teamA.played += 1;
    teamB.played += 1;
    teamA.score_for += sA;
    teamA.score_against += sB;
    teamB.score_for += sB;
    teamB.score_against += sA;

    if (sA > sB) {
      teamA.wins += 1;
      teamA.points += 3; // 3 points for win
      teamB.losses += 1;
    } else if (sB > sA) {
      teamB.wins += 1;
      teamB.points += 3;
      teamA.losses += 1;
    } else {
      teamA.draws += 1;
      teamB.draws += 1;
      teamA.points += 1; // 1 point for draw
      teamB.points += 1;
    }
  });

  return Object.values(standingsMap)
    .sort((a, b) => {
      // Sort criteria: Points primary, Goal/Score Difference secondary, Goals For tertiary
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.score_for - a.score_against;
      const diffB = b.score_for - b.score_against;
      if (diffB !== diffA) return diffB - diffA;
      return b.score_for - a.score_for;
    })
    .slice(0, 10); // Top 10
}

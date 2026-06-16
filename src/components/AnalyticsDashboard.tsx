import React, { useState, useMemo } from 'react';
import { Match, Participant, SportType } from '../types';
import { SPORT_CONFIGS, getSportConfig } from '../data';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  Heart, 
  Plus, 
  FolderMinus, 
  Search, 
  Sparkles, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  CheckCircle, 
  Bookmark, 
  HelpCircle,
  Inbox,
  TrendingUp,
  Award
} from 'lucide-react';

interface AnalyticsDashboardProps {
  matches: Match[];
  participants: Participant[];
  setActiveTab?: (tab: any) => void;
}

export default function AnalyticsDashboard({ matches, participants, setActiveTab }: AnalyticsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState<SportType | 'All'>('All');
  const [activeSubTab, setActiveSubTab] = useState<'kpis' | 'at_risk' | 'multi_sport' | 'sports_drill'>('kpis');

  // --- 1. COMPILE DATA AND STATISTICS ---

  // All active players (excluding team entities)
  const players = useMemo(() => {
    return participants.filter(p => !p.is_team);
  }, [participants]);

  // All unique team entities
  const teams = useMemo(() => {
    return participants.filter(p => p.is_team);
  }, [participants]);

  // Group players by Name to analyze multi-sport enrollment
  const playerGroupsByName = useMemo(() => {
    const groups: Record<string, Participant[]> = {};
    players.forEach(p => {
      const key = p.name.trim().toLowerCase();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(p);
    });
    return groups;
  }, [players]);

  // Unique players count
  const totalUniquePlayersCount = useMemo(() => {
    return Object.keys(playerGroupsByName).length;
  }, [playerGroupsByName]);

  // Multi-sport athletes list
  const multiSportAthletes = useMemo(() => {
    return Object.entries(playerGroupsByName)
      .filter(([_, group]) => group.length > 1)
      .map(([_, group]) => ({
        name: group[0].name,
        sports: group.map(p => p.sport_type),
        entries: group
      }))
      .sort((a, b) => b.sports.length - a.sports.length);
  }, [playerGroupsByName]);

  // At-Risk Players: Players NOT assigned to any team in team-based sports (Soccer, Volleyball, Pingpong, Badminton)
  const unassignedPlayers = useMemo(() => {
    return players.filter(p => {
      // Soccer, Volleyball, Pingpong, Badminton are team-based / require assignments
      const needsTeam = ['Soccer', 'Volleyball', 'Pingpong', 'Badminton'].includes(p.sport_type);
      return needsTeam && (!p.team_id || p.team_id === 'null' || p.team_id === '');
    });
  }, [players]);

  // Teams with no play schedule (not present in team_a or team_b of any match)
  const teamsWithNoMatches = useMemo(() => {
    return teams.filter(t => {
      const scheduled = matches.some(m => 
        m.team_a.trim().toLowerCase() === t.name.trim().toLowerCase() ||
        m.team_b.trim().toLowerCase() === t.name.trim().toLowerCase()
      );
      return !scheduled;
    });
  }, [teams, matches]);

  // Teams with very few players assigned
  const teamRosterDetails = useMemo(() => {
    return teams.map(t => {
      const roster = players.filter(p => p.team_id === t.id);
      let minRecommend = 2; // Default (e.g. Pingpong)
      if (t.sport_type === 'Soccer') minRecommend = 5;
      if (t.sport_type === 'Volleyball') minRecommend = 6;
      if (t.sport_type === 'Badminton') minRecommend = 2;

      return {
        team: t,
        playerCount: roster.length,
        players: roster,
        minRecommend,
        isUnderRostered: roster.length < minRecommend
      };
    });
  }, [teams, players]);

  const underRosteredTeamsCount = useMemo(() => {
    return teamRosterDetails.filter(tr => tr.isUnderRostered).length;
  }, [teamRosterDetails]);

  // Athletes completely without games scheduled
  // Let's analyze if an athlete's assigned team has NO matches, or if an individual sport player has NO matches
  const playersMissingMatches = useMemo(() => {
    return players.filter(p => {
      if (p.team_id && p.team_id !== 'null') {
        const team = teams.find(t => t.id === p.team_id);
        if (!team) return true;
        const hasMatch = matches.some(m => 
          m.team_a.trim().toLowerCase() === team.name.trim().toLowerCase() ||
          m.team_b.trim().toLowerCase() === team.name.trim().toLowerCase()
        );
        return !hasMatch;
      } else {
        // Individual sport players (Swimming, Badminton).
        // Let's see if their name is scheduled in any matches!
        const hasMatch = matches.some(m => 
          m.team_a.trim().toLowerCase() === p.name.trim().toLowerCase() ||
          m.team_b.trim().toLowerCase() === p.name.trim().toLowerCase()
        );
        return !hasMatch;
      }
    });
  }, [players, teams, matches]);

  // Overall Health Summary (0-100% score)
  const calculationHealthScore = useMemo(() => {
    if (players.length === 0) return 100;
    
    // Penalize for unassigned players, unscheduled teams, and under-rostered squads
    const unassignedPen = unassignedPlayers.length * 4;
    const unscheduledTeamPen = teamsWithNoMatches.length * 5;
    const underRosteredPen = underRosteredTeamsCount * 3;
    const noMatchesPlayerPen = playersMissingMatches.length * 2;

    const penalty = unassignedPen + unscheduledTeamPen + underRosteredPen + noMatchesPlayerPen;
    return Math.max(10, Math.min(100, 100 - penalty));
  }, [players, unassignedPlayers, teamsWithNoMatches, underRosteredTeamsCount, playersMissingMatches]);

  // --- 2. SPORT DRILL DOWN METRICS ---
  const sportDrillDown = useMemo(() => {
    return Object.keys(SPORT_CONFIGS).map(s => {
      const sport = s as SportType;
      const sportPlayers = players.filter(p => p.sport_type === sport);
      const sportTeams = teams.filter(t => t.sport_type === sport);
      const sportMatches = matches.filter(m => m.sport_name === sport);
      
      const unassignedInSport = sportPlayers.filter(p => {
        const isTeamSport = ['Soccer', 'Volleyball', 'Pingpong', 'Badminton'].includes(sport);
        return isTeamSport && (!p.team_id || p.team_id === 'null' || p.team_id === '');
      });

      return {
        sport,
        config: getSportConfig(sport),
        playersCount: sportPlayers.length,
        teamsCount: sportTeams.length,
        matchesCount: sportMatches.length,
        unassignedCount: unassignedInSport.length,
        completedMatches: sportMatches.filter(m => m.status === 'Finished').length
      };
    });
  }, [players, teams, matches]);

  // Filtered lists for rendering based on selectors
  const filteredAtRiskPlayers = useMemo(() => {
    return unassignedPlayers.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = selectedSportFilter === 'All' || p.sport_type === selectedSportFilter;
      return matchesSearch && matchesSport;
    });
  }, [unassignedPlayers, searchTerm, selectedSportFilter]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* HEADER SECTION WITH HERO METRIC BAR */}
      <div className="bg-gradient-to-r from-gray-900 to-[#1a1a1a] rounded-3xl p-6 sm:p-8 text-white shadow-xl border-b-4 border-[#FFCC00] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#FFCC00]/5 rounded-full blur-2xl"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#FFCC00] text-gray-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                បច្ចុប្បន្នភាពទិន្នន័យ (LIVE METRICS)
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black italic tracking-tight font-dhl-title uppercase">
              វិភាគលម្អិតការចុះឈ្មោះ ប្រគួត និងកីឡាករ (Tournament Analytics Engine)
            </h2>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              ឧបករណ៍សម្រាប់ត្រួតពិនិត្យ និងតាមដានរាល់ការចុះឈ្មោះរបស់អត្តពលិក និងក្រុមការងារ។ លោកអ្នកអាចស្វែងរកកីឡាករដែលមិនទាន់មានក្រុមប្រកួត ឬក្រុមដែលខ្វះគូប្រកួត ដើម្បីធានាថាគ្មានបុគ្គលិកណាម្នាក់ត្រូវបានខកខានឱកាសចូលរួមនោះឡើយ។
            </p>
          </div>

          {/* Tournament Health Ring */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 self-start lg:self-center">
            <div className="relative flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" className="stroke-white/10 text-white/10" strokeWidth="6" fill="transparent" />
                <circle cx="32" cy="32" r="28" 
                  className={`stroke-current ${
                    calculationHealthScore > 80 ? 'text-emerald-500' : calculationHealthScore > 50 ? 'text-amber-500' : 'text-red-500'
                  }`}
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={175} 
                  strokeDashoffset={175 - (175 * calculationHealthScore) / 100} 
                />
              </svg>
              <span className="absolute text-sm font-black tracking-tighter text-white">
                {calculationHealthScore}%
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">សុខភាពនៃការរៀបចំ</p>
              <h4 className="text-sm font-bold text-white uppercase">
                {calculationHealthScore > 80 ? 'Excellent Setup 🟢' : calculationHealthScore > 50 ? 'Needs Tweaks 🟡' : 'Critical Issues 🔴'}
              </h4>
              <p className="text-[9px] text-gray-300">
                {unassignedPlayers.length} unassigned &bull; {teamsWithNoMatches.length} idle teams
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic mini sub-tabs bar */}
        <div className="flex gap-2.5 mt-8 border-t border-white/10 pt-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('kpis')}
            className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'kpis'
                ? 'bg-[#FFCC00] text-gray-950 font-black'
                : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>ព័ត៌មានសង្ខេប (Overview Dashboard)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('at_risk')}
            className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'at_risk'
                ? 'bg-red-500 text-white font-black'
                : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>ផ្នែកប្រកាសអាសន្ន ({unassignedPlayers.length + teamsWithNoMatches.length + underRosteredTeamsCount} Alerts)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('multi_sport')}
            className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'multi_sport'
                ? 'bg-blue-600 text-white font-black'
                : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>កីឡាករលេងច្រើនវិញ្ញាសា ({multiSportAthletes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sports_drill')}
            className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'sports_drill'
                ? 'bg-emerald-600 text-white font-black'
                : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>វិភាគតាមប្រភេទកីឡា (Sport Sessions)</span>
          </button>
        </div>
      </div>

      {/* --- SUB-TAB 1: OVERVIEW & KEY PERFORMANCE INDICATORS --- */}
      {activeSubTab === 'kpis' && (
        <div className="space-y-8 animate-fade-in">
          {/* Main 4 Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex items-center gap-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-[#FFCC00]/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">កីឡាករដែលបានចុះឈ្មោះ</p>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{totalUniquePlayersCount}</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase">ពិតប្រាកដ (Unique Names)</p>
              </div>
            </div>

            <div className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4 transition ${
              unassignedPlayers.length > 0 ? 'border-red-100 bg-red-50/5 hover:shadow-md' : 'border-gray-150'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                unassignedPlayers.length > 0 ? 'bg-red-100/50' : 'bg-gray-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${unassignedPlayers.length > 0 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">អត់ទាន់មានក្រុមលេង</p>
                <h3 className={`text-2xl font-black tracking-tight ${unassignedPlayers.length > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {unassignedPlayers.length}
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase">នាក់ (Unassigned Athletes)</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex items-center gap-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">ការប្រកួតដែលបានរៀបចំ</p>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{matches.length}</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase">គូប្រកួត (Total Matches Scheduled)</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm flex items-center gap-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400">កីឡាករលេងច្រើនវិញ្ញាសា</p>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{multiSportAthletes.length}</h3>
                <p className="text-[9px] text-green-600 font-bold uppercase">ឆ្លងកាត់ការប្រកួត (CROSS-SPORT)</p>
              </div>
            </div>

          </div>

          {/* Graphical Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Roster Allocation status */}
            <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#D40511]" />
                  <span>ការបែងចែកកីឡាករទៅតាមក្រុមនីមួយៗ (Athletes Allocation Status)</span>
                </h3>
              </div>
              
              <div className="space-y-4 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-semibold">កីឡាករដែលបានចូលរួមក្នុងក្រុមយ៉ាងរឹងមាំ (Assigned and Ready)</span>
                  <span className="font-extrabold text-[#D40511]">{players.length - unassignedPlayers.length} / {players.length} នាក់</span>
                </div>
                
                {/* Visual Ratio Progress Bar */}
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden flex">
                  <div 
                    title="Assigned"
                    style={{ width: `${((players.length - unassignedPlayers.length) / (players.length || 1)) * 100}%` }}
                    className="bg-emerald-500 h-full duration-500"
                  ></div>
                  <div 
                    title="Unassigned"
                    style={{ width: `${(unassignedPlayers.length / (players.length || 1)) * 100}%` }}
                    className="bg-red-500 h-full animate-pulse duration-500"
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-black text-[10px] uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Assigned to Teams</span>
                    </div>
                    <p className="text-lg font-black text-emerald-800">
                      {((players.length - unassignedPlayers.length) / (players.length || 1) * 100).toFixed(0)}%
                    </p>
                    <p className="text-[9px] text-gray-400">បានចុះឈ្មោះ និងមានក្រុមរួចរាល់</p>
                  </div>
                  
                  <div className={`p-3.5 border rounded-xl space-y-1 ${
                    unassignedPlayers.length > 0 
                      ? 'bg-red-50/50 border-red-100' 
                      : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className={`flex items-center gap-1.5 font-black text-[10px] uppercase ${
                      unassignedPlayers.length > 0 ? 'text-red-700' : 'text-gray-500'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${unassignedPlayers.length > 0 ? 'bg-red-500 animate-ping' : 'bg-gray-400'}`}></span>
                      <span>Unassigned (At-Risk)</span>
                    </div>
                    <p className={`text-lg font-black ${unassignedPlayers.length > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                      {(unassignedPlayers.length / (players.length || 1) * 100).toFixed(0)}%
                    </p>
                    <p className="text-[9px] text-gray-400">គ្មានក្រុម - អាចខកខានការប្រកួត</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed flex gap-2.5 items-start">
                  <Heart className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>សុវត្ថិភាពកីឡា៖</strong> ដើម្បីធានាឱ្យមានគូប្រកួតគ្រប់គ្រាន់ និងដំណើរការដោយរលូន សូមប្រាកដថាអត្តពលិកទាំងអស់ក្នុងវិញ្ញាសាបាល់ទាត់ បាល់ទះ និងប៉េងប៉ុងត្រូវបានចាត់ចូលទៅក្នុងក្រុមជម្រើសរៀងៗខ្លួន។
                  </p>
                </div>
              </div>
            </div>

            {/* Quick action list for matching */}
            <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />
                    <span>សកម្មភាពរហ័សដែលត្រូវការ (Immediate Actions Required)</span>
                  </h3>
                </div>

                <div className="space-y-2.5 pt-3">
                  {unassignedPlayers.length > 0 ? (
                    <div className="flex gap-3 hover:bg-gray-50 p-2 rounded-xl transition items-start">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[10px] font-black flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div className="text-xs">
                        <h4 className="font-bold text-gray-800">ចាត់ចែងកីឡាករ {unassignedPlayers.length} នាក់ដែលគ្មានក្រុម</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Assign them immediately under "Teams & Athletes" menu so they don't get left behind.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 p-2 items-start text-emerald-500">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <p className="text-xs font-bold text-emerald-700">កីឡាករទាំងអស់មានក្រុមរៀងៗខ្លួនរួចរាល់! All players are allocated.</p>
                    </div>
                  )}

                  {teamsWithNoMatches.length > 0 ? (
                    <div className="flex gap-3 hover:bg-gray-50 p-2 rounded-xl transition items-start">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-[10px] font-black flex items-center justify-center shrink-0">
                        {unassignedPlayers.length > 0 ? 2 : 1}
                      </div>
                      <div className="text-xs">
                        <h4 className="font-bold text-gray-800">រៀបចំគូរប្រកួតសម្រាប់ក្រុមទំនេរចំនួន {teamsWithNoMatches.length}</h4>
                        <p className="text-[10px] text-gray-400 font-medium">These {teamsWithNoMatches.length} teams exist in list but have 0 scheduled games.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 p-2 items-start text-emerald-500">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <p className="text-xs font-bold text-emerald-700">គ្រប់ក្រុមទាំងអស់សុទ្ធតែមានសំបុត្រប្រកួត! All teams are scheduled.</p>
                    </div>
                  )}

                  {playersMissingMatches.length > 0 && (
                    <div className="flex gap-3 hover:bg-gray-50 p-2 rounded-xl transition items-start">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-[10px] font-black flex items-center justify-center shrink-0">
                        !
                      </div>
                      <div className="text-xs">
                        <h4 className="font-bold text-gray-800">កីឡាករ {playersMissingMatches.length} នាក់អត់មានគូដែលត្រូវប្រកួតទាល់តែសោះ</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Their team has no match scheduled, or they are single players missing a match event.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {setActiveTab && (
                <div className="border-t border-gray-100 pt-4 mt-6">
                  <button
                    onClick={() => setActiveTab('teams')}
                    className="w-full py-2.5 px-4 bg-[#D40511] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-red-600 cursor-pointer active:scale-95 transition text-center"
                  >
                    តស៊ូទៅកាន់ការគ្រប់គ្រងក្រុម (Go to Team & Athlete Manager)
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: AT-RISK ANALYSIS & ALERTS CENTER --- */}
      {activeSubTab === 'at_risk' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Filtering Header bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="ស្វែងរកឈ្មោះកីឡាករ... (Search names)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 duration-150 transition"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider self-center mr-1">Sport:</span>
              <button
                onClick={() => setSelectedSportFilter('All')}
                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase duration-150 transition cursor-pointer ${
                  selectedSportFilter === 'All' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {(Object.keys(SPORT_CONFIGS) as SportType[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSportFilter(s)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase duration-150 transition cursor-pointer ${
                    selectedSportFilter === s ? 'bg-[#D40511] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {SPORT_CONFIGS[s].icon} {SPORT_CONFIGS[s].khmerName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1: Unassigned Players (Free Agents) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm space-y-4 lg:col-span-1">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  <h3 className="font-black uppercase text-gray-800">កីឡាករគ្មានក្រុម ({filteredAtRiskPlayers.length})</h3>
                </div>
                <span className="text-[10px] bg-red-50 text-red-500 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  No Team Assigned
                </span>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                ខាងក្រោមនេះជាបញ្ជីឈ្មោះអ្នកដែលបានចុះឈ្មោះចង់លេងកីឡា ប៉ុន្តែមិនទាន់ត្រូវបានបញ្ចូលទៅក្នុងក្រុមណាមួយឡើយ៖
              </p>

              <div className="space-y-2 overflow-y-auto max-h-96 pr-1 custom-scrollbar">
                {filteredAtRiskPlayers.length > 0 ? (
                  filteredAtRiskPlayers.map(p => (
                    <div key={p.id} className="p-3 bg-red-50/20 border border-red-100 rounded-xl flex items-center justify-between hover:bg-red-50/40 transition">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800 text-[12px]">{p.name}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]">{getSportConfig(p.sport_type)?.icon}</span>
                          <span className="text-[9px] font-black uppercase text-gray-400">
                            {getSportConfig(p.sport_type)?.khmerName}
                          </span>
                        </div>
                      </div>

                      {setActiveTab && (
                        <button
                          onClick={() => setActiveTab('teams')}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[9px] rounded-lg tracking-wider transition cursor-pointer"
                        >
                          ចាត់ចែង (ASSIGN)
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-gray-200" />
                    <p className="text-[11px] font-bold">គ្មានកីឡាករណាខ្វះក្រុមទេ! (No unassigned players found)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Teams with 0 Schedule */}
            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm space-y-4 lg:col-span-1">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <h3 className="font-black uppercase text-gray-800">ក្រុមដែលគ្មានការប្រកួត ({teamsWithNoMatches.length})</h3>
                </div>
                <span className="text-[10px] bg-amber-50 text-amber-600 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  No Schedule
                </span>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                ខាងក្រោមនេះជាក្រុមដែលត្រូវបានបង្កើតឡើងរួច ប៉ុន្តែពុំទាន់មានប្រតិទិនការប្រកួតណាមួយនៅក្នុងរៀបចំការប្រកួតឡើយ៖
              </p>

              <div className="space-y-2 overflow-y-auto max-h-96 pr-1 custom-scrollbar">
                {teamsWithNoMatches.length > 0 ? (
                  teamsWithNoMatches.map(t => (
                    <div key={t.id} className="p-3 bg-amber-50/20 border border-amber-100 rounded-xl flex flex-col gap-2 hover:bg-amber-50/40 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800 text-[12px]">{t.name}</p>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight">
                            {getSportConfig(t.sport_type)?.icon} {getSportConfig(t.sport_type)?.khmerName}
                          </span>
                        </div>
                        {setActiveTab && (
                          <button
                            onClick={() => setActiveTab('admin')}
                            className="px-2 py-1 bg-amber-600 text-white font-bold uppercase text-[8px] rounded-md tracking-wider cursor-pointer hover:bg-amber-700"
                          >
                            + បង្កើតគូ (+ Match)
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-8 h-8 text-emerald-200" />
                    <p className="text-[11px] font-bold">គ្មានក្រុមទំនេរគ្មានការប្រកួតទេ! (All teams scheduled!)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Under-rostered Squads or Athletes missing matches */}
            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm space-y-4 lg:col-span-1">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <h3 className="font-black uppercase text-gray-800">ក្រុមខ្វះកីឡករ ឬខ្វះការលេង ({teamRosterDetails.filter(tr => tr.isUnderRostered).length})</h3>
                </div>
                <span className="text-[10px] bg-purple-50 text-purple-600 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Under-Rostered
                </span>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                ខាងក្រោមនេះជាក្រុមដែលមានកីឡាករចាត់តាំងតិចជាងការណែនាំ (បាល់ទាត់ {`>=`} 5 នាក់, បាល់ទះ {`>=`} 6 នាក់, ប៉េងប៉ុង/វាយសី {`>=`} 2 នាក់)៖
              </p>

              <div className="space-y-2 overflow-y-auto max-h-96 pr-1 custom-scrollbar">
                {teamRosterDetails.filter(tr => tr.isUnderRostered).length > 0 ? (
                  teamRosterDetails.filter(tr => tr.isUnderRostered).map(({ team, playerCount, minRecommend }) => (
                    <div key={team.id} className="p-3 bg-purple-50/20 border border-purple-100 rounded-xl flex items-center justify-between hover:bg-purple-50/40 transition">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800 text-[12px]">{team.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">
                          {getSportConfig(team.sport_type)?.icon} {getSportConfig(team.sport_type)?.khmerName}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-black text-purple-700">{playerCount} / {minRecommend} នាក់</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">លេងក្នុងរ៉ូស្ទឺ (Roster Size)</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-8 h-8 text-emerald-200" />
                    <p className="text-[11px] font-bold">គ្មានក្រុមខ្វះកីឡាករទេ! (All teams meet roster standards!)</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- SUB-TAB 3: MULTI-SPORT ATHLETES --- */}
      {activeSubTab === 'multi_sport' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm space-y-4 animate-fade-in text-xs">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider">
              បញ្ជីឈ្មោះកីឡាករចូលរួមច្រើនវិញ្ញាសា (Multi-Sport Registered Athletes)
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold tracking-wide">
              កីឡាករដែលមានការចុះឈ្មោះចូលរួមក្នុងវិញ្ញាសាលើសពី ១ ផ្សេងគ្នា។ នេះជួយឱ្យអ្នកចាត់ចែងការប្រកួតដើម្បីជៀសវាងការប៉ះទង្គិចម៉ោងប្រកួតរវាងគ្នាច្រើនពេក។
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {multiSportAthletes.length > 0 ? (
              multiSportAthletes.map((ath, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-indigo-50/20 to-blue-50/20 border border-blue-100 rounded-2xl hover:shadow-md transition duration-150 space-y-3">
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 font-black text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 text-[13px]">{ath.name}</h4>
                        <p className="text-[8px] text-gray-400 font-extrabold uppercase">លេខកូដកីឡាករ (Cross Enrollment)</p>
                      </div>
                    </div>
                    
                    <span className="bg-blue-600 text-white font-black text-[10px] tracking-tight px-2.5 py-1 rounded-full uppercase">
                      {ath.sports.length} SPORTS
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">វិញ្ញាសាដែលបានចុះឈ្មោះ (Sports lists):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ath.sports.map((sup, sidx) => (
                        <span key={sidx} className="bg-white border border-blue-200 text-gray-800 px-2 py-1 rounded-lg font-bold text-[10px] uppercase flex items-center gap-1 shadow-sm">
                          <span>{getSportConfig(sup)?.icon}</span>
                          <span>{getSportConfig(sup)?.khmerName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Sparkles className="w-10 h-10 text-gray-300" />
                <p className="text-[12px] font-bold">មិនទាន់មានកីឡាករណាបានចុះឈ្មោះលេងច្រើនផ្នែកជាមួយគ្នានៅឡើយទេ!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUB-TAB 4: SPORTS DRILL DOWN SESSIONS --- */}
      {activeSubTab === 'sports_drill' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sportDrillDown.map(({ sport, config, playersCount, teamsCount, matchesCount, unassignedCount, completedMatches }) => {
              const activeHealth = playersCount > 0 && matchesCount > 0;
              return (
                <div key={sport} className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm hover:shadow-md transition duration-150 flex flex-col justify-between space-y-4">
                  
                  {/* Card head */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${config.color} text-white flex items-center justify-center text-lg shadow-sm`}>
                        {config.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 text-[13px]">{config.khmerName}</h4>
                        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-tight">{config.name} Category</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      activeHealth ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {activeHealth ? 'Active 🟢' : 'Incomplete 🔴'}
                    </span>
                  </div>

                  {/* Statistics counts in visual grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-center space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-gray-400">កីឡាករ (Athletes)</span>
                      <h4 className="text-base font-black text-gray-800">{playersCount}</h4>
                    </div>

                    <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-center space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-gray-400">ក្រុម (Teams)</span>
                      <h4 className="text-base font-black text-gray-800">{teamsCount}</h4>
                    </div>

                    <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-center space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-gray-400">ការប្រកួត (Matches)</span>
                      <h4 className="text-base font-black text-gray-800">{matchesCount}</h4>
                    </div>
                  </div>

                  {/* Internal sub bar */}
                  <div className="space-y-2 pt-1 border-t border-gray-100/50">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-gray-400">ដំណើរការប្រកួត (Finished / Total Range):</span>
                      <span className="text-gray-705">{completedMatches} / {matchesCount} Matches Done</span>
                    </div>

                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${(completedMatches / (matchesCount || 1)) * 100}%` }}
                        className={`h-full bg-gradient-to-r ${config.color}`}
                      ></div>
                    </div>

                    {unassignedCount > 0 && (
                      <div className="bg-red-50 text-red-700 text-[10px] px-2.5 py-1.5 rounded-lg border border-red-100 flex items-center justify-between font-semibold">
                        <span>⚠️ កីឡាករ {unassignedCount} នាក់អត់ក្រុម!</span>
                        <span className="text-[9px] font-black underline uppercase">រង់ចាំចាត់ចែង</span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { Users, Search, HelpCircle, Trophy, User, ArrowRight, QrCode, X, Copy, ExternalLink } from 'lucide-react';
import { Participant, SportType, Match } from '../types';
import { SPORT_CONFIGS } from '../data';

interface PublicTeamsViewProps {
  participants: Participant[];
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  isSupabaseEnabled?: boolean;
  matches?: Match[];
  currentLanguage?: 'kh' | 'en';
}

export default function PublicTeamsView({
  participants,
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseEnabled,
  matches = [],
  currentLanguage = 'kh',
}: PublicTeamsViewProps) {
  const [selectedSport, setSelectedSport] = useState<SportType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQRPlayer, setSelectedQRPlayer] = useState<Participant | null>(null);
  const [copied, setCopied] = useState(false);

  const getUploadUrl = (player: Participant) => {
    const baseUrl = `${window.location.origin}/?upload_photo_for=${player.id}`;
    if (isSupabaseEnabled && supabaseUrl && supabaseAnonKey) {
      return `${baseUrl}&s_url=${encodeURIComponent(supabaseUrl)}&s_key=${encodeURIComponent(supabaseAnonKey)}&s_enabled=true`;
    }
    return baseUrl;
  };

  // Extract all official teams (is_team === true) combined with individual sport participants who are listed in matches
  const allTeams = React.useMemo(() => {
    const teams = participants.filter((p) => p.is_team);
    
    const individualSports: SportType[] = ['Swimming', 'Badminton', 'Pingpong'];
    const individualTeams = participants.filter((p) => {
      if (p.is_team) return false;
      if (!individualSports.includes(p.sport_type)) return false;
      
      // Check if they are added in any match setup
      return matches.some((m) => {
        if (m.sport_name !== p.sport_type) return false;
        
        if (m.sport_name === 'Swimming') {
          try {
            let list: { id: string; name: string }[] = [];
            if (typeof m.team_a === 'object' && m.team_a !== null) {
              list = m.team_a as any;
            } else if (typeof m.team_a === 'string') {
              if (m.team_a.trim().startsWith('[')) {
                list = JSON.parse(m.team_a);
              } else {
                list = m.team_a.split(',').map((name, i) => ({ id: `swimmer-${i}-${name}`, name: name.trim() }));
              }
            }
            return list.some(sw => sw.id === p.id || sw.name.toLowerCase() === p.name.toLowerCase());
          } catch (e) {
            return false;
          }
        } else {
          const matchA = typeof m.team_a === 'string' ? m.team_a : '';
          const matchB = typeof m.team_b === 'string' ? m.team_b : '';
          return matchA.toLowerCase() === p.name.toLowerCase() || matchB.toLowerCase() === p.name.toLowerCase();
        }
      });
    }).map((p) => ({
      ...p,
      is_team: true, // Treat as team for layout in this view
      is_single_player: true,
    }));
    
    return [...teams, ...individualTeams];
  }, [participants, matches]);

  // Filter based on sport and search query
  const filteredTeams = allTeams.filter((team: any) => {
    // Sport Filter
    const matchesSport = selectedSport === 'All' || team.sport_type === selectedSport;

    if (!matchesSport) return false;

    // Search query can match team name OR any of its active member names
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const matchesTeamName = team.name.toLowerCase().includes(query);
    
    // Find athletes of this team
    const teamMembers = team.is_single_player 
      ? [{ ...team, is_team: false }]
      : participants.filter((p) => !p.is_team && p.team_id === team.id);
    const matchesAnyMember = teamMembers.some((member) =>
      member.name.toLowerCase().includes(query)
    );

    return matchesTeamName || matchesAnyMember;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-[#FFCC00]/20 text-[#D40511] font-black text-[10px] uppercase tracking-wider">
            ទិដ្ឋភាពទូទៅសម្រាប់មហាជន (Spectator Arena)
          </span>
          <h2 className="font-dhl-title text-2xl text-[#D40511] italic tracking-tight mt-1">
            បញ្ជីឈ្មោះក្រុម និងកីឡាករ (TEAM ROSTERS & ATHLETES)
          </h2>
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">
            ស្វែងរក និងមើលព័ត៌មានក្រុម កីឡាករនៃវិញ្ញាសានីមួយៗ (Read-Only Spectator Mode)
          </p>
        </div>
        
        {/* Dynamic overall stats badge */}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl shadow-inner">
          <Users className="w-5 h-5 text-[#D40511]" />
          <div className="text-left leading-none">
            <span className="text-xs text-gray-400 font-bold block uppercase">Total Athletes registered</span>
            <span className="text-sm font-black text-gray-800">
              {participants.filter(p => !p.is_team).length} Active Competitors
            </span>
          </div>
        </div>
      </div>

      {/* Sport Selector Filters & Search Bar combo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Sport selection filters sidebar/row */}
        <div className="lg:col-span-8 flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          <button
            onClick={() => setSelectedSport('All')}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 transform active:scale-95 select-none whitespace-nowrap cursor-pointer border-2 ${
              selectedSport === 'All'
                ? 'bg-[#FFCC00] text-gray-950 border-[#FFCC00] shadow-md'
                : 'bg-white text-gray-500 hover:bg-gray-100 border-gray-100'
            }`}
          >
            <span>🏆</span>
            <span>វិញ្ញាសាទាំងអស់ (All Sports)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
              selectedSport === 'All' ? 'bg-gray-950 text-[#FFCC00]' : 'bg-gray-100 text-gray-400'
            }`}>
              {allTeams.length}
            </span>
          </button>

          {(Object.keys(SPORT_CONFIGS) as SportType[]).map((sportKey) => {
            const config = SPORT_CONFIGS[sportKey];
            const isSelected = selectedSport === sportKey;
            const count = allTeams.filter(t => t.sport_type === sportKey).length;
            return (
              <button
                key={sportKey}
                onClick={() => setSelectedSport(sportKey)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 transform active:scale-95 select-none whitespace-nowrap cursor-pointer border-2 ${
                  isSelected
                    ? 'bg-[#FFCC00] text-gray-950 border-[#FFCC00] shadow-md'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border-gray-100'
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.khmerName} ({sportKey})</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  isSelected ? 'bg-gray-950 text-[#FFCC00]' : 'bg-gray-100 text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input bar */}
        <div className="lg:col-span-4 relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="ស្វែងរកក្រុម ឬឈ្មោះកីឡាករ... (Search...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 pl-10 pr-4 py-3 rounded-2xl font-bold text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent transition-all shadow-sm"
          />
        </div>

      </div>

      {/* Grid of Team Cards */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <HelpCircle className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="font-extrabold text-sm text-gray-700 uppercase">រកមិនឃើញក្រុមដែលត្រូវគ្នាទេ</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">
            No matching team rosters found. Try revising your team search keyword or choosing different division filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team: any) => {
            // Find active athletes rostered to this team
            const members = team.is_single_player
              ? [{ ...team, is_team: false }]
              : participants.filter((p) => !p.is_team && p.team_id === team.id);
            const sportCfg = SPORT_CONFIGS[team.sport_type] || {
              icon: '🛡️',
              khmerName: 'មិនស្គាល់',
              color: 'from-gray-500 to-gray-600',
            };

            return (
              <div
                key={team.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Team Card Banner Photo or Sport Default Gradient */}
                <div className="relative h-28 shrink-0 overflow-hidden">
                  {team.photo_url ? (
                    <>
                      <img
                        src={team.photo_url}
                        alt={team.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${sportCfg.color}`} />
                  )}

                  {/* Absolute badging over team banner */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div className="text-left">
                      <span className="px-2 py-0.5 rounded-full bg-white text-gray-950 text-[8px] font-black uppercase tracking-wider">
                        {sportCfg.icon} {team.sport_type} Division
                      </span>
                      <h3 className="text-white font-extrabold text-sm sm:text-base mt-1.5 drop-shadow-sm leading-tight group-hover:text-[#FFCC00] transition-colors">
                        {team.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Body section containing member list */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        បញ្ជីឈ្មោះសមាជិក (Team Athletes)
                      </span>
                      <span className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 text-[10px] font-black tracking-tighter">
                        {members.length} Players
                      </span>
                    </div>

                    {/* Member athletes list */}
                    <div className="space-y-1.5 max-h-[178px] overflow-y-auto no-scrollbar pr-1">
                      {members.length === 0 ? (
                        <div className="py-6 text-center text-gray-400">
                          <p className="text-[10px] font-bold uppercase tracking-wider">មិនទាន់មានសមាជិក</p>
                          <p className="text-[9px] text-gray-400 leading-tight">No participants registered under this squad yet.</p>
                        </div>
                      ) : (
                        members.map((m, idx) => (
                          <div
                            key={m.id}
                            onClick={() => setSelectedQRPlayer(m)}
                            className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-[#FFCC00]/10 rounded-xl border border-gray-100/50 hover:border-[#FFCC00]/60 transition group cursor-pointer"
                            title="ကျေးဇူးပြု၍ နှိပ်ပါ - Scan QR to upload photo"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Icon or mini avatar */}
                              {m.photo_url ? (
                                <img
                                  src={m.photo_url}
                                  alt={m.name}
                                  className="w-6 h-6 rounded-lg object-cover border border-gray-200 shadow-inner shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-amber-50 group-hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center justify-center font-bold text-[#D40511] shrink-0 transition">
                                  <QrCode className="w-3.5 h-3.5 text-[#D40511]" />
                                </div>
                              )}
                              
                              <span className="font-extrabold text-xs text-gray-800 line-clamp-1 group-hover:text-[#D40511] transition-colors">
                                {m.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[8px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider group-hover:bg-[#FFCC00] group-hover:text-gray-950 transition-colors">
                                SCAN QR
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Footing note reminding reader of Read-Only status */}
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-150 flex items-center justify-between text-gray-400 text-[9px]">
                    <span className="font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified Team
                    </span>
                    <span className="font-semibold uppercase tracking-wider text-right">
                      Read-Only Mode
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* QR SCAN OVERLAY MODAL */}
      {selectedQRPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border-4 border-[#FFCC00] shadow-2xl max-w-sm w-full p-6 text-center space-y-5 relative font-sans">
            
            {/* Absolute Close button */}
            <button
              onClick={() => {
                setSelectedQRPlayer(null);
                setCopied(false);
              }}
              className="absolute top-4 right-4 bg-gray-150 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full p-1.5 transition active:scale-90 cursor-pointer border"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="px-2.5 py-1 rounded-full bg-[#D40511]/10 text-[#D40511] font-black text-[9px] uppercase tracking-wider">
                ហ្វូតូកាប៊ីន (FACE SHOT PORTAL)
              </span>
              <h3 className="font-dhl-title text-lg text-gray-900 italic mt-1.5 leading-tight uppercase">
                ស្កែនដើម្បីបញ្ចូលរូបថត
              </h3>
              <p className="text-gray-400 text-[9px] font-bold uppercase mt-0.5">
                Scan to upload profile photo for:
              </p>
              <h4 className="font-black text-gray-950 text-xs sm:text-sm mt-2 bg-[#FFCC00]/30 py-1 px-4.5 rounded-full inline-block border border-[#FFCC00]/50 shadow-sm">
                {selectedQRPlayer.name} ({selectedQRPlayer.sport_type})
              </h4>
            </div>

            {/* QR Code image API rendering */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 inline-block mx-auto shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  getUploadUrl(selectedQRPlayer)
                )}`}
                alt="Athlete QR Scan"
                className="w-40 h-40 object-contain mx-auto"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-gray-600 leading-normal max-w-xs mx-auto font-bold">
                សូមស្កែន QR កូដនេះជាមួយទូរស័ព្ទរបស់អ្នក ដើម្បីថតរូប ឬបញ្ចូលរូបថតផ្ទាល់ខ្លួន ដោយមិនបាច់ត្រូវការ Login ឡើយ។
                <br />
                <span className="text-[9.5px] text-gray-400 font-medium inline-block mt-1">
                  (Scan with smartphone camera to open secure player photo uploader.)
                </span>
              </p>

              {/* Copy Link Button / Direct Go to */}
              <div className="flex gap-2 justify-center pt-1.5">
                <button
                  onClick={() => {
                    const url = getUploadUrl(selectedQRPlayer);
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-250 bg-gray-50 hover:bg-gray-100 text-[10.5px] font-black text-gray-700 uppercase tracking-wide transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5 text-[#D40511]" />
                  <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                </button>

                <a
                  href={getUploadUrl(selectedQRPlayer)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D40511] hover:bg-red-700 text-white text-[10.5px] font-black uppercase tracking-wide transition active:scale-95 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#FFCC00]" />
                  <span>Upload Now</span>
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-gray-150 flex items-center justify-center gap-1 text-[9px] text-gray-400 font-extrabold uppercase tracking-widest leading-none">
              <span className="text-[#FFCC00] font-sans">★</span> Excellence. Simply delivered.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { Match, SportType, Participant } from '../types';
import { DEFAULT_TEAMS, SPORT_CONFIGS } from '../data';
import { Plus, Undo, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  matches: Match[];
  participants: Participant[];
  addMatch: (match: Omit<Match, 'id' | 'created_at' | 'updated_at'>) => void;
  updateMatchStatus: (id: string, status: 'Upcoming' | 'Live' | 'Finished') => void;
  deleteMatch: (id: string) => void;
  resetToDefault: () => void;
}

export default function AdminPanel({
  matches,
  participants,
  addMatch,
  updateMatchStatus,
  deleteMatch,
  resetToDefault,
}: AdminPanelProps) {
  
  // Form states
  const [sport, setSport] = useState<SportType>('Soccer');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [matchLabel, setMatchLabel] = useState('វគ្គជម្រុះតាមពូល (Group Stage)');
  const [status, setStatus] = useState<'Upcoming' | 'Live' | 'Finished'>('Live');

  // Filter registered teams from the participants table corresponding to the active sport category
  const registeredTeamsFiltered = participants.filter((p) => p.is_team && p.sport_type === sport);
  
  // If there are no team participants for this sport, offer ALL team participants in database, or finally default to DEFAULT_TEAMS
  const availableTeamNamesList = registeredTeamsFiltered.length > 0
    ? registeredTeamsFiltered.map((p) => p.name)
    : participants.filter((p) => p.is_team).length > 0
    ? participants.filter((p) => p.is_team).map((p) => p.name)
    : DEFAULT_TEAMS;
  
  // Custom teams toggle
  const [customTeamA, setCustomTeamA] = useState(false);
  const [customTeamB, setCustomTeamB] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalA = teamA.trim() || availableTeamNamesList[0];
    const finalB = teamB.trim() || (availableTeamNamesList[1] || availableTeamNamesList[0]);

    if (finalA === finalB) {
      alert('ក្រុមទាំង២ មិនអាចដូចគ្នាបានឡើយ! Please choose distinct teams.');
      return;
    }

    addMatch({
      sport_name: sport,
      match_label: matchLabel,
      team_a: finalA,
      team_b: finalB,
      score_a: 0,
      score_b: 0,
      status,
    });

    // Reset simple form inputs
    setTeamA('');
    setTeamB('');
    alert('ការប្រកួតត្រូវបានបង្កើត! Match created successfully.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Centered and styled Module 1 container */}
      <div className="max-w-3xl mx-auto">
        
        {/* MODULE 1: CREATE NEW MATCH */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Plus className="w-5 h-5 text-[#D40511]" />
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
              បង្កើតការប្រកួតថ្មី (Create New Match)
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Sport Select */}
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">
                ប្រភេទកីឡា (Sport Category)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(SPORT_CONFIGS) as SportType[]).map((name) => {
                  const conf = SPORT_CONFIGS[name];
                  const selected = sport === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSport(name)}
                      className={`py-2 px-1.5 rounded-xl border-2 text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        selected
                          ? 'border-[#FFCC00] bg-yellow-50/20 text-gray-900 font-extrabold'
                          : 'border-gray-100 bg-gray-50/50 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{conf.icon}</span>
                      <span className="text-[9px] leading-none truncate w-full">{conf.khmerName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team A Picker */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  ក្រុមទី ១ (TEAM A)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomTeamA(!customTeamA);
                    setTeamA('');
                  }}
                  className="text-[9px] font-bold text-[#D40511] hover:underline cursor-pointer"
                >
                  {customTeamA ? '← ជ្រើសរើសពីបញ្ជី' : '+ បញ្ចូលឈ្មោះដោយខ្លួនឯង'}
                </button>
              </div>
              
              {customTeamA ? (
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ DHL Global Office"
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] outline-none placeholder:text-gray-300 font-medium"
                />
              ) : (
                <select
                  value={teamA || availableTeamNamesList[0] || ''}
                  onChange={(e) => setTeamA(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] outline-none font-bold text-gray-700 bg-gray-50/50"
                >
                  {availableTeamNamesList.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Team B Picker */}
            <div className="space-y-1 col-span-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  ក្រុមទី ២ (TEAM B)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomTeamB(!customTeamB);
                    setTeamB('');
                  }}
                  className="text-[9px] font-bold text-[#D40511] hover:underline cursor-pointer"
                >
                  {customTeamB ? '← ជ្រើសរើសពីបញ្ជី' : '+ បញ្ចូលឈ្មោះដោយខ្លួនឯង'}
                </button>
              </div>

              {customTeamB ? (
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ DHL Custom Express"
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] outline-none placeholder:text-gray-300 font-medium"
                />
              ) : (
                <select
                  value={teamB || (availableTeamNamesList[1] || availableTeamNamesList[0] || '')}
                  onChange={(e) => setTeamB(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] outline-none font-bold text-gray-700 bg-gray-50/50"
                >
                  {availableTeamNamesList.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Match Label */}
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">
                វគ្គប្រកួត (Match Label)
              </label>
              <input
                type="text"
                required
                placeholder="ឧទាហរណ៍៖ វគ្គផ្តាច់ព្រ័ត្រ"
                value={matchLabel}
                onChange={(e) => setMatchLabel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] outline-none font-medium"
              />
            </div>

            {/* Match Status option */}
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">
                ស្ថានភាពចាប់ផ្តើម (Match status)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Upcoming', 'Live', 'Finished'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-2 px-3 border border-gray-200 rounded-xl font-bold cursor-pointer transition ${
                      status === s
                        ? 'bg-[#1a1a1a] border-black text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4.5 bg-[#D40511] hover:bg-red-700 text-white font-extrabold text-[13px] uppercase tracking-wide rounded-2xl active:scale-95 duration-150 transition-all shadow-md shadow-[#D40511]/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>បញ្ចូលការប្រកួត (Submit Match)</span>
            </button>
          </form>
        </div>
      </div>

      {/* MODULE 3: ACTIVE TOURNAMENT MATCH MANAGEMENT PANEL & QUICK STATE CONTROLLIONS */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4.5 h-4.5 text-amber-500" />
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
              គ្រប់គ្រងការប្រកួតទាំងអស់ (Match Roster)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reset-simulation-data"
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-red-50 text-[#D40511] border border-red-100 rounded-xl hover:bg-red-100 active:scale-95 transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>កំណត់ឡើងវិញ (Reset Seed Data)</span>
            </button>
          </div>
        </div>

        {/* Warning Alert reset modal */}
        {showResetConfirm && (
          <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-black text-amber-800">តើអ្នកពិតជាចង់កំណត់ទិន្នន័យឡើងវិញមែនទេ?</h4>
                <p className="text-amber-600 mt-0.5 max-w-xl">
                  វានឹងលុបលុបការកែប្រែទាំងអស់ដែលអ្នកបានបង្កើត ហើយជំនួសដោយការប្រកួតគំរូដើមវិញ។
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  resetToDefault();
                  setShowResetConfirm(false);
                }}
                className="px-3.5 py-1.5 bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-amber-800"
              >
                ច្បាស់ជាលុប (Confirm)
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 bg-white border rounded-lg text-[10px] font-bold text-gray-500 cursor-pointer hover:bg-gray-50"
              >
                ទេ (No)
              </button>
            </div>
          </div>
        )}

        {/* List of overall matches table */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                <th className="py-3 px-4">ប្រភេទកីឡា (Sport)</th>
                <th className="py-3 px-4 text-center">វគ្គប្រកួត (Label)</th>
                <th className="py-3 px-4">ក្រុមទី១ (TEAM A)</th>
                <th className="py-3 px-4 text-center">ពិន្ទុ (Score)</th>
                <th className="py-3 px-4">ក្រុមទី២ (TEAM B)</th>
                <th className="py-3 px-4 text-center">ស្ថានភាព (Status)</th>
                <th className="py-3 px-4 text-center w-24">ជម្រើស (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matches.map((m) => {
                const config = SPORT_CONFIGS[m.sport_name];
                return (
                  <tr key={m.id} className="hover:bg-gray-50/30 transition">
                    
                    {/* Sport name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{config?.icon}</span>
                        <span className="font-bold text-gray-800">{m.sport_name}</span>
                      </div>
                    </td>

                    {/* Format Label */}
                    <td className="py-3 px-4 text-center text-[10px] font-black text-gray-400 uppercase">
                      {m.match_label}
                    </td>

                    {/* Team A */}
                    <td className="py-3 px-4 font-black uppercase text-gray-700">
                      {m.team_a}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-900 rounded-lg font-mono font-black select-all">
                        <span>{m.score_a}</span>
                        <span>:</span>
                        <span>{m.score_b}</span>
                      </div>
                    </td>

                    {/* Team B */}
                    <td className="py-3 px-4 font-black uppercase text-gray-700">
                      {m.team_b}
                    </td>

                    {/* Stat switch controls */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex gap-1 bg-gray-100 p-1 rounded-xl">
                        {(['Upcoming', 'Live', 'Finished'] as const).map((st) => {
                          const actStatus = m.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => updateMatchStatus(m.id, st)}
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer select-none ${
                                actStatus
                                  ? st === 'Live'
                                    ? 'bg-[#D40511] text-white shadow-xs'
                                    : st === 'Finished'
                                    ? 'bg-black text-white'
                                    : 'bg-yellow-500 text-[#1a1a1a]'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Actions delete */}
                    <td className="py-3 px-4 text-center">
                      {confirmDeleteId === m.id ? (
                        <div className="flex items-center justify-center gap-1.5 animate-fade-in">
                          <button
                            type="button"
                            onClick={() => {
                              deleteMatch(m.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-[9px] uppercase tracking-wider scale-95 duration-100 cursor-pointer shadow-sm"
                          >
                            លុប (Yes)
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-black text-[9px] uppercase tracking-wider scale-95 duration-100 cursor-pointer text-gray-650"
                          >
                            ទេ (No)
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(m.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 active:scale-90 transition cursor-pointer"
                          title="Delete Match"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

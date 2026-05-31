import React, { useState } from 'react';
import { Match, SportType, Participant } from '../types';
import { DEFAULT_TEAMS, SPORT_CONFIGS, getSportConfig, getActiveSports } from '../data';
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
  const [sport, setSport] = useState<SportType>(() => getActiveSports()[0] || 'Soccer');
  const [playMode, setPlayMode] = useState<'team' | 'single'>('team');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [matchLabel, setMatchLabel] = useState('វគ្គជម្រុះតាមពូល (Group Stage)');
  const [status, setStatus] = useState<'Upcoming' | 'Live' | 'Finished'>('Live');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Custom teams toggle
  const [customTeamA, setCustomTeamA] = useState(false);
  const [customTeamB, setCustomTeamB] = useState(false);

  // Memoize available team names list to prevent duplicates and keep reference stable
  const availableTeamNamesList = React.useMemo(() => {
    const registeredTeamsFiltered = participants.filter((p) => p.is_team && p.sport_type === sport);
    const rawTeamNames = registeredTeamsFiltered.length > 0
      ? registeredTeamsFiltered.map((p) => p.name)
      : participants.filter((p) => p.is_team).length > 0
      ? participants.filter((p) => p.is_team).map((p) => p.name)
      : DEFAULT_TEAMS;

    return Array.from(new Set(
      rawTeamNames
        .map(name => name?.trim())
        .filter(Boolean)
    ));
  }, [participants, sport]);

  // Memoize available athlete names list to prevent duplicates and keep reference stable
  const availableAthleteNamesList = React.useMemo(() => {
    const registeredAthletesFiltered = participants.filter((p) => !p.is_team && p.sport_type === sport);
    const rawAthleteNames = registeredAthletesFiltered.length > 0
      ? registeredAthletesFiltered.map((p) => p.name)
      : participants.filter((p) => !p.is_team).length > 0
      ? participants.filter((p) => !p.is_team).map((p) => p.name)
      : ['ហែម ពីដែន (Piden Hem)', 'សុខ ម៉េង (Sok Meng)', 'លី ណារ៉ូ (Ly Naro)'];

    return Array.from(new Set(
      rawAthleteNames
        .map(name => name?.trim())
        .filter(Boolean)
    ));
  }, [participants, sport]);

  // Keep teamA and teamB synchronized with the available options when sport or playMode changes
  React.useEffect(() => {
    if (!customTeamA) {
      const currentList = playMode === 'single' ? availableAthleteNamesList : availableTeamNamesList;
      setTeamA(currentList[0] || '');
    }
  }, [sport, playMode, customTeamA, availableTeamNamesList, availableAthleteNamesList]);

  React.useEffect(() => {
    if (!customTeamB) {
      const currentList = playMode === 'single' ? availableAthleteNamesList : availableTeamNamesList;
      setTeamB(currentList[1] || currentList[0] || '');
    }
  }, [sport, playMode, customTeamB, availableTeamNamesList, availableAthleteNamesList]);
  
  // Hooks for swimming sport
  const [swimmerSlots, setSwimmerSlots] = useState<{ id: string; name: string; isCustom: boolean }[]>([
    { id: 'lane-1', name: '', isCustom: false },
    { id: 'lane-2', name: '', isCustom: false },
    { id: 'lane-3', name: '', isCustom: false },
    { id: 'lane-4', name: '', isCustom: false }
  ]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sport === 'Swimming') {
      const activeSwimmers = swimmerSlots
        .map(s => s.name.trim())
        .filter(Boolean);

      if (activeSwimmers.length === 0) {
        alert('សូមបញ្ចូលឈ្មោះកីឡាករយ៉ាងហោចណាស់ម្នាក់! At least 1 swimmer is required.');
        return;
      }

      // Check for duplicates
      const uniqueSwimmers = new Set(activeSwimmers);
      if (uniqueSwimmers.size !== activeSwimmers.length) {
        alert('ឈ្មោះកីឡាករមិនអាចដូចគ្នាបានឡើយ! Swimmers must have unique names.');
        return;
      }

      const registeredSwimmers = participants.filter((p) => !p.is_team && p.sport_type === 'Swimming');
      const swimmersData = swimmerSlots
        .filter(s => s.name.trim() !== '')
        .map((s, idx) => {
          const matchParticipant = registeredSwimmers.find(p => p.name === s.name);
          return {
            id: matchParticipant?.id || `sw-custom-${idx}-${Date.now()}`,
            name: s.name.trim()
          };
        });

      addMatch({
        sport_name: 'Swimming',
        match_label: matchLabel,
        team_a: JSON.stringify(swimmersData),
        team_b: JSON.stringify({ start_time: null, is_running: false, times: {} }),
        score_a: 0,
        score_b: 0,
        status,
        scheduled_date: scheduledDate || undefined,
        scheduled_time: scheduledTime || undefined,
      });

      alert('ការប្រកួតហែលទឹកត្រូវបានបង្កើត! Swimming heat created successfully.');
      setSwimmerSlots([
        { id: 'lane-1', name: '', isCustom: false },
        { id: 'lane-2', name: '', isCustom: false },
        { id: 'lane-3', name: '', isCustom: false },
        { id: 'lane-4', name: '', isCustom: false }
      ]);
      setScheduledDate('');
      setScheduledTime('');
      return;
    }

    const currentList = playMode === 'single' ? availableAthleteNamesList : availableTeamNamesList;
    const finalA = teamA.trim() || currentList[0] || '';
    const finalB = teamB.trim() || (currentList[1] || currentList[0] || '');

    if (finalA === finalB) {
      alert(playMode === 'single' ? 'កីឡាករទាំង២ មិនអាចដូចគ្នាបានឡើយ! Please choose distinct players.' : 'ក្រុមទាំង២ មិនអាចដូចគ្នាបានឡើយ! Please choose distinct teams.');
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
      scheduled_date: scheduledDate || undefined,
      scheduled_time: scheduledTime || undefined,
    });

    // Reset simple form inputs
    setTeamA('');
    setTeamB('');
    setScheduledDate('');
    setScheduledTime('');
    alert(playMode === 'single' ? 'ការប្រកួតឯកត្តជនត្រូវបានបង្កើត! Single player match created successfully.' : 'ការប្រកួតក្រុមត្រូវបានបង្កើត! Team match created successfully.');
  };

  const registeredSwimmers = participants.filter((p) => !p.is_team && p.sport_type === 'Swimming');

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
                {(getActiveSports() as SportType[]).map((name) => {
                  const conf = getSportConfig(name);
                  const selected = sport === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setSport(name);
                        setTeamA('');
                        setTeamB('');
                      }}
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

            {/* Play Mode Toggle (Single vs Team) */}
            {sport !== 'Swimming' && (
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">
                  ទម្រង់លេង (Play Mode)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPlayMode('team');
                      setTeamA('');
                      setTeamB('');
                    }}
                    className={`py-2.5 px-4 border rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 transition cursor-pointer ${
                      playMode === 'team'
                        ? 'border-[#FFCC00] bg-yellow-50/20 text-[#1a1a1a] font-extrabold shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span>👥 លេងជាក្រុម (Team Play)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlayMode('single');
                      setTeamA('');
                      setTeamB('');
                    }}
                    className={`py-2.5 px-4 border rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 transition cursor-pointer ${
                      playMode === 'single'
                        ? 'border-[#FFCC00] bg-yellow-50/20 text-[#1a1a1a] font-extrabold shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span>👤 កីឡាករម្នាក់ៗ (Single Player)</span>
                  </button>
                </div>
              </div>
            )}

            {sport === 'Swimming' ? (
              /* Special Swimming Layout with up to 6 swimmer selections */
              <div className="space-y-4 border border-cyan-100 bg-cyan-50/10 p-4 rounded-2xl col-span-1">
                <div className="flex justify-between items-center border-b border-cyan-100/40 pb-2">
                  <h4 className="text-[10px] font-black uppercase text-cyan-850 tracking-wider">
                    តារាងកីឡាករហែលទឹកតាមគន្លង (Lane Swimmers Selection)
                  </h4>
                  <span className="text-[9px] font-black text-cyan-600 bg-cyan-100/60 px-2 py-0.5 rounded-md">
                    គន្លងសរុប៖ {swimmerSlots.length} / 6
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-35 gap-3">
                  {swimmerSlots.map((slot, index) => (
                    <div key={slot.id} className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5 shadow-xs">
                      <div className="flex justify-between items-center">
                        <label className="block text-[9px] font-black uppercase text-slate-400">
                          គន្លងទី {index + 1} (Lane {index + 1})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newSlots = [...swimmerSlots];
                            newSlots[index].isCustom = !newSlots[index].isCustom;
                            newSlots[index].name = '';
                            setSwimmerSlots(newSlots);
                          }}
                          className="text-[8px] font-bold text-[#D40511] hover:underline cursor-pointer"
                        >
                          {slot.isCustom ? '← ជ្រើសរើសពីបញ្ជី' : '+ បញ្ចូលឈ្មោះដោយខ្លួនឯង'}
                        </button>
                      </div>

                      {slot.isCustom ? (
                        <input
                          type="text"
                          required
                          placeholder="ឈ្មោះកីឡាករ..."
                          value={slot.name}
                          onChange={(e) => {
                            const newSlots = [...swimmerSlots];
                            newSlots[index].name = e.target.value;
                            setSwimmerSlots(newSlots);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-cyan-400 outline-none font-medium text-xs leading-none"
                        />
                      ) : (
                        <select
                          value={slot.name}
                          onChange={(e) => {
                            const newSlots = [...swimmerSlots];
                            newSlots[index].name = e.target.value;
                            setSwimmerSlots(newSlots);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-cyan-400 outline-none font-bold text-xs text-gray-700 bg-gray-50/50"
                        >
                          <option value="">-- ជ្រើសរើសកីឡាករ --</option>
                          {registeredSwimmers.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>

                {/* Swimmer Slot Actions */}
                <div className="flex gap-2 justify-end pt-1">
                  {swimmerSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSwimmerSlots(swimmerSlots.slice(0, -1))}
                      className="px-3 py-1.5 bg-red-50 text-[#D40511] border border-red-100 rounded-lg hover:bg-red-100 transition text-[9px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      - ដកគន្លងចេញ (Delete Lane)
                    </button>
                  )}

                  {swimmerSlots.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setSwimmerSlots([...swimmerSlots, { id: `lane-${swimmerSlots.length + 1}`, name: '', isCustom: false }])}
                      className="px-3 py-1.5 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition text-[9px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      + បន្ថែមគន្លងហែលទឹក (+ Add Lane)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Existing Team A and Team B columns */
              <>
                {/* Team A Picker */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      {playMode === 'single' ? 'កីឡាករទី ១ (ATHLETE A / PLAYER A)' : 'ក្រុមទី ១ (TEAM A)'}
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
                      placeholder={playMode === 'single' ? 'ឧទាហរណ៍៖ សុខ ដារ៉ា (Sok Dara)' : 'ឧទាហរណ៍៖ DHL Global Office'}
                      value={teamA}
                      onChange={(e) => setTeamA(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] outline-none placeholder:text-gray-300 font-medium"
                    />
                  ) : (
                    <select
                      value={teamA}
                      onChange={(e) => setTeamA(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] outline-none font-bold text-gray-700 bg-gray-50/50"
                    >
                      {(playMode === 'single' ? availableAthleteNamesList : availableTeamNamesList).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Team B Picker */}
                <div className="space-y-1 col-span-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      {playMode === 'single' ? 'កីឡាករទី ២ (ATHLETE B / PLAYER B)' : 'ក្រុមទី ២ (TEAM B)'}
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
                      placeholder={playMode === 'single' ? 'ឧទាហរណ៍៖ គង់ ចាន់ត្រា (Kong Chantra)' : 'ឧទាហរណ៍៖ DHL Custom Express'}
                      value={teamB}
                      onChange={(e) => setTeamB(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] outline-none placeholder:text-gray-305 font-medium"
                    />
                  ) : (
                    <select
                      value={teamB}
                      onChange={(e) => setTeamB(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] outline-none font-bold text-gray-700 bg-gray-50/50"
                    >
                      {(playMode === 'single' ? availableAthleteNamesList : availableTeamNamesList).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            )}

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

            {/* Scheduled Date & Time */}
            <div className="grid grid-cols-2 gap-35 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">
                  កាលបរិច្ឆេទប្រកួត (Scheduled Date)
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] outline-none font-medium text-xs text-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">
                  ម៉ោងប្រកួត (Scheduled Time)
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] outline-none font-medium text-xs text-gray-700"
                />
              </div>
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
                const config = getSportConfig(m.sport_name);
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
                      {m.sport_name === 'Swimming' ? (() => {
                        try {
                          const swimmers = JSON.parse(m.team_a) as { name: string }[];
                          return <span className="text-cyan-800 text-[11px] font-bold">{swimmers.map(s => s.name).join(', ')}</span>;
                        } catch (e) {
                          return m.team_a;
                        }
                      })() : m.team_a}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4 text-center">
                      {m.sport_name === 'Swimming' ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 border border-cyan-100 text-cyan-700 rounded-md text-[9px] font-extrabold uppercase tracking-wide">
                          ⏱️ Heat Timers
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-900 rounded-lg font-mono font-black select-all">
                          <span>{m.score_a}</span>
                          <span>:</span>
                          <span>{m.score_b}</span>
                        </div>
                      )}
                    </td>

                    {/* Team B */}
                    <td className="py-3 px-4 font-black uppercase text-gray-700">
                      {m.sport_name === 'Swimming' ? (() => {
                        try {
                          const swimmers = JSON.parse(m.team_a) as { name: string }[];
                          return <span className="text-gray-500 text-[10px] lowercase font-normal italic">គន្លងហែលទឹក៖ {swimmers.length} (Heats)</span>;
                        } catch (e) {
                          return m.team_b;
                        }
                      })() : m.team_b}
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

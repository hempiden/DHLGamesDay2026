import React, { useState } from 'react';
import { User, Users, Plus, Trash2, Edit2, ShieldAlert, Check, HelpCircle, UserPlus, ArrowLeftRight, Camera, Image, Shuffle, Sparkles, RefreshCw } from 'lucide-react';
import { Participant, SportType } from '../types';
import { SPORT_CONFIGS, getSportConfig, getActiveSports } from '../data';
import AthleteUpload from './AthleteUpload';

interface TeamManagementProps {
  participants: Participant[];
  isOnline: boolean;
  supabaseConnected: boolean;
  addParticipant: (name: string, sport_type: SportType, is_team: boolean, team_id: string | null, photo_url?: string) => Promise<any>;
  updateParticipantName: (id: string, name: string) => Promise<boolean>;
  updateParticipantPhoto: (id: string, photoUrl: string | null) => Promise<boolean>;
  assignPlayerToTeam: (playerId: string, teamId: string | null) => Promise<boolean>;
  deleteParticipant: (id: string) => Promise<boolean>;
  resetParticipantsToDefault: () => void;
}

export default function TeamManagement({
  participants,
  isOnline,
  supabaseConnected,
  addParticipant,
  updateParticipantName,
  updateParticipantPhoto,
  assignPlayerToTeam,
  deleteParticipant,
  resetParticipantsToDefault
}: TeamManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'structure' | 'athletes'>('structure');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<SportType>(() => getActiveSports()[0] || 'Soccer');
  
  // Forms states
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState<SportType>(() => getActiveSports()[0] || 'Soccer');
  
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSport, setNewPlayerSport] = useState<SportType>(() => getActiveSports()[0] || 'Soccer');
  const [newPlayerTeamId, setNewPlayerTeamId] = useState<string>('');

  const [editTeamNameValue, setEditTeamNameValue] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [saveNameSuccess, setSaveNameSuccess] = useState(false);
  const [deleteConfirmTeamId, setDeleteConfirmTeamId] = useState<string | null>(null);
  const [showRosterResetConfirm, setShowRosterResetConfirm] = useState(false);

  // Random Teamup Modal States
  const [showRandomTeamup, setShowRandomTeamup] = useState(false);
  const [teamupAthletes, setTeamupAthletes] = useState<{ id: string; name: string; gender: 'Male' | 'Female'; selected: boolean }[]>([]);
  const [teamupGenderMode, setTeamupGenderMode] = useState<'mixed' | 'separate'>('mixed');
  const [teamupSize, setTeamupSize] = useState<number>(3);
  const [teamupTargetType, setTeamupTargetType] = useState<'existing' | 'create_new'>('existing');
  const [targetTeamNamePattern, setTargetTeamNamePattern] = useState(`${selectedSport} Squad`);
  const [selectedTargetExistingTeamIds, setSelectedTargetExistingTeamIds] = useState<string[]>([]);
  
  // Results of generation (stored in state for preview before committing)
  const [generatedDraftPreview, setGeneratedDraftPreview] = useState<{
    teamName: string;
    existingTeamId?: string; // if existing
    members: { id: string; name: string; gender: 'Male' | 'Female' }[];
    genderBadge?: 'Male' | 'Female' | 'Mixed';
  }[]>([]);
  const [isApplyingDraft, setIsApplyingDraft] = useState(false);

  // Initialize Random Team-up
  const initRandomTeamupModal = () => {
    // Collect all athletes for selected sport
    const sportAthletes = participants.filter(p => !p.is_team && p.sport_type === selectedSport);
    
    // Guess gender based on name
    const prepared = sportAthletes.map(a => {
      const text = a.name.toLowerCase();
      let guessedGender: 'Male' | 'Female' = 'Male';
      
      const femaleTriggers = [
        'sokha', 'pisey', 'nara', 'sovanna', 'vibol', 'roth', 'chan', 'leak', 'sokha',
        'neary', 'leakhena', 'srey', 'bopha', 'moly', 'rath', 'sreypich', 'pich', 'sophia',
        'kalyan', 'kolab', 'chenda', 'tevy', 'kunthea', 'sophea', 'theary', 'srei', 'pheap',
        'chanta', 'chantra', 'maly', 'sothy', 'vanny', 'rom', 'chravy'
      ];
      
      if (femaleTriggers.some(t => text.includes(t))) {
        guessedGender = 'Female';
      }
      
      return {
        id: a.id,
        name: a.name,
        gender: guessedGender,
        selected: true // default to checked
      };
    });
    
    setTeamupAthletes(prepared);

    // Default team name pattern
    setTargetTeamNamePattern(`កងសហគមន៍ ${getSportConfig(selectedSport)?.khmerName || selectedSport}`);
    
    // Guess target team size based on sport division
    let defaultSize = 3;
    if (selectedSport === 'Soccer') defaultSize = 5;
    else if (selectedSport === 'Volleyball') defaultSize = 6;
    else if (selectedSport === 'Pingpong') defaultSize = 2;
    else if (selectedSport === 'Badminton') defaultSize = 2;
    else if (selectedSport === 'Swimming') defaultSize = 4;
    setTeamupSize(defaultSize);
    
    // Set target team IDs
    const sportTeams = participants.filter(p => p.is_team && p.sport_type === selectedSport);
    setSelectedTargetExistingTeamIds(sportTeams.map(t => t.id));
    
    // Clear previous previews
    setGeneratedDraftPreview([]);
    setShowRandomTeamup(true);
  };

  const generateRandomGroups = () => {
    // Get selected athletes
    const activeAthletes = teamupAthletes.filter(a => a.selected);
    if (activeAthletes.length === 0) {
      alert('សូមជ្រើសរើសកីឡាករយ៉ាងហោចណាស់ម្នាក់! Please select at least one athlete.');
      return;
    }

    // Shuffle helper function
    const shuffle = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    let groups: {
      teamName: string;
      existingTeamId?: string;
      members: { id: string; name: string; gender: 'Male' | 'Female' }[];
      genderBadge?: 'Male' | 'Female' | 'Mixed';
    }[] = [];

    if (teamupGenderMode === 'separate') {
      // Split by gender
      const males = shuffle(activeAthletes.filter(a => a.gender === 'Male'));
      const females = shuffle(activeAthletes.filter(a => a.gender === 'Female'));

      // Group males
      const maleGroupsCount = Math.max(1, Math.ceil(males.length / teamupSize));
      const maleChunks: typeof males[] = Array.from({ length: maleGroupsCount }, () => []);
      males.forEach((m, idx) => {
        maleChunks[idx % maleGroupsCount].push(m);
      });

      // Group females
      const femaleGroupsCount = Math.max(1, Math.ceil(females.length / teamupSize));
      const femaleChunks: typeof females[] = Array.from({ length: femaleGroupsCount }, () => []);
      females.forEach((f, idx) => {
        femaleChunks[idx % femaleGroupsCount].push(f);
      });

      if (teamupTargetType === 'existing') {
        const sportTeams = participants.filter(p => p.is_team && p.sport_type === selectedSport && selectedTargetExistingTeamIds.includes(p.id));
        if (sportTeams.length === 0) {
          alert('សូមជ្រើសរើសក្រុមគោលដៅយ៉ាងហោចណាស់មួយ! Please select at least one existing target team.');
          return;
        }

        let teamIdx = 0;
        // Males
        maleChunks.forEach((chunk) => {
          if (chunk.length === 0) return;
          const targetTeam = sportTeams[teamIdx % sportTeams.length];
          groups.push({
            teamName: `${targetTeam.name} (បុរស ♂️ - Men)`,
            existingTeamId: targetTeam.id,
            members: chunk.map(m => ({ id: m.id, name: m.name, gender: m.gender })),
            genderBadge: 'Male'
          });
          teamIdx++;
        });

        // Females
        femaleChunks.forEach((chunk) => {
          if (chunk.length === 0) return;
          const targetTeam = sportTeams[teamIdx % sportTeams.length];
          groups.push({
            teamName: `${targetTeam.name} (នារី ♀️ - Women)`,
            existingTeamId: targetTeam.id,
            members: chunk.map(f => ({ id: f.id, name: f.name, gender: f.gender })),
            genderBadge: 'Female'
          });
          teamIdx++;
        });
      } else {
        // Generate automatic groups
        maleChunks.forEach((chunk, idx) => {
          if (chunk.length === 0) return;
          groups.push({
            teamName: `${targetTeamNamePattern} (បុរស ក្រុមទី ${idx + 1} ♂️)`,
            members: chunk.map(m => ({ id: m.id, name: m.name, gender: m.gender })),
            genderBadge: 'Male'
          });
        });

        femaleChunks.forEach((chunk, idx) => {
          if (chunk.length === 0) return;
          groups.push({
            teamName: `${targetTeamNamePattern} (នារី ក្រុមទី ${idx + 1} ♀️)`,
            members: chunk.map(f => ({ id: f.id, name: f.name, gender: f.gender })),
            genderBadge: 'Female'
          });
        });
      }
    } else {
      // Mixed mode
      const allShuffled = shuffle(activeAthletes);
      const groupsCount = Math.max(1, Math.ceil(allShuffled.length / teamupSize));
      const chunks: typeof allShuffled[] = Array.from({ length: groupsCount }, () => []);
      allShuffled.forEach((ath, idx) => {
        chunks[idx % groupsCount].push(ath);
      });

      if (teamupTargetType === 'existing') {
        const sportTeams = participants.filter(p => p.is_team && p.sport_type === selectedSport && selectedTargetExistingTeamIds.includes(p.id));
        if (sportTeams.length === 0) {
          alert('សូមជ្រើសរើសក្រុមគោលដៅយ៉ាងហោចណាស់មួយ! Please select at least one existing target team.');
          return;
        }

        chunks.forEach((chunk, idx) => {
          if (chunk.length === 0) return;
          const targetTeam = sportTeams[idx % sportTeams.length];
          groups.push({
            teamName: targetTeam.name,
            existingTeamId: targetTeam.id,
            members: chunk.map(c => ({ id: c.id, name: c.name, gender: c.gender })),
            genderBadge: 'Mixed'
          });
        });
      } else {
        chunks.forEach((chunk, idx) => {
          if (chunk.length === 0) return;
          groups.push({
            teamName: `${targetTeamNamePattern} (ក្រុមចម្រុះទី ${idx + 1})`,
            members: chunk.map(c => ({ id: c.id, name: c.name, gender: c.gender })),
            genderBadge: 'Mixed'
          });
        });
      }
    }

    setGeneratedDraftPreview(groups);
  };

  const applyRandomTeamupPreset = async () => {
    if (generatedDraftPreview.length === 0) {
      alert('សូមបង្កើតការបែងចែកសាកល្បងជាមុនសិន! Please generate random preview first.');
      return;
    }

    setIsApplyingDraft(true);
    try {
      if (teamupTargetType === 'existing') {
        // Iterate through generatedDraftPreview and associate players
        for (const grp of generatedDraftPreview) {
          if (!grp.existingTeamId) continue;
          for (const member of grp.members) {
            await assignPlayerToTeam(member.id, grp.existingTeamId);
          }
        }
      } else {
        // Create new teams, then associate players!
        for (const grp of generatedDraftPreview) {
          // Create the team and get the ID from return
          const newTeamId = await addParticipant(grp.teamName, selectedSport, true, null);
          if (newTeamId) {
            for (const member of grp.members) {
              await assignPlayerToTeam(member.id, String(newTeamId));
            }
          }
        }
      }
      
      alert('ការបង្កើតក្រុមចៃដន្យត្រូវបានរក្សាទុកដោយជោគជ័យ! Random team allocation created and synced successfully.');
      setShowRandomTeamup(false);
      setGeneratedDraftPreview([]);
    } catch (err) {
      console.error('Failed to commit random team-up:', err);
      alert('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ! Error saving random team up changes.');
    } finally {
      setIsApplyingDraft(false);
    }
  };

  // Filter calculations
  const teams = participants.filter(p => p.is_team && p.sport_type === selectedSport);
  const selectedTeam = participants.find(p => p.id === selectedTeamId);
  const currentMembers = selectedTeam ? participants.filter(p => !p.is_team && p.team_id === selectedTeam.id) : [];
  
  // Unassigned players in the SAME sport
  const availablePlayers = participants.filter(p => !p.is_team && p.sport_type === selectedSport && !p.team_id);

  // Handle Select Team
  const handleSelectTeam = (team: Participant) => {
    setSelectedTeamId(team.id);
    setEditTeamNameValue(team.name);
    setIsEditingName(false);
    setSaveNameSuccess(false);
  };

  // Handle Save Team Name
  const handleSaveTeamName = async () => {
    if (!selectedTeamId || !editTeamNameValue.trim()) return;
    const success = await updateParticipantName(selectedTeamId, editTeamNameValue.trim());
    if (success) {
      setSaveNameSuccess(true);
      setIsEditingName(false);
      setTimeout(() => setSaveNameSuccess(false), 2000);
    }
  };

  // Handle Add Member
  const [addingPlayerId, setAddingPlayerId] = useState('');
  const handleAddMember = async () => {
    if (!selectedTeamId || !addingPlayerId) return;
    const success = await assignPlayerToTeam(addingPlayerId, selectedTeamId);
    if (success) {
      setAddingPlayerId('');
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (playerId: string) => {
    await assignPlayerToTeam(playerId, null);
  };

  // Handle Create Team
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const success = await addParticipant(newTeamName.trim(), newTeamSport, true, null);
    if (success) {
      setNewTeamName('');
      setShowCreateTeamModal(false);
    }
  };

  // Handle Create Player List
  const handleCreatePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const teamIdValue = newPlayerTeamId === 'none' || !newPlayerTeamId ? null : newPlayerTeamId;
    const success = await addParticipant(newPlayerName.trim(), newPlayerSport, false, teamIdValue);
    if (success) {
      setNewPlayerName('');
      setNewPlayerTeamId('');
      setShowCreatePlayerModal(false);
    }
  };

  // Handle Delete Team
  const handleDeleteTeam = async (id: string) => {
    // 1. Unassign all members first
    const members = participants.filter(p => p.team_id === id);
    for (const m of members) {
      await assignPlayerToTeam(m.id, null);
    }
    // 2. Delete the team row
    const success = await deleteParticipant(id);
    if (success) {
      setSelectedTeamId(null);
      setDeleteConfirmTeamId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Consolidating Switch Tabs */}
      <div className="flex border-b border-gray-150 bg-white px-2 rounded-2xl shadow-sm border border-gray-100">
        <button
          onClick={() => setActiveSubTab('structure')}
          className={`flex items-center gap-2 px-6 py-4 font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer border-b-4 ${
            activeSubTab === 'structure'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-755'
          }`}
        >
          <Users className="w-4 h-4 text-blue-500" />
          <span>រៀបចំរចនាសម្ព័ន្ធក្រុម (Team Structure Roster)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('athletes')}
          className={`flex items-center gap-2 px-6 py-4 font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer border-b-4 ${
            activeSubTab === 'athletes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-755'
          }`}
        >
          <UserPlus className="w-4 h-4 text-emerald-500" />
          <span>បញ្ជីឈ្មោះកីឡាករ & បន្ថែមរូប (Athlete Hub / Bulk Upload)</span>
        </button>
      </div>

      {activeSubTab === 'athletes' ? (
        <AthleteUpload
          participants={participants}
          addParticipant={addParticipant}
          updateParticipantName={updateParticipantName}
          updateParticipantPhoto={updateParticipantPhoto}
          assignPlayerToTeam={assignPlayerToTeam}
          deleteParticipant={deleteParticipant}
        />
      ) : (
        <>
          {/* Top statistics cards & switch controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="font-dhl-title text-2xl text-[#D40511] italic tracking-tight">
            TEAM MANAGEMENT & ATHLETES
          </h2>
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">
            Config and associate team structures for active tournament schedules
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={initRandomTeamupModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#FFCC00]" />
            <span>🎲 បែងចែកក្រុមចៃដន្យ (Random Team-up)</span>
          </button>

          <button
            onClick={() => {
              setNewPlayerSport(selectedSport);
              setShowCreatePlayerModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] text-white hover:bg-gray-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#FFCC00]" />
            <span>+ ថែមអ្នកលេង (Add Athlete)</span>
          </button>
          
          <button
            onClick={() => {
              setNewTeamSport(selectedSport);
              setShowCreateTeamModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#D40511] text-white hover:bg-red-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-[#FFCC00]" />
            <span>+ បង្កើតក្រុម (New Team)</span>
          </button>
        </div>
      </div>

      {/* Sport selection filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {(getActiveSports() as SportType[]).map((sportKey) => {
          const config = getSportConfig(sportKey);
          const isSelected = selectedSport === sportKey;
          const count = participants.filter(p => p.is_team && p.sport_type === sportKey).length;
          return (
            <button
              key={sportKey}
              onClick={() => {
                setSelectedSport(sportKey);
                setSelectedTeamId(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 transform active:scale-95 select-none whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[#FFCC00] text-gray-950 border-2 border-[#FFCC00] shadow-md'
                  : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-2 border-gray-100'
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

      {/* Main editor grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left side list of teams under active sport */}
        <div id="aside-teams-list" className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[700px]">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
            <div>
              <h3 className="font-dhl-title text-base text-gray-800 italic uppercase">
                Teams under {selectedSport}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">
                Select a team below to edit roster
              </p>
            </div>
            <Users className="w-5 h-5 text-[#D40511]" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans">
            {teams.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 font-sans">
                <HelpCircle className="w-10 h-10 opacity-20 mb-2.5 text-[#D40511]" />
                <p className="text-xs font-bold uppercase tracking-tight">គ្មានក្រុមសម្រាប់ប្រភេទកីឡានេះទេ</p>
                <p className="text-[10px] mt-1 normal-case leading-relaxed">No teams built yet. Click the "New Team" button to construct your first competitor squad.</p>
              </div>
            ) : (
              teams.map((t) => {
                const isSelected = selectedTeamId === t.id;
                const membersCount = participants.filter(p => !p.is_team && p.team_id === t.id).length;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTeam(t)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 select-none ${
                      isSelected
                        ? 'bg-amber-50/50 border-[#FFCC00] shadow-sm'
                        : 'bg-gray-50/30 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Team Logo / Photo Thumbnail */}
                      <div className="w-11 h-11 rounded-xl bg-white border border-gray-150 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                        {t.photo_url ? (
                          <img
                            src={t.photo_url}
                            alt={t.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xl filter saturate-100 select-none">
                            {getSportConfig(t.sport_type)?.icon || '🛡️'}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-gray-800 line-clamp-1">{t.name}</h4>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                            ID: {t.id}
                          </span>
                          <span className="text-[9px] font-black uppercase text-[#D40511] italic tracking-tight">
                            {t.sport_type}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-1 bg-white text-gray-600 rounded-lg text-[9px] font-black tracking-tighter shadow-sm shrink-0 border border-gray-100">
                        {membersCount} Players
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right side active team editor */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col h-[700px] relative overflow-hidden font-sans">
          
          {!selectedTeam ? (
            <div id="editor-placeholder" className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <Users className="w-16 h-16 opacity-10 mb-4 text-gray-900 animate-pulse" />
              <h3 className="font-bold uppercase tracking-tight text-gray-700 text-sm">សូមជ្រើសរើសក្រុមណាមួយ</h3>
              <p className="text-[11px] max-w-sm mt-1 mb-6 text-gray-400 tracking-wide">
                Please select a squad from the left list to edit identity, attach athletes, or execute actions.
              </p>
              
              <div className="p-4 bg-gray-50 border border-dotted border-gray-200 rounded-2xl text-left max-w-md">
                <span className="text-[9px] font-black text-[#D40511] uppercase tracking-wider block mb-1">💡 Pro Sports Day Setup Tip:</span>
                <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                  You can add individual athletes into the system under any sport. When editing a team, you will only see available players dedicated to that sport to prevent team registration errors.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1">
              
              {/* Team ID & Title Header edit section */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                
                {/* Theme Banner Display */}
                <div className="relative group overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 aspect-[16/5] flex flex-col justify-end">
                  {selectedTeam.photo_url ? (
                    <img 
                      src={selectedTeam.photo_url} 
                      alt={selectedTeam.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4 text-center">
                      <span className="text-3xl opacity-60 mb-1">{getSportConfig(selectedTeam.sport_type)?.icon}</span>
                      <p className="text-[11px] font-black uppercase text-gray-500 tracking-wider">No Team Theme Photo</p>
                      <p className="text-[9px] text-gray-600 max-w-xs mt-0.5 font-bold uppercase">Upload a visual identity banner for {selectedTeam.name}</p>
                    </div>
                  )}
                  
                  {/* Backdrop tint for photo */}
                  {selectedTeam.photo_url && <div className="absolute inset-0 bg-black/30" />}

                  {/* Badges/Titles over photo */}
                  <div className="relative z-10 p-4 flex justify-between items-end bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-12">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFCC00] text-gray-950 font-black tracking-wider text-[8px] uppercase">
                        {selectedTeam.sport_type} Division
                      </span>
                      <h4 className="text-white font-extrabold text-sm sm:text-base mt-1 drop-shadow-sm leading-tight">{selectedTeam.name}</h4>
                    </div>

                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`team-photo-file-${selectedTeam.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64String = reader.result as string;
                              updateParticipantPhoto(selectedTeam.id, base64String);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor={`team-photo-file-${selectedTeam.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-gray-800 text-[10px] font-black uppercase tracking-wider shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#D40511]" />
                        <span>Upload Photo</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-1.5">
                    ឈ្មោះក្រុមផ្លូវការ (Official name)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={editTeamNameValue}
                        onChange={(e) => {
                          setEditTeamNameValue(e.target.value);
                          setIsEditingName(true);
                        }}
                        className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl font-bold text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-transparent transition-all"
                      />
                      {saveNameSuccess && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border border-emerald-100">
                          <Check className="w-3.5 h-3.5" /> រក្សាទុក!
                        </span>
                      )}
                    </div>
                    {isEditingName && (
                      <button
                        onClick={handleSaveTeamName}
                        className="bg-[#D40511] hover:bg-red-700 text-white font-black uppercase italic tracking-wider text-xs px-6 py-3 rounded-xl transition active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span>សង្គ្រោះឈ្មោះ (Save)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid with members list and player registration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* 1. Roster members section */}
                <div className="border border-gray-100 rounded-3xl p-5 bg-white relative">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-black text-xs uppercase tracking-wider text-gray-400">
                      សមាជិកបច្ចុប្បន្ន (Current Roster)
                    </h5>
                    <span className="px-2 py-0.5 bg-[#FFCC00]/20 text-[#D40511] font-black uppercase tracking-wider rounded text-[9px]">
                      {currentMembers.length} ACTIVE
                    </span>
                  </div>

                  <div className="space-y-2 h-[280px] overflow-y-auto pr-1">
                    {currentMembers.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 px-4">
                        <HelpCircle className="w-7 h-7 opacity-25 mb-1.5" />
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">គ្មានសមាជិក</p>
                        <p className="text-[9px] text-gray-400 leading-tight">No participants registered under this competing squad yet. Add available athletes from the right pane.</p>
                      </div>
                    ) : (
                      currentMembers.map((m) => (
                        <div
                          key={m.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-[#FFCC00]/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                            <span className="font-extrabold text-xs text-gray-800">{m.name}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="bg-transparent hover:bg-red-50 text-red-500 px-2 py-1 rounded-lg text-[10px] font-black uppercase border border-transparent hover:border-red-200 transition-all cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Available sport athletes join section */}
                <div className="border border-gray-100 rounded-3xl p-5 bg-white">
                  <h5 className="font-black text-xs uppercase tracking-wider text-gray-400 mb-3">
                    បញ្ចូលកីឡាករ (Add Athlete to Roster)
                  </h5>

                  <div className="space-y-4">
                    <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                      ខាងក្រោមនេះជាឈ្មោះកីឡាករទំនេរ (គ្មានក្រុម) ដែលលេងការប្រកួតប្រភេទ <span className="font-bold underline text-gray-700">{selectedSport}</span>៖
                    </p>

                    <div className="space-y-2">
                      <select
                        value={addingPlayerId}
                        onChange={(e) => setAddingPlayerId(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#FFCC00]"
                      >
                        <option value="">-- ជ្រើសរើសកីឡាករ (Select Athlete) --</option>
                        {availablePlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (ID: {p.id})
                          </option>
                        ))}
                      </select>

                      {availablePlayers.length === 0 && (
                        <p className="text-[9px] text-[#D40511] font-bold bg-red-50/50 p-2 rounded-lg border border-red-100">
                          ⚠ គ្មានកីឡាករទំនេរក្នុងវិញ្ញាសានេះទេ! អ្នកអាចថែមឈ្មោះកីឡាករថ្មីខាងលើបាន។ (No unassigned players left under {selectedSport}).
                        </p>
                      )}
                    </div>

                    <button
                      disabled={!addingPlayerId}
                      onClick={handleAddMember}
                      className={`w-full py-3 rounded-xl font-black uppercase italic text-xs transition duration-200 flex items-center justify-center gap-1.5 ${
                        addingPlayerId
                          ? 'bg-gray-950 text-white hover:bg-gray-800 cursor-pointer active:scale-95'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>បញ្ចូលទៅក្នុងក្រុម (Register Into Squad)</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom danger action arena */}
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mt-auto">
                <div className="max-w-md">
                  <span className="text-[9px] font-black text-[#D40511] uppercase tracking-wider block">Zone Of Critical Team Deletion:</span>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium leading-relaxed">
                    Deleting this team releases all associated players from their alignment. The free-agent athletes will return to the unassigned state. Matches referencing this team will remain, but can be updated.
                  </p>
                </div>

                {deleteConfirmTeamId === selectedTeamId ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTeamId(null)} // Cancel
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(selectedTeamId)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Yes, Delete Squad</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmTeamId(selectedTeamId)}
                    className="text-red-500 hover:text-red-700 text-[11px] font-black uppercase tracking-wider hover:underline flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុបក្រុមនេះជាអចិន្ត្រៃយ៍ (Delete Team)</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* FOOTER RESET ACTIONS (Under Management Control) */}
      <div className="flex justify-between items-center bg-gray-100/50 p-5 rounded-2xl border border-gray-100 font-sans">
        <div>
          <h5 className="font-extrabold text-[#111111] text-xs uppercase">ប្រព័ន្ធគ្រប់គ្រងសមាជិក (Participants Control Node)</h5>
          <p className="text-[10px] text-gray-400">Revert rosters and participants back to default original seeded database settings.</p>
        </div>
        {showRosterResetConfirm ? (
          <div className="flex gap-2 items-center animate-fade-in">
            <span className="text-[10px] font-black text-amber-700 uppercase">Are you sure?</span>
            <button
              onClick={() => {
                resetParticipantsToDefault();
                setShowRosterResetConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition-colors cursor-pointer"
            >
              ច្បាស់ជាកំណត់ឡើងវិញ (Yes, Reset)
            </button>
            <button
              onClick={() => setShowRosterResetConfirm(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition-colors cursor-pointer text-gray-650"
            >
              ទេ (No)
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRosterResetConfirm(true)}
            className="bg-transparent hover:bg-gray-200 text-gray-600 border border-gray-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors cursor-pointer"
          >
            Reset Participant Database
          </button>
        )}
      </div>

      {/* CREATE TEAM MODAL OVERLAY */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans select-none">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-slide-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="font-dhl-title text-[#D40511] text-lg italic uppercase flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FFCC00]" />
                <span>បង្កើតក្រុមការងារថ្មី (Build New Team)</span>
              </h3>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  ឈ្មោះក្រុម (Khmer/English Team Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logistics Stars"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCC00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  ប្រភេទកីឡា (Sport Category Arena)
                </label>
                <select
                  value={newTeamSport}
                  onChange={(e) => setNewTeamSport(e.target.value as SportType)}
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded-lg font-bold text-xs"
                >
                  {(getActiveSports() as SportType[]).map((sportKey) => (
                    <option key={sportKey} value={sportKey}>
                      {getSportConfig(sportKey).icon} {sportKey} ({getSportConfig(sportKey).khmerName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#D40511] hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase italic tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>បង្កើតក្រុម (Construct Team)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PLAYER MODAL OVERLAY */}
      {showCreatePlayerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans select-none">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-slide-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="font-dhl-title text-[#D40511] text-lg italic uppercase flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#FFCC00]" />
                <span>ចុះឈ្មោះកីឡាករថ្មី (Register Athlete)</span>
              </h3>
              <button
                onClick={() => setShowCreatePlayerModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlayerSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  ឈ្មោះកីឡាករ (Athlete Full Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bunthong Hor"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCC00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  ប្រភេទកីឡា (Primary Sport Arena)
                </label>
                <select
                  value={newPlayerSport}
                  onChange={(e) => {
                    const sportValue = e.target.value as SportType;
                    setNewPlayerSport(sportValue);
                    setNewPlayerTeamId(''); // Reset team choice so it gets valid teams
                  }}
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded-lg font-bold text-xs"
                >
                  {(getActiveSports() as SportType[]).map((sportKey) => (
                    <option key={sportKey} value={sportKey}>
                      {getSportConfig(sportKey).icon} {sportKey} ({getSportConfig(sportKey).khmerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  ក្រុមការងារ (Assign Team Now - Optional)
                </label>
                <select
                  value={newPlayerTeamId}
                  onChange={(e) => setNewPlayerTeamId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded-lg font-bold text-xs"
                >
                  <option value="">-- បញ្ជូនទៅក្នុងក្រុមទំនេរ (Unassigned / Free Agent) --</option>
                  {participants
                    .filter((p) => p.is_team && p.sport_type === newPlayerSport)
                    .map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePlayerModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gray-950 text-white hover:bg-gray-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FFCC00]" />
                  <span>ថែមឈ្មោះ (Register Player)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRandomTeamup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans select-none overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 animate-slide-up my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <h3 className="font-dhl-title text-[#D40511] text-xl italic uppercase flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-[#FFCC00]" />
                <span>🎲 ប្រព័ន្ធបែងចែកក្រុមចៃដន្យ ({selectedSport} Random Team-up)</span>
              </h3>
              <button
                onClick={() => {
                  setShowRandomTeamup(false);
                  setGeneratedDraftPreview([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Athletes & Genders lists */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-wider text-gray-700">
                      បញ្ជីឈ្មោះកីឡាករ ({selectedSport})
                    </h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                      Select players & configure genders
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTeamupAthletes(prev => prev.map(a => ({ ...a, selected: true })))}
                      className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-[9px] font-black uppercase transition-all"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamupAthletes(prev => prev.map(a => ({ ...a, selected: false })))}
                      className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-[9px] font-black uppercase transition-all"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-2xl p-4 bg-white max-h-[350px] overflow-y-auto space-y-2">
                  {teamupAthletes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <HelpCircle className="w-8 h-8 opacity-25 mx-auto mb-2" />
                      <p className="text-[10px] font-bold uppercase">គ្មានកីឡាករ</p>
                      <p className="text-[9px] text-gray-400 mt-1">No athletes registered in {selectedSport}. Please add athletes first.</p>
                    </div>
                  ) : (
                    teamupAthletes.map((a) => (
                      <div
                        key={a.id}
                        className={`flex justify-between items-center p-2.5 rounded-xl border transition-all ${
                          a.selected
                            ? 'bg-amber-50/20 border-amber-200'
                            : 'bg-gray-50/50 border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={a.selected}
                            onChange={() => {
                              setTeamupAthletes(prev => prev.map(item => item.id === a.id ? { ...item, selected: !item.selected } : item));
                            }}
                            className="w-4 h-4 text-emerald-500 focus:ring-[#FFCC00] rounded"
                          />
                          <span className={`font-bold text-xs truncate ${a.selected ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                            {a.name}
                          </span>
                        </div>

                        {/* Gender Toggle Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setTeamupAthletes(prev => prev.map(item => item.id === a.id ? { ...item, gender: item.gender === 'Male' ? 'Female' : 'Male' } : item));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border shrink-0 flex items-center gap-1 cursor-pointer ${
                            a.gender === 'Male'
                              ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                              : 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100'
                          }`}
                        >
                          <span>{a.gender === 'Male' ? '♂️' : '♀️'}</span>
                          <span>{a.gender === 'Male' ? 'ប្រុស' : 'ស្រី'}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                  💡 <span className="font-bold text-gray-650">របៀបកំណត់ភេទចល័ត៖</span> ប្រព័ន្ធនឹងទាយភេទរបស់កីឡាករដោយស្វ័យប្រវត្តិពីប្រព័ន្ធ តែលោកអ្នកអាចចុចលើប៊ូតុងភេទខាងលើ (ប្រុស/ស្រី) ដើម្បីប្តូរបានភ្លាមៗសម្រាប់ការបែងចែកក្រុម។
                </div>
              </div>

              {/* Right Column: Grouping options */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                
                {/* Rule parameters */}
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-tight text-gray-700">
                    លក្ខខណ្ឌបង្កើតក្រុម (Define Sorting Conditions)
                  </h4>

                  {/* Gender separation mode */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 mt-1">
                      ទម្រង់លេង/ភេទ (Gameplay Gender Split)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTeamupGenderMode('mixed')}
                        className={`p-3 rounded-xl border-2 font-black uppercase italic text-center transition-all cursor-pointer ${
                          teamupGenderMode === 'mixed'
                            ? 'bg-[#FFCC00] text-gray-950 border-[#FFCC00] shadow-sm animate-pulse-subtle'
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <p className="text-[10px] sm:text-xs">លេងរួមគ្នា (Mixed / All Gender)</p>
                        <span className="text-[8px] opacity-70 font-normal">All athletes drafted together</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTeamupGenderMode('separate')}
                        className={`p-3 rounded-xl border-2 font-black uppercase italic text-center transition-all cursor-pointer ${
                          teamupGenderMode === 'separate'
                            ? 'bg-[#FFCC00] text-gray-950 border-[#FFCC00] shadow-sm animate-pulse-subtle'
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <p className="text-[10px] sm:text-xs">បែងចែកប្រុស-ស្រី (Separate Gender)</p>
                        <span className="text-[8px] opacity-70 font-normal">Separate Men's & Women's groups</span>
                      </button>
                    </div>
                  </div>

                  {/* Member count per team */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400">
                        ចំនួនសមាជិកក្នុងមួយក្រុម (Members Per Team Size)
                      </label>
                      <span className="px-2.5 py-1 bg-gray-950 text-[#FFCC00] rounded-xl text-xs font-black">
                        {teamupSize} នាក់/ក្រុម
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={teamupSize}
                        onChange={(e) => setTeamupSize(Number(e.target.value))}
                        className="flex-1 accent-[#D40511] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setTeamupSize(prev => Math.max(1, prev - 1))}
                          className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-100 font-extrabold text-sm text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeamupSize(prev => Math.min(12, prev + 1))}
                          className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-100 font-extrabold text-sm text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Target configuration */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                      របៀបបែងចែកចូល (Allocation Target Squads)
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => setTeamupTargetType('existing')}
                        className={`p-2.5 rounded-xl border-2 font-black uppercase transition-all text-xs cursor-pointer ${
                          teamupTargetType === 'existing'
                            ? 'bg-gray-955 text-[#FFCC00] border-gray-950 shadow-sm'
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        ប្រើប្រាស់ក្រុមមានស្រាប់ (Existing Teams)
                      </button>

                      <button
                        type="button"
                        onClick={() => setTeamupTargetType('create_new')}
                        className={`p-2.5 rounded-xl border-2 font-black uppercase transition-all text-xs cursor-pointer ${
                          teamupTargetType === 'create_new'
                            ? 'bg-gray-955 text-[#FFCC00] border-gray-950 shadow-sm'
                            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        បង្កើតក្រុមថ្មីស្វ័យប្រវត្ត (Create New Teams)
                      </button>
                    </div>

                    {teamupTargetType === 'existing' ? (
                      <div className="space-y-2 bg-white p-3.5 rounded-xl border border-gray-200">
                        <p className="text-[9px] font-black uppercase text-gray-450 tracking-wider">
                          ជ្រើសរើសក្រុមគោលដៅ (Select Target Roster Squads):
                        </p>
                        {participants.filter(p => p.is_team && p.sport_type === selectedSport).length === 0 ? (
                          <p className="text-[10px] text-[#D40511] font-bold">⚠ គ្មានក្រុមដែលបង្កើតទុកក្នុងប្រភេទកីឡានេះទេ! សូមជ្រើសរើសបង្កើតក្រុមថ្មីស្វ័យប្រវត្ត។</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1">
                            {participants.filter(p => p.is_team && p.sport_type === selectedSport).map(t => {
                              const isChecked = selectedTargetExistingTeamIds.includes(t.id);
                              return (
                                <label key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer text-xs font-bold text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedTargetExistingTeamIds(prev => prev.filter(id => id !== t.id));
                                      } else {
                                        setSelectedTargetExistingTeamIds(prev => [...prev, t.id]);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 focus:ring-[#FFCC00] text-emerald-500 rounded cursor-pointer"
                                  />
                                  <span className="truncate">{t.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                          លំនាំឈ្មោះក្រុមស្វ័យប្រវត្ត (Base Team Name Pattern):
                        </label>
                        <input
                          type="text"
                          required
                          value={targetTeamNamePattern}
                          onChange={(e) => setTargetTeamNamePattern(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-[#FFCC00]"
                          placeholder="ឧទាហរណ៍៖ Group Red"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Generate Action Button */}
                <button
                  type="button"
                  onClick={generateRandomGroups}
                  className="w-full py-3.5 bg-[#D40511] hover:bg-red-700 text-white rounded-2xl font-black uppercase italic tracking-wider shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4 text-[#FFCC00]" />
                  <span>បែងចែកលាយចៃដន្យសាកល្បង (Generate Random Teams Preview)</span>
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER SECTION */}
            {generatedDraftPreview.length > 0 && (
              <div className="mt-8 border-t border-gray-150 pt-8 animate-fade-in text-left">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800 uppercase italic">
                      លទ្ធផលនៃការបែងចែក (Roster Draft Preview)
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Confirm result before applying changes to the database
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-extrabold rounded-lg text-[10px]">
                    {generatedDraftPreview.length} GROUPS PLANNED
                  </span>
                </div>

                {/* Grid of preview outcome lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1 mb-8">
                  {generatedDraftPreview.map((grp, gidx) => (
                    <div key={gidx} className="border border-gray-200 bg-gray-50/40 rounded-2xl p-4 flex flex-col space-y-2.5">
                      <div className="flex justify-between items-start">
                        <h5 className="font-extrabold text-xs text-gray-800 line-clamp-1 flex-1 pr-1">{grp.teamName}</h5>
                        {grp.genderBadge && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${
                            grp.genderBadge === 'Male'
                              ? 'bg-blue-150 text-blue-700'
                              : grp.genderBadge === 'Female'
                              ? 'bg-pink-150 text-pink-700'
                              : 'bg-indigo-150 text-indigo-700'
                          }`}>
                            {grp.genderBadge === 'Male' ? 'BOYS ♂️' : grp.genderBadge === 'Female' ? 'GIRLS ♀️' : 'MIXED 👫'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 border-t border-gray-150 pt-2">
                        {grp.members.map((m, midx) => (
                          <div key={m.id} className="flex justify-between items-center text-[11px] font-extrabold text-gray-600 bg-white p-2 rounded-lg border border-gray-150">
                            <span>{midx + 1}. {m.name}</span>
                            <span className="text-[9px] opacity-60 font-medium">{m.gender === 'Male' ? 'Male ♂️' : 'Female ♀️'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Commit Button */}
                <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-150 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setGeneratedDraftPreview([])}
                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Reset Draft
                  </button>
                  <button
                    type="button"
                    disabled={isApplyingDraft}
                    onClick={applyRandomTeamupPreset}
                    className={`px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase italic tracking-wider flex items-center gap-2 shadow-md ${
                      isApplyingDraft ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95'
                    }`}
                  >
                    {isApplyingDraft ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>កំពុងរក្សាទុកទិន្នន័យ (Applying Roster...)</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-[#FFCC00]" />
                        <span>រក្សាទុក និងអនុវត្តក្រុមថ្មី (Apply & Sync Roster)</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}

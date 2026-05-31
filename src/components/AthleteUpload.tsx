import React, { useState } from 'react';
import { User, UserPlus, Upload, Trash2, Users, Check, AlertCircle, RefreshCw, FileText, Briefcase, Camera, Image } from 'lucide-react';
import { Participant, SportType } from '../types';
import { SPORT_CONFIGS, getSportConfig, getActiveSports } from '../data';

interface AthleteUploadProps {
  participants: Participant[];
  addParticipant: (name: string, sport_type: SportType, is_team: boolean, team_id: string | null, photo_url?: string) => Promise<any>;
  updateParticipantName: (id: string, name: string) => Promise<boolean>;
  updateParticipantPhoto: (id: string, photoUrl: string | null) => Promise<boolean>;
  assignPlayerToTeam: (playerId: string, teamId: string | null) => Promise<boolean>;
  deleteParticipant: (id: string) => Promise<boolean>;
}

export default function AthleteUpload({
  participants,
  addParticipant,
  updateParticipantName,
  updateParticipantPhoto,
  assignPlayerToTeam,
  deleteParticipant
}: AthleteUploadProps) {
  // Tabs within Athlete register: ('single' or 'bulk')
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [selectedSport, setSelectedSport] = useState<SportType>('Soccer');

  // Single player states
  const [singleName, setSingleName] = useState('');
  const [singleSports, setSingleSports] = useState<SportType[]>(['Soccer']);
  const [singlePhotoBase64, setSinglePhotoBase64] = useState<string | null>(null);

  // Bulk player states
  const [bulkInputText, setBulkInputText] = useState(
    '[\n  { "name": "Sok Vannak", "sport_type": "Soccer" },\n  { "name": "Keo Dara", "sport_type": "Soccer" },\n  { "name": "Chan Pisey", "sport_type": "Volleyball" }\n]'
  );
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkParsedCount, setBulkParsedCount] = useState<number | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState(false);

  // Search & edit states of athlete lists
  const [searchText, setSearchText] = useState('');
  const [sportFilter, setSportFilter] = useState<SportType | 'All'>('All');
  const [associationFilter, setAssociationFilter] = useState<'All' | 'Assigned' | 'Unassigned'>('All');
  // edit mode uses the unique name of the player
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract only players (is_team = false)
  const players = participants.filter((p) => !p.is_team);

  // Group players by case-insensitive name
  const groupedUniquePlayers = React.useMemo(() => {
    const map = new Map<string, {
      name: string;
      photo_url: string | null;
      activeSports: SportType[];
      records: Participant[];
    }>();

    players.forEach((p) => {
      const key = p.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: p.name,
          photo_url: p.photo_url || null,
          activeSports: [],
          records: [],
        });
      }
      const group = map.get(key)!;
      group.activeSports.push(p.sport_type);
      group.records.push(p);
      if (p.photo_url && !group.photo_url) {
        group.photo_url = p.photo_url;
      }
    });

    return Array.from(map.values());
  }, [players]);

  // Filtered unique players
  const filteredUniquePlayers = groupedUniquePlayers.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          group.records.some(r => r.id.toLowerCase().includes(searchText.toLowerCase()));
    const matchesSport = sportFilter === 'All' || group.activeSports.includes(sportFilter);
    const matchesAssoc =
      associationFilter === 'All' ||
      (associationFilter === 'Assigned' && group.records.some(r => r.team_id !== null)) ||
      (associationFilter === 'Unassigned' && group.records.every(r => r.team_id === null));
    return matchesSearch && matchesSport && matchesAssoc;
  });

  // Handle Profile Photo Upload for Single Athlete Form
  const handleSinglePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSinglePhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Single Athlete with selected sports checkboxes
  const handleSingleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;
    if (singleSports.length === 0) {
      alert('សូមជ្រើសរើសវិញ្ញាសាយ៉ាងហោចណាស់មួយ! Please select at least one sport.');
      return;
    }

    let successCount = 0;
    for (const sport of singleSports) {
      // Check if athlete is already enrolled in this sport division
      const exists = players.some(
        (p) => p.name.toLowerCase().trim() === singleName.toLowerCase().trim() && p.sport_type === sport
      );
      if (exists) {
        continue;
      }

      const success = await addParticipant(
        singleName.trim(),
        sport,
        false,
        null, // Created as Free Agent so they can be assigned via interactive dashboard
        singlePhotoBase64 || undefined
      );
      if (success) {
        successCount++;
      }
    }

    if (successCount > 0) {
      setSingleName('');
      setSingleSports(['Soccer']);
      setSinglePhotoBase64(null);
      alert(`កីឡាករថ្មីត្រូវបានចុះឈ្មោះដោយជោគជ័យលើវិញ្ញាសាចំនួន ${successCount}! Athlete registered successfully.`);
    } else {
      alert('ឈ្មោះកីឡាករនេះត្រូវបានចុះឈ្មោះរួចហើយក្នុងបញ្ជីវិញ្ញាសាដែលបានជ្រើសរើស! This athlete is already registered in these selected sport divisions.');
    }
  };

  // Submit Bulk Athletes from JSON list
  const handleBulkSubmit = async () => {
    setBulkError(null);
    setBulkSuccess(false);
    try {
      const parsed = JSON.parse(bulkInputText);
      if (!Array.isArray(parsed)) {
        throw new Error('Input must be a JSON array of player structures.');
      }

      let count = 0;
      for (const item of parsed) {
        if (!item.name || typeof item.name !== 'string') {
          throw new Error('Each record must contain a valid string "name" attribute.');
        }
        const sType = item.sport_type || 'Soccer';
        // Validate sport type
        const validSports: SportType[] = ['Soccer', 'Volleyball', 'Pingpong', 'Badminton', 'Swimming'];
        if (!validSports.includes(sType)) {
          throw new Error(`Invalid sport_type "${sType}". Must be one of: Soccer, Volleyball, Pingpong, Badminton, Swimming`);
        }

        await addParticipant(item.name.trim(), sType, false, null, item.photo_url || undefined);
        count++;
      }

      setBulkParsedCount(count);
      setBulkSuccess(true);
      setTimeout(() => setBulkSuccess(false), 4000);
    } catch (err: any) {
      setBulkError(err.message || 'Parsing error. Verify standard JSON grammar formatting.');
    }
  };

  // Quick Action: edit name inline for unique physical player
  const handleStartEditName = (g: { name: string }) => {
    setEditingPlayerId(g.name);
    setEditingPlayerName(g.name);
  };

  const handleSaveEditName = async (originalName: string) => {
    if (!editingPlayerName.trim()) return;
    const sameNameRecs = players.filter((p) => p.name.toLowerCase().trim() === originalName.toLowerCase().trim());
    
    let ok = true;
    for (const rec of sameNameRecs) {
      const success = await updateParticipantName(rec.id, editingPlayerName.trim());
      if (!success) ok = false;
    }
    
    if (ok) {
      setEditingPlayerId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Title & Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm md:p-8">
        <div>
          <h2 className="font-dhl-title text-2xl text-[#D40511] italic tracking-tight uppercase">
            Athlete Hub & Upload Terminal
          </h2>
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">
            Register and upload profile assets for tournament sports players (crude bulk capability included)
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
          <button
            onClick={() => setUploadMode('single')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 select-none ${
              uploadMode === 'single'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            បាំងម្នាក់ៗ (Single Player Form)
          </button>
          <button
            onClick={() => setUploadMode('bulk')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 select-none ${
              uploadMode === 'bulk'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            បញ្ចូលជាក្រុម (Crude Bulk upload)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Uploading Section */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          {uploadMode === 'single' ? (
            <div className="space-y-4">
              <h3 className="font-dhl-title text-base text-gray-800 italic uppercase pb-2 border-b border-gray-100">
                ចុះឈ្មោះកីឡាករម្នាក់ៗ (Single Athlete Roster Form)
              </h3>

              <form onSubmit={handleSingleRegisterSubmit} className="space-y-4">
                
                {/* Photo Upload Thumbnail Field */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1.5">
                    រូបថតកីឡាករ (Athlete Photo Preview)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {singlePhotoBase64 ? (
                        <img 
                          src={singlePhotoBase64} 
                          alt="Athlete Preview" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-7 h-7 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        id="single-avatar-upload"
                        className="hidden"
                        onChange={handleSinglePhotoSelect}
                      />
                      <label
                        htmlFor="single-avatar-upload"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10.5px] font-black uppercase tracking-wider cursor-pointer transition active:scale-95 border"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#D40511]" />
                        <span>Select Face Shot</span>
                      </label>
                      <p className="text-[9px] text-gray-400 mt-1 leading-tight uppercase font-medium">PNG/JPG formatted picture</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                    ឈ្មោះកីឡាករ (Athlete Full Name)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bunly Phal"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 p-3 rounded-xl font-bold text-sm tracking-wide outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 block">
                    ប្រភេទវិញ្ញាសា (Select Sport Divisions - Multiple allowed)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(getActiveSports() as SportType[]).map((sportKey) => {
                      const isChecked = singleSports.includes(sportKey);
                      return (
                        <label
                          key={sportKey}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer select-none transition ${
                            isChecked
                              ? 'bg-[#FFCC00]/15 border-[#FFCC00] text-gray-950'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                // Keep at least one sport
                                if (singleSports.length > 1) {
                                  setSingleSports(singleSports.filter((s) => s !== sportKey));
                                }
                              } else {
                                setSingleSports([...singleSports, sportKey]);
                              }
                            }}
                            className="w-4 h-4 text-[#D40511] focus:ring-[#FFCC00] border-gray-300 rounded"
                          />
                          <span>{SPORT_CONFIGS[sportKey].icon} {sportKey}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#D40511] hover:bg-red-700 text-white font-black uppercase italic tracking-wider text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer mt-2"
                >
                  <UserPlus className="w-4 h-4 text-[#FFCC00]" />
                  <span>ចុះឈ្មោះកីឡាករ (Register Athlete)</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-dhl-title text-base text-gray-800 italic uppercase pb-2 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-fuchsia-600" />
                <span>ចុះឈ្មោះជាក្រុមយីហោរ (Crude Bulk JSON Import)</span>
              </h3>
              
              <div className="p-3 bg-fuchsia-50 border border-fuchsia-100 rounded-2xl text-[10px] text-fuchsia-800 leading-relaxed font-semibold">
                🔔 Paste raw JSON structured array mapping name and sport branch below. We will batch register them automatically:
              </div>

              <div className="space-y-4">
                <textarea
                  rows={8}
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#FFCC00] focus:outline-none"
                />

                {bulkError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex gap-1.5 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex gap-1.5 items-start">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>
                      បាច់កីឡាករ {bulkParsedCount} នាក់ ត្រូវបានដាក់បញ្ចូលដោយជោគជ័យ! Success register loop.
                    </span>
                  </div>
                )}

                <button
                  onClick={handleBulkSubmit}
                  className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer animate-pulse"
                >
                  <Upload className="w-4 h-4 text-[#FFCC00]" />
                  <span>ចាប់ផ្តើម IMPORT BULK PLAYERS</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active Athletes Live List & Advanced Action Grid */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6 flex flex-col min-h-[640px]">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-3">
            <div>
              <h3 className="font-dhl-title text-base text-gray-800 italic uppercase">
                តារាងឈ្មោះកីឡាករសរុប (Roster Database Engine)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                Active athlete records : {filteredUniquePlayers.reduce((acc, g) => acc + g.records.length, 0)} / {players.length} players listed
              </p>
            </div>
            
            <input
              type="text"
              placeholder="Search by name / ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs w-full sm:w-48 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FFCC00]"
            />
          </div>

          {/* Filtering row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-1">វិញ្ញាសា:</span>
            <button
              onClick={() => setSportFilter('All')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all duration-200 border cursor-pointer select-none ${
                sportFilter === 'All'
                  ? 'bg-gray-950 text-white border-gray-950'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              All sports
            </button>
            {(getActiveSports() as SportType[]).map((sKey) => (
              <button
                key={sKey}
                onClick={() => setSportFilter(sKey)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all duration-200 border cursor-pointer select-none ${
                  sportFilter === sKey
                    ? 'bg-[#FFCC00] text-gray-950 border-[#FFCC00]'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {getSportConfig(sKey).icon || '🏆'} {sKey}
              </button>
            ))}

            <div className="w-px h-5 bg-gray-200 mx-1"></div>

            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-1">Roster:</span>
            <select
              value={associationFilter}
              onChange={(e) => setAssociationFilter(e.target.value as any)}
              className="bg-white border border-gray-200 px-2 py-1.5 rounded-xl font-bold text-[10px] text-gray-600 focus:outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Assigned">Assigned to Team Only</option>
              <option value="Unassigned">Free Agents Only</option>
            </select>
          </div>

          {/* Table display */}
          <div className="flex-1 overflow-y-auto max-h-[480px] border border-gray-100 rounded-3xl">
            {filteredUniquePlayers.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center text-gray-400">
                <User className="w-12 h-12 opacity-15 mb-3" />
                <p className="text-xs font-bold uppercase text-gray-500">រកកីឡាករមិនឃើញទេ (No Athletes Found)</p>
                <p className="text-[10px] text-gray-400 max-w-xs mt-1">Adjust your dashboard filters or use the left registration form to register your first active competitors.</p>
              </div>
            ) : (
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="p-4 w-16">រូបថត (Image)</th>
                    <th className="p-4 w-44">ឈ្មោះ (Athlete)</th>
                    <th className="p-4 w-56">វិញ្ញាសា (Sports)</th>
                    <th className="p-4 w-60">ក្រុមតំណាងតាមវិញ្ញាសា (Squad / Sport)</th>
                    <th className="p-4 text-right w-24">កែប្រែ (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUniquePlayers.map((group) => {
                    const isEditing = editingPlayerId === group.name;
                    
                    return (
                      <tr key={group.name} className="hover:bg-slate-50/50 transition">
                        {/* Athlete Face Upload Card Thumbnail */}
                        <td className="p-4">
                          <div className="relative group w-10 h-10 rounded-full border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center bg-gray-50">
                            {group.photo_url ? (
                              <img 
                                src={group.photo_url} 
                                alt={group.name} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="font-extrabold text-[#D40511] uppercase tracking-tighter text-xs">
                                {group.name.slice(0, 2)}
                              </span>
                            )}
                            
                            {/* Profile Image Inline Upload Trigger */}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`player-pic-${group.name.replace(/\s+/g, '_')}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    // Update photo for all associated records of this user
                                    group.records.forEach((rec) => {
                                      updateParticipantPhoto(rec.id, reader.result as string);
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label
                              htmlFor={`player-pic-${group.name.replace(/\s+/g, '_')}`}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-all duration-150"
                            >
                              <Camera className="w-3.5 h-3.5 text-[#FFCC00]" />
                            </label>
                          </div>
                        </td>

                        {/* Name edit mode */}
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={editingPlayerName}
                                onChange={(e) => setEditingPlayerName(e.target.value)}
                                className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold font-sans w-28"
                              />
                              <button
                                onClick={() => handleSaveEditName(group.name)}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-black uppercase cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div>
                              <span className="font-extrabold text-gray-800 text-xs block leading-none">{group.name}</span>
                              <span className="text-[8px] font-mono font-semibold text-gray-400 mt-1 block uppercase truncate w-32" title={group.records.map((r) => r.id).join(', ')}>
                                Recs: {group.records.length} slots
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Sports select checkboxes */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {(getActiveSports() as SportType[]).map((sportKey) => {
                              const isActive = group.activeSports.includes(sportKey);
                              return (
                                <button
                                  type="button"
                                  key={sportKey}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    if (isActive) {
                                      // Disenroll from this sport branch
                                      const recToDelete = group.records.find((r) => r.sport_type === sportKey);
                                      if (recToDelete) {
                                        const confirmedStr = `តើអ្នកពិតជាចង់លុបកីឡាករ ${group.name} ចេញពីវិញ្ញាសា ${sportKey} ឬ?`;
                                        if (confirm(confirmedStr)) {
                                          await deleteParticipant(recToDelete.id);
                                        }
                                      }
                                    } else {
                                      // Enroll in this sport
                                      await addParticipant(group.name, sportKey, false, null, group.photo_url || undefined);
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9.5px] font-bold cursor-pointer transition select-none ${
                                    isActive
                                      ? 'bg-[#FFCC00]/15 border-[#FFCC00] text-gray-950 font-black'
                                      : 'bg-white border-gray-150 text-gray-400 hover:bg-gray-50'
                                  }`}
                                  title={`${isActive ? 'Uncheck' : 'Check'} to ${isActive ? 'remove from' : 'join'} ${sportKey}`}
                                >
                                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition ${
                                    isActive 
                                      ? 'bg-[#D40511] border-[#D40511] text-white' 
                                      : 'bg-white border-gray-300'
                                  }`}>
                                    {isActive && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                                  </div>
                                  <span>{getSportConfig(sportKey).icon || '🏆'} {sportKey}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Squad selection per sport */}
                        <td className="p-4">
                          <div className="space-y-1 max-w-xs">
                            {group.records.length === 0 ? (
                              <span className="text-[9px] text-gray-400 italic font-medium">No active sports</span>
                            ) : (
                              group.records.map((rec) => {
                                const possibleTeams = participants.filter((p) => p.is_team && p.sport_type === rec.sport_type);
                                return (
                                  <div key={rec.id} className="flex items-center gap-1.5 p-1 bg-slate-50/60 rounded-lg border border-gray-150 text-[10.5px]">
                                    <span className="font-extrabold text-gray-500 w-16 shrink-0 truncate uppercase tracking-tighter" title={rec.sport_type}>
                                      {getSportConfig(rec.sport_type)?.icon || '🏆'} {rec.sport_type}:
                                    </span>
                                    <select
                                      value={rec.team_id || ''}
                                      onChange={(e) => {
                                        const tVal = e.target.value === '' ? null : e.target.value;
                                        assignPlayerToTeam(rec.id, tVal);
                                      }}
                                      className="bg-transparent font-bold text-gray-800 w-full focus:outline-none focus:bg-white text-[10.5px] max-w-[120px] truncate"
                                    >
                                      <option value="">-- free agent --</option>
                                      {possibleTeams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                          {team.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </td>

                        {/* Name and deletion controls */}
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            {!isEditing && (
                              <button
                                onClick={() => handleStartEditName(group)}
                                className="text-gray-400 hover:text-gray-800 transition font-black uppercase text-[10px] tracking-tight cursor-pointer"
                              >
                                Edit
                              </button>
                            )}

                            <span className="text-gray-200">|</span>

                            {confirmDeleteId === group.name ? (
                              <div className="inline-flex items-center gap-1 animate-fade-in bg-red-50 p-1 rounded-lg border border-red-100">
                                <span className="text-[8px] font-black uppercase text-red-700 tracking-wider">Sure?</span>
                                <button
                                  onClick={async () => {
                                    // Delete all participant records for this person
                                    for (const rec of group.records) {
                                      await deleteParticipant(rec.id);
                                    }
                                    setConfirmDeleteId(null);
                                  }}
                                  className="text-red-600 hover:text-red-800 transition font-black uppercase text-[9px] tracking-tight cursor-pointer"
                                >
                                  Yes
                                </button>
                                <span className="text-gray-300">/</span>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-gray-500 hover:text-gray-700 transition font-black uppercase text-[9px] tracking-tight cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(group.name)}
                                className="text-red-500 hover:text-red-700 transition font-black uppercase text-[10px] tracking-tight cursor-pointer"
                                title="Delete Athlete from all sports entirely"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

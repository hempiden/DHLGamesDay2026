import React, { useState } from 'react';
import { User, UserPlus, Upload, Trash2, Users, Check, AlertCircle, RefreshCw, FileText, Briefcase, Camera, Image, Info } from 'lucide-react';
import { Participant, SportType } from '../types';
import { SPORT_CONFIGS, getSportConfig, getActiveSports } from '../data';

interface AthleteUploadProps {
  participants: Participant[];
  addParticipant: (name: string, sport_type: SportType, is_team: boolean, team_id: string | null, photo_url?: string, gender?: string, eventId?: string, createdBy?: string) => Promise<any>;
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
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk_csv'>('single');
  const [selectedSport, setSelectedSport] = useState<SportType>('Soccer');

  // Single player states
  const [singleName, setSingleName] = useState('');
  const [singleSports, setSingleSports] = useState<SportType[]>(['Soccer']);
  const [singlePhotoBase64, setSinglePhotoBase64] = useState<string | null>(null);

  // Bulk player states (Original text block left intact)
  const [bulkInputText, setBulkInputText] = useState(
    '[\n  { "name": "Sok Vannak", "sport_type": "Soccer" },\n  { "name": "Keo Dara", "sport_type": "Soccer" },\n  { "name": "Chan Pisey", "sport_type": "Volleyball" }\n]'
  );
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkParsedCount, setBulkParsedCount] = useState<number | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState(false);

  // Bulk CSV States
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvDragOver, setCsvDragOver] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvParsedRows, setCsvParsedRows] = useState<{ name: string; sport_type: SportType; gender?: string; photo_url?: string }[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvImportSuccessCount, setCsvImportSuccessCount] = useState<number | null>(null);
  const [csvImportProgress, setCsvImportProgress] = useState(false);

  // Custom standard CSV Parsing algorithm
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentVal += '"';
            i++; 
          } else {
            inQuotes = false;
          }
        } else {
          currentVal += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(currentVal.trim());
          currentVal = '';
        } else if (char === '\n' || char === '\r') {
          row.push(currentVal.trim());
          currentVal = '';
          if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
            lines.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++; 
          }
        } else {
          currentVal += char;
        }
      }
    }
    if (row.length > 0 || currentVal !== '') {
      row.push(currentVal.trim());
      if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
        lines.push(row);
      }
    }
    return lines;
  };

  const handleParseCsvText = (text: string, filename?: string) => {
    setCsvError(null);
    setCsvImportSuccessCount(null);
    try {
      const parsedArray = parseCSV(text);
      if (parsedArray.length === 0) {
        throw new Error('ទីនេះទទេរ ឬគ្មានជួរទិន្នន័យដើម្បីទាញយកឡើយ។ CSV content is empty.');
      }

      // Check for headers
      const potentialHeaders = parsedArray[0].map(h => h.toLowerCase().trim());
      const hasHeader = potentialHeaders.includes('name') || potentialHeaders.includes('ឈ្មោះ') || potentialHeaders.includes('username') || potentialHeaders.includes('sport_type') || potentialHeaders.includes('sport');

      let startIndex = 0;
      let nameColIndex = 0;
      let sportColIndex = 1;
      let genderColIndex = 2;
      let photoColIndex = 3;

      if (hasHeader) {
        startIndex = 1;
        // Find indices
        const nameIdx = potentialHeaders.findIndex(h => h.includes('name') || h === 'ឈ្មោះ' || h === 'username' || h === 'fullname');
        if (nameIdx !== -1) nameColIndex = nameIdx;

        const sportIdx = potentialHeaders.findIndex(h => h.includes('sport') || h.includes('game') || h.includes('វិញ្ញាសា'));
        if (sportIdx !== -1) sportColIndex = sportIdx;

        const genderIdx = potentialHeaders.findIndex(h => h.includes('gender') || h.includes('sex') || h === 'ភេទ');
        if (genderIdx !== -1) genderColIndex = genderIdx;

        const photoIdx = potentialHeaders.findIndex(h => h.includes('photo') || h.includes('image') || h.includes('picture') || h === 'រូបថត');
        if (photoIdx !== -1) photoColIndex = photoIdx;
      }

      const rowsToImport: { name: string; sport_type: SportType; gender?: string; photo_url?: string }[] = [];

      for (let i = startIndex; i < parsedArray.length; i++) {
        const row = parsedArray[i];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) {
          continue;
        }

        const rawName = row[nameColIndex] || '';
        const name = rawName.trim();
        if (!name) continue;

        // Extract gender and normalize ('Man' -> 'Male', 'Woman' -> 'Female')
        const rawGender = row[genderColIndex];
        let gender = rawGender ? rawGender.trim() : undefined;
        if (gender) {
          const gLower = gender.toLowerCase();
          if (gLower === 'man' || gLower === 'male') {
            gender = 'Male';
          } else if (gLower === 'woman' || gLower === 'female') {
            gender = 'Female';
          }
        }

        const rawPhoto = row[photoColIndex];
        const photo_url = rawPhoto ? rawPhoto.trim() : undefined;

        // Extract and normalize sport types (can be multiple separated by ';')
        const rawSportValue = row[sportColIndex] || 'Soccer';
        // Split by semicolon and parse each
        const sportTokens = rawSportValue.split(';').map(s => s.trim()).filter(Boolean);
        
        // If empty tokens, fallback to soccer
        if (sportTokens.length === 0) {
          sportTokens.push('Soccer');
        }

        for (const token of sportTokens) {
          let sType: SportType = 'Soccer';
          const sLower = token.toLowerCase().trim();
          
          if (sLower === 'football' || sLower === 'soccer' || sLower === 'បាល់ទាត់') {
            sType = 'Soccer';
          } else if (sLower === 'volleyball' || sLower === 'បាល់ទះ') {
            sType = 'Volleyball';
          } else if (sLower === 'ping pong' || sLower === 'pingpong' || sLower === 'table tennis' || sLower === 'វាយកូនឃ្លីលើតុ' || sLower === 'tabletennis') {
            sType = 'Pingpong';
          } else if (sLower === 'badminton' || sLower === 'វាយសី' || sLower === 'badmington') {
            sType = 'Badminton';
          } else if (sLower === 'swimming' || sLower === 'ហែលទឹក') {
            sType = 'Swimming';
          } else if (sLower === 'supporter' || sLower === 'អ្នកគាំទ្រ') {
            sType = 'Supporter';
          } else {
            const validSports = getActiveSports() as string[];
            const matched = validSports.find(s => s.toLowerCase() === sLower);
            if (matched) {
              sType = matched as SportType;
            } else {
              sType = (validSports[0] || 'Soccer') as SportType;
            }
          }

          // Check for duplicate in the current import list to maintain integrity
          const isDuplicateInBatch = rowsToImport.some(
            r => r.name.toLowerCase() === name.toLowerCase() && r.sport_type === sType
          );

          if (!isDuplicateInBatch) {
            rowsToImport.push({
              name,
              sport_type: sType,
              gender,
              photo_url
            });
          }
        }
      }

      if (rowsToImport.length === 0) {
        throw new Error('គ្មានកីឡាករដែលមានឈ្មោះត្រឹមត្រូវឡើយ។ No valid athlete rows found after parsing.');
      }

      setCsvParsedRows(rowsToImport);
      if (filename) {
        setCsvFileName(filename);
      }
    } catch (err: any) {
      setCsvError(err.message || 'Error occurred while parsing CSV.');
    }
  };

  const handleCsvImportCommit = async () => {
    if (csvParsedRows.length === 0) return;
    setCsvImportProgress(true);
    setCsvError(null);
    setCsvImportSuccessCount(null);

    let successCount = 0;
    try {
      for (const item of csvParsedRows) {
        const exists = players.some(
          (p) => p.name.toLowerCase().trim() === item.name.toLowerCase().trim() && p.sport_type === item.sport_type
        );
        if (exists) {
          continue;
        }

        // We explicitly do NOT specify nor pass event_id, created_by parameters,
        // fulfilling "event_id, created_by should be defined by system".
        const success = await addParticipant(
          item.name,
          item.sport_type,
          false,
          null,
          item.photo_url || undefined,
          item.gender || undefined
        );
        if (success) {
          successCount++;
        }
      }
      setCsvImportSuccessCount(successCount);
      alert(`កីឡាករចំនួន ${successCount} នាក់ត្រូវបានបញ្ចូលដោយជោគជ័យ! Imported ${successCount} new athletes.`);
      setCsvParsedRows([]);
      setCsvFileName(null);
      setCsvRawText('');
    } catch (err: any) {
      setCsvError(err.message || 'Error occurred during database import.');
    } finally {
      setCsvImportProgress(false);
    }
  };

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
        let sType = (item.sport_type || 'Soccer').trim();
        
        // Normalize common spelling variants of sport names
        const sLower = sType.toLowerCase();
        if (sLower === 'football' || sLower === 'soccer') {
          sType = 'Soccer';
        } else if (sLower === 'volleyball') {
          sType = 'Volleyball';
        } else if (sLower === 'ping pong' || sLower === 'pingpong') {
          sType = 'Pingpong';
        } else if (sLower === 'badminton') {
          sType = 'Badminton';
        } else if (sLower === 'swimming') {
          sType = 'Swimming';
        } else if (sLower === 'supporter') {
          sType = 'Supporter';
        }

        // Validate sport type against active sports
        const validSports = getActiveSports() as string[];
        const isStandard = ['Soccer', 'Volleyball', 'Pingpong', 'Badminton', 'Swimming', 'Supporter'].includes(sType);
        if (!validSports.includes(sType) && !isStandard) {
          throw new Error(`Invalid sport_type "${sType}". Must be one of standard sports or active custom event sports.`);
        }

        await addParticipant(item.name.trim(), sType, false, null, item.photo_url || undefined, item.gender, item.event_id, item.created_by);
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
            Athlete Hub Terminal
          </h2>
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">
            Register players and upload profile assets for tournament sports
          </p>
        </div>
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => setUploadMode('single')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 select-none cursor-pointer ${
              uploadMode === 'single'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            ចុះឈ្មោះម្នាក់ៗ (Single Athlete)
          </button>
          <button
            onClick={() => setUploadMode('bulk_csv')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 select-none cursor-pointer ${
              uploadMode === 'bulk_csv'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            បញ្ចូលជាក្រុម CSV (Bulk CSV)
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
                          <span>{getSportConfig(sportKey).icon} {sportKey}</span>
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
              <h3 className="font-dhl-title text-base text-gray-800 italic uppercase pb-2 border-b border-gray-100">
                បញ្ចូលកីឡាករដោយប្រើ CSV (Bulk CSV Uploader)
              </h3>

              <div className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setCsvDragOver(true);
                  }}
                  onDragLeave={() => setCsvDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setCsvDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const text = evt.target?.result as string;
                        setCsvRawText(text);
                        handleParseCsvText(text, file.name);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  onClick={() => {
                    document.getElementById('csv-file-input')?.click();
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 ${
                    csvDragOver
                      ? 'border-[#FFCC00] bg-[#FFCC00]/5 scale-[0.99]'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const text = evt.target?.result as string;
                          setCsvRawText(text);
                          handleParseCsvText(text, file.name);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <Upload className="w-10 h-10 text-[#D40511] mx-auto mb-2" />
                  <p className="text-xs font-black text-gray-700 uppercase tracking-wide">
                    {csvFileName ? `Selected: ${csvFileName}` : 'ទម្លាក់ឯកសារ CSV ឬចុចទីនេះដើម្បីជ្រើសរើស (Drag & Drop CSV)'}
                  </p>
                  <p className="text-[9.5px] text-gray-400 mt-1 uppercase font-bold leading-tight">
                    Files up to 10MB accepted
                  </p>
                </div>

                {/* Or Text Area Manual Paste */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                    ឬបិទភ្ជាប់ទិន្នន័យ CSV (Or Paste Raw CSV Data)
                  </label>
                  <textarea
                    placeholder="name,sport_type,gender&#10;Sok Vannak,Soccer,Male&#10;Keo Dara,Volleyball,Male"
                    value={csvRawText}
                    onChange={(e) => {
                      setCsvRawText(e.target.value);
                      handleParseCsvText(e.target.value, 'Pasted Data.csv');
                    }}
                    rows={5}
                    className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-xl font-mono text-[10.5px] outline-none focus:ring-2 focus:ring-[#FFCC00]"
                  />
                </div>

                {/* Sample Layout Card */}
                <div className="p-3.5 bg-yellow-50/70 border border-yellow-200 rounded-2xl text-[10.5px] leading-relaxed text-yellow-900 font-medium">
                  <p className="font-extrabold uppercase text-[9.5px] text-yellow-800 tracking-wider mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> គំរូទម្រង់តារាង (CSV Columns)
                  </p>
                  <code className="block bg-white/80 p-1.5 rounded-lg font-mono text-[9.5px] text-gray-700">
                    name,sport_type,gender,photo_url
                  </code>
                  <p className="mt-1">
                    * វិញ្ញាសាដែលគាំទ្រ (Supported sports): Soccer, Volleyball, Pingpong, Badminton, Swimming, Supporter
                  </p>
                </div>

                {/* Display Error if any */}
                {csvError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-[10.5px] font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <p>{csvError}</p>
                  </div>
                )}

                {/* Display bulk csv summary count */}
                {csvParsedRows.length > 0 && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 text-blue-900 rounded-2xl space-y-2">
                    <p className="text-[11px] font-extrabold uppercase text-blue-800 tracking-wider">
                      កែសម្រួលដើម្បីត្រៀមបញ្ជូល (Ready to Import: {csvParsedRows.length} Rows)
                    </p>
                    <div className="max-h-[120px] overflow-y-auto divide-y divide-blue-150 text-[10px]">
                      {csvParsedRows.slice(0, 5).map((row, idx) => (
                        <div key={idx} className="py-1 flex justify-between font-bold">
                          <span className="truncate max-w-[120px]">{row.name}</span>
                          <span className="text-blue-700">{row.sport_type}</span>
                        </div>
                      ))}
                      {csvParsedRows.length > 5 && (
                        <div className="py-1 text-center font-bold text-[9px] text-blue-500 uppercase tracking-widest">
                          And {csvParsedRows.length - 5} more rows...
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleCsvImportCommit}
                      disabled={csvImportProgress}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-[10.5px] rounded-xl shadow transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                    >
                      {csvImportProgress ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>កំពុងបញ្ចូល... (Importing...)</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>បញ្ជូនទិន្នន័យ (Import {csvParsedRows.length} Athletes)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Import Success Message */}
                {csvImportSuccessCount !== null && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[10.5px] font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <p>បានទាញបញ្ចូលកីឡាករ {csvImportSuccessCount} នាក់ដោយជោគជ័យ! Commited athletes to database.</p>
                  </div>
                )}
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

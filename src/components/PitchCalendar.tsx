import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Trash2, ShieldAlert, CheckCircle, HelpCircle, Layers, MapPin, User, FileText, Check, AlertCircle } from 'lucide-react';
import { AppUser, Match, OrganizationInfo, SportType } from '../types';
import { getActiveSports, getSportConfig } from '../data';

interface PitchCalendarProps {
  organization: OrganizationInfo;
  currentUser: AppUser | null;
  matches: Match[];
  onUpdateMatchFields?: (matchId: string, fields: Partial<Match>) => Promise<boolean>;
  currentLanguage?: 'kh' | 'en';
}

interface PitchBooking {
  id: string;
  bookerName: string;
  sportName: string;
  pitchNumber: number;
  date: string;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "09:00"
  notes?: string;
  status: 'Reserved' | 'Approved' | 'Host-Blocked';
  isLeagueMatch?: boolean;
  matchId?: string;
}

const HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00'
];

export default function PitchCalendar({
  organization,
  currentUser,
  matches,
  onUpdateMatchFields,
  currentLanguage = 'kh'
}: PitchCalendarProps) {
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin');

  // Selected date state defaulting to "2026-06-16" (matching tournament day)
  const [selectedDate, setSelectedDate] = useState('2026-06-16');
  
  // Selected sport state
  const activeSports = useMemo(() => getActiveSports(), []);
  const [selectedSport, setSelectedSport] = useState<string>(activeSports[0] || 'Soccer');

  // Bookings state loaded from LocalStorage
  const [bookings, setBookings] = useState<PitchBooking[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dhl_pitch_bookings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse dhl_pitch_bookings:', e);
        }
      }
    }
    
    // Default system seed bookings for 2026-06-16 to present instant value
    return [
      {
        id: 'book-1',
        bookerName: 'Group Stage Match: Express vs Supply Chain',
        sportName: 'Soccer',
        pitchNumber: 1,
        date: '2026-06-16',
        startTime: '08:00',
        endTime: '09:00',
        notes: 'Official Tournament Match #1',
        status: 'Approved',
        isLeagueMatch: true,
        matchId: 'match-1'
      },
      {
        id: 'book-2',
        bookerName: 'Friendly Practice Team A',
        sportName: 'Soccer',
        pitchNumber: 2,
        date: '2026-06-16',
        startTime: '10:00',
        endTime: '11:00',
        notes: 'Coached training block',
        status: 'Reserved'
      },
      {
        id: 'book-3',
        bookerName: 'Corporate Volleyball Semifinals',
        sportName: 'Volleyball',
        pitchNumber: 1,
        date: '2026-06-16',
        startTime: '14:00',
        endTime: '15:00',
        notes: 'Match setup 30m prior',
        status: 'Approved',
        isLeagueMatch: true,
        matchId: 'match-2'
      },
      {
        id: 'book-4',
        bookerName: 'IT Solutions vs Aviation warmup',
        sportName: 'Pingpong',
        pitchNumber: 1,
        date: '2026-06-16',
        startTime: '09:00',
        endTime: '10:00',
        notes: 'Settle rackets',
        status: 'Reserved'
      }
    ];
  });

  // Save bookings to LocalStorage whenever altered
  useEffect(() => {
    localStorage.setItem('dhl_pitch_bookings', JSON.stringify(bookings));
  }, [bookings]);

  // Modal / Creator State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBooker, setNewBooker] = useState('');
  const [newPitchNum, setNewPitchNum] = useState(1);
  const [newStartHour, setNewStartHour] = useState('08:00');
  const [newEndHour, setNewEndHour] = useState('09:00');
  const [newStatus, setNewStatus] = useState<'Reserved' | 'Approved' | 'Host-Blocked'>('Approved');
  const [newNotes, setNewNotes] = useState('');
  const [newIsLeagueMatch, setNewIsLeagueMatch] = useState(false);
  const [newMatchId, setNewMatchId] = useState('');

  // Number of pitches for the selected sport in organization configuration
  const pitchesCount = useMemo(() => {
    if (organization.pitchesConfig && organization.pitchesConfig[selectedSport]) {
      return organization.pitchesConfig[selectedSport];
    }
    // Default allocations if not customized
    if (selectedSport === 'Soccer') return 2;
    if (selectedSport === 'Volleyball') return 2;
    if (selectedSport === 'Pingpong') return 4;
    if (selectedSport === 'Badminton') return 4;
    if (selectedSport === 'Swimming') return 6;
    return 2;
  }, [organization.pitchesConfig, selectedSport]);

  const activeSportConfig = useMemo(() => {
    return getSportConfig(selectedSport);
  }, [selectedSport]);

  // Navigate date offset
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const yr = current.getFullYear();
    const mo = String(current.getMonth() + 1).padStart(2, '0');
    const dy = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${dy}`);
  };

  // Filtered bookings for the selected date and sport
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => b.date === selectedDate && b.sportName === selectedSport);
  }, [bookings, selectedDate, selectedSport]);

  // Map of bookings by pitch and start hour for instant lookup in the schedule grid
  const bookingsGridMap = useMemo(() => {
    const map: Record<string, PitchBooking> = {};
    filteredBookings.forEach(b => {
      const key = `${b.pitchNumber}_${b.startTime}`;
      map[key] = b;
    });
    return map;
  }, [filteredBookings]);

  // List of active unscheduled/unassigned matches belonging to this sport
  // Offers swift auto-booking mapping
  const leagueMatchesForSport = useMemo(() => {
    return matches.filter(m => m.sport_name === selectedSport);
  }, [matches, selectedSport]);

  // Trigger quick click in cell to prepopulate slot addition
  const handleCellClick = (pitchNum: number, hour: string) => {
    if (!isAdmin) return; // Spectators cannot write
    
    // Check if slot has booking
    if (bookingsGridMap[`${pitchNum}_${hour}`]) return;

    // Prefill setup modal fields
    setNewBooker('');
    setNewPitchNum(pitchNum);
    setNewStartHour(hour);
    // Auto incremental end hour
    const idx = HOURS.indexOf(hour);
    const end = idx < HOURS.length - 1 ? HOURS[idx + 1] : '22:00';
    setNewEndHour(end);
    setNewNotes('');
    setNewStatus('Approved');
    setNewIsLeagueMatch(false);
    setNewMatchId('');
    setShowAddModal(true);
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooker.trim()) {
      alert(currentLanguage === 'kh' ? 'សូមបញ្ចូលឈ្មោះអ្នកកក់!' : 'Please enter the booker or match identifier!');
      return;
    }

    // Check conflict
    const isConflict = bookings.some(b => 
      b.date === selectedDate &&
      b.sportName === selectedSport &&
      b.pitchNumber === newPitchNum &&
      ((newStartHour >= b.startTime && newStartHour < b.endTime) ||
       (newEndHour > b.startTime && newEndHour <= b.endTime) ||
       (newStartHour <= b.startTime && newEndHour >= b.endTime))
    );

    if (isConflict) {
      alert(currentLanguage === 'kh' 
        ? '⚠️ ម៉ោងនេះមានការកក់រួចហើយនៅលើទីលាននេះ! សូមជ្រើសរើសម៉ោងផ្សេង។' 
        : '⚠️ This slot conflicts with an existing booking on this pitch/court!'
      );
      return;
    }

    const created: PitchBooking = {
      id: 'book-' + Date.now(),
      bookerName: newBooker.trim(),
      sportName: selectedSport,
      pitchNumber: newPitchNum,
      date: selectedDate,
      startTime: newStartHour,
      endTime: newEndHour,
      notes: newNotes.trim(),
      status: newStatus,
      isLeagueMatch: newIsLeagueMatch,
      matchId: newIsLeagueMatch && newMatchId ? newMatchId : undefined
    };

    setBookings(prev => [...prev, created]);
    setShowAddModal(false);

    // Sync match date/time if we mapped it
    if (newIsLeagueMatch && newMatchId && onUpdateMatchFields) {
      onUpdateMatchFields(newMatchId, {
        scheduled_date: selectedDate,
        scheduled_time: newStartHour
      });
    }
  };

  const handleDeleteBooking = (id: string) => {
    if (!isAdmin) return;
    const confirm = window.confirm(currentLanguage === 'kh' 
      ? 'តើអ្នកពិតជាចង់លុបការកក់ទីលាននេះមែនទេ?' 
      : 'Are you sure you want to release this pitch booking?'
    );
    if (confirm) {
      setBookings(prev => prev.filter(b => b.id !== id));
    }
  };

  // Autocomplete booking fields using a tournament match info
  const handleAutoFillMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      setNewBooker(`League Match: ${match.team_a} vs ${match.team_b}`);
      setNewNotes(`${match.match_label || 'Official Game Stage'}`);
      setNewIsLeagueMatch(true);
      setNewMatchId(matchId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">Approved</span>;
      case 'Reserved':
        return <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">Pending</span>;
      case 'Host-Blocked':
        return <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">Blocked</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Upper header section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-[#D40511] p-3 rounded-2xl border border-red-100 shadow-2xs shrink-0">
            <Calendar className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide leading-tight">
              {currentLanguage === 'kh' ? 'កាលវិភាគទីលានប្រកួត (Court Slot Planner)' : 'Pitches & Court Calendar'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              {currentLanguage === 'kh'
                ? `ចាត់ចែង បំពេញម៉ោង និងតាមដានទីធ្លារផ្គត់ផ្គង់ទីលាន (ភូមិសាស្ត្រ៖ ${organization.name})`
                : `Plan allocations, book practice matches, and lock pitch lanes for ${organization.name}`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className="bg-emerald-50 text-emerald-800 text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5 shadow-3xs select-none">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'kh' ? 'សិទ្ធិអ្នករៀបចំ (Planner Privilege Mode)' : 'Admin Scheduling On'}</span>
            </div>
          ) : (
            <div className="bg-blue-50 text-blue-700 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-1.5 select-none">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'kh' ? 'ទម្រង់អាន (Spectator Mode)' : 'Spectator View Only'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Top bar Left: Quick Date picker card */}
        <div className="xl:col-span-3 bg-white rounded-3xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between space-y-4">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'kh' ? 'ជ្រើសរើសកាលបរិច្ឆេទ (Active Date)' : 'Target Date Selector'}</span>
          </p>

          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="p-1.5 bg-gray-50 border border-gray-150 rounded-xl hover:bg-gray-100 transition active:scale-95 cursor-pointer text-gray-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-50 border border-gray-150 rounded-xl px-2.5 py-1.5 text-center font-mono font-black text-xs text-gray-800 outline-none focus:ring-2 focus:ring-yellow-400 shrink-0 w-36"
            />

            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="p-1.5 bg-gray-50 border border-gray-150 rounded-xl hover:bg-gray-100 transition active:scale-95 cursor-pointer text-gray-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate('2026-06-16')}
            className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition duration-150 cursor-pointer ${
              selectedDate === '2026-06-16' 
                ? 'bg-amber-100 text-amber-800 font-extrabold border border-amber-200' 
                : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'
            }`}
          >
            📅 {currentLanguage === 'kh' ? 'ត្រឡប់ទៅថ្ងៃកម្មវិធី (June 16, 2026)' : 'Tournament Day (Default)'}
          </button>
        </div>

        {/* Top bar Right: Sport Pitch selector tabs in 1 Row */}
        <div className="xl:col-span-9 bg-white rounded-3xl p-5 border border-gray-150 shadow-sm flex flex-col justify-between space-y-3">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider border-b border-gray-100 pb-2">
            {currentLanguage === 'kh' ? 'ជ្រើសរើសប្រភេទកីឡា (Sport Fields Selection)' : 'Filter Sport Category'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full">
            {activeSports.map(sport => {
              const conf = getSportConfig(sport);
              const isSelected = selectedSport === sport;
              const custCount = organization.pitchesConfig?.[sport] || (
                sport === 'Soccer' ? 2 : sport === 'Volleyball' ? 2 : sport === 'Pingpong' ? 4 : sport === 'Badminton' ? 4 : sport === 'Swimming' ? 6 : 2
              );

              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  className={`flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-2xl cursor-pointer text-center sm:text-left transition duration-155 border uppercase text-xs tracking-wide gap-2.5 h-full ${
                    isSelected
                      ? 'bg-[#1a1a1a] shadow-xs border-[#1a1a1a] text-white'
                      : 'bg-gray-50 border-gray-150 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-xl shrink-0 leading-none">{conf.icon}</span>
                    <div>
                      <p className={`font-black tracking-tight leading-tight ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {currentLanguage === 'kh' ? conf.khmerName : sport}
                      </p>
                      <p className={`text-[9px] font-mono leading-none font-semibold ${isSelected ? 'text-gray-300' : 'text-gray-450'}`}>
                        {sport}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-black shrink-0 ${
                    isSelected ? 'bg-white/15 text-[#FFCC00]' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {custCount}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Split: Info Guide block and Main Grid schedule day layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side column: Guide Info */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-5 text-[#cccccc] text-[10.5px] border border-slate-950 shadow-sm space-y-3 leading-relaxed">
            <p className="font-extrabold uppercase tracking-wider text-[#FFCC00] flex items-center gap-1.5 border-b border-white/10 pb-2">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{currentLanguage === 'kh' ? 'របៀបចាត់ចែងទីលាន' : 'Scheduling manual'}</span>
            </p>
            {currentLanguage === 'kh' ? (
              <ul className="space-y-1.5 list-disc pl-4 text-gray-300 font-medium">
                <li><strong className="text-white">សិទ្ធិអ្នកគ្រប់គ្រង៖</strong> គ្រាន់តែចុចលើប្រឡោះម៉ោងទំនេរណាមួយក្នុងតារាង ដើម្បីបន្ថែមការកក់ថ្មី។</li>
                <li><strong className="text-white">ចំនួនទីលាន៖</strong> អ្នកអាចកែសម្រួលចំនួនទីលានសម្រាប់ផ្នែកនីមួយៗបាន នៅក្នុងទំព័រ "Org Settings"។</li>
                <li><strong className="text-white">ភ្ជាប់ជាមួយការប្រកួត៖</strong> ប្រឡោះកក់ផ្លូវការនឹងមានសញ្ញាសម្គាល់ <span className="text-amber-400">★ League</span>។</li>
              </ul>
            ) : (
              <ul className="space-y-1.5 list-disc pl-4 text-gray-300 font-medium">
                <li><strong className="text-white">Admins:</strong> Just click any blank cell in the schedule grid to reserve that slot instantly.</li>
                <li><strong className="text-white">Pitch Cap:</strong> Adjust the absolute number of courts for any sport under the super admin "Org Settings".</li>
                <li><strong className="text-white">Official Games:</strong> Bookings mapped to league fixtures carry a specialized gold badge.</li>
              </ul>
            )}
          </div>
        </div>

        {/* Right Side column: Calendar grid */}
        <div className="xl:col-span-9 space-y-6">
          
          {/* Calendar visual wrapper */}
          <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm overflow-hidden space-y-4">
            
            {/* Grid Header Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 select-none text-xs text-gray-400 uppercase font-black">
                <span className="text-lg">{activeSportConfig.icon}</span>
                <span>
                  {activeSportConfig.khmerName} &bull; {selectedSport}
                </span>
                <span className="bg-[#FFCC00]/20 text-gray-900 border border-[#FFCC00]/10 px-2 py-0.5 rounded-md font-mono font-black text-[9px] uppercase tracking-wider">
                  {pitchesCount} PITCHES TOTAL AVAILABLE
                </span>
              </div>

              <div className="text-[11px] font-mono font-bold text-gray-550 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-xl">
                🗓️ Selected: {selectedDate}
              </div>
            </div>

            {/* Scrollable Calendar Grid Container */}
            <div className="overflow-x-auto min-w-full rounded-2xl border border-gray-150">
              <table className="min-w-full border-collapse text-left select-none text-[11px]">
                
                {/* Columns representing pitches */}
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150">
                    <th className="p-3.5 font-bold text-gray-400 uppercase tracking-wider border-r border-gray-150 w-24 text-center">
                      ⏱️ {currentLanguage === 'kh' ? 'ម៉ោង' : 'Hour'}
                    </th>
                    {Array.from({ length: pitchesCount }).map((_, idx) => {
                      const pitchNum = idx + 1;
                      return (
                        <th 
                          key={pitchNum} 
                          className="p-3.5 font-black text-gray-800 uppercase tracking-wider text-center border-r border-gray-150 last:border-r-0 min-w-[200px]"
                        >
                          📍 {currentLanguage === 'kh' ? `${activeSportConfig.khmerName} ទី ${pitchNum}` : `Pitch/Court ${pitchNum}`}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Rows representing hours */}
                <tbody>
                  {HOURS.map(hour => {
                    return (
                      <tr key={hour} className="border-b border-gray-100 last:border-b-0 group hover:bg-gray-50/20">
                        <td className="p-3 font-mono font-black text-gray-500 bg-gray-50/50 border-r border-gray-100 border-b border-gray-100 align-middle text-center">
                          {hour}
                        </td>

                        {Array.from({ length: pitchesCount }).map((_, colIdx) => {
                          const pitchNum = colIdx + 1;
                          const gridKey = `${pitchNum}_${hour}`;
                          const booking = bookingsGridMap[gridKey];

                          return (
                            <td 
                              key={pitchNum} 
                              onClick={() => handleCellClick(pitchNum, hour)}
                              className={`p-2 border-r border-gray-100 last:border-r-0 align-top relative min-h-[64px] transition ${
                                booking 
                                  ? 'bg-amber-500/5' 
                                  : isAdmin 
                                  ? 'hover:bg-yellow-400/10 cursor-pointer group-hover:transition duration-75' 
                                  : 'bg-white'
                              }`}
                            >
                              {booking ? (
                                <div className="p-3 bg-white border border-gray-200 shadow-3xs rounded-xl space-y-2 relative group/item hover:border-gray-300 transition duration-150">
                                  
                                  {/* Delete booking badge for admin */}
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBooking(booking.id);
                                      }}
                                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg opacity-0 group-hover/item:opacity-100 transition duration-150 cursor-pointer"
                                      title={currentLanguage === 'kh' ? 'លុបការកក់' : 'Delete allocation'}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}

                                  <div className="space-y-1">
                                    <div className="flex items-start gap-1 pr-6 flex-wrap">
                                      {booking.isLeagueMatch && (
                                        <span className="bg-yellow-100 text-amber-800 border border-yellow-200 text-[8px] font-black uppercase px-1 py-0.25 rounded-md tracking-wider flex items-center gap-0.5">
                                          ★ League
                                        </span>
                                      )}
                                      {getStatusBadge(booking.status)}
                                    </div>

                                    <h5 className="font-extrabold text-gray-800 text-[11.5px] leading-snug">
                                      {booking.bookerName}
                                    </h5>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1.5 border-t border-gray-50 text-[9.5px] text-gray-400 font-bold">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="font-mono">{booking.startTime} - {booking.endTime}</span>
                                    </div>
                                    {booking.notes && (
                                      <div className="flex items-center gap-0.5 max-w-[120px] truncate text-[9px]">
                                        <span>&bull;</span>
                                        <span>{booking.notes}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150">
                                  {isAdmin ? (
                                    <span className="text-[9.5px] text-yellow-600 bg-yellow-100 border border-yellow-200 px-2 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1 hover:scale-105">
                                      <Plus className="w-3 h-3" />
                                      {currentLanguage === 'kh' ? 'កក់ម៉ោងទំនេរ' : 'Reserve Slot'}
                                    </span>
                                  ) : (
                                    <span className="text-[9.5px] text-gray-300 font-bold select-none">
                                      {currentLanguage === 'kh' ? 'ទំនេរ' : 'Slot Vacant'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          {/* Quick Schedule League helper box for Admin */}
          {isAdmin && (
            <div className="bg-gradient-to-tr from-slate-100 to-slate-50 rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-250 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-700 animate-bounce" />
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide leading-none">
                      {currentLanguage === 'kh' ? 'រាយនាមការប្រកួតផ្លូវការ (Live Tournament Matches)' : 'Map League Matches to Calendar'}
                    </h4>
                    <p className="text-[9.5px] text-gray-400 font-semibold mt-1">
                      {currentLanguage === 'kh'
                        ? 'រៀបចំម៉ោងវិញ្ញាសាដែលមិនទាន់មានលម្អិតទីលាន (បន្ទះជំនួយរហ័ស)'
                        : 'Quickly map scheduled league games onto the pitches. Select a match to autofill booking details.'
                      }
                    </p>
                  </div>
                </div>
                
                <span className="text-[9px] bg-slate-900 text-[#FFCC00] font-black uppercase px-2 py-0.5 rounded-full">
                  Quick Fill Drawer
                </span>
              </div>

              {leagueMatchesForSport.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-52 overflow-y-auto pr-1">
                  {leagueMatchesForSport.map(match => {
                    const isAlreadyBooked = bookings.some(b => b.matchId === match.id);

                    return (
                      <div 
                        key={match.id} 
                        className={`p-3 bg-white border rounded-2xl flex flex-col justify-between gap-2.5 transition-all duration-150 hover:shadow-xs relative border-gray-200`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] bg-gray-100 text-gray-500 font-black tracking-wide px-1.5 py-0.25 rounded-md uppercase">
                              {match.match_label || 'Round Robin'}
                            </span>
                            {isAlreadyBooked ? (
                              <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.25 rounded-md">
                                <Check className="w-3 h-3" /> Booked
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.25 rounded-md">
                                <AlertCircle className="w-3 h-3" /> Unplaced
                              </span>
                            )}
                          </div>
                          
                          <p className="font-black text-xs text-gray-800 leading-tight">
                            ⚽ {match.team_a} vs {match.team_b}
                          </p>
                        </div>

                        {!isAlreadyBooked && (
                          <div className="flex items-center justify-end select-none">
                            <button
                              type="button"
                              onClick={() => {
                                setNewBooker(`League Match: ${match.team_a} vs ${match.team_b}`);
                                setNewNotes(`${match.match_label || 'Official Game Stage'}`);
                                setNewIsLeagueMatch(true);
                                setNewMatchId(match.id);
                                // Pick suitable defaults for pitch and hour selection
                                setNewPitchNum(1);
                                setNewStartHour('09:00');
                                setNewEndHour('10:00');
                                setShowAddModal(true);
                              }}
                              className="px-2.5 py-1 text-[9px] font-black uppercase text-gray-700 bg-amber-500 hover:bg-amber-600 hover:shadow-3xs font-extrabold rounded-lg cursor-pointer transition active:scale-95 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3 text-slate-800" />
                              <span>{currentLanguage === 'kh' ? 'ចាត់ទីលានប្រកួត' : 'Place on Pitch'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 font-black text-[10px] uppercase">
                  🔇 {currentLanguage === 'kh' ? 'មិនទាន់មានការប្រកួតផ្លូវការក្នុងវិញ្ញាសានេះនៅឡើយទេ' : 'No league fixtures are created in this sport category.'}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Booking Form Dialog Modal overlay */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-xs font-semibold select-none text-slate-700">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-gray-150 shadow-2xl space-y-5 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shadow-3xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D40511]" />
                <h3 className="font-black text-gray-800 uppercase tracking-wide">
                  {currentLanguage === 'kh' ? 'បន្ថែមការកក់ទីលានថ្មី' : 'Create Pitch Allocation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 px-2 text-gray-400 hover:text-gray-800 font-black hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-4">
              
              {/* Booker Info */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                  ឈ្មោះអ្នកកក់ ឬ ឈ្មោះគូប្រកួត (Booker / Match Name) <strong className="text-red-500">*</strong>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friendly Match A or Group Stage Game"
                  value={newBooker}
                  onChange={(e) => setNewBooker(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold"
                />
              </div>

              {/* Pitch Number and Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    លេខទីលាន (Pitch / Court #)
                  </label>
                  <select
                    value={newPitchNum}
                    onChange={(e) => setNewPitchNum(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold cursor-pointer"
                  >
                    {Array.from({ length: pitchesCount }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        Court/Pitch {idx + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    ស្ថានភាព (Reservation Status)
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold cursor-pointer font-extrabold"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Reserved">Pending Approval</option>
                    <option value="Host-Blocked">Host-Blocked</option>
                  </select>
                </div>
              </div>

              {/* Time slots rows */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    ម៉ោងចាប់ផ្តើម (Start Hour)
                  </label>
                  <select
                    value={newStartHour}
                    onChange={(e) => setNewStartHour(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono font-bold cursor-pointer"
                  >
                    {HOURS.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    ម៉ោងបញ្ចាប់ (End Hour)
                  </label>
                  <select
                    value={newEndHour}
                    onChange={(e) => setNewEndHour(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono font-bold cursor-pointer"
                  >
                    {HOURS.concat(['22:00']).filter(h => h > newStartHour).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 border border-slate-150 p-2.5 rounded-2xl">
                <div className="flex items-center gap-1">
                  <input
                    id="checkbox-league"
                    type="checkbox"
                    checked={newIsLeagueMatch}
                    onChange={(e) => {
                      setNewIsLeagueMatch(e.target.checked);
                      if (!e.target.checked) setNewMatchId('');
                    }}
                    className="rounded text-[#D40511] focus:ring-[#D40511] cursor-pointer"
                  />
                  <label htmlFor="checkbox-league" className="text-[9.5px] font-extrabold uppercase text-slate-650 cursor-pointer select-none">
                    ភ្ជាប់ជាមួយការប្រកួតផ្លូវការ (Assign to Live Tournament Match)
                  </label>
                </div>

                {newIsLeagueMatch && (
                  <div className="pt-2">
                    <select
                      value={newMatchId}
                      onChange={(e) => handleAutoFillMatch(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 outline-none font-bold text-[11px]"
                    >
                      <option value="">-- {currentLanguage === 'kh' ? 'ជ្រើសរើសការប្រកួត' : 'Select live game'} --</option>
                      {matches.filter(m => m.sport_name === selectedSport).map(m => (
                        <option key={m.id} value={m.id}>
                          {m.team_a} vs {m.team_b} ({m.match_label})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Booking Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                  កំណត់សម្គាល់បន្ថែម (Notes / Description - Optional)
                </label>
                <input
                  type="text"
                  placeholder="Need 4 bibs, extra water etc."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                />
              </div>

              {/* Submit triggers */}
              <div className="pt-4 border-t border-gray-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[11px] font-[#1a1a1a] font-bold cursor-pointer transition active:scale-95"
                >
                  {currentLanguage === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-[11px] font-black uppercase text-slate-900 font-extrabold hover:shadow-md cursor-pointer transition active:scale-95"
                >
                  {currentLanguage === 'kh' ? 'យល់ព្រមរក្សាទុក' : 'Save allocation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

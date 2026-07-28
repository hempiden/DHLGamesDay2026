import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Trash2, ShieldAlert, CheckCircle, HelpCircle, Layers, MapPin, User, FileText, Check, AlertCircle, ArrowRightLeft, Pencil } from 'lucide-react';
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

// Helper to generate hours for grid step
const generateHours = (stepMins: number = 5, startH: number = 7, endH: number = 22): string[] => {
  const result: string[] = [];
  for (let h = startH; h <= endH; h++) {
    for (let m = 0; m < 60; m += stepMins) {
      if (h === endH && m > 0) break;
      const hStr = String(h).padStart(2, '0');
      const mStr = String(m).padStart(2, '0');
      result.push(`${hStr}:${mStr}`);
    }
  }
  return result;
};

// Generated 5-minute step time options for dropdown select inputs (06:00 to 23:00)
const generateTimeOptions = (stepMins: number = 5, startH: number = 6, endH: number = 23): string[] => {
  const options: string[] = [];
  for (let h = startH; h <= endH; h++) {
    for (let m = 0; m < 60; m += stepMins) {
      if (h === endH && m > 0) break;
      const hStr = String(h).padStart(2, '0');
      const mStr = String(m).padStart(2, '0');
      options.push(`${hStr}:${mStr}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions(5, 6, 23);

const addMinutesToTime = (timeStr: string, mins: number): string => {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const totalMins = h * 60 + m + mins;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

const getDurationMinutes = (startTime: string, endTime: string): number => {
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? diff : 0;
};

const getTodayString = () => {
  const today = new Date();
  const yr = today.getFullYear();
  const mo = String(today.getMonth() + 1).padStart(2, '0');
  const dy = String(today.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
};

export default function PitchCalendar({
  organization,
  currentUser,
  matches,
  onUpdateMatchFields,
  currentLanguage = 'kh'
}: PitchCalendarProps) {
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin');

  // Selected date state defaulting to saved localStorage date or today's local date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('dhl_pitch_calendar_date');
      if (savedDate && /^\d{4}-\d{2}-\d{2}$/.test(savedDate)) {
        return savedDate;
      }
    }
    return getTodayString();
  });

  // Save selected date to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dhl_pitch_calendar_date', selectedDate);
    }
  }, [selectedDate]);
  
  // Selected sport state
  const activeSports = useMemo(() => getActiveSports(), []);
  const [selectedSport, setSelectedSport] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedSport = localStorage.getItem('dhl_pitch_calendar_sport');
      if (savedSport && activeSports.includes(savedSport as any)) {
        return savedSport;
      }
    }
    return activeSports[0] || 'Soccer';
  });

  // Save selected sport to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dhl_pitch_calendar_sport', selectedSport);
    }
  }, [selectedSport]);

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
    
    // Default system seed bookings for today & 2026-06-16 to present instant value
    const todayStr = getTodayString();
    return [
      {
        id: 'book-1',
        bookerName: 'Group Stage Match: Express vs Supply Chain',
        sportName: 'Soccer',
        pitchNumber: 1,
        date: todayStr,
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
        date: todayStr,
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
        date: todayStr,
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
        date: todayStr,
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
  const [newEndHour, setNewEndHour] = useState('08:30');
  const [newStatus, setNewStatus] = useState<'Reserved' | 'Approved' | 'Host-Blocked'>('Approved');
  const [newNotes, setNewNotes] = useState('');
  const [newIsLeagueMatch, setNewIsLeagueMatch] = useState(false);
  const [newMatchId, setNewMatchId] = useState('');

  // Edit / Move Modal State
  const [editingBooking, setEditingBooking] = useState<PitchBooking | null>(null);
  const [editPitchNum, setEditPitchNum] = useState(1);
  const [editStartHour, setEditStartHour] = useState('08:00');
  const [editEndHour, setEditEndHour] = useState('08:30');
  const [editDate, setEditDate] = useState(selectedDate);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'Reserved' | 'Approved' | 'Host-Blocked'>('Approved');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Grid step resolution (5 mins by default as requested, with 15m / 30m toggle)
  const [gridStep, setGridStep] = useState<number>(5);

  const hoursList = useMemo(() => {
    return generateHours(gridStep, 7, 22);
  }, [gridStep]);

  const gridScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollToSlot = (timeStr: string) => {
    if (!gridScrollRef.current) return;
    const targetRow = gridScrollRef.current.querySelector(`[data-slot-time="${timeStr}"]`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

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

  // Auto-synced bookings from created matches that have scheduled_date & scheduled_time
  // Automatically distributes matches across available pitches (Pitch 1, Pitch 2, etc.)
  const autoMatchBookings = useMemo(() => {
    const list: PitchBooking[] = [];
    matches.forEach((m) => {
      if (
        m.sport_name === selectedSport &&
        m.scheduled_date === selectedDate &&
        m.scheduled_time &&
        !bookings.some(b => b.matchId === m.id)
      ) {
        const startT = m.scheduled_time.length === 5 ? m.scheduled_time : m.scheduled_time.padStart(5, '0');
        const endT = addMinutesToTime(startT, 30);
        
        let teamAName = m.team_a;
        let teamBName = m.team_b;
        if (m.sport_name === 'Swimming') {
          try {
            const swimmers = JSON.parse(m.team_a);
            if (Array.isArray(swimmers)) {
              teamAName = swimmers.map((s: any) => s.name).join(', ');
              teamBName = 'Swimming Heat';
            }
          } catch (e) {
            // fallback to raw
          }
        }

        // Find taken pitches at this slot by manual bookings
        const manualTakenPitches = bookings
          .filter(b => b.date === selectedDate && b.sportName === selectedSport && b.startTime === startT)
          .map(b => b.pitchNumber);

        // Find first pitch (1..pitchesCount) that is not taken by manual or auto match
        let assignedPitch = 1;
        for (let p = 1; p <= pitchesCount; p++) {
          if (!manualTakenPitches.includes(p)) {
            const alreadyAutoUsed = list.some(item => item.startTime === startT && item.pitchNumber === p);
            if (!alreadyAutoUsed) {
              assignedPitch = p;
              break;
            }
          }
        }

        list.push({
          id: `auto-match-${m.id}`,
          bookerName: `★ League Match: ${teamAName} vs ${teamBName}`,
          sportName: selectedSport,
          pitchNumber: assignedPitch,
          date: selectedDate,
          startTime: startT,
          endTime: endT,
          notes: `${m.match_label || 'Official Game'} (${m.status})`,
          status: 'Approved',
          isLeagueMatch: true,
          matchId: m.id
        });
      }
    });
    return list;
  }, [matches, selectedSport, selectedDate, bookings, pitchesCount]);

  // Combine manual bookings with auto-synced scheduled matches
  const allBookingsForDay = useMemo(() => {
    return [...filteredBookings, ...autoMatchBookings];
  }, [filteredBookings, autoMatchBookings]);

  // Helper to get booking at a specific slot hour
  const getSlotBookingInfo = (pitchNum: number, slotHour: string, stepMins: number) => {
    const [sH, sM] = slotHour.split(':').map(Number);
    const slotStartMins = sH * 60 + sM;
    const slotEndMins = slotStartMins + stepMins;

    const booking = allBookingsForDay.find(b => {
      if (b.pitchNumber !== pitchNum) return false;
      const [bH, bM] = b.startTime.split(':').map(Number);
      const [eH, eM] = b.endTime.split(':').map(Number);
      const bStartMins = bH * 60 + bM;
      const bEndMins = eH * 60 + eM;

      return slotStartMins < bEndMins && slotEndMins > bStartMins;
    });

    if (!booking) return null;

    const [bH, bM] = booking.startTime.split(':').map(Number);
    const bStartMins = bH * 60 + bM;

    const isStartSlot = (bStartMins >= slotStartMins && bStartMins < slotEndMins);

    return {
      booking,
      isStartSlot,
      isContinuation: !isStartSlot
    };
  };

  const getCellBooking = (pitchNum: number, slotHour: string) => {
    return getSlotBookingInfo(pitchNum, slotHour, gridStep)?.booking;
  };

  // List of active unscheduled/unassigned matches belonging to this sport
  // Offers swift auto-booking mapping
  const leagueMatchesForSport = useMemo(() => {
    return matches.filter(m => m.sport_name === selectedSport);
  }, [matches, selectedSport]);

  // Trigger quick click in cell to prepopulate slot addition
  const handleCellClick = (pitchNum: number, hour: string) => {
    if (!isAdmin) return; // Spectators cannot write
    
    // Check if slot has booking
    if (getCellBooking(pitchNum, hour)) return;

    // Prefill setup modal fields
    setNewBooker('');
    setNewPitchNum(pitchNum);
    setNewStartHour(hour);
    // Default 30 min match duration
    setNewEndHour(addMinutesToTime(hour, 30));
    setNewNotes('');
    setNewStatus('Approved');
    setNewIsLeagueMatch(false);
    setNewMatchId('');
    setShowAddModal(true);
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooker.trim()) {
      showToast(currentLanguage === 'kh' ? 'សូមបញ្ចូលឈ្មោះអ្នកកក់!' : 'Please enter the booker or match identifier!', true);
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
      showToast(currentLanguage === 'kh' 
        ? '⚠️ ម៉ោងនេះមានការកក់រួចហើយនៅលើទីលាននេះ! សូមជ្រើសរើសម៉ោងផ្សេង។' 
        : '⚠️ This slot conflicts with an existing booking on this pitch/court!',
        true
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

    showToast(currentLanguage === 'kh' ? '✓ បានបង្កើតការកក់ទីលានជោគជ័យ' : '✓ Pitch allocation created successfully');
  };

  const handleDeleteBooking = async (id: string, matchId?: string) => {
    if (!isAdmin) return;
    const confirm = window.confirm(currentLanguage === 'kh' 
      ? 'តើអ្នកពិតជាចង់លុបការកក់ទីលាននេះមែនទេ?' 
      : 'Are you sure you want to release this pitch booking?'
    );
    if (confirm) {
      const targetMatchId = matchId || (id.startsWith('auto-match-') ? id.replace('auto-match-', '') : undefined);

      // Remove from bookings array
      setBookings(prev => prev.filter(b => b.id !== id && (targetMatchId ? b.matchId !== targetMatchId : true)));

      // If tied to a tournament match, clear its scheduled date/time in backend database
      if (targetMatchId && onUpdateMatchFields) {
        await onUpdateMatchFields(targetMatchId, {
          scheduled_date: '',
          scheduled_time: ''
        });
      }

      showToast(currentLanguage === 'kh' ? '✓ បានលុបការកក់ទីលានរួចរាល់' : '✓ Pitch allocation released successfully');
    }
  };

  const handleOpenEditModal = (booking: PitchBooking) => {
    if (!isAdmin) return;
    setEditingBooking(booking);
    setEditPitchNum(booking.pitchNumber);
    setEditStartHour(booking.startTime);
    setEditEndHour(booking.endTime);
    setEditDate(booking.date || selectedDate);
    setEditNotes(booking.notes || '');
    setEditStatus(booking.status || 'Approved');
  };

  const handleSaveEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const targetMatchId = editingBooking.matchId || (editingBooking.id.startsWith('auto-match-') ? editingBooking.id.replace('auto-match-', '') : undefined);

    // Conflict check (exclude the match/booking currently being edited)
    const isConflict = bookings.some(b => 
      b.id !== editingBooking.id &&
      (targetMatchId ? b.matchId !== targetMatchId : true) &&
      b.date === editDate &&
      b.sportName === selectedSport &&
      b.pitchNumber === editPitchNum &&
      ((editStartHour >= b.startTime && editStartHour < b.endTime) ||
       (editEndHour > b.startTime && editEndHour <= b.endTime) ||
       (editStartHour <= b.startTime && editEndHour >= b.endTime))
    );

    if (isConflict) {
      showToast(
        currentLanguage === 'kh' 
          ? '⚠️ ម៉ោងនេះមានការកក់រួចហើយនៅលើទីលានដែលបានជ្រើសរើស! សូមជ្រើសរើសទីលាន ឬម៉ោងផ្សេង។' 
          : '⚠️ This slot conflicts with an existing booking on the selected pitch/court!',
        true
      );
      return;
    }

    const updatedBooking: PitchBooking = {
      id: editingBooking.id.startsWith('auto-match-') ? 'book-' + Date.now() : editingBooking.id,
      bookerName: editingBooking.bookerName,
      sportName: selectedSport,
      pitchNumber: editPitchNum,
      date: editDate,
      startTime: editStartHour,
      endTime: editEndHour,
      notes: editNotes.trim(),
      status: editStatus,
      isLeagueMatch: editingBooking.isLeagueMatch,
      matchId: targetMatchId
    };

    setBookings(prev => {
      const filtered = prev.filter(b => b.id !== editingBooking.id && (targetMatchId ? b.matchId !== targetMatchId : true));
      return [...filtered, updatedBooking];
    });

    if (targetMatchId && onUpdateMatchFields) {
      await onUpdateMatchFields(targetMatchId, {
        scheduled_date: editDate,
        scheduled_time: editStartHour
      });
    }

    setEditingBooking(null);
    showToast(
      currentLanguage === 'kh'
        ? '✓ បានផ្លាស់ប្តូរទីលាន និងម៉ោងប្រកួតដោយជោគជ័យ'
        : '✓ Pitch allocation & time slot updated successfully'
    );
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
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 border animate-bounce ${
          toastMessage.isError 
            ? 'bg-rose-600 text-white border-rose-700' 
            : 'bg-emerald-600 text-white border-emerald-700'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

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

          <div className="flex items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayString())}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition duration-150 cursor-pointer ${
                selectedDate === getTodayString() 
                  ? 'bg-amber-100 text-amber-800 font-extrabold border border-amber-200' 
                  : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'
              }`}
            >
              📅 {currentLanguage === 'kh' ? 'ថ្ងៃនេះ (Today)' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate('2026-06-16')}
              className={`px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition duration-150 cursor-pointer ${
                selectedDate === '2026-06-16' 
                  ? 'bg-amber-100 text-amber-800 font-extrabold border border-amber-200' 
                  : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'
              }`}
              title="Tournament Day (2026-06-16)"
            >
              🏆 2026-06-16
            </button>
          </div>
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
          <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm space-y-4">
            
            {/* Grid Header Details & Step Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 select-none text-xs text-gray-400 uppercase font-black flex-wrap">
                <span className="text-lg">{activeSportConfig.icon}</span>
                <span>
                  {activeSportConfig.khmerName} &bull; {selectedSport}
                </span>
                <span className="bg-[#FFCC00]/20 text-gray-900 border border-[#FFCC00]/10 px-2 py-0.5 rounded-md font-mono font-black text-[9px] uppercase tracking-wider">
                  {pitchesCount} PITCHES TOTAL AVAILABLE
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
                {/* 5-Min Time Range / Step Selector */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-[10px] font-extrabold shadow-3xs">
                  <span className="px-2 text-gray-400 uppercase tracking-wide text-[9px]">Grid:</span>
                  <button
                    type="button"
                    onClick={() => setGridStep(5)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                      gridStep === 5 ? 'bg-amber-500 text-slate-900 shadow-3xs font-black' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ⚡ 5 Min Range
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridStep(15)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                      gridStep === 15 ? 'bg-amber-500 text-slate-900 shadow-3xs font-black' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    15 Min
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridStep(30)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                      gridStep === 30 ? 'bg-amber-500 text-slate-900 shadow-3xs font-black' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    30 Min
                  </button>
                </div>

                <div className="text-[11px] font-mono font-bold text-gray-550 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-xl">
                  🗓️ {selectedDate}
                </div>
              </div>
            </div>

            {/* Quick Time Jump Navigation bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[10px] font-bold text-gray-500 scrollbar-none border-b border-gray-50 pb-2">
              <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                {currentLanguage === 'kh' ? 'រំលងទៅម៉ោង:' : 'Quick Jump:'}
              </span>
              {['07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => scrollToSlot(t)}
                  className="px-2 py-0.5 bg-gray-50 hover:bg-amber-100 hover:text-amber-900 border border-gray-200 rounded-lg transition font-mono cursor-pointer shrink-0 text-[9.5px] font-bold"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Slide-Scrollable Calendar Grid Container */}
            <div className="relative rounded-2xl border border-gray-200 shadow-inner bg-slate-50/40">
              <div 
                ref={gridScrollRef}
                className="overflow-x-auto overflow-y-auto max-h-[600px] md:max-h-[660px] scroll-smooth rounded-2xl custom-scrollbar"
              >
                <table className="min-w-full border-collapse text-left select-none text-[11px] relative">
                  
                  {/* Sticky Columns Header */}
                  <thead className="sticky top-0 z-30 bg-gray-100/95 backdrop-blur-md shadow-3xs border-b border-gray-200">
                    <tr>
                      <th className="p-3 font-extrabold text-gray-500 uppercase tracking-wider border-r border-gray-200 w-24 text-center sticky left-0 z-40 bg-gray-100 shadow-3xs">
                        ⏱️ {currentLanguage === 'kh' ? 'ម៉ោង' : 'Hour'}
                      </th>
                      {Array.from({ length: pitchesCount }).map((_, idx) => {
                        const pitchNum = idx + 1;
                        return (
                          <th 
                            key={pitchNum} 
                            className="p-3.5 font-black text-gray-800 uppercase tracking-wider text-center border-r border-gray-200 last:border-r-0 min-w-[210px]"
                          >
                            📍 {currentLanguage === 'kh' ? `${activeSportConfig.khmerName} ទី ${pitchNum}` : `Pitch/Court ${pitchNum}`}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Dynamic 5-minute / Step interval rows */}
                  <tbody>
                    {hoursList.map(hour => {
                      const isTopHour = hour.endsWith(':00');
                      const isHalfHour = hour.endsWith(':30');

                      return (
                        <tr 
                          key={hour} 
                          data-slot-time={hour}
                          className={`group transition ${
                            isTopHour 
                              ? 'border-t-2 border-t-gray-200 border-b border-gray-150 bg-gray-100/30' 
                              : isHalfHour
                              ? 'border-b border-gray-150 bg-gray-50/30'
                              : 'border-b border-gray-100/80 hover:bg-yellow-400/5'
                          }`}
                        >
                          <td className={`p-2 font-mono border-r border-gray-200 border-b border-gray-100 align-middle text-center sticky left-0 z-20 transition ${
                            isTopHour 
                              ? 'bg-gray-100 font-extrabold text-gray-900 text-[11px]' 
                              : isHalfHour
                              ? 'bg-gray-50 font-bold text-gray-700 text-[10px]'
                              : 'bg-white/90 font-medium text-gray-400 text-[9.5px]'
                          }`}>
                            {hour}
                          </td>

                          {Array.from({ length: pitchesCount }).map((_, colIdx) => {
                            const pitchNum = colIdx + 1;
                            const slotInfo = getSlotBookingInfo(pitchNum, hour, gridStep);
                            const booking = slotInfo?.booking;
                            const isStartSlot = slotInfo?.isStartSlot;
                            const isContinuation = slotInfo?.isContinuation;
                            const durationMins = booking ? getDurationMinutes(booking.startTime, booking.endTime) : 0;

                            return (
                              <td 
                                key={pitchNum} 
                                onClick={() => {
                                  if (!booking) handleCellClick(pitchNum, hour);
                                }}
                                className={`p-1.5 border-r border-gray-100 last:border-r-0 align-top relative transition ${
                                  booking 
                                    ? 'bg-amber-500/5' 
                                    : isAdmin 
                                    ? 'hover:bg-yellow-400/10 cursor-pointer' 
                                    : 'bg-white'
                                }`}
                              >
                                {booking && isStartSlot && (
                                  <div className="p-3 bg-white border border-amber-300 shadow-3xs rounded-xl space-y-2 relative group/item hover:border-amber-400 transition duration-150 z-10">
                                    
                                    {/* Actions for admin */}
                                    {isAdmin && (
                                      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditModal(booking);
                                          }}
                                          className="p-1 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-3xs cursor-pointer transition active:scale-95 flex items-center gap-0.5 text-[9.5px] font-extrabold px-1.5"
                                          title={currentLanguage === 'kh' ? 'ផ្លាស់ប្តូរទីលាន/ម៉ោង' : 'Move Pitch / Edit Time'}
                                        >
                                          <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                                          <span>{currentLanguage === 'kh' ? 'ផ្លាស់ទី' : 'Move'}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteBooking(booking.id, booking.matchId);
                                          }}
                                          className="p-1 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-3xs cursor-pointer transition active:scale-95"
                                          title={currentLanguage === 'kh' ? 'លុបការកក់ទីលាន' : 'Remove allocation'}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}

                                    <div className="space-y-1">
                                      <div className="flex items-start gap-1 pr-14 flex-wrap">
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

                                    <div className="flex items-center gap-2 pt-1.5 border-t border-gray-50 text-[9.5px] text-gray-400 font-bold flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span className="font-mono font-black text-gray-700">{booking.startTime} - {booking.endTime}</span>
                                      </div>
                                      {durationMins > 0 && (
                                        <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md font-mono font-black text-[8.5px]">
                                          ⚡ {durationMins}m
                                        </span>
                                      )}
                                      {booking.notes && (
                                        <div className="flex items-center gap-0.5 max-w-[120px] truncate text-[9px] text-gray-500">
                                          <span>&bull;</span>
                                          <span>{booking.notes}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {booking && isContinuation && (
                                  <div 
                                    className="h-full min-h-[14px] bg-amber-500/5 hover:bg-amber-500/15 border-l-2 border-amber-300/60 rounded-r-xs transition cursor-pointer"
                                    onClick={(e) => {
                                      if (isAdmin) {
                                        e.stopPropagation();
                                        handleOpenEditModal(booking);
                                      }
                                    }}
                                    title={`Occupied by: ${booking.bookerName} (${booking.startTime} - ${booking.endTime})`}
                                  />
                                )}

                                {!booking && (
                                  <div className="h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150">
                                    {isAdmin ? (
                                      <span className="text-[9px] text-yellow-700 bg-yellow-100 border border-yellow-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-0.5 hover:scale-105">
                                        <Plus className="w-2.5 h-2.5" />
                                        {currentLanguage === 'kh' ? 'កក់' : '+ Slot'}
                                      </span>
                                    ) : (
                                      <span className="text-[8.5px] text-gray-300 font-bold select-none">
                                        &bull;
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
                    const isAlreadyBooked = bookings.some(b => b.matchId === match.id) || autoMatchBookings.some(b => b.matchId === match.id);

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
                                setNewEndHour('09:30');
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

              {/* Quick Game Duration Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide flex items-center justify-between">
                  <span>រយៈពេលប្រកួត (Game Duration)</span>
                  <span className="text-amber-600 font-mono">
                    ⚡ {getDurationMinutes(newStartHour, newEndHour)} mins
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[25, 30, 45, 60, 90].map((mins) => {
                    const isSelected = getDurationMinutes(newStartHour, newEndHour) === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setNewEndHour(addMinutesToTime(newStartHour, mins))}
                        className={`py-1.5 px-1 rounded-xl border text-center font-mono font-black text-[10px] transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-3xs'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots rows */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    ម៉ោងចាប់ផ្តើម (Start Time)
                  </label>
                  <input
                    type="time"
                    required
                    step="300"
                    value={newStartHour}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setNewStartHour(newStart);
                      if (newStart) {
                        const dur = getDurationMinutes(newStart, newEndHour);
                        // If duration is <= 0 or unassigned, default to 30 mins automatically
                        if (dur <= 0) {
                          setNewEndHour(addMinutesToTime(newStart, 30));
                        }
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono font-bold text-sm text-gray-800 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    ម៉ោងបញ្ចាប់ (End Time)
                  </label>
                  <input
                    type="time"
                    required
                    step="300"
                    value={newEndHour}
                    onChange={(e) => setNewEndHour(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono font-bold text-sm text-gray-800 cursor-pointer"
                  />
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

      {/* Edit / Move Pitch Allocation Modal */}
      {editingBooking && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-xs font-semibold select-none text-slate-700">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-gray-150 shadow-2xl space-y-5 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shadow-3xs">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                <h3 className="font-black text-gray-800 uppercase tracking-wide">
                  {currentLanguage === 'kh' ? 'ផ្លាស់ប្តូរទីលាន និងម៉ោងប្រកួត' : 'Move Pitch & Time Allocation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="p-1 px-2 text-gray-400 hover:text-gray-800 font-black hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditBooking} className="space-y-4">
              
              {/* Match/Booker Title */}
              <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-2xl space-y-1">
                <span className="text-[9px] text-amber-800 font-black uppercase tracking-wider">
                  {currentLanguage === 'kh' ? 'ការប្រកួត / អ្នកកក់' : 'Match / Booker'}
                </span>
                <p className="font-extrabold text-xs text-gray-900 leading-snug">
                  {editingBooking.bookerName}
                </p>
              </div>

              {/* Pitch Number and Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    {currentLanguage === 'kh' ? 'ជ្រើសរើសទីលាន (Pitch / Court #)' : 'Pitch / Court #'}
                  </label>
                  <select
                    value={editPitchNum}
                    onChange={(e) => setEditPitchNum(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-extrabold cursor-pointer"
                  >
                    {Array.from({ length: pitchesCount }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        📍 {currentLanguage === 'kh' ? `${activeSportConfig.khmerName} ទី ${idx + 1}` : `Pitch/Court ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    {currentLanguage === 'kh' ? 'ស្ថានភាព' : 'Reservation Status'}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-extrabold cursor-pointer"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Reserved">Pending Approval</option>
                    <option value="Host-Blocked">Host-Blocked</option>
                  </select>
                </div>
              </div>

              {/* Date Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                  {currentLanguage === 'kh' ? 'កាលបរិច្ឆេទ (Scheduled Date)' : 'Scheduled Date'}
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold cursor-pointer"
                />
              </div>

              {/* Time Slots Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    {currentLanguage === 'kh' ? 'ម៉ោងចាប់ផ្តើម' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    required
                    step="300"
                    value={editStartHour}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setEditStartHour(newStart);
                      if (newStart) {
                        const dur = getDurationMinutes(newStart, editEndHour);
                        if (dur <= 0) {
                          setEditEndHour(addMinutesToTime(newStart, 30));
                        }
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono font-bold text-sm cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    {currentLanguage === 'kh' ? 'ម៉ោងបញ្ចាប់' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    required
                    step="300"
                    value={editEndHour}
                    onChange={(e) => setEditEndHour(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono font-bold text-sm cursor-pointer"
                  />
                </div>
              </div>

              {/* Duration Buttons */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide flex items-center justify-between">
                  <span>{currentLanguage === 'kh' ? 'រយៈពេលប្រកួត' : 'Game Duration'}</span>
                  <span className="text-amber-600 font-mono font-bold">
                    ⚡ {getDurationMinutes(editStartHour, editEndHour)} mins
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[25, 30, 45, 60, 90].map((mins) => {
                    const isSelected = getDurationMinutes(editStartHour, editEndHour) === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setEditEndHour(addMinutesToTime(editStartHour, mins))}
                        className={`py-1.5 px-1 rounded-xl border text-center font-mono font-black text-[10px] transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-3xs'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Booking Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                  {currentLanguage === 'kh' ? 'កំណត់សម្គាល់បន្ថែម' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder="Need 4 bibs, extra water etc."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const confirmDel = window.confirm(currentLanguage === 'kh' ? 'តើអ្នកពិតជាចង់លុបការកក់ទីលាននេះមែនទេ?' : 'Are you sure you want to release this pitch allocation?');
                    if (confirmDel) {
                      handleDeleteBooking(editingBooking.id, editingBooking.matchId);
                      setEditingBooking(null);
                    }
                  }}
                  className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'kh' ? 'លុបការកក់' : 'Unschedule'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBooking(null)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[11px] font-bold text-gray-700 cursor-pointer transition active:scale-95"
                  >
                    {currentLanguage === 'kh' ? 'បោះបង់' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-[11px] font-black uppercase text-slate-900 font-extrabold shadow-3xs cursor-pointer transition active:scale-95"
                  >
                    {currentLanguage === 'kh' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

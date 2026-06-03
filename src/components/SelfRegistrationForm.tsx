import React, { useState, useMemo } from 'react';
import { Users, CheckCircle, Trophy, HelpCircle, UserPlus, Image, Share2, ClipboardCheck } from 'lucide-react';
import { EventInfo, Participant, SportType, getTranslatedText } from '../types';

interface SelfRegistrationFormProps {
  isEnrolmentEnabled: boolean;
  activeEventId: string;
  events: EventInfo[];
  participants: Participant[];
  addParticipant: (name: string, sport_type: SportType, is_team: boolean, team_id: string | null, photo_url?: string, gender?: string) => Promise<string | null>;
  currentLanguage?: 'kh' | 'en';
  translations?: Record<string, { kh: string; en: string }>;
}

export default function SelfRegistrationForm({
  isEnrolmentEnabled,
  activeEventId,
  events,
  participants,
  addParticipant,
  currentLanguage = 'kh',
  translations,
}: SelfRegistrationFormProps) {
  const t = (key: string, defaultKh: string, defaultEn: string): string => {
    return getTranslatedText(key, defaultKh, defaultEn, currentLanguage, translations);
  };

  const [fullname, setFullname] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('none');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{ name: string; sport: string; teamName: string; photo: string } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  const activeEvent = useMemo(() => {
    return events.find(ev => ev.id === activeEventId) || events[0];
  }, [events, activeEventId]);

  const activeSports = useMemo(() => {
    return activeEvent ? activeEvent.sports : [];
  }, [activeEvent]);

  // Filter existing teams participating in the selected sport
  const availableTeams = useMemo(() => {
    if (!selectedSport) return [];
    return participants.filter(p => p.is_team && p.sport_type === selectedSport);
  }, [participants, selectedSport]);

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dhlgamesday2026.web.app';
    const link = `${origin}/?tab=enrolment&event_id=${activeEventId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim()) {
      alert('សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក! Please enter your name.');
      return;
    }
    if (!selectedSport) {
      alert('សូមជ្រើសរើសប្រភេទកីឡា! Please select a sport.');
      return;
    }

    setIsSubmitting(true);
    const targetTeam = selectedTeam === 'none' ? null : selectedTeam;
    
    try {
      const addedId = await addParticipant(
        fullname.trim(), 
        selectedSport, 
        false, 
        targetTeam, 
        photoUrl.trim() || undefined,
        gender
      );

      if (addedId) {
        const teamObj = participants.find(p => p.id === targetTeam);
        setRegisteredUser({
          name: fullname.trim(),
          sport: selectedSport,
          teamName: teamObj ? teamObj.name : 'មិនទាន់មានក្រុម (No Team Assigned)',
          photo: photoUrl.trim() || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop'
        });
        
        // Reset states
        setFullname('');
        setSelectedSport('');
        setSelectedTeam('none');
        setPhotoUrl('');
      } else {
        alert('ការចុះឈ្មោះមានបញ្ហា Error completing registration. Please check Supabase sync.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* 1. Page Header & Share controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-150 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl border border-emerald-100 shadow-xs shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide leading-tight">
              {t('enrol_title', 'ចុះឈ្មោះកីឡាករ', 'Athlete Enrollment')}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Event: {activeEvent?.khmerName || activeEvent?.name}
            </p>
          </div>
        </div>

        {/* Control Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5 select-none shrink-0">
          {/* Share Register Funnel Direct Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex items-center gap-2 border px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wide transition duration-150 active:scale-95 cursor-pointer ${
              copiedLink 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                : 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100'
            }`}
          >
            {copiedLink ? (
              <>
                <ClipboardCheck className="w-4 h-4 animate-bounce" />
                <span>Copied Link!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Enroll Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Form view */}
      {isEnrolmentEnabled ? (
        <div className="max-w-xl mx-auto">
          {registeredUser ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-150 shadow-lg text-center space-y-6 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-wide">
                  {t('registration_success_title', 'ចុះឈ្មោះបានជោគជ័យ!', 'Registration Successful!')}
                </h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {t('registration_success_desc', 'ការចុះឈ្មោះកីឡាករបានបញ្ចប់', 'Athlete Registration Complete')}
                </p>
                <p className="text-[13px] text-gray-600 font-medium KhmerFont leading-relaxed">
                  {t('registration_success_body', 'អបអរសាទរ! ព័ត៌មានរបស់អ្នកត្រូវបានរក្សាទុកក្នុងបញ្ជីឈ្មោះកីឡាករផ្លូវការរួចរាល់ហើយ។', 'Congratulations! Your details have been successfully saved into our official athletes roster.')}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-left flex items-center gap-4">
                <img
                  src={registeredUser.photo}
                  alt={registeredUser.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop';
                  }}
                />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-gray-800">{registeredUser.name}</h4>
                  <p className="text-[11px] text-gray-500 font-bold uppercase flex items-center gap-1 leading-none">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('sport_category', 'វិញ្ញាសាកីឡា៖', 'SportCategory:')}</span> {registeredUser.sport}
                  </p>
                  <p className="text-[11px] text-gray-500 font-bold uppercase flex items-center gap-1 leading-none">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t('team_assigned', 'ក្រុមលេង៖', 'AssignedTeam:')}</span> {registeredUser.teamName}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setRegisteredUser(null)}
                  className="w-full bg-[#1a1a1a] hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-2xl uppercase text-xs tracking-wider transition cursor-pointer"
                >
                  {t('btn_register_another', 'ចុះឈ្មោះសមាជិកម្នាក់ទៀត', 'Register Another member')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-lg space-y-6">
              <div className="bg-[#FFFDE7] rounded-2xl p-4 border border-yellow-250 flex gap-2.5">
                <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  <strong className="block text-xs font-black uppercase mb-1">
                    {t('enrol_inst_title', 'ណែនាំការចុះឈ្មោះ', 'Instructions')}
                  </strong>
                  {t('enrol_inst_body', 'សូមបំពេញឈ្មោះពេញរបស់អ្នក ជ្រើសរើសប្រភេទកីឡាដែលអ្នកចង់លេង និងជ្រើសរើសក្រុមដែលទទួលបានការប្រកាសពីគណៈកម្មការ។', 'Please fill in your full name, select the sport event you would like to participate in, and pick your assigned team squad.')}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                    {t('your_fullname', 'ឈ្មោះពេញរបស់អ្នក', 'Your Full Name')} <strong className="text-red-500">*</strong>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={currentLanguage === 'kh' ? 'ឧ. សុខ ពិសិដ្ឋ' : 'e.g. Sok Piseth'}
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold shadow-sm"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block">
                    {currentLanguage === 'kh' ? 'ភេទ (Gender)' : 'Gender'} <strong className="text-red-500">*</strong>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        gender === 'Male'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-100 shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base leading-none">♂️</span>
                      <span>{currentLanguage === 'kh' ? 'ប្រុស (Male)' : 'Male'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        gender === 'Female'
                          ? 'bg-pink-50 border-pink-400 text-pink-700 ring-2 ring-pink-100 shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base leading-none">♀️</span>
                      <span>{currentLanguage === 'kh' ? 'ស្រី (Female)' : 'Female'}</span>
                    </button>
                  </div>
                </div>

                {/* Sport list */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                    {t('select_sport_event', 'ជ្រើសរើសប្រភេទកីឡា', 'Select Sport Event')} <strong className="text-red-500">*</strong>
                  </label>
                  <select
                    required
                    value={selectedSport}
                    onChange={(e) => {
                      setSelectedSport(e.target.value);
                      setSelectedTeam('none'); // Reset team choice on sport change
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                  >
                    <option value="">-- {t('select_sport_event_placeholder', 'សូមជ្រើសរើសវិញ្ញាសាដែលចង់លេង', 'Select Sport Event')} --</option>
                    {activeSports.map((sp) => (
                      <option key={sp.name} value={sp.name}>
                        {sp.icon} {currentLanguage === 'kh' ? sp.khmerName : sp.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team list */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                    {t('choose_team', 'ជ្រើសរើសក្រុមលេង (ជាជម្រើស)', 'Choose Your Team (Optional)')}
                  </label>
                  <select
                    value={selectedTeam}
                    disabled={!selectedSport}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold disabled:opacity-50"
                  >
                    {!selectedSport ? (
                      <option value="none">-- {t('choose_team_placeholder_no_sport', 'សូមជ្រើសរើសកីឡាជាមុនសិន', 'Select Sport first')} --</option>
                    ) : (
                      <>
                        <option value="none">{t('choose_team_free_agent', 'មិនទាន់មានក្រុម (Free Agent)', 'No Team / Free Agent')}</option>
                        {availableTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* Photo URL optionally */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                    {t('profile_photo_url', 'តំណភ្ជាប់រូបភាព Profile', 'Profile Photo URL (Optional)')}
                  </label>
                  <div className="relative flex items-center">
                    <Image className="absolute left-3 w-4 h-4 text-gray-400 font-bold" />
                    <input
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                    />
                  </div>
                  <span className="text-[9px] text-gray-450 leading-relaxed block mt-1 font-semibold">
                    {t('profile_photo_desc', 'អ្នកអាចប្រើប្រាស់តំណភ្ជាប់រូបភាពផ្ទាល់ខ្លួនពី Telegram, Google, Facebook ឬ Unsplash។', 'Provide any raw image link from platforms like Telegram, Drive, or Facebook.')}
                  </span>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 text-white py-3.5 px-6 rounded-2xl font-black uppercase text-xs tracking-wider transition-all duration-150 transform active:scale-95 cursor-pointer shadow-md disabled:opacity-50 select-none"
                  >
                    {isSubmitting ? t('submitting_registration', 'កំពុងបញ្ចូលទិន្នន័យ...', 'Registration in progress...') : t('btn_submit_registration', 'បញ្ជូនព័ត៌មានចុះឈ្មោះ', 'Complete Registration')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-3xl border border-gray-150 shadow-sm text-center">
          <div className="bg-red-50/60 text-red-700 p-4 rounded-2xl border border-red-150 text-xs font-bold mb-6 flex items-center justify-center gap-2">
            <Users className="w-5 h-5 shrink-0" />
            <span>
              {t('self_enrol_closed', 'ទម្រង់ចុះឈ្មោះកីឡាករដោយខ្លួនឯង ត្រូវបានបិទជាបណ្ដោះអាសន្ន។', 'Athlete self-registration is closed currently by administrator.')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Save, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  CheckCircle, 
  Flame, 
  Plus, 
  Minus, 
  CreditCard, 
  BarChart3, 
  TrendingUp, 
  Printer, 
  Download, 
  Check, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  HelpCircle,
  Activity,
  FileText,
  Users
} from 'lucide-react';
import { OrganizationInfo, Match, Participant } from '../types';
import { getActiveSports, getSportConfig } from '../data';

interface PitchBooking {
  id: string;
  bookerName: string;
  sportName: string;
  pitchNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: 'Reserved' | 'Approved' | 'Host-Blocked';
  isLeagueMatch?: boolean;
  matchId?: string;
}

interface OrganizationSettingsProps {
  organization: OrganizationInfo;
  onUpdateOrganization: (updated: OrganizationInfo) => Promise<void>;
  matches?: Match[];
  participants?: Participant[];
}

// Hourly booking price settings for revenue projection reports
const SPORT_HOURLY_RATES: Record<string, number> = {
  Soccer: 30,      // $30/hr
  Volleyball: 20,  // $20/hr
  Pingpong: 5,     // $5/hr
  Badminton: 8,    // $8/hr
  Swimming: 15,    // $15/hr
};

export default function OrganizationSettings({
  organization,
  onUpdateOrganization,
  matches = [],
  participants = [],
}: OrganizationSettingsProps) {
  // Navigation tabs for settings sub-modules
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'billing' | 'reports'>('branding');

  // Corporate Info Form state
  const [name, setName] = useState(organization.name);
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl);
  const [slug, setSlug] = useState(organization.slug);
  const [tagline, setTagline] = useState(organization.tagline);
  const [contactEmail, setContactEmail] = useState(organization.contactEmail);
  const [contactPhone, setContactPhone] = useState(organization.contactPhone);
  const [website, setWebsite] = useState(organization.website);
  const [address, setAddress] = useState(organization.address);
  const [footerMotto, setFooterMotto] = useState(organization.footerMotto);
  
  const currentPlan = organization.subscriptionPlan || 'free';
  const planMaxPitches = currentPlan === 'elite' ? 20 : currentPlan === 'pro' ? 4 : 1;

  const [pitchesConfig, setPitchesConfig] = useState<Record<string, number>>(() => {
    const initialConfig = {
      Soccer: 2,
      Volleyball: 2,
      Pingpong: 4,
      Badminton: 4,
      Swimming: 6,
      ...(organization.pitchesConfig || {})
    };
    const capped: Record<string, number> = {};
    const plan = organization.subscriptionPlan || 'free';
    const limit = plan === 'elite' ? 20 : plan === 'pro' ? 4 : 1;
    Object.keys(initialConfig).forEach(key => {
      capped[key] = Math.min(limit, initialConfig[key as keyof typeof initialConfig] || 1);
    });
    return capped;
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [billingSuccess, setBillingSuccess] = useState<string | null>(null);

  // Read Pitch calendar bookings for dynamic reporting
  const bookings = useMemo<PitchBooking[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dhl_pitch_bookings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to load bookings for reports:', e);
        }
      }
    }
    return [];
  }, []);

  // Filter/Search variables for report view
  const [reportSportFilter, setReportSportFilter] = useState<string>('All');
  const [reportDateFilter, setReportDateFilter] = useState<string>('2026-06-16'); // default tournament day

  const updatePitchCount = (sport: string, delta: number) => {
    const limit = currentPlan === 'elite' ? 20 : currentPlan === 'pro' ? 4 : 1;
    setPitchesConfig(prev => {
      const current = prev[sport] || 1;
      const next = Math.max(1, Math.min(limit, current + delta));
      return { ...prev, [sport]: next };
    });
  };

  const handleSlugChange = (value: string) => {
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-');
    setSlug(sanitized);
  };

  const handleSubmitBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('សូមបញ្ចូលឈ្មោះអង្គភាព / Business Name is required!');
      return;
    }
    if (!slug.trim()) {
      alert('សូមបញ្ចូលអត្តសញ្ញាណ Slug / URL Slug is required!');
      return;
    }

    setSaving(true);
    setSuccess(false);

    const updated: OrganizationInfo = {
      ...organization,
      name: name.trim(),
      logoUrl: logoUrl.trim(),
      slug: slug.trim(),
      tagline: tagline.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      website: website.trim(),
      address: address.trim(),
      footerMotto: footerMotto.trim(),
      pitchesConfig: pitchesConfig,
    };

    try {
      await onUpdateOrganization(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4500);
    } catch (err) {
      console.error(err);
      alert('Failed to save organization settings.');
    } finally {
      setSaving(false);
    }
  };

  // Change Subscription Plan (Simulated Billing Update)
  const handlePlanUpgrade = async (plan: 'free' | 'pro' | 'elite') => {
    setSaving(true);
    setBillingSuccess(null);

    const updated: OrganizationInfo = {
      ...organization,
      name,
      logoUrl,
      slug,
      tagline,
      contactEmail,
      contactPhone,
      website,
      address,
      footerMotto,
      pitchesConfig,
      subscriptionPlan: plan,
      subscriptionStatus: 'active',
      subscriptionExpiresAt: '2027-06-30', // 1 Year validity
    };

    try {
      await onUpdateOrganization(updated);
      setBillingSuccess(`លីមីតគណនីបានដំឡើងដោយជោគជ័យ! Switched to ${plan.toUpperCase()} Plan. features applied.`);
      setTimeout(() => setBillingSuccess(null), 5000);
    } catch (err) {
      console.error('Subscription update failed:', err);
      alert('Could not process plan change.');
    } finally {
      setSaving(false);
    }
  };

  // --- Dynamic Analytics Reporting Calculations ---
  const totals = useMemo(() => {
    // Total gross projected revenue
    let grossEarnings = 0;
    bookings.forEach(b => {
      const rate = SPORT_HOURLY_RATES[b.sportName] || 15;
      grossEarnings += rate;
    });

    // Active pitches sum
    const totalPitches = Object.values(pitchesConfig).reduce((sum, count) => sum + count, 0);

    // Bookings filtered for specific target reports
    const filteredReportBookings = bookings.filter(b => {
      const matchSport = reportSportFilter === 'All' || b.sportName === reportSportFilter;
      const matchDate = !reportDateFilter || b.date === reportDateFilter;
      return matchSport && matchDate;
    });

    // Calculated revenue for filtered subset
    const filteredEarnings = filteredReportBookings.reduce((sum, b) => {
      return sum + (SPORT_HOURLY_RATES[b.sportName] || 15);
    }, 0);

    // Calculate court utilization rate for default date "2026-06-16"
    // Supposing 14 active hourly slots per pitch daily (7am - 9pm)
    const totalDailyTimeSlots = totalPitches * 14;
    const dateSpecificBookingsCount = bookings.filter(b => b.date === (reportDateFilter || '2026-06-16')).length;
    const utilizationRate = totalDailyTimeSlots > 0 
      ? Math.min(100, Math.round((dateSpecificBookingsCount / totalDailyTimeSlots) * 100))
      : 0;

    return {
      grossEarnings,
      totalPitches,
      filteredReportBookings,
      filteredEarnings,
      utilizationRate,
      dateSpecificBookingsCount,
      totalDailyCapacity: totalDailyTimeSlots
    };
  }, [bookings, pitchesConfig, reportSportFilter, reportDateFilter]);

  // Sport specific breakdown
  const sportReportCards = useMemo(() => {
    return getActiveSports().map(sport => {
      const sportBookings = bookings.filter(b => b.sportName === sport);
      const rate = SPORT_HOURLY_RATES[sport] || 15;
      const totalRev = sportBookings.length * rate;
      const activeMatchCount = matches.filter(m => m.sport_name === sport).length;
      return {
        sport,
        bookingsCount: sportBookings.length,
        revenue: totalRev,
        matchesCount: activeMatchCount,
      };
    });
  }, [bookings, matches]);

  // Handle high fidelity CSV export
  const handleExportCSV = () => {
    if (totals.filteredReportBookings.length === 0) {
      alert('គ្មានទិន្នន័យដើម្បីទាញយកទេ (No data found to export).');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Booking ID,Booker Name,Sport Category,Pitch / Court Number,Scheduled Date,Start Time,End Time,Hourly Rate ($),Status,Is Tournament Match\n";

    totals.filteredReportBookings.forEach(b => {
      const rate = SPORT_HOURLY_RATES[b.sportName] || 15;
      const row = `"${b.id}","${b.bookerName}","${b.sportName}",Pitch ${b.pitchNumber},"${b.date}","${b.startTime}","${b.endTime}",${rate},"${b.status}","${b.isLeagueMatch ? 'Yes' : 'No'}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sports_venue_report_${reportDateFilter || 'all'}_${reportSportFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle print optimization
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in print:bg-white print:p-0">
      
      {/* Dynamic Navigation Header for Admin Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-2xl border border-amber-100 shadow-3xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide leading-tight">
              {activeSubTab === 'branding' && 'កែតម្រូវម៉ាកយីហោ (Branding & Identity)'}
              {activeSubTab === 'billing' && 'គម្រោងការជាវ & លីមីតកូដា (Subscription & Limits)'}
              {activeSubTab === 'reports' && 'របាយការណ៍ទីលាន & កាលវិភាគ (Venue Performance & Reports)'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              {activeSubTab === 'branding' && 'Configure custom domain settings, logo, contact directories, and custom sport pitches capacity'}
              {activeSubTab === 'billing' && 'Manage business subscription plans, resource quotas, invoice logs, and premium unlocks'}
              {activeSubTab === 'reports' && 'Export detailed Excel spreadsheets, print dynamic reports, audit bookings, and view pitch utilization rates'}
            </p>
          </div>
        </div>

        {/* Sub-tab switcher controls */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 w-full md:w-auto overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('branding')}
            className={`px-4 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'branding' 
                ? 'bg-white text-gray-800 shadow-sm border border-gray-150' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>ម៉ាកយីហោ (Identity)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('billing')}
            className={`px-4 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'billing' 
                ? 'bg-white text-gray-800 shadow-sm border border-gray-150' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>គម្រោងជាវ (Billing)</span>
            <span className={`px-1.5 py-0.5 text-[8px] rounded-md font-mono ${
              currentPlan === 'elite' ? 'bg-indigo-100 text-indigo-700' : currentPlan === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {currentPlan.toUpperCase()}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'reports' 
                ? 'bg-white text-gray-800 shadow-sm border border-gray-150' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>របាយការណ៍ (Reports)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: BRANDING & SETTINGS (Existing configurations fully preserved) */}
      {/* ========================================================================= */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          {/* Branding Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  ព័ត៌មានលម្អិតអំពីអង្គភាព (Corporate Identity Form)
                </h3>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">
                Platform Tenant settings
              </span>
            </div>

            <form onSubmit={handleSubmitBranding} className="space-y-4 text-xs font-semibold text-slate-700">
              {success && (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-150 flex items-center gap-2 text-xs font-bold animate-pulse">
                  <CheckCircle className="w-4 h-4" />
                  <span>បានរក្សាទុកព័ត៌មានដោយជោគជ័យ! Organization configurations saved and synchronized.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Organization Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                    ឈ្មោះអង្គភាព (Organization/Company Name) <strong className="text-red-500">*</strong>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Corporate Arena"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-gray-800"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                    អត្តសញ្ញាណ Slug (URL Slug / Subdomain ID) <strong className="text-red-500">*</strong>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="dhl-games"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono font-bold text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logo URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                    តំណភ្ជាប់ Logo រូបភាព (Corporate Logo URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-[11px] text-gray-700"
                  />
                </div>

                {/* Company Slogan / Tagline */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                    ពាក្យស្លោកអង្គភាព (Slogan / Motto / Slogan)
                  </label>
                  <input
                    type="text"
                    placeholder="Excellence. Simply delivered."
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* Footer motto */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                  ពាក្យស្លោក Footer របស់កម្មវិធី (Footer Slogan Text / Copyright Slogan)
                </label>
                <input
                  type="text"
                  placeholder="Excellence. Simply delivered. ★"
                  value={footerMotto}
                  onChange={(e) => setFooterMotto(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-gray-800"
                />
                <span className="text-[9px] text-gray-400 block mt-0.5 leading-tight">
                  This text will immediately replace the hardcoded logo motto / slogan at the bottom-right of the screen.
                </span>
              </div>

              <div className="border-t border-gray-100 my-4 pt-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">ទំនាក់ទំនង & ទីតាំង (Contact & Support Profiles)</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                      អ៊ីមែលទំនាក់ទំនង (Contact Email Address)
                    </label>
                    <input
                      type="email"
                      placeholder="kh.info@dhl.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-gray-800"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                      លេខទូរស័ព្ទ (Contact Phone Number)
                    </label>
                    <input
                      type="text"
                      placeholder="+855 23 999 444"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold text-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Website URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                      គេហទំព័រផ្លូវការ (Official Website Link)
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.dhl.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-[11px] text-gray-700"
                    />
                  </div>

                  {/* Office address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                      អាសយដ្ឋាន (Headquarters Street Address)
                    </label>
                    <input
                      type="text"
                      placeholder="Phnom Penh, Cambodia"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-medium text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Pitches & Courts Capacity Configuration */}
              <div className="border-t border-gray-100 my-4 pt-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">កំណត់ចំនួនទីលាន / តុប្រកួត (Pitches & Courts Configuration)</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                  កំណត់ចំនួនទីលានដែលមានសម្រាប់ការប្រកួតនីមួយៗ (ឧ. ទីលានទី១, ទីលានទី២) ដើម្បីងាយស្រួលរៀបចំលីគ និងការកក់ទុកក្នុងកាលវិភាគ។
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getActiveSports().map(sport => {
                    const conf = getSportConfig(sport);
                    const count = pitchesConfig[sport] || 2;
                    return (
                      <div key={sport} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-150">
                        <div className="flex items-center gap-2.5 select-none text-xs">
                          <span className="text-lg shrink-0">{conf.icon}</span>
                          <div>
                            <p className="font-extrabold text-gray-800 text-[11.5px] leading-tight">{conf.khmerName}</p>
                            <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-wider leading-none">{sport}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updatePitchCount(sport, -1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-650 border border-gray-200 shadow-3xs hover:shadow-2xs transition select-none active:scale-95 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono font-black text-xs text-gray-800 select-none">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updatePitchCount(sport, 1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-650 border border-gray-200 shadow-3xs hover:shadow-2xs transition select-none active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 border-b-2 border-amber-600 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-150 hover:shadow-md cursor-pointer select-none active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'រក្សាតម្លៃទុក...' : 'រក្សាទុកព័ត៌មានអង្គភាព (Save Corporate Info)'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Brand Preview panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-4">
              <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                រូបភាពទំរង់ Preview (Logo & Branding Preview)
              </h4>
              <div className="bg-slate-50 rounded-2xl p-5 border border-gray-200 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={name || 'Logo'}
                    className="max-h-16 max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-550 font-black text-xl">
                    {name ? name.substring(0, 1).toUpperCase() : 'O'}
                  </div>
                )}
                <div className="space-y-1.5">
                  <span className="text-xs font-black text-slate-800 uppercase block">{name || 'No Name Provided'}</span>
                  <p className="text-[10px] text-amber-600 font-black tracking-widest uppercase leading-none">{tagline || 'No Tagline'}</p>
                  <span className="inline-block bg-slate-900 text-[#FFCC00] text-[8px] font-mono font-black italic px-2 py-0.5 rounded-sm uppercase tracking-wider">
                    slug: {slug || 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Directory Detail preview */}
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-3">
              <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                ព័ត៌មានទំនាក់ទំនង (Directory card)
              </h4>
              <div className="text-[11px] space-y-2 text-slate-600 font-bold">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{contactEmail || 'Not verified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{contactPhone || 'Not verified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-650 underline">
                    {website || 'Not specified'}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{address || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PLANS & SUBSCRIPTION BILLING (Subscription Management model) */}
      {/* ========================================================================= */}
      {activeSubTab === 'billing' && (
        <div className="space-y-8 print:hidden">
          {/* Active Subscription status card */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-950 shadow-sm text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Active Subscription
                </span>
                <span className="text-[10px] text-gray-400 font-bold font-mono">
                  Tenant ID: {organization.slug}
                </span>
              </div>
              <h3 className="text-lg font-black uppercase tracking-wide">
                {currentPlan === 'elite' ? '👑 Elite Venue Corporate Plan' : currentPlan === 'pro' ? '⚡ Professional Sport Club Plan' : '🌱 Basic Free Trial Account'}
              </h3>
              <p className="text-[11px] text-[#cccccc] font-semibold">
                Your sports platform has full authorization under multi-business status. Access expires on{' '}
                <strong className="text-[#FFCC00] font-mono">
                  {organization.subscriptionExpiresAt || '2026-12-31'}
                </strong>
                .
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 text-center shrink-0 w-full md:w-auto">
              <div className="flex-1">
                <p className="text-[9px] text-[#aaaaaa] font-black uppercase">Quota Tier</p>
                <p className="text-base font-extrabold font-mono text-[#FFCC00] mt-1">
                  {currentPlan.toUpperCase()}
                </p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="flex-1">
                <p className="text-[9px] text-[#aaaaaa] font-black uppercase">Max Pitches</p>
                <p className="text-base font-extrabold font-mono text-white mt-1">
                  {currentPlan === 'elite' ? '20' : currentPlan === 'pro' ? '4' : '2'} / Sport
                </p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="flex-1">
                <p className="text-[9px] text-[#aaaaaa] font-black uppercase">Status</p>
                <p className="text-base font-extrabold font-mono text-emerald-400 mt-1 uppercase">
                  Active
                </p>
              </div>
            </div>
          </div>

          {billingSuccess && (
            <div className="bg-emerald-50 text-emerald-805 p-4 rounded-2xl border border-emerald-150 flex items-center gap-2.5 text-xs font-bold animate-pulse">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{billingSuccess}</span>
            </div>
          )}

          {/* Business Pricing Plan Selection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* PLAN 1: FREE TRIAL */}
            <div className={`bg-white rounded-3xl border p-6 flex flex-col justify-between space-y-6 transition duration-200 ${
              currentPlan === 'free' ? 'ring-2 ring-amber-400 shadow-md border-amber-200' : 'border-gray-150 shadow-3xs'
            }`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-md">
                    Starter
                  </span>
                  {currentPlan === 'free' && (
                    <span className="text-[9px] text-amber-800 font-extrabold uppercase bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                      <Check className="w-3 h-3" /> Current Plan
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase">Free Trial Account</h4>
                  <p className="text-[10.5px] text-gray-400 mt-1 leading-normal font-semibold">
                    Perfect for individual venue owners testing multi-organization capabilities.
                  </p>
                </div>
                <div className="flex items-baseline gap-1 py-2 border-b border-gray-100">
                  <span className="text-2xl font-black font-mono text-slate-800">$0</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">/ lifetime free</span>
                </div>

                {/* Quota checklists */}
                <ul className="text-[10.5px] space-y-2.5 text-slate-600 font-bold">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>5 Default Sports Categories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>1 Pitch / Sport limit capacity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Up to 20 matches per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Up to 100 Athlete registrations</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300 line-through">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Custom organization URL branding</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                disabled={currentPlan === 'free'}
                onClick={() => handlePlanUpgrade('free')}
                className={`w-full py-3 rounded-2xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer transition duration-150 ${
                  currentPlan === 'free'
                    ? 'bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 active:scale-98'
                }`}
              >
                Downgrade to Free
              </button>
            </div>

            {/* PLAN 2: PRO PLAN (Most popular) */}
            <div className={`bg-white rounded-3xl border p-6 flex flex-col justify-between space-y-6 relative overflow-hidden transition duration-200 ${
              currentPlan === 'pro' ? 'ring-2 ring-[#FFCC00] shadow-md border-amber-200' : 'border-gray-150 shadow-2xs'
            }`}>
              <div className="absolute top-0 right-0 bg-[#FFCC00] text-slate-900 font-black text-[8px] uppercase tracking-wider py-1 px-3.5 rounded-bl-xl">
                ★ POPULAR CHOICE
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md">
                    Professional
                  </span>
                  {currentPlan === 'pro' && (
                    <span className="text-[9px] text-amber-800 font-extrabold uppercase bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                      <Check className="w-3 h-3" /> Current Plan
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase">Pro Venue Club</h4>
                  <p className="text-[10.5px] text-gray-400 mt-1 leading-normal font-semibold">
                    Unlocks multiple courts booking management, advanced matches scheduler and reporting.
                  </p>
                </div>
                <div className="flex items-baseline gap-1 py-2 border-b border-gray-100">
                  <span className="text-2xl font-black font-mono text-slate-800">$49</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">/ Month (Billed Yearly)</span>
                </div>

                {/* Quota checklists */}
                <ul className="text-[10.5px] space-y-2.5 text-slate-600 font-bold">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
                    <span>Up to 10 Sports Categories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
                    <span>Max 4 Pitches / Sport capacity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
                    <span>Up to 2000 matches per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
                    <span>Up to 2000 Athlete registrations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
                    <span>Generate dynamic reports, CSV data exports</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                disabled={currentPlan === 'pro'}
                onClick={() => handlePlanUpgrade('pro')}
                className={`w-full py-3 rounded-2xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer transition duration-150 ${
                  currentPlan === 'pro'
                    ? 'bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed'
                    : 'bg-[#1a1a1a] hover:bg-slate-800 text-white active:scale-98 shadow-xs border-b-2 border-slate-950'
                }`}
              >
                {currentPlan === 'free' ? 'Upgrade to Pro' : 'Activate Pro Plan'}
              </button>
            </div>

            {/* PLAN 3: ELITE PLAN (Premium Business) */}
            <div className={`bg-white rounded-3xl border p-6 flex flex-col justify-between space-y-6 transition duration-200 ${
              currentPlan === 'elite' ? 'ring-2 ring-indigo-500 shadow-md border-indigo-200' : 'border-gray-150 shadow-2xs'
            }`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
                    Enterprise
                  </span>
                  {currentPlan === 'elite' && (
                    <span className="text-[9px] text-indigo-800 font-extrabold uppercase bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                      <Check className="w-3 h-3" /> Current Plan
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase">Elite Corporate Club</h4>
                  <p className="text-[10.5px] text-gray-400 mt-1 leading-normal font-semibold">
                    Ultimate multi-sports facility tier. Unlimited tournaments, dedicated domain & overlays.
                  </p>
                </div>
                <div className="flex items-baseline gap-1 py-2 border-b border-gray-100">
                  <span className="text-2xl font-black font-mono text-slate-800">$149</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">/ Month (Billed Yearly)</span>
                </div>

                {/* Quota checklists */}
                <ul className="text-[10.5px] space-y-2.5 text-slate-600 font-bold">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>All Sports Categories unlocked</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Up to 20 Pitches / Sport capacity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Unlimited match fixtures</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Unlimited Athlete registrations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Interactive TV scoring broadcasting overlays</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                disabled={currentPlan === 'elite'}
                onClick={() => handlePlanUpgrade('elite')}
                className={`w-full py-3 rounded-2xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer transition duration-150 ${
                  currentPlan === 'elite'
                    ? 'bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98 shadow-xs border-b-2 border-indigo-850'
                }`}
              >
                {currentPlan === 'elite' ? 'Current Plan (Active)' : 'Upgrade to Elite'}
              </button>
            </div>

          </div>

          {/* Billing & Invoice History Log Table */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-3xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  ប្រវត្តិការចេញវិក្កយបត្រ (Billing & Payment Statements History)
                </h4>
              </div>
              <span className="text-[10px] text-gray-400 font-bold font-mono">
                Payment Gateway: Disabled (Demo sandbox Mode)
              </span>
            </div>

            <div className="overflow-x-auto text-[10.5px] font-semibold text-slate-600">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[9px] font-extrabold select-none">
                    <th className="py-2.5 px-4 rounded-l-xl">Statement ID</th>
                    <th className="py-2.5 px-4">Period / Date</th>
                    <th className="py-2.5 px-4">Subscription Plan</th>
                    <th className="py-2.5 px-4 text-right">Amount Billed</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 rounded-r-xl">Receipt Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">STMT-004312</td>
                    <td className="py-3 px-4 text-gray-500 font-sans">2026-06-01</td>
                    <td className="py-3 px-4"><span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-mono text-[9px]">PRO_ANNUAL</span></td>
                    <td className="py-3 px-4 text-right font-black text-slate-800">$588.00</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold font-sans">✓ Completed</td>
                    <td className="py-3 px-4 font-sans text-blue-600 hover:underline cursor-pointer">Download Receipt</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">STMT-002159</td>
                    <td className="py-3 px-4 text-gray-500 font-sans">2026-05-01</td>
                    <td className="py-3 px-4"><span className="bg-slate-100 text-gray-700 px-2 py-0.5 rounded-md font-mono text-[9px]">TRIAL_ACCNT</span></td>
                    <td className="py-3 px-4 text-right font-black text-slate-800">$0.00</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold font-sans">✓ Completed</td>
                    <td className="py-3 px-4 font-sans text-blue-600 hover:underline cursor-pointer">Download Receipt</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: REPORTS & PERFORMANCE (Durable calculations & CSV exports)    */}
      {/* ========================================================================= */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6 print:space-y-4">
          
          {/* Action Header for Exports - Hidden on print */}
          <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="space-y-1 w-full sm:w-auto">
                <label className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Filter Sport</label>
                <select
                  value={reportSportFilter}
                  onChange={(e) => setReportSportFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-yellow-400 text-[10.5px] font-bold text-gray-700"
                >
                  <option value="All">All Sport Categories</option>
                  {getActiveSports().map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 w-full sm:w-auto">
                <label className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Date filter</label>
                <input
                  type="date"
                  value={reportDateFilter}
                  onChange={(e) => setReportDateFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-yellow-400 text-[10.5px] font-bold text-gray-700 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={() => { setReportSportFilter('All'); setReportDateFilter(''); }}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase mt-4 sm:mt-auto cursor-pointer"
              >
                Clear Filters
              </button>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={handlePrint}
                className="bg-gray-100 hover:bg-gray-200 text-slate-800 border border-gray-200 px-4 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-b-2 border-emerald-750 px-4 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel CSV</span>
              </button>
            </div>
          </div>

          {/* PRINT-ONLY HEADER */}
          <div className="hidden print:block border-b border-gray-300 pb-4 mb-4">
            <h1 className="text-xl font-black uppercase tracking-wide text-slate-900">{organization.name} - SYSTEM REPORT</h1>
            <p className="text-[10px] text-gray-500 uppercase font-black font-mono">Date range: {reportDateFilter || 'All time'} | Sport: {reportSportFilter}</p>
          </div>

          {/* Dynamic reports metrics Bento boxes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Box 1: Estimated Gross bookings Revenue projection */}
            <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-3xs flex flex-col justify-between space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider leading-none">Gross Projections</p>
                <span className="text-emerald-500 font-extrabold text-[11px] font-mono">+12.4%</span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black font-mono text-slate-800 leading-none">
                  ${totals.filteredEarnings.toLocaleString()}
                </p>
                <p className="text-[9px] text-gray-400 font-bold mt-1 leading-normal uppercase">
                  From {totals.filteredReportBookings.length} court bookings
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Computed hourly venue rates</span>
              </div>
            </div>

            {/* Box 2: Matches counts scheduled */}
            <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-3xs flex flex-col justify-between space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider leading-none">Matches Played</p>
                <span className="text-blue-500 font-extrabold text-[11px] font-mono">{matches.filter(m => m.status === 'Finished').length} Done</span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black font-mono text-slate-800 leading-none">
                  {matches.length}
                </p>
                <p className="text-[9px] text-gray-400 font-bold mt-1 leading-normal uppercase">
                  Official tournament fixtures
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                <Activity className="w-3 h-3 text-blue-500 shrink-0" />
                <span>Live updates dashboard sync</span>
              </div>
            </div>

            {/* Box 3: Court Utilization rate calculation */}
            <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-3xs flex flex-col justify-between space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider leading-none">Utilization Rate</p>
                <span className="text-[#FFCC00] font-mono font-bold text-[10px]">
                  {totals.dateSpecificBookingsCount} / {totals.totalDailyCapacity} slots
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 leading-none">
                  <p className="text-xl sm:text-2xl font-black font-mono text-slate-800">
                    {totals.utilizationRate}%
                  </p>
                </div>
                <p className="text-[9px] text-gray-400 font-bold mt-1 leading-normal uppercase">
                  On {reportDateFilter || '2026-06-16'}
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${totals.utilizationRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Box 4: Total enrolled athletes count */}
            <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-3xs flex flex-col justify-between space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider leading-none">Registered Users</p>
                <span className="text-indigo-500 font-extrabold text-[11px] font-mono">
                  {participants.filter(p => !p.is_team).length} competitors
                </span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black font-mono text-slate-800 leading-none">
                  {participants.length}
                </p>
                <p className="text-[9px] text-gray-400 font-bold mt-1 leading-normal uppercase">
                  Total teams and athletes list
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                <Users className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>Self-enrolment directory</span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Col: Sport-Specific breakdowns */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-150 shadow-3xs space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b border-gray-100 pb-2">
                វិភាគតាមប្រភេទកីឡា (Sport Category Performance Matrix)
              </h4>

              <div className="space-y-4 text-[10.5px] font-bold text-slate-600">
                {sportReportCards.map(item => {
                  const conf = getSportConfig(item.sport);
                  // Calculate dynamic percentage of total revenue
                  const revSharePercent = totals.grossEarnings > 0 
                    ? Math.round((item.revenue / totals.grossEarnings) * 100) 
                    : 0;
                  
                  return (
                    <div key={item.sport} className="space-y-1.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-150">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-lg leading-none">{conf.icon}</span>
                          <div>
                            <p className="font-extrabold text-gray-800 text-[11px] leading-tight">{conf.khmerName}</p>
                            <p className="text-[8px] font-mono font-black text-gray-400 tracking-wider leading-none">{item.sport}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-black text-slate-800 leading-tight">${item.revenue.toLocaleString()}</p>
                          <p className="text-[8px] font-mono text-gray-450 leading-none">{item.bookingsCount} Bookings</p>
                        </div>
                      </div>

                      {/* Visual progress bar of revenue share */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8.5px] text-gray-400 font-mono font-black uppercase">
                          <span>Fixture Count: {item.matchesCount}</span>
                          <span>Rev Share: {revSharePercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${revSharePercent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Col: Raw Bookings Audit Log Trail */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-150 shadow-3xs space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b border-gray-100 pb-2">
                ទិនានុប្បវត្តិការកក់ទុក (Court Bookings Audit Journal Trail)
              </h4>

              {totals.filteredReportBookings.length === 0 ? (
                <div className="py-12 text-center text-gray-450 text-[11px] font-black space-y-2 uppercase bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
                  <p>គ្មានទិន្នន័យកក់ទីលានត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ</p>
                  <p className="text-[9px] text-gray-400 lowercase">No bookings found for the selected filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto text-[10.5px] font-semibold text-slate-600">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase tracking-wider text-[8.5px] font-extrabold select-none">
                        <th className="py-2.5 px-3 rounded-l-xl">Booker Name</th>
                        <th className="py-2.5 px-3">Sport / Court</th>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3 text-right">Fee Rate</th>
                        <th className="py-2.5 px-3 rounded-r-xl">Type Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {totals.filteredReportBookings.map(b => {
                        const rate = SPORT_HOURLY_RATES[b.sportName] || 15;
                        return (
                          <tr key={b.id} className="hover:bg-slate-50 transition duration-100">
                            <td className="py-3 px-3 font-sans font-extrabold text-slate-800">{b.bookerName}</td>
                            <td className="py-3 px-3">
                              <p className="font-sans font-bold text-gray-800 leading-tight">{b.sportName}</p>
                              <p className="text-[9px] font-bold text-gray-450 leading-none">Court #{b.pitchNumber}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-gray-550 leading-tight">{b.date}</p>
                              <p className="text-[9px] text-gray-400 font-black leading-none">{b.startTime} - {b.endTime}</p>
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-800">${rate}</td>
                            <td className="py-3 px-3">
                              {b.isLeagueMatch ? (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm tracking-wider font-sans">
                                  🏆 LEAGUE
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 border border-gray-150 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm tracking-wider font-sans">
                                  ✓ BOOKING
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Quick Info details */}
          <div className="bg-slate-900 rounded-3xl p-5 text-[#cccccc] text-[10.5px] border border-slate-950 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#FFCC00] shrink-0" />
              <div>
                <p className="font-extrabold uppercase tracking-wide text-white">Projected billing notes</p>
                <p className="text-slate-400">Projected revenues and utilization metrics reflect calculated capacity. No financial liabilities are bound.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('billing')}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-[#FFCC00] border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
            >
              Configure Subscription Plan Limits
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

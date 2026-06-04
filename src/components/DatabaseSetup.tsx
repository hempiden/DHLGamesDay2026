import React, { useState } from 'react';
import { Database, RefreshCw, Save, CheckCircle, AlertTriangle, Cloud, CloudOff, Info, Upload } from 'lucide-react';
import { testSupabaseConnection, getSupabaseClient } from '../supabase';

interface DatabaseSetupProps {
  supabaseUrl: string;
  setSupabaseUrl: (url: string) => void;
  supabaseAnonKey: string;
  setSupabaseAnonKey: (key: string) => void;
  isSupabaseEnabled: boolean;
  setIsSupabaseEnabled: (enabled: boolean) => void;
  users: any[];
}

export default function DatabaseSetup({
  supabaseUrl,
  setSupabaseUrl,
  supabaseAnonKey,
  setSupabaseAnonKey,
  isSupabaseEnabled,
  setIsSupabaseEnabled,
  users,
}: DatabaseSetupProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'failed'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');

  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      alert('សូមបំពេញ URL និង Anon Key ជាមុនសិន។ Please provide URL and API Key first.');
      setTestStatus('failed');
      return;
    }
    setTestStatus('testing');
    const works = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setTestStatus(works ? 'success' : 'failed');
    if (works) {
      setIsSupabaseEnabled(true);
      localStorage.setItem('dhl_supabase_enabled', 'true');
    }
  };

  const saveKeys = () => {
    localStorage.setItem('dhl_supabase_url', supabaseUrl);
    localStorage.setItem('dhl_supabase_anon_key', supabaseAnonKey);
    alert('រក្សាទុកការភ្ជាប់ជោគជ័យ! Supabase Key settings saved locally.');
  };

  const handlePushLocalToCloud = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      alert('សូមបំពេញ URL និង Anon Key រួចរក្សាទុកជាមុនសិន。 Please define and save Supabase credentials first.');
      return;
    }

    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    if (!client) {
      alert('មិនអាចបង្កើត Supabase client បានទេ។ Could not initialize client.');
      return;
    }

    const confirmed = window.confirm(
      "តើអ្នកពិតជាចង់បញ្ចូលទិន្នន័យ (Matches & Participants & Admins) ពីម៉ាស៊ីនស្រុករបស់អ្នកទៅកាន់ Supabase មែនទេ? នេះនឹងបន្ថែមទិន្នន័យថ្មីទៅកាន់ពពក។\n\nDo you want to bulk upload your current local matches, participants and admin users to Supabase?"
    );
    if (!confirmed) return;

    setSyncStatus('syncing');
    setSyncMessage('កំពុងរៀបចំទិន្នន័យ... Preparing local records...');

    try {
      const localMatchesStr = localStorage.getItem('dhl_games_day_matches');
      const localParticipantsStr = localStorage.getItem('dhl_games_day_participants');

      const matches = localMatchesStr ? JSON.parse(localMatchesStr) : [];
      const participants = localParticipantsStr ? JSON.parse(localParticipantsStr) : [];

      let organizationSlug = 'company-games';
      try {
        const savedOrg = localStorage.getItem('dhl_organization_settings');
        if (savedOrg) {
          organizationSlug = JSON.parse(savedOrg).slug || 'company-games';
        }
      } catch (e) {
        console.warn('Could not read saved organization slug:', e);
      }

      if (matches.length === 0 && participants.length === 0 && (!users || users.length === 0)) {
        setSyncStatus('failed');
        setSyncMessage('គ្មានទិន្នន័យក្នុង Browser memory ដើម្បី Sync ទេ។ No local database records found.');
        return;
      }

      let matchCount = 0;
      let participantCount = 0;
      let userCount = 0;

      // 1. Sync matches
      if (matches.length > 0) {
        setSyncMessage(`កំពុងបញ្ជូន ${matches.length} ការប្រកួតទៅ Supabase... Uploading matches...`);
        const matchesToInsert = matches.map((m: any) => ({
          sport_name: m.sport_name,
          match_label: m.match_label,
          team_a: m.team_a,
          team_b: m.team_b,
          score_a: Number(m.score_a) || 0,
          score_b: Number(m.score_b) || 0,
          status: m.status,
          event_id: m.event_id || null,
          created_by: m.created_by || null,
        }));

        const { error: matchError } = await client.from('matches').insert(matchesToInsert);
        if (matchError) {
          throw new Error(`Match upload error: ${matchError.message}`);
        }
        matchCount = matches.length;
      }

      // 2. Sync participants
      if (participants.length > 0) {
        setSyncMessage(`កំពុងបញ្ជូន ${participants.length} កីឡាករទៅ Supabase... Uploading participants...`);
        const partToInsert = participants.map((p: any) => ({
          name: p.name,
          sport_type: p.sport_type,
          is_team: Boolean(p.is_team),
          team_id: p.team_id && p.team_id !== 'null' ? String(p.team_id) : null,
          photo_url: p.photo_url || null,
          gender: p.gender || null,
          event_id: p.event_id || 'dhl-games-2026',
          created_by: p.created_by || 'hempiden',
          organization_slug: p.organization_slug || organizationSlug,
        }));

        const { error: partError } = await client.from('participants').insert(partToInsert);
        if (partError) {
          throw new Error(`Participants upload error: ${partError.message}`);
        }
        participantCount = participants.length;
      }

      // 3. Sync admin users
      if (users && users.length > 0) {
        setSyncMessage(`កំពុងបញ្ជូន ${users.length} គណនីអភិបាលទៅ Supabase... Uploading admin records...`);
        const usersToInsert = users.map((u: any) => ({
          id: String(u.id),
          username: u.username,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          password_plain: u.passwordPlain,
          created_at: u.created_at || new Date().toISOString()
        }));

        const { error: userError } = await client.from('admin_users').upsert(usersToInsert);
        if (userError) {
          throw new Error(`Admin users upload error: ${userError.message}`);
        }
        userCount = users.length;
      }

      setSyncStatus('success');
      setSyncMessage(`ការ Sync បានជោគជ័យ! Pushed ${matchCount} matches, ${participantCount} participants, & ${userCount} admin users to Supabase!`);
      alert(`បញ្ជូនជោគជ័យ! Pushed ${matchCount} matches, ${participantCount} participants and ${userCount} admin users to Supabase.`);
    } catch (err: any) {
      console.error(err);
      setSyncStatus('failed');
      setSyncMessage(`បរាជ័យក្នុងការបញ្ជូនទៅ Cloud: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      
      {/* Header card with custom branding styling */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-dhl-title text-2xl text-[#D40511] italic tracking-tight uppercase">
            DATABASE SETUP & SYNC
          </h2>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
            Realtime Supabase Cloud Integration
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shrink-0">
          {isSupabaseEnabled ? (
            <>
              <Cloud className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wide">CLOUD STATE: ENGAGED</span>
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4 text-gray-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide">CLOUD STATE: LOCAL ONLY</span>
            </>
          )}
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
              ការភ្ជាប់ SUPABASE DATABASE (ស្រេចចិត្ត)
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
              Configure your credentials for cloud-native tournament scoring
            </p>
          </div>
        </div>

        <div className="text-xs space-y-5">
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-md">
            <div className="flex gap-3">
              <Info className="w-5.5 h-5.5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-[11px]">
                <p className="font-extrabold text-indigo-300 uppercase tracking-wider">របៀបដំណើរការទិន្នន័យ & Environment Keys (System Architecture Guide)</p>
                
                <div className="space-y-3 text-gray-300">
                  <p>
                    <strong className="text-white text-xs block mb-1">❓ ហេتوىអ្វីបានជាគ្មានទិន្នន័យនៅក្នុងតារាង (Why is my table empty?):</strong>
                    តាមលំនាំដើម កម្មវិធីនេះរក្សាទុកទិន្នន័យទាំងអស់នៅលើប្រព័ន្ធ <span className="bg-slate-850 px-1.5 py-0.5 rounded text-amber-500 font-mono">localStorage</span> របស់ Browser។ រហូតទាល់តែអ្នកចុចប៊ូតុង <strong className="text-emerald-400">"Push Local Data to Supabase"</strong> នៅផ្នែកខាងក្រោម ទើបកីឡាករ និងការប្រកួតទាំងអស់ត្រូវបានបញ្ចូលទៅកាន់ពពក (Supabase Cloud)!
                  </p>

                  <div className="border-t border-slate-850 my-2 pt-2.5">
                    <strong className="text-[#FFCC00] text-xs block mb-1">🚀 ការកំណត់ Environment Variables នៅលើ Vercel ឬ AI Studio:</strong>
                    ដើម្បីឱ្យកម្មវិធីរបស់អ្នកតភ្ជាប់ទៅកាន់ Supabase ដោយស្វ័យប្រវត្តិតាំងពីចាប់ផ្តើមដំណើរការ (ដោយមិនចាំបាច់បំពេញ URL រាល់ពេល) សូមចូលទៅកាន់ទំព័រ <strong className="text-white">Settings &gt; Environment Variables</strong> នៅក្នុង <strong className="text-white">Vercel Dashboard</strong> ឬប្រព័ន្ធគ្រប់គ្រងរបស់យើង រួចបង្កើតអថេរចម្បងទាំង ២ ខាងក្រោម៖
                    <ul className="list-disc list-inside space-y-1.5 mt-2 pl-2 text-gray-300 font-medium">
                      <li>
                        <code className="text-[#FFCC00] font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded text-[10px]">VITE_SUPABASE_URL</code> : តំណភ្ជាប់ API URL នៃគម្រោង Supabase របស់អ្នក (e.g. <span className="text-slate-400 font-mono">https://xxxx.supabase.co</span>)។
                      </li>
                      <li>
                        <code className="text-[#FFCC00] font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded text-[10px]">VITE_SUPABASE_ANON_KEY</code> : API anon / publishable key សាធារណៈសម្រាប់ភ្ជាប់មកកាន់ Database របស់អ្នក។
                      </li>
                    </ul>
                    <p className="mt-2 text-[10px] text-slate-400 italic font-normal">
                      💡 Fallback Support: ប្រសិនបើគម្រោងរបស់អ្នកប្រើ Next.js keys កម្មវិធីនេះក៏គាំទ្រស្វ័យប្រវត្តិនូវ <code className="text-cyan-400 font-mono text-[9px]">NEXT_PUBLIC_SUPABASE_URL</code> និង <code className="text-cyan-400 font-mono text-[9px]">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> ផងដែរ។
                    </p>
                  </div>

                  <p className="border-t border-slate-850 pt-2 text-[10.5px]">
                    <strong className="text-white text-xs block mb-1">📊 គំនូសតារាងទិន្នន័យ (Database Tables Schema):</strong>
                    គម្រោងរបស់ Dhl Games Day ត្រូវបានរៀបចំឡើងយ៉ាងស្អិតរមួតដើម្បីគាំទ្រការគ្រប់គ្រង tournament ច្រើនដង និងអ្នកគ្រប់គ្រងច្រើនរូបដោយសុវត្ថិភាព។ គំនូសបំរែបំរួល SQL ខាងក្រោមមានលក្ខណៈពេញលេញសម្រាប់ការបង្កើតថ្មី ឬតំឡើងជំនាន់ (Upgrade) database របស់អ្នក។
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">
                SUPABASE URL
              </label>
              <input
                type="text"
                placeholder="https://YOUR_PROJECT_ID.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono text-xs text-gray-700 bg-gray-50/50 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">
                SUPABASE ANON KEY
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono text-xs text-gray-700 bg-gray-50/50 shadow-inner"
              />
            </div>
          </div>

          {/* Connection Status Slider Switch */}
          <div className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-extrabold text-[#1a1a1a] uppercase text-[10.5px]">ស្ថានភាពភ្ជាប់ (DATABASE CONNECTION STATE)</span>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Toggle to switch between local browser persistence and cloud database syncing</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const state = !isSupabaseEnabled;
                setIsSupabaseEnabled(state);
                localStorage.setItem('dhl_supabase_enabled', String(state));
                alert(state ? 'Supabase Sync Connection is Enabled! Connecting to database...' : 'Supabase Sync is disabled. Now operating locally.');
              }}
              className={`w-14 h-7.5 rounded-full flex items-center px-1 duration-250 transition-colors cursor-pointer shrink-0 ${
                isSupabaseEnabled ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'
              }`}
            >
              <span className="w-5.5 h-5.5 bg-white rounded-full shadow-md"></span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              className="flex-1 py-3.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl font-black uppercase tracking-wider text-xs duration-150 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
              <span>តេស្តការភ្ជាប់ (Test Connection)</span>
            </button>

            <button
              type="button"
              onClick={saveKeys}
              className="flex-1 py-3.5 px-4 bg-[#1a1a1a] hover:bg-black text-white rounded-2xl font-black uppercase tracking-wider text-xs duration-150 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>រក្សាទុកតម្លៃ (Save Credentials)</span>
            </button>
          </div>

          {/* Connection feedback notifications */}
          {testStatus === 'success' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-3 animate-fade-in">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-extrabold text-[11px] uppercase tracking-wide">ការភ្ជាប់ទៅ Supabase ជោគជ័យ!</p>
                <p className="text-[10px] text-emerald-600 font-medium">Database connection successfully verified. All changes will sync in real-time.</p>
              </div>
            </div>
          )}
          {testStatus === 'failed' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <div>
                <p className="font-extrabold text-[11px] uppercase tracking-wide">ការភ្ជាប់បរាជ័យ (Connection Failed)</p>
                <p className="text-[10px] text-red-600 font-medium">សូមពិនិត្យមើល URL, API Keys ឡើងវិញ ឬប្រាកដថាតារាងត្រូវបានបង្កើតរួចរាល់នៅក្នុង Supabase project។</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* BULK DATA PUSH SECTION */}
      {isSupabaseEnabled && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                បញ្ចូលទិន្នន័យពីក្នុង Browser ទៅកាន់ Cloud (UPLOAD LOCAL DATA TO CLOUD)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                Push your pre-existing players & matches list into your empty Supabase database
              </p>
            </div>
          </div>

          <div className="text-xs space-y-3">
            <p className="text-gray-500 font-medium leading-relaxed">
              នៅពេលដំបូងបង្អស់ដែលអ្នកទើបតែបង្កើតតារាងនៅក្នុង Supabase វានឹងគ្មានទិន្នន័យឡើយ (0 records)។ អ្នកអាចចុចប៊ូតុងខាងក្រោមដើម្បីផ្ទេរទិន្នន័យកីឡាករ និងគូប្រកួតទាំងអស់ពី Browser (LocalStorage) របស់អ្នកទៅកាន់ Supabase បានភ្លាមៗ។
            </p>

            <button
              type="button"
              disabled={syncStatus === 'syncing'}
              onClick={handlePushLocalToCloud}
              className={`w-full py-4 px-5 rounded-2xl font-black uppercase tracking-wider text-xs duration-150 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2.5 ${
                syncStatus === 'syncing' 
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
              }`}
            >
              <Upload className={`w-4.5 h-4.5 ${syncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
              <span>{syncStatus === 'syncing' ? 'កំពុងបញ្ចូលទិន្នន័យ (Uploading...)' : 'បញ្ចូលទិន្នន័យទៅកាន់ Supabase (Push Local Data to Supabase)'}</span>
            </button>

            {syncStatus !== 'idle' && (
              <div className={`p-4 rounded-2xl border text-[11px] leading-relaxed flex items-center gap-3 animate-fade-in ${
                syncStatus === 'success' 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-850 font-semibold' 
                  : syncStatus === 'failed'
                  ? 'bg-red-50/70 border-red-200 text-red-850 font-semibold'
                  : 'bg-indigo-50/70 border-indigo-200 text-indigo-850 font-semibold'
              }`}>
                {syncStatus === 'syncing' && <RefreshCw className="w-4.5 h-4.5 text-indigo-600 animate-spin shrink-0" />}
                {syncStatus === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                {syncStatus === 'failed' && <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0" />}
                <p>{syncMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SQL SCHEMA INITIALIZATION SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                របៀបបង្កើតតារាងនៅក្នុង SUPABASE (CREATE TABLES SQL)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                Run this SQL in your Supabase SQL Editor to resolve the schema cache/missing table errors
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
            const sqlText = `-- Supabase Table Setup for Multi-Tenant Sports Tournaments

-- 1. Create Events Table
create table if not exists public.events (
  id text primary key,
  name text not null,
  khmer_name text,
  date text,
  description text,
  sports jsonb not null default '[]'::jsonb,
  theme_color text default 'dhl',
  created_by text not null,
  show_public_teams boolean default false,
  is_enrolment_enabled boolean default true,
  organization_slug text,
  enabled_languages text default 'kh,en',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Matches Table (with Isolation)
create table if not exists public.matches (
  id bigint generated by default as identity primary key,
  event_id text,
  created_by text,
  sport_name text not null,
  match_label text,
  team_a text not null,
  team_b text not null,
  score_a integer default 0,
  score_b integer default 0,
  status text check (status in ('Upcoming', 'Live', 'Finished')),
  scheduled_date text,
  scheduled_time text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Create Participants Table (with Isolation)
create table if not exists public.participants (
  id bigint generated by default as identity primary key,
  event_id text,
  created_by text,
  name text not null,
  sport_type text not null,
  is_team boolean not null default false,
  team_id text,
  photo_url text,
  gender text,
  organization_slug text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Create Admin Users Table
create table if not exists public.admin_users (
  id text primary key,
  username text not null unique,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'super_admin')),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  password_plain text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Create Event Settings Table
create table if not exists public.event_settings (
  key text primary key,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Create Organization Settings Table
create table if not exists public.organization_settings (
  id text primary key default 'current',
  name text not null,
  logo_url text,
  slug text not null,
  tagline text,
  contact_email text,
  contact_phone text,
  website text,
  address text,
  footer_motto text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ==========================================
-- SAFE GRADUAL DATABASE UPGRADE STATEMENTS
-- ==========================================
-- Safe upgrades for events table columns
alter table public.events add column if not exists show_public_teams boolean default false;
alter table public.events add column if not exists is_enrolment_enabled boolean default true;
alter table public.events add column if not exists organization_slug text;
alter table public.events add column if not exists enabled_languages text default 'kh,en';

-- Safe upgrades for matches table columns
alter table public.matches add column if not exists event_id text;
alter table public.matches add column if not exists created_by text;
alter table public.matches add column if not exists scheduled_date text;
alter table public.matches add column if not exists scheduled_time text;

-- Safe upgrades for participants table columns
alter table public.participants add column if not exists event_id text;
alter table public.participants add column if not exists created_by text;
alter table public.participants add column if not exists gender text;
alter table public.participants add column if not exists team_id text;
alter table public.participants add column if not exists photo_url text;
alter table public.participants add column if not exists organization_slug text;

-- 7. Insert fallback organization values
insert into public.organization_settings (id, name, logo_url, slug, tagline, contact_email, contact_phone, website, address, footer_motto)
values (
  'current',
  'Corporate Arena',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400',
  'corporate-games',
  'Connect. Compete. Celebrate.',
  'info@corporatearena.com',
  '+855 23 111 222',
  'https://www.corporatearena.com',
  'Phnom Penh, Cambodia',
  'Unity in Diversity • Peak Performance'
) on conflict (id) do nothing;

-- 8. Enable Public Access policies for quick testing
alter table public.events enable row level security;
drop policy if exists "Allow read events" on public.events;
create policy "Allow read events" on public.events for select using (true);
drop policy if exists "Allow insert events" on public.events;
create policy "Allow insert events" on public.events for insert with check (true);
drop policy if exists "Allow update events" on public.events;
create policy "Allow update events" on public.events for update using (true);
drop policy if exists "Allow delete events" on public.events;
create policy "Allow delete events" on public.events for delete using (true);

alter table public.matches enable row level security;
drop policy if exists "Allow read matches" on public.matches;
create policy "Allow read matches" on public.matches for select using (true);
drop policy if exists "Allow insert matches" on public.matches;
create policy "Allow insert matches" on public.matches for insert with check (true);
drop policy if exists "Allow update matches" on public.matches;
create policy "Allow update matches" on public.matches for update using (true);
drop policy if exists "Allow delete matches" on public.matches;
create policy "Allow delete matches" on public.matches for delete using (true);

alter table public.participants enable row level security;
drop policy if exists "Allow read participants" on public.participants;
create policy "Allow read participants" on public.participants for select using (true);
drop policy if exists "Allow insert participants" on public.participants;
create policy "Allow insert participants" on public.participants for insert with check (true);
drop policy if exists "Allow update participants" on public.participants;
create policy "Allow update participants" on public.participants for update using (true);
drop policy if exists "Allow delete participants" on public.participants;
create policy "Allow delete participants" on public.participants for delete using (true);

alter table public.admin_users enable row level security;
drop policy if exists "Allow read admin_users" on public.admin_users;
create policy "Allow read admin_users" on public.admin_users for select using (true);
drop policy if exists "Allow insert admin_users" on public.admin_users;
create policy "Allow insert admin_users" on public.admin_users for insert with check (true);
drop policy if exists "Allow update admin_users" on public.admin_users;
create policy "Allow update admin_users" on public.admin_users for update using (true);
drop policy if exists "Allow delete admin_users" on public.admin_users;
create policy "Allow delete admin_users" on public.admin_users for delete using (true);

alter table public.event_settings enable row level security;
drop policy if exists "Allow read event_settings" on public.event_settings;
create policy "Allow read event_settings" on public.event_settings for select using (true);
drop policy if exists "Allow insert event_settings" on public.event_settings;
create policy "Allow insert event_settings" on public.event_settings for insert with check (true);
drop policy if exists "Allow update event_settings" on public.event_settings;
create policy "Allow update event_settings" on public.event_settings for update using (true);
drop policy if exists "Allow delete event_settings" on public.event_settings;
create policy "Allow delete event_settings" on public.event_settings for delete using (true);

alter table public.organization_settings enable row level security;
drop policy if exists "Allow read organization_settings" on public.organization_settings;
create policy "Allow read organization_settings" on public.organization_settings for select using (true);
drop policy if exists "Allow insert organization_settings" on public.organization_settings;
create policy "Allow insert organization_settings" on public.organization_settings for insert with check (true);
drop policy if exists "Allow update organization_settings" on public.organization_settings;
create policy "Allow update organization_settings" on public.organization_settings for update using (true);
drop policy if exists "Allow delete organization_settings" on public.organization_settings;
create policy "Allow delete organization_settings" on public.organization_settings for delete using (true);`;
              navigator.clipboard.writeText(sqlText);
              alert("រក្សាទុក SQL នៅក្នុង Clipboard រួចរាល់! SQL copied to clipboard. Go to Supabase SQL Editor, paste and click 'Run'.");
            }}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wide cursor-pointer transition active:scale-95 duration-150 border border-indigo-150 shrink-0"
          >
            ចម្លងកូដ SQL (Copy DDL SQL)
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
            ប្រសិនបើកម្មវិធីបង្ហាញសារកំហុស <code className="bg-red-50 text-[#D40511] font-mono px-1.5 py-0.5 rounded border border-red-100 font-bold">Could not find table 'public.participants'</code>, 
            នេះមានន័យថាគម្រោង Supabase របស់អ្នកមិនទាន់មានតារាងទិន្នន័យចាំបាច់នៅឡើយទេ។ សូមអនុវត្តកិច្ចការខាងក្រោម៖
          </p>
          <ol className="list-decimal list-inside text-[11px] text-gray-600 space-y-1.5 font-medium pl-1">
            <li>បើក <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">Supabase Dashboard</a> រួចចូលទៅកាន់គម្រោងរបស់អ្នក។</li>
            <li>ចុចលើប៊ូតុង <strong className="text-gray-800">"SQL Editor"</strong> (រូបតំណាង <span className="font-mono bg-gray-100 px-1 py-0.5 rounded border">SQL</span> នៅលើរបារខាងឆ្វេង)។</li>
            <li>ចុចលើ <strong className="text-gray-800">"New query"</strong>។</li>
            <li>ចម្លងកូដ SQL ខាងក្រោម ហើយផាស្តចូល រួចចុចប៊ូតុង <strong className="text-indigo-600 font-black">"Run"</strong> នៅខាងក្រោមស្តាំដៃ។</li>
          </ol>

          <div className="relative mt-2">
            <pre className="p-4 bg-gray-50 border border-gray-150 rounded-2xl text-[10px] font-mono text-gray-600 overflow-x-auto max-h-64 leading-relaxed shadow-inner">
{`-- Supabase Table Setup for Multi-Tenant Sports Tournaments

-- 1. Create Events Table
create table if not exists public.events (
  id text primary key,
  name text not null,
  khmer_name text,
  date text,
  description text,
  sports jsonb not null default '[]'::jsonb,
  theme_color text default 'dhl',
  created_by text not null,
  show_public_teams boolean default false,
  is_enrolment_enabled boolean default true,
  organization_slug text,
  enabled_languages text default 'kh,en',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Matches Table (with Isolation)
create table if not exists public.matches (
  id bigint generated by default as identity primary key,
  event_id text,
  created_by text,
  sport_name text not null,
  match_label text,
  team_a text not null,
  team_b text not null,
  score_a integer default 0,
  score_b integer default 0,
  status text check (status in ('Upcoming', 'Live', 'Finished')),
  scheduled_date text,
  scheduled_time text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Create Participants Table (with Isolation)
create table if not exists public.participants (
  id bigint generated by default as identity primary key,
  event_id text,
  created_by text,
  name text not null,
  sport_type text not null,
  is_team boolean not null default false,
  team_id text,
  photo_url text,
  gender text,
  organization_slug text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Create Admin Users Table
create table if not exists public.admin_users (
  id text primary key,
  username text not null unique,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'super_admin')),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  password_plain text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Create Event Settings Table
create table if not exists public.event_settings (
  key text primary key,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Create Organization Settings Table
create table if not exists public.organization_settings (
  id text primary key default 'current',
  name text not null,
  logo_url text,
  slug text not null,
  tagline text,
  contact_email text,
  contact_phone text,
  website text,
  address text,
  footer_motto text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ==========================================
-- SAFE GRADUAL DATABASE UPGRADE STATEMENTS
-- ==========================================
-- Safe upgrades for events table columns
alter table public.events add column if not exists show_public_teams boolean default false;
alter table public.events add column if not exists is_enrolment_enabled boolean default true;
alter table public.events add column if not exists organization_slug text;
alter table public.events add column if not exists enabled_languages text default 'kh,en';

-- Safe upgrades for matches table columns
alter table public.matches add column if not exists event_id text;
alter table public.matches add column if not exists created_by text;
alter table public.matches add column if not exists scheduled_date text;
alter table public.matches add column if not exists scheduled_time text;

-- Safe upgrades for participants table columns
alter table public.participants add column if not exists event_id text;
alter table public.participants add column if not exists created_by text;
alter table public.participants add column if not exists gender text;
alter table public.participants add column if not exists team_id text;
alter table public.participants add column if not exists photo_url text;
alter table public.participants add column if not exists organization_slug text;

-- 7. Insert fallback organization values
insert into public.organization_settings (id, name, logo_url, slug, tagline, contact_email, contact_phone, website, address, footer_motto)
values (
  'current',
  'Corporate Arena',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400',
  'corporate-games',
  'Connect. Compete. Celebrate.',
  'info@corporatearena.com',
  '+855 23 111 222',
  'https://www.corporatearena.com',
  'Phnom Penh, Cambodia',
  'Unity in Diversity • Peak Performance'
) on conflict (id) do nothing;

-- 8. Enable Public Access policies for all tables
alter table public.events enable row level security;
drop policy if exists "Allow read events" on public.events;
create policy "Allow read events" on public.events for select using (true);
drop policy if exists "Allow insert events" on public.events;
create policy "Allow insert events" on public.events for insert with check (true);
drop policy if exists "Allow update events" on public.events;
create policy "Allow update events" on public.events for update using (true);
drop policy if exists "Allow delete events" on public.events;
create policy "Allow delete events" on public.events for delete using (true);

alter table public.matches enable row level security;
drop policy if exists "Allow read matches" on public.matches;
create policy "Allow read matches" on public.matches for select using (true);
drop policy if exists "Allow insert matches" on public.matches;
create policy "Allow insert matches" on public.matches for insert with check (true);
drop policy if exists "Allow update matches" on public.matches;
create policy "Allow update matches" on public.matches for update using (true);
drop policy if exists "Allow delete matches" on public.matches;
create policy "Allow delete matches" on public.matches for delete using (true);

alter table public.participants enable row level security;
drop policy if exists "Allow read participants" on public.participants;
create policy "Allow read participants" on public.participants for select using (true);
drop policy if exists "Allow insert participants" on public.participants;
create policy "Allow insert participants" on public.participants for insert with check (true);
drop policy if exists "Allow update participants" on public.participants;
create policy "Allow update participants" on public.participants for update using (true);
drop policy if exists "Allow delete participants" on public.participants;
create policy "Allow delete participants" on public.participants for delete using (true);

alter table public.admin_users enable row level security;
drop policy if exists "Allow read admin_users" on public.admin_users;
create policy "Allow read admin_users" on public.admin_users for select using (true);
drop policy if exists "Allow insert admin_users" on public.admin_users;
create policy "Allow insert admin_users" on public.admin_users for insert with check (true);
drop policy if exists "Allow update admin_users" on public.admin_users;
create policy "Allow update admin_users" on public.admin_users for update using (true);
drop policy if exists "Allow delete admin_users" on public.admin_users;
create policy "Allow delete admin_users" on public.admin_users for delete using (true);

alter table public.event_settings enable row level security;
drop policy if exists "Allow read event_settings" on public.event_settings;
create policy "Allow read event_settings" on public.event_settings for select using (true);
drop policy if exists "Allow insert event_settings" on public.event_settings;
create policy "Allow insert event_settings" on public.event_settings for insert with check (true);
drop policy if exists "Allow update event_settings" on public.event_settings;
create policy "Allow update event_settings" on public.event_settings for update using (true);
drop policy if exists "Allow delete event_settings" on public.event_settings;
create policy "Allow delete event_settings" on public.event_settings for delete using (true);

alter table public.organization_settings enable row level security;
drop policy if exists "Allow read organization_settings" on public.organization_settings;
create policy "Allow read organization_settings" on public.organization_settings for select using (true);
drop policy if exists "Allow insert organization_settings" on public.organization_settings;
create policy "Allow insert organization_settings" on public.organization_settings for insert with check (true);
drop policy if exists "Allow update organization_settings" on public.organization_settings;
create policy "Allow update organization_settings" on public.organization_settings for update using (true);
drop policy if exists "Allow delete organization_settings" on public.organization_settings;
create policy "Allow delete organization_settings" on public.organization_settings for delete using (true);`}
            </pre>
          </div>
        </div>
      </div>

    </div>
  );
}

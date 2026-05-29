import React, { useState } from 'react';
import { Database, RefreshCw, Save, CheckCircle, AlertTriangle, Cloud, CloudOff, Info } from 'lucide-react';
import { testSupabaseConnection } from '../supabase';

interface DatabaseSetupProps {
  supabaseUrl: string;
  setSupabaseUrl: (url: string) => void;
  supabaseAnonKey: string;
  setSupabaseAnonKey: (key: string) => void;
  isSupabaseEnabled: boolean;
  setIsSupabaseEnabled: (enabled: boolean) => void;
}

export default function DatabaseSetup({
  supabaseUrl,
  setSupabaseUrl,
  supabaseAnonKey,
  setSupabaseAnonKey,
  isSupabaseEnabled,
  setIsSupabaseEnabled,
}: DatabaseSetupProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

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

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      
      {/* Header card with DHL branding styling */}
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
          <div className="bg-amber-50/55 border border-amber-200/60 p-4 rounded-2xl text-amber-900 leading-relaxed flex gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[11px]">ព័ត៌មានប្រព័ន្ធទិន្នន័យ (System Information)</p>
              <p className="text-gray-600 font-medium text-[10.5px]">
                អ្នកអាចភ្ជាប់កម្មវិធីនេះទៅកាន់ **Supabase Realtime Database** ផ្ទាល់ខ្លួនរបស់អ្នកបាន។ ប្រសិនបើភ្ជាប់ជោគជ័យ ទិន្នន័យនៃការបញ្ចូលពិន្ទុ កីឡាករ និងការប្រកួត នឹងត្រូវបានរក្សាទុក និង Sync នៅលើ Server ជាក់ស្តែងភ្លាមៗ។
              </p>
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
              const sqlText = `-- Supabase Table Setup for DHL Games Day\n\n-- 1. Create Matches Table\ncreate table if not exists public.matches (\n  id text primary key,\n  sport_name text not null,\n  match_label text,\n  team_a text not null,\n  team_b text not null,\n  score_a integer default 0,\n  score_b integer default 0,\n  status text check (status in ('Upcoming', 'Live', 'Finished')),\n  created_at timestamp with time zone default timezone('utc'::text, now()),\n  updated_at timestamp with time zone default timezone('utc'::text, now())\n);\n\n-- 2. Create Participants Table\ncreate table if not exists public.participants (\n  id text primary key,\n  name text not null,\n  sport_type text not null,\n  is_team boolean not null default false,\n  team_id text,\n  photo_url text,\n  created_at timestamp with time zone default timezone('utc'::text, now()),\n  updated_at timestamp with time zone default timezone('utc'::text, now())\n);\n\n-- 3. Enable Public Access policies for quick testing\nalter table public.matches enable row level security;\ncreate policy "Allow read matches" on public.matches for select using (true);\ncreate policy "Allow insert matches" on public.matches for insert with check (true);\ncreate policy "Allow update matches" on public.matches for update using (true);\ncreate policy "Allow delete matches" on public.matches for delete using (true);\n\nalter table public.participants enable row level security;\ncreate policy "Allow read participants" on public.participants for select using (true);\ncreate policy "Allow insert participants" on public.participants for insert with check (true);\ncreate policy "Allow update participants" on public.participants for update using (true);\ncreate policy "Allow delete participants" on public.participants for delete using (true);`;
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
{`-- 1. Create Matches Table
create table if not exists public.matches (
  id text primary key,
  sport_name text not null,
  match_label text,
  team_a text not null,
  team_b text not null,
  score_a integer default 0,
  score_b integer default 0,
  status text check (status in ('Upcoming', 'Live', 'Finished')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Participants Table
create table if not exists public.participants (
  id text primary key,
  name text not null,
  sport_type text not null,
  is_team boolean not null default false,
  team_id text,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable Security/Read-Write for Matches Policy
alter table public.matches enable row level security;
create policy "Allow read matches" on public.matches for select using (true);
create policy "Allow insert matches" on public.matches for insert with check (true);
create policy "Allow update matches" on public.matches for update using (true);
create policy "Allow delete matches" on public.matches for delete using (true);

-- 4. Enable Security/Read-Write for Participants Policy
alter table public.participants enable row level security;
create policy "Allow read participants" on public.participants for select using (true);
create policy "Allow insert participants" on public.participants for insert with check (true);
create policy "Allow update participants" on public.participants for update using (true);
create policy "Allow delete participants" on public.participants for delete using (true);`}
            </pre>
          </div>
        </div>
      </div>

    </div>
  );
}

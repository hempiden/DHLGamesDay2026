import React, { useState } from 'react';
import { Building2, Save, Globe, Mail, Phone, MapPin, Sparkles, CheckCircle, Info, Link, FileText, LayoutGrid } from 'lucide-react';
import { OrganizationInfo } from '../types';
import { getSupabaseClient } from '../supabase';

interface OrganizationSettingsProps {
  organization: OrganizationInfo;
  onUpdateOrganization: (updated: OrganizationInfo) => Promise<void>;
  isSupabaseEnabled: boolean;
  supabaseConnected: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export default function OrganizationSettings({
  organization,
  onUpdateOrganization,
  isSupabaseEnabled,
  supabaseConnected,
  supabaseUrl,
  supabaseAnonKey,
}: OrganizationSettingsProps) {
  const [name, setName] = useState(organization.name);
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl);
  const [slug, setSlug] = useState(organization.slug);
  const [tagline, setTagline] = useState(organization.tagline);
  const [contactEmail, setContactEmail] = useState(organization.contactEmail);
  const [contactPhone, setContactPhone] = useState(organization.contactPhone);
  const [website, setWebsite] = useState(organization.website);
  const [address, setAddress] = useState(organization.address);
  const [footerMotto, setFooterMotto] = useState(organization.footerMotto);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-sanitize slugs to be lowercase letters, digits, and hyphens only
  const handleSlugChange = (value: string) => {
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-') // Replace non-ascii/symbols with hyphens
      .replace(/-+/g, '-'); // Merge multiple hyphens
    setSlug(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      name: name.trim(),
      logoUrl: logoUrl.trim(),
      slug: slug.trim(),
      tagline: tagline.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      website: website.trim(),
      address: address.trim(),
      footerMotto: footerMotto.trim(),
    };

    try {
      await onUpdateOrganization(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save organization settings.');
    } finally {
      setSaving(false);
    }
  };

  const sqlSchema = `
-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR TO CREATE TABLES:
CREATE TABLE IF NOT EXISTS organization_settings (
  id VARCHAR PRIMARY KEY DEFAULT 'current',
  name TEXT NOT NULL,
  logo_url TEXT,
  slug TEXT NOT NULL,
  tagline TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  address TEXT,
  footer_motto TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert fallback organization values
INSERT INTO organization_settings (id, name, logo_url, slug, tagline, contact_email, contact_phone, website, address, footer_motto)
VALUES (
  'current',
  'DHL Express Cambodia',
  'https://logos-world.net/wp-content/uploads/2020/08/DHL-Logo.png',
  'dhl-games',
  'Excellence. Simply delivered.',
  'kh.info@dhl.com',
  '+855 23 999 444',
  'https://www.dhl.com',
  'Phnom Penh, Cambodia',
  'Excellence. Simply delivered.'
) ON CONFLICT (id) DO NOTHING;
  `.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-2xl border border-amber-100 shadow-xs shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide leading-tight">
              កំណត់អង្គភាព & ម៉ាកយីហោ (Organization & Branding)
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Customize the corporate presence, slug identifiers, brand guidelines and footers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 font-bold text-[10px] text-amber-800 uppercase tracking-wide shrink-0">
          🏢 Super Admin Session
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Branding Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              ព័ត៌មានលម្អិតអំពីអង្គភាព (Corporate Identity Form)
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
            {success && (
              <div className="bg-emerald-50 text-emerald-805 p-3 rounded-xl border border-emerald-150 flex items-center gap-2 text-xs font-bold animate-pulse">
                <CheckCircle className="w-4 h-4" />
                <span>បានរក្សាទុកព័ត៌មានដោយជោគជ័យ! Organization configurations saved and synchronized.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Organization Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                  ឈ្មោះអង្គភាព (Organization/Company Name) <strong className="text-red-500">*</strong>
                </label>
                <input
                  type="text"
                  required
                  placeholder="DHL Express Cambodia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                  អត្តសញ្ញាណ Slug (URL Slug / Subdomain ID) <strong className="text-red-500">*</strong>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono font-bold text-gray-400">/org/</span>
                  <input
                    type="text"
                    required
                    placeholder="dhl-games"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                  តំណភ្ជាប់ Logo រូបភាព (Corporate Logo URL)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-[11px]"
                />
              </div>

              {/* Company Slogan / Tagline */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                  ពាក្យស្លោកអង្គភាព (Slogan / Motto / Slogan)
                </label>
                <input
                  type="text"
                  placeholder="Excellence. Simply delivered."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                />
              </div>
            </div>

            {/* Footer motto */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
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
                This text will immediately replace the hardcoded "Excellence. Simply delivered." at the bottom-right of the screen.
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
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    អ៊ីមែលទំនាក់ទំនង (Contact Email Address)
                  </label>
                  <input
                    type="email"
                    placeholder="kh.info@dhl.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    លេខទូរស័ព្ទ (Contact Phone Number)
                  </label>
                  <input
                    type="text"
                    placeholder="+855 23 999 444"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Website URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    គេហទំព័រផ្លូវការ (Official Website Link)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.dhl.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-mono text-[11px]"
                  />
                </div>

                {/* Office address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                    អាសយដ្ឋាន (Headquarters Street Address)
                  </label>
                  <input
                    type="text"
                    placeholder="Phnom Penh, Cambodia"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                  />
                </div>
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
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
            <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
              រូបភាពទំរង់ Preview (Logo & Branding Preview)
            </h4>
            <div className="bg-slate-50 rounded-2xl p-5 border border-gray-200 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name || 'Logo'}
                  className="max-h-16 max-w-full object-contain filter"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://logos-world.net/wp-content/uploads/2020/08/DHL-Logo.png';
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
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-3">
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
                <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {website || 'Not specified'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{address || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Cloud Synchronization Status Info */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-indigo-100 rounded-3xl p-6 shadow-md border border-indigo-950 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-indigo-805">
              <Info className="w-4 h-4 text-indigo-350 shrink-0" />
              <h4 className="text-[10px] font-black uppercase tracking-wider text-white">SUPABASE CLOUD SYNC</h4>
            </div>
            
            <p className="text-[10px] text-indigo-200 leading-relaxed font-bold">
              {isSupabaseEnabled && supabaseConnected ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  ● Cloud database syncing has been verified. Settings are stored live in Supabase.
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5">
                  ◯ Operating on Local Sandbox storage. Credentials not activated yet.
                </span>
              )}
            </p>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('sql-schema-area');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[9px] bg-slate-800 hover:bg-slate-700 text-[#FFCC00] font-black uppercase py-1.5 px-3 rounded-lg flex items-center gap-1 transition"
            >
              <FileText className="w-3 h-3" />
              View SQL Schema Migration Settings
            </button>
          </div>
        </div>
      </div>

      {/* SQL Migration Instruction area */}
      <div id="sql-schema-area" className="bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-900 space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <div>
              <h4 className="text-[11px] font-black uppercase text-slate-300 tracking-wider">
                SUPABASE SQL SCHEMA MIGRATION SCRIPT
              </h4>
              <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                Run this single script in your Supabase SQL Editor if you get a table mismatch or DB integrity alert
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(sqlSchema);
              alert('SQL schema copied to clipboard!');
            }}
            className="px-3 py-1 bg-slate-850 hover:bg-slate-800 text-slate-100 border border-slate-800 text-[10px] font-black uppercase rounded-lg transition"
          >
            Copy SQL
          </button>
        </div>

        <pre className="p-4 bg-slate-900 rounded-2xl text-[9.5px] font-mono text-[#FFCC00] overflow-x-auto whitespace-pre leading-relaxed border border-slate-850 select-all max-h-48 no-scrollbar">
          {sqlSchema}
        </pre>
      </div>

    </div>
  );
}

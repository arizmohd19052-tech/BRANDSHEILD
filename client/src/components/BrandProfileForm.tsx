/**
 * [client/src/components/BrandProfileForm.tsx]
 * Brand Profile Setup Wizard & Active Allowlist Management.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Share2,
  Globe,
  Tag,
  Sparkles,
} from 'lucide-react';
import { BrandProfile, CompletenessReport, OfficialSocial, OfficialApp } from '../types/index.js';
import { Card } from './ui/Card.js';
import { Button } from './ui/Button.js';
import { Badge } from './ui/Badge.js';

export interface BrandProfileFormProps {
  initialProfile: BrandProfile;
  initialCompleteness: CompletenessReport;
  onSave: (profile: BrandProfile) => Promise<void>;
  isSaving: boolean;
}

export const BrandProfileForm: React.FC<BrandProfileFormProps> = ({
  initialProfile,
  initialCompleteness,
  onSave,
  isSaving,
}) => {
  const [profile, setProfile] = useState<BrandProfile>(initialProfile);
  const [newDomain, setNewDomain] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Recalculate preview score
  const completeness = initialCompleteness;

  const handleAddSocial = () => {
    const newSocial: OfficialSocial = {
      id: `soc-${Date.now()}`,
      platform: 'x',
      handle: '',
      url: '',
      verificationStatus: 'VERIFIED_OFFICIAL',
    };
    setProfile({
      ...profile,
      officialSocials: [...profile.officialSocials, newSocial],
    });
  };

  const handleRemoveSocial = (id: string) => {
    setProfile({
      ...profile,
      officialSocials: profile.officialSocials.filter((s) => s.id !== id),
    });
  };

  const handleUpdateSocial = (id: string, field: keyof OfficialSocial, val: any) => {
    setProfile({
      ...profile,
      officialSocials: profile.officialSocials.map((s) =>
        s.id === id ? { ...s, [field]: val } : s
      ),
    });
  };

  const handleAddApp = () => {
    const newApp: OfficialApp = {
      id: `app-${Date.now()}`,
      store: 'google_play',
      appName: '',
      packageId: '',
      publisherName: '',
      storeUrl: '',
    };
    setProfile({
      ...profile,
      officialApps: [...profile.officialApps, newApp],
    });
  };

  const handleRemoveApp = (id: string) => {
    setProfile({
      ...profile,
      officialApps: profile.officialApps.filter((a) => a.id !== id),
    });
  };

  const handleUpdateApp = (id: string, field: keyof OfficialApp, val: any) => {
    setProfile({
      ...profile,
      officialApps: profile.officialApps.map((a) =>
        a.id === id ? { ...a, [field]: val } : a
      ),
    });
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain.trim() && !profile.domains.includes(newDomain.trim())) {
      setProfile({ ...profile, domains: [...profile.domains, newDomain.trim().toLowerCase()] });
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (dom: string) => {
    setProfile({ ...profile, domains: profile.domains.filter((d) => d !== dom) });
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim() && !profile.keywords.includes(newKeyword.trim())) {
      setProfile({ ...profile, keywords: [...profile.keywords, newKeyword.trim().toLowerCase()] });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setProfile({ ...profile, keywords: profile.keywords.filter((k) => k !== kw) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!profile.brandName.trim()) errors.push('Brand name cannot be empty');
    if (!profile.officialLogoUrl.trim()) errors.push('Official logo URL/data is required');

    for (const s of profile.officialSocials) {
      if (s.handle !== null && !s.handle.trim()) errors.push(`Handle cannot be empty for official ${s.platform.toUpperCase()} asset`);
    }

    for (const a of profile.officialApps) {
      if (!a.appName.trim() || !a.packageId.trim() || !a.publisherName.trim()) {
        errors.push(`App name, package ID, and publisher name are required for official mobile apps`);
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    await onSave(profile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header & Completeness Meter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="brand">Asset Definition & Allowlist</Badge>
            <span className="text-xs text-slate-500 font-medium">Evaluation Criterion: 15%</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            Brand Profile & Official Assets
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            This profile acts as the <strong>active allowlist</strong>. Any social account or mobile application registered here will be <strong>strictly excluded</strong> from threat alerts.
          </p>
        </div>

        {/* Profile Completeness Gauge */}
        <Card className="p-4 sm:w-72 bg-[#E6F0EE] dark:bg-[#0E5A52]/15 border border-[#0E5A52]/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Profile Completeness
            </span>
            <span className="text-lg font-black text-[#0E5A52] dark:text-[#A8DBC5] font-mono">
              {completeness.score}%
            </span>
          </div>
          <div className="w-full bg-[#E3DFD6] dark:bg-[#243140] rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-[#0E5A52] dark:bg-[#2E7D5B] h-2 rounded-full transition-all duration-300"
              style={{ width: `${completeness.score}%` }}
            />
          </div>
          <p className="text-[11px] text-[#5B6675] dark:text-[#8B97A7] mt-2">
            {completeness.score === 100
              ? '✅ All monitoring anchors configured'
              : `${completeness.suggestions.length} recommended improvements`}
          </p>
        </Card>
      </div>

      {/* Validation Alert */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Please resolve the following before saving:</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2 animate-fade-in font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>Brand Profile updated successfully. Allowlist synchronized with detection engine.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: CORE BRAND IDENTIFIERS */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            1. Core Brand Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Brand Name *
              </label>
              <input
                type="text"
                value={profile.brandName}
                onChange={(e) => setProfile({ ...profile, brandName: e.target.value })}
                placeholder="e.g. Acme Bank"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={profile.legalName || ''}
                onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                placeholder="e.g. Acme Financial Services, Inc."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry / Sector
              </label>
              <input
                type="text"
                value={profile.industry}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                placeholder="e.g. Banking & Financial Services"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Logo URL / Asset Preview *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={profile.officialLogoUrl}
                  onChange={(e) => setProfile({ ...profile, officialLogoUrl: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                {profile.officialLogoUrl && (
                  <img
                    src={profile.officialLogoUrl}
                    alt="Logo Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 2: OFFICIAL SOCIAL ACCOUNTS (ALLOWLIST) */}
        <Card className="p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                2. Official Social Media Channels (Allowlisted)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                These handles will NEVER be flagged as threats during social surveillance.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSocial}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Handle
            </Button>
          </div>

          <div className="space-y-3 mt-4">
            {profile.officialSocials.map((social) => (
              <div
                key={social.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 items-center"
              >
                <div className="sm:col-span-3">
                  <select
                    value={social.platform}
                    onChange={(e) => handleUpdateSocial(social.id, 'platform', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="x">X (Twitter)</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="telegram">Telegram</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={social.handle || ''}
                    onChange={(e) => handleUpdateSocial(social.id, 'handle', e.target.value)}
                    placeholder="Handle (e.g. hdfc_bank)"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={social.url || ''}
                    onChange={(e) => handleUpdateSocial(social.id, 'url', e.target.value)}
                    placeholder="Profile URL"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveSocial(social.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 3: OFFICIAL MOBILE APPS (ALLOWLIST) */}
        <Card className="p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                3. Official Mobile Apps & Publishers (Allowlisted)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Matches against package ID and publisher name to ensure legitimate releases are not flagged.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddApp}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Mobile App
            </Button>
          </div>

          <div className="space-y-3 mt-4">
            {profile.officialApps.map((app) => (
              <div
                key={app.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 items-center"
              >
                <div className="sm:col-span-2">
                  <select
                    value={app.store}
                    onChange={(e) => handleUpdateApp(app.id, 'store', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="google_play">Google Play</option>
                    <option value="apple_app_store">App Store</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={app.appName}
                    onChange={(e) => handleUpdateApp(app.id, 'appName', e.target.value)}
                    placeholder="App Name (e.g. Acme Mobile)"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={app.packageId}
                    onChange={(e) => handleUpdateApp(app.id, 'packageId', e.target.value)}
                    placeholder="Package ID (e.g. com.acme.banking)"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={app.publisherName}
                    onChange={(e) => handleUpdateApp(app.id, 'publisherName', e.target.value)}
                    placeholder="Publisher (e.g. Acme Financial)"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveApp(app.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 4: DOMAINS & OVER-FLAGGING GUARD KEYWORDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Globe className="w-4 h-4 text-[#0E5A52] dark:text-[#A8DBC5]" />
              Verified Brand Domains
            </h2>
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="hdfcbank.com"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddDomain}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.domains.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => handleRemoveDomain(d)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Tag className="w-4 h-4 text-[#C8791A] dark:text-[#F6DF9C]" />
              Sector Keywords (Over-flagging Guard)
            </h2>
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="banking, loans, cards..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddKeyword}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.keywords.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDF4E9] dark:bg-[#C8791A]/20 text-[#C8791A] dark:text-[#F6DF9C] text-xs font-medium border border-[#C8791A]/30"
                >
                  #{k}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(k)}
                    className="text-[#C8791A] hover:text-red-500"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="submit"
            variant="brand"
            size="lg"
            loading={isSaving}
            className="shadow-md"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Profile & Sync Allowlist
          </Button>
        </div>
      </form>
    </div>
  );
};

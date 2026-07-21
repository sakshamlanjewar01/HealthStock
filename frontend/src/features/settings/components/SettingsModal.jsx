import React from 'react';
import { Settings, Shield, Lock } from 'lucide-react';
import { useSettingsForm } from '../hooks/useSettingsForm';
import CaregiverEmailCard   from './CaregiverEmailCard';
import PhoneNumberCard      from './PhoneNumberCard';
import AccessibilityCard    from './AccessibilityCard';
import DangerZoneCard       from './DangerZoneCard';

/**
 * SettingsModal
 * -------------
 * Renders the full "Patient Profile & Preferences" panel.
 * Consumed inside the shared modal shell in App.jsx.
 *
 * Props:
 *   onClose  — callback to close the parent modal
 */
export default function SettingsModal({ onClose }) {
  const {
    caregiverEmail,    setCaregiverEmail,
    notificationPref,  setNotificationPref,
    largeTextEnabled,  setLargeTextEnabled,
    userPhone,         setUserPhone,
    saveSettings,
    isSaving,
  } = useSettingsForm();

  const handleSave = async () => {
    try {
      await saveSettings();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to update preferences');
    }
  };

  return (
    <div className="settings-modal text-left">
      {/* ── Header ── */}
      <div className="p-3.5 sm:p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-center gap-3.5 mb-3 pr-12 text-left">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #0B53FA/10 0%, #e0e7ff 100%)' }}
        >
          <Settings className="w-5 h-5 text-[#0B53FA]" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-[#0F2F57] tracking-tight leading-tight">
            Patient Profile &amp; Preferences
          </h3>
          <p className="text-[11px] text-[#4B6B8B] font-medium mt-0.5">
            Configure caregivers, typography size, and system alerts
          </p>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="space-y-2.5 pt-1 pb-1">

        <CaregiverEmailCard
          value={caregiverEmail}
          onChange={setCaregiverEmail}
        />

        <PhoneNumberCard
          value={userPhone}
          onChange={setUserPhone}
        />

        <AccessibilityCard
          enabled={largeTextEnabled}
          onToggle={() => setLargeTextEnabled((prev) => !prev)}
        />

        <DangerZoneCard />

        {/* ── Sync banner ── */}
        <div
          className="flex items-center gap-2.5 rounded-xl p-2.5"
          style={{
            background: '#EEF2FF',
            border: '1px solid #C7D2FE',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: '#3B5BDB' }}
          >
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500, lineHeight: 1.4 }}>
            Preferred preferences are synced directly with your secure medical user profile.
          </span>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-end gap-3 pt-3 mt-3 border-t border-slate-100/80">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0B53FA] hover:bg-[#0944CD] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#0B53FA]/20 active:scale-95 disabled:opacity-50"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
}

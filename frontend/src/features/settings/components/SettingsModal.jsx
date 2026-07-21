import React from 'react';
import { Settings, Shield, Lock } from 'lucide-react';
import { useSettingsForm } from '../hooks/useSettingsForm';
import CaregiverEmailCard   from './CaregiverEmailCard';
import PhoneNumberCard      from './PhoneNumberCard';
import AlertPreferenceCard  from './AlertPreferenceCard';
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
      <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}
        >
          <Settings className="w-7 h-7" style={{ color: '#4F46E5' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            Patient Profile &amp; Preferences
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
            Configure caregivers, typography size, and system alerts
          </p>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="space-y-3 pt-4 pb-4">

        <CaregiverEmailCard
          value={caregiverEmail}
          onChange={setCaregiverEmail}
        />

        <PhoneNumberCard
          value={userPhone}
          onChange={setUserPhone}
        />

        <AlertPreferenceCard
          value={notificationPref}
          onChange={setNotificationPref}
        />

        <AccessibilityCard
          enabled={largeTextEnabled}
          onToggle={() => setLargeTextEnabled((prev) => !prev)}
        />

        <DangerZoneCard />

        {/* ── Sync banner ── */}
        <div
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{
            background: '#EEF2FF',
            border: '1px solid #C7D2FE',
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#3B5BDB' }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>
            Preferred preferences are synced directly with your secure medical user profile.
          </span>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
        <button
          onClick={onClose}
          className="settings-cancel-btn"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="settings-save-btn"
        >
          <Lock className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

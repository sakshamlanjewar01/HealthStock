import React from 'react';
import { Bell } from 'lucide-react';

const PREFERENCE_OPTIONS = [
  { value: 'Email',    label: 'Email Alerts'   },
  { value: 'Push',     label: 'Push Alerts'    },
  { value: 'SMS',      label: 'SMS Alerts'     },
  { value: 'WhatsApp', label: 'WhatsApp Alerts'},
  { value: 'Both',     label: 'Email + Push'   },
  { value: 'None',     label: 'None (Mute)'    },
];

/**
 * AlertPreferenceCard
 * Dropdown to select how the patient receives notifications.
 */
export default function AlertPreferenceCard({ value, onChange }) {
  return (
    <div className="settings-card">
      {/* Left: icon + label + description */}
      <div className="settings-card-left">
        <div className="settings-icon-box" style={{ background: '#ECFDF5' }}>
          <Bell className="w-5 h-5" style={{ color: '#10B981' }} />
        </div>
        <div>
          <h4 className="settings-card-title">Patient Alert Preference</h4>
          <p className="settings-card-desc">Choose how you want to be notified</p>
        </div>
      </div>

      {/* Right: dropdown */}
      <div className="settings-select-wrap">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="settings-select"
        >
          {PREFERENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg className="settings-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

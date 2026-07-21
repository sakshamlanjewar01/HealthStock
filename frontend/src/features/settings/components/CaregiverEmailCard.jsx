import React from 'react';
import { Mail } from 'lucide-react';

/**
 * CaregiverEmailCard
 * Allows the user to set an email address that receives dose-missed alerts.
 */
export default function CaregiverEmailCard({ value, onChange }) {
  return (
    <div className="settings-card">
      {/* Left: icon + label + description */}
      <div className="settings-card-left">
        <div className="settings-icon-box" style={{ background: '#EEF2FF' }}>
          <Mail className="w-5 h-5" style={{ color: '#3B5BDB' }} />
        </div>
        <div>
          <h4 className="settings-card-title">Caregiver Alert Email</h4>
          <p className="settings-card-desc">Email address to receive alerts</p>
        </div>
      </div>

      {/* Right: input */}
      <div className="settings-input-wrap">
        <Mail className="w-4 h-4 settings-input-icon" />
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="caregiver@email.com"
          className="settings-input"
        />
      </div>
    </div>
  );
}

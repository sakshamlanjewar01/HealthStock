import React from 'react';
import { useConfirm } from '../../../context/ConfirmContext';
import { resetUserData } from '../../../services/dataService';

/**
 * DangerZoneCard
 * Provides destructive actions: full data reset.
 * Each action requires an explicit confirmation step.
 */
export default function DangerZoneCard() {
  const confirm = useConfirm();

  const handleReset = async () => {
    const confirmed = await confirm(
      'Are you absolutely sure you want to delete all your medications and compliance history? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const success = await resetUserData();
      if (success) {
        alert('Account data reset successfully!');
        window.location.reload();
      } else {
        alert('Failed to reset data');
      }
    } catch (err) {
      alert('Error resetting data: ' + err.message);
    }
  };

  return (
    <div className="settings-card">
      {/* Left: icon + label + description */}
      <div className="settings-card-left">
        <div className="settings-icon-box" style={{ background: '#FFF1F2' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
        <div>
          <h4 className="settings-card-title">Danger Zone</h4>
          <p className="settings-card-desc" style={{ maxWidth: '200px', lineHeight: 1.5 }}>
            Permanently delete all your custom<br />medications and logs.
          </p>
        </div>
      </div>

      {/* Right: reset button */}
      <button
        onClick={handleReset}
        className="settings-danger-btn"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Reset Data
      </button>
    </div>
  );
}

import React from 'react';

/**
 * AccessibilityCard
 * Toggle switch to enable large-text mode across the application.
 */
export default function AccessibilityCard({ enabled, onToggle }) {
  return (
    <div className="settings-card">
      {/* Left: icon + label + description */}
      <div className="settings-card-left">
        <div className="settings-icon-box" style={{ background: '#F5F3FF' }}>
          <span style={{
            fontSize: '18px',
            fontWeight: 900,
            color: '#7C3AED',
            lineHeight: 1,
            fontFamily: 'inherit',
          }}>Aa</span>
        </div>
        <div>
          <h4 className="settings-card-title">Accessibility Large Text</h4>
          <p className="settings-card-desc" style={{ maxWidth: '200px', lineHeight: 1.5 }}>
            Scale up layout typography size<br />for easier readability.
          </p>
        </div>
      </div>

      {/* Right: toggle switch */}
      <label className="settings-toggle" aria-label="Toggle large text">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
        <span
          className="settings-toggle-track"
          style={{
            background: enabled ? '#3B5BDB' : '#CBD5E1',
          }}
        >
          <span
            className="settings-toggle-thumb"
            style={{
              transform: enabled ? 'translateX(24px)' : 'translateX(2px)',
            }}
          />
        </span>
      </label>
    </div>
  );
}

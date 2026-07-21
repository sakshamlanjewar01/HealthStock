import React from 'react';

/** Derives the display-formatted value (XXXXX XXXXX) from a +91XXXXXXXXXX string */
function formatDisplay(rawPhone) {
  const digits = rawPhone.replace(/\D/g, '').replace(/^91/, '').slice(0, 10);
  if (digits.length > 5) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return digits;
}

/** Checks if the 10-digit Indian mobile number is valid */
function isValidIndianMobile(rawPhone) {
  const digits = rawPhone.replace(/\D/g, '').replace(/^91/, '');
  return digits.length === 10 && /^[6-9]/.test(digits);
}

/**
 * PhoneNumberCard
 * India-specific phone number input with:
 *   - Fixed 🇮🇳 +91 prefix
 *   - Auto-formatted display (XXXXX XXXXX)
 *   - Live validation icon (✓ / ✗)
 *   - Saves value in E.164 format (+91XXXXXXXXXX)
 */
export default function PhoneNumberCard({ value, onChange }) {
  const digits = value.replace(/\D/g, '').replace(/^91/, '');

  const handleChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(cleaned ? `+91${cleaned}` : '');
  };

  return (
    <div className="settings-card">
      {/* Left: icon + label + description */}
      <div className="settings-card-left">
        <div className="settings-icon-box" style={{ background: '#FFF7ED' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <path d="M12 18h.01" />
          </svg>
        </div>
        <div>
          <h4 className="settings-card-title">Indian Mobile Number</h4>
          <p className="settings-card-desc">Mobile number for SMS alerts</p>
        </div>
      </div>

      {/* Right: phone input */}
      <div className="settings-phone-wrap">
        {/* Country prefix */}
        <div className="settings-phone-prefix">
          <span>IN</span>
          <span>+91</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={11}
          value={formatDisplay(value)}
          onChange={handleChange}
          placeholder="98765 43210"
          className="settings-phone-input"
        />
        {/* Validation icon */}
        {digits.length > 0 && (
          isValidIndianMobile(value) ? (
            <div className="settings-valid-badge" style={{ background: '#10B981' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <div className="settings-valid-badge" style={{ background: '#EF4444' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          )
        )}
      </div>
    </div>
  );
}

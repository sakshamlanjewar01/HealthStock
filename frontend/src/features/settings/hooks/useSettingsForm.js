/**
 * useSettingsForm
 * ---------------
 * Owns all local state and save logic for the Settings modal.
 * Extracted from App.jsx to follow the single-responsibility principle.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { registerPush, unsubscribePush } from '../../../services/webPushHelper';
import { API_URL, VAPID_PUBLIC_KEY } from '../../../config';

export function useSettingsForm() {
  const { user, updateProfile } = useAuth();

  const [caregiverEmail, setCaregiverEmail]     = useState(() => user?.caregiverEmail || localStorage.getItem('hs_caregiverEmail') || '');
  const [notificationPref, setNotificationPref] = useState(() => user?.notificationPreference || localStorage.getItem('hs_notificationPref') || 'Email');
  const [largeTextEnabled, setLargeTextEnabled] = useState(() => user?.accessibilityLargeText || localStorage.getItem('hs_accessibilityLargeText') === 'true');
  const [userPhone, setUserPhone]               = useState(() => user?.phoneNumber || localStorage.getItem('hs_userPhone') || '');
  const [isSaving, setIsSaving]                 = useState(false);

  // Sync local form state whenever the authenticated user or local storage changes
  useEffect(() => {
    const savedEmail = user?.caregiverEmail || localStorage.getItem('hs_caregiverEmail') || '';
    const savedPref = user?.notificationPreference || localStorage.getItem('hs_notificationPref') || 'Email';
    const savedLargeText = user?.accessibilityLargeText ?? (localStorage.getItem('hs_accessibilityLargeText') === 'true');
    const savedPhone = user?.phoneNumber || localStorage.getItem('hs_userPhone') || '';

    setCaregiverEmail(savedEmail);
    setNotificationPref(savedPref);
    setLargeTextEnabled(savedLargeText);
    setUserPhone(savedPhone);
  }, [user]);

  /**
   * Persist all preferences to the backend & localStorage.
   */
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      if (notificationPref === 'Push' || notificationPref === 'Both') {
        await registerPush(`${API_URL}/data`, VAPID_PUBLIC_KEY);
      } else {
        await unsubscribePush(`${API_URL}/data`);
      }

      // Persist locally for immediate offline/reload resilience
      localStorage.setItem('hs_caregiverEmail', caregiverEmail);
      localStorage.setItem('hs_userPhone', userPhone);
      localStorage.setItem('hs_notificationPref', notificationPref);
      localStorage.setItem('hs_accessibilityLargeText', String(largeTextEnabled));

      await updateProfile({
        caregiverEmail,
        notificationPreference: notificationPref,
        accessibilityLargeText: largeTextEnabled,
        phoneNumber: userPhone,
      });

      return true;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    caregiverEmail,    setCaregiverEmail,
    notificationPref,  setNotificationPref,
    largeTextEnabled,  setLargeTextEnabled,
    userPhone,         setUserPhone,
    saveSettings,
    isSaving,
  };
}

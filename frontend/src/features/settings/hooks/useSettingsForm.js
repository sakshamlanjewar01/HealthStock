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

  const [caregiverEmail, setCaregiverEmail]     = useState('');
  const [notificationPref, setNotificationPref] = useState('Email');
  const [largeTextEnabled, setLargeTextEnabled] = useState(false);
  const [userPhone, setUserPhone]               = useState('');
  const [isSaving, setIsSaving]                 = useState(false);

  // Sync local form state whenever the authenticated user changes
  useEffect(() => {
    if (user) {
      setCaregiverEmail(user.caregiverEmail || '');
      setNotificationPref(user.notificationPreference || 'Email');
      setLargeTextEnabled(user.accessibilityLargeText || false);
      setUserPhone(user.phoneNumber || '');
    }
  }, [user]);

  /**
   * Persist all preferences to the backend.
   * Returns true on success, throws on failure.
   */
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      if (notificationPref === 'Push' || notificationPref === 'Both') {
        await registerPush(`${API_URL}/data`, VAPID_PUBLIC_KEY);
      } else {
        await unsubscribePush(`${API_URL}/data`);
      }

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

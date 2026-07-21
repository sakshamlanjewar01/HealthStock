import { API_URL } from '../config.js';
const DATA_URL = `${API_URL}/data`;

const fetchOptions = (method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return options;
};

export const getMedicines = async () => {
  try {
    const res = await fetch(`${DATA_URL}/medicines`, fetchOptions());
    const data = await res.json();
    return data.medicines || [];
  } catch (error) {
    console.error('getMedicines API error:', error);
    return [];
  }
};

export const updateMedicine = async (med) => {
  const res = await fetch(`${DATA_URL}/medicines/${med._id || med.id}`, fetchOptions('PUT', med));
  const data = await res.json();
  if (!res.ok) {
    throw data;
  }
  return data.medicine;
};

export const addMedicine = async (newMed) => {
  const res = await fetch(`${DATA_URL}/medicines`, fetchOptions('POST', newMed));
  const data = await res.json();
  if (!res.ok) {
    throw data;
  }
  return data.medicine;
};

export const deleteMedicine = async (id) => {
  try {
    await fetch(`${DATA_URL}/medicines/${id}`, fetchOptions('DELETE'));
  } catch (error) {
    console.error('deleteMedicine API error:', error);
  }
};

export const getAdherenceLogs = async () => {
  try {
    const res = await fetch(`${DATA_URL}/logs`, fetchOptions());
    const data = await res.json();
    return data.logs || [];
  } catch (error) {
    console.error('getAdherenceLogs API error:', error);
    return [];
  }
};

export const addAdherenceLog = async (log) => {
  try {
    const res = await fetch(`${DATA_URL}/logs`, fetchOptions('POST', log));
    const data = await res.json();
    return data.log;
  } catch (error) {
    console.error('addAdherenceLog API error:', error);
  }
};

export const updateAdherenceLog = async (logId, status) => {
  try {
    const res = await fetch(`${DATA_URL}/logs/${logId}`, fetchOptions('PUT', { status }));
    const data = await res.json();
    return data.log;
  } catch (error) {
    console.error('updateAdherenceLog API error:', error);
  }
};

export const deleteAdherenceLog = async (logId) => {
  try {
    const res = await fetch(`${DATA_URL}/logs/${logId}`, fetchOptions('DELETE'));
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('deleteAdherenceLog API error:', error);
    return false;
  }
};

export const requestPharmacyRefill = async (requestData) => {
  try {
    const res = await fetch(`${DATA_URL}/pharmacy-requests`, fetchOptions('POST', requestData));
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('requestPharmacyRefill API error:', error);
    return false;
  }
};

export const snoozeMedicine = async (id) => {
  try {
    const res = await fetch(`${DATA_URL}/medicines/${id}/snooze`, fetchOptions('POST'));
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('snoozeMedicine API error:', error);
    return false;
  }
};



export const getAnalytics = async () => {
  try {
    const offset = new Date().getTimezoneOffset();
    const res = await fetch(`${DATA_URL}/analytics?timezoneOffset=${offset}`, fetchOptions());
    const data = await res.json();
    return data.analytics;
  } catch (error) {
    console.error('getAnalytics API error:', error);
    return null;
  }
};

export const resetUserData = async () => {
  try {
    const res = await fetch(`${DATA_URL}/reset`, fetchOptions('POST'));
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('resetUserData service error:', error);
    return false;
  }
};

export const getRefills = (medicinesList = []) => {
  const refills = [];
  medicinesList.forEach(med => {
    const dailyUsage = med.dosesPerDay || 1;
    const estimatedDaysLeft = Math.round(med.currentQuantity / dailyUsage);

    let priority = "Low";
    let status = "Good";

    const threshold = med.refillThreshold !== undefined ? med.refillThreshold : 5;

    if (med.currentQuantity <= 0) {
      priority = "Critical";
      status = "Out of Stock";
    } else if (med.currentQuantity < threshold) {
      priority = "High";
      status = "Urgent Refill Required";
    } else if (estimatedDaysLeft < 7) {
      priority = "Medium";
      status = "Refill Recommended";
    }

    refills.push({
      id: `refill-${med._id || med.id}`,
      medicineId: med._id || med.id,
      medicineName: med.name,
      remainingQuantity: med.currentQuantity,
      estimatedDaysLeft,
      priority,
      status,
      unit: med.unit
    });
  });
  return refills;
};

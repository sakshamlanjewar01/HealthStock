import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMedicines, getAdherenceLogs } from '../services/dataService';

const HealthStoreContext = createContext(null);

export function HealthStoreProvider({ children }) {
  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const [meds, adherenceLogs] = await Promise.all([
        getMedicines(),
        getAdherenceLogs()
      ]);
      setMedicines(meds || []);
      setLogs(adherenceLogs || []);
    } catch (error) {
      console.error('Failed to fetch store data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  const value = {
    medicines,
    setMedicines,
    logs,
    setLogs,
    activeTab,
    setActiveTab,
    loading,
    refreshData: fetchStoreData
  };

  return (
    <HealthStoreContext.Provider value={value}>
      {children}
    </HealthStoreContext.Provider>
  );
}

export function useHealthStore() {
  const context = useContext(HealthStoreContext);
  if (!context) {
    throw new Error('useHealthStore must be used within a HealthStoreProvider');
  }
  return context;
}

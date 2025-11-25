import React, { createContext, useContext, useEffect, useState } from 'react';

const ApiSettingsContext = createContext(null);

export function ApiSettingsProvider({ children }) {
  const [settings, setSettings] = useState({ apis: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/api-settings').then(r => r.json()).then(j => {
      if (j.ok && j.settings) setSettings(j.settings);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  async function saveSettings(newSettings) {
    const res = await fetch('/api/api-settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: newSettings })
    });
    if (!res.ok) throw new Error('save failed');
    setSettings(newSettings);
    return await res.json();
  }

  async function testApi(config) {
    const res = await fetch('/api/api-settings/test', {
      method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ config })
    });
    return res.json();
  }

  return (
    <ApiSettingsContext.Provider value={{ settings, saveSettings, testApi, loading }}>
      {children}
    </ApiSettingsContext.Provider>
  );
}

export function useApiSettings() {
  const ctx = useContext(ApiSettingsContext);
  if (!ctx) throw new Error('useApiSettings must be used inside provider');
  return ctx;
}

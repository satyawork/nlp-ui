// src/components/CollectionsDropdown.jsx
import React from 'react';

export default function CollectionsDropdown({ apiUrl, value, onChange, includeNone = true }) {
  // This component expects parent to fetch and pass collections (we also fetch in ChatInput),
  // but to keep it self-contained we will fetch here too on mount so it can be reused.
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchCollections() {
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setItems(data);
      } catch (e) {
        console.warn('CollectionsDropdown fetch error', e);
        if (!cancelled) setItems([]);
      }
    }
    fetchCollections();
    return () => { cancelled = true; };
  }, [apiUrl]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="collection-select"
      aria-label="Select collection"
    >
      {includeNone && <option value="none">No collection</option>}
      {items.map((it) => (
        <option key={it} value={it}>{it}</option>
      ))}
    </select>
  );
}

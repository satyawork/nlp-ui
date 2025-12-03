import React, { useEffect, useState, useRef } from 'react';

export default function CollectionsDropdown({
  apiUrl = '/collections',
  value,
  onChange,
  includeNone = true,
}) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  async function fetchCollections() {
    // Abort previous request if any
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(String(err));
        setCollections([]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    // initial load
    fetchCollections();
    // cleanup abort on unmount
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [apiUrl]);

  const handleFocusOrClick = () => {
    // refresh when dropdown receives focus / user clicks it
    fetchCollections();
  };

  return (
    <div className="collection-dropdown-wrap">
      <select
        className="collection-dropdown"
        value={value ?? 'none'}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={handleFocusOrClick}
        onClick={handleFocusOrClick}
        aria-label="Select collection"
      >
        {includeNone && <option value="none">none</option>}
        {loading && <option value="loading">Loading...</option>}
        {!loading && error && <option value="none">Error loading</option>}
        {!loading && !error && collections.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

    </div>
  );
}

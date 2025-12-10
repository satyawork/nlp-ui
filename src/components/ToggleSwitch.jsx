import React from 'react';

export default function ToggleSwitch({ checked = false, onChange }) {
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
      />
      <span className="slider" />
    </label>
  );
}

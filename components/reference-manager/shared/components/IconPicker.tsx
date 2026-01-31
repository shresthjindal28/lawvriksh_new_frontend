'use client';

import { SafeDynamicIcon } from './SafeDynamicIcon';
import { useState } from 'react';
import '@/styles/reference-manager/icon.css';
import { allIconNames } from '@/lib/config/referenceManagerConfig';

export function IconPicker({ onPick }: { onPick: (iconName: string) => void }) {
  const [search, setSearch] = useState('');

  const filtered = allIconNames.filter((n) => n.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="icon-picker-container">
      <input
        className="icon-picker-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search icons..."
      />

      <div className="icon-picker-label">All Icons</div>

      <div className="icon-picker-grid" role="list">
        {filtered.map((name) => (
          <div key={name} className="icon-picker-item" title={name} onClick={() => onPick(name)}>
            <SafeDynamicIcon name={name} size={18} />
            <span className="iconName">{name}</span>
          </div>
        ))}
      </div>

      <div className="icon-picker-footer">Select an icon…</div>
    </div>
  );
}

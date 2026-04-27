import { useState } from 'react';
import { useApp } from '../store';
import { FILTER_OPTIONS } from '../constants';

export function FilterPanel() {
  const [open, setOpen] = useState(true);
  const filter = useApp(s => s.filter);
  const setFilter = useApp(s => s.setFilter);

  return (
    <section className="filter-panel">
      <div className="filter-toggle">
        <button onClick={() => setOpen(o => !o)}>
          유닛 스킬 필터 {open ? '▲' : '▼'}
        </button>
      </div>
      {open && (
        <div className="filter-grid-wrapper">
          <div className="filter-hint">* 이름순으로 정렬 (→ 방향)</div>
          <div className="filter-grid">
            {FILTER_OPTIONS.map(opt => (
              <label
                key={opt.key}
                className={`filter-option ${filter === opt.key ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="helper-unit-filter"
                  value={opt.key}
                  checked={filter === opt.key}
                  onChange={() => setFilter(opt.key)}
                />
                <span>
                  {opt.label}
                  {opt.alias && (
                    <span className="filter-alias"> ({opt.alias})</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

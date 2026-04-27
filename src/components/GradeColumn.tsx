import { useMemo, useState } from 'react';
import { unitsByLevel } from '../data';
import { GRADE_COLORS } from '../constants';
import { useApp } from '../store';
import { UnitRow } from './UnitRow';
import { progressFor } from '../calc';
import type { ProgressResult } from '../calc';
import type { FilterKey } from '../types';

interface Props {
  level: number;
  gradeName: string;
  collapsedByDefault?: boolean;
}

function unitMatchesFilter(
  unit: ReturnType<typeof unitsByLevel>[number],
  filter: FilterKey
): boolean {
  if (filter === 'all') return true;
  if (filter === 'singlelost') return false; // 데이터에 해당 속성 없음
  return !!unit.flags[filter];
}

export function GradeColumn({ level, gradeName, collapsedByDefault }: Props) {
  const [collapsed, setCollapsed] = useState(!!collapsedByDefault);
  const filter = useApp(s => s.filter);
  const deck = useApp(s => s.deck);

  const units = useMemo(
    () => unitsByLevel(level).filter(u => unitMatchesFilter(u, filter)),
    [level, filter]
  );

  // 같은 등급 안의 모든 유닛에 대한 진행률을 한 번에 계산해 메모
  const progressMap = useMemo<Record<number, ProgressResult>>(() => {
    if (collapsed) return {};
    const m: Record<number, ProgressResult> = {};
    for (const u of units) m[u.id] = progressFor(u.id, deck);
    return m;
  }, [units, deck, collapsed]);

  const totalCount = units.reduce((sum, u) => sum + (deck[u.id] ?? 0), 0);
  const color = GRADE_COLORS[level];

  return (
    <div className="grade-col">
      <div
        className="grade-col-header"
        style={{
          background: color?.bg ?? '#888',
          color: color?.text ?? '#fff',
        }}
      >
        <span className="grade-name">{gradeName}</span>
        <span className="grade-count">({totalCount})</span>
        <button
          className="icon"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            marginLeft: 'auto',
            padding: 0,
          }}
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? '펼치기' : '접기'}
        >
          {collapsed ? '▼' : '▲'}
        </button>
      </div>
      {!collapsed && (
        <table className="unit-table">
          <tbody>
            {units.length === 0 && (
              <tr>
                <td className="empty-msg" colSpan={4}>
                  필터 결과 없음
                </td>
              </tr>
            )}
            {units.map(u => (
              <UnitRow
                key={u.id}
                unit={u}
                count={deck[u.id] ?? 0}
                progress={
                  (u.level ?? 0) > 1 ? progressMap[u.id] ?? null : null
                }
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

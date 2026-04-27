import { useApp } from '../store';
import { getUnit, META } from '../data';
import type { FlagKey } from '../types';

export function SkillSummary() {
  const deck = useApp(s => s.deck);

  // mate / 스킬 합산
  const totals = {
    magic: 0,
    physical: 0,
    story: 0,
  };
  const skillTotals = {} as Record<FlagKey, number>;
  for (const k of META.flagKeys) skillTotals[k] = 0;

  for (const [idStr, count] of Object.entries(deck)) {
    const u = getUnit(parseInt(idStr, 10));
    if (!u) continue;
    totals.magic += u.mate.magic * count;
    totals.physical += u.mate.physical * count;
    totals.story += u.mate.story * count;
    for (const k of META.flagKeys) {
      if (u.flags[k]) skillTotals[k] += count;
    }
  }

  const activeSkills = META.flagKeys
    .filter(k => skillTotals[k] > 0)
    .map(k => ({ key: k, label: META.flagDictionary[k], count: skillTotals[k] }));

  const empty =
    totals.magic === 0 &&
    totals.physical === 0 &&
    totals.story === 0 &&
    activeSkills.length === 0;

  return (
    <aside className="skill-summary">
      <h3>현재 패 합산</h3>
      {empty ? (
        <div className="skill-summary-empty">
          유닛을 추가하면 합산 정보가 나타납니다.
        </div>
      ) : (
        <>
          <div className="mate-row">
            <div className="mate-cell mate-magic">
              <span className="mate-label">마법 좋아요</span>
              <span className="mate-val">{totals.magic}</span>
            </div>
            <div className="mate-cell mate-phys">
              <span className="mate-label">물리 좋아요</span>
              <span className="mate-val">{totals.physical}</span>
            </div>
            <div className="mate-cell mate-story">
              <span className="mate-label">스토리 좋아요</span>
              <span className="mate-val">{totals.story}</span>
            </div>
          </div>
          {activeSkills.length > 0 && (
            <ul className="skill-list">
              {activeSkills.map(s => (
                <li key={s.key}>
                  <span className="skill-name">{s.label}</span>
                  <span className="skill-count">×{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}

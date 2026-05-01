import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store';
import { getRecipe, getUnit, META, UNITS } from '../data';
import { deficitFor } from '../calc';
import { profileDeck, recommendScore, synergyFor } from '../synergy';
import type { SynergyResult } from '../synergy';
import { GRADE_COLORS, ICON_BASE_URL, FILTER_OPTIONS } from '../constants';
import type { FilterKey, FlagKey, Unit } from '../types';

type SortKey =
  | 'recommend-desc'
  | 'synergy-desc'
  | 'deficit-asc'
  | 'deficit-desc'
  | 'commons-used-desc'
  | 'commons-used-ratio-desc'
  | 'grade-desc'
  | 'grade-asc'
  | 'name';

type Mode = 'general' | 'commons' | 'synergy';

const ETC_LEVELS = new Set([14, 22]); // 기타, 아이템

interface Candidate {
  unit: Unit;
  missing: Record<number, number>;
  usedFromDeck: Record<number, number>;
  totalDeficit: number;
  totalCommonsMissing: number;
  totalNonCommonMissing: number;
  totalCommonsUsedFromDeck: number;
  commonsUsageRatio: number;
  synergy: SynergyResult;
  recommend: number;
}

export function CandidatesModal() {
  const open = useApp(s => s.candidatesModalOpen);
  const close = useApp(s => s.closeCandidatesModal);
  const openRecipe = useApp(s => s.openRecipeModal);
  const deck = useApp(s => s.deck);

  const [mode, setMode] = useState<Mode>('general');
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');
  const [skillFilter, setSkillFilter] = useState<FilterKey>('all');
  const [excludeOwned, setExcludeOwned] = useState(false);
  const [excludeEtc, setExcludeEtc] = useState(true);
  const [onlyZeroDeficit, setOnlyZeroDeficit] = useState(false);
  const [onlyCommonsBlocked, setOnlyCommonsBlocked] = useState(false);
  const [sort, setSort] = useState<SortKey>('deficit-asc');
  const [maxRows, setMaxRows] = useState(50);

  const applyModePreset = (nextMode: Mode) => {
    setMode(nextMode);
    if (nextMode === 'commons') {
      setSort('commons-used-desc');
      setOnlyCommonsBlocked(true);
      setOnlyZeroDeficit(false);
      return;
    }
    if (nextMode === 'synergy') {
      setSort('recommend-desc');
      setOnlyCommonsBlocked(false);
      setOnlyZeroDeficit(false);
      return;
    }
    setSort('deficit-asc');
    setOnlyCommonsBlocked(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const profile = useMemo(() => profileDeck(deck), [deck]);

  const totalCommonsInDeck = useMemo(() => {
    let total = 0;
    for (const [idStr, count] of Object.entries(deck)) {
      const u = getUnit(parseInt(idStr, 10));
      if (u && u.level === 1) total += count;
    }
    return total;
  }, [deck]);

  const candidates = useMemo<Candidate[]>(() => {
    if (!open) return [];
    const result: Candidate[] = UNITS.filter(u => {
      const recipe = getRecipe(u.id);
      if (!recipe || recipe.materials.length === 0) return false;
      if (gradeFilter !== 'all' && u.level !== gradeFilter) return false;
      if (
        skillFilter !== 'all' &&
        skillFilter !== 'singlelost' &&
        !u.flags[skillFilter as keyof Unit['flags']]
      )
        return false;
      if (excludeEtc && ETC_LEVELS.has(u.level ?? 0)) return false;
      if (excludeOwned && (deck[u.id] ?? 0) > 0) return false;
      return true;
    }).map(u => {
      const def = deficitFor(u.id, 1, deck);
      const denom = def.totalCommonsUsedFromDeck + def.totalCommonsMissing;
      const commonsUsageRatio =
        denom === 0 ? 0 : def.totalCommonsUsedFromDeck / denom;
      const synergy = synergyFor(u, profile);
      const recommend = recommendScore(synergy.total, def.total);
      return {
        unit: u,
        missing: def.missing,
        usedFromDeck: def.usedFromDeck,
        totalDeficit: def.total,
        totalCommonsMissing: def.totalCommonsMissing,
        totalNonCommonMissing: def.totalNonCommonMissing,
        totalCommonsUsedFromDeck: def.totalCommonsUsedFromDeck,
        commonsUsageRatio,
        synergy,
        recommend,
      };
    });

    let filtered = result;
    if (onlyZeroDeficit) {
      filtered = filtered.filter(c => c.totalDeficit === 0);
    }
    if (onlyCommonsBlocked) {
      filtered = filtered.filter(c => c.totalNonCommonMissing === 0);
    }

    filtered.sort((a, b) => {
      switch (sort) {
        case 'recommend-desc':
          if (a.recommend !== b.recommend) return b.recommend - a.recommend;
          return (b.unit.level ?? 0) - (a.unit.level ?? 0);
        case 'synergy-desc':
          if (a.synergy.total !== b.synergy.total)
            return b.synergy.total - a.synergy.total;
          return a.totalDeficit - b.totalDeficit;
        case 'deficit-asc':
          if (a.totalDeficit !== b.totalDeficit)
            return a.totalDeficit - b.totalDeficit;
          return (b.unit.level ?? 0) - (a.unit.level ?? 0);
        case 'deficit-desc':
          if (a.totalDeficit !== b.totalDeficit)
            return b.totalDeficit - a.totalDeficit;
          return (b.unit.level ?? 0) - (a.unit.level ?? 0);
        case 'commons-used-desc':
          if (a.totalCommonsUsedFromDeck !== b.totalCommonsUsedFromDeck)
            return b.totalCommonsUsedFromDeck - a.totalCommonsUsedFromDeck;
          return (b.unit.level ?? 0) - (a.unit.level ?? 0);
        case 'commons-used-ratio-desc':
          if (a.commonsUsageRatio !== b.commonsUsageRatio)
            return b.commonsUsageRatio - a.commonsUsageRatio;
          return b.totalCommonsUsedFromDeck - a.totalCommonsUsedFromDeck;
        case 'grade-desc':
          if ((b.unit.level ?? 0) !== (a.unit.level ?? 0))
            return (b.unit.level ?? 0) - (a.unit.level ?? 0);
          return a.totalDeficit - b.totalDeficit;
        case 'grade-asc':
          if ((a.unit.level ?? 0) !== (b.unit.level ?? 0))
            return (a.unit.level ?? 0) - (b.unit.level ?? 0);
          return a.totalDeficit - b.totalDeficit;
        case 'name':
          return (a.unit.name ?? '').localeCompare(b.unit.name ?? '', 'ko');
      }
    });

    return filtered;
  }, [
    open,
    gradeFilter,
    skillFilter,
    excludeOwned,
    excludeEtc,
    onlyZeroDeficit,
    onlyCommonsBlocked,
    sort,
    deck,
    profile,
  ]);

  if (!open) return null;

  const visible = candidates.slice(0, maxRows);
  const isCommonsMode = mode === 'commons';
  const isSynergyMode = mode === 'synergy';

  // 등급 옵션 (recipe가 있는 등급만)
  const gradeOptions = Object.entries(META.levelToGrade)
    .filter(([lvl]) => lvl !== '1') // 흔함은 leaf
    .map(([lvl, name]) => ({ level: parseInt(lvl, 10), name }))
    .sort((a, b) => a.level - b.level);

  // 시너지 모드의 추천 상위 3개 (현재 정렬과 무관하게 고정 추천)
  const top3Ids = new Set(
    isSynergyMode
      ? candidates
          .slice()
          .sort((a, b) => b.recommend - a.recommend)
          .slice(0, 3)
          .map(c => c.unit.id)
      : []
  );

  return (
    <div className="modal-backdrop" onClick={close} role="dialog" aria-modal>
      <div
        className="modal-card candidates-modal"
        onClick={e => e.stopPropagation()}
      >
        <header className="modal-header">
          <div style={{ flex: 1 }}>
            <div className="modal-title">조합 후보 비교</div>
            <div className="modal-subtitle">
              {isCommonsMode ? (
                <>
                  현재 패의 흔함 <b>{totalCommonsInDeck}개</b>를 가장 많이
                  소비하는 결과 유닛 순서로 보여줍니다
                </>
              ) : isSynergyMode ? (
                <>
                  현재 패의 시너지(좋아요 + 스킬 적층)와 만들기 쉬움을
                  결합해 추천합니다
                </>
              ) : (
                <>
                  현재 패에서 가장 적은 추가 재료로 만들 수 있는 유닛부터
                  보여줍니다
                </>
              )}
            </div>
            {isSynergyMode && profile.totalUnits > 0 && (
              <div className="deck-profile">
                덱 좋아요{' '}
                <span className="m-magic">마 {profile.mateSum.magic}</span>{' '}
                <span className="m-phys">물 {profile.mateSum.physical}</span>{' '}
                <span className="m-story">스 {profile.mateSum.story}</span>
                {profile.dominantMate && (
                  <span className="dominant-mate">
                    주축:{' '}
                    {profile.dominantMate === 'magic'
                      ? '마법'
                      : profile.dominantMate === 'physical'
                      ? '물리'
                      : '스토리'}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="mode-tabs">
            <button
              className={mode === 'general' ? 'mode-tab active' : 'mode-tab'}
              onClick={() => applyModePreset('general')}
            >
              일반
            </button>
            <button
              className={mode === 'commons' ? 'mode-tab active' : 'mode-tab'}
              onClick={() => applyModePreset('commons')}
              title="현재 흔함을 가장 잘 쓰는 후보"
            >
              🌾 흔함 효율
            </button>
            <button
              className={mode === 'synergy' ? 'mode-tab active' : 'mode-tab'}
              onClick={() => applyModePreset('synergy')}
              title="덱 시너지가 잘 맞는 후보"
            >
              🔗 시너지
            </button>
          </div>
          <button className="modal-close" onClick={close} title="닫기 (Esc)">
            ✕
          </button>
        </header>

        <div className="candidates-filters">
          <label>
            등급
            <select
              value={gradeFilter === 'all' ? 'all' : String(gradeFilter)}
              onChange={e =>
                setGradeFilter(
                  e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                )
              }
            >
              <option value="all">모두</option>
              {gradeOptions.map(g => (
                <option key={g.level} value={g.level}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            스킬
            <select
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value as FilterKey)}
            >
              {FILTER_OPTIONS.map(f => (
                <option key={f.key} value={f.key}>
                  {f.label}
                  {f.alias ? ` (${f.alias})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
              <option value="recommend-desc">
                추천 (시너지 + 만들기 쉬움)
              </option>
              <option value="synergy-desc">시너지 점수 높은 순</option>
              <option value="deficit-asc">부족 적은 순</option>
              <option value="deficit-desc">부족 많은 순</option>
              <option value="commons-used-desc">
                내 흔함 사용량 많은 순
              </option>
              <option value="commons-used-ratio-desc">
                내 흔함 활용률 높은 순
              </option>
              <option value="grade-desc">등급 높은 순</option>
              <option value="grade-asc">등급 낮은 순</option>
              <option value="name">이름순</option>
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={onlyZeroDeficit}
              onChange={e => setOnlyZeroDeficit(e.target.checked)}
            />
            지금 바로 만들 수 있는 것만
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={onlyCommonsBlocked}
              onChange={e => setOnlyCommonsBlocked(e.target.checked)}
              title="비-흔함 재료(안흔함, 특별함 등)는 다 갖고 있고 흔함만 부족한 후보"
            />
            흔함만 모자란 후보
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={excludeOwned}
              onChange={e => setExcludeOwned(e.target.checked)}
            />
            이미 가진 유닛 제외
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={excludeEtc}
              onChange={e => setExcludeEtc(e.target.checked)}
            />
            기타 / 아이템 제외
          </label>
        </div>

        <div className="modal-body candidates-body">
          {candidates.length === 0 ? (
            <div className="modal-empty">
              조건에 해당하는 유닛이 없습니다.
            </div>
          ) : (
            <>
              <div className="candidates-meta">
                {candidates.length}개 후보 중 상위 {visible.length}개 표시 ·
                <button
                  className="link-btn"
                  onClick={() => setMaxRows(maxRows + 50)}
                  disabled={visible.length >= candidates.length}
                  style={{ marginLeft: 6 }}
                >
                  더 보기 +50
                </button>
                {isSynergyMode && profile.totalUnits === 0 && (
                  <span style={{ marginLeft: 8, color: 'var(--danger)' }}>
                    덱이 비어 있어 시너지 점수가 0입니다. 유닛을 먼저
                    추가하세요.
                  </span>
                )}
              </div>
              <table className="candidates-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th style={{ width: 38 }}></th>
                    <th>유닛</th>
                    <th style={{ width: 90 }}>등급</th>
                    {!isSynergyMode && (
                      <th style={{ width: 120 }}>좋아요 (마/물/스)</th>
                    )}
                    {isCommonsMode ? (
                      <>
                        <th style={{ width: 100 }}>흔함 사용</th>
                        <th style={{ width: 100 }}>흔함 부족</th>
                      </>
                    ) : isSynergyMode ? (
                      <>
                        <th style={{ width: 110 }}>시너지</th>
                        <th style={{ width: 80 }}>부족</th>
                      </>
                    ) : (
                      <th style={{ width: 70 }}>부족</th>
                    )}
                    <th>
                      {isCommonsMode
                        ? '흔함 사용 내역'
                        : isSynergyMode
                        ? '공유 스킬 / 좋아요'
                        : '부족 내역'}
                    </th>
                    <th style={{ width: 70 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c, i) => {
                    const color = GRADE_COLORS[c.unit.level ?? 0];
                    const have = deck[c.unit.id] ?? 0;
                    const sortedMissing = Object.entries(c.missing)
                      .map(([id, count]) => ({ id: parseInt(id, 10), count }))
                      .sort((a, b) => b.count - a.count);
                    const sortedUsed = Object.entries(c.usedFromDeck)
                      .map(([id, count]) => ({ id: parseInt(id, 10), count }))
                      .sort((a, b) => b.count - a.count);
                    const isTop = top3Ids.has(c.unit.id);
                    return (
                      <tr
                        key={c.unit.id}
                        className={`candidate-row ${
                          c.totalDeficit === 0 ? 'is-ready' : ''
                        } ${isTop ? 'is-top' : ''}`}
                        onClick={() => openRecipe(c.unit.id)}
                        title="클릭하면 조합 트리 모달"
                      >
                        <td className="rank">{i + 1}</td>
                        <td>
                          <img
                            src={`${ICON_BASE_URL}/${c.unit.icon}`}
                            width={28}
                            height={22}
                            alt=""
                            loading="lazy"
                          />
                        </td>
                        <td>
                          <span className="cand-name">{c.unit.name}</span>
                          {isTop && <span className="top-badge">🌟 추천</span>}
                          {have > 0 && (
                            <span className="cand-have">보유 {have}</span>
                          )}
                        </td>
                        <td>
                          {c.unit.grade && (
                            <span
                              className="grade-chip"
                              style={{
                                background: color?.bg,
                                color: color?.text,
                              }}
                            >
                              {c.unit.grade}
                            </span>
                          )}
                        </td>
                        {!isSynergyMode && (
                          <td className="mate-cell-row">
                            <span className="m-magic">{c.unit.mate.magic}</span>{' '}
                            <span className="m-phys">{c.unit.mate.physical}</span>{' '}
                            <span className="m-story">{c.unit.mate.story}</span>
                          </td>
                        )}
                        {isCommonsMode ? (
                          <>
                            <td>
                              <span className="commons-used-pill">
                                −{c.totalCommonsUsedFromDeck}
                                <span className="commons-ratio">
                                  ({Math.round(c.commonsUsageRatio * 100)}%)
                                </span>
                              </span>
                            </td>
                            <td>
                              <span
                                className={`deficit-pill ${
                                  c.totalCommonsMissing === 0 ? 'zero' : ''
                                }`}
                              >
                                {c.totalCommonsMissing === 0
                                  ? '✓ 충분'
                                  : `+${c.totalCommonsMissing}`}
                              </span>
                              {c.totalNonCommonMissing > 0 && (
                                <span
                                  className="deficit-noncommon"
                                  title="비-흔함 추가 필요"
                                >
                                  +비흔함{c.totalNonCommonMissing}
                                </span>
                              )}
                            </td>
                          </>
                        ) : isSynergyMode ? (
                          <>
                            <td>
                              <SynergyPill r={c.synergy} />
                            </td>
                            <td>
                              <span
                                className={`deficit-pill ${
                                  c.totalDeficit === 0 ? 'zero' : ''
                                }`}
                              >
                                {c.totalDeficit === 0
                                  ? '✓ 즉시'
                                  : `+${c.totalDeficit}`}
                              </span>
                            </td>
                          </>
                        ) : (
                          <td>
                            <span
                              className={`deficit-pill ${
                                c.totalDeficit === 0 ? 'zero' : ''
                              }`}
                            >
                              {c.totalDeficit === 0
                                ? '✓ 즉시'
                                : `+${c.totalDeficit}`}
                            </span>
                          </td>
                        )}
                        <td>
                          <div className="missing-chips">
                            {isCommonsMode ? (
                              sortedUsed.length === 0 ? (
                                <span className="missing-none">
                                  내 흔함 사용 없음
                                </span>
                              ) : (
                                sortedUsed.map(m => {
                                  const u = getUnit(m.id);
                                  if (!u) return null;
                                  const mc = GRADE_COLORS[u.level ?? 0];
                                  return (
                                    <span
                                      key={`u${m.id}`}
                                      className="missing-chip"
                                      style={{
                                        background: mc?.bg,
                                        color: mc?.text,
                                      }}
                                    >
                                      {u.name} −{m.count}
                                    </span>
                                  );
                                })
                              )
                            ) : isSynergyMode ? (
                              <SharedSkills
                                skills={c.synergy.sharedSkills}
                                unitMate={c.unit.mate}
                              />
                            ) : sortedMissing.length === 0 ? (
                              <span className="missing-none">없음</span>
                            ) : (
                              sortedMissing.map(m => {
                                const u = getUnit(m.id);
                                if (!u) return null;
                                const mc = GRADE_COLORS[u.level ?? 0];
                                return (
                                  <span
                                    key={m.id}
                                    className="missing-chip"
                                    style={{
                                      background: mc?.bg,
                                      color: mc?.text,
                                    }}
                                  >
                                    {u.name} ×{m.count}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            className="outline-success"
                            title="조합 트리 보기"
                            onClick={() => openRecipe(c.unit.id)}
                          >
                            🌳 트리
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SynergyPill({ r }: { r: SynergyResult }) {
  return (
    <div className="synergy-pill">
      <span className="synergy-total">{r.total}</span>
      <span className="synergy-breakdown">
        <span title="좋아요 정렬 점수">좋 {r.mateScore}</span>
        <span title="스킬 적층 점수">스 {r.skillScore}</span>
      </span>
    </div>
  );
}

function SharedSkills({
  skills,
  unitMate,
}: {
  skills: { key: FlagKey; deckCount: number }[];
  unitMate: { magic: number; physical: number; story: number };
}) {
  if (skills.length === 0 && unitMate.magic === 0 && unitMate.physical === 0 && unitMate.story === 0) {
    return <span className="missing-none">시너지 없음</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {(unitMate.magic > 0 || unitMate.physical > 0 || unitMate.story > 0) && (
        <span className="mate-chip">
          {unitMate.magic > 0 && (
            <span className="mate-chip-magic">마+{unitMate.magic}</span>
          )}
          {unitMate.physical > 0 && (
            <span className="mate-chip-phys">물+{unitMate.physical}</span>
          )}
          {unitMate.story > 0 && (
            <span className="mate-chip-story">스+{unitMate.story}</span>
          )}
        </span>
      )}
      {skills.slice(0, 6).map(s => (
        <span key={s.key} className="synergy-skill-chip">
          {META.flagDictionary[s.key] ?? s.key}{' '}
          <span className="synergy-skill-count">×{s.deckCount}</span>
        </span>
      ))}
      {skills.length > 6 && (
        <span className="synergy-skill-more">+{skills.length - 6}</span>
      )}
    </div>
  );
}

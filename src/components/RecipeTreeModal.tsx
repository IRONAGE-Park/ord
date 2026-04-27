import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { getRecipe, getUnit } from '../data';
import { GRADE_COLORS, ICON_BASE_URL } from '../constants';
import type { Unit } from '../types';

export function RecipeTreeModal() {
  const targetId = useApp(s => s.recipeModalUnitId);
  const close = useApp(s => s.closeRecipeModal);
  const deck = useApp(s => s.deck);
  const [targetCount, setTargetCount] = useState(1);

  // Esc 닫기 + 모달 열릴 때 카운트 초기화
  useEffect(() => {
    if (targetId == null) return;
    setTargetCount(1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [targetId, close]);

  if (targetId == null) return null;
  const target = getUnit(targetId);
  if (!target) return null;
  const recipe = getRecipe(targetId);

  return (
    <div className="modal-backdrop" onClick={close} role="dialog" aria-modal>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <UnitChip unit={target} size="lg" />
          <div style={{ flex: 1 }}>
            <div className="modal-title">조합 경로</div>
            <div className="modal-subtitle">
              <b>{target.name}</b>
              {target.grade && (
                <span
                  className="grade-chip"
                  style={{
                    background: GRADE_COLORS[target.level ?? 0]?.bg,
                    color: GRADE_COLORS[target.level ?? 0]?.text,
                  }}
                >
                  {target.grade}
                </span>
              )}
              만들기
            </div>
          </div>
          <div className="modal-target-count">
            <label htmlFor="recipe-target-count">목표 갯수</label>
            <input
              id="recipe-target-count"
              type="number"
              min={1}
              max={99}
              value={targetCount}
              onChange={e =>
                setTargetCount(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
            />
          </div>
          <button className="modal-close" onClick={close} title="닫기 (Esc)">
            ✕
          </button>
        </header>

        <div className="modal-body">
          {!recipe || recipe.materials.length === 0 ? (
            <div className="modal-empty">
              이 유닛은 재료 없는 베이스 유닛입니다 (조합 경로 없음).
            </div>
          ) : (
            <div className="tree-root">
              <RecipeNode
                id={targetId}
                count={targetCount}
                depth={0}
                initialOpen
                deck={deck}
              />
            </div>
          )}
        </div>

        {recipe && recipe.lowestMaterials.length > 0 && (
          <footer className="modal-footer">
            <div className="lowest-title">
              최하위 재료 합계 (이 모달 기준 ×{targetCount})
            </div>
            <div className="lowest-list">
              {recipe.lowestMaterials.map(lm => {
                const u = getUnit(lm.id);
                if (!u) return null;
                const total = lm.count * targetCount;
                const have = deck[lm.id] ?? 0;
                const enough = have >= total;
                return (
                  <div
                    key={lm.id}
                    className={`lowest-item ${enough ? 'enough' : 'short'}`}
                  >
                    <UnitChip unit={u} />
                    <span className="lowest-need">×{total}</span>
                    <span className="lowest-have">
                      {enough ? '✓' : '✗'} 보유 {have}
                    </span>
                  </div>
                );
              })}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

function RecipeNode({
  id,
  count,
  depth,
  initialOpen,
  deck,
}: {
  id: number;
  count: number;
  depth: number;
  initialOpen?: boolean;
  deck: Record<number, number>;
}) {
  const [open, setOpen] = useState(!!initialOpen);
  const openRecipeModal = useApp(s => s.openRecipeModal);
  const unit = getUnit(id);
  const recipe = getRecipe(id);
  if (!unit) return null;

  const hasChildren = !!recipe && recipe.materials.length > 0;
  const have = deck[id] ?? 0;
  const need = count;
  const enough = have >= need;
  const remaining = Math.max(0, need - have);

  return (
    <div className={`tree-node depth-${Math.min(depth, 4)}`}>
      <div className={`tree-row ${enough ? 'enough' : ''}`}>
        {hasChildren ? (
          <button
            className="tree-toggle"
            onClick={() => setOpen(o => !o)}
            type="button"
          >
            {open ? '▼ 접기' : '▶ 아래 보기'}
          </button>
        ) : (
          <span className="tree-leaf">⬢ 베이스</span>
        )}
        <UnitChip unit={unit} />
        <span className="tree-need">×{need}</span>
        <span
          className={`tree-have ${enough ? 'have-enough' : 'have-short'}`}
          title={enough ? '충분히 보유' : `${remaining}개 부족`}
        >
          보유 {have} {enough ? '✓' : `(− ${remaining})`}
        </span>
        {hasChildren && depth > 0 && (
          <button
            className="tree-pin"
            onClick={() => openRecipeModal(id)}
            title="이 유닛을 새 모달에서 열기"
            type="button"
          >
            ↗
          </button>
        )}
      </div>
      {open && hasChildren && (
        <ul className="tree-children">
          {recipe!.materials
            // 깊은 레벨이 위에 보이도록 정렬 (시각적으로 트리가 자연스러움)
            .slice()
            .sort((a, b) => {
              const al = getUnit(a.id)?.level ?? 0;
              const bl = getUnit(b.id)?.level ?? 0;
              return bl - al;
            })
            .map(child => (
              <li key={child.id}>
                <RecipeNode
                  id={child.id}
                  count={child.count * count}
                  depth={depth + 1}
                  deck={deck}
                />
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function UnitChip({
  unit,
  size = 'md',
}: {
  unit: Unit;
  size?: 'md' | 'lg';
}) {
  const w = size === 'lg' ? 40 : 24;
  const h = size === 'lg' ? 32 : 20;
  const color = GRADE_COLORS[unit.level ?? 0];
  return (
    <span className={`unit-chip ${size}`}>
      <img
        src={`${ICON_BASE_URL}/${unit.icon}`}
        width={w}
        height={h}
        alt=""
        loading="lazy"
      />
      <span className="unit-chip-name">{unit.name}</span>
      {unit.grade && (
        <span
          className="grade-chip"
          style={{
            background: color?.bg,
            color: color?.text,
          }}
        >
          {unit.grade}
        </span>
      )}
    </span>
  );
}

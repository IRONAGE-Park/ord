import { forwardRef } from 'react';
import { useApp } from '../store';
import { getRecipe } from '../data';
import { COMMON_HOTKEYS, ICON_BASE_URL } from '../constants';
import type { Unit } from '../types';
import type { ProgressResult } from '../calc';

// id → hotkey 글자 (예: 1 → 'Q', 2 → 'W')
const HOTKEY_FOR_ID: Record<number, string> = (() => {
  const m: Record<number, string> = {};
  for (const [k, v] of Object.entries(COMMON_HOTKEYS)) {
    m[v] = k.toUpperCase();
  }
  return m;
})();

interface Props {
  unit: Unit;
  /** 현재 패에 보유된 갯수 */
  count: number;
  /** 진행률 (재료 %A + 총 %B). 베이스 유닛은 null */
  progress?: ProgressResult | null;
  /** 검색 강조 상태: 'match' = 매치, 'dim' = 흐리게, undefined = 보통 */
  highlight?: 'match' | 'dim';
  /** 검색 결과 첫 매치(키보드 활성 행) */
  active?: boolean;
}

export const UnitRow = forwardRef<HTMLTableRowElement, Props>(function UnitRow(
  { unit, count, progress, highlight, active },
  ref
) {
  const add = useApp(s => s.add);
  const remove = useApp(s => s.remove);
  const combine = useApp(s => s.combine);
  const showLackedModal = useApp(s => s.showLackedModal);
  const openRecipeModal = useApp(s => s.openRecipeModal);

  const isCommon = (unit.level ?? 0) <= 1;
  const recipe = getRecipe(unit.id);
  const canCombine = !!recipe && recipe.materials.length > 0;

  const onPrimaryAction = (e?: React.MouseEvent) => {
    if (isCommon || !canCombine) {
      add(unit.id, 1);
      return;
    }

    if (!e?.ctrlKey && !e?.metaKey) {
      add(unit.id, 1);
      return;
    }

    const r = combine(unit.id);
    if (!r.ok && r.missing && showLackedModal) {
      // 부족하면 조합 트리 모달을 열어서 어디서 막히는지 보여줌
      openRecipeModal(unit.id);
    }
  };

  const onMinus = () => remove(unit.id, 1);

  const onClick = (e: React.MouseEvent) => {
    onPrimaryAction(e);
  };
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onMinus();
  };
  const onAuxClick = (e: React.MouseEvent) => {
    // 가운데 버튼 = 정보 페이지 새 창
    if (e.button === 1) {
      window.open(
        `https://ordsearch.net/characters/${unit.id}`,
        '_blank',
        'noopener'
      );
      e.preventDefault();
    }
  };

  const matPct = progress ? Math.round(progress.materialProgress * 100) : 0;
  const totPct = progress ? Math.round(progress.totalProgress * 100) : 0;
  const isFull = progress && matPct >= 100 && totPct >= 100;

  const tooltip = [
    unit.name,
    isCommon
      ? '(흔함 — 클릭: +1, 우클릭: -1)'
      : '(클릭: +1, Ctrl/Cmd+클릭: 조합 시도, 우클릭: -1)',
    progress
      ? `재료 ${matPct}% / 조합 ${totPct}%`
      : '',
    unit.skills ? `\n${unit.skills}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <tr
      ref={ref}
      className={[
        'unit-row',
        count > 0 ? 'has-count' : '',
        active ? 'is-active' : '',
        highlight === 'match' ? 'is-match' : '',
        highlight === 'dim' ? 'is-dim' : '',
        unit.flags.docking ? 'is-docking' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-unit-id={unit.id}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onAuxClick={onAuxClick}
      title={tooltip}
    >
      <td className="unit-cell unit-name-cell">
        {progress &&
          (isFull ? (
            <div className="ratio-bar ratio-bar-full" aria-hidden />
          ) : (
            <>
              <div
                className="ratio-bar ratio-bar-mat"
                style={{ width: `${matPct}%` }}
                aria-hidden
              />
              <div
                className="ratio-bar ratio-bar-tot"
                style={{ width: `${totPct}%` }}
                aria-hidden
              />
            </>
          ))}
        <div className="unit-content">
          <img
            src={`${ICON_BASE_URL}/${unit.icon}`}
            width={28}
            height={22}
            alt=""
            loading="lazy"
            draggable={false}
          />
          {HOTKEY_FOR_ID[unit.id] && (
            <kbd className="unit-hotkey">{HOTKEY_FOR_ID[unit.id]}</kbd>
          )}
          {count > 0 && <span className="unit-count">{count}</span>}
          <span className="unit-name">{unit.name}</span>
          {progress && (
            <span
              className={`unit-progress ${isFull ? 'is-full' : ''}`}
              title={`재료 ${matPct}% · 조합 ${totPct}%`}
            >
              <span
                className={`pp pp-mat ${matPct >= 100 ? 'full' : ''} ${isFull ? 'gold' : ''}`}
                aria-label={`재료 진행률 ${matPct}%`}
              >
                재 {matPct}%
              </span>
              <span
                className={`pp pp-tot ${totPct >= 100 ? 'full' : ''} ${isFull ? 'gold' : ''}`}
                aria-label={`조합 진행률 ${totPct}%`}
              >
                조 {totPct}%
              </span>
            </span>
          )}
          {canCombine && (
            <button
              className="unit-tree-button"
              onClick={e => {
                e.stopPropagation();
                openRecipeModal(unit.id);
              }}
              onContextMenu={e => e.stopPropagation()}
              title="조합 경로 보기"
              type="button"
            >
              🌳
            </button>
          )}
          <a
            className="unit-info-link"
            href={`https://ordsearch.net/characters/${unit.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            onContextMenu={e => e.stopPropagation()}
            title="정보 페이지 (가운데 클릭으로도 가능)"
          >
            ↗
          </a>
        </div>
      </td>
    </tr>
  );
});

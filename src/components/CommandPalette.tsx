import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store';
import { findMatches } from '../search';
import { getRecipe } from '../data';
import { progressFor } from '../calc';
import { GRADE_COLORS, ICON_BASE_URL } from '../constants';
import type { Unit } from '../types';

const MAX_RESULTS = 12;

export function CommandPalette() {
  const open = useApp(s => s.commandPaletteOpen);
  const close = useApp(s => s.closeCommandPalette);
  const deck = useApp(s => s.deck);
  const add = useApp(s => s.add);
  const remove = useApp(s => s.remove);
  const combine = useApp(s => s.combine);
  const showLackedModal = useApp(s => s.showLackedModal);
  const openRecipeModal = useApp(s => s.openRecipeModal);

  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 열릴 때마다 초기화 + 포커스
  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlighted(0);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  const matches = useMemo(
    () => (open ? findMatches(query, MAX_RESULTS) : []),
    [open, query]
  );

  // 결과가 바뀌면 첫 항목으로 reset
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // 활성 항목이 보이도록 스크롤
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-idx="${highlighted}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const runPrimary = (unit: Unit) => {
    const isCommon = (unit.level ?? 0) <= 1;
    const recipe = getRecipe(unit.id);
    if (isCommon || !recipe || recipe.materials.length === 0) {
      add(unit.id, 1);
      return;
    }
    const r = combine(unit.id);
    if (!r.ok && r.missing && showLackedModal) {
      // 부족하면 트리 모달 열고 팔레트 닫기
      openRecipeModal(unit.id);
      close();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(matches.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      const u = matches[highlighted];
      if (!u) return;
      e.preventDefault();
      if (e.shiftKey) {
        remove(u.id, 1);
      } else {
        runPrimary(u);
      }
    } else if (e.key === '?') {
      const u = matches[highlighted];
      if (!u) return;
      e.preventDefault();
      openRecipeModal(u.id);
      close();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  if (!open) return null;

  return (
    <div className="cmdk-backdrop" onClick={close} role="dialog" aria-modal>
      <div className="cmdk-panel" onClick={e => e.stopPropagation()}>
        <div className="cmdk-input-wrapper">
          <span className="cmdk-icon" aria-hidden>
            🔎
          </span>
          <input
            ref={inputRef}
            className="cmdk-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="유닛 이름 검색…"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmdk-kbd">Esc</kbd>
        </div>
        {matches.length > 0 ? (
          <ul ref={listRef} className="cmdk-list">
            {matches.map((u, i) => {
              const color = GRADE_COLORS[u.level ?? 0];
              const have = deck[u.id] ?? 0;
              const isCommon = (u.level ?? 0) <= 1;
              const recipe = getRecipe(u.id);
              const canCombine = !!recipe && recipe.materials.length > 0;
              const progress =
                canCombine && !isCommon ? progressFor(u.id, deck) : null;
              return (
                <li
                  key={u.id}
                  data-idx={i}
                  className={`cmdk-item ${i === highlighted ? 'active' : ''}`}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => runPrimary(u)}
                  onContextMenu={e => {
                    e.preventDefault();
                    remove(u.id, 1);
                  }}
                >
                  <img
                    src={`${ICON_BASE_URL}/${u.icon}`}
                    width={28}
                    height={22}
                    alt=""
                    loading="lazy"
                  />
                  <span className="cmdk-name">{u.name}</span>
                  {have > 0 && <span className="cmdk-have">×{have}</span>}
                  {progress && (
                    <span className="cmdk-progress" title="재료 / 조합">
                      {Math.round(progress.materialProgress * 100)}% /{' '}
                      {Math.round(progress.totalProgress * 100)}%
                    </span>
                  )}
                  {u.grade && (
                    <span
                      className="cmdk-grade"
                      style={{ background: color?.bg, color: color?.text }}
                    >
                      {u.grade}
                    </span>
                  )}
                  <span className="cmdk-action">
                    {isCommon || !canCombine ? '+1' : '조합'}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : query ? (
          <div className="cmdk-empty">매치 없음</div>
        ) : (
          <div className="cmdk-empty">
            유닛 이름 일부를 입력하세요
            <div className="cmdk-empty-hint">예: 핸콕, 카이도, 야마토…</div>
          </div>
        )}
        <footer className="cmdk-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> 이동
          </span>
          <span>
            <kbd>Enter</kbd> 추가/조합
          </span>
          <span>
            <kbd>Shift</kbd>+<kbd>Enter</kbd> -1
          </span>
          <span>
            <kbd>?</kbd> 조합 트리
          </span>
          <span>
            우클릭 -1
          </span>
        </footer>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../store';
import { getUnit } from '../data';
import { ICON_BASE_URL } from '../constants';

const ETC_LEVELS = new Set([14, 22]); // 기타, 아이템

export function NowDeck() {
  const deck = useApp(s => s.deck);
  const showEtcInDeck = useApp(s => s.showEtcInDeck);
  const toggleShowEtc = useApp(s => s.toggleShowEtcInDeck);
  const [open, setOpen] = useState(true);

  // 희귀함(L4) 이상부터 표기 (원본 사양)
  const visibleUnits = Object.entries(deck)
    .map(([id, count]) => ({ unit: getUnit(parseInt(id, 10)), count }))
    .filter(x => x.unit && (x.unit.level ?? 0) >= 4)
    .filter(x => showEtcInDeck || !ETC_LEVELS.has(x.unit!.level ?? 0))
    .sort((a, b) => (b.unit!.level ?? 0) - (a.unit!.level ?? 0));

  if (!open) {
    return (
      <button
        className="primary now-deck-reopen"
        onClick={() => setOpen(true)}
      >
        현재 유닛 내역 다시 보기
      </button>
    );
  }

  return (
    <section className="now-deck">
      <div className="now-deck-header">
        <span className="now-deck-title">
          현재 유닛 내역 (희귀함 이상부터 표기)
        </span>
        <button
          className="warning"
          title="기타 내역 숨기기 / 보이기"
          onClick={toggleShowEtc}
        >
          {showEtcInDeck ? '👁 기타 숨기기' : '👁‍🗨 기타 보이기'}
        </button>
        <button className="danger" onClick={() => setOpen(false)}>
          ✕ 닫기
        </button>
      </div>
      <div className="now-deck-list">
        {visibleUnits.length === 0 && (
          <span className="now-deck-empty">선택된 희귀함 이상 유닛 없음</span>
        )}
        {visibleUnits.map(({ unit, count }) => (
          <span key={unit!.id} className="now-deck-chip" title={unit!.name ?? ''}>
            <img
              src={`${ICON_BASE_URL}/${unit!.icon}`}
              width={24}
              height={20}
              alt={unit!.name ?? ''}
              loading="lazy"
            />
            <span className="chip-name">{unit!.name}</span>
            {count > 1 && <span className="chip-count">×{count}</span>}
          </span>
        ))}
      </div>
    </section>
  );
}

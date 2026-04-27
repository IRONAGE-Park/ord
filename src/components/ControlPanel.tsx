import { useApp } from '../store';

export function ControlPanel() {
  const excludeEtc = useApp(s => s.excludeEtcInCalc);
  const toggleEtc = useApp(s => s.toggleEtcInCalc);
  const showSkill = useApp(s => s.showSkillTooltip);
  const toggleSkill = useApp(s => s.toggleSkillTooltip);
  const showLackedModal = useApp(s => s.showLackedModal);
  const toggleLackedModal = useApp(s => s.toggleLackedModal);
  const lackedThreshold = useApp(s => s.lackedDisplayThreshold);
  const setLackedThreshold = useApp(s => s.setLackedDisplayThreshold);
  const reset = useApp(s => s.reset);
  const undo = useApp(s => s.undo);
  const redo = useApp(s => s.redo);
  const pastLen = useApp(s => s.past.length);
  const futureLen = useApp(s => s.future.length);

  // localStorage 외에 별도의 SAVE/LOAD: 슬롯 저장
  const saveSlot = () => {
    const raw = localStorage.getItem('ord-helper-state') ?? '{}';
    const slot = prompt('저장할 슬롯 이름을 입력하세요 (예: 보스용)');
    if (!slot) return;
    localStorage.setItem(`ord-helper-slot:${slot}`, raw);
    alert(`'${slot}' 슬롯에 저장됐습니다.`);
  };

  const loadSlot = () => {
    const slots = Object.keys(localStorage)
      .filter(k => k.startsWith('ord-helper-slot:'))
      .map(k => k.replace('ord-helper-slot:', ''));
    if (slots.length === 0) {
      alert('저장된 슬롯이 없습니다.');
      return;
    }
    const slot = prompt(
      `불러올 슬롯 이름을 입력하세요\n\n저장된 슬롯: ${slots.join(', ')}`
    );
    if (!slot) return;
    const raw = localStorage.getItem(`ord-helper-slot:${slot}`);
    if (!raw) {
      alert('해당 슬롯을 찾을 수 없습니다.');
      return;
    }
    localStorage.setItem('ord-helper-state', raw);
    location.reload();
  };

  return (
    <div className="control-panel">
      <button className="success" onClick={() => alert('조합한 유닛 모아보기 — 추후 추가 예정')}>
        ⛶ 조합한 유닛 모아 보기
      </button>
      <div className="control-row">
        <button className="outline-primary" onClick={saveSlot}>
          💾 SAVE
        </button>
        <button className="outline-primary" onClick={loadSlot}>
          📂 LOAD
        </button>
      </div>
      <div className="control-row">
        <button
          className="warning"
          onClick={undo}
          disabled={pastLen === 0}
          title="되돌리기 (Z)"
        >
          ↶ 되돌리기 {pastLen > 0 && `(${pastLen})`}
        </button>
        <button
          className="warning"
          onClick={redo}
          disabled={futureLen === 0}
          title="다시하기 (Shift+Z 또는 Y)"
        >
          ↷ 다시하기 {futureLen > 0 && `(${futureLen})`}
        </button>
      </div>
      <button
        className="danger"
        onClick={() => {
          if (confirm('현재 조합 상태를 초기화하시겠습니까? (T)')) reset();
        }}
      >
        ⟲ 전체 리셋 (T)
      </button>

      <hr />

      <label className="control-check">
        <input
          type="checkbox"
          checked={!excludeEtc}
          onChange={toggleEtc}
        />
        계산 시 기타 (목재, 골드 등) 포함
      </label>
      <label className="control-check">
        <input
          type="checkbox"
          checked={showSkill}
          onChange={toggleSkill}
        />
        유닛 툴팁 내 특수능력 표기
      </label>
      <label className="control-check">
        <input
          type="checkbox"
          checked={showLackedModal}
          onChange={toggleLackedModal}
        />
        조합 시 부족한 재료 팝업 보기
      </label>

      <hr />

      <div className="control-threshold">
        <div>부족한 최하위 재료 표기 임계값</div>
        <input
          type="number"
          min={0}
          max={99}
          value={lackedThreshold}
          onChange={e =>
            setLackedThreshold(parseInt(e.target.value, 10) || 0)
          }
        />
        <span>개 이하일 때 갯수 표기</span>
      </div>
    </div>
  );
}

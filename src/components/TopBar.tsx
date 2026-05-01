import { useApp } from '../store';

export function TopBar() {
  const reset = useApp(s => s.reset);
  const darkMode = useApp(s => s.darkMode);
  const setDarkMode = useApp(s => s.setDarkMode);
  const undo = useApp(s => s.undo);
  const redo = useApp(s => s.redo);
  const pastLen = useApp(s => s.past.length);
  const futureLen = useApp(s => s.future.length);
  const openCandidates = useApp(s => s.openCandidatesModal);

  return (
    <header className="topbar">
      <h1>
        원피스 랜덤 디펜스 조합도우미
        <button
          className="primary icon"
          title="리셋 (T)"
          onClick={() => {
            if (confirm('현재 조합 상태를 초기화하시겠습니까?')) reset();
          }}
        >
          ⟲ 리셋
        </button>
        <button
          className="warning icon"
          title="되돌리기 (Z)"
          onClick={undo}
          disabled={pastLen === 0}
        >
          ↶ 되돌리기 {pastLen > 0 && <small>({pastLen})</small>}
        </button>
        <button
          className="warning icon"
          title="다시하기 (Shift+Z 또는 Y)"
          onClick={redo}
          disabled={futureLen === 0}
        >
          ↷ 다시하기 {futureLen > 0 && <small>({futureLen})</small>}
        </button>
        <button
          className="success icon"
          title="후보 비교 (!)"
          onClick={openCandidates}
        >
          🔬 후보 비교
        </button>
        <span style={{ marginLeft: 8 }}>
          <select
            value={darkMode}
            onChange={e =>
              setDarkMode(e.target.value as 'auto' | 'dark' | 'light')
            }
            style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '3px 6px',
              fontSize: 12,
            }}
          >
            <option value="auto">테마: 자동</option>
            <option value="light">테마: 라이트</option>
            <option value="dark">테마: 다크</option>
          </select>
        </span>
      </h1>
      <div className="hotkey-legend">
        <div>
          <b>마우스</b> · 좌클릭 = +1{' '}
          <span className="sep">·</span> 우클릭 = -1{' '}
          <span className="sep">·</span> 비-흔함 행의 <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+좌클릭 = 조합 시도{' '}
          <span className="sep">·</span> 가운데 클릭 = 정보 페이지
        </div>
        <div style={{ marginTop: 4 }}>
          <b>키보드</b> ·{' '}
          <kbd>/</kbd> 검색 팔레트 <span className="sep">·</span>{' '}
          <kbd>!</kbd> 후보 비교 <span className="sep">·</span>{' '}
          <kbd>Z</kbd> 되돌리기 <span className="sep">·</span>{' '}
          <kbd>Shift</kbd>+<kbd>Z</kbd> / <kbd>Y</kbd> 다시하기{' '}
          <span className="sep">·</span>{' '}
          <kbd>T</kbd> 전체 리셋
        </div>
        <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
          (검색 팔레트 안: <kbd>↑</kbd><kbd>↓</kbd> 이동 · <kbd>Enter</kbd> 추가/조합 ·{' '}
          <kbd>Alt</kbd>+<kbd>Enter</kbd> 직접 +1 · <kbd>Shift</kbd>+<kbd>Enter</kbd> -1 ·{' '}
          <kbd>?</kbd> 조합 트리 · <kbd>Esc</kbd> 닫기)
        </div>
        <div style={{ marginTop: 4 }}>
          <b>흔함 단축키</b> ·{' '}
          <kbd>Q</kbd>루피 <kbd>W</kbd>조로 <kbd>E</kbd>나미 <kbd>R</kbd>우솝{' '}
          <kbd>A</kbd>상디 <kbd>S</kbd>쵸파 <kbd>D</kbd>칼병 <kbd>F</kbd>총병{' '}
          <kbd>G</kbd>버기 <span className="sep">·</span>{' '}
          <kbd>Shift</kbd>+위 키 = -1
        </div>
      </div>
    </header>
  );
}

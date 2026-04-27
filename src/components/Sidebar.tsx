import { useApp } from '../store';
import { META } from '../data';
import { SkillSummary } from './SkillSummary';
import { ControlPanel } from './ControlPanel';
import { GradeColumn } from './GradeColumn';
import { ResizeHandle } from './ResizeHandle';

const MIN_W = 240;
const MAX_W = 600;
const MIN_H = 200;
const MAX_H = 600;

export function Sidebar() {
  const position = useApp(s => s.sidebarPosition);
  const width = useApp(s => s.sidebarWidth);
  const height = useApp(s => s.sidebarHeight);
  const collapsed = useApp(s => s.sidebarCollapsed);
  const setPosition = useApp(s => s.setSidebarPosition);
  const setWidth = useApp(s => s.setSidebarWidth);
  const setHeight = useApp(s => s.setSidebarHeight);
  const toggleCollapsed = useApp(s => s.toggleSidebarCollapsed);

  const isBottom = position === 'bottom';

  if (collapsed) {
    return (
      <button
        type="button"
        className={`sidebar-tab sidebar-tab-${position}`}
        onClick={toggleCollapsed}
        title="사이드바 펼치기"
      >
        {position === 'left' && '➡ 패 합산 · 흔함'}
        {position === 'right' && '⬅ 패 합산 · 흔함'}
        {position === 'bottom' && '⬆ 패 합산 · 흔함'}
      </button>
    );
  }

  const sizeStyle = isBottom ? { height } : { width };

  return (
    <aside className={`sidebar sidebar-${position}`} style={sizeStyle}>
      <header className="sidebar-header">
        <span className="sidebar-title">패 합산 · 흔함</span>
        <div className="sidebar-pos-buttons">
          <button
            className={position === 'left' ? 'active' : ''}
            onClick={() => setPosition('left')}
            title="좌측"
            type="button"
          >
            ⬅
          </button>
          <button
            className={position === 'bottom' ? 'active' : ''}
            onClick={() => setPosition('bottom')}
            title="하단"
            type="button"
          >
            ⬇
          </button>
          <button
            className={position === 'right' ? 'active' : ''}
            onClick={() => setPosition('right')}
            title="우측"
            type="button"
          >
            ➡
          </button>
          <button
            onClick={toggleCollapsed}
            title="접기"
            type="button"
            className="sidebar-collapse-btn"
          >
            ✕
          </button>
        </div>
      </header>
      <div
        className={`sidebar-content sidebar-content-${isBottom ? 'horizontal' : 'vertical'}`}
      >
        <div className="sidebar-section">
          <SkillSummary />
        </div>
        <div className="sidebar-section">
          <ControlPanel />
        </div>
        <div className="sidebar-section sidebar-section-commons">
          <GradeColumn level={1} gradeName={META.levelToGrade['1']} />
        </div>
      </div>
      <ResizeHandle
        edge={
          position === 'left'
            ? 'right'
            : position === 'right'
            ? 'left'
            : 'top'
        }
        size={isBottom ? height : width}
        min={isBottom ? MIN_H : MIN_W}
        max={isBottom ? MAX_H : MAX_W}
        onResize={isBottom ? setHeight : setWidth}
      />
    </aside>
  );
}

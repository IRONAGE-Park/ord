import { useApp } from '../store';
import { META } from '../data';
import { SkillSummary } from './SkillSummary';
import { ControlPanel } from './ControlPanel';
import { GradeColumn } from './GradeColumn';
import { ResizeHandle } from './ResizeHandle';
import { LEFT_PANEL_GRADE_LEVELS } from '../constants';

const MIN_W = 240;
const MAX_W = 600;

export function Sidebar() {
  const width = useApp(s => s.sidebarWidth);
  const collapsed = useApp(s => s.sidebarCollapsed);
  const setWidth = useApp(s => s.setSidebarWidth);
  const toggleCollapsed = useApp(s => s.toggleSidebarCollapsed);

  if (collapsed) {
    return (
      <button
        type="button"
        className="sidebar-tab"
        onClick={toggleCollapsed}
        title="좌측 패널 펼치기"
      >
        ➜ 흔함 · 안흔함
      </button>
    );
  }

  return (
    <aside className="sidebar" style={{ width }}>
      <header className="sidebar-header">
        <span className="sidebar-title">패 합산 · 흔함 / 안흔함</span>
        <button
          onClick={toggleCollapsed}
          title="접기"
          type="button"
          className="sidebar-collapse-btn"
        >
          ✕
        </button>
      </header>
      <div className="sidebar-content">
        <div className="sidebar-section">
          <SkillSummary />
        </div>
        <div className="sidebar-section">
          <ControlPanel />
        </div>
        <div className="sidebar-section sidebar-section-grades">
          {LEFT_PANEL_GRADE_LEVELS.map(level => (
            <GradeColumn
              key={level}
              level={level}
              gradeName={META.levelToGrade[String(level)] ?? `Lv${level}`}
            />
          ))}
        </div>
      </div>
      <ResizeHandle
        edge="right"
        size={width}
        min={MIN_W}
        max={MAX_W}
        onResize={setWidth}
      />
    </aside>
  );
}

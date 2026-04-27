import { GradeColumn } from './GradeColumn';
import { META } from '../data';
import { PRIMARY_GRADE_LEVELS, SECONDARY_GRADE_LEVELS } from '../constants';

export function GradeGrid() {
  return (
    <section className="grade-grid">
      <div className="grade-row">
        {/* 흔함(level 1)은 사이드바로 이동했으므로 여기서는 제외 */}
        {PRIMARY_GRADE_LEVELS.filter(l => l !== 1).map(level => (
          <GradeColumn
            key={level}
            level={level}
            gradeName={META.levelToGrade[String(level)] ?? `Lv${level}`}
          />
        ))}
      </div>

      <div className="grade-row">
        {SECONDARY_GRADE_LEVELS.map(level => (
          <GradeColumn
            key={level}
            level={level}
            gradeName={META.levelToGrade[String(level)] ?? `Lv${level}`}
          />
        ))}
      </div>
    </section>
  );
}

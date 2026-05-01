import { GradeColumn } from './GradeColumn';
import { META } from '../data';
import { CENTER_GRADE_LEVELS } from '../constants';

export function GradeGrid() {
  return (
    <section className="grade-grid">
      <div className="grade-row">
        {CENTER_GRADE_LEVELS.map(level => (
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

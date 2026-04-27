import { UNITS } from './data';
import type { Unit } from './types';

function normalize(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase();
}

export function matchUnit(unit: Unit, query: string): boolean {
  if (!query) return false;
  if (!unit.name) return false;
  const n = normalize(unit.name);
  const q = normalize(query);
  return n.includes(q);
}

/**
 * 검색어와 가장 잘 맞는 유닛 한 개를 반환.
 * 우선순위: 정확 일치 > startsWith > includes,
 * 동률일 때는 등급 낮은 순(흔함이 우선) → 이름순.
 */
export function findFirstMatch(query: string): Unit | null {
  if (!query) return null;
  const q = normalize(query);

  let exact: Unit | null = null;
  let starts: Unit | null = null;
  let contains: Unit | null = null;

  for (const u of UNITS) {
    if (!u.name) continue;
    const n = normalize(u.name);
    if (n === q) {
      if (!exact || worseRank(exact, u)) exact = u;
    } else if (n.startsWith(q)) {
      if (!starts || worseRank(starts, u)) starts = u;
    } else if (n.includes(q)) {
      if (!contains || worseRank(contains, u)) contains = u;
    }
  }

  return exact ?? starts ?? contains;
}

function worseRank(current: Unit, candidate: Unit): boolean {
  // candidate가 "더 좋다"고 판단하면 true 반환 → caller 가 candidate로 교체
  const ca = current.level ?? 99;
  const ne = candidate.level ?? 99;
  if (ne !== ca) return ne < ca;
  if (!current.name || !candidate.name) return false;
  return candidate.name.localeCompare(current.name, 'ko') < 0;
}

/**
 * 매치되는 모든 유닛을 우선순위 순으로 반환.
 * 정확 일치 → startsWith → contains 순, 동률은 등급 낮은 순 → 이름순.
 */
export function findMatches(query: string, limit = 12): Unit[] {
  if (!query) return [];
  const q = normalize(query);

  const exact: Unit[] = [];
  const starts: Unit[] = [];
  const contains: Unit[] = [];

  for (const u of UNITS) {
    if (!u.name) continue;
    const n = normalize(u.name);
    if (n === q) exact.push(u);
    else if (n.startsWith(q)) starts.push(u);
    else if (n.includes(q)) contains.push(u);
  }

  const cmp = (a: Unit, b: Unit) => {
    const al = a.level ?? 99;
    const bl = b.level ?? 99;
    if (al !== bl) return al - bl;
    return (a.name ?? '').localeCompare(b.name ?? '', 'ko');
  };
  exact.sort(cmp);
  starts.sort(cmp);
  contains.sort(cmp);

  return [...exact, ...starts, ...contains].slice(0, limit);
}

import unitsRaw from './data/units.json';
import recipesRaw from './data/recipes.json';
import metaRaw from './data/meta.json';
import type { Unit, Recipe, Meta } from './types';

export const UNITS = unitsRaw as Unit[];
export const RECIPES = recipesRaw as Recipe[];
export const META = metaRaw as Meta;

const unitsById = new Map<number, Unit>();
for (const u of UNITS) unitsById.set(u.id, u);

const recipesById = new Map<number, Recipe>();
for (const r of RECIPES) recipesById.set(r.id, r);

export function getUnit(id: number): Unit | undefined {
  return unitsById.get(id);
}

export function getRecipe(id: number): Recipe | undefined {
  return recipesById.get(id);
}

export function unitsByLevel(level: number): Unit[] {
  const filtered = UNITS.filter(u => u.level === level);
  // 흔함(레벨 1)은 단축키 순서 = id 오름차순으로 고정
  // (Q→1 루피, W→2 조로, E→3 나미, R→4 우솝,
  //  A→5 상디, S→6 쵸파, D→7 칼병, F→8 총병, G→9 버기)
  if (level === 1) {
    return filtered.sort((a, b) => a.id - b.id);
  }
  return filtered.sort((a, b) => {
    if (!a.name) return 1;
    if (!b.name) return -1;
    return a.name.localeCompare(b.name, 'ko');
  });
}

// 직접적인 재료(첫 깊이)만 반환 — 즉시 조합 가능한지 판단할 때 사용
export function getDirectMaterials(id: number): { id: number; count: number }[] {
  const r = getRecipe(id);
  if (!r) return [];
  return r.materials.map(m => ({ id: m.id, count: m.count }));
}

// 최하위 재료(흔함, 목재 등 base) — 트리 평탄화 결과
export function getLowestMaterials(id: number): { id: number; count: number }[] {
  const r = getRecipe(id);
  if (!r) return [];
  return r.lowestMaterials;
}

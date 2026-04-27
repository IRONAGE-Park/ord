import { getRecipe, getUnit } from './data';
import type { Deck } from './store';

export interface ProgressResult {
  /** %A — 단순 재료 기준. 흔함만 있어도 leaf만 다 채우면 100% */
  materialProgress: number;
  /** %B — 재료 + 조합 단계 모두 반영. 흔함만 있으면 100%가 되지 않음 */
  totalProgress: number;
}

/**
 * 빈 덱 가정으로 1개 만드는 데 필요한 총 "작업량".
 * 작업량 = (조합 단계 수) + (leaf 재료 수).
 * 단, 루트의 combine 단계는 제외 (= 직접 재료가 다 모이면 즉시 조합 가능 → 100%).
 */
function totalWorkFor(targetId: number, count: number): number {
  const recipe = getRecipe(targetId);
  if (!recipe || recipe.materials.length === 0) {
    return count; // leaf
  }
  // 루트(혹은 sub recipe의 머터리얼들)에 대한 재귀 진입.
  // workForSubtree는 root 자신의 combine 비용은 포함시키지 않는다.
  let total = 0;
  for (const m of recipe.materials) {
    total += workForSubtree(m.id, m.count * count);
  }
  return total;
}

/** 하위 트리: 자기 자신의 combine 비용 + 재료 비용 모두 포함 (재귀의 일반 케이스) */
function workForSubtree(id: number, count: number): number {
  const recipe = getRecipe(id);
  if (!recipe || recipe.materials.length === 0) {
    return count; // leaf
  }
  let total = count; // 이 단계의 combine 횟수
  for (const m of recipe.materials) {
    total += workForSubtree(m.id, m.count * count);
  }
  return total;
}

/**
 * 현재 deck을 가진 상태에서 1개 만들기 위해 남아있는 작업량.
 * 루트는 deck에서 차감하지 않으며(새로 만드는 게 목적),
 * 루트 자신의 combine 단계도 작업량에서 제외 — 직접 재료가 모이면 0이 되어야 함.
 */
function workRemainingFor(targetId: number, count: number, deck: Deck): number {
  const work: Record<number, number> = { ...deck };
  function rec(id: number, need: number, isRoot: boolean): number {
    if (!isRoot) {
      const have = work[id] ?? 0;
      const used = Math.min(have, need);
      work[id] = have - used;
      need -= used;
    }
    if (need === 0) return 0;
    const recipe = getRecipe(id);
    if (!recipe || recipe.materials.length === 0) {
      return need; // 부족한 leaf
    }
    // 루트는 자기 combine 비용을 0, 비루트는 need.
    let total = isRoot ? 0 : need;
    for (const m of recipe.materials) {
      total += rec(m.id, m.count * need, false);
    }
    return total;
  }
  return rec(targetId, count, true);
}

export function progressFor(targetId: number, deck: Deck): ProgressResult {
  const recipe = getRecipe(targetId);
  if (!recipe || recipe.materials.length === 0) {
    // leaf 자체에는 진행률 개념이 없음
    return { materialProgress: 1, totalProgress: 1 };
  }

  // %A: leaf 재료만 본 진행률 (deficit 기반)
  let totalLeavesNeeded = 0;
  for (const lm of recipe.lowestMaterials) totalLeavesNeeded += lm.count;
  const def = deficitFor(targetId, 1, deck);
  const materialProgress =
    totalLeavesNeeded > 0
      ? Math.max(0, Math.min(1, 1 - def.total / totalLeavesNeeded))
      : 1;

  // %B: 재료 + 조합 단계 합산 진행률
  const totalWork = totalWorkFor(targetId, 1);
  const remaining = workRemainingFor(targetId, 1, deck);
  const totalProgress =
    totalWork > 0
      ? Math.max(0, Math.min(1, (totalWork - remaining) / totalWork))
      : 1;

  return { materialProgress, totalProgress };
}

export interface DeficitResult {
  /** 추가로 필요한 leaf 재료 (id → 부족 갯수) */
  missing: Record<number, number>;
  /** deck에서 빠져나갈 leaf 재료 (id → 사용 갯수). 중간 재료 사용은 제외. */
  usedFromDeck: Record<number, number>;
  /** 부족 갯수 합계 (모든 leaf) */
  total: number;
  /** 부족분 중 흔함(level 1)만 합산 */
  totalCommonsMissing: number;
  /** 부족분 중 흔함이 아닌 leaf만 합산 (목재/골드 등) */
  totalNonCommonMissing: number;
  /** deck에서 사용될 leaf 중 흔함만 합산 */
  totalCommonsUsedFromDeck: number;
}

/**
 * 현재 deck을 고려해 targetId 유닛을 count개 만들기 위해
 * 추가로 필요한 최하위 재료를 계산.
 *
 * 알고리즘 (greedy DFS):
 * 1. 루트는 deck에서 차감하지 않는다 (새로 만드는 게 목적).
 * 2. 하위 재료는 deck에 있으면 사용, 부족분만 재귀로 분해.
 * 3. leaf(흔함, 목재 등)에 도달했을 때 deck에서 빼간 만큼 → usedFromDeck,
 *    그래도 부족한 만큼 → missing.
 */
export function deficitFor(
  targetId: number,
  count: number,
  deck: Deck
): DeficitResult {
  const work: Record<number, number> = { ...deck };
  const missing: Record<number, number> = {};
  const usedFromDeck: Record<number, number> = {};

  function consume(id: number, need: number, isRoot: boolean) {
    let usedHere = 0;
    if (!isRoot) {
      const have = work[id] ?? 0;
      usedHere = Math.min(need, have);
      work[id] = have - usedHere;
      need -= usedHere;
    }
    const recipe = getRecipe(id);
    const isLeaf = !recipe || recipe.materials.length === 0;

    if (!isRoot && isLeaf && usedHere > 0) {
      usedFromDeck[id] = (usedFromDeck[id] ?? 0) + usedHere;
    }

    if (need === 0) return;

    if (isLeaf) {
      missing[id] = (missing[id] ?? 0) + need;
      return;
    }
    for (const m of recipe!.materials) {
      consume(m.id, m.count * need, false);
    }
  }

  consume(targetId, count, true);

  let total = 0;
  let totalCommonsMissing = 0;
  let totalNonCommonMissing = 0;
  for (const [idStr, c] of Object.entries(missing)) {
    total += c;
    const u = getUnit(parseInt(idStr, 10));
    if (u && u.level === 1) totalCommonsMissing += c;
    else totalNonCommonMissing += c;
  }
  let totalCommonsUsedFromDeck = 0;
  for (const [idStr, c] of Object.entries(usedFromDeck)) {
    const u = getUnit(parseInt(idStr, 10));
    if (u && u.level === 1) totalCommonsUsedFromDeck += c;
  }

  return {
    missing,
    usedFromDeck,
    total,
    totalCommonsMissing,
    totalNonCommonMissing,
    totalCommonsUsedFromDeck,
  };
}

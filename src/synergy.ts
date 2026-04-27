import { getUnit, META } from './data';
import type { Deck } from './store';
import type { FlagKey, Unit } from './types';

export interface DeckProfile {
  /** 덱 내 유닛들의 좋아요 합 (마법/물리/스토리) */
  mateSum: { magic: number; physical: number; story: number };
  /** 각 스킬 flag별 보유 유닛 수 (count 합산) */
  flagCounts: Record<FlagKey, number>;
  /** 덱의 전체 유닛 갯수 (count 합산) */
  totalUnits: number;
  /** 가장 우세한 좋아요 타입 */
  dominantMate: 'magic' | 'physical' | 'story' | null;
}

export interface SynergyResult {
  /** 종합 시너지 점수 (mate + skill stacking) */
  total: number;
  /** 좋아요 정렬 점수: target의 mate × deck의 mate 합 (dot product) */
  mateScore: number;
  /** 스킬 적층 점수: target이 보유한 flag의 deck 보유 수 합 × 가중치 */
  skillScore: number;
  /** target 보유 flag 중 deck에도 1개 이상 있는 것 (시너지 한눈) */
  sharedSkills: { key: FlagKey; deckCount: number }[];
}

const SKILL_WEIGHT = 2;

export function profileDeck(deck: Deck): DeckProfile {
  const mateSum = { magic: 0, physical: 0, story: 0 };
  const flagCounts = {} as Record<FlagKey, number>;
  for (const k of META.flagKeys) flagCounts[k] = 0;
  let totalUnits = 0;

  for (const [idStr, count] of Object.entries(deck)) {
    const u = getUnit(parseInt(idStr, 10));
    if (!u) continue;
    totalUnits += count;
    mateSum.magic += u.mate.magic * count;
    mateSum.physical += u.mate.physical * count;
    mateSum.story += u.mate.story * count;
    for (const k of META.flagKeys) {
      if (u.flags[k]) flagCounts[k] += count;
    }
  }

  let dominantMate: DeckProfile['dominantMate'] = null;
  const m = Math.max(mateSum.magic, mateSum.physical, mateSum.story);
  if (m > 0) {
    if (mateSum.magic === m) dominantMate = 'magic';
    else if (mateSum.physical === m) dominantMate = 'physical';
    else dominantMate = 'story';
  }

  return { mateSum, flagCounts, totalUnits, dominantMate };
}

export function synergyFor(target: Unit, profile: DeckProfile): SynergyResult {
  const mateScore =
    target.mate.magic * profile.mateSum.magic +
    target.mate.physical * profile.mateSum.physical +
    target.mate.story * profile.mateSum.story;

  const sharedSkills: { key: FlagKey; deckCount: number }[] = [];
  let skillStack = 0;
  for (const k of META.flagKeys) {
    if (target.flags[k] && profile.flagCounts[k] > 0) {
      skillStack += profile.flagCounts[k];
      sharedSkills.push({ key: k, deckCount: profile.flagCounts[k] });
    }
  }
  sharedSkills.sort((a, b) => b.deckCount - a.deckCount);

  const skillScore = skillStack * SKILL_WEIGHT;
  return {
    total: mateScore + skillScore,
    mateScore,
    skillScore,
    sharedSkills,
  };
}

/**
 * 시너지 + 만들기 쉬움을 결합한 추천 점수.
 * 부족 leaf 1개당 페널티 (-DEFICIT_PENALTY) 부과.
 */
const DEFICIT_PENALTY = 2;
export function recommendScore(synergyTotal: number, deficitTotal: number): number {
  return synergyTotal - deficitTotal * DEFICIT_PENALTY;
}

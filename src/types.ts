export type FlagKey =
  | 'armorbreak'
  | 'berserk'
  | 'blink'
  | 'bombup'
  | 'boss'
  | 'damageb'
  | 'docking'
  | 'ignore'
  | 'last'
  | 'life'
  | 'mshield'
  | 'rangellpd'
  | 'rangenlpd'
  | 'rangetlpd'
  | 'regen'
  | 'shield'
  | 'single'
  | 'sky'
  | 'slow'
  | 'speedb'
  | 'splash'
  | 'sstun'
  | 'stun'
  | 'udelete';

export type FilterKey = FlagKey | 'singlelost' | 'all';

export interface Mate {
  magic: number;
  physical: number;
  story: number;
}

export interface Unit {
  id: number;
  name: string | null;
  icon: string;
  level: number | null;
  grade: string | null;
  flags: Record<FlagKey, boolean>;
  mate: Mate;
  skills: string | null;
  incomplete: boolean;
}

export interface MaterialNode {
  id: number;
  count: number;
  materials: MaterialNode[];
}

export interface LowestMaterial {
  id: number;
  count: number;
}

export interface Recipe {
  id: number;
  materials: MaterialNode[];
  lowestMaterials: LowestMaterial[];
}

export interface Meta {
  source: string;
  extractedAt: string;
  totals: {
    units: number;
    recipes: number;
    completeUnits: number;
    incompleteUnits: number;
  };
  levelToGrade: Record<string, string>;
  flagDictionary: Record<FlagKey, string>;
  flagKeys: FlagKey[];
  forceEtcUnits: number[];
}

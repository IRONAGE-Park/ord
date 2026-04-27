import type { FilterKey } from './types';

export const ICON_BASE_URL = 'https://ordsearch.b-cdn.net/images/units/ord/icons';

// 등급 색상 (원본 페이지의 표/배경색 매핑)
export const GRADE_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#bdffbd', text: '#2c5e2c' },     // 흔함 — 연두
  2: { bg: '#a4e8a4', text: '#1f4d1f' },     // 안흔함
  3: { bg: '#5b9bff', text: '#fff' },        // 특별함 — 파랑
  4: { bg: '#a07ad8', text: '#fff' },        // 희귀함 — 보라
  5: { bg: '#ffb84d', text: '#5a2e00' },     // 전설적인 — 주황
  6: { bg: '#ff7a7a', text: '#5a0000' },     // 히든조합 — 빨강
  7: { bg: '#ff5fa8', text: '#fff' },        // 왜곡됨 — 핫핑크
  8: { bg: '#9bd1ff', text: '#003d66' },     // 변화된 — 하늘
  9: { bg: '#d3a3ff', text: '#3d0066' },     // 제한됨 — 라일락
  10: { bg: '#ffd24d', text: '#3d2e00' },    // 초월함 — 골드
  11: { bg: '#1a1a1a', text: '#ffd24d' },    // 불멸의 — 검정/금
  12: { bg: '#2a3f5f', text: '#cfe1ff' },    // 영원한 — 짙은 파랑
  14: { bg: '#bfa78c', text: '#2e1f0f' },    // 기타 — 베이지
  15: { bg: '#7be0c2', text: '#003d2e' },    // 특수함 — 민트
  16: { bg: '#ffa8c5', text: '#5a0d2c' },    // 랜덤전용 — 분홍
  18: { bg: '#a0a0a0', text: '#0d0d0d' },    // 신비함 — 회색
  19: { bg: '#e8b8e8', text: '#3d0d3d' },    // 기록지침 — 라벤더
  20: { bg: '#f0e5b5', text: '#3d3300' },    // 연구소 — 베이지옐로우
  22: { bg: '#c4c4c4', text: '#0d0d0d' },    // 아이템 — 그레이
};

// 메인 패널에 노출되는 등급 컬럼 순서 (원본 페이지 동일)
export const PRIMARY_GRADE_LEVELS = [1, 3, 4, 5, 6, 8, 10, 11, 15];
// 보조(접힘) 컬럼 — 펼치면 표시
export const SECONDARY_GRADE_LEVELS = [2, 7, 9, 12, 14, 16, 18, 19, 20, 22];

// 필터 정의 (라벨 + 약칭). 원본 페이지와 동일한 정렬 순서.
export const FILTER_OPTIONS: { key: FilterKey; label: string; alias?: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'damageb', label: '공격력 버프', alias: '공증' },
  { key: 'speedb', label: '공격속도 버프', alias: '공속' },
  { key: 'sky', label: '공중이동', alias: '공중이동' },
  { key: 'berserk', label: '광폭화 특화', alias: '광폭화' },
  { key: 'sstun', label: '단일 적 스턴', alias: '단일스턴' },
  { key: 'singlelost', label: '단일 적 잃은체력 %데미지', alias: '단일-잃퍼' },
  { key: 'last', label: '단일 적 전체체력 %데미지', alias: '끝딜' },
  { key: 'single', label: '단일 적 현재체력 %데미지', alias: '단일' },
  { key: 'regen', label: '마나회복', alias: '마나젠' },
  { key: 'docking', label: '마법데미지 증폭', alias: '도킹' },
  { key: 'mshield', label: '마법방어력 감소', alias: '마방깍' },
  { key: 'shield', label: '방어력 감소', alias: '방깍' },
  { key: 'ignore', label: '방어무시 데미지', alias: '방무뎀' },
  { key: 'rangellpd', label: '범위 적 잃은체력 %데미지', alias: '범퍼-잃퍼' },
  { key: 'rangetlpd', label: '범위 적 전체체력 %데미지', alias: '범퍼-전퍼' },
  { key: 'rangenlpd', label: '범위 적 현재체력 %데미지', alias: '범퍼-현퍼' },
  { key: 'stun', label: '범위스턴', alias: '스턴' },
  { key: 'boss', label: '보스특화', alias: '보스' },
  { key: 'blink', label: '순간이동', alias: '순간이동' },
  { key: 'splash', label: '스플래시 데미지', alias: '스플뎀' },
  { key: 'armorbreak', label: '아머브레이크', alias: '암브' },
  { key: 'udelete', label: '유닛삭제', alias: '삭제' },
  { key: 'slow', label: '이동속도 감소', alias: '이감' },
  { key: 'life', label: '체력회복', alias: '체젠' },
  { key: 'bombup', label: '폭발형 데미지 증폭', alias: '폭발형 증폭' },
];

// 흔함 단축키 매핑 (Q W E R A S D F G → 1..9)
export const COMMON_HOTKEYS: Record<string, number> = {
  q: 1, // 루피
  w: 2, // 조로
  e: 3, // 나미
  r: 4, // 우솝
  a: 5, // 상디
  s: 6, // 쵸파
  d: 7, // 칼병
  f: 8, // 총병
  g: 9, // 버기
};

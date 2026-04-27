const fs = require('fs');
const path = require('path');

const HELPER_HTML = path.join(__dirname, '_source', '_source.html');
const COMMON_HTML = path.join(__dirname, '_source', '_common.html');
const MIX_HTML = path.join(__dirname, '_source', '_mix.html');

const html = fs.readFileSync(HELPER_HTML, 'utf8');
const commonHtml = fs.readFileSync(COMMON_HTML, 'utf8');
const mixHtml = fs.readFileSync(MIX_HTML, 'utf8');

function decodeHtml(s) {
  if (!s) return s;
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
function stripTags(s) {
  return s.replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim();
}

// Level (number) → grade label (Korean)
const LEVEL_TO_GRADE = {
  1: '흔함',
  2: '안흔함',
  3: '특별함',
  4: '희귀함',
  5: '전설적인',
  6: '히든조합',
  7: '왜곡됨',
  8: '변화된',
  9: '제한됨',
  10: '초월함',
  11: '불멸의',
  12: '영원한',
  14: '기타',
  15: '특수함',
  16: '랜덤전용',
  18: '신비함',
  19: '기록지침',
  20: '연구소',
  22: '아이템',
};

// English-friendly snake_case keys for the boolean flags (for TS clarity)
// Korean tooltip strings observed:
//   shield → 쉴드 (물리쉴드?), mshield → 마법쉴드
//   slow → 이동속도 감소 (이감), stun → 스턴
//   docking → 도킹, regen → 체력재생
//   damageb → 데미지 버프, speedb → 공속 버프
//   sky → 비행, blink → 점멸, boss → 보스
//   ignore → 방무, single → 단일, last → 마지막
//   life → 부활/생명, splash → 스플래시
//   rangenlpd / rangetlpd / rangellpd → 범위 데미지 변종
//   sstun → 단일스턴, armorbreak → 방어구 파괴, udelete → 유닛삭제
//   berserk → 광폭, bombup → 폭발 강화

// 1) Build name map from all 3 sources
const namesById = {};
function readNames(htmlSrc) {
  const re = /<a[^>]*href="\/characters\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(htmlSrc))) {
    const id = parseInt(m[1], 10);
    const inner = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!inner) continue;
    const cleaned = inner.replace(/\s+\d+$/, '').trim();
    if (!cleaned) continue;
    if (!namesById[id] || cleaned.length < namesById[id].length) {
      namesById[id] = cleaned;
    }
  }
}
readNames(commonHtml);
readNames(mixHtml);
readNames(html);

// Manual fills for units that aren't in helper grid or recipe-link tables
const MANUAL_NAMES = {
  138: '확장팩',
  140: '장군좀비',
};
for (const [id, name] of Object.entries(MANUAL_NAMES)) {
  if (!namesById[id]) namesById[id] = name;
}

// 2) Helper-row data (flags + mate + skills + grade)
const helperData = {};
const blocks = html.split(/(?=<tr id="helperUnit\d+")/);
for (const block of blocks) {
  const idM = block.match(/^<tr id="helperUnit(\d+)"([\s\S]*)/);
  if (!idM) continue;
  const id = parseInt(idM[1], 10);
  const body = idM[2];

  const trAttrs = {};
  const trHead = body.match(/^[\s\S]*?>/)[0];
  for (const am of trHead.matchAll(/data-([a-zA-Z-]+)="([^"]*)"/g)) {
    trAttrs[am[1]] = am[2];
  }

  const buttonMatch = body.match(/data-origin-name="([^"]*)"[\s\S]*?data-level="([^"]*)"[\s\S]*?data-level-text="([^"]*)"/);
  const originName = buttonMatch ? buttonMatch[1] : null;
  const levelText = buttonMatch ? decodeHtml(buttonMatch[3]) : null;

  const imgMatch = body.match(/icons\/([^"?]+)(\?[^"]*)?"/);
  const icon = imgMatch ? imgMatch[1] : null;

  const mateTitleMatch = body.match(/data-mate-title="([^"]*)"/);
  const mateTitleRaw = mateTitleMatch ? decodeHtml(mateTitleMatch[1]) : '';
  const mateTitleText = stripTags(mateTitleRaw);

  const titleMatch = body.match(/\stitle="([^"]*)"/);
  const fullTitleRaw = titleMatch ? decodeHtml(titleMatch[1]) : '';
  const fullTitleText = stripTags(fullTitleRaw);

  const mDmgLike = (mateTitleText.match(/마법데미지로\s*좋아요\s*(-?\d+)/) || [, '0'])[1];
  const pDmgLike = (mateTitleText.match(/물리데미지로\s*좋아요\s*(-?\d+)/) || [, '0'])[1];
  const storyLike = (mateTitleText.match(/스토리로\s*좋아요\s*(-?\d+)/) || [, '0'])[1];

  let skillsText = fullTitleText;
  if (mateTitleText && skillsText.startsWith(mateTitleText)) {
    skillsText = skillsText.slice(mateTitleText.length).trim();
  } else {
    const lines = skillsText.split('\n');
    skillsText = lines.slice(3).join('\n').trim();
  }

  const flags = {};
  for (const k of Object.keys(trAttrs)) {
    if (['unit-id', 'level'].includes(k)) continue;
    if (trAttrs[k] === 'Y' || trAttrs[k] === 'N') {
      flags[k] = trAttrs[k] === 'Y';
    }
  }

  helperData[id] = {
    originName,
    icon,
    level: trAttrs.level ? parseInt(trAttrs.level, 10) : null,
    levelText,
    flags,
    mate: {
      magic: parseInt(mDmgLike, 10) || 0,
      physical: parseInt(pDmgLike, 10) || 0,
      story: parseInt(storyLike, 10) || 0,
    },
    skillsText: skillsText || null,
    rawAttrs: trAttrs,
  };
}

// 3) Recipes — re-parse from source HTML each time so we don't depend on
//    a previous run's output file (which we'll overwrite below).
const recipeMatch = html.match(/var totalInfoJsonString = `([\s\S]*?)`;/);
if (!recipeMatch) throw new Error('totalInfoJsonString not found in source HTML');
const recipes = JSON.parse(recipeMatch[1]);

// 4) All unit IDs we should include: helperData ∪ recipes (keys + materials).
//    Do NOT include namesById — it has stray IDs from unrelated /characters/ links
//    in tooltips, sidebars, comments, etc.
const allIds = new Set();
for (const k of Object.keys(helperData)) allIds.add(parseInt(k, 10));
for (const k of Object.keys(recipes)) allIds.add(parseInt(k, 10));
function collect(obj) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) {
      const num = parseInt(k, 10);
      if (!isNaN(num)) allIds.add(num);
      collect(obj[k]);
    }
  }
}
for (const k of Object.keys(recipes)) collect(recipes[k].materials);

// 5) For 흔함 units 1-9 we know level=1
const FALLBACK_LEVEL = {
  1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1,
  138: 14, // 확장팩 (기타)
  140: 5,  // 장군좀비 (전설적인)
};

// 6) Build the unified units array
const flagKeys = new Set();
for (const id of Object.keys(helperData)) {
  for (const k of Object.keys(helperData[id].flags)) flagKeys.add(k);
}
const ALL_FLAG_KEYS = [...flagKeys].sort();

const units = [];
for (const id of [...allIds].sort((a, b) => a - b)) {
  const helper = helperData[id];
  const name = (helper && helper.originName) || namesById[id] || null;
  const level = helper && helper.level != null
    ? helper.level
    : (FALLBACK_LEVEL[id] || null);
  const levelText = (helper && helper.levelText) || (level != null ? LEVEL_TO_GRADE[level] : null);
  const icon = (helper && helper.icon) || `${id}.png`;

  const flags = {};
  for (const k of ALL_FLAG_KEYS) {
    flags[k] = helper ? !!helper.flags[k] : false;
  }

  units.push({
    id,
    name,
    icon,
    level,
    grade: levelText,
    flags,
    mate: helper ? helper.mate : { magic: 0, physical: 0, story: 0 },
    skills: helper ? helper.skillsText : null,
    incomplete: !helper,
  });
}

// 7) Build the recipes array (more code-friendly)
function flattenMaterials(mats) {
  if (!mats || Array.isArray(mats)) return [];
  return Object.entries(mats).map(([id, info]) => ({
    id: parseInt(id, 10),
    count: info.count || 1,
    materials: info.materials ? flattenMaterials(info.materials) : [],
  }));
}
const recipesArray = Object.entries(recipes).map(([id, info]) => {
  const lowest = info.lowestMaterials && !Array.isArray(info.lowestMaterials)
    ? Object.entries(info.lowestMaterials).map(([mid, count]) => ({ id: parseInt(mid, 10), count }))
    : [];
  return {
    id: parseInt(id, 10),
    materials: flattenMaterials(info.materials),
    lowestMaterials: lowest,
  };
}).sort((a, b) => a.id - b.id);

// 8) Write outputs
fs.writeFileSync(path.join(__dirname, 'units.json'), JSON.stringify(units, null, 2));
fs.writeFileSync(path.join(__dirname, 'recipes.json'), JSON.stringify(recipesArray, null, 2));

const flagDictionary = {
  shield: '물리 쉴드',
  mshield: '마법 쉴드',
  slow: '이동속도 감소 (이감)',
  stun: '스턴',
  sstun: '단일 스턴',
  docking: '도킹',
  regen: '체력 재생',
  damageb: '공격력 버프',
  speedb: '공격속도 버프',
  sky: '비행 (공중) 공격',
  blink: '점멸',
  boss: '보스 데미지 / 보스킬러',
  ignore: '방어 무시 / 방어 무시 데미지',
  single: '단일 적 데미지 / 단일 공격',
  last: '마지막 적 처치 보너스',
  life: '부활 / 생존 스킬',
  rangenlpd: '범위 데미지 (일반)',
  rangetlpd: '범위 데미지 (대상)',
  rangellpd: '범위 데미지 (장거리)',
  splash: '스플래시 (광역)',
  armorbreak: '방어구 파괴',
  udelete: '유닛 삭제',
  berserk: '광폭화',
  bombup: '폭발 강화',
};

const meta = {
  source: 'https://ordsearch.net/mix/helper',
  extractedAt: new Date().toISOString(),
  totals: {
    units: units.length,
    recipes: recipesArray.length,
    completeUnits: units.filter(u => !u.incomplete).length,
    incompleteUnits: units.filter(u => u.incomplete).length,
  },
  levelToGrade: LEVEL_TO_GRADE,
  flagDictionary,
  flagKeys: ALL_FLAG_KEYS,
  forceEtcUnits: [31, 124, 144, 168, 188],
};
fs.writeFileSync(path.join(__dirname, 'meta.json'), JSON.stringify(meta, null, 2));

console.log('Wrote units.json (' + units.length + ' units)');
console.log('Wrote recipes.json (' + recipesArray.length + ' recipes)');
console.log('Wrote meta.json');
console.log('Incomplete (need additional fetch):', units.filter(u => u.incomplete).map(u => `${u.id}:${u.name}`));

// Quick grade histogram
const histo = {};
for (const u of units) {
  const k = `${u.level}|${u.grade}`;
  histo[k] = (histo[k] || 0) + 1;
}
console.log('Grade histogram:', histo);

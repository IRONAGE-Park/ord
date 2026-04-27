const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '_source.html'), 'utf8');

const outDir = path.resolve(__dirname);
fs.mkdirSync(outDir, { recursive: true });

// 1) totalInfoJsonString - 조합식 (재료 트리)
const recipeMatch = html.match(/var totalInfoJsonString = `([\s\S]*?)`;/);
if (recipeMatch) {
  const data = JSON.parse(recipeMatch[1]);
  fs.writeFileSync(path.join(outDir, 'recipes.json'), JSON.stringify(data, null, 2));
  console.log('recipes:', Object.keys(data).length, 'units');
} else {
  console.error('totalInfoJsonString NOT FOUND');
}

// 다른 임베드 JSON/var 도 추출
const allVarStrings = [...html.matchAll(/var\s+([a-zA-Z_][\w]*)\s*=\s*`([\s\S]*?)`;/g)];
console.log('backtick-var count:', allVarStrings.length);
allVarStrings.forEach(m => console.log(' -', m[1], 'len=', m[2].length));

const allVarObjects = [...html.matchAll(/var\s+([a-zA-Z_][\w]*)\s*=\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*;/g)];
console.log('object/array-var count:', allVarObjects.length);
allVarObjects.slice(0, 30).forEach(m => console.log(' -', m[1], 'len=', m[2].length));

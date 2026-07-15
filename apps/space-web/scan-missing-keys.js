const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const APP_LOCALES = path.join(ROOT, 'apps/space-web/src/locales');
const SHARED_LOCALES = path.join(ROOT, 'packages/shared/src/locales');
const CONSUMER_LOCALES = path.join(ROOT, 'apps/consumer-web/src/locales');
const APP_SRC = path.join(ROOT, 'apps/space-web/src');
const SHARED_SRC = path.join(ROOT, 'packages/shared/src');

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    let stat;
    try { stat = fs.statSync(p); } catch { continue; }
    if (stat.isDirectory()) walk(p, files);
    else if (/\.tsx?$/.test(f)) files.push(p);
  }
  return files;
}

function flatten(obj, prefix = '', out = {}) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? prefix + '.' + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out);
      else out[p] = v;
    }
  }
  return out;
}

const allLocaleFiles = [];
function collectLocaleFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) collectLocaleFiles(p);
    else if (/(en|vi)\.json$/.test(f)) allLocaleFiles.push(p);
  }
}
[APP_LOCALES, SHARED_LOCALES, CONSUMER_LOCALES].forEach(collectLocaleFiles);

console.log('Locale files:', allLocaleFiles.length);

const nsMap = {};
for (const f of allLocaleFiles) {
  const m = f.match(/\/([a-z-]+)\/(en|vi)\.json$/);
  if (!m) continue;
  const ns = m[1];
  const lng = m[2];
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!nsMap[ns]) nsMap[ns] = {};
  if (!nsMap[ns][lng]) nsMap[ns][lng] = {};
  // Merge: later (consumer-web) overrides earlier
  Object.assign(nsMap[ns][lng], flatten(data));
}
console.log('Namespaces:', Object.keys(nsMap));
console.log('classroom en keys count:', Object.keys(nsMap.classroom?.en || {}).length);

const allFiles = [...walk(APP_SRC), ...walk(SHARED_SRC)];
console.log('All source files:', allFiles.length);

const missing = {};
let totalOk = 0;
let totalMissing = 0;

for (const f of allFiles) {
  const txt = fs.readFileSync(f, 'utf8');
  const matches = [...txt.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_.\-]+)['"]/g)];
  if (!matches.length) continue;
  for (const m of matches) {
    const key = m[1];
    let foundNs = null;
    for (const ns of Object.keys(nsMap)) {
      if (nsMap[ns].en && key in nsMap[ns].en) {
        foundNs = ns;
        break;
      }
    }
    if (foundNs) {
      totalOk++;
      continue;
    }
    // Try stripping first segment (e.g. 'auth.login.labels.title' -> 'login.labels.title')
    const parts = key.split('.');
    let altKey = key;
    if (parts.length > 1) {
      const candidate = parts.slice(1).join('.');
      for (const ns of Object.keys(nsMap)) {
        if (nsMap[ns].en && candidate in nsMap[ns].en) {
          totalOk++;
          foundNs = ns;
          break;
        }
      }
      if (foundNs) continue;
    }
    {
      const top = key.split('.')[0];
      let likelyNs = null;
      for (const ns of Object.keys(nsMap)) {
        if (nsMap[ns].en && nsMap[ns].en[top] !== undefined && typeof nsMap[ns].en[top] === 'object') {
          likelyNs = ns;
          break;
        }
      }
      const tag = likelyNs ? likelyNs : 'UNKNOWN';
      if (!missing[tag]) missing[tag] = { keysSet: new Set(), count: 0, files: new Set() };
      missing[tag].keysSet.add(key);
      missing[tag].count++;
      missing[tag].files.add(f);
      totalMissing++;
    }
  }
}

console.log('');
console.log('=== RESULT ===');
console.log('Total OK:', totalOk);
console.log('Total Missing:', totalMissing);
console.log('');
const sorted = Object.entries(missing).sort((a, b) => b[1].count - a[1].count);
for (const [tag, mdata] of sorted) {
  console.log('### ' + tag + ' (missing: ' + mdata.count + ', unique: ' + mdata.keysSet.size + ', files: ' + mdata.files.size + ')');
  for (const k of [...mdata.keysSet].sort()) console.log('  - ' + k);
  console.log('');
}

fs.writeFileSync('missing-keys-report.json', JSON.stringify({
  totalOk,
  totalMissing,
  byNamespace: Object.fromEntries(
    Object.entries(missing).map(([k, v]) => [k, {
      count: v.count,
      uniqueKeys: v.keysSet.size,
      files: v.files.size,
      keys: [...v.keysSet].sort(),
    }])
  )
}, null, 2));
console.log('Report saved to missing-keys-report.json');

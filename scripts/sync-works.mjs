// 구글 시트 CSV를 받아 public/works.json(로컬 개발용 스냅샷)을 갱신한다.
// 앱과 동일한 parseCSV 로직을 재사용한다.
// 사용: npm run sync-works
import { readFileSync, writeFileSync } from 'node:fs'
import { parseCSV } from '../src/utils/parseCSV.js'

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const match = envText.match(/^VITE_SHEETS_CSV_URL\s*=\s*(.+)$/m)
if (!match) {
  console.error('.env에 VITE_SHEETS_CSV_URL이 없습니다.')
  process.exit(1)
}
const url = match[1].trim()

const res = await fetch(url)
if (!res.ok) {
  console.error(`시트를 불러오지 못했습니다 (HTTP ${res.status})`)
  process.exit(1)
}
const csv = await res.text()
const data = parseCSV(csv)

const outPath = new URL('../public/works.json', import.meta.url)
writeFileSync(outPath, JSON.stringify(data, null, 2))

const byCurriculum = {}
for (const w of data) {
  if (w['교육과정']) byCurriculum[w['교육과정']] = (byCurriculum[w['교육과정']] || 0) + 1
}
console.log(`works.json 갱신 완료: ${data.length}행`)
console.table(byCurriculum)

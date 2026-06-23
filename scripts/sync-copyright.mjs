// 저작권 폴더의 자료를 정규화 병합해 public/copyright.json을 만든다.
// 사용: npm run sync-copyright
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import * as XLSX from 'xlsx'
import { normalizeAuthor } from '../src/utils/copyright.js'

const SRC_DIR = 'D:/교과서 문학 단행본 시리즈/저작권'

function findFile(prefix) {
  const f = readdirSync(SRC_DIR).find(n => n.startsWith(prefix))
  if (!f) { console.warn(`! 파일 없음: ${prefix}*`); return null }
  return `${SRC_DIR}/${f}`
}
function sheet(path, name) {
  const wb = XLSX.read(readFileSync(path), { type: 'buffer' })
  const ws = wb.Sheets[name] || wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false })
}

const out = {} // normKey -> record
function rec(name) {
  const key = normalizeAuthor(name)
  if (!key) return null
  if (!out[key]) out[key] = { matched: [], registries: [] }
  return out[key]
}
function mark(r, status) { if (r && !r.matched.includes(status)) r.matched.push(status) }

// 1) 저작권 만료
const expPath = findFile('저작권 만료 저자')
if (expPath) {
  for (const row of sheet(expPath, '저작권만료')) {
    const [저자명, 생몰연도, 사망연도, 만료시점, 상태] = row
    if (!저자명 || 저자명 === '저자명' || String(저자명).startsWith('▷')) continue
    const r = rec(저자명); if (!r) continue
    mark(r, 'expired')
    r.expired = { 생몰연도, 사망연도, 만료시점, 상태 }
  }
}

// 1b) 저작권 만료 추가 후보 리스트 (별도 파일, 2026 기준)
const expAddPath = findFile('저작권_만료_추가')
if (expAddPath) {
  for (const row of sheet(expAddPath, '추가_만료_후보')) {
    const [번호, 저자명, 생몰연도, 사망연도, 만료시점, 상태] = row
    if (typeof 번호 !== 'number' || !저자명) continue
    if (상태 && String(상태).trim() !== '만료') continue
    const r = rec(저자명); if (!r) continue
    mark(r, 'expired')
    if (!r.expired) r.expired = { 생몰연도, 사망연도, 만료시점, 상태 }
  }
}

// 2) KOLAA (신탁자목록 + 이미지 등록)
const kolaaPath = findFile('KOLAA 회원명단')
if (kolaaPath) {
  for (const row of sheet(kolaaPath, '신탁자목록')) {
    const [저작자명, 저작권자명, 확인, 대표저작물, 비고, 계약종료일] = row
    if (!저작자명 || 저작자명 === '저작자명') continue
    const r = rec(저작자명); if (!r) continue
    mark(r, 'KOLAA')
    r.registries.push({ source: 'KOLAA', 저작권자명, 확인, 비고, 계약종료일 })
  }
  for (const row of sheet(kolaaPath, 'KOLAA 이미지 등록 저작물')) {
    const [저작권자명, 저작자명, 확인, 대표저작물, 비고] = row
    if (!저작자명 || 저작자명 === '저작자명') continue
    const r = rec(저작자명); if (!r) continue
    mark(r, 'KOLAA')
    r.registries.push({ source: 'KOLAA(이미지)', 저작권자명, 확인, 비고 })
  }
}

// 3) 사이에이전시 (회원명단)
const saiPath = findFile('사이에이전시')
if (saiPath) {
  for (const row of sheet(saiPath, '회원명단')) {
    const 작가명 = row[1] // [연번, 작가명(저작권자명), 가입시기]
    if (!작가명 || String(작가명).includes('작가명') || String(작가명).startsWith('◎')) continue
    const r = rec(작가명); if (!r) continue
    mark(r, '사이에이전시')
    r.registries.push({ source: '사이에이전시', 가입시기: row[2] })
  }
}

// 4) 남북저작권센터
const nkPath = findFile('남북저작권센터')
if (nkPath) {
  const seen = new Set()
  for (const row of sheet(nkPath, '남북저작권센터 저작물목록')) {
    const [저작자명, 저작물구분] = row
    if (!저작자명 || 저작자명 === '저작자명' || String(저작자명).includes('남북저작권센터')) continue
    const key = normalizeAuthor(저작자명)
    const r = rec(저작자명); if (!r) continue
    mark(r, '남북저작권센터')
    if (!seen.has(key)) { r.registries.push({ source: '남북저작권센터', 저작물구분 }); seen.add(key) }
  }
}

// 5) 별도 사용료 요청 (CSV: 작가명,갈래,대표저작물,적용시점)
const csvPath = findFile('별도사용료_요청작가')
if (csvPath) {
  const text = readFileSync(csvPath, 'utf8').replace(/^﻿/, '')
  const lines = text.trim().split(/\r?\n/).slice(1)
  for (const line of lines) {
    const [작가명, 갈래, 대표저작물, 적용시점] = line.split(',')
    if (!작가명) continue
    const r = rec(작가명); if (!r) continue
    mark(r, '별도요청')
    r.별도요청 = { 갈래, 대표저작물, 적용시점 }
  }
}

// 6) 전편 이용불가 (CSV: 작가명,대표저작물,출처) — PDF 문학과지성사 전문이용 불가 목록
const banPath = findFile('전편이용불가_작가')
if (banPath) {
  const text = readFileSync(banPath, 'utf8').replace(/^﻿/, '')
  const lines = text.trim().split(/\r?\n/).slice(1)
  for (const line of lines) {
    const [작가명, 대표저작물, 출처] = line.split(',')
    if (!작가명) continue
    const r = rec(작가명); if (!r) continue
    mark(r, '이용불가')
    r.이용불가 = { 대표저작물, 출처 }
  }
}

const outPath = new URL('../public/copyright.json', import.meta.url)
writeFileSync(outPath, JSON.stringify(out, null, 2))
const counts = {}
for (const v of Object.values(out)) for (const m of v.matched) counts[m] = (counts[m] || 0) + 1
console.log(`copyright.json 갱신 완료: 작가 ${Object.keys(out).length}명`)
console.table(counts)

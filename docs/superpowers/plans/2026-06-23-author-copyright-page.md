# 작가별 탭 + 저작권 정보 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 작품 DB의 작가를 1급 개체로 다루는 "작가별" 탭을 추가하여, 작가별 수록 작품 전체와 저작권 관리 상태(만료/신탁/별도 요청 등)를 한 화면에서 본다.

**Architecture:** 외부 저작권 자료(`저작권` 폴더의 xlsx 4종 + 유지보수용 CSV)를 `npm run sync-copyright`로 정규화 병합해 `public/copyright.json`을 만든다. 앱은 `works`와 `copyright.json`을 로드하고, `_authorBase`(공백 제거 정규화)로 둘을 조인해 작가별 화면을 렌더한다. 순수 로직은 `src/utils/copyright.js`에 모아 단위 테스트한다.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Vitest + @testing-library, `xlsx`(기존 의존성), Node ESM 스크립트.

---

## File Structure

- Create: `src/utils/copyright.js` — 작가명 정규화·매칭·상태 판정·작가목록 빌드 (순수 로직, 테스트 대상)
- Create: `src/tests/copyright.test.js` — 위 유틸 단위 테스트
- Create: `scripts/sync-copyright.mjs` — 저작권 폴더 → `public/copyright.json` 생성 스크립트
- Create: `D:\교과서 문학 단행본 시리즈\저작권\별도사용료_요청작가.csv` — PDF 별지에서 옮긴 유지보수용 명단(동기화 소스)
- Create: `public/copyright.json` — 생성물(커밋), 미존재 시 앱은 전 작가 미확인으로 안전 동작
- Create: `src/hooks/useCopyright.js` — `copyright.json` 로딩 훅 (`useWorks` 패턴)
- Create: `src/pages/AuthorsPage.jsx` — 작가 디렉터리 + 작가 상세
- Modify: `src/App.jsx` — `useCopyright` 사용, `authors` 탭 라우팅
- Modify: `src/components/NavBar.jsx` — `['authors','작가별']` 탭 추가
- Modify: `package.json` — `"sync-copyright": "node scripts/sync-copyright.mjs"`

저작권 데이터 레코드 형태(`copyright.json` 값):

```json
{
  "matched": ["expired"],
  "expired":  { "생몰연도": "1902~1934", "사망연도": 1934, "만료시점": "2005.01.01" },
  "registries": [{ "source": "KOLAA", "저작권자명": "...", "확인": "...", "비고": "...", "계약종료일": "..." }],
  "별도요청": { "갈래": "산문", "대표저작물": "...", "적용시점": "..." }
}
```
- `matched`: 상태 키 배열. 가능한 값 `expired` | `KOLAA` | `사이에이전시` | `남북저작권센터` | `별도요청`.
- `expired` / `별도요청`은 단일 객체, `registries`는 배열.

---

## Task 1: 저작권 유틸 — 정규화·매칭·상태 (`src/utils/copyright.js`)

**Files:**
- Create: `src/utils/copyright.js`
- Test: `src/tests/copyright.test.js`

- [ ] **Step 1: 정규화 함수 실패 테스트 작성**

`src/tests/copyright.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { normalizeAuthor } from '../utils/copyright'

describe('normalizeAuthor', () => {
  it('괄호 주석을 떼고 공백을 제거한다', () => {
    expect(normalizeAuthor('김유정')).toBe('김유정')
    expect(normalizeAuthor('백 석')).toBe('백석')
    expect(normalizeAuthor('이상 (김해경)')).toBe('이상')
  })
  it('빈 값은 빈 문자열', () => {
    expect(normalizeAuthor('')).toBe('')
    expect(normalizeAuthor(null)).toBe('')
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- copyright`
Expected: FAIL — "normalizeAuthor is not a function" / 모듈 없음.

- [ ] **Step 3: 정규화 구현**

`src/utils/copyright.js`:

```js
// 작가별 저작권 정보의 정규화·매칭·상태 판정 유틸.
// 작품 DB의 _authorBase와 저작권 자료의 작가명을 공백 제거 후 정확 일치로 잇는다.
import { extractAuthorBase } from './parseCSV.js'

// 매칭 키: 괄호 주석 제거(extractAuthorBase) 후 모든 공백 제거.
export function normalizeAuthor(name) {
  return extractAuthorBase(name).replace(/\s+/g, '')
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- copyright`
Expected: PASS.

- [ ] **Step 5: 상태·조회 실패 테스트 추가**

`src/tests/copyright.test.js`에 추가:

```js
import { lookupCopyright, copyrightStatuses, STATUS } from '../utils/copyright'

const MAP = {
  '김소월': { matched: ['expired'], expired: { 만료시점: '2005.01.01' }, registries: [] },
  '임철우': { matched: ['KOLAA', '별도요청'], registries: [{ source: 'KOLAA' }], 별도요청: { 갈래: '산문' } },
}

describe('lookupCopyright', () => {
  it('정규화 키로 레코드를 찾는다', () => {
    expect(lookupCopyright('김소월', MAP)).toBe(MAP['김소월'])
    expect(lookupCopyright('임 철우', MAP)).toBe(MAP['임철우'])
  })
  it('미매칭은 null', () => {
    expect(lookupCopyright('알퐁스 도데', MAP)).toBe(null)
  })
})

describe('copyrightStatuses', () => {
  it('매칭된 소스를 모두 상태로 반환한다', () => {
    expect(copyrightStatuses(MAP['임철우']).map(s => s.key)).toEqual(['KOLAA', '별도요청'])
  })
  it('만료를 인식한다', () => {
    expect(copyrightStatuses(MAP['김소월']).map(s => s.key)).toEqual(['expired'])
  })
  it('레코드 없거나 빈 matched는 미확인', () => {
    expect(copyrightStatuses(null).map(s => s.key)).toEqual(['미확인'])
    expect(copyrightStatuses({ matched: [] }).map(s => s.key)).toEqual(['미확인'])
  })
})
```

- [ ] **Step 6: 실패 확인**

Run: `npm test -- copyright`
Expected: FAIL — `lookupCopyright`/`copyrightStatuses`/`STATUS` 미정의.

- [ ] **Step 7: 상태·조회 구현**

`src/utils/copyright.js`에 추가:

```js
// 상태 메타: 표시 라벨과 Tailwind 색 키.
export const STATUS = {
  expired:       { key: 'expired',       label: '만료(자유 이용)', color: 'green' },
  KOLAA:         { key: 'KOLAA',         label: 'KOLAA 신탁',      color: 'blue' },
  사이에이전시:   { key: '사이에이전시',   label: '사이에이전시',     color: 'purple' },
  남북저작권센터: { key: '남북저작권센터', label: '남북저작권센터',   color: 'orange' },
  별도요청:       { key: '별도요청',       label: '별도 사용료 요청', color: 'red' },
  미확인:         { key: '미확인',         label: '미확인',           color: 'gray' },
}

export function lookupCopyright(authorBase, copyrightMap) {
  if (!copyrightMap) return null
  return copyrightMap[normalizeAuthor(authorBase)] || null
}

export function copyrightStatuses(record) {
  if (!record || !record.matched || record.matched.length === 0) return [STATUS.미확인]
  return record.matched.map(k => STATUS[k]).filter(Boolean)
}
```

- [ ] **Step 8: 통과 확인**

Run: `npm test -- copyright`
Expected: PASS.

- [ ] **Step 9: 작가목록 빌드 실패 테스트 추가**

`src/tests/copyright.test.js`에 추가:

```js
import { buildAuthorList } from '../utils/copyright'

const WORKS = [
  { 작품명: '진달래꽃', _authorBase: '김소월' },
  { 작품명: '산유화',   _authorBase: '김소월' },
  { 작품명: '날개',     _authorBase: '이상' },
]

describe('buildAuthorList', () => {
  it('작가별로 묶고 편수 내림차순·이름 오름차순 정렬한다', () => {
    const list = buildAuthorList(WORKS, MAP)
    expect(list.map(a => a.name)).toEqual(['김소월', '이상'])
    expect(list[0].count).toBe(2)
    expect(list[0].works).toHaveLength(2)
  })
  it('각 작가에 저작권 레코드와 상태를 붙인다', () => {
    const list = buildAuthorList(WORKS, MAP)
    expect(list[0].statuses.map(s => s.key)).toEqual(['expired'])
    expect(list[1].statuses.map(s => s.key)).toEqual(['미확인'])
  })
})
```

- [ ] **Step 10: 실패 확인**

Run: `npm test -- copyright`
Expected: FAIL — `buildAuthorList` 미정의.

- [ ] **Step 11: 작가목록 빌드 구현**

`src/utils/copyright.js`에 추가:

```js
// works를 _authorBase로 묶어 작가 목록을 만들고, 각 작가에 저작권 레코드·상태를 붙인다.
// 정렬: 수록 편수 내림차순 → 이름 가나다순.
export function buildAuthorList(works, copyrightMap) {
  const map = new Map()
  for (const w of works) {
    const name = w._authorBase || '작가 미상'
    if (!map.has(name)) map.set(name, { name, count: 0, works: [] })
    const e = map.get(name)
    e.count++
    e.works.push(w)
  }
  const list = [...map.values()].map(e => {
    const record = lookupCopyright(e.name, copyrightMap)
    return { ...e, record, statuses: copyrightStatuses(record) }
  })
  return list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'))
}
```

- [ ] **Step 12: 통과 확인**

Run: `npm test -- copyright`
Expected: PASS (전체 케이스).

- [ ] **Step 13: 커밋**

```bash
git add src/utils/copyright.js src/tests/copyright.test.js
git commit -m "feat: 저작권 정규화·매칭·상태·작가목록 유틸 추가"
```

---

## Task 2: 별도 사용료 요청 작가 명단 CSV 시드 (PDF 별지 → CSV)

PDF(`한국문학예술저작권협회_저작권 사용료 기준.pdf`)는 텍스트 추출이 불가능하므로 이미지로 렌더해 사람이 옮긴다. **작가명·법적 맥락이라 옮긴 뒤 사용자 검증을 받는다.**

**Files:**
- Create: `D:\교과서 문학 단행본 시리즈\저작권\별도사용료_요청작가.csv`

- [ ] **Step 1: PDF p3~5를 이미지로 렌더**

```bash
cd "D:/교과서 문학 단행본 시리즈/literature-db" && mkdir -p .tmp_pdf && python -c "
import fitz
doc = fitz.open(r'D:/교과서 문학 단행본 시리즈/저작권/한국문학예술저작권협회_저작권 사용료 기준.pdf')
for p in range(2,5):
    pix = doc[p].get_pixmap(matrix=fitz.Matrix(2.6,2.6))
    pix.save(r'D:/교과서 문학 단행본 시리즈/literature-db/.tmp_pdf/cr_p%d.png' % (p+1))
print('done')
"
```
Expected: `.tmp_pdf/cr_p3.png … cr_p5.png` 생성. (`.tmp_pdf`는 작업 후 삭제, 커밋하지 않음)

- [ ] **Step 2: 이미지를 읽어 작가명·갈래·대표저작물·적용시점을 CSV로 전사**

각 페이지 PNG를 Read 도구로 보고 표를 옮긴다. 산문(p3~4 중반)은 `갈래=산문`, 운문(p4 중반~5)은 `갈래=운문`. 헤더와 예시:

```csv
작가명,갈래,대표저작물,적용시점
임철우,산문,사평역·눈이 오면 등,
신경숙,산문,외딴방 등,
성석제,산문,…,22.06.30 기준 내
```
- 적용시점이 없으면 빈칸. 대표저작물은 보이는 대로(불확실하면 빈칸).
- 파일 인코딩 UTF-8.

- [ ] **Step 3: 전사 결과를 사용자에게 검증 요청**

사용자에게 CSV를 제시하고 "작가명/갈래가 PDF와 일치하는지 확인해 달라"고 요청. 수정 사항 반영.

- [ ] **Step 4: 임시 이미지 정리 + 커밋**

```bash
cd "D:/교과서 문학 단행본 시리즈/literature-db" && rm -rf .tmp_pdf
```
CSV는 저작권 폴더(리포 밖)라 git 대상 아님. 별도 커밋 없음. (다음 Task에서 copyright.json 생성 시 함께 검증)

---

## Task 3: 동기화 스크립트 (`scripts/sync-copyright.mjs`)

저작권 폴더의 xlsx 4종 + CSV를 읽어 `public/copyright.json`을 만든다. 파일명은 날짜가 바뀌므로 접두어로 찾는다.

**Files:**
- Create: `scripts/sync-copyright.mjs`
- Modify: `package.json`
- Create(생성물): `public/copyright.json`

- [ ] **Step 1: 스크립트 작성**

`scripts/sync-copyright.mjs`:

```js
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

const outPath = new URL('../public/copyright.json', import.meta.url)
writeFileSync(outPath, JSON.stringify(out, null, 2))
const counts = {}
for (const v of Object.values(out)) for (const m of v.matched) counts[m] = (counts[m] || 0) + 1
console.log(`copyright.json 갱신 완료: 작가 ${Object.keys(out).length}명`)
console.table(counts)
```

- [ ] **Step 2: package.json에 스크립트 추가**

`package.json`의 `"scripts"`에 추가(기존 `sync-works` 옆):

```json
"sync-copyright": "node scripts/sync-copyright.mjs",
```

- [ ] **Step 3: 실행 및 검증**

Run: `npm run sync-copyright`
Expected: `copyright.json 갱신 완료: 작가 N명` + `expired/KOLAA/사이에이전시/남북저작권센터/별도요청` 카운트 표 출력. 에러 없이 종료.

- [ ] **Step 4: 산출물 스팟체크**

`public/copyright.json`에서 알려진 작가 확인 (예: `김소월`→`matched:["expired"]`, `백석`→`남북저작권센터` 포함). 정규화 키(공백 제거)로 저장됐는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add scripts/sync-copyright.mjs package.json public/copyright.json
git commit -m "feat: 저작권 자료 동기화 스크립트 + copyright.json 생성"
```

---

## Task 4: copyright.json 로딩 훅 (`src/hooks/useCopyright.js`)

**Files:**
- Create: `src/hooks/useCopyright.js`

- [ ] **Step 1: 훅 작성 (미존재 시 빈 맵으로 안전 동작)**

`src/hooks/useCopyright.js`:

```js
import { useState, useEffect } from 'react'

// public/copyright.json을 로드한다. 파일이 없거나 실패해도 빈 맵을 반환해
// 앱이 깨지지 않게 한다(전 작가 '미확인'으로 표시됨).
export function useCopyright() {
  const [copyrightMap, setCopyrightMap] = useState({})

  useEffect(() => {
    fetch('./copyright.json')
      .then(res => (res.ok ? res.json() : {}))
      .then(setCopyrightMap)
      .catch(() => setCopyrightMap({}))
  }, [])

  return copyrightMap
}
```

- [ ] **Step 2: 빌드로 문법 검증**

Run: `npm run build`
Expected: 빌드 성공(에러 없음).

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useCopyright.js
git commit -m "feat: copyright.json 로딩 훅 추가"
```

---

## Task 5: 작가별 페이지 — 디렉터리 (`src/pages/AuthorsPage.jsx`)

작가 목록(검색·상태 필터·편수 정렬) + 선택 시 상세. 이번 Task는 디렉터리와 골격까지, 상세 패널은 Task 6에서 채운다.

**Files:**
- Create: `src/pages/AuthorsPage.jsx`

- [ ] **Step 1: 페이지 작성 (디렉터리 + 상세 골격)**

`src/pages/AuthorsPage.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { buildAuthorList, STATUS } from '../utils/copyright'
import { toChosung, isChosungQuery } from '../utils/chosung'
import WorkDetailModal from '../components/search/WorkDetailModal'

const BADGE_CLASS = {
  green:  'bg-green-100 text-green-700 border-green-200',
  blue:   'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  red:    'bg-red-100 text-red-700 border-red-200',
  gray:   'bg-gray-100 text-gray-500 border-gray-200',
}

function Badge({ status }) {
  return (
    <span className={`px-1.5 py-0.5 text-[11px] rounded border ${BADGE_CLASS[status.color]}`}>
      {status.label}
    </span>
  )
}

const STATUS_FILTERS = [
  STATUS.expired, STATUS.KOLAA, STATUS.사이에이전시,
  STATUS.남북저작권센터, STATUS.별도요청, STATUS.미확인,
]

export default function AuthorsPage({ works, copyrightMap }) {
  const authors = useMemo(() => buildAuthorList(works, copyrightMap), [works, copyrightMap])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedName, setSelectedName] = useState(null)
  const [selectedWork, setSelectedWork] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim()
    const cho = isChosungQuery(q)
    return authors.filter(a => {
      if (statusFilter && !a.statuses.some(s => s.key === statusFilter)) return false
      if (!q) return true
      return cho ? toChosung(a.name).includes(q) : a.name.includes(q)
    })
  }, [authors, query, statusFilter])

  const selected = useMemo(
    () => authors.find(a => a.name === selectedName) || null,
    [authors, selectedName],
  )

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-800">작가별 작품 · 저작권</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            작가별 수록 작품과 저작권 관리 상태를 봅니다. 저작권 상태는 작가명 기준의 참고 정보입니다(동명이인 주의).
          </p>
        </div>

        {/* 검색 + 상태 필터 */}
        <div className="flex flex-col gap-3 mb-4">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="작가 이름 검색 (초성 가능: ㄱㅅㅇ)"
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-2.5 py-1 text-xs rounded-full border ${statusFilter === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              전체 ({authors.length})
            </button>
            {STATUS_FILTERS.map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key === statusFilter ? '' : s.key)}
                className={`px-2.5 py-1 text-xs rounded-full border ${statusFilter === s.key ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* 디렉터리 */}
          <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-gray-400">해당하는 작가가 없습니다.</li>
            )}
            {filtered.map(a => (
              <li key={a.name}>
                <button
                  onClick={() => setSelectedName(a.name)}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-sky-50 ${selectedName === a.name ? 'bg-sky-50' : ''}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-gray-800 truncate">{a.name}</span>
                    <span className="flex gap-1 shrink-0">
                      {a.statuses.map(s => <Badge key={s.key} status={s} />)}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{a.count}편</span>
                </button>
              </li>
            ))}
          </ul>

          {/* 상세 (Task 6에서 채움) */}
          <AuthorDetail author={selected} onSelectWork={setSelectedWork} />
        </div>
      </main>

      {selectedWork && (
        <WorkDetailModal work={selectedWork} allWorks={works} onClose={() => setSelectedWork(null)} />
      )}
    </>
  )
}

function AuthorDetail({ author }) {
  if (!author) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400 min-h-[200px]">
        작가를 선택하세요.
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-bold text-gray-900">{author.name}</h3>
      <p className="text-sm text-gray-500">{author.count}편 수록</p>
    </div>
  )
}
```

- [ ] **Step 2: 빌드로 문법 검증**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/AuthorsPage.jsx
git commit -m "feat: 작가별 페이지 디렉터리(검색·상태필터·편수) 추가"
```

---

## Task 6: 작가별 페이지 — 상세 패널 (저작권 상세 + 수록 작품)

`AuthorDetail`을 저작권 배지·상세와 수록 작품 목록으로 확장한다.

**Files:**
- Modify: `src/pages/AuthorsPage.jsx` (AuthorDetail 함수 교체)

- [ ] **Step 1: AuthorDetail 확장**

`src/pages/AuthorsPage.jsx`의 `AuthorDetail` 함수를 아래로 교체:

```jsx
function AuthorDetail({ author, onSelectWork }) {
  if (!author) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400 min-h-[200px]">
        작가를 선택하세요.
      </div>
    )
  }
  const rec = author.record
  return (
    <div className="rounded-lg border border-gray-200 flex flex-col max-h-[70vh]">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-bold text-gray-900">{author.name}</h3>
          {author.statuses.map(s => <Badge key={s.key} status={s} />)}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{author.count}편 수록</p>
      </div>

      {/* 저작권 상세 */}
      <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-700 space-y-1.5">
        {rec?.expired && (
          <p>🟢 <strong>저작권 만료</strong> — 생몰 {rec.expired.생몰연도 || '-'}, 만료시점 {rec.expired.만료시점 || '-'} (자유 이용 가능)</p>
        )}
        {rec?.별도요청 && (
          <p>🔴 <strong>별도 사용료 요청</strong> ({rec.별도요청.갈래 || '-'}) — 대표저작물 {rec.별도요청.대표저작물 || '-'}{rec.별도요청.적용시점 ? ` · 적용 ${rec.별도요청.적용시점}` : ''}. 요율은 KOLAA 사용료 기준 PDF 별지 참조.</p>
        )}
        {rec?.registries?.map((g, i) => (
          <p key={i}>
            • {g.source}
            {g.저작권자명 ? ` — 저작권자 ${g.저작권자명}` : ''}
            {g.계약종료일 ? ` · 계약종료 ${g.계약종료일}` : ''}
            {g.저작물구분 ? ` · ${g.저작물구분}` : ''}
            {g.가입시기 ? ` · 가입 ${g.가입시기}` : ''}
          </p>
        ))}
        {!rec && <p className="text-gray-400">저작권 자료에서 확인되지 않음(미확인). 동명이인·외국 작가일 수 있습니다.</p>}
      </div>

      {/* 수록 작품 */}
      <ul className="overflow-y-auto divide-y divide-gray-100">
        {author.works.map((w, i) => (
          <li key={i} className="px-4 py-2 hover:bg-blue-50">
            <button onClick={() => onSelectWork(w)} className="text-blue-600 hover:underline font-medium text-left">
              {w['작품명']}
            </button>
            <span className="text-gray-500 text-xs ml-2">
              {w['장르']} · {w['교육과정']} · {w['교과서명']}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: 빌드로 문법 검증**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/AuthorsPage.jsx
git commit -m "feat: 작가 상세 패널(저작권 상세 + 수록 작품) 추가"
```

---

## Task 7: NavBar 탭 + App 라우팅 연결

**Files:**
- Modify: `src/components/NavBar.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: NavBar에 작가별 탭 추가**

`src/components/NavBar.jsx`의 `NAV_ITEMS`를 수정(검색 다음에 배치):

```js
const NAV_ITEMS = [
  ['search', '검색·탐색'],
  ['authors', '작가별'],
  ['duplicates', '중복 수록'],
  ['compare', '교육과정 비교'],
  ['stats', '통계'],
]
```

- [ ] **Step 2: App에서 copyright 로드 + 라우팅**

`src/App.jsx` 수정:
- import 추가:
```js
import AuthorsPage from './pages/AuthorsPage'
import { useCopyright } from './hooks/useCopyright'
```
- 컴포넌트 본문에서 `const { works, loading, error } = useWorks()` 아래에 추가:
```js
  const copyrightMap = useCopyright()
```
- 라우팅 분기에 추가(`search` 줄 다음):
```jsx
      {activePage === 'authors' && <AuthorsPage works={works} copyrightMap={copyrightMap} />}
```

- [ ] **Step 3: 빌드 + 테스트**

Run: `npm run build && npm test`
Expected: 빌드 성공, 전체 테스트 PASS.

- [ ] **Step 4: 개발 서버에서 수동 확인**

Run: `npm run dev` 후 브라우저에서 "작가별" 탭 확인:
- 작가 디렉터리가 편수순으로 뜨고, 검색(초성 포함)·상태 필터가 동작.
- 작가 선택 시 저작권 배지·상세 + 수록 작품 목록 표시.
- 작품 클릭 시 기존 작품 상세 모달이 뜸.
- 김소월=만료, 백석=남북저작권센터 등 알려진 케이스 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/NavBar.jsx src/App.jsx
git commit -m "feat: NavBar에 작가별 탭 + App 라우팅·copyright 로딩 연결"
```

---

## Self-Review 결과

- **Spec coverage:** 동기화 파이프라인(Task 3), 매칭·상태 모델(Task 1), PDF 별도요청 처리(Task 2+3 CSV 경로), 디렉터리+상세 화면(Task 5,6), NavBar/App(Task 7), copyright.json 미존재 안전동작(Task 4) — 스펙 항목 모두 대응.
- **Placeholder scan:** 코드 스텝은 실제 구현 포함. Task 2의 CSV 내용만 본질적으로 수기 전사(데이터 입력)이며 방법·예시·검증 단계 명시.
- **Type consistency:** `matched` 키 값(`expired`/`KOLAA`/`사이에이전시`/`남북저작권센터`/`별도요청`)이 스크립트·`STATUS`·테스트에서 일치. `buildAuthorList`/`lookupCopyright`/`copyrightStatuses`/`normalizeAuthor` 시그니처가 페이지·테스트 사용처와 일치. `copyrightMap` prop 이름이 App→AuthorsPage→유틸까지 일관.

## 알려진 한계

- 매칭은 공백 제거 정확 일치라 표기 차이(한자 병기·이형 표기)·동명이인은 누락/오매칭 가능 → 화면에 참고 정보임을 고지.
- Task 2 전사 정확도는 사용자 검증에 의존.
- 컴포넌트는 단위 테스트 대신 빌드+수동 확인(기존 페이지 관행과 동일).

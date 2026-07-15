# "첫 수록" 필터 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 검색 페이지에 "첫 수록" 체크박스를 추가해, 선택한 교육과정에서 처음(데뷔) 수록된 작품만 걸러 기존 Excel 내보내기로 받을 수 있게 한다.

**Architecture:** 전체 works에서 작품별 데뷔 교육과정 맵을 1회 계산(`buildDebutMap`)하고, 순수 함수 `filterWorks`에 맵을 인자로 넘겨 `debutOnly`일 때 데뷔 교육과정이 선택 목록에 있는지 검사한다. 표·엑셀은 필터 결과를 그대로 받으므로 무변경.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Vitest + @testing-library/react, xlsx.

## Global Constraints

- 작품 식별자 문자열은 어디서나 동일 형식: `` `${work['작품명']}__${work._authorBase}` `` (`src/utils/compareCurricula.js`와 동일).
- 데뷔 순위 기준: `CURRICULUM_ORDER` (`src/constants.js`). 목록에 없는 교육과정 값은 알려진 것들보다 **뒤로** 취급.
- `filterWorks`는 순수 함수 유지 — 데뷔 맵을 상태로 들지 않고 인자로만 받는다.
- `debutMap` 미제공 시 `debutOnly` 조건은 무시(하위 호환).
- 스펙: `docs/superpowers/specs/2026-07-15-debut-curriculum-filter-design.md`.

---

### Task 1: 데뷔 교육과정 맵 유틸 (`buildDebutMap`)

**Files:**
- Create: `src/utils/debut.js`
- Test: `src/tests/debut.test.js`

**Interfaces:**
- Consumes: `CURRICULUM_ORDER` from `src/constants.js`.
- Produces: `buildDebutMap(works) -> Map<string, string>` — 키 `` `${작품명}__${_authorBase}` ``, 값 = 데뷔 교육과정 문자열.

- [ ] **Step 1: Write the failing test**

`src/tests/debut.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildDebutMap } from '../utils/debut'

const WORKS = [
  { 교육과정: '5차', 작품명: '소나기', _authorBase: '황순원' },
  { 교육과정: '3차', 작품명: '소나기', _authorBase: '황순원' },
  { 교육과정: '7차', 작품명: '소나기', _authorBase: '황순원' },
  { 교육과정: '5차', 작품명: '메밀꽃 필 무렵', _authorBase: '이효석' },
]

describe('buildDebutMap', () => {
  it('여러 교육과정에 걸친 작품은 가장 이른 교육과정을 데뷔로 한다', () => {
    expect(buildDebutMap(WORKS).get('소나기__황순원')).toBe('3차')
  })
  it('단일 교육과정 작품은 그 교육과정이 데뷔', () => {
    expect(buildDebutMap(WORKS).get('메밀꽃 필 무렵__이효석')).toBe('5차')
  })
  it('CURRICULUM_ORDER에 없는 교육과정은 알려진 것보다 뒤로 취급', () => {
    const map = buildDebutMap([
      { 교육과정: '미래과정', 작품명: 'X', _authorBase: 'Y' },
      { 교육과정: '2015개정', 작품명: 'X', _authorBase: 'Y' },
    ])
    expect(map.get('X__Y')).toBe('2015개정')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/tests/debut.test.js`
Expected: FAIL (`buildDebutMap` is not a function / module not found).

- [ ] **Step 3: Write minimal implementation**

`src/utils/debut.js`:

```js
import { CURRICULUM_ORDER } from '../constants'

// CURRICULUM_ORDER에 없는 값은 알려진 것들 뒤로 밀기 위해 큰 랭크를 준다.
function rank(curriculum) {
  const i = CURRICULUM_ORDER.indexOf(curriculum)
  return i === -1 ? CURRICULUM_ORDER.length : i
}

// 작품(작품명+작가기준명)별로 가장 이른 교육과정을 데뷔로 계산한다.
export function buildDebutMap(works) {
  const map = new Map()
  for (const w of works) {
    const id = `${w['작품명']}__${w._authorBase}`
    const cur = w['교육과정']
    const prev = map.get(id)
    if (prev === undefined || rank(cur) < rank(prev)) map.set(id, cur)
  }
  return map
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/tests/debut.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/debut.js src/tests/debut.test.js
git commit -m "feat: 작품별 데뷔 교육과정 맵 buildDebutMap 추가"
```

---

### Task 2: `filterWorks`에 첫수록 조건 추가

**Files:**
- Modify: `src/utils/filterWorks.js`
- Test: `src/tests/filterWorks.test.js` (기존 파일에 describe 블록 추가)

**Interfaces:**
- Consumes: `buildDebutMap` from `src/utils/debut.js` (테스트에서 맵 생성용).
- Produces: `filterWorks(works, filters, debutMap = null)` — `filters.debutOnly`(boolean) 지원. `debutOnly && curriculum.length && debutMap` 일 때 작품 데뷔가 `curriculum`에 포함되지 않으면 제외.

- [ ] **Step 1: Write the failing test**

`src/tests/filterWorks.test.js` 맨 아래(기존 `getUniqueValues` describe 뒤)에 추가. 파일 상단 import에 `buildDebutMap`도 추가:

```js
// 상단 import 교체:
// import { filterWorks, getUniqueValues } from '../utils/filterWorks'
// →
import { filterWorks, getUniqueValues } from '../utils/filterWorks'
import { buildDebutMap } from '../utils/debut'
```

파일 하단에 추가:

```js
describe('filterWorks - 첫 수록(debutOnly)', () => {
  const DEBUT_WORKS = [
    { 교육과정: '3차', 구분: '중등', 학년: '1', 장르: '소설', 작품명: '소나기', 지은이: '황순원', _authorBase: '황순원' },
    { 교육과정: '5차', 구분: '중등', 학년: '1', 장르: '소설', 작품명: '소나기', 지은이: '황순원', _authorBase: '황순원' },
    { 교육과정: '5차', 구분: '고등', 학년: '1', 장르: '소설', 작품명: '메밀꽃 필 무렵', 지은이: '이효석', _authorBase: '이효석' },
  ]
  const debutMap = buildDebutMap(DEBUT_WORKS)

  it('교육과정=5차 + 첫수록: 5차 데뷔 작품만 (소나기 제외, 메밀꽃만)', () => {
    const result = filterWorks(DEBUT_WORKS, { curriculum: ['5차'], debutOnly: true }, debutMap)
    expect(result).toHaveLength(1)
    expect(result[0]['작품명']).toBe('메밀꽃 필 무렵')
  })
  it('첫수록 꺼짐: 5차 행 모두 (소나기 5차 + 메밀꽃)', () => {
    const result = filterWorks(DEBUT_WORKS, { curriculum: ['5차'], debutOnly: false }, debutMap)
    expect(result).toHaveLength(2)
  })
  it('교육과정 미선택 + 첫수록: 무효(전체 반환)', () => {
    const result = filterWorks(DEBUT_WORKS, { debutOnly: true }, debutMap)
    expect(result).toHaveLength(3)
  })
  it('debutMap 미제공 시 첫수록 조건 무시(하위 호환)', () => {
    const result = filterWorks(DEBUT_WORKS, { curriculum: ['5차'], debutOnly: true })
    expect(result).toHaveLength(2)
  })
  it('다중 선택: 데뷔가 3·5차 중 하나인 작품의 선택 교육과정 내 행', () => {
    const result = filterWorks(DEBUT_WORKS, { curriculum: ['3차', '5차'], debutOnly: true }, debutMap)
    expect(result).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/tests/filterWorks.test.js`
Expected: FAIL (첫수록 describe의 첫 테스트가 2를 받아 1을 기대하며 실패 — 아직 debutOnly 미구현).

- [ ] **Step 3: Write minimal implementation**

`src/utils/filterWorks.js` 수정. 시그니처에 `debutOnly` 구조분해와 세 번째 인자 `debutMap`을 더하고, 교육과정 검사 바로 뒤에 데뷔 검사를 넣는다:

```js
import { toChosung, isChosungQuery } from './chosung'

export function filterWorks(works, { curriculum = [], division = [], genre = [], grade = [], system = [], publisher = [], query = '', debutOnly = false } = {}, debutMap = null) {
  const trimmedQuery = query.trim()
  const chosungMode = isChosungQuery(trimmedQuery)
  const q = trimmedQuery.toLowerCase()
  const cq = trimmedQuery.replace(/\s/g, '')

  return works.filter(work => {
    if (curriculum.length && !curriculum.includes(work['교육과정'])) return false
    // 첫 수록: 작품 데뷔 교육과정이 선택 목록에 있어야 통과. 교육과정 미선택·맵 미제공이면 무효.
    if (debutOnly && curriculum.length && debutMap) {
      const debut = debutMap.get(`${work['작품명']}__${work._authorBase}`)
      if (!curriculum.includes(debut)) return false
    }
    if (division.length && !division.includes(work['구분'])) return false
    if (genre.length && !genre.includes(work['장르'])) return false
    if (grade.length && !grade.includes(work['학년'])) return false
    if (system.length && !system.includes(work['체제'])) return false
    if (publisher.length && !publisher.includes(work['출판사'])) return false
    if (trimmedQuery) {
      if (chosungMode) {
        const titleCho = work._titleChosung ?? toChosung(work['작품명'])
        const authorCho = work._authorChosung ?? toChosung(work._authorBase ?? '')
        if (!titleCho.includes(cq) && !authorCho.includes(cq)) return false
      } else if (!work['작품명'].toLowerCase().includes(q) && !(work._authorBase ?? '').toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })
}

export function getUniqueValues(works, field) {
  return [...new Set(works.map(w => w[field]).filter(Boolean))].sort()
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/tests/filterWorks.test.js`
Expected: PASS (기존 + 첫수록 5개 모두).

- [ ] **Step 5: Commit**

```bash
git add src/utils/filterWorks.js src/tests/filterWorks.test.js
git commit -m "feat: filterWorks에 첫 수록(debutOnly) 조건 추가"
```

---

### Task 3: 검색 UI 배선 (SearchPage · FilterPanel · ActiveFilters)

**Files:**
- Modify: `src/pages/SearchPage.jsx`
- Modify: `src/components/search/FilterPanel.jsx`
- Modify: `src/components/search/ActiveFilters.jsx`

**Interfaces:**
- Consumes: `buildDebutMap` (SearchPage), `filterWorks(works, filters, debutMap)`.
- Produces: 화면에 "첫 수록" 체크박스와 "첫 수록 ✕" 칩. `filters.debutOnly` 상태.

- [ ] **Step 1: SearchPage — 상태·맵·전달 추가**

`src/pages/SearchPage.jsx`: import에 `buildDebutMap` 추가, `INITIAL_FILTERS`에 `debutOnly: false` 추가, 데뷔 맵 useMemo, `filterWorks` 호출에 맵 전달.

```jsx
import { useState, useEffect, useMemo } from 'react'
import FilterPanel from '../components/search/FilterPanel'
import SearchBar from '../components/search/SearchBar'
import ActiveFilters from '../components/search/ActiveFilters'
import WorksTable from '../components/search/WorksTable'
import ExportButton from '../components/search/ExportButton'
import { filterWorks } from '../utils/filterWorks'
import { buildDebutMap } from '../utils/debut'

const INITIAL_FILTERS = { curriculum: [], division: [], genre: [], grade: [], system: [], publisher: [], query: '', debutOnly: false }
```

그리고 컴포넌트 본문에서 `filtered` 계산 부분을 교체:

```jsx
  const debutMap = useMemo(() => buildDebutMap(works), [works])
  const filtered = useMemo(() => filterWorks(works, filters, debutMap), [works, filters, debutMap])
```

- [ ] **Step 2: FilterPanel — 체크박스 추가**

`src/components/search/FilterPanel.jsx`: 드롭다운을 감싸는 `<div className={... flex flex-wrap gap-4 ...}>` 안에서, `FILTER_CONFIGS.map(...)` 블록 **바로 뒤**에 체크박스 항목을 추가한다.

```jsx
        {FILTER_CONFIGS.map(({ key, label, options, panelClassName }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            <MultiSelectDropdown
              options={options}
              value={filters[key] || []}
              onChange={v => update(key, v)}
              panelClassName={panelClassName}
            />
          </div>
        ))}
        <div className="flex flex-col justify-end gap-1">
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.debutOnly || false}
              onChange={e => update('debutOnly', e.target.checked)}
              className="rounded border-gray-300"
            />
            첫 수록
          </label>
          {filters.debutOnly && !(filters.curriculum?.length) && (
            <span className="text-xs text-amber-600">교육과정을 먼저 선택하세요</span>
          )}
        </div>
```

(`update`는 기존 `function update(key, value) { onChange({ ...filters, [key]: value }) }` 를 그대로 사용.)

- [ ] **Step 3: ActiveFilters — 칩 + 초기화 반영**

`src/components/search/ActiveFilters.jsx`: query 칩 push 뒤에 debut 칩 push 추가, `removeChip`에 debutOnly 분기 추가, `clearAll`에 `debutOnly: false` 추가.

query 칩 블록 아래에 추가:

```jsx
  if (filters.query?.trim()) {
    chips.push({ key: 'query', value: filters.query, label: `검색: ${filters.query}` })
  }
  if (filters.debutOnly) {
    chips.push({ key: 'debutOnly', value: 'debutOnly', label: '첫 수록' })
  }
```

`removeChip` 교체:

```jsx
  function removeChip(chip) {
    if (chip.key === 'query') {
      onChange({ ...filters, query: '' })
    } else if (chip.key === 'debutOnly') {
      onChange({ ...filters, debutOnly: false })
    } else {
      onChange({ ...filters, [chip.key]: filters[chip.key].filter(v => v !== chip.value) })
    }
  }
```

`clearAll` 교체:

```jsx
  function clearAll() {
    const cleared = { query: '', debutOnly: false }
    for (const key of Object.keys(FILTER_LABELS)) cleared[key] = []
    onChange({ ...filters, ...cleared })
  }
```

- [ ] **Step 4: 빌드로 통합 검증**

Run: `npm run build`
Expected: `✓ built` (에러 없음).

- [ ] **Step 5: Commit**

```bash
git add src/pages/SearchPage.jsx src/components/search/FilterPanel.jsx src/components/search/ActiveFilters.jsx
git commit -m "feat: 검색 페이지에 '첫 수록' 체크박스·칩 배선"
```

---

### Task 4: 엔드투엔드 검증

**Files:** (변경 없음 — 검증만)

- [ ] **Step 1: 전체 테스트**

Run: `npm test -- --run`
Expected: 모든 테스트 PASS (기존 59 + 신규 debut/filter 테스트).

- [ ] **Step 2: 데뷔 작품 집합 교차 검증 (일회성 노드 스크립트)**

Run:
```bash
node --input-type=module -e '
import { readFileSync } from "fs";
import { filterWorks } from "./src/utils/filterWorks.js";
import { buildDebutMap } from "./src/utils/debut.js";
import { compareCurricula } from "./src/utils/compareCurricula.js";
const works = JSON.parse(readFileSync("public/works.json","utf8"));
const map = buildDebutMap(works);
const rows = filterWorks(works, { curriculum: ["5차"], debutOnly: true }, map);
const ids = new Set(rows.map(r => `${r["작품명"]}__${r._authorBase}`));
const cmp = compareCurricula(works, ["5차"], ["1차","2차","3차","4차"]).onlyA;
const cmpIds = new Set(cmp.map(r => `${r["작품명"]}__${r._authorBase}`));
console.log("filter 고유작품:", ids.size, "| compare onlyA:", cmpIds.size);
const diff = [...cmpIds].filter(x => !ids.has(x));
console.log("불일치:", diff.length);
'
```
Expected: `filter 고유작품`과 `compare onlyA`가 같고(**302**), `불일치: 0`.

- [ ] **Step 3: 개발 서버 수동 확인**

Run: `npm run dev` → 브라우저에서 검색탐색 탭 열기.
- 교육과정 `5차` 선택 + ☑첫 수록 → 표에 5차 데뷔 작품만.
- 장르 `소설` 추가 → 5차 데뷔 소설로 좁혀짐.
- ⬇ Excel 내보내기 → 필터된 결과가 xlsx로 저장됨.
- 교육과정 해제 후 ☑첫 수록만 → "교육과정을 먼저 선택하세요" 안내 표시, 결과 변화 없음.
- "첫 수록 ✕" 칩 클릭 → 체크 해제.

- [ ] **Step 4: 완료 커밋(필요 시)**

검증 중 수정이 없었으면 별도 커밋 불필요.

# 과목 필터 추가 · '구분' → '학교급' 라벨 변경 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 검색 필터에 '과목'(국어/문학) 필터를 추가하고 기존 '구분' 필터 라벨을 '학교급'으로 바꾼다.

**Architecture:** 과목은 데이터에 컬럼이 없으므로 교과서명에서 자동 도출한다("문학" 포함 → 문학, 그 외 → 국어). `withDerivedFields`에 `_subject` 파생 필드를 추가하면 `useWorks`가 라이브 CSV·로컬 works.json 모두 이 함수를 통과시키므로 전 화면에 자동 반영된다. 필터 로직·UI·엑셀 내보내기·활성 칩에 과목을 배선한다.

**Tech Stack:** React 19, Vite, Vitest + @testing-library/react, xlsx

## Global Constraints

- 도메인 목록은 `src/constants.js`에서 단일 관리한다.
- 파생 필드는 `src/utils/parseCSV.js`의 `withDerivedFields`에서만 계산한다.
- 필드값(`구분` = 중등/고등)은 유지하고 라벨만 변경한다.
- 테스트는 Vitest(`describe`/`it`/`expect`), 한국어 테스트명 스타일을 따른다.
- 명령은 프로젝트 루트 `D:\교과서 문학 단행본 시리즈\literature-db`에서 실행한다.

## File Structure

- `src/utils/parseCSV.js` — `subjectOf(work)` 헬퍼 export + `withDerivedFields`에 `_subject` 추가
- `src/constants.js` — `SUBJECTS = ['국어', '문학']` 추가
- `src/utils/filterWorks.js` — `subject` 파라미터 추가 (subjectOf import)
- `src/components/search/FilterPanel.jsx` — 라벨 변경 + 과목 필터 추가
- `src/components/search/ActiveFilters.jsx` — `FILTER_LABELS` 라벨 변경 + 과목 추가
- `src/utils/exportExcel.js` — 결과 행에 `과목` 컬럼 추가
- `src/tests/parseCSV.test.js` — `subjectOf` / `_subject` 테스트
- `src/tests/filterWorks.test.js` — 과목 필터 테스트

---

### Task 1: 과목 파생 필드 (`subjectOf` + `_subject`)

**Files:**
- Modify: `src/utils/parseCSV.js`
- Test: `src/tests/parseCSV.test.js`

**Interfaces:**
- Produces: `subjectOf(work)` — 인자는 작품 객체, `work['교과서명']`에 `'문학'` 포함 시 `'문학'` 반환, 아니면 `'국어'` 반환. `withDerivedFields(work)`가 반환하는 객체에 `_subject: string` 필드 추가.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/tests/parseCSV.test.js`의 `import` 줄을 다음으로 교체:

```javascript
import { extractAuthorBase, subjectOf, parseCSV } from '../utils/parseCSV'
```

파일 끝(마지막 `})` 다음)에 추가:

```javascript
describe('subjectOf', () => {
  it('교과서명에 문학 포함 → 문학', () => {
    expect(subjectOf({ 교과서명: '문학' })).toBe('문학')
    expect(subjectOf({ 교과서명: '문학Ⅰ' })).toBe('문학')
    expect(subjectOf({ 교과서명: '문학Ⅱ' })).toBe('문학')
  })
  it('그 외 교과서명 → 국어', () => {
    expect(subjectOf({ 교과서명: '중학 국어 1-1' })).toBe('국어')
    expect(subjectOf({ 교과서명: '공통국어1' })).toBe('국어')
    expect(subjectOf({ 교과서명: '국어 (상)' })).toBe('국어')
    expect(subjectOf({ 교과서명: '국어Ⅰ' })).toBe('국어')
  })
  it('교과서명 없으면 국어', () => {
    expect(subjectOf({})).toBe('국어')
  })
})

describe('parseCSV - _subject 파생', () => {
  const HEADER2 = '교육과정,구분,학년,학기,교과서명,장르,작품명,지은이'
  it('문학 교과서 행은 _subject = 문학', () => {
    const csv = `${HEADER2}\n7차,고등,1,1,문학,소설,메밀꽃 필 무렵,이효석`
    expect(parseCSV(csv)[0]._subject).toBe('문학')
  })
  it('국어 교과서 행은 _subject = 국어', () => {
    const csv = `${HEADER2}\n1차,중등,1,1,중학 국어 1-1,소설,마지막 공부,알퐁스 도데`
    expect(parseCSV(csv)[0]._subject).toBe('국어')
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test -- --run src/tests/parseCSV.test.js`
Expected: FAIL — `subjectOf is not a function` / `_subject`가 undefined

- [ ] **Step 3: 최소 구현**

`src/utils/parseCSV.js`에서 `extractAuthorBase` 함수 아래에 `subjectOf` 추가하고, `withDerivedFields`에 `_subject`를 넣는다:

```javascript
export function extractAuthorBase(author) {
  if (!author) return ''
  return author.replace(/\(.*?\)/g, '').trim()
}

// 교과서명으로 과목을 도출한다. '문학' 포함이면 문학, 그 외는 국어.
export function subjectOf(work) {
  return (work['교과서명'] || '').includes('문학') ? '문학' : '국어'
}

// 검색용 파생 필드(작가 기준명·초성·과목)를 작품 객체에 부여한다.
export function withDerivedFields(work) {
  const authorBase = extractAuthorBase(work['지은이'])
  return {
    ...work,
    _authorBase: authorBase,
    _titleChosung: toChosung(work['작품명']),
    _authorChosung: toChosung(authorBase),
    _subject: subjectOf(work),
  }
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test -- --run src/tests/parseCSV.test.js`
Expected: PASS (기존 테스트 포함 전부 통과)

- [ ] **Step 5: 커밋**

```bash
git add src/utils/parseCSV.js src/tests/parseCSV.test.js
git commit -m "feat: 교과서명 기반 과목(_subject) 파생 필드 추가"
```

---

### Task 2: filterWorks에 과목 필터 추가

**Files:**
- Modify: `src/utils/filterWorks.js`
- Test: `src/tests/filterWorks.test.js`

**Interfaces:**
- Consumes: `subjectOf(work)` (Task 1, `../utils/parseCSV`에서 import)
- Produces: `filterWorks(works, { ..., subject = [] })` — `subject` 배열이 비어있지 않으면 `work._subject ?? subjectOf(work)`가 목록에 포함된 작품만 통과.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/tests/filterWorks.test.js`의 `WORKS` 배열 각 항목에 `교과서명`과 `_subject`를 보강하고 과목 테스트를 추가한다. `WORKS` 정의를 다음으로 교체:

```javascript
const WORKS = [
  { 교육과정: '1차', 구분: '중등', 학년: '1', 학기: '1', 교과서명: '중학 국어 1-1', 장르: '시', 작품명: '산유화', 지은이: '김소월', _authorBase: '김소월', _subject: '국어' },
  { 교육과정: '2차', 구분: '고등', 학년: '1', 학기: '2', 교과서명: '문학', 장르: '소설', 작품명: '사랑손님과 어머니', 지은이: '주요섭', _authorBase: '주요섭', _subject: '문학' },
  { 교육과정: '3차', 구분: '중등', 학년: '2', 학기: '1', 교과서명: '중학 국어 2-1', 장르: '시', 작품명: '가지 않은 길', 지은이: '로버트 프로스트(피천득 옮김)', _authorBase: '로버트 프로스트', _subject: '국어' },
]
```

`describe('filterWorks', ...)` 블록 안(예: 구분 필터 테스트 아래)에 추가:

```javascript
  it('과목 필터 - 문학 단일 선택', () => {
    const result = filterWorks(WORKS, { subject: ['문학'] })
    expect(result).toHaveLength(1)
    expect(result[0]['작품명']).toBe('사랑손님과 어머니')
  })
  it('과목 필터 - 국어 단일 선택', () => {
    expect(filterWorks(WORKS, { subject: ['국어'] })).toHaveLength(2)
  })
  it('과목 필터 - _subject 없으면 교과서명으로 폴백', () => {
    const noDerived = [{ 교과서명: '문학Ⅱ', 작품명: '홍길동전', 지은이: '허균' }]
    expect(filterWorks(noDerived, { subject: ['문학'] })).toHaveLength(1)
    expect(filterWorks(noDerived, { subject: ['국어'] })).toHaveLength(0)
  })
  it('복합 필터 - 과목 + 학교급', () => {
    expect(filterWorks(WORKS, { subject: ['국어'], division: ['중등'] })).toHaveLength(2)
  })
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test -- --run src/tests/filterWorks.test.js`
Expected: FAIL — 과목 필터가 무시되어 개수가 맞지 않음

- [ ] **Step 3: 최소 구현**

`src/utils/filterWorks.js` 상단 import에 `subjectOf` 추가:

```javascript
import { toChosung, isChosungQuery } from './chosung'
import { subjectOf } from './parseCSV'
```

`filterWorks` 시그니처에 `subject = []`를 추가하고, `division` 조건 바로 아래에 과목 조건을 넣는다:

```javascript
export function filterWorks(works, { curriculum = [], division = [], subject = [], genre = [], grade = [], system = [], publisher = [], query = '', debutOnly = false } = {}, debutMap = null) {
```

```javascript
    if (division.length && !division.includes(work['구분'])) return false
    if (subject.length && !subject.includes(work._subject ?? subjectOf(work))) return false
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test -- --run src/tests/filterWorks.test.js`
Expected: PASS (기존 구분/복합 필터 테스트 포함 전부 통과)

- [ ] **Step 5: 커밋**

```bash
git add src/utils/filterWorks.js src/tests/filterWorks.test.js
git commit -m "feat: filterWorks에 과목(subject) 필터 조건 추가"
```

---

### Task 3: UI — 학교급 라벨 변경 + 과목 필터 노출

**Files:**
- Modify: `src/constants.js`
- Modify: `src/components/search/FilterPanel.jsx`
- Modify: `src/components/search/ActiveFilters.jsx`

**Interfaces:**
- Consumes: `filterWorks`의 `subject` 파라미터 (Task 2)
- Produces: `SUBJECTS = ['국어', '문학']` (`src/constants.js` export). 필터 UI에 '과목' 드롭다운 노출, '구분' 라벨은 '학교급'으로 표기.

- [ ] **Step 1: SUBJECTS 상수 추가**

`src/constants.js`의 `DIVISIONS` 줄 아래에 추가:

```javascript
export const DIVISIONS = ['중등', '고등']

export const SUBJECTS = ['국어', '문학']
```

- [ ] **Step 2: FilterPanel 라벨 변경 + 과목 필터 추가**

`src/components/search/FilterPanel.jsx`의 import에 `SUBJECTS` 추가:

```javascript
import { GENRES, DIVISIONS, SUBJECTS, orderCurricula } from '../../constants'
```

`FILTER_CONFIGS`에서 division 라벨을 '학교급'으로 바꾸고 그 뒤에 과목 항목 추가:

```javascript
  const FILTER_CONFIGS = [
    { key: 'curriculum', label: '교육과정', options: curricula },
    { key: 'system', label: '체제', options: systems },
    { key: 'division', label: '학교급', options: DIVISIONS },
    { key: 'subject', label: '과목', options: SUBJECTS },
    { key: 'genre', label: '장르', options: GENRES },
    { key: 'grade', label: '학년', options: grades },
    { key: 'publisher', label: '출판사', options: publishers, panelClassName: 'w-max' },
  ]
```

- [ ] **Step 3: ActiveFilters 라벨/칩 배선**

`src/components/search/ActiveFilters.jsx`의 `FILTER_LABELS`를 다음으로 교체:

```javascript
const FILTER_LABELS = {
  curriculum: '교육과정',
  system: '체제',
  division: '학교급',
  subject: '과목',
  genre: '장르',
  grade: '학년',
  publisher: '출판사',
}
```

- [ ] **Step 4: 테스트 실행 → 회귀 없음 확인**

Run: `npm test -- --run`
Expected: PASS (전체 테스트 통과)

- [ ] **Step 5: 개발 서버로 육안 확인**

Run: `npm run dev`
확인 항목:
- 필터 바에 '학교급'(중등/고등)과 '과목'(국어/문학)이 표시됨
- 과목 = 문학 선택 시 중등 작품이 모두 사라지고 고등 문학만 남음
- 활성 필터 칩에 `과목: 문학` 형태로 표시되고 ✕로 제거됨
확인 후 서버 종료(Ctrl+C).

- [ ] **Step 6: 커밋**

```bash
git add src/constants.js src/components/search/FilterPanel.jsx src/components/search/ActiveFilters.jsx
git commit -m "feat: 검색 필터에 과목 추가 · 구분 라벨을 학교급으로 변경"
```

---

### Task 4: 엑셀 내보내기에 과목 컬럼 추가

**Files:**
- Modify: `src/utils/exportExcel.js`

**Interfaces:**
- Consumes: `subjectOf(work)` (Task 1), `_subject` 파생 필드
- Produces: `exportToExcel` 출력 행에 `과목` 컬럼 추가.

- [ ] **Step 1: import 추가 및 컬럼 배선**

`src/utils/exportExcel.js` 상단에 import 추가:

```javascript
import * as XLSX from 'xlsx'
import { subjectOf } from './parseCSV'
```

`exportToExcel`의 행 매핑에서 `구분` 다음에 `과목`을 추가:

```javascript
  const rows = works.map(w => ({
    '교육과정': w['교육과정'],
    '구분': w['구분'],
    '과목': w._subject ?? subjectOf(w),
    '학년': w['학년'],
    '학기': w['학기'],
    '교과서명': w['교과서명'],
    '장르': w['장르'],
    '작품명': w['작품명'],
    '지은이': w['지은이'],
  }))
```

- [ ] **Step 2: 테스트 실행 → 회귀 없음 확인**

Run: `npm test -- --run`
Expected: PASS

- [ ] **Step 3: 커밋**

```bash
git add src/utils/exportExcel.js
git commit -m "feat: 엑셀 내보내기 결과에 과목 컬럼 추가"
```

---

## Self-Review

**Spec coverage:**
- 과목 판정 규칙(교과서명 → 문학/국어) → Task 1 ✅
- `_subject` 파생 필드 + `withDerivedFields` → Task 1 ✅
- `SUBJECTS` 상수 → Task 3 ✅
- filterWorks `subject` 파라미터 + `??` 폴백 → Task 2 ✅
- FilterPanel 라벨(구분→학교급) + 과목 필터 → Task 3 ✅
- ActiveFilters 라벨/칩 → Task 3 ✅
- exportExcel 과목 컬럼 → Task 4 ✅
- 테스트(subjectOf 규칙 + 과목 필터 조합) → Task 1, Task 2 ✅

**타입 일관성:** `subjectOf(work)`는 전 태스크에서 동일 시그니처(작품 객체 → 문자열). `_subject` 필드명 일관. `subject` 필터 키 일관(filterWorks/FilterPanel/ActiveFilters).

**Placeholder 스캔:** TBD/TODO 없음, 모든 코드 스텝에 실제 코드 포함.

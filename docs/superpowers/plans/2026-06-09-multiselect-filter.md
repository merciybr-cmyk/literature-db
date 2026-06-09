# 다중 선택 필터 + 중복 배지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 검색탐색 탭의 필터 4개(교육과정·구분·장르·학년)를 다중 선택 드롭다운으로 교체하고, 교육과정 2개 이상 선택 시 중복 수록 작품에 차수 배지를 표시한다.

**Architecture:** 필터 상태를 `string` → `string[]`로 변경하고 OR 조건 필터링을 적용한다. 새로운 `MultiSelectDropdown` 컴포넌트가 FilterPanel의 `<select>`를 대체한다. WorksTable은 `selectedCurricula` prop을 받아 중복 작품 배지를 렌더링한다.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Vitest + @testing-library/react, jsdom

---

## 파일 목록

| 파일 | 변경 |
|------|------|
| `src/utils/filterWorks.js` | 수정 — 배열 기반 OR 필터 |
| `src/tests/filterWorks.test.js` | 수정 — 배열 기반 테스트로 업데이트 |
| `src/components/search/MultiSelectDropdown.jsx` | 신규 생성 |
| `src/tests/MultiSelectDropdown.test.jsx` | 신규 생성 |
| `src/components/search/FilterPanel.jsx` | 수정 — MultiSelectDropdown 사용 |
| `src/pages/SearchPage.jsx` | 수정 — INITIAL_FILTERS 배열로 변경, selectedCurricula 전달 |
| `src/components/search/WorksTable.jsx` | 수정 — 중복 배지 추가 |
| `src/components/stats/CurriculumBarChart.jsx` | 수정 — 배열로 navigate |
| `src/components/stats/GenrePieChart.jsx` | 수정 — 배열로 navigate |

---

### Task 1: filterWorks — 배열 기반 OR 필터

**Files:**
- Modify: `src/utils/filterWorks.js`
- Modify: `src/tests/filterWorks.test.js`

- [ ] **Step 1: 기존 테스트를 배열 기반으로 업데이트하고 다중 선택 케이스 추가**

`src/tests/filterWorks.test.js` 전체 내용을 아래로 교체:

```js
import { describe, it, expect } from 'vitest'
import { filterWorks, getUniqueValues } from '../utils/filterWorks'

const WORKS = [
  { 교육과정: '1차', 구분: '중등', 학년: '1', 학기: '1', 장르: '시', 작품명: '산유화', 지은이: '김소월', _authorBase: '김소월' },
  { 교육과정: '2차', 구분: '고등', 학년: '1', 학기: '2', 장르: '소설', 작품명: '사랑손님과 어머니', 지은이: '주요섭', _authorBase: '주요섭' },
  { 교육과정: '3차', 구분: '중등', 학년: '2', 학기: '1', 장르: '시', 작품명: '가지 않은 길', 지은이: '로버트 프로스트(피천득 옮김)', _authorBase: '로버트 프로스트' },
]

describe('filterWorks', () => {
  it('필터 없으면 전체 반환', () => {
    expect(filterWorks(WORKS, {})).toHaveLength(3)
  })

  it('교육과정 필터 - 빈 배열은 전체 반환', () => {
    expect(filterWorks(WORKS, { curriculum: [] })).toHaveLength(3)
  })
  it('교육과정 필터 - 단일 선택', () => {
    const result = filterWorks(WORKS, { curriculum: ['1차'] })
    expect(result).toHaveLength(1)
    expect(result[0]['작품명']).toBe('산유화')
  })
  it('교육과정 필터 - 다중 선택 (OR)', () => {
    const result = filterWorks(WORKS, { curriculum: ['1차', '2차'] })
    expect(result).toHaveLength(2)
  })

  it('구분 필터 - 단일 선택', () => {
    expect(filterWorks(WORKS, { division: ['고등'] })).toHaveLength(1)
  })
  it('구분 필터 - 다중 선택', () => {
    expect(filterWorks(WORKS, { division: ['중등', '고등'] })).toHaveLength(3)
  })

  it('장르 필터 - 단일 선택', () => {
    expect(filterWorks(WORKS, { genre: ['시'] })).toHaveLength(2)
  })
  it('장르 필터 - 다중 선택', () => {
    expect(filterWorks(WORKS, { genre: ['시', '소설'] })).toHaveLength(3)
  })

  it('학년 필터 - 단일 선택', () => {
    expect(filterWorks(WORKS, { grade: ['2'] })).toHaveLength(1)
  })

  it('작품명 텍스트 검색 (부분 일치)', () => {
    expect(filterWorks(WORKS, { query: '산유' })).toHaveLength(1)
  })
  it('작가명 괄호 앞 기준 검색', () => {
    const result = filterWorks(WORKS, { query: '로버트 프로스트' })
    expect(result).toHaveLength(1)
    expect(result[0]['작품명']).toBe('가지 않은 길')
  })
  it('복합 필터 - 장르 + 구분', () => {
    expect(filterWorks(WORKS, { genre: ['시'], division: ['중등'] })).toHaveLength(2)
  })
  it('복합 필터 - 교육과정 다중 + 장르', () => {
    const result = filterWorks(WORKS, { curriculum: ['1차', '3차'], genre: ['시'] })
    expect(result).toHaveLength(2)
  })
})

describe('getUniqueValues', () => {
  it('특정 필드의 유니크 값 반환', () => {
    const result = getUniqueValues(WORKS, '장르')
    expect(result).toContain('시')
    expect(result).toContain('소설')
    expect(result).toHaveLength(2)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```
npx vitest run src/tests/filterWorks.test.js
```

Expected: 배열 기반 테스트들이 FAIL (기존 구현은 string 비교)

- [ ] **Step 3: filterWorks.js 배열 기반으로 수정**

`src/utils/filterWorks.js` 전체 내용을 아래로 교체:

```js
export function filterWorks(works, { curriculum = [], division = [], genre = [], grade = [], query = '' } = {}) {
  return works.filter(work => {
    if (curriculum.length && !curriculum.includes(work['교육과정'])) return false
    if (division.length && !division.includes(work['구분'])) return false
    if (genre.length && !genre.includes(work['장르'])) return false
    if (grade.length && !grade.includes(work['학년'])) return false
    if (query) {
      const q = query.toLowerCase()
      if (!work['작품명'].toLowerCase().includes(q) && !work._authorBase.toLowerCase().includes(q)) return false
    }
    return true
  })
}

export function getUniqueValues(works, field) {
  return [...new Set(works.map(w => w[field]).filter(Boolean))].sort()
}
```

- [ ] **Step 4: 테스트 통과 확인**

```
npx vitest run src/tests/filterWorks.test.js
```

Expected: 전체 PASS

- [ ] **Step 5: 커밋**

```
git add src/utils/filterWorks.js src/tests/filterWorks.test.js
git commit -m "feat: update filterWorks to accept arrays with OR logic"
```

---

### Task 2: MultiSelectDropdown 컴포넌트

**Files:**
- Create: `src/components/search/MultiSelectDropdown.jsx`
- Create: `src/tests/MultiSelectDropdown.test.jsx`

- [ ] **Step 1: 테스트 파일 작성**

`src/tests/MultiSelectDropdown.test.jsx` 생성:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MultiSelectDropdown from '../components/search/MultiSelectDropdown'

const OPTIONS = ['1차', '2차', '3차']

describe('MultiSelectDropdown', () => {
  it('선택 없으면 "전체" 표시', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={() => {}} />)
    expect(screen.getByRole('button')).toHaveTextContent('전체')
  })

  it('1개 선택 시 항목명 표시', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={['2차']} onChange={() => {}} />)
    expect(screen.getByRole('button')).toHaveTextContent('2차')
  })

  it('2개 이상 선택 시 "N개 선택" 표시', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={['1차', '3차']} onChange={() => {}} />)
    expect(screen.getByRole('button')).toHaveTextContent('2개 선택')
  })

  it('버튼 클릭 시 드롭다운 열림', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('1차')).toBeInTheDocument()
    expect(screen.getByText('2차')).toBeInTheDocument()
  })

  it('체크박스 클릭 시 onChange 호출', () => {
    const onChange = vi.fn()
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByLabelText('1차'))
    expect(onChange).toHaveBeenCalledWith(['1차'])
  })

  it('선택된 항목 체크박스 해제 시 제거', () => {
    const onChange = vi.fn()
    render(<MultiSelectDropdown options={OPTIONS} value={['1차', '2차']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByLabelText('1차'))
    expect(onChange).toHaveBeenCalledWith(['2차'])
  })

  it('전체 해제 버튼 클릭 시 빈 배열 전달', () => {
    const onChange = vi.fn()
    render(<MultiSelectDropdown options={OPTIONS} value={['1차']} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('전체 해제'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('선택 없으면 전체 해제 버튼 없음', () => {
    render(<MultiSelectDropdown options={OPTIONS} value={[]} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('전체 해제')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```
npx vitest run src/tests/MultiSelectDropdown.test.jsx
```

Expected: FAIL (컴포넌트 없음)

- [ ] **Step 3: MultiSelectDropdown 구현**

`src/components/search/MultiSelectDropdown.jsx` 생성:

```jsx
import { useState, useRef, useEffect } from 'react'

export default function MultiSelectDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(option) {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  const buttonLabel =
    value.length === 0 ? '전체' :
    value.length === 1 ? value[0] :
    `${value.length}개 선택`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`border rounded px-2 py-1.5 text-sm min-w-[90px] bg-white text-left flex items-center justify-between gap-2 ${
          value.length > 0 ? 'border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700'
        }`}
      >
        <span>{buttonLabel}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded shadow-md min-w-[110px]">
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border-b border-gray-100"
            >
              전체 해제
            </button>
          )}
          {options.map(option => (
            <label
              key={option}
              className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50"
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => toggle(option)}
                className="accent-blue-600"
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```
npx vitest run src/tests/MultiSelectDropdown.test.jsx
```

Expected: 전체 PASS

- [ ] **Step 5: 커밋**

```
git add src/components/search/MultiSelectDropdown.jsx src/tests/MultiSelectDropdown.test.jsx
git commit -m "feat: add MultiSelectDropdown component"
```

---

### Task 3: FilterPanel — MultiSelectDropdown 적용

**Files:**
- Modify: `src/components/search/FilterPanel.jsx`

- [ ] **Step 1: FilterPanel 수정**

`src/components/search/FilterPanel.jsx` 전체 내용을 아래로 교체:

```jsx
import { useMemo } from 'react'
import { getUniqueValues } from '../../utils/filterWorks'
import MultiSelectDropdown from './MultiSelectDropdown'

const CURRICULA = ['1차', '2차', '3차', '4차', '5차', '6차', '7차']
const GENRES = ['시', '소설', '수필', '시조', '고전산문', '고전운문', '극본']
const DIVISIONS = ['중등', '고등']

export default function FilterPanel({ works, filters, onChange }) {
  const grades = useMemo(
    () => getUniqueValues(works, '학년').filter(g => g !== 'X'),
    [works]
  )

  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  const FILTER_CONFIGS = [
    { key: 'curriculum', label: '교육과정', options: CURRICULA },
    { key: 'division', label: '구분', options: DIVISIONS },
    { key: 'genre', label: '장르', options: GENRES },
    { key: 'grade', label: '학년', options: grades },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-4">
      {FILTER_CONFIGS.map(({ key, label, options }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">{label}</label>
          <MultiSelectDropdown
            options={options}
            value={filters[key] || []}
            onChange={v => update(key, v)}
          />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 전체 테스트 확인**

```
npx vitest run
```

Expected: 전체 PASS

- [ ] **Step 3: 커밋**

```
git add src/components/search/FilterPanel.jsx
git commit -m "feat: replace select with MultiSelectDropdown in FilterPanel"
```

---

### Task 4: SearchPage — 초기 상태 + WorksTable 연결

**Files:**
- Modify: `src/pages/SearchPage.jsx`

- [ ] **Step 1: SearchPage 수정**

`src/pages/SearchPage.jsx` 전체 내용을 아래로 교체:

```jsx
import { useState, useEffect, useMemo } from 'react'
import FilterPanel from '../components/search/FilterPanel'
import SearchBar from '../components/search/SearchBar'
import WorksTable from '../components/search/WorksTable'
import ExportButton from '../components/search/ExportButton'
import { filterWorks } from '../utils/filterWorks'

const INITIAL_FILTERS = { curriculum: [], division: [], genre: [], grade: [], query: '' }

export default function SearchPage({ works, initialFilters, onFiltersApplied }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  useEffect(() => {
    if (initialFilters) {
      setFilters({ ...INITIAL_FILTERS, ...initialFilters })
      onFiltersApplied()
    }
  }, [initialFilters])

  function handleReset() {
    setFilters(INITIAL_FILTERS)
  }

  const filtered = useMemo(() => filterWorks(works, filters), [works, filters])

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
      <FilterPanel works={works} filters={filters} onChange={setFilters} />
      <SearchBar
        query={filters.query}
        onChange={q => setFilters(f => ({ ...f, query: q }))}
        onReset={handleReset}
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          검색 결과 <strong className="text-gray-900">{filtered.length.toLocaleString()}</strong>건
        </span>
        <ExportButton works={filtered} />
      </div>
      <WorksTable works={filtered} allWorks={works} selectedCurricula={filters.curriculum} />
    </main>
  )
}
```

- [ ] **Step 2: 전체 테스트 확인**

```
npx vitest run
```

Expected: 전체 PASS

- [ ] **Step 3: 커밋**

```
git add src/pages/SearchPage.jsx
git commit -m "feat: update SearchPage to use array filters and pass selectedCurricula"
```

---

### Task 5: WorksTable — 중복 배지

**Files:**
- Modify: `src/components/search/WorksTable.jsx`

- [ ] **Step 1: WorksTable 수정**

`src/components/search/WorksTable.jsx`에서 아래 두 부분을 수정한다.

**a) import에 useMemo 추가:**

```jsx
import { useState, useEffect, useMemo } from 'react'
```

**b) 컴포넌트 signature에 selectedCurricula 추가:**

```jsx
export default function WorksTable({ works, allWorks, selectedCurricula = [] }) {
```

**c) `handleSort` 함수 바로 위에 duplicateMap 계산 추가:**

```jsx
  const duplicateMap = useMemo(() => {
    if (selectedCurricula.length < 2) return new Map()
    const map = new Map()
    for (const work of works) {
      const title = work['작품명']
      if (!map.has(title)) map.set(title, new Set())
      map.get(title).add(work['교육과정'])
    }
    for (const [title, curricula] of map) {
      if (curricula.size < 2) map.delete(title)
    }
    return map
  }, [works, selectedCurricula])
```

**d) 작품명 셀 렌더링 교체 — 기존:**

```jsx
                    onClick={col.key === '작품명' ? () => setSelectedWork(work) : undefined}
                    >
                      {work[col.key]}
```

교체 후:

```jsx
                    onClick={col.key === '작품명' ? () => setSelectedWork(work) : undefined}
                    >
                      {col.key === '작품명' && duplicateMap.has(work['작품명']) ? (
                        <>
                          {work[col.key]}
                          <span className="ml-1.5 inline-flex gap-0.5">
                            {[...duplicateMap.get(work['작품명'])].map(c => (
                              <span key={c} className="text-xs bg-amber-100 text-amber-700 px-1 rounded font-normal">
                                {c}
                              </span>
                            ))}
                          </span>
                        </>
                      ) : work[col.key]}
```

- [ ] **Step 2: 전체 테스트 확인**

```
npx vitest run
```

Expected: 전체 PASS

- [ ] **Step 3: 커밋**

```
git add src/components/search/WorksTable.jsx
git commit -m "feat: add duplicate curriculum badge to WorksTable"
```

---

### Task 6: 차트 컴포넌트 — 배열로 navigate

**Files:**
- Modify: `src/components/stats/CurriculumBarChart.jsx`
- Modify: `src/components/stats/GenrePieChart.jsx`

- [ ] **Step 1: CurriculumBarChart 수정**

`src/components/stats/CurriculumBarChart.jsx` 에서:

```jsx
// 기존
onBarClick({ curriculum: e.activePayload[0].payload.name })

// 변경
onBarClick({ curriculum: [e.activePayload[0].payload.name] })
```

- [ ] **Step 2: GenrePieChart 수정**

`src/components/stats/GenrePieChart.jsx` 에서:

```jsx
// 기존
onSliceClick({ genre: entry.name })

// 변경
onSliceClick({ genre: [entry.name] })
```

- [ ] **Step 3: 전체 테스트 확인**

```
npx vitest run
```

Expected: 전체 PASS

- [ ] **Step 4: 커밋**

```
git add src/components/stats/CurriculumBarChart.jsx src/components/stats/GenrePieChart.jsx
git commit -m "feat: pass array filters from chart click handlers"
```

---

### Task 7: 빌드 및 수동 검증

- [ ] **Step 1: 개발 서버 실행**

```
npm run dev
```

- [ ] **Step 2: 다중 선택 동작 확인**
  - 교육과정 드롭다운에서 `1차`, `2차` 체크 → 결과에 두 차수 작품 모두 표시
  - 버튼에 `2개 선택` 표시
  - `전체 해제` 클릭 → 필터 초기화

- [ ] **Step 3: 중복 배지 확인**
  - 교육과정 `1차`, `2차` 선택 후 동일 작품명이 두 행에 배지(`1차 2차`) 표시되는지 확인

- [ ] **Step 4: 통계 탭 연동 확인**
  - 통계 탭 교육과정 막대 클릭 → 검색탭으로 이동 후 해당 차수 1개 선택 상태 확인
  - 장르 파이 차트 클릭 → 검색탭으로 이동 후 해당 장르 1개 선택 상태 확인

- [ ] **Step 5: 프로덕션 빌드 확인**

```
npm run build
```

Expected: 에러 없이 빌드 완료

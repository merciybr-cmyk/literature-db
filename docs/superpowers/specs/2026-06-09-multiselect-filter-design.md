# 다중 선택 필터 + 중복 배지 설계

**날짜:** 2026-06-09

## 개요

검색탐색 탭의 필터(교육과정, 구분, 장르, 학년)를 단일 선택에서 다중 선택으로 변경한다.
교육과정 2개 이상 선택 시, 결과 테이블에서 여러 차수에 걸쳐 수록된 작품에 차수 배지를 표시한다.

---

## 1. 상태 형태 변경

### Before
```js
{ curriculum: '', division: '', genre: '', grade: '', query: '' }
```

### After
```js
{ curriculum: [], division: [], genre: [], grade: [], query: '' }
```

- 배열이 비어 있으면 해당 필터 적용 안 함 (전체)
- OR 조건: 선택된 값 중 하나라도 일치하면 포함

---

## 2. 새 컴포넌트: `MultiSelectDropdown`

**파일:** `src/components/search/MultiSelectDropdown.jsx`

**Props:**
| prop | 타입 | 설명 |
|------|------|------|
| `label` | `string` | 필터 레이블 (사용 안 함, FilterPanel에서 처리) |
| `options` | `string[]` | 선택 가능한 값 목록 |
| `value` | `string[]` | 현재 선택된 값 배열 |
| `onChange` | `(string[]) => void` | 선택 변경 콜백 |

**동작:**
- 버튼 텍스트: 0개 → `전체`, 1개 → 항목명, 2개 이상 → `N개 선택`
- 버튼 클릭 시 드롭다운 열림/닫힘
- 드롭다운 내 각 옵션에 체크박스
- 선택 항목이 있을 때 `전체 해제` 버튼 제공
- 외부 클릭 시 드롭다운 닫힘 (useRef + mousedown 이벤트)

---

## 3. FilterPanel 변경

`src/components/search/FilterPanel.jsx`

- 기존 `<select>` → `<MultiSelectDropdown>` 교체 (4개 필터 모두)
- `update(key, value)` 함수는 그대로 유지 (value가 배열로 바뀜)

---

## 4. filterWorks 변경

`src/utils/filterWorks.js`

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
```

---

## 5. 중복 배지 (WorksTable)

`src/components/search/WorksTable.jsx`

**Props 추가:** `selectedCurricula: string[]`

**조건:** `selectedCurricula.length >= 2`일 때만 배지 계산 및 표시

**로직:**
1. `works` 배열에서 작품명별로 등장하는 교육과정 목록을 Map으로 집계
2. 2개 이상 교육과정에 등장하는 작품명을 "중복 작품"으로 분류
3. 해당 작품명을 가진 행의 작품명 셀 옆에 차수 배지 표시

**배지 예시:**
- 봄봄 `1차 2차` (모든 해당 행에 동일하게 표시)

---

## 6. 통계 탭 연동 호환

차트에서 검색탭으로 넘기는 필터 값을 배열로 변경:

- `CurriculumBarChart`: `{ curriculum: '1차' }` → `{ curriculum: ['1차'] }`
- `GenrePieChart`: `{ genre: '시' }` → `{ genre: ['시'] }`

`SearchPage`의 `initialFilters` 처리에서 배열로 정규화:
```js
setFilters({ ...INITIAL_FILTERS, ...initialFilters })
// initialFilters가 이미 배열이므로 그대로 spread됨
```

---

## 수정 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `src/components/search/MultiSelectDropdown.jsx` | 신규 생성 |
| `src/components/search/FilterPanel.jsx` | 수정 |
| `src/utils/filterWorks.js` | 수정 |
| `src/pages/SearchPage.jsx` | 수정 |
| `src/components/search/WorksTable.jsx` | 수정 |
| `src/components/stats/CurriculumBarChart.jsx` | 수정 |
| `src/components/stats/GenrePieChart.jsx` | 수정 |

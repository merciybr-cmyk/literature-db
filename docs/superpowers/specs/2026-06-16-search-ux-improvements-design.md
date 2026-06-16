# 검색·통계 UX 개선 설계 (2026-06-16)

사용자 편의를 위한 4개 기능. 각 기능은 독립적으로 구현·검증 가능.

## #1 검색 확대 (작품명·지은이 + 한글 초성)

- 검색창은 "작품/작가 찾기" 역할 유지. 교과서명·출판사는 이미 필터가 담당하므로 검색 대상에 넣지 않는다.
- 초성 검색 추가: 쿼리가 초성(ㄱ~ㅎ)으로만 구성된 경우 작품명·지은이의 초성열에 부분일치.

**구현**
- 새 파일 `src/utils/chosung.js`
  - `toChosung(str)`: 한글 음절 → 초성 문자열 (`김소월`→`ㄱㅅㅇ`), 한글 아닌 문자는 그대로.
  - `isChosungQuery(str)`: 공백 제외 모든 글자가 초성이면 true.
- 데이터 로딩 시 초성 미리 계산(캐싱): `parseCSV`/`works.json` 로딩 경로에서 `_titleChosung`, `_authorChosung` 부여.
- `filterWorks.js`: query가 초성 쿼리면 `_titleChosung`/`_authorChosung` 부분일치도 허용, 아니면 기존 부분일치 유지.

## #3 적용된 필터 칩

- 새 컴포넌트 `src/components/search/ActiveFilters.jsx`
  - 현재 걸린 배열 필터(curriculum/division/genre/grade/system/publisher)와 query를 `라벨: 값 ✕` 칩으로 표시.
  - 칩 ✕ → 해당 값만 제거. "전체 초기화" 버튼.
  - 걸린 필터가 없으면 렌더하지 않음.
- `SearchPage`의 검색창과 결과 수 줄 사이에 배치.

## #5 모바일 카드형

- `WorksTable.jsx`: `md` 이상은 기존 표 유지. `md` 미만에서 카드 리스트(작품명·지은이·장르·교육과정·교과서명) 표시. 정렬/페이지네이션 상태 공유.
- `FilterPanel.jsx`: `md` 미만에서 "필터 ▼" 토글로 접기.

## #8 교육과정 간 작품 비교

- 새 페이지 `src/pages/ComparePage.jsx` + NavBar에 "교육과정 비교" 탭.
- 교육과정 2개(A/B) 선택 → 공통 / A에만(빠짐) / B에만(신규) 작품 집계 + 목록.
- 작품 식별: `작품명 + _authorBase` (기존 중복 페이지와 동일).
- 작품명 클릭 시 기존 `WorkDetailModal` 재사용.
- 새 유틸 `src/utils/compareCurricula.js` + Vitest 테스트.

## 공통 원칙

- 교육과정 목록·정렬은 `src/constants.js` 재사용.
- 새 유틸(`chosung`, `compareCurricula`)에 Vitest 테스트 추가.
- 기존 컬럼/필터/모달 동작 회귀 없음.

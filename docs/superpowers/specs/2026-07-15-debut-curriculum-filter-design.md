# "처음 수록만" 필터 설계 (검색 페이지)

**작성일:** 2026-07-15
**상태:** 승인됨 (구현 대기)

## 배경 / 문제

사용자는 원하는 조건으로 작품을 검색하고 결과를 엑셀로 받고 싶어 한다. 조건
검색 + 엑셀 내보내기는 **검색탐색(SearchPage)** 탭에 이미 있다(교육과정·체제·
구분·장르·학년·출판사 드롭다운 + 작품명/작가 텍스트 검색 + `ExportButton`).

그러나 대표적 요구인 **"5차 교육과정에서 *처음* 수록된 작품"**은 현재 필터로
표현되지 않는다. 교육과정=`5차` 필터는 5차에 나온 **모든** 작품(1~4차에 이미
실렸다가 계속 실린 작품 포함)을 반환하기 때문이다. "처음(데뷔) 수록"은 교육과정
비교(ComparePage) 탭에서 A=5차, B=1~4차의 "5차에만" 결과로만 계산할 수 있어
번거롭다.

"자연어로 질문하는 AI 연동"도 검토했으나, 정적 사이트(GitHub Pages)라 API 키를
숨길 백엔드가 필요하고, 대부분 조건은 이미 드롭다운으로 충분하다. 결론적으로
**AI 없이, 지금 빠진 유일한 조건("처음 수록")만 필터 컨트롤로 채우는 것**이 가장
편하고 견고하다는 데 합의했다.

## 목표

검색 페이지에서 **교육과정 + 처음수록 + (장르/학년 등) 조합**을 클릭 몇 번으로
걸고, 결과를 기존 Excel 내보내기로 받을 수 있게 한다.

- 예: 교육과정=`5차`, 장르=`소설`, ☑처음수록 → "5차에서 처음 수록된 소설" →
  Excel.

비목표: 자연어 텍스트 파싱, LLM 연동, 백엔드.

## 동작 명세

검색 페이지 교육과정 필터 옆에 **☑ 첫 수록** 체크박스를 추가한다.

- **체크 + 교육과정 선택됨**: 선택한 교육과정에 나오는 작품 중, 그 작품의 **데뷔
  교육과정이 선택 목록 안에 있는** 행만 남긴다. → 이전 교육과정에는 한 번도
  실린 적 없는 작품만.
- **체크 + 교육과정 미선택**: 효과 없음(무엇 기준 "처음"인지 정할 수 없으므로).
  체크박스 옆에 "교육과정을 먼저 선택하세요"를 흐리게 안내.
- 단일 선택(예: `5차`) 시 = "5차에서 처음 수록" 정확 일치. 검증상 **302편**
  (`compareCurricula(works, ['5차'], ['1차','2차','3차','4차']).onlyA` 와 동일한
  작품 집합; 단 필터 결과는 교과서별 행 단위라 행 수는 302 이상일 수 있음).
- 다중 선택(예: `5차`+`6차`) 시 = 데뷔가 5·6차 중 하나인 작품의, 선택 교육과정
  내 행들. (주 사용처는 단일 선택이며, 다중 동작은 이 규칙으로 문서화한다.)

## "처음 수록" 정의

- 작품 식별: **작품명 + `_authorBase`** (중복 페이지·`compareCurricula`와 동일
  기준).
- 데뷔 교육과정 = 그 작품 식별자로 묶인 모든 행 중 `CURRICULUM_ORDER`
  (`src/constants.js`)상 인덱스가 **가장 이른** 교육과정.
- `CURRICULUM_ORDER`에 없는 교육과정 값은 순위상 뒤로(알려진 것들 다음) 취급.

## 구현 구조 (기존 패턴 재사용)

| 파일 | 변경 |
|---|---|
| `src/utils/debut.js` (신규) | `buildDebutMap(works)` → `Map<"작품명__authorBase", 데뷔교육과정>`. 전체 works 1회 순회. |
| `src/utils/filterWorks.js` | 시그니처에 데뷔맵 인자 추가(`filterWorks(works, filters, debutMap)`); `debutOnly`가 true고 `curriculum.length`가 있을 때 `curriculum.includes(debutMap.get(id))` 검사 한 줄 추가. 순수 함수 유지. `debutMap` 미제공 시 처음수록 조건은 무시(하위 호환). |
| `src/pages/SearchPage.jsx` | `INITIAL_FILTERS`에 `debutOnly: false` 추가; `useMemo`로 `buildDebutMap(works)` 계산 후 `filterWorks`에 전달. |
| `src/components/search/FilterPanel.jsx` | 체크박스 UI + 교육과정 미선택 시 안내. |
| `src/components/search/ActiveFilters.jsx` | "첫 수록 ✕" 칩(끄기 가능) 추가. |

- `WorksTable`, `ExportButton`/`exportExcel`는 **변경 없음** — 필터 결과를 그대로
  받으므로 자동 반영.
- `AuthorsPage` 등 `initialFilters`로 검색을 여는 경로는 `debutOnly` 키가 없어도
  `INITIAL_FILTERS` 스프레드로 기본 `false`가 채워지므로 영향 없음.

## 식별자 규칙 (구현 세부)

`buildDebutMap`과 `filterWorks`의 처음수록 검사는 동일한 id 문자열을 써야 한다:
`` `${work['작품명']}__${work._authorBase}` `` (`compareCurricula`와 동일 형식).

## 테스트

- `src/tests/debut.test.js` (신규): 여러 교육과정에 걸친 작품의 데뷔 교육과정을
  최이른 값으로 뽑는지; `CURRICULUM_ORDER` 밖 값 처리.
- `src/tests/filterWorks.test.js` (기존에 추가): 처음수록+교육과정 단일 선택
  결과, 교육과정 미선택 시 무효, 다중 선택 동작, 데뷔맵 미제공 시 하위 호환.

## 검증(엔드투엔드)

1. `npm test` 통과.
2. `npm run dev` 후 검색 페이지에서 교육과정=`5차`, ☑처음수록 → 표에 5차 데뷔
   작품만, 작품 집합이 비교탭 "5차에만"(302편)과 일치하는지 확인.
3. Excel 내보내기 클릭 → 필터된 결과가 그대로 xlsx로 저장되는지 확인.
4. `npm run build` 무오류.

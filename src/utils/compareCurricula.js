// 두 교육과정 "집합"에 수록된 작품을 비교한다.
// 각 변(A/B)은 하나 이상의 교육과정으로 구성될 수 있고, 해당 교육과정들의 합집합으로 본다.
// 작품 식별은 '작품명 + 작가 기준명(_authorBase)'으로 한다 (중복 페이지와 동일 기준).

function toRow(w) {
  return { 작품명: w['작품명'], 지은이: w['지은이'], 장르: w['장르'], _authorBase: w._authorBase }
}

function toSet(x) {
  if (Array.isArray(x)) return new Set(x.filter(Boolean))
  return new Set(x ? [x] : [])
}

function sameMembers(a, b) {
  return a.size === b.size && [...a].every(v => b.has(v))
}

export function compareCurricula(works, a, b) {
  const empty = { common: [], onlyA: [], onlyB: [] }
  const setA = toSet(a)
  const setB = toSet(b)
  // 한쪽이 비었거나 양쪽이 완전히 동일한 선택이면 비교 의미 없음
  if (setA.size === 0 || setB.size === 0 || sameMembers(setA, setB)) return empty

  const mapA = new Map()
  const mapB = new Map()
  for (const w of works) {
    const id = `${w['작품명']}__${w._authorBase}`
    if (setA.has(w['교육과정']) && !mapA.has(id)) mapA.set(id, w)
    if (setB.has(w['교육과정']) && !mapB.has(id)) mapB.set(id, w)
  }

  const common = []
  const onlyA = []
  const onlyB = []
  for (const [id, w] of mapA) {
    if (mapB.has(id)) common.push(toRow(w))
    else onlyA.push(toRow(w))
  }
  for (const [id, w] of mapB) {
    if (!mapA.has(id)) onlyB.push(toRow(w))
  }

  const byTitle = (x, y) => (x.작품명 || '').localeCompare(y.작품명 || '', 'ko')
  return {
    common: common.sort(byTitle),
    onlyA: onlyA.sort(byTitle),
    onlyB: onlyB.sort(byTitle),
  }
}

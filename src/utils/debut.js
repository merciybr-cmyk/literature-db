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

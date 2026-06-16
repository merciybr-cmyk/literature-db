// 교육과정·장르·구분 등 도메인 목록을 한 곳에서 관리한다.
// 새 교육과정/장르가 생기면 여기만 수정하면 전체 화면에 반영된다.

export const CURRICULUM_ORDER = [
  '1차', '2차', '3차', '4차', '5차', '6차', '7차',
  '2007개정', '2009개정', '2015개정', '2022개정',
]

export const GENRES = ['시', '소설', '수필', '시조', '고전산문', '고전운문', '극본']

export const DIVISIONS = ['중등', '고등']

// 주어진 교육과정 집합을 정해진 순서대로 정렬하되,
// 목록에 없는 값은 뒤에 붙여 누락을 방지한다.
export function orderCurricula(present) {
  const set = present instanceof Set ? present : new Set(present)
  const ordered = CURRICULUM_ORDER.filter(c => set.has(c))
  const rest = [...set].filter(c => !CURRICULUM_ORDER.includes(c)).sort()
  return [...ordered, ...rest]
}

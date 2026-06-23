// 작가별 저작권 정보의 정규화·매칭·상태 판정 유틸.
// 작품 DB의 _authorBase와 저작권 자료의 작가명을 공백 제거 후 정확 일치로 잇는다.
import { extractAuthorBase } from './parseCSV.js'

// 매칭 키: 괄호 주석 제거(extractAuthorBase) 후 모든 공백 제거.
export function normalizeAuthor(name) {
  return extractAuthorBase(name).replace(/\s+/g, '')
}

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

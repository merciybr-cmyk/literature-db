import { describe, it, expect } from 'vitest'
import { normalizeAuthor, lookupCopyright, copyrightStatuses, buildAuthorList } from '../utils/copyright'

const WORKS = [
  { 작품명: '진달래꽃', _authorBase: '김소월' },
  { 작품명: '산유화',   _authorBase: '김소월' },
  { 작품명: '날개',     _authorBase: '이상' },
]

const MAP = {
  '김소월': { matched: ['expired'], expired: { 만료시점: '2005.01.01' }, registries: [] },
  '임철우': { matched: ['KOLAA', '별도요청'], registries: [{ source: 'KOLAA' }], 별도요청: { 갈래: '산문' } },
  '이청준': { matched: ['KOLAA', '이용불가'], registries: [{ source: 'KOLAA' }], 이용불가: { 출처: '문학과지성사' } },
}

describe('normalizeAuthor', () => {
  it('괄호 주석을 떼고 공백을 제거한다', () => {
    expect(normalizeAuthor('김유정')).toBe('김유정')
    expect(normalizeAuthor('백 석')).toBe('백석')
    expect(normalizeAuthor('이상 (김해경)')).toBe('이상')
  })
  it('빈 값은 빈 문자열', () => {
    expect(normalizeAuthor('')).toBe('')
    expect(normalizeAuthor(null)).toBe('')
  })
})

describe('lookupCopyright', () => {
  it('정규화 키로 레코드를 찾는다', () => {
    expect(lookupCopyright('김소월', MAP)).toBe(MAP['김소월'])
    expect(lookupCopyright('임 철우', MAP)).toBe(MAP['임철우'])
  })
  it('미매칭은 null', () => {
    expect(lookupCopyright('알퐁스 도데', MAP)).toBe(null)
  })
})

describe('copyrightStatuses', () => {
  it('매칭된 소스를 모두 상태로 반환한다', () => {
    expect(copyrightStatuses(MAP['임철우']).map(s => s.key)).toEqual(['KOLAA', '별도요청'])
  })
  it('만료를 인식한다', () => {
    expect(copyrightStatuses(MAP['김소월']).map(s => s.key)).toEqual(['expired'])
  })
  it('전편 이용불가를 인식한다', () => {
    expect(copyrightStatuses(MAP['이청준']).map(s => s.key)).toEqual(['KOLAA', '이용불가'])
  })
  it('레코드 없거나 빈 matched는 미확인', () => {
    expect(copyrightStatuses(null).map(s => s.key)).toEqual(['미확인'])
    expect(copyrightStatuses({ matched: [] }).map(s => s.key)).toEqual(['미확인'])
  })
})

describe('buildAuthorList', () => {
  it('작가별로 묶고 편수 내림차순·이름 오름차순 정렬한다', () => {
    const list = buildAuthorList(WORKS, MAP)
    expect(list.map(a => a.name)).toEqual(['김소월', '이상'])
    expect(list[0].count).toBe(2)
    expect(list[0].works).toHaveLength(2)
  })
  it('각 작가에 저작권 레코드와 상태를 붙인다', () => {
    const list = buildAuthorList(WORKS, MAP)
    expect(list[0].statuses.map(s => s.key)).toEqual(['expired'])
    expect(list[1].statuses.map(s => s.key)).toEqual(['미확인'])
  })
})

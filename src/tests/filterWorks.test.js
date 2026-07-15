import { describe, it, expect } from 'vitest'
import { filterWorks, getUniqueValues } from '../utils/filterWorks'
import { buildDebutMap } from '../utils/debut'

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

describe('filterWorks - 첫 수록(debutOnly)', () => {
  const DEBUT_WORKS = [
    { 교육과정: '3차', 구분: '중등', 학년: '1', 장르: '소설', 작품명: '소나기', 지은이: '황순원', _authorBase: '황순원' },
    { 교육과정: '5차', 구분: '중등', 학년: '1', 장르: '소설', 작품명: '소나기', 지은이: '황순원', _authorBase: '황순원' },
    { 교육과정: '5차', 구분: '고등', 학년: '1', 장르: '소설', 작품명: '메밀꽃 필 무렵', 지은이: '이효석', _authorBase: '이효석' },
  ]
  const debutMap = buildDebutMap(DEBUT_WORKS)

  it('교육과정=5차 + 첫수록: 5차 데뷔 작품만 (소나기 제외, 메밀꽃만)', () => {
    const result = filterWorks(DEBUT_WORKS, { curriculum: ['5차'], debutOnly: true }, debutMap)
    expect(result).toHaveLength(1)
    expect(result[0]['작품명']).toBe('메밀꽃 필 무렵')
  })
  it('첫수록 꺼짐: 5차 행 모두 (소나기 5차 + 메밀꽃)', () => {
    const result = filterWorks(DEBUT_WORKS, { curriculum: ['5차'], debutOnly: false }, debutMap)
    expect(result).toHaveLength(2)
  })
  it('교육과정 미선택 + 첫수록: 무효(전체 반환)', () => {
    const result = filterWorks(DEBUT_WORKS, { debutOnly: true }, debutMap)
    expect(result).toHaveLength(3)
  })
  it('debutMap 미제공 시 첫수록 조건 무시(하위 호환)', () => {
    const result = filterWorks(DEBUT_WORKS, { curriculum: ['5차'], debutOnly: true })
    expect(result).toHaveLength(2)
  })
  it('다중 선택: 데뷔가 3·5차 중 하나인 작품의 선택 교육과정 내 행', () => {
    const result = filterWorks(DEBUT_WORKS, { curriculum: ['3차', '5차'], debutOnly: true }, debutMap)
    expect(result).toHaveLength(3)
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

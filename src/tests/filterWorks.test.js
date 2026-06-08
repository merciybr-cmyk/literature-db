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
  it('교육과정 필터', () => {
    const result = filterWorks(WORKS, { curriculum: '1차' })
    expect(result).toHaveLength(1)
    expect(result[0]['작품명']).toBe('산유화')
  })
  it('구분 필터', () => {
    expect(filterWorks(WORKS, { division: '고등' })).toHaveLength(1)
  })
  it('장르 필터', () => {
    expect(filterWorks(WORKS, { genre: '시' })).toHaveLength(2)
  })
  it('학년 필터', () => {
    expect(filterWorks(WORKS, { grade: '2' })).toHaveLength(1)
  })
  it('작품명 텍스트 검색 (부분 일치)', () => {
    expect(filterWorks(WORKS, { query: '산유' })).toHaveLength(1)
  })
  it('작가명 괄호 앞 기준 검색', () => {
    const result = filterWorks(WORKS, { query: '로버트 프로스트' })
    expect(result).toHaveLength(1)
    expect(result[0]['작품명']).toBe('가지 않은 길')
  })
  it('복합 필터', () => {
    expect(filterWorks(WORKS, { genre: '시', division: '중등' })).toHaveLength(2)
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

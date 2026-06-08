import { describe, it, expect } from 'vitest'
import { countByCurriculum, countByGenre, countByCurriculumAndGenre, topAuthors, topWorksAcrossCurricula } from '../utils/computeStats'

const WORKS = [
  { 교육과정: '1차', 장르: '시', 작품명: '산유화', _authorBase: '김소월' },
  { 교육과정: '1차', 장르: '소설', 작품명: '사냥', _authorBase: '이효석' },
  { 교육과정: '2차', 장르: '시', 작품명: '산유화', _authorBase: '김소월' },
  { 교육과정: '2차', 장르: '시', 작품명: '봄소식', _authorBase: '유치환' },
  { 교육과정: '3차', 장르: '소설', 작품명: '사냥', _authorBase: '이효석' },
]

describe('countByCurriculum', () => {
  it('교육과정별 개수 집계', () => {
    const result = countByCurriculum(WORKS)
    expect(result.find(r => r.name === '1차').count).toBe(2)
    expect(result.find(r => r.name === '2차').count).toBe(2)
    expect(result.find(r => r.name === '3차').count).toBe(1)
  })
  it('1차부터 순서대로 정렬', () => {
    const result = countByCurriculum(WORKS)
    expect(result[0].name).toBe('1차')
    expect(result[1].name).toBe('2차')
  })
})

describe('countByGenre', () => {
  it('장르별 개수 집계, 내림차순 정렬', () => {
    const result = countByGenre(WORKS)
    expect(result[0].name).toBe('시')
    expect(result[0].count).toBe(3)
    expect(result[1].name).toBe('소설')
    expect(result[1].count).toBe(2)
  })
})

describe('countByCurriculumAndGenre', () => {
  it('교육과정별 장르 분포 반환', () => {
    const result = countByCurriculumAndGenre(WORKS)
    const 차1 = result.find(r => r.name === '1차')
    expect(차1['시']).toBe(1)
    expect(차1['소설']).toBe(1)
  })
})

describe('topAuthors', () => {
  it('수록 횟수 기준 상위 작가 반환', () => {
    const result = topAuthors(WORKS, 3)
    expect(result[0].name).toBe('김소월')
    expect(result[0].count).toBe(2)
  })
  it('n개까지만 반환', () => {
    expect(topAuthors(WORKS, 2)).toHaveLength(2)
  })
})

describe('topWorksAcrossCurricula', () => {
  it('여러 교육과정에 걸친 작품 집계', () => {
    const result = topWorksAcrossCurricula(WORKS)
    const 산유화 = result.find(r => r.name === '산유화')
    expect(산유화.count).toBe(2)
  })
  it('1개 교육과정만 수록된 작품은 제외', () => {
    const result = topWorksAcrossCurricula(WORKS)
    expect(result.every(r => r.count > 1)).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { compareCurricula } from '../utils/compareCurricula'

const WORKS = [
  { 교육과정: '2009개정', 작품명: '메밀꽃 필 무렵', 장르: '소설', 지은이: '이효석', _authorBase: '이효석' },
  { 교육과정: '2015개정', 작품명: '산유화', 장르: '시', 지은이: '김소월', _authorBase: '김소월' },
  { 교육과정: '2015개정', 작품명: '메밀꽃 필 무렵', 장르: '소설', 지은이: '이효석', _authorBase: '이효석' },
  { 교육과정: '2015개정', 작품명: '산유화', 장르: '시', 지은이: '김소월', _authorBase: '김소월' }, // 중복 수록
  { 교육과정: '2022개정', 작품명: '산유화', 장르: '시', 지은이: '김소월', _authorBase: '김소월' },
  { 교육과정: '2022개정', 작품명: '진달래꽃', 장르: '시', 지은이: '김소월', _authorBase: '김소월' },
]

describe('compareCurricula', () => {
  it('단일 교육과정끼리 공통/A에만/B에만을 분류한다', () => {
    const { common, onlyA, onlyB } = compareCurricula(WORKS, ['2015개정'], ['2022개정'])
    expect(common.map(r => r.작품명)).toEqual(['산유화'])
    expect(onlyA.map(r => r.작품명)).toEqual(['메밀꽃 필 무렵'])
    expect(onlyB.map(r => r.작품명)).toEqual(['진달래꽃'])
  })

  it('여러 교육과정 합집합 vs 한 교육과정 비교', () => {
    // A=[2009,2015] 합집합: 메밀꽃, 산유화 / B=[2022]: 산유화, 진달래꽃
    const { common, onlyA, onlyB } = compareCurricula(WORKS, ['2009개정', '2015개정'], ['2022개정'])
    expect(common.map(r => r.작품명)).toEqual(['산유화'])
    expect(onlyA.map(r => r.작품명)).toEqual(['메밀꽃 필 무렵'])
    expect(onlyB.map(r => r.작품명)).toEqual(['진달래꽃'])
  })

  it('같은 작품의 중복 수록은 한 번만 센다', () => {
    const { common } = compareCurricula(WORKS, ['2015개정'], ['2022개정'])
    expect(common).toHaveLength(1)
  })

  it('문자열 단일 인자도 허용한다', () => {
    const { common } = compareCurricula(WORKS, '2015개정', '2022개정')
    expect(common.map(r => r.작품명)).toEqual(['산유화'])
  })

  it('한쪽이 비거나 양쪽 선택이 동일하면 빈 결과', () => {
    expect(compareCurricula(WORKS, ['2015개정'], ['2015개정'])).toEqual({ common: [], onlyA: [], onlyB: [] })
    expect(compareCurricula(WORKS, [], ['2022개정'])).toEqual({ common: [], onlyA: [], onlyB: [] })
  })
})

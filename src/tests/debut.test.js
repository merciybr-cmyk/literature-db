import { describe, it, expect } from 'vitest'
import { buildDebutMap } from '../utils/debut'

const WORKS = [
  { 교육과정: '5차', 작품명: '소나기', _authorBase: '황순원' },
  { 교육과정: '3차', 작품명: '소나기', _authorBase: '황순원' },
  { 교육과정: '7차', 작품명: '소나기', _authorBase: '황순원' },
  { 교육과정: '5차', 작품명: '메밀꽃 필 무렵', _authorBase: '이효석' },
]

describe('buildDebutMap', () => {
  it('여러 교육과정에 걸친 작품은 가장 이른 교육과정을 데뷔로 한다', () => {
    expect(buildDebutMap(WORKS).get('소나기__황순원')).toBe('3차')
  })
  it('단일 교육과정 작품은 그 교육과정이 데뷔', () => {
    expect(buildDebutMap(WORKS).get('메밀꽃 필 무렵__이효석')).toBe('5차')
  })
  it('CURRICULUM_ORDER에 없는 교육과정은 알려진 것보다 뒤로 취급', () => {
    const map = buildDebutMap([
      { 교육과정: '미래과정', 작품명: 'X', _authorBase: 'Y' },
      { 교육과정: '2015개정', 작품명: 'X', _authorBase: 'Y' },
    ])
    expect(map.get('X__Y')).toBe('2015개정')
  })
})

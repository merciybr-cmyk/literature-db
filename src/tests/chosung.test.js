import { describe, it, expect } from 'vitest'
import { toChosung, isChosungQuery } from '../utils/chosung'

describe('toChosung', () => {
  it('한글 음절을 초성으로 변환한다', () => {
    expect(toChosung('김소월')).toBe('ㄱㅅㅇ')
    expect(toChosung('운수 좋은 날')).toBe('ㅇㅅ ㅈㅇ ㄴ')
  })

  it('한글이 아닌 문자는 그대로 둔다', () => {
    expect(toChosung('Robert')).toBe('Robert')
    expect(toChosung('A형')).toBe('Aㅎ')
  })

  it('빈 값은 빈 문자열', () => {
    expect(toChosung('')).toBe('')
    expect(toChosung(null)).toBe('')
  })
})

describe('isChosungQuery', () => {
  it('초성으로만 이뤄지면 true', () => {
    expect(isChosungQuery('ㄱㅅㅇ')).toBe(true)
    expect(isChosungQuery('ㅇㅅ ㅈㅇ')).toBe(true)
  })

  it('일반 글자가 섞이면 false', () => {
    expect(isChosungQuery('김소월')).toBe(false)
    expect(isChosungQuery('ㄱ소월')).toBe(false)
    expect(isChosungQuery('abc')).toBe(false)
  })

  it('빈 값은 false', () => {
    expect(isChosungQuery('')).toBe(false)
    expect(isChosungQuery('   ')).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { extractAuthorBase, subjectOf, parseCSV } from '../utils/parseCSV'

describe('extractAuthorBase', () => {
  it('작가명만 있으면 그대로 반환', () => {
    expect(extractAuthorBase('김소월')).toBe('김소월')
  })
  it('괄호 안 번역자 정보 제거', () => {
    expect(extractAuthorBase('로버트 프로스트(피천득 옮김)')).toBe('로버트 프로스트')
  })
  it('한자 주해 포함도 제거', () => {
    expect(extractAuthorBase('김만중(김병국 주해)')).toBe('김만중')
  })
  it('빈 문자열 처리', () => {
    expect(extractAuthorBase('')).toBe('')
  })
})

describe('parseCSV', () => {
  const HEADER = '교육과정,구분,학년,학기,교과서명,장르,작품명,지은이'

  it('헤더와 데이터 행을 올바르게 파싱', () => {
    const csv = `${HEADER}\n1차,중등,1,1,중학 국어 1-1,소설,마지막 공부,알퐁스 도데`
    const result = parseCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0]['교육과정']).toBe('1차')
    expect(result[0]['작품명']).toBe('마지막 공부')
    expect(result[0]['지은이']).toBe('알퐁스 도데')
    expect(result[0]._authorBase).toBe('알퐁스 도데')
  })
  it('번역자 포함 작가명 _authorBase 정규화', () => {
    const csv = `${HEADER}\n3차,중등,1,1,교과서,시,가지 않은 길,로버트 프로스트(피천득 옮김)`
    const result = parseCSV(csv)
    expect(result[0]._authorBase).toBe('로버트 프로스트')
  })
  it('작품명 없는 행 제외', () => {
    const csv = `${HEADER}\n1차,중등,1,1,교과서,시,,김소월`
    const result = parseCSV(csv)
    expect(result).toHaveLength(0)
  })
  it('쉼표 포함 셀(따옴표 처리)', () => {
    const csv = `${HEADER}\n1차,중등,1,1,"국어, 상",시,산유화,김소월`
    const result = parseCSV(csv)
    expect(result[0]['교과서명']).toBe('국어, 상')
  })
})

describe('subjectOf', () => {
  it('교과서명에 문학 포함 → 문학', () => {
    expect(subjectOf({ 교과서명: '문학' })).toBe('문학')
    expect(subjectOf({ 교과서명: '문학Ⅰ' })).toBe('문학')
    expect(subjectOf({ 교과서명: '문학Ⅱ' })).toBe('문학')
  })
  it('그 외 교과서명 → 국어', () => {
    expect(subjectOf({ 교과서명: '중학 국어 1-1' })).toBe('국어')
    expect(subjectOf({ 교과서명: '공통국어1' })).toBe('국어')
    expect(subjectOf({ 교과서명: '국어 (상)' })).toBe('국어')
    expect(subjectOf({ 교과서명: '국어Ⅰ' })).toBe('국어')
  })
  it('교과서명 없으면 국어', () => {
    expect(subjectOf({})).toBe('국어')
  })
})

describe('parseCSV - _subject 파생', () => {
  const HEADER2 = '교육과정,구분,학년,학기,교과서명,장르,작품명,지은이'
  it('문학 교과서 행은 _subject = 문학', () => {
    const csv = `${HEADER2}\n7차,고등,1,1,문학,소설,메밀꽃 필 무렵,이효석`
    expect(parseCSV(csv)[0]._subject).toBe('문학')
  })
  it('국어 교과서 행은 _subject = 국어', () => {
    const csv = `${HEADER2}\n1차,중등,1,1,중학 국어 1-1,소설,마지막 공부,알퐁스 도데`
    expect(parseCSV(csv)[0]._subject).toBe('국어')
  })
})

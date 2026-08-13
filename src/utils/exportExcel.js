import * as XLSX from 'xlsx'
import { subjectOf } from './parseCSV'

export function exportToExcel(works, filename = '문학작품_검색결과.xlsx') {
  const rows = works.map(w => ({
    '교육과정': w['교육과정'],
    '구분': w['구분'],
    '과목': w._subject ?? subjectOf(w),
    '학년': w['학년'],
    '학기': w['학기'],
    '교과서명': w['교과서명'],
    '장르': w['장르'],
    '작품명': w['작품명'],
    '지은이': w['지은이'],
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '검색결과')
  XLSX.writeFile(wb, filename)
}

// 교육과정 비교 결과(작품명·지은이·장르만 있는 행)를 엑셀로 내보낸다.
export function exportComparisonToExcel(rows, filename = '교육과정비교.xlsx') {
  const data = rows.map(r => ({
    '작품명': r['작품명'],
    '지은이': r['지은이'] || '작가 미상',
    '장르': r['장르'],
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '비교결과')
  XLSX.writeFile(wb, filename)
}

import * as XLSX from 'xlsx'

export function exportToExcel(works, filename = '문학작품_검색결과.xlsx') {
  const rows = works.map(w => ({
    '교육과정': w['교육과정'],
    '구분': w['구분'],
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

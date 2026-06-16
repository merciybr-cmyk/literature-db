function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

import { toChosung } from './chosung.js'

export function extractAuthorBase(author) {
  if (!author) return ''
  return author.replace(/\(.*?\)/g, '').trim()
}

// 검색용 파생 필드(작가 기준명·초성)를 작품 객체에 부여한다.
export function withDerivedFields(work) {
  const authorBase = extractAuthorBase(work['지은이'])
  return {
    ...work,
    _authorBase: authorBase,
    _titleChosung: toChosung(work['작품명']),
    _authorChosung: toChosung(authorBase),
  }
}

export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  const headers = parseCSVLine(lines[0])

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const work = {}
    headers.forEach((header, i) => {
      work[header] = values[i] || ''
    })
    return withDerivedFields(work)
  }).filter(w => w['작품명'])
}

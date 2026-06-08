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

export function extractAuthorBase(author) {
  if (!author) return ''
  return author.replace(/\(.*?\)/g, '').trim()
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
    work._authorBase = extractAuthorBase(work['지은이'])
    return work
  }).filter(w => w['작품명'])
}

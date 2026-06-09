export function filterWorks(works, { curriculum = [], division = [], genre = [], grade = [], query = '' } = {}) {
  return works.filter(work => {
    if (curriculum.length && !curriculum.includes(work['교육과정'])) return false
    if (division.length && !division.includes(work['구분'])) return false
    if (genre.length && !genre.includes(work['장르'])) return false
    if (grade.length && !grade.includes(work['학년'])) return false
    if (query) {
      const q = query.toLowerCase()
      if (!work['작품명'].toLowerCase().includes(q) && !(work._authorBase ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })
}

export function getUniqueValues(works, field) {
  return [...new Set(works.map(w => w[field]).filter(Boolean))].sort()
}

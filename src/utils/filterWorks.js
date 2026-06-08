export function filterWorks(works, { curriculum = '', division = '', genre = '', grade = '', query = '' } = {}) {
  return works.filter(work => {
    if (curriculum && work['교육과정'] !== curriculum) return false
    if (division && work['구분'] !== division) return false
    if (genre && work['장르'] !== genre) return false
    if (grade && work['학년'] !== grade) return false
    if (query) {
      const q = query.toLowerCase()
      const titleMatch = work['작품명'].toLowerCase().includes(q)
      const authorMatch = work._authorBase.toLowerCase().includes(q)
      if (!titleMatch && !authorMatch) return false
    }
    return true
  })
}

export function getUniqueValues(works, field) {
  return [...new Set(works.map(w => w[field]).filter(Boolean))].sort()
}

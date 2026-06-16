import { toChosung, isChosungQuery } from './chosung'

export function filterWorks(works, { curriculum = [], division = [], genre = [], grade = [], system = [], publisher = [], query = '' } = {}) {
  const trimmedQuery = query.trim()
  const chosungMode = isChosungQuery(trimmedQuery)
  const q = trimmedQuery.toLowerCase()
  const cq = trimmedQuery.replace(/\s/g, '')

  return works.filter(work => {
    if (curriculum.length && !curriculum.includes(work['교육과정'])) return false
    if (division.length && !division.includes(work['구분'])) return false
    if (genre.length && !genre.includes(work['장르'])) return false
    if (grade.length && !grade.includes(work['학년'])) return false
    if (system.length && !system.includes(work['체제'])) return false
    if (publisher.length && !publisher.includes(work['출판사'])) return false
    if (trimmedQuery) {
      if (chosungMode) {
        const titleCho = work._titleChosung ?? toChosung(work['작품명'])
        const authorCho = work._authorChosung ?? toChosung(work._authorBase ?? '')
        if (!titleCho.includes(cq) && !authorCho.includes(cq)) return false
      } else if (!work['작품명'].toLowerCase().includes(q) && !(work._authorBase ?? '').toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })
}

export function getUniqueValues(works, field) {
  return [...new Set(works.map(w => w[field]).filter(Boolean))].sort()
}

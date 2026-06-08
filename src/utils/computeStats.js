const CURRICULUM_ORDER = ['1차', '2차', '3차', '4차', '5차', '6차', '7차']
const ALL_GENRES = ['시', '소설', '수필', '시조', '고전산문', '고전운문', '극본']

export function countByCurriculum(works) {
  const counts = {}
  works.forEach(w => {
    if (w['교육과정']) counts[w['교육과정']] = (counts[w['교육과정']] || 0) + 1
  })
  return CURRICULUM_ORDER.filter(c => counts[c]).map(c => ({ name: c, count: counts[c] }))
}

export function countByGenre(works) {
  const counts = {}
  works.forEach(w => {
    if (w['장르']) counts[w['장르']] = (counts[w['장르']] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function countByCurriculumAndGenre(works) {
  const map = {}
  works.forEach(w => {
    const c = w['교육과정']
    const g = w['장르']
    if (!c || !g) return
    if (!map[c]) map[c] = {}
    map[c][g] = (map[c][g] || 0) + 1
  })
  return CURRICULUM_ORDER.filter(c => map[c]).map(c => ({
    name: c,
    ...Object.fromEntries(ALL_GENRES.map(g => [g, map[c][g] || 0])),
  }))
}

export function topAuthors(works, n = 10) {
  const counts = {}
  works.forEach(w => {
    const a = w._authorBase
    if (a) counts[a] = (counts[a] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

export function topWorksAcrossCurricula(works, n = 10) {
  const map = {}
  works.forEach(w => {
    const key = `${w['작품명']}__${w._authorBase}`
    if (!map[key]) map[key] = { name: w['작품명'], author: w._authorBase, curricula: new Set() }
    if (w['교육과정']) map[key].curricula.add(w['교육과정'])
  })
  return Object.values(map)
    .map(({ name, author, curricula }) => ({ name, author, count: curricula.size }))
    .filter(w => w.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

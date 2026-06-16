import { GENRES as ALL_GENRES, orderCurricula } from '../constants'

export function countByCurriculum(works) {
  const counts = {}
  works.forEach(w => {
    if (w['교육과정']) counts[w['교육과정']] = (counts[w['교육과정']] || 0) + 1
  })
  return orderCurricula(new Set(Object.keys(counts))).map(c => ({ name: c, count: counts[c] }))
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
  return orderCurricula(new Set(Object.keys(map))).map(c => ({
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

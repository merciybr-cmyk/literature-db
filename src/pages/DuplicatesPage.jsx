import { useMemo, useState } from 'react'
import WorkDetailModal from '../components/search/WorkDetailModal'
import { GENRES, orderCurricula } from '../constants'

export default function DuplicatesPage({ works }) {
  const [selectedWork, setSelectedWork] = useState(null)
  const [focusCurriculum, setFocusCurriculum] = useState('')
  const [activeGenre, setActiveGenre] = useState('')

  const allRows = useMemo(() => {
    const map = {}
    works.forEach(w => {
      const key = `${w['작품명']}__${w._authorBase}`
      if (!map[key]) map[key] = { 작품명: w['작품명'], 지은이: w['지은이'], _authorBase: w._authorBase, 장르: w['장르'], curricula: new Set(), count: 0 }
      if (w['교육과정']) map[key].curricula.add(w['교육과정'])
      map[key].count += 1
    })
    return Object.values(map)
      .filter(r => r.curricula.size > 1)
      .sort((a, b) => b.curricula.size - a.curricula.size || b.count - a.count)
      .map(r => ({
        ...r,
        curriculaList: orderCurricula(r.curricula),
        curriculaCount: r.curricula.size,
      }))
  }, [works])

  const genreCounts = useMemo(() => {
    const counts = {}
    allRows.forEach(r => { counts[r.장르] = (counts[r.장르] || 0) + 1 })
    return counts
  }, [allRows])

  const rows = activeGenre ? allRows.filter(r => r.장르 === activeGenre) : allRows

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-800">중복 수록 작품 목록</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            2개 이상의 교육과정에 수록된 작품 · 교육과정 수 내림차순 ·{' '}
            총 <strong>{rows.length}</strong>편
            {activeGenre && ` (전체 ${allRows.length}편 중)`}
          </p>
        </div>

        {/* 장르 필터 버튼 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveGenre('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeGenre === ''
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체 ({allRows.length})
          </button>
          {GENRES.filter(g => genreCounts[g]).map(g => (
            <button
              key={g}
              onClick={() => setActiveGenre(g === activeGenre ? '' : g)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeGenre === g
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {g} ({genreCounts[g]})
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-100 border-b border-sky-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800 w-8">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800">작품명</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800">지은이</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800">장르</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-sky-800 w-20 whitespace-nowrap">교육과정 수</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800">수록 교육과정</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-sky-800 w-16 whitespace-nowrap">총 수록</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-2 max-w-[14rem]">
                    <button
                      onClick={() => setSelectedWork(row)}
                      title={row.작품명}
                      className="text-blue-600 hover:underline font-medium text-left truncate block w-full"
                    >
                      {row.작품명}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-gray-600 max-w-[9rem] truncate" title={row.지은이}>{row.지은이}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.장르}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      row.curriculaCount >= 5 ? 'bg-blue-100 text-blue-700' :
                      row.curriculaCount >= 3 ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {row.curriculaCount}개
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-nowrap gap-1 whitespace-nowrap">
                      {row.curriculaList.map(c => (
                        <button
                          key={c}
                          onClick={() => { setFocusCurriculum(c); setSelectedWork(row) }}
                          title={`${c} 수록 교과서 보기`}
                          className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100 hover:bg-blue-100 cursor-pointer"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-500">{row.count}회</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {selectedWork && (
        <WorkDetailModal
          work={{ 작품명: selectedWork.작품명, 지은이: selectedWork.지은이, 장르: selectedWork.장르, _authorBase: selectedWork._authorBase }}
          allWorks={works}
          focusCurriculum={focusCurriculum}
          onClose={() => { setSelectedWork(null); setFocusCurriculum('') }}
        />
      )}
    </>
  )
}

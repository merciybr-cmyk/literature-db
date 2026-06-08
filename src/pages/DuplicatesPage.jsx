import { useMemo, useState } from 'react'
import { topWorksAcrossCurricula } from '../utils/computeStats'
import WorkDetailModal from '../components/search/WorkDetailModal'

const CURRICULUM_ORDER = ['1차', '2차', '3차', '4차', '5차', '6차', '7차']

export default function DuplicatesPage({ works }) {
  const [selectedWork, setSelectedWork] = useState(null)

  const rows = useMemo(() => {
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
        curriculaList: CURRICULUM_ORDER.filter(c => r.curricula.has(c)),
        curriculaCount: r.curricula.size,
      }))
  }, [works])

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">중복 수록 작품 목록</h2>
            <p className="text-sm text-gray-500 mt-0.5">2개 이상의 교육과정에 수록된 작품 · 교육과정 수 내림차순 · 총 <strong>{rows.length}</strong>편</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-8">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">작품명</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">지은이</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">장르</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 w-20">교육과정 수</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">수록 교육과정</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 w-16">총 수록</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setSelectedWork(row)}
                      className="text-blue-600 hover:underline font-medium text-left"
                    >
                      {row.작품명}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.지은이}</td>
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
                    <div className="flex flex-wrap gap-1">
                      {row.curriculaList.map(c => (
                        <span key={c} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100">{c}</span>
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
          onClose={() => setSelectedWork(null)}
        />
      )}
    </>
  )
}

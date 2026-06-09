import { useState, useEffect, useMemo } from 'react'
import WorkDetailModal from './WorkDetailModal'

const COLUMNS = [
  { key: '교육과정', label: '교육과정' },
  { key: '구분', label: '구분' },
  { key: '학년', label: '학년' },
  { key: '학기', label: '학기' },
  { key: '교과서명', label: '교과서명' },
  { key: '장르', label: '장르' },
  { key: '작품명', label: '작품명' },
  { key: '지은이', label: '지은이' },
]

const PAGE_SIZE = 20

export default function WorksTable({ works, allWorks, selectedCurricula = [] }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [selectedWork, setSelectedWork] = useState(null)

  useEffect(() => { setPage(1) }, [works])

  const duplicateMap = useMemo(() => {
    if (selectedCurricula.length < 2) return new Map()
    const map = new Map()
    for (const work of works) {
      const title = work['작품명']
      if (!map.has(title)) map.set(title, new Set())
      map.get(title).add(work['교육과정'])
    }
    for (const [title, curricula] of map) {
      if (curricula.size < 2) map.delete(title)
    }
    return map
  }, [works, selectedCurricula])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const sorted = sortKey
    ? [...works].sort((a, b) => {
        const cmp = (a[sortKey] || '').localeCompare(b[sortKey] || '', 'ko')
        return sortDir === 'asc' ? cmp : -cmp
      })
    : works

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageWorks = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageNumbers = () => {
    const range = []
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      range.push(i)
    }
    return range
  }

  if (works.length === 0) {
    return <p className="text-center text-gray-400 py-12 text-sm">검색 결과가 없습니다.</p>
  }

  return (
    <>
      <div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-100 whitespace-nowrap select-none"
                  >
                    {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageWorks.map((work, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  {COLUMNS.map(col => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-gray-700 whitespace-nowrap ${
                        col.key === '작품명'
                          ? 'text-blue-600 cursor-pointer hover:underline font-medium'
                          : ''
                      }`}
                      onClick={col.key === '작품명' ? () => setSelectedWork(work) : undefined}
                    >
                      {col.key === '작품명' && duplicateMap.has(work['작품명']) ? (
                        <>
                          {work[col.key]}
                          <span className="ml-1.5 inline-flex gap-0.5">
                            {[...duplicateMap.get(work['작품명'])].map(c => (
                              <span key={c} className="text-xs bg-amber-100 text-amber-700 px-1 rounded font-normal">
                                {c}
                              </span>
                            ))}
                          </span>
                        </>
                      ) : work[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">‹</button>
            {page > 3 && <span className="px-1 text-gray-400 text-sm">…</span>}
            {pageNumbers().map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 text-sm border rounded ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>{p}</button>
            ))}
            {page < totalPages - 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">›</button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2 text-right">작품명 클릭 시 교육과정별 수록 현황 확인</p>
      </div>

      {selectedWork && (
        <WorkDetailModal
          work={selectedWork}
          allWorks={allWorks}
          onClose={() => setSelectedWork(null)}
        />
      )}
    </>
  )
}

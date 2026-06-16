import { useState, useEffect, useMemo } from 'react'
import WorkDetailModal from './WorkDetailModal'
import { CURRICULUM_ORDER } from '../../constants'

const curriculumRank = c => {
  const i = CURRICULUM_ORDER.indexOf(c)
  return i === -1 ? CURRICULUM_ORDER.length : i
}

const COLUMNS = [
  { key: '교육과정', label: '교육과정' },
  { key: '체제', label: '체제' },
  { key: '구분', label: '구분' },
  { key: '장르', label: '장르' },
  { key: '작품명', label: '작품명' },
  { key: '지은이', label: '지은이' },
  { key: '교과서명', label: '교과서명' },
  { key: '출판사', label: '출판사' },
]

const PAGE_SIZES = [20, 50, 100]

export default function WorksTable({ works, allWorks, selectedCurricula = [] }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
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

  const sorted = useMemo(() => {
    const arr = [...works]
    // 기본 정렬: 교육과정 순
    if (!sortKey) {
      return arr.sort((a, b) => curriculumRank(a['교육과정']) - curriculumRank(b['교육과정']))
    }
    const dir = sortDir === 'asc' ? 1 : -1
    // 교육과정 컬럼은 가나다순이 아니라 교육과정 순서로 정렬
    if (sortKey === '교육과정') {
      return arr.sort((a, b) => dir * (curriculumRank(a['교육과정']) - curriculumRank(b['교육과정'])))
    }
    return arr.sort((a, b) => dir * (a[sortKey] || '').localeCompare(b[sortKey] || '', 'ko'))
  }, [works, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageWorks = sorted.slice((page - 1) * pageSize, page * pageSize)

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
        {/* 데스크톱: 표 */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-sky-100 border-b border-sky-200">
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800 cursor-pointer hover:bg-sky-200 whitespace-nowrap select-none"
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

        {/* 모바일: 카드 */}
        <div className="md:hidden flex flex-col gap-2">
          {pageWorks.map((work, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-3">
              <button
                onClick={() => setSelectedWork(work)}
                className="text-blue-600 font-medium hover:underline text-left"
              >
                {work['작품명']}
              </button>
              {duplicateMap.has(work['작품명']) && (
                <span className="ml-1.5 inline-flex gap-0.5 align-middle">
                  {[...duplicateMap.get(work['작품명'])].map(c => (
                    <span key={c} className="text-xs bg-amber-100 text-amber-700 px-1 rounded">{c}</span>
                  ))}
                </span>
              )}
              <p className="text-sm text-gray-600 mt-0.5">
                {work['지은이'] || '작가 미상'} · {work['장르']}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs text-gray-500">
                <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-100">{work['교육과정']}</span>
                {work['교과서명'] && <span>{work['교과서명']}</span>}
                {work['출판사'] && <span>· {work['출판사']}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}개씩</option>)}
          </select>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">‹</button>
              {page > 3 && <span className="px-1 text-gray-400 text-sm">…</span>}
              {pageNumbers().map(p => (
                <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 text-sm border rounded ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>{p}</button>
              ))}
              {page < totalPages - 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">›</button>
            </div>
          )}
          <div className="w-20" />
        </div>

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

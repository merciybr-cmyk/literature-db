import { useMemo, useState } from 'react'
import { getUniqueValues } from '../utils/filterWorks'
import { orderCurricula } from '../constants'
import { compareCurricula } from '../utils/compareCurricula'
import MultiSelectDropdown from '../components/search/MultiSelectDropdown'
import WorkDetailModal from '../components/search/WorkDetailModal'

function groupLabel(set) {
  if (set.length === 0) return '미선택'
  if (set.length <= 2) return set.join(', ')
  return `${set.slice(0, 2).join(', ')} 외 ${set.length - 2}`
}

export default function ComparePage({ works }) {
  const curricula = useMemo(() => orderCurricula(getUniqueValues(works, '교육과정')), [works])
  // 기본값: 가장 최근 두 교육과정 비교
  const [aSet, setASet] = useState(() => curricula.length >= 2 ? [curricula[curricula.length - 2]] : [])
  const [bSet, setBSet] = useState(() => curricula.length >= 2 ? [curricula[curricula.length - 1]] : [])
  const [tab, setTab] = useState('onlyB')
  const [viewMode, setViewMode] = useState('list') // list | genre | author
  const [selectedWork, setSelectedWork] = useState(null)

  const { common, onlyA, onlyB } = useMemo(() => compareCurricula(works, aSet, bSet), [works, aSet, bSet])

  const TABS = [
    { key: 'common', label: '공통', rows: common },
    { key: 'onlyA', label: `${groupLabel(aSet)}에만`, rows: onlyA },
    { key: 'onlyB', label: `${groupLabel(bSet)}에만`, rows: onlyB },
  ]
  const activeRows = useMemo(() => {
    if (tab === 'common') return common
    if (tab === 'onlyA') return onlyA
    return onlyB
  }, [tab, common, onlyA, onlyB])

  const groups = useMemo(() => {
    if (viewMode === 'list') return null
    const keyFn = viewMode === 'genre'
      ? r => r.장르 || '기타'
      : r => r._authorBase || '작가 미상'
    const map = new Map()
    for (const r of activeRows) {
      const k = keyFn(r)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(r)
    }
    return [...map.entries()].sort((x, y) => y[1].length - x[1].length || x[0].localeCompare(y[0], 'ko'))
  }, [activeRows, viewMode])

  const VIEW_MODES = [
    { key: 'list', label: '목록' },
    { key: 'genre', label: '갈래별' },
    { key: 'author', label: '작가별' },
  ]

  function swap() {
    setASet(bSet)
    setBSet(aSet)
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">교육과정 간 작품 비교</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            각 변에 교육과정을 여러 개 고를 수 있습니다 (합집합 기준). 공통·신규·빠진 작품을 비교합니다.
          </p>
        </div>

        {/* 교육과정 집합 선택 */}
        <div className="flex flex-wrap items-end gap-3 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">기준 A (여러 개 선택 가능)</label>
            <MultiSelectDropdown options={curricula} value={aSet} onChange={setASet} />
          </div>
          <button onClick={swap} title="A↔B 교체" className="px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">⇄</button>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">비교 B (여러 개 선택 가능)</label>
            <MultiSelectDropdown options={curricula} value={bSet} onChange={setBSet} />
          </div>
        </div>

        {/* 요약 탭 */}
        <div className="grid grid-cols-3 gap-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg border p-3 text-center transition-colors ${
                tab === t.key ? 'border-sky-400 bg-sky-50' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-xs text-gray-500 truncate" title={t.label}>{t.label}</div>
              <div className="text-xl font-bold text-gray-800 mt-0.5">{t.rows.length}</div>
            </button>
          ))}
        </div>

        {/* 보기 방식 전환 */}
        <div className="flex items-center gap-1">
          {VIEW_MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setViewMode(m.key)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                viewMode === m.key
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {activeRows.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">해당하는 작품이 없습니다.</p>
        ) : viewMode === 'list' ? (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sky-100 border-b border-sky-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800 w-8">#</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800">작품명</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800">지은이</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-sky-800">장르</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeRows.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50 transition-colors">
                    <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => setSelectedWork(row)} className="text-blue-600 hover:underline font-medium text-left">
                        {row.작품명}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{row.지은이 || '작가 미상'}</td>
                    <td className="px-3 py-2 text-gray-500">{row.장르}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map(([name, items]) => (
              <div key={name} className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between bg-sky-50 px-3 py-2 border-b border-sky-100">
                  <span className="text-sm font-semibold text-sky-800">{name}</span>
                  <span className="text-xs text-sky-600">{items.length}편</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {items.map((row, i) => (
                    <li key={i} className="px-3 py-2 hover:bg-blue-50">
                      <button onClick={() => setSelectedWork(row)} className="text-blue-600 hover:underline font-medium text-left">
                        {row.작품명}
                      </button>
                      <span className="text-gray-500 text-xs ml-2">
                        {viewMode === 'genre' ? (row.지은이 || '작가 미상') : row.장르}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedWork && (
        <WorkDetailModal
          work={selectedWork}
          allWorks={works}
          onClose={() => setSelectedWork(null)}
        />
      )}
    </>
  )
}

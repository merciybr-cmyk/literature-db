import { useMemo, useState } from 'react'
import { getUniqueValues } from '../../utils/filterWorks'
import { GENRES, DIVISIONS, SUBJECTS, orderCurricula } from '../../constants'
import MultiSelectDropdown from './MultiSelectDropdown'

export default function FilterPanel({ works, filters, onChange }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const curricula = useMemo(
    () => orderCurricula(getUniqueValues(works, '교육과정')),
    [works]
  )
  const grades = useMemo(
    () => getUniqueValues(works, '학년').filter(g => g !== 'X'),
    [works]
  )
  const systems = useMemo(() => getUniqueValues(works, '체제'), [works])
  const publishers = useMemo(() => getUniqueValues(works, '출판사'), [works])

  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  const FILTER_CONFIGS = [
    { key: 'curriculum', label: '교육과정', options: curricula },
    { key: 'system', label: '체제', options: systems },
    { key: 'division', label: '학교급', options: DIVISIONS },
    { key: 'subject', label: '과목', options: SUBJECTS },
    { key: 'genre', label: '장르', options: GENRES },
    { key: 'grade', label: '학년', options: grades },
    { key: 'publisher', label: '출판사', options: publishers, panelClassName: 'w-max' },
  ]

  const activeCount = FILTER_CONFIGS.reduce((n, { key }) => n + (filters[key]?.length || 0), 0)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* 모바일: 필터 접기 토글 */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        className="md:hidden flex items-center justify-between w-full text-sm font-medium text-gray-700"
      >
        <span>필터{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        <span className="text-gray-400">{mobileOpen ? '▲' : '▼'}</span>
      </button>
      <div className={`${mobileOpen ? 'flex' : 'hidden'} md:flex flex-wrap gap-4 mt-3 md:mt-0`}>
        {FILTER_CONFIGS.map(({ key, label, options, panelClassName }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            <MultiSelectDropdown
              options={options}
              value={filters[key] || []}
              onChange={v => update(key, v)}
              panelClassName={panelClassName}
            />
          </div>
        ))}
        <div className="flex flex-col justify-end gap-1">
          <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.debutOnly || false}
              onChange={e => update('debutOnly', e.target.checked)}
              className="rounded border-gray-300"
            />
            첫 수록
          </label>
          {filters.debutOnly && !(filters.curriculum?.length) && (
            <span className="text-xs text-amber-600">교육과정을 먼저 선택하세요</span>
          )}
        </div>
      </div>
    </div>
  )
}
